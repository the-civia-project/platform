import { describe, expect, it } from "vitest";
import {
  validateCidr,
  validateCidrv4,
  validateCidrv6,
  validateIp,
  validateIpOrCidr,
  validateIpv4,
  validateIpv6,
} from "./ip";
import { firstMessage } from "./_test-utils";

describe("validateIpv4", () => {
  it("returns a ZodError for an empty string", () => {
    const result = validateIpv4("");
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });

  it.each(["192.168.1.42", "0.0.0.0", "255.255.255.255", "10.0.0.1"])(
    "accepts %s",
    (value) => {
      expect(validateIpv4(value)).toBe(true);
    },
  );

  it.each(["999.0.0.0", "1.2.3", "1.2.3.4.5", "abc", "2001:db8::1"])(
    "rejects %s",
    (value) => {
      const result = validateIpv4(value);
      expect(result).not.toBe(true);
      expect(firstMessage(result)).toBeTruthy();
    },
  );
});

describe("validateIpv6", () => {
  it("returns a ZodError for an empty string", () => {
    const result = validateIpv6("");
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });

  it.each(["2001:db8::1", "::1", "::", "fe80::1234"])(
    "accepts %s",
    (value) => {
      expect(validateIpv6(value)).toBe(true);
    },
  );

  it.each(["gggg::", "192.168.1.1", "1:2:3:4:5:6:7:8:9", "abc"])(
    "rejects %s",
    (value) => {
      const result = validateIpv6(value);
      expect(result).not.toBe(true);
      expect(firstMessage(result)).toBeTruthy();
    },
  );
});

describe("validateIp (v4 or v6 union)", () => {
  it("accepts IPv4", () => {
    expect(validateIp("192.168.1.42")).toBe(true);
  });

  it("accepts IPv6", () => {
    expect(validateIp("2001:db8::1")).toBe(true);
  });

  it("emits a single friendly message (not the per-branch noise)", () => {
    expect(firstMessage(validateIp("definitely-not-an-ip"))).toBe(
      "Enter a valid IPv4 or IPv6 address.",
    );
  });
});

describe("validateCidrv4", () => {
  it.each(["192.168.0.0/24", "10.0.0.0/8", "0.0.0.0/0", "255.255.255.255/32"])(
    "accepts %s",
    (value) => {
      expect(validateCidrv4(value)).toBe(true);
    },
  );

  it.each([
    "192.168.0.0/33", // mask out of range
    "192.168.0.0", // bare IP, no /mask
    "999.0.0.0/24",
  ])("rejects %s", (value) => {
    const result = validateCidrv4(value);
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });
});

describe("validateCidrv6", () => {
  it.each(["2001:db8::/32", "::/0", "fe80::/10"])(
    "accepts %s",
    (value) => {
      expect(validateCidrv6(value)).toBe(true);
    },
  );

  it.each([
    "2001:db8::/129", // mask out of range
    "2001:db8::", // bare IP, no /mask
    "gggg::/32",
  ])("rejects %s", (value) => {
    const result = validateCidrv6(value);
    expect(result).not.toBe(true);
    expect(firstMessage(result)).toBeTruthy();
  });
});

describe("validateCidr (v4 or v6 union)", () => {
  it("accepts v4 CIDR", () => {
    expect(validateCidr("192.168.0.0/24")).toBe(true);
  });

  it("accepts v6 CIDR", () => {
    expect(validateCidr("2001:db8::/32")).toBe(true);
  });

  it("rejects bare IPs (they're not CIDR blocks)", () => {
    expect(validateCidr("192.168.0.0")).not.toBe(true);
    expect(validateCidr("2001:db8::1")).not.toBe(true);
  });

  it("emits a single friendly message on failure", () => {
    expect(firstMessage(validateCidr("garbage"))).toBe(
      "Enter a valid CIDR block -- e.g. 192.168.0.0/24 or 2001:db8::/32.",
    );
  });
});

describe("validateIpOrCidr", () => {
  it.each([
    "10.0.0.5",
    "2001:db8::1",
    "10.0.0.0/24",
    "2001:db8::/32",
  ])("accepts bare IP or CIDR (v4/v6): %s", (value) => {
    expect(validateIpOrCidr(value)).toBe(true);
  });

  it("emits a single friendly message on failure", () => {
    expect(firstMessage(validateIpOrCidr("garbage"))).toBe(
      "Enter an IP address or CIDR block -- e.g. 10.0.0.5 or 192.168.0.0/24.",
    );
  });
});
