/**
 * Hard-coded onboarding catalog data — interests and suggested accounts for
 * UI-only post-registration steps (not persisted).
 */

import type { LucideIcon } from "lucide-react-native";

export type OnboardingInterestItem = {
  id: string;
  label: string;
  /** Supporting line for check-rows and topic-cards. */
  description?: string;
  /** Leading tile letter for topic-cards. */
  initial?: string;
};

export type OnboardingInterestPresentation = "pills" | "check-rows" | "topic-cards";

export type OnboardingInterestGroup = {
  id: string;
  eyebrow: string;
  blurb?: string;
  presentation: OnboardingInterestPresentation;
  items: readonly OnboardingInterestItem[];
};

/** Lucide icons for check-row interests (keyed by interest id). */
export type OnboardingInterestIconMap = Record<string, LucideIcon>;

export const ONBOARDING_INTEREST_GROUPS: readonly OnboardingInterestGroup[] = [
  {
    id: "scope",
    eyebrow: "Where you care",
    blurb: "Tap any that apply.",
    presentation: "pills",
    items: [
      { id: "where-i-live", label: "Where I live" },
      { id: "my-country", label: "My country" },
      { id: "europe", label: "Europe" },
      { id: "global", label: "Global issues" },
    ],
  },
  {
    id: "civic",
    eyebrow: "Civic topics",
    blurb: "Issues you want in your feed preview.",
    presentation: "check-rows",
    items: [
      {
        id: "local-government",
        label: "Local government",
        description: "Council, mayor, neighbourhood decisions",
      },
      {
        id: "elections",
        label: "Elections & campaigns",
        description: "Ballots, candidates, turnout",
      },
      {
        id: "eu-affairs",
        label: "EU affairs",
        description: "Brussels, member states, legislation",
      },
      {
        id: "public-services",
        label: "Public services",
        description: "Health, schools, transport, utilities",
      },
    ],
  },
  {
    id: "deeper",
    eyebrow: "Go deeper",
    presentation: "topic-cards",
    items: [
      {
        id: "democracy-trust",
        label: "Democracy & trust",
        description: "Voting, institutions, misinformation, public debate",
        initial: "D",
      },
      {
        id: "climate-justice",
        label: "Climate & justice",
        description: "Environment, energy, rights, inequality",
        initial: "C",
      },
      {
        id: "housing-planning",
        label: "Housing & planning",
        description: "Rent, development, zoning, infrastructure",
        initial: "H",
      },
    ],
  },
] as const;

/** Flat list of every interest id (for tests and validation). */
export const ONBOARDING_INTEREST_IDS: readonly string[] =
  ONBOARDING_INTEREST_GROUPS.flatMap((group) =>
    group.items.map((item) => item.id),
  );

export type SuggestedAccount = {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
};

export const SUGGESTED_ACCOUNTS: readonly SuggestedAccount[] = [
  {
    id: "civia-official",
    handle: "@civia.official",
    displayName: "The Civia Project",
    bio: "Updates from the platform team.",
  },
  {
    id: "eu-civic-lab",
    handle: "@eu.civic.lab",
    displayName: "EU Civic Lab",
    bio: "Experiments in verified public discourse.",
  },
  {
    id: "local-bulletin",
    handle: "@local.bulletin",
    displayName: "Local Bulletin",
    bio: "Neighbourhood notices and council watch.",
  },
  {
    id: "open-parliament",
    handle: "@open.parliament",
    displayName: "Open Parliament",
    bio: "Legislative summaries in plain language.",
  },
] as const;
