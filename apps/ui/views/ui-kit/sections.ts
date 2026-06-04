/**
 * Static catalog of UI-kit sections rendered on the home screen as {@link DisclosureCard}
 * rows. Each entry maps to a route in {@link UiKitStackParamList} and declares the
 * {@link UiKitCategory} it belongs to so the home screen can render the list in
 * meaningful tiers (foundations → components → patterns) rather than as one flat grid.
 */
import type { UiKitStackParamList } from "./param-list";

/**
 * Coarse grouping used to bucket {@link kitSections} on the home screen.
 *
 * - `foundations` -- visual atoms: type, iconography, the brand mark. No interaction,
 *   no domain awareness; everything else stacks on top of these.
 * - `components` -- reusable surfaces, controls, and layout scaffolding. Generic
 *   building blocks that any feature screen can pull in.
 * - `patterns` -- domain compositions of the foundations and components, e.g. a
 *   profile row or a full post card. Closest to the product surface.
 */
export type UiKitCategory = "foundations" | "components" | "patterns";

/**
 * Header copy for a single {@link UiKitCategory} group on the home screen.
 */
export type UiKitCategoryMeta = {
  /** Stable identifier -- matches {@link UiKitSection.category}. */
  id: UiKitCategory;
  /** Heading rendered above the group's cards. */
  title: string;
  /** One-line summary shown under the heading. */
  subtitle: string;
};

/**
 * Ordered list of category groups, rendered top-to-bottom on the home screen. The
 * order encodes a deliberate reading flow -- foundations first (visual atoms), then
 * the components built on top of them, then the domain patterns that combine both.
 */
export const kitCategories: UiKitCategoryMeta[] = [
  {
    id: "foundations",
    title: "Foundations",
    subtitle: "Visual atoms -- type, iconography, brand mark.",
  },
  {
    id: "components",
    title: "Components",
    subtitle:
      "Reusable surfaces, controls, and layout scaffolding shared across screens.",
  },
  {
    id: "patterns",
    title: "Patterns",
    subtitle:
      "Domain compositions that combine foundations and components into product surfaces.",
  },
];

/**
 * One row on the kit home: the route to open and the copy shown on the card.
 */
export type UiKitSection = {
  /** Route name (must exist in {@link UiKitStackParamList}, excluding `home`). */
  name: keyof Omit<UiKitStackParamList, "home">;
  /** Group this section belongs to; controls placement on the home screen. */
  category: UiKitCategory;
  /** Single character displayed in the avatar tile (typically the component initial). */
  initial: string;
  /** Title rendered on the card. */
  title: string;
  /** Short description rendered under the title. */
  description: string;
};

/**
 * Ordered list of sections; the home screen filters this by {@link kitCategories} so
 * the order here also determines the order *within* each category. Keep entries
 * grouped by their `category` field to keep the home screen's tier layout coherent.
 */
export const kitSections: UiKitSection[] = [
  // Foundations -- visual atoms, no interaction or domain awareness.
  {
    name: "typography",
    category: "foundations",
    initial: "T",
    title: "Typography",
    description:
      "Themed Text plus role helpers -- Lede, Eyebrow, Description, Strong, Caption, Label, Code.",
  },
  {
    name: "icons",
    category: "foundations",
    initial: "I",
    title: "Icons",
    description:
      "Lucide icons -- size, color, strokeWidth, and absoluteStrokeWidth props.",
  },
  {
    name: "logo",
    category: "foundations",
    initial: "L",
    title: "Logo",
    description: "Brand image with xs-xl size presets (16px-128px).",
  },
  // Components -- reusable building blocks: surfaces, controls, layout scaffolding.
  {
    name: "layout",
    category: "components",
    initial: "L",
    title: "Layout",
    description:
      "Page, Section, Cluster, and Hero wrappers used to assemble screens.",
  },
  {
    name: "loading-indicator",
    category: "components",
    initial: "L",
    title: "Loading indicator",
    description:
      "Themed activity spinner for inline and full-screen waits — muted foreground from the active palette.",
  },
  {
    name: "cards",
    category: "components",
    initial: "C",
    title: "Cards",
    description:
      "Card shell and DisclosureCard rows -- layout, chrome, and navigation.",
  },
  {
    name: "drawer",
    category: "components",
    initial: "D",
    title: "Drawer",
    description:
      "Bottom-sheet modal and matching DrawerItem rows -- action sheets, confirmations, pickers.",
  },
  {
    name: "accordion",
    category: "components",
    initial: "A",
    title: "Accordion",
    description:
      "Expand / collapse disclosure -- summary line, opt-in body, animated Show more toggle.",
  },
  {
    name: "button",
    category: "components",
    initial: "B",
    title: "Button",
    description:
      "Labelled pill and square IconButton -- shared variants, sizes, and disabled state.",
  },
  {
    name: "input",
    category: "components",
    initial: "I",
    title: "Input",
    description:
      "TextInput, TextArea, and Select -- shared chrome, type presets, multi-line rows, drawer picker with fuzzy search.",
  },
  {
    name: "selection",
    category: "components",
    initial: "S",
    title: "Selection",
    description:
      "Pill chips and controlled multi-select -- SelectablePillGroup, SelectableChecklist, SelectableTopicCard, and SelectableTopicList.",
  },
  // Patterns -- domain compositions of the foundations and components above.
  {
    name: "profile",
    category: "patterns",
    initial: "P",
    title: "Profile",
    description:
      "Avatar tile plus identity rows -- sizes, shapes, names, flags, and locations.",
  },
  {
    name: "post-patterns",
    category: "components",
    initial: "T",
    title: "Post patterns",
    description:
      "Structured tile primitives — StructuredTile, KindHeader, ProportionRow, ProgressBar, MetaLine, and related chrome used by civic attachments.",
  },
  {
    name: "post",
    category: "patterns",
    initial: "P",
    title: "Post",
    description:
      "Every post body kind and archetype teaser (article, liveticker, decree, testimony), relations, and flags — profile header, overflow menu, and action row.",
  },
  {
    name: "post-composer",
    category: "patterns",
    initial: "P",
    title: "Post composer",
    description:
      "Surface-agnostic post-creation primitive -- expanded / collapsed variants, every PostMedia shape, repost / comment embeds, submitting / error states, live <Post> preview.",
  },
  {
    name: "feed",
    category: "patterns",
    initial: "F",
    title: "Feed",
    description:
      "Infinite-scrolling Post stream (same fabricated taxonomy as PostScreen, including every archetype teaser) on FlashList -- onEndReached fires a screen before the bottom, with an always-on loading footer.",
  },
  {
    name: "user-profile",
    category: "patterns",
    initial: "U",
    title: "User profile",
    description:
      "Profile-page composition: X-style header (banner, overlapping avatar, action overlay, identity stack, bio, meta, stats) over a sticky tab strip with one Feed per tab. Each tab keeps its own scroll position; the underline slides between tabs; pull-to-refresh wires per-tab.",
  },
  {
    name: "onboarding",
    category: "patterns",
    initial: "O",
    title: "Onboarding flows",
    description:
      "Civia introduction — full-flow designs: classic auth shell, ambient pattern, wind/water motion.",
  },
];
