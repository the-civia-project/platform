import isoCountries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json" with { type: "json" };

isoCountries.registerLocale(en);

export type Country = {
  /** ISO 3166-1 numeric code. */
  code: number;
  /** English display name. */
  name: string;
};

function buildCountries(): Country[] {
  return Object.entries(isoCountries.getNumericCodes())
    .map(([numeric, alpha2]) => ({
      code: Number(numeric),
      name: isoCountries.getName(alpha2, "en") ?? alpha2,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export const countries = buildCountries();

const countryNameByCode = new Map(countries.map((country) => [country.code, country.name]));

/** Resolves an ISO numeric code to its English name. */
export function getCountryName(code: number): string | undefined {
  return countryNameByCode.get(code);
}

/** Resolves an ISO 3166-1 alpha-2 code to its English name. */
export function getCountryNameByAlpha2(alpha2: string): string | undefined {
  return isoCountries.getName(alpha2, "en") ?? undefined;
}

/** All ISO numeric codes. */
export const countryCodes = countries.map((country) => country.code);
