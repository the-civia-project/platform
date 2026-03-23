import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import { supportedCountriesAlpha2 } from "@civia/platform-data";
import type { SelectOption } from "../../components/Select";

countries.registerLocale(en);

/** One supported country with ISO codes and English name from i18n-iso-countries. */
export type SupportedCountry = {
  alpha2: string;
  alpha3: string;
  numeric: number;
  name: string;
};

function buildSupportedCountry(alpha2: string): SupportedCountry {
  const numeric = countries.alpha2ToNumeric(alpha2);
  const alpha3 = countries.alpha2ToAlpha3(alpha2);
  const name = countries.getName(alpha2, "en");
  if (!numeric || !alpha3 || !name) {
    throw new Error(`Missing ISO 3166-1 data for supported country ${alpha2}`);
  }
  return {
    alpha2,
    alpha3,
    numeric: Number(numeric),
    name,
  };
}

/** Countries supported by the platform (`@civia/platform-data`). */
export const SUPPORTED_COUNTRIES: readonly SupportedCountry[] =
  supportedCountriesAlpha2.alpha2
    .map(buildSupportedCountry)
    .sort((left, right) => left.name.localeCompare(right.name, "en"));

/** ISO 3166-1 numeric codes in `public.COUNTRY_NUMERIC_CODE`. */
export const SUPPORTED_CITIZENSHIP_CODES = SUPPORTED_COUNTRIES.map(
  (country) => country.numeric,
);

export type CitizenshipNumericCode =
  (typeof SUPPORTED_COUNTRIES)[number]["numeric"];

const countryByNumeric = Object.fromEntries(
  SUPPORTED_COUNTRIES.map((country) => [country.numeric, country]),
) as Record<number, SupportedCountry>;

export function isCitizenshipNumericCode(
  code: number,
): code is CitizenshipNumericCode {
  return Object.prototype.hasOwnProperty.call(countryByNumeric, code);
}

export function citizenshipCountryName(code: CitizenshipNumericCode): string {
  return countryByNumeric[code]!.name;
}

export function citizenshipSelectOptions(): SelectOption<CitizenshipNumericCode>[] {
  return SUPPORTED_COUNTRIES.map((country) => ({
    value: country.numeric as CitizenshipNumericCode,
    label: country.name,
    searchText: `${country.alpha2} ${country.numeric}`,
  }));
}
