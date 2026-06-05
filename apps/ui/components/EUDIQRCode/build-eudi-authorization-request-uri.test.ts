import { describe, expect, it } from "vitest";
import {
  assertEudiX509HashClientId,
  buildEudiAuthorizationRequestUri,
  EUDI_X509_HASH_CLIENT_ID_PREFIX,
  normalizeEudiX509HashClientId,
} from "./build-eudi-authorization-request-uri";

const DEMO_HASH = "fQuobVwJv000vDWcMtriXPzo2sPTm5_Mp10O87lCqcE";
const DEMO_CLIENT_ID = `${EUDI_X509_HASH_CLIENT_ID_PREFIX}${DEMO_HASH}`;

describe("assertEudiX509HashClientId", () => {
  it("accepts a full x509_hash client id", () => {
    expect(assertEudiX509HashClientId(DEMO_CLIENT_ID)).toBe(DEMO_CLIENT_ID);
  });

  it("rejects other OpenID4VP client id prefixes", () => {
    expect(() =>
      assertEudiX509HashClientId("x509_san_dns:platform.example"),
    ).toThrow(/x509_hash/i);
    expect(() => assertEudiX509HashClientId("civia-platform")).toThrow(
      /x509_hash/i,
    );
  });

  it("rejects a bare certificate hash without the prefix", () => {
    expect(() => assertEudiX509HashClientId(DEMO_HASH)).toThrow(/x509_hash/i);
  });

  it("rejects an empty hash", () => {
    expect(() => assertEudiX509HashClientId(EUDI_X509_HASH_CLIENT_ID_PREFIX)).toThrow(
      /certificate hash/i,
    );
  });
});

describe("normalizeEudiX509HashClientId", () => {
  it("prefixes a bare certificate hash", () => {
    expect(normalizeEudiX509HashClientId("abc123")).toBe("x509_hash:abc123");
  });

  it("accepts a full x509_hash client id", () => {
    expect(
      normalizeEudiX509HashClientId(
        "x509_hash:fQuobVwJv000vDWcMtriXPzo2sPTm5_Mp10O87lCqcE",
      ),
    ).toBe("x509_hash:fQuobVwJv000vDWcMtriXPzo2sPTm5_Mp10O87lCqcE");
  });

  it("rejects other client id prefixes", () => {
    expect(() =>
      normalizeEudiX509HashClientId("x509_san_dns:platform.example"),
    ).toThrow(/x509_hash/i);
  });
});

describe("buildEudiAuthorizationRequestUri", () => {
  it("builds a HAIP cross-device URI with POST request_uri_method", () => {
    const uri = buildEudiAuthorizationRequestUri({
      clientId: DEMO_CLIENT_ID,
      requestUri:
        "https://platform.theciviaproject.org/wallet/request.jwt/demo-session",
      requestUriMethod: "post",
    });

    expect(uri).toMatch(/^haip-vp:\/\/\?/);
    expect(uri).toContain(
      "client_id=x509_hash%3AfQuobVwJv000vDWcMtriXPzo2sPTm5_Mp10O87lCqcE",
    );
    expect(uri).toContain(
      "request_uri=https%3A%2F%2Fplatform.theciviaproject.org%2Fwallet%2Frequest.jwt%2Fdemo-session",
    );
    expect(uri).toContain("request_uri_method=post");
  });

  it("supports the generic openid4vp scheme", () => {
    const uri = buildEudiAuthorizationRequestUri({
      clientId: DEMO_CLIENT_ID,
      requestUri: "https://verifier.example/wallet/request.jwt/abc",
      requestUriMethod: "get",
      scheme: "openid4vp",
    });

    expect(uri.startsWith("openid4vp://?")).toBe(true);
    expect(uri).toContain("request_uri_method=get");
  });

  it("rejects non-https request URIs", () => {
    expect(() =>
      buildEudiAuthorizationRequestUri({
        clientId: `${EUDI_X509_HASH_CLIENT_ID_PREFIX}abc123`,
        requestUri: "http://insecure.example/request.jwt",
      }),
    ).toThrow(/https/i);
  });
});
