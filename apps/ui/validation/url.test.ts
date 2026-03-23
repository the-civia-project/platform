import { describe, expect, it } from "vitest";
import { isLocalHostname, validateUrl } from "./url";
import { firstMessage } from "./_test-utils";

describe("validateUrl", () => {
  it("returns a ZodError for an empty string (no longer special-cased)", () => {
    const result = validateUrl("");
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });

  it.each([
    "https://example.com",
    "https://example.com/path?query=1#hash",
    "https://sub.example.io:8443/path",

    // Subdomains (single label) and sub-subdomains (multi-label).
    "https://www.example.com",
    "https://api.example.com",
    "https://api.v2.example.com",
    "https://a.b.c.example.com",
    "https://very.deeply.nested.sub.domain.example.co.uk",

    // Paths: root, single segment, deep, file extension, leading dot,
    // percent-encoded, and characters that the parser must keep verbatim.
    "https://example.com/",
    "https://example.com/users",
    "https://example.com/users/42/posts/7/comments",
    "https://example.com/files/archive.tar.gz",
    "https://example.com/.well-known/openid-configuration",
    "https://example.com/path%20with%20spaces",
    "https://example.com/~user/profile",
    "https://example.com/a/b/c/(d)/e",

    // Query strings: single param, multiple params, flag-style (no value),
    // empty value, percent-encoded, URL-encoded JSON, and PHP-style arrays.
    "https://example.com?q=hello",
    "https://example.com?q=hello&lang=en",
    "https://example.com/search?flag&empty=&q=hi",
    "https://example.com/search?q=hello%20world&lang=en&page=2",
    "https://example.com/api?json=%7B%22key%22%3A%22value%22%7D",
    "https://example.com/?tags[]=a&tags[]=b",

    // Fragments: simple anchor, dotted/sectioned, percent-encoded, and SPA
    // hash-routes that themselves carry a query string.
    "https://example.com#top",
    "https://example.com/docs#section-1.2.3",
    "https://example.com/page#hash%20with%20space",
    "https://example.com/#/spa/route?embedded=1",

    // Kitchen sink: subdomain + port + deep path + complex query + fragment.
    "https://api.v2.example.com:8443/users/42/posts?expand=author,comments&since=2024-01-01T00:00:00Z#section-3",
  ])("accepts a valid https URL: %s", (value) => {
    expect(validateUrl(value)).toBe(true);
  });

  it.each([
    "http://localhost",
    "http://localhost:3000",
    "http://0.0.0.0",
    "http://127.0.0.1",
    "http://127.5.5.5/path",
    "http://10.0.0.5",
    "http://172.16.5.5",
    "http://172.31.255.255",
    "http://192.168.1.1",
    "http://my-mac.local",
    "http://foo.localhost",
    "http://[::1]",
    "http://[fe80::1]",
    "http://[fc00::1]",
    "http://[fd12::]",
  ])("accepts http for local/private host: %s", (value) => {
    expect(validateUrl(value)).toBe(true);
  });

  it.each([
    // Public domains: bare, with port / path / query / hash, deep subdomains.
    "http://example.com",
    "http://example.com:8080",
    "http://www.example.com/path",
    "http://api.v2.example.com/v1?token=abc",
    "http://example.com#anchor",
    "http://very.deeply.nested.example.co.uk/page",

    // Public IPv4 literals -- real allocations and reserved-but-not-local
    // ranges that the kit treats as public (RFC 5737 documentation, plus
    // common public DNS / search IPs).
    "http://8.8.8.8",
    "http://1.1.1.1",
    "http://74.125.224.72",
    "http://203.0.113.10",
    "http://8.8.8.8:8080/path?q=hello#hash",

    // Public IPv6 literals (bracketed per URI syntax). 2001:db8::/32 is the
    // RFC 3849 documentation range -- reserved but never in the kit's
    // local/private lists, so it's public for our purposes.
    "http://[2001:db8::1]",
    "http://[2606:4700:4700::1111]",
    "http://[2001:4860:4860::8888]",
    "http://[2001:db8::1]:8080/path",

    // Near-miss IPv4 -- one octet outside each loopback/private range.
    // These exist specifically to catch regex off-by-ones in PRIVATE_V4 /
    // LOOPBACK_V4.
    "http://126.255.255.255", // one below 127.0.0.0/8 loopback
    "http://128.0.0.0", // one above 127.255.255.255
    "http://9.255.255.255", // one below 10.0.0.0/8
    "http://11.0.0.0", // one above 10.255.255.255
    "http://172.15.255.255", // one below 172.16.0.0/12
    "http://172.32.0.0", // one above 172.31.255.255
    "http://192.167.255.255", // one below 192.168.0.0/16
    "http://192.169.0.0", // one above 192.168.255.255

    // Near-miss IPv6 -- outside fe80::/10 (link-local is fe80-febf) and
    // outside fc00::/7 (unique-local is fc00-fdff).
    "http://[fec0::1]", // one block above fe80::/10
    "http://[fe00::1]", // one block below fe80::/10
    "http://[fb00::1]", // one block below fc00::/7

    // Case insensitivity: WHATWG URL lowercases hostnames before we see
    // them, so an uppercase public host still hits the public-http branch.
    "http://EXAMPLE.COM",

    // Hostnames that mention "localhost" or "local" as a label but don't
    // suffix-match the local rules -- these are real public DNS names.
    "http://localhost.com", // bare "localhost" only matches as full host
    "http://localhosts.com", // not the reserved label
    "http://my.localhost.example.com", // ".localhost" is mid-domain, not suffix
    "http://example.local.com", // ".local" is mid-domain, not suffix
  ])("rejects http for public host %s with the public-http message", (value) => {
    const message = firstMessage(validateUrl(value));
    expect(message).toMatch(/http:\/\/ is only allowed for localhost/);
  });

  describe("non-HTTP(S) URIs", () => {
    // Dedicated, individually-named tests for the headline schemes --
    // security vectors, local-filesystem access, and common "wrong
    // tool" confusions. Each verifies three contracts:
    //   1. The validator returns a ZodError (not `true`).
    //   2. The message names the specific scheme that was rejected.
    //   3. The message points the user at the supported alternative
    //      (`https://`), so they're not left guessing.
    //
    // These exist *in addition* to the breadth `it.each` below, so a
    // failure points at intent ("the XSS guard broke") rather than at
    // "one of 23 schemes broke." The few cases of overlap are
    // deliberate: the breadth list checks the message-shape invariant
    // uniformly, the dedicated tests check the per-scheme reason.

    it("rejects javascript: URIs to defend against XSS payloads", () => {
      const result = validateUrl("javascript:alert(document.cookie)");
      expect(result).not.toBe(true);
      const message = firstMessage(result);
      expect(message).toMatch(/Unsupported protocol "javascript:\/\/"/);
      expect(message).toMatch(/use https:\/\//);
    });

    it("rejects data: URIs to defend against HTML/SVG payload smuggling", () => {
      const result = validateUrl(
        "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      );
      expect(result).not.toBe(true);
      const message = firstMessage(result);
      expect(message).toMatch(/Unsupported protocol "data:\/\/"/);
      expect(message).toMatch(/use https:\/\//);
    });

    it("rejects file: URIs so web inputs can't reach the local filesystem", () => {
      const result = validateUrl("file:///etc/passwd");
      expect(result).not.toBe(true);
      const message = firstMessage(result);
      expect(message).toMatch(/Unsupported protocol "file:\/\/"/);
      expect(message).toMatch(/use https:\/\//);
    });

    it("rejects mailto: URIs (valid URI, wrong validator -- use the email schema instead)", () => {
      const result = validateUrl("mailto:user@example.com");
      expect(result).not.toBe(true);
      const message = firstMessage(result);
      expect(message).toMatch(/Unsupported protocol "mailto:\/\/"/);
      expect(message).toMatch(/use https:\/\//);
    });

    it("rejects ftp: URIs because plaintext transfer is no longer acceptable", () => {
      const result = validateUrl("ftp://example.com/file.zip");
      expect(result).not.toBe(true);
      const message = firstMessage(result);
      expect(message).toMatch(/Unsupported protocol "ftp:\/\/"/);
      expect(message).toMatch(/use https:\/\//);
    });

    // Breadth coverage: every other valid-URI-but-not-HTTP(S) scheme
    // we've enumerated. The headline schemes above also appear here so
    // the table reads as a complete enumeration; the dedicated tests
    // carry the per-scheme reasoning, this block enforces uniform
    // message shape.
    it.each([
      // File-transfer family: plaintext FTP and its secure variants.
      ["ftp://example.com", "ftp"],
      ["ftps://example.com", "ftps"],
      ["sftp://user@example.com/path", "sftp"],
      ["scp://user@example.com/path", "scp"],

      // Local filesystem access.
      ["file:///etc/hosts", "file"],

      // Remote shell and source control over the network.
      ["ssh://user@example.com", "ssh"],
      ["git://github.com/owner/repo.git", "git"],

      // WebSocket schemes -- valid URIs, but a different protocol
      // surface. Consumers that need to validate WS endpoints should
      // do so with a dedicated schema, not by sneaking ws:// through
      // the URL validator.
      ["ws://example.com/socket", "ws"],
      ["wss://example.com/socket", "wss"],

      // Communication schemes that don't use "//". The message
      // template's trailing "//" is a fixed cosmetic; the protocol
      // token is what identifies the rejection.
      ["mailto:user@example.com", "mailto"],
      ["tel:+1234567890", "tel"],
      ["sms:+1234567890", "sms"],

      // Directory, chat, and legacy schemes.
      ["ldap://ldap.example.com/dc=example", "ldap"],
      ["ldaps://ldap.example.com/dc=example", "ldaps"],
      ["xmpp:user@example.com", "xmpp"],
      ["irc://chat.example.com/channel", "irc"],
      ["gopher://example.com", "gopher"],

      // Browser-internal and app deep-link schemes. Realistic
      // rejections when users paste from address bars or share sheets.
      ["about:blank", "about"],
      ["chrome://settings", "chrome"],
      ["vscode://file/Users/me/proj", "vscode"],
      ["tg://resolve?domain=test", "tg"],

      // Security-critical XSS vectors -- backstop for the dedicated
      // tests above. Anyone widening the allowlist to "everything
      // that new URL accepts" will fail these and learn why.
      ["javascript:alert(1)", "javascript"],
      ["data:text/plain;base64,SGVsbG8=", "data"],
      ["magnet:?xt=urn:btih:abc123", "magnet"],
    ])(
      "rejects unsupported protocol %s and names %s in the message",
      (value, protocol) => {
        const message = firstMessage(validateUrl(value));
        expect(message).toMatch(
          new RegExp(`Unsupported protocol "${protocol}://"`),
        );
      },
    );
  });

  it("rejects malformed strings with the scheme-hint message", () => {
    const message = firstMessage(validateUrl("not a url"));
    expect(message).toMatch(/Enter a full URL/);
  });
});

describe("isLocalHostname", () => {
  it.each([
    "localhost",
    "0.0.0.0",
    "::",
    "::1",
    "my-mac.local",
    "app.localhost",
    "127.1.2.3",
    "10.0.0.5",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "fe80::1",
    "febf::",
    "fc00::1",
    "fd12::",
    "[::1]", // brackets stripped before evaluation
  ])("treats %s as local", (host) => {
    expect(isLocalHostname(host)).toBe(true);
  });

  it.each([
    "example.com",
    "8.8.8.8",
    "172.15.0.0", // one octet below the 172.16/12 range
    "172.32.0.0", // one octet above the 172.16/12 range
    "2001:db8::1",
    "fec0::1", // outside fe80::/10 (fe80-febf)
  ])("treats %s as NOT local", (host) => {
    expect(isLocalHostname(host)).toBe(false);
  });
});
