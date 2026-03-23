import { describe, expect, it } from "vitest";
import {
  defaultSelectSearchHaystack,
  fuzzyScore,
  rankSelectOptionsByFuzzyQuery,
} from "./fuzzy-match";
import type { SelectOption } from "./types";

describe("fuzzyScore", () => {
  it("treats empty query as neutral match", () => {
    expect(fuzzyScore("", "anything")).toBe(0);
    expect(fuzzyScore("   ", "anything")).toBe(0);
  });

  it("returns null when the query is unrelated", () => {
    expect(fuzzyScore("xyz", "abc")).toBeNull();
    expect(fuzzyScore("zzzz", "Paris FR PAR")).toBeNull();
  });

  it("matches ordered subsequence with high confidence", () => {
    const s = fuzzyScore("abc", "aabbcc");
    expect(s).not.toBeNull();
    expect(s!).toBeGreaterThan(300);
  });

  it("is case-insensitive", () => {
    expect(fuzzyScore("par", "Paris FR PAR France")).not.toBeNull();
    expect(fuzzyScore("PAR", "paris france")).not.toBeNull();
  });

  it("prefers leading matches over gappy ones", () => {
    const leading = fuzzyScore("mu", "munich de muc");
    const trailing = fuzzyScore("mu", "xxmunich");
    expect(leading).not.toBeNull();
    expect(trailing).not.toBeNull();
    expect(leading!).toBeGreaterThan(trailing!);
  });

  it("tolerates typos in the city name", () => {
    expect(fuzzyScore("pariz", "Paris FR PAR France CDG")).not.toBeNull();
    expect(fuzzyScore("amsterdm", "Amsterdam NL AMS Netherlands")).not.toBeNull();
    expect(fuzzyScore("prage", "Prague CZ PRG Czechia")).not.toBeNull();
    expect(fuzzyScore("muncih", "Munich DE MUC Bavaria Germany")).not.toBeNull();
  });

  it("ranks exact spelling above typo spelling", () => {
    const exact = fuzzyScore("munich", "Munich DE MUC Bavaria Germany")!;
    const typo = fuzzyScore("muncih", "Munich DE MUC Bavaria Germany")!;
    expect(exact).toBeGreaterThan(typo);
  });
});

describe("defaultSelectSearchHaystack", () => {
  it("joins label and searchText", () => {
    const o: SelectOption = {
      value: "par",
      label: "Paris",
      searchText: "FR PAR",
    };
    expect(defaultSelectSearchHaystack(o)).toBe("Paris FR PAR");
  });

  it("uses label alone when searchText is absent", () => {
    expect(
      defaultSelectSearchHaystack({ value: "x", label: "Only" }),
    ).toBe("Only");
  });
});

describe("rankSelectOptionsByFuzzyQuery", () => {
  const cities: SelectOption<string>[] = [
    { value: "ams", label: "Amsterdam", searchText: "NL AMS" },
    { value: "par", label: "Paris", searchText: "FR PAR" },
    { value: "prg", label: "Prague", searchText: "CZ PRG" },
    { value: "mun", label: "Munich", searchText: "DE MUC" },
  ];

  it("returns source order when query is empty", () => {
    expect(rankSelectOptionsByFuzzyQuery(cities, "")).toEqual(cities);
    expect(rankSelectOptionsByFuzzyQuery(cities, "  ")).toEqual(cities);
  });

  it("filters to fuzzy matches and ranks by confidence", () => {
    const ranked = rankSelectOptionsByFuzzyQuery(cities, "par");
    expect(ranked[0]?.value).toBe("par");
    expect(ranked.map((c) => c.value)).toContain("par");
  });

  it("searches searchText metadata", () => {
    const ranked = rankSelectOptionsByFuzzyQuery(cities, "cz");
    expect(ranked.map((c) => c.value)).toEqual(["prg"]);
  });

  it("ranks typo matches with the intended city first", () => {
    const ranked = rankSelectOptionsByFuzzyQuery(cities, "pariz");
    expect(ranked[0]?.value).toBe("par");
  });

  it("orders multiple typo matches by confidence", () => {
    const ranked = rankSelectOptionsByFuzzyQuery(cities, "prage");
    expect(ranked[0]?.value).toBe("prg");
    expect(ranked.map((c) => c.value)).not.toContain("par");
  });
});
