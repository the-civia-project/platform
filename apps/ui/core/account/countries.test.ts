import { describe, expect, it } from "vitest";
import { isCitizenshipNumericCode, SUPPORTED_COUNTRIES } from "./countries";

describe("SUPPORTED_COUNTRIES", () => {
  it("lists 27 supported countries with ISO codes from i18n-iso-countries", () => {
    expect(SUPPORTED_COUNTRIES).toHaveLength(27);
    const germany = SUPPORTED_COUNTRIES.find((country) => country.alpha2 === "DE");
    expect(germany).toEqual({
      alpha2: "DE",
      alpha3: "DEU",
      numeric: 276,
      name: "Germany",
    });
  });

  it("recognises supported numeric citizenship codes", () => {
    expect(isCitizenshipNumericCode(276)).toBe(true);
    expect(isCitizenshipNumericCode(840)).toBe(false);
  });
});
