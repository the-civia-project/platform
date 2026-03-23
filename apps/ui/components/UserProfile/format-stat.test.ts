/**
 * Tests for {@link "./format-stat".formatStatValue}, the K/M
 * abbreviation formatter behind {@link "./UserProfile".default}'s
 * stats row and tab-strip counts.
 */
import { describe, expect, it } from "vitest";
import { formatStatValue } from "./format-stat";

describe("formatStatValue", () => {
  it("renders 0 as '0' (the empty-stat case)", () => {
    expect(formatStatValue(0)).toBe("0");
  });

  it("renders small positive values verbatim", () => {
    expect(formatStatValue(1)).toBe("1");
    expect(formatStatValue(42)).toBe("42");
    expect(formatStatValue(999)).toBe("999");
  });

  it("renders 1,000 as '1K' (boundary at the K threshold)", () => {
    expect(formatStatValue(1_000)).toBe("1K");
  });

  it("renders sub-million values with the K suffix", () => {
    expect(formatStatValue(1_234)).toBe("1.2K");
    expect(formatStatValue(12_400)).toBe("12.4K");
    expect(formatStatValue(999_999)).toBe("1000K");
  });

  it("strips trailing .0 from K values so '15.0K' renders as '15K'", () => {
    expect(formatStatValue(15_000)).toBe("15K");
  });

  it("renders 1,000,000 as '1M' (boundary at the M threshold)", () => {
    expect(formatStatValue(1_000_000)).toBe("1M");
  });

  it("renders million-plus values with the M suffix", () => {
    expect(formatStatValue(1_500_000)).toBe("1.5M");
    expect(formatStatValue(15_000_000)).toBe("15M");
    expect(formatStatValue(123_400_000)).toBe("123.4M");
  });

  it("clamps negative values to 0", () => {
    // The prop type permits any number, but a negative follower
    // count is incoherent in this context -- pin the clamp so the
    // stats row never renders "-2 Followers".
    expect(formatStatValue(-1)).toBe("0");
    expect(formatStatValue(-1_500_000)).toBe("0");
  });

  it("clamps non-finite values to 0", () => {
    expect(formatStatValue(Number.NaN)).toBe("0");
    expect(formatStatValue(Number.POSITIVE_INFINITY)).toBe("0");
    expect(formatStatValue(Number.NEGATIVE_INFINITY)).toBe("0");
  });

  it("floors fractional sub-K values rather than emitting decimals", () => {
    // Stats below 1,000 are integers in practice (post / follower /
    // following counts), but the prop type accepts any number. Pin
    // the floor behaviour so "1.6 Posts" never reaches the screen.
    expect(formatStatValue(1.6)).toBe("1");
    expect(formatStatValue(999.9)).toBe("999");
  });
});
