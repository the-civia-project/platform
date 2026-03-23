import isoCountries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json" with { type: "json" };

isoCountries.registerLocale(en);

export type Country = {
  /** ISO 3166-1 numeric code (stored as `citizen_of` in the database). */
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

const countryNameByCode = new Map(
  countries.map((country) => [country.code, country.name]),
);

/** Resolves an ISO numeric code to its English name. */
export function getCountryName(code: number): string | undefined {
  return countryNameByCode.get(code);
}

/** Resolves an ISO numeric code to ISO 3166-1 alpha-2 (e.g. `276` → `DE`). */
export function getCountryAlpha2(code: number): string | undefined {
  return isoCountries.numericToAlpha2(String(code)) ?? undefined;
}

/** Resolves an ISO numeric code to ISO 3166-1 alpha-3 (e.g. `276` → `DEU`). */
export function getCountryAlpha3(code: number): string | undefined {
  return isoCountries.numericToAlpha3(String(code)) ?? undefined;
}

/** Single-line ISO labels for display (e.g. `DE · DEU · 276`). */
export function formatCountryCodesLabel(code: number): string {
  const alpha2 = getCountryAlpha2(code);
  const alpha3 = getCountryAlpha3(code);
  const parts: string[] = [];
  if (alpha2) {
    parts.push(alpha2);
  }
  if (alpha3) {
    parts.push(alpha3);
  }
  parts.push(String(code));
  return parts.join(" · ");
}

/** FlagCDN URL for a numeric country code (same source as `apps/ui` flags). */
export function countryFlagUrl(code: number, width = 20): string | undefined {
  const alpha2 = getCountryAlpha2(code);
  if (!alpha2) {
    return undefined;
  }
  return `https://flagcdn.com/w${width}/${alpha2.toLowerCase()}.png`;
}

/** All ISO numeric codes, for seeding and random selection. */
export const countryCodes = countries.map((country) => country.code);

/** Whether `code` is a known ISO numeric country code in {@link countries}. */
export function isCountryCode(code: number): boolean {
  return countryNameByCode.has(code);
}
