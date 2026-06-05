/**
 * Civia introduction copy and step definitions — shared by product auth
 * ({@link ./CiviaIntroScreen}) and the UI Kit onboarding demos.
 */

/**
 * Which CTA row renders below the prose block on a step.
 */
export type OnboardingFlowBodyKind =
  | "civia-is"
  | "civia-is-not"
  | "civia-account";

/**
 * One block of copy between the {@link Hero} and the step CTAs.
 */
export type OnboardingProseBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "point"; lead: string; text: string };

/**
 * One screen in the Civia introduction journey.
 */
export type OnboardingFlowStep = {
  /** Stable id for step navigation and accessibility. */
  id: string;
  /** Short label for kit step pills. */
  label: string;
  /** Passed to {@link Hero} as `eyebrow`. */
  eyebrow: string;
  /** Passed to {@link Hero} as `title`. */
  title: string;
  /** One-line descriptive line on the {@link Hero} only. */
  subtitle: string;
  /** Rich copy in the card, above the CTAs. */
  prose: readonly OnboardingProseBlock[];
  /** Which action buttons to show at the bottom of the card. */
  body: OnboardingFlowBodyKind;
};

/**
 * A named, ordered onboarding journey.
 */
export type OnboardingFlow = {
  /** Stable flow identifier. */
  id: string;
  /** Human-readable flow title. */
  title: string;
  /** Ordered steps the visitor walks through. */
  steps: readonly OnboardingFlowStep[];
};

/**
 * Default introduction: explain Civia, set expectations, then sign-in or register.
 */
export const civiaIntroFlow: OnboardingFlow = {
  id: "civia-intro",
  title: "Civia introduction",
  steps: [
    {
      id: "is",
      label: "1 · What it is",
      eyebrow: "The Civia Project",
      title: "What Civia is",
      subtitle: "A civic platform for verified people.",
      prose: [
        {
          kind: "paragraph",
          text: "Civia is where communities read and publish public posts about local life, policy, and affairs that matter where you live.",
        },
        {
          kind: "point",
          lead: "The Civia Platform",
          text: "Our first app — one feed, one voice per human.",
        },
        {
          kind: "point",
          lead: "Verified",
          text: "Membership is for real people who stand behind what they publish.",
        },
        {
          kind: "point",
          lead: "Public",
          text: "What you post is what the platform keeps — nothing else about you.",
        },
        {
          kind: "point",
          lead: "Open source",
          text: "The platform code is public — you can read it, audit it, and contribute.",
        },
      ],
      body: "civia-is",
    },
    {
      id: "is-not",
      label: "2 · What it isn't",
      eyebrow: "The Civia Project",
      title: "What Civia is not",
      subtitle: "Not a network that profiles you.",
      prose: [
        {
          kind: "paragraph",
          text: "We built Civia with hard limits on what we collect and who gets in.",
        },
        {
          kind: "point",
          lead: "No shadow profile",
          text: "No interest graphs, private browsing history, or dossier behind the feed.",
        },
        {
          kind: "point",
          lead: "No bots",
          text: "Automated accounts and influence campaigns are not welcome.",
        },
        {
          kind: "point",
          lead: "No data harvest",
          text: "We are not here to sell attention or export your behaviour.",
        },
        {
          kind: "point",
          lead: "Pre-release",
          text: "Not a finished product — we are still building, and we wipe data often while we develop.",
        },
        {
          kind: "paragraph",
          text: "Verification keeps humans in; how that works is still being designed.",
        },
      ],
      body: "civia-is-not",
    },
    {
      id: "account",
      label: "3 · Join",
      eyebrow: "The Civia Project",
      title: "Join or return",
      subtitle: "Pre-release — nothing here is permanent yet.",
      prose: [
        {
          kind: "paragraph",
          text: "The platform is in pre-release. Accounts, posts, and other data are deleted regularly as we develop — do not count on anything you add today lasting.",
        },
        {
          kind: "paragraph",
          text: "Use email and password to enter The Civia Platform. You confirm EU citizenship with your digital identity wallet after choosing a username.",
        },
        {
          kind: "point",
          lead: "Supported today",
          text: "All EU member states.",
        },
        {
          kind: "point",
          lead: "Returning?",
          text: "Sign in with the account you already created.",
        },
      ],
      body: "civia-account",
    },
  ],
};
