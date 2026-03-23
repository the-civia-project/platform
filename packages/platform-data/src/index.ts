import supportedCountriesAlpha2Json from "../data/supported-countries-alpha2.json";
import handleAdjectivesJson from "../data/handle-adjectives.json";
import handleAnimalsJson from "../data/handle-animals.json";

export type SupportedCountriesManifest = {
  alpha2: string[];
};

export const supportedCountriesAlpha2 =
  supportedCountriesAlpha2Json as SupportedCountriesManifest;

export const handleAdjectives = handleAdjectivesJson as readonly string[];
export const handleAnimals = handleAnimalsJson as readonly string[];

const HANDLE_SEGMENT = /^[a-z][a-z0-9_]*$/;
const SUGGESTED_HANDLE =
  /^@[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[0-9]+$/;

function randomItem<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index]!;
}

/** Suggested public handle: `@adjective.animal.number` (number 1–9999). */
export function generateSuggestedHandle(): string {
  const adjective = randomItem(handleAdjectives);
  const animal = randomItem(handleAnimals);
  const number = Math.floor(Math.random() * 9999) + 1;
  return `@${adjective}.${animal}.${number}`;
}

export { HANDLE_SEGMENT, SUGGESTED_HANDLE };
