import { describe, expect, it } from "vitest";
import { pickFormFactor, WEB_MOBILE_MAX_PX } from "./form-factor";

describe("pickFormFactor", () => {
  it("returns 'mobile' for iOS at every viewport width", () => {
    // Width is irrelevant on non-web: native runtimes inhabit one device
    // class regardless of dimensions, and rotation never crosses into
    // "desktop" territory.
    expect(pickFormFactor("ios", 320)).toBe("mobile");
    expect(pickFormFactor("ios", 1024)).toBe("mobile");
    expect(pickFormFactor("ios", 1920)).toBe("mobile");
  });

  it("returns 'mobile' for Android at every viewport width", () => {
    expect(pickFormFactor("android", 360)).toBe("mobile");
    expect(pickFormFactor("android", 800)).toBe("mobile");
    expect(pickFormFactor("android", 1440)).toBe("mobile");
  });

  it("collapses unknown non-web OSes to 'mobile'", () => {
    // Future RN targets (Windows, macOS, tvOS, visionOS, ...) inherit the
    // touch-or-controller-first default until a counter-case shows up.
    expect(pickFormFactor("windows", 1920)).toBe("mobile");
    expect(pickFormFactor("macos", 2560)).toBe("mobile");
    expect(pickFormFactor("", 1024)).toBe("mobile");
  });

  it("returns 'web-mobile' for web at or below the breakpoint", () => {
    expect(pickFormFactor("web", 320)).toBe("web-mobile");
    expect(pickFormFactor("web", 480)).toBe("web-mobile");
    expect(pickFormFactor("web", WEB_MOBILE_MAX_PX)).toBe("web-mobile");
  });

  it("returns 'web' for web strictly above the breakpoint", () => {
    expect(pickFormFactor("web", WEB_MOBILE_MAX_PX + 1)).toBe("web");
    expect(pickFormFactor("web", 1024)).toBe("web");
    expect(pickFormFactor("web", 1920)).toBe("web");
  });
});
