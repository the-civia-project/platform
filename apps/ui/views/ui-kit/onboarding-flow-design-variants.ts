/**
 * Full-flow design options for the Civia introduction — each variant styles the
 * entire step (hero, body, CTA), not just the prose block between them.
 */

/**
 * Identifier passed to {@link FlowStepPreview} and listed on
 * {@link OnboardingFlowsScreen}.
 */
export type OnboardingFlowDesignVariant = "classic" | "ambient" | "flow";

/**
 * Kit catalogue row for one flow design.
 */
export type OnboardingFlowDesignVariantMeta = {
  /** {@link OnboardingFlowDesignVariant} slug. */
  id: OnboardingFlowDesignVariant;
  /** {@link ExampleBlock} `name`. */
  name: string;
  /** One-line summary for the block headline. */
  summary: string;
  /** Expandable detail for the block. */
  description: string;
};

/**
 * Flow designs shown on {@link OnboardingFlowsScreen}.
 */
export const onboardingFlowDesignVariants: readonly OnboardingFlowDesignVariantMeta[] =
  [
    {
      id: "classic",
      name: "classic",
      summary:
        "Standard auth shell — Hero, solid Card, inset prose. Baseline product layout.",
      description:
        "Uses the production AuthScreen as-is: masthead, solid card body, and CTAs. Prose sits in a muted inset panel inside the card.",
    },
    {
      id: "ambient",
      name: "ambient",
      summary:
        "Atmospheric flow — ThemePatternBackground fills the preview; glass card over a breathing scrim.",
      description:
        "The whole step sits on the app texture (respects theme flavor). Hero and copy ride on a semi-transparent card; pattern pulses behind the full frame.",
    },
    {
      id: "flow",
      name: "flow",
      summary:
        "Wind and water flow — animated waves and wind strokes behind the full step, glass card on top.",
      description:
        "SVG waves drift along the bottom of the frame; wind curves pulse above. Same copy and CTAs as other designs; motion is environmental, not typographic.",
    },
  ] as const;
