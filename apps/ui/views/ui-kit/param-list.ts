/**
 * Route name → params map for the UI Kit's internal stack navigator.
 * Used by the navigator in `UiKit.tsx`, the home screen for typed `navigation.navigate`,
 * and {@link kitSections} for the link grid.
 */
export type UiKitStackParamList = {
  /** Landing screen with the hero panel and the grid of kit cards. */
  home: undefined;
  /** Accordion (expand / collapse disclosure) examples. */
  accordion: undefined;
  /** Button component examples. */
  button: undefined;
  /** Card + DisclosureCard component examples. */
  cards: undefined;
  /** Drawer (bottom-sheet modal) + DrawerItem (menu row) examples. */
  drawer: undefined;
  /** Feed (infinite-scrolling Post stream) examples. */
  feed: undefined;
  /** Lucide icon prop examples: size, color, strokeWidth, absoluteStrokeWidth. */
  icons: undefined;
  /** TextInput examples -- single-line, controlled, label/helper/disabled/keyboard variants. */
  input: undefined;
  /** Multi-select primitives: pill group, checklist, topic card / list. */
  selection: undefined;
  /** Layout wrapper examples: Page, Section, Cluster, Hero. */
  layout: undefined;
  /** Logo size and inline-row examples. */
  logo: undefined;
  /** Avatar and Profile examples -- image tiles plus identity rows with name, flag, and location. */
  profile: undefined;
  /** Structured post primitives: StructuredTile, KindHeader, ProportionRow, ProgressBar, … */
  "post-patterns": undefined;
  /** Post pattern demo: every body kind, archetype teaser, relation inset, and flags (`PostScreen.tsx`). */
  post: undefined;
  /** PostComposer pattern: surface-agnostic post-creation primitive (Drawer / Page / inline-feed-top). */
  "post-composer": undefined;
  /** Typography examples: themed Text plus role helpers. */
  typography: undefined;
  /** User profile pattern: header Profile row over a Posts / Reposts / Replies tabbed Feed. */
  "user-profile": undefined;
  /** Onboarding introduction — what Civia is, what it is not, then sign-in or register. */
  onboarding: undefined;
};
