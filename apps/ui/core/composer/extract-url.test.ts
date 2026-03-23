import { describe, expect, it } from "vitest";
import { extractFirstUrl } from "./extract-url";

describe("extractFirstUrl", () => {
  describe("no URL", () => {
    it("returns null for an empty string", () => {
      expect(extractFirstUrl("")).toBeNull();
    });

    it("returns null for plain prose with no URL", () => {
      expect(extractFirstUrl("just a thought, nothing to link to.")).toBeNull();
    });

    it("returns null for bare www.* URLs (matching the rendered post's autolinker)", () => {
      expect(extractFirstUrl("see www.example.com for details")).toBeNull();
    });

    it("returns null for partial / malformed URLs", () => {
      expect(extractFirstUrl("scheme is just http:")).toBeNull();
      expect(extractFirstUrl("http:/example.com")).toBeNull();
    });
  });

  describe("happy path", () => {
    it("matches an http URL", () => {
      expect(extractFirstUrl("see http://example.com here")).toBe(
        "http://example.com",
      );
    });

    it("matches an https URL", () => {
      expect(extractFirstUrl("https://example.com/path is great")).toBe(
        "https://example.com/path",
      );
    });

    it("is case-insensitive on the scheme", () => {
      expect(extractFirstUrl("HTTPS://Example.COM/x")).toBe(
        "HTTPS://Example.COM/x",
      );
    });

    it("returns only the first URL when multiple are present", () => {
      expect(
        extractFirstUrl(
          "first https://one.example then https://two.example",
        ),
      ).toBe("https://one.example");
    });

    it("preserves query strings and fragments", () => {
      expect(
        extractFirstUrl("https://example.com/p?token=abc&q=2#section"),
      ).toBe("https://example.com/p?token=abc&q=2#section");
    });
  });

  describe("trailing punctuation", () => {
    it("strips a trailing period", () => {
      expect(extractFirstUrl("check this https://example.com.")).toBe(
        "https://example.com",
      );
    });

    it("strips a trailing comma", () => {
      expect(extractFirstUrl("here: https://example.com, please")).toBe(
        "https://example.com",
      );
    });

    it("strips a trailing closing paren", () => {
      expect(extractFirstUrl("(see https://example.com)")).toBe(
        "https://example.com",
      );
    });

    it("strips multiple trailing punctuation characters", () => {
      expect(extractFirstUrl("look at this (https://example.com).")).toBe(
        "https://example.com",
      );
    });

    it("strips trailing quotes and brackets", () => {
      expect(extractFirstUrl('paste "https://example.com"')).toBe(
        "https://example.com",
      );
      expect(extractFirstUrl("via [https://example.com]")).toBe(
        "https://example.com",
      );
    });

    it("does not strip internal punctuation (only trailing)", () => {
      expect(
        extractFirstUrl("https://example.com/a.b,c/x is gnarly"),
      ).toBe("https://example.com/a.b,c/x");
    });
  });

  describe("boundaries", () => {
    it("matches a URL at the start of the string", () => {
      expect(extractFirstUrl("https://example.com is good")).toBe(
        "https://example.com",
      );
    });

    it("matches a URL at the end of the string", () => {
      expect(extractFirstUrl("read more at https://example.com")).toBe(
        "https://example.com",
      );
    });

    it("matches a URL surrounded by angle brackets (excluding the brackets)", () => {
      expect(extractFirstUrl("see <https://example.com> for more")).toBe(
        "https://example.com",
      );
    });
  });
});
