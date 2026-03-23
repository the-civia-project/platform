import { describe, expect, it } from "vitest";
import { DEFAULT_PRETTY_URL_LENGTH, prettifyUrl } from "./post-url";

describe("prettifyUrl", () => {
  it("strips the https:// scheme", () => {
    expect(prettifyUrl("https://example.com")).toBe("example.com");
  });

  it("strips the http:// scheme", () => {
    expect(prettifyUrl("http://example.com")).toBe("example.com");
  });

  it("is case-insensitive when stripping the scheme", () => {
    // Rare in the wild but Postel-friendly -- a caller hand-typing a
    // URL into a draft and capitalising the scheme shouldn't suddenly
    // get a different prettified form.
    expect(prettifyUrl("HTTPS://example.com")).toBe("example.com");
    expect(prettifyUrl("Http://example.com")).toBe("example.com");
  });

  it("strips a leading www.", () => {
    expect(prettifyUrl("https://www.example.com")).toBe("example.com");
  });

  it("only strips www. immediately after the scheme", () => {
    // www. embedded mid-host (`api.www.example.com`) is a real
    // subdomain and must be preserved -- the kit doesn't try to be
    // clever about subdomain hierarchies.
    expect(prettifyUrl("https://api.www.example.com")).toBe(
      "api.www.example.com",
    );
  });

  it("trims a trailing slash from the bare host", () => {
    expect(prettifyUrl("https://example.com/")).toBe("example.com");
  });

  it("preserves a trailing slash that's the only character", () => {
    // Defensive corner: prettifying just "/" shouldn't return the
    // empty string -- callers passing through a slot value would lose
    // the affordance entirely. The whole-string contract is
    // "strip-then-truncate"; never erase the input down to nothing.
    expect(prettifyUrl("/")).toBe("/");
  });

  it("preserves the path, query, and hash", () => {
    expect(prettifyUrl("https://example.com/path?id=42#section", 100)).toBe(
      "example.com/path?id=42#section",
    );
  });

  it("leaves non-http(s) schemes alone", () => {
    expect(prettifyUrl("mailto:foo@bar.com")).toBe("mailto:foo@bar.com");
    expect(prettifyUrl("tel:+40123456789")).toBe("tel:+40123456789");
    expect(prettifyUrl("civia://feed/home")).toBe("civia://feed/home");
  });

  it("truncates past the max-length cap with a single ellipsis character", () => {
    const long =
      "https://docs.example.com/very/long/path/to/resource?id=42&ref=abc";
    const out = prettifyUrl(long, 30);
    expect(out.length).toBe(30);
    expect(out.endsWith("\u2026")).toBe(true);
    expect(out.startsWith("docs.example.com")).toBe(true);
  });

  it("uses DEFAULT_PRETTY_URL_LENGTH when no second arg is supplied", () => {
    const long =
      "https://docs.example.com/very/long/path/to/resource?id=42&ref=abc";
    expect(prettifyUrl(long).length).toBe(DEFAULT_PRETTY_URL_LENGTH);
  });

  it("does not truncate when the prettified form already fits", () => {
    // No ellipsis when truncation isn't needed -- the prettifier's
    // ellipsis is a length-cap signal, not a "this was a URL"
    // signal. A 12-character URL should read exactly as written.
    expect(prettifyUrl("https://example.com/x", 30)).toBe("example.com/x");
  });

  it("returns a bare ellipsis when maxLength <= 1", () => {
    // Defensive belt-and-braces. A caller passing through a config
    // slider without floor-checking shouldn't crash; the value-of-1
    // budget yields the bare ellipsis so the surrounding copy still
    // reads as "something elided here" rather than the input
    // half-rendered.
    expect(prettifyUrl("https://example.com", 1)).toBe("\u2026");
    expect(prettifyUrl("https://example.com", 0)).toBe("\u2026");
  });

  it("passes the empty string through untouched", () => {
    expect(prettifyUrl("")).toBe("");
  });

  it("does not validate the URL", () => {
    // The prettifier is a formatter, not a validator. Garbage input
    // gets the same scheme-strip-and-truncate treatment -- validation
    // is the caller's job (see ./validation/url.ts).
    expect(prettifyUrl("not a url")).toBe("not a url");
    expect(prettifyUrl("https://not a url")).toBe("not a url");
  });
});
