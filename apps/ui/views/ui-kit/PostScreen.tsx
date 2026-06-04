/**
 * UI Kit screen for {@link Post}, the three-tier social composition.
 *
 * A post's identity comes from three orthogonal slots:
 *
 * 1. **Body content** -- either the standard pair ({@link PostProps.content} +
 *    {@link PostProps.media}) mapping to eighteen {@link usePostType} kinds
 *    (`Text` through `Disclosure`), or an {@link PostProps.archetype} teaser
 *    (`article`, `liveticker`, `decree`, `testimony`).
 * 2. **Relation** ({@link PostProps.relation}) -- none, re-post, comment, or
 *    Tier-5 variants (`quote`, `correction`, `retraction`), with a separate
 *    embed-type picker for the original's body kind when an inset is shown.
 * 3. **Orthogonal flags** -- menu, share, bookmark, open comment thread,{" "}
 *    {@link PostProps.liked} / {@link PostProps.bookmarked}, structured{" "}
 *    {@link PostContent}, and author{" "}
 *    <Code>from</Code> (engagement actives such as{" "}
 *    {@link PostProps.commented} / {@link PostProps.reposted} are fixed off
 *    here so they do not collide with the relation row).
 *
 * The screen exposes every slot as a {@link ToggleButton} row (single-select
 * for body kind and relation, multi-select for flags) and renders one live
 * {@link Post} beneath the controls. Every press handler logs to the console
 * so the demo feels live in Metro / the browser.
 */
import { useUser } from "@clerk/expo";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Page } from "../../components/Page";
import Post, {
  type EmbeddedPostData,
  type PostComment,
  type PostContent,
  type PostMedia,
  type PostProps,
  type PostRelation,
} from "../../components/Post";
import type { PostType } from "../../components/post-type";
import type { PostArticle } from "../../components/Post/Article";
import type { PostDecree } from "../../components/Post/Decree";
import type { PostLiveticker } from "../../components/Post/Liveticker";
import type { PostTestimony } from "../../components/Post/Testimony";
import type { ProfileProps } from "../../components/Profile";
import { Section } from "../../components/Section";
import ToggleButton from "../../components/ToggleButton";
import {
  Caption,
  Code,
  Description,
  Eyebrow,
  Label,
  Lede,
} from "../../components/Typography";
import { usePlatformUser } from "../../core/account/hooks";
import { platformUserToProfileProps } from "../../core/account/platform-user-profile";
import { randomAvatar } from "../../core/demo/random-avatar";

/**
 * Builds a Picsum Photos URL at the requested dimensions. Used for every demo
 * photo (link-preview thumbnails, single-image post, gallery tiles) so the
 * samples render against a stable placeholder service rather than baked-in
 * binary assets. The seed parameter pins the image so each demo block stays
 * deterministic across reloads.
 */
const picsumUrl = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;

// ---------------------------------------------------------------------------
// Shared sample data
//
// Kept at module scope so the catalog below stays readable -- each demo
// composes its `<Post>` from named pieces instead of inlining a fresh author
// record, media payload, or embed inset every time. Same data flows into the
// catalog's body-shape, with-repost, and with-commented-post sections so
// visual differences across the three rows of any column read as "embed
// changed" rather than "content changed".
// ---------------------------------------------------------------------------

/** Canonical demo authors. Each catalog row picks one for variety. */
const authors = {
  aria: {
    source: randomAvatar("Aria"),
    name: "Aria Popescu",
    handle: "aria.popescu",
    flag: "RO",
    from: "Bucharest, Romania",
  },
  felix: {
    source: randomAvatar("Felix"),
    name: "Felix Carter",
    flag: "US",
    from: "Brooklyn, NY",
  },
  mila: {
    source: randomAvatar("Mila"),
    name: "Mila Olteanu",
    flag: "RO",
    from: "Cluj, Romania",
  },
  ren: {
    source: randomAvatar("Ren"),
    name: "Ren Müller",
    flag: "DE",
    from: "Munich, Germany",
  },
  lin: {
    source: randomAvatar("Lin"),
    name: "Lin Tanaka",
    flag: "JP",
    from: "Tokyo, Japan",
  },
  sara: {
    source: randomAvatar("Sara"),
    name: "Sara Becker",
    flag: "DE",
    from: "Berlin, Germany",
  },
  mira: {
    source: randomAvatar("Mira"),
    name: "Mira Sokolova",
    flag: "BG",
    from: "Sofia, Bulgaria",
  },
} satisfies Record<string, ProfileProps>;

/** OpenGraph link preview reused by every `Text + URL`-flavoured demo. */
const sampleLink: Extract<PostMedia, { kind: "link" }> = {
  kind: "link",
  preview: {
    url: "https://civia.eu/blog/notifications-postmortem",
    title: "How we cut our notification pipeline cost by 40%",
    description:
      "A short post-mortem on switching from fuzzy hashing to exact dedup, and the structured logging that surfaced the regression earlier than the alerts.",
    domain: "civia.eu",
    image: picsumUrl("post-link-preview", 1200, 675),
  },
  onPress: () => console.log("Open civia.eu/blog/notifications-postmortem"),
};

/** Single-image payload reused across every `Image`-flavoured demo. */
const sampleImage: Extract<PostMedia, { kind: "image" }> = {
  kind: "image",
  image: {
    source: picsumUrl("post-rooftops", 1200, 800),
    alt: "Sunlit rooftops at dawn, soft autumn haze",
    aspectRatio: 3 / 2,
  },
  onPress: () => console.log("Open image preview"),
};

/**
 * Single-video payload reused by the `Video` demo. Uses a 16:9 Picsum
 * frame as the poster -- {@link "../../components/Media".Video} paints
 * the play-button overlay on top, so the poster is just a still
 * placeholder until the kit grows a real player underneath.
 */
const sampleVideo: Extract<PostMedia, { kind: "video" }> = {
  kind: "video",
  video: {
    source: picsumUrl("post-video", 1280, 720),
    alt: "Studio walkthrough of the new colour-tokens release",
  },
  onPress: () => console.log("Open video player"),
};

/**
 * Single-audio payload reused by every `Audio` demo. The mock pill has no
 * real playback yet, so {@link AudioData.source} doubles as the seed for
 * the deterministic placeholder waveform -- the same URL always paints
 * the same bars, so demos read consistently across reloads.
 */
const sampleAudio: Extract<PostMedia, { kind: "audio" }> = {
  kind: "audio",
  audio: {
    source: "https://example.com/audio/v0-4-rollout-voice-note.mp3",
    alt: "Voice note recap of the v0.4 rollout",
    durationSeconds: 47,
  },
  onPress: () => console.log("Play audio voice note"),
};

/** Gallery payload (three tiles) reused across every `Gallery` demo. */
const sampleGallery: Extract<PostMedia, { kind: "gallery" }> = {
  kind: "gallery",
  images: [
    {
      source: picsumUrl("post-gallery-1", 900, 1200),
      alt: "Polaroid 1: studio portrait, soft side light",
    },
    {
      source: picsumUrl("post-gallery-2", 900, 900),
      alt: "Polaroid 2: still life, dark backdrop",
    },
    {
      source: picsumUrl("post-gallery-3", 900, 900),
      alt: "Polaroid 3: close-up, shallow depth of field",
    },
  ],
  onImagePress: (index) => console.log(`Open gallery image ${index}`),
};

/** Mosaic payload (mixed aspects) reused across every `Mosaic` demo. */
const sampleMosaic: Extract<PostMedia, { kind: "mosaic" }> = {
  kind: "mosaic",
  images: [
    {
      source: picsumUrl("post-mosaic-landscape", 1200, 675),
      alt: "Wide street view in Yanaka, low morning sun",
      aspectRatio: 16 / 9,
    },
    {
      source: picsumUrl("post-mosaic-square", 1000, 1000),
      alt: "Detail of a temple gate, square frame",
      aspectRatio: 1,
    },
    {
      source: picsumUrl("post-mosaic-portrait", 900, 1125),
      alt: "Tall lantern against a faded plaster wall",
      aspectRatio: 4 / 5,
    },
  ],
  onImagePress: (index) => console.log(`Open mosaic image ${index}`),
};

/** Carousel payload (uniform tiles) reused across every `Carousel` demo. */
const sampleCarousel: Extract<PostMedia, { kind: "carousel" }> = {
  kind: "carousel",
  aspectRatio: 1,
  images: [
    {
      source: picsumUrl("post-carousel-1", 1000, 1000),
      alt: "Wordmark iteration one: wide tracking, loose counters",
    },
    {
      source: picsumUrl("post-carousel-2", 1000, 1000),
      alt: "Wordmark iteration two: tightened spacing",
    },
    {
      source: picsumUrl("post-carousel-3", 1000, 1000),
      alt: "Wordmark iteration three: refined terminals",
    },
    {
      source: picsumUrl("post-carousel-4", 1000, 1000),
      alt: "Wordmark iteration four: final version on light ground",
    },
  ],
  onImagePress: (index) => console.log(`Open carousel image ${index}`),
};

/**
 * Poll payload reused by every `Poll` demo on this screen. Models a
 * lightweight public-consultation ballot with a running tally + a
 * deadline label + the viewer's existing pick (`react-native-svg`),
 * which flips the rendered tile into its read-only "results" paint --
 * the selected row gets the kit's primary accent + a check glyph, no
 * other row is interactive. Set `viewerVoteId` to `undefined` to
 * exercise the still-votable shape; wire `onVotePress` from the
 * outer `<Post>` to make the rows pressable in that mode.
 */
/**
 * Event payload reused by every `Event` demo on this screen. Models a
 * lightweight civic event with a date stack, time range, in-person
 * place, a busy-but-not-full RSVP count, and the viewer already
 * RSVPed -- so the affordance reads "Going" in the kit's primary
 * accent. Set `viewerRsvped` to `false` (or omit it) to exercise the
 * still-open "RSVP" shape.
 */
/**
 * Petition payload reused by every `Petition` demo on this screen. A
 * mid-progress petition (74% of the way to a 2500-signature goal),
 * an open deadline, and the viewer's signature recorded -- so the
 * affordance reads "Signed" in the kit's primary accent and is
 * inert. Drop `viewerSigned` to exercise the still-open "Sign"
 * shape.
 */
/**
 * Fundraiser payload reused by every `Fundraiser` demo on this
 * screen. A community-roof repair, EUR-denominated, halfway to the
 * goal, with both a deadline label and a transparency-link row
 * present so the demo exercises all of the tile's footer chrome.
 */
/**
 * Dataset payload reused by every `Dataset` demo on this screen. A
 * mid-size civic dataset with a populated metadata row (rows, cols,
 * license, freshness) and a downloads list large enough to surface
 * the wide / long / schema-shaped variety -- so the demo exercises
 * the tile's full chrome (eyebrow, name, description, meta row,
 * downloads list with format / size pills + a Download glyph).
 */
const sampleDataset: Extract<PostMedia, { kind: "dataset" }> = {
  kind: "dataset",
  dataset: {
    name: "Council budget 2026 -- line-item ledger",
    description:
      "Per-line allocations and disbursements across every department, exported in both wide and long form so analysts can pick whichever suits the question.",
    rowCount: 184_392,
    columnCount: 14,
    license: "CC BY 4.0",
    freshnessLabel: "Updated weekly",
    downloads: [
      {
        id: "wide",
        label: "budget-2026-wide.csv",
        description: "One row per line item, one column per quarter.",
        size: "1.8 MB",
        format: "CSV",
      },
      {
        id: "long",
        label: "budget-2026-long.csv",
        description: "Tidy / long form -- one row per (line, quarter, value).",
        size: "2.4 MB",
        format: "CSV",
      },
      {
        id: "schema",
        label: "schema.json",
        description: "Column types + descriptions.",
        size: "12 KB",
        format: "JSON",
      },
    ],
  },
  onDownloadPress: (id) => console.log(`Download tapped: ${id}`),
};

/**
 * Fact-check payload reused by every `Fact-check` demo on this
 * screen. A `mostly-true` verdict (outlined success badge) with a
 * populated summary, two evidence rows (pressable via
 * {@link PostProps.media}'s `onEvidencePress`), and a checked-at
 * footer -- so the demo exercises the full tile chrome.
 */
const sampleFactCheck: Extract<PostMedia, { kind: "fact-check" }> = {
  kind: "fact-check",
  factCheck: {
    claim:
      "The council cut the night-bus operating budget by 40% in the 2025 fiscal year.",
    verdict: "mostly-true",
    summary:
      "The nominal line-item dropped 38%; the 40% figure rounds up from a press headline, not the ledger.",
    evidence: [
      {
        id: "ledger",
        label: "Approved budget appendix (CSV)",
        sourceLabel: "Open data portal",
      },
      {
        id: "hansard",
        label: "Finance committee transcript",
        sourceLabel: "Hansard, March 2026",
      },
    ],
    checkedAtLabel: "Checked June 10, 2026",
  },
  onEvidencePress: (id) => console.log(`Evidence row tapped: ${id}`),
};

/**
 * Vote-record payload reused by every `Vote record` demo on this
 * screen. A plenary roll-call with yea / nay / abstain tallies, the
 * viewer's position pinned to <Code>yea</Code> so the tally row
 * highlights in the kit's primary accent, and{" "}
 * <Code>onVotePress</Code> wired for the still-open shape on other
 * fixtures -- here the demo uses the read-only "already voted"
 * paint.
 */
const sampleVoteRecord: Extract<PostMedia, { kind: "vote-record" }> = {
  kind: "vote-record",
  voteRecord: {
    billReference: "Bill 42 / 2026 -- night-bus service levels",
    motionTitle:
      "Second reading: restore Route 22 evening headway to 20 minutes.",
    chamber: "City council plenary",
    voterCapacity: "as delegate for Sector 2 residents",
    yea: 28,
    nay: 14,
    abstain: 3,
    viewerVote: "yea",
  },
  onVotePress: (choice) => console.log(`Vote tapped: ${choice}`),
};

/**
 * Article archetype payload for the `Article` body-shape demo. Matches
 * the `PostArticle` contract shared by `ArticleTeaser` on the feed row and
 * `Article` on the detail route.
 */
const sampleArticle: PostArticle = {
  title: "Why the night-bus cut hit shift workers hardest",
  dek: "A data-led look at who rides after midnight -- and what the council's own surveys missed.",
  byline: "By Mila Olteanu · City desk",
  dateline: "Published 12 June 2026",
  cover: {
    source: "https://picsum.photos/seed/article-cover/800/450",
    alt: "Empty bus at night on a wet street",
    aspectRatio: 16 / 9,
  },
  readingTimeLabel: "8 min read",
  paywalled: true,
  body: [
    "The headline figure -- a 40% nominal cut to the night-bus budget -- tells only part of the story. When you split boardings by shift type, after-midnight rides skew almost entirely toward hospitality, healthcare, and warehouse workers who have no parallel rail line.",
    "This piece walks the ridership heat-maps the council published in April, then overlays the same wards against median rent pressure. The overlap is tight enough that a single corridor restoration (Route 22) would recover nearly a third of the lost passenger-hours without touching the rest of the network.",
    "We asked every sitting councillor whether they had taken a night bus in the last year; six of twenty-two answered yes. Their responses, and the full methodology, are linked from the transparency appendix.",
  ],
};

/**
 * Liveticker archetype payload for the `Liveticker` body-shape demo.
 */
const sampleLiveticker: PostLiveticker = {
  title: "Plenary vote -- night-bus motion",
  entries: [
    { id: "t1", timeLabel: "19:40", content: "Quorum confirmed; roll call starting." },
    { id: "t2", timeLabel: "19:52", content: "Amendment withdrawn after voice vote." },
    { id: "t3", timeLabel: "20:06", content: "Main motion passes 28--14--3." },
  ],
  live: true,
};

const sampleEndorsement: Extract<PostMedia, { kind: "endorsement" }> = {
  kind: "endorsement",
  endorsement: {
    endorserCapacity: "as party chair for the metro chapter",
    targetKind: "bill",
    targetLabel: "Bill 42 / 2026 -- night-bus service levels",
    statement:
      "Endorses swift passage without amendment; the corridor restoration is overdue after two winters of reduced headway.",
  },
};

const sampleCommitment: Extract<PostMedia, { kind: "commitment" }> = {
  kind: "commitment",
  commitment: {
    committerCapacity: "as council president",
    commitmentText:
      "We will publish the independent ridership audit within 30 days of the budget vote.",
    byDateLabel: "by 31 July 2026",
    fulfillmentLabel: "On track",
  },
};

const sampleDisclosure: Extract<PostMedia, { kind: "disclosure" }> = {
  kind: "disclosure",
  disclosure: {
    kind: "paid",
    counterparty: "Transit Riders PAC",
    amountLabel: "2,400",
    currency: "EUR",
    purpose: "Sponsored forum advert (Q2 2026)",
  },
};

const sampleDecree: PostDecree = {
  issuingBody: "City Council of Example",
  decreeNumber: "Decree 142/2026",
  title: "Temporary restoration of Route 22 evening headway",
  summary:
    "Sets a 20-minute headway from 22:00 Sundays through Thursdays until the fiscal year-end mobility audit is filed.",
  fullTextAttachmentLabel: "Full text (PDF, 12 pages)",
  signingAuthority:
    "Signed: Mayor, City of Example · Countersigned: Clerk of the council",
};

const sampleTestimony: PostTestimony = {
  witnessCapacity: "as expert witness (urban mobility)",
  eventDateLabel: "Hearing of 12 June 2026",
  locationLabel: "Council chamber, City Hall",
  statement:
    "The published spreadsheet rows R38 and R40 support both the 38% and 40% figures; they measure different denominators.",
  citedEvidenceLabel: "Exhibit A: April 2026 ridership CSV (open data portal).",
};

const sampleFundraiser: Extract<PostMedia, { kind: "fundraiser" }> = {
  kind: "fundraiser",
  fundraiser: {
    title: "Repair the community-centre roof",
    pitch:
      "The east-wing roof leaks every storm. We're raising for materials and a contractor for a single weekend repair.",
    raised: 4820,
    goal: 8000,
    currency: "EUR",
    deadlineLabel: "Open until June 30",
    transparencyLabel: "Read the budget",
  },
  onDonatePress: () => console.log("Donate tapped"),
  onTransparencyPress: () => console.log("Open transparency link"),
};

const samplePetition: Extract<PostMedia, { kind: "petition" }> = {
  kind: "petition",
  petition: {
    title: "Restore the night bus along the Route 22 corridor",
    ask: "The 22 used to run through 1am; service was cut last spring. We're asking the council to restore the evening shift before the school term starts.",
    signatureCount: 1842,
    goal: 2500,
    deadlineLabel: "Open until July 1",
    viewerSigned: true,
  },
  onSignPress: () => console.log("Sign petition"),
};

const sampleEvent: Extract<PostMedia, { kind: "event" }> = {
  kind: "event",
  event: {
    title: "Neighbourhood town hall: budget Q&A",
    start: new Date("2026-06-12T18:00:00"),
    end: new Date("2026-06-12T20:00:00"),
    place: "Community Centre, Sector 2",
    format: "in-person",
    rsvpCount: 42,
    viewerRsvped: true,
  },
  onRsvpPress: () => console.log("RSVP tapped"),
};

const samplePoll: Extract<PostMedia, { kind: "poll" }> = {
  kind: "poll",
  poll: {
    question:
      "Which library lane should we adopt for the new design system?",
    options: [
      { id: "react-native-svg", label: "React Native SVG", votes: 84 },
      { id: "react-native-skia", label: "React Native Skia", votes: 49 },
      {
        id: "platform-native-vectors",
        label: "Platform-native (PDF / SVG bridges)",
        votes: 12,
      },
    ],
    deadlineLabel: "Closes Friday 18:00",
    viewerVoteId: "react-native-svg",
  },
  onVotePress: (id) => console.log(`Vote tapped: ${id}`),
};

/** Outer commentary when the playground pairs a body shape with a relation. */
const PLAYGROUND_OUTER_CONTENT =
  "Adding my take on this -- the consumer-side validation point is the one I'd cite in the next review.";

/** Structured outer body for the playground's "Structured content" toggle. */
const PLAYGROUND_STRUCTURED_CONTENT: PostContent = [
  { kind: "text", text: "Huge thanks to " },
  {
    kind: "mention",
    handle: "aria.popescu",
    display: "Aria Popescu",
  },
  { kind: "text", text: " for the review, and see " },
  {
    kind: "url",
    href: "https://civia.eu/blog/notifications-postmortem",
  },
  { kind: "text", text: " for context. Tracking " },
  { kind: "hashtag", tag: "NightBus" },
  { kind: "text", text: " this week." },
];

/** One {@link usePostType} kind per playground picker entry. */
type DemoPostKind = PostType["kind"];

/** All twenty-two body kinds, in catalog order. */
const DEMO_POST_KINDS: ReadonlyArray<{ id: DemoPostKind; label: string }> = [
  { id: "text", label: "Text" },
  { id: "text-url", label: "Text + URL" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "audio", label: "Audio" },
  { id: "gallery", label: "Gallery" },
  { id: "mosaic", label: "Mosaic" },
  { id: "carousel", label: "Carousel" },
  { id: "poll", label: "Poll" },
  { id: "event", label: "Event" },
  { id: "petition", label: "Petition" },
  { id: "fundraiser", label: "Fundraiser" },
  { id: "dataset", label: "Dataset" },
  { id: "fact-check", label: "Fact-check" },
  { id: "vote-record", label: "Vote record" },
  { id: "article", label: "Article" },
  { id: "liveticker", label: "Liveticker" },
  { id: "endorsement", label: "Endorsement" },
  { id: "commitment", label: "Commitment" },
  { id: "disclosure", label: "Disclosure" },
  { id: "decree", label: "Decree" },
  { id: "testimony", label: "Testimony" },
];

/** {@link PostRelation} variant for the playground relation picker. */
type DemoRelationKind =
  | "none"
  | "repost"
  | "comment"
  | "quote"
  | "correction"
  | "retraction";

const DEMO_RELATION_KINDS: ReadonlyArray<{
  id: DemoRelationKind;
  label: string;
}> = [
    { id: "none", label: "None" },
    { id: "repost", label: "Repost embed" },
    { id: "comment", label: "Comment embed" },
    { id: "quote", label: "Quote" },
    { id: "correction", label: "Correction" },
    { id: "retraction", label: "Retraction" },
  ];

const POST_KIND_OPTIONS = DEMO_POST_KINDS.map((entry) => ({
  label: entry.label,
  slug: entry.id,
}));

const RELATION_KIND_OPTIONS = DEMO_RELATION_KINDS.map((entry) => ({
  label: entry.label,
  slug: entry.id,
}));

/** Relation variants that render an {@link EmbeddedPostInset}. */
const RELATION_KINDS_WITH_EMBED: ReadonlySet<DemoRelationKind> = new Set([
  "repost",
  "comment",
  "quote",
  "correction",
  "retraction",
]);

const relationHasEmbed = (kind: DemoRelationKind) =>
  RELATION_KINDS_WITH_EMBED.has(kind);

/**
 * Boolean playground slots -- chrome on the row itself, not
 * {@link PostProps.relation} embeds (repost / comment insets live on the
 * relation picker; {@link PostProps.commented} / {@link PostProps.reposted}
 * stay off so they are not confused with those embeds).
 */
type PlaygroundToggle =
  | "menu"
  | "share"
  | "comments"
  | "liked"
  | "bookmarked"
  | "structured"
  | "from";

const PLAYGROUND_TOGGLES: ReadonlyArray<{
  id: PlaygroundToggle;
  label: string;
}> = [
    { id: "menu", label: "Menu" },
    { id: "share", label: "Share" },
    { id: "comments", label: "Comment thread" },
    { id: "liked", label: "Liked" },
    { id: "bookmarked", label: "Bookmarked" },
    { id: "structured", label: "Structured content" },
    { id: "from", label: "Author from" },
  ];

const FLAG_OPTIONS = PLAYGROUND_TOGGLES.map((entry) => ({
  label: entry.label,
  slug: entry.id,
}));

const INITIAL_PLAYGROUND_TOGGLES: Record<PlaygroundToggle, boolean> = {
  menu: false,
  share: true,
  comments: false,
  liked: true,
  bookmarked: false,
  structured: false,
  from: true,
};

const INITIAL_ACTIVE_FLAGS: readonly string[] = PLAYGROUND_TOGGLES.filter(
  (entry) => INITIAL_PLAYGROUND_TOGGLES[entry.id],
).map((entry) => entry.id);

/** Maps active flag slugs from the multi {@link ToggleButton} to post props. */
function togglesFromActiveFlags(
  activeFlags: readonly string[],
): Record<PlaygroundToggle, boolean> {
  const on = new Set(activeFlags);
  return {
    menu: on.has("menu"),
    share: on.has("share"),
    comments: on.has("comments"),
    liked: on.has("liked"),
    bookmarked: on.has("bookmarked"),
    structured: on.has("structured"),
    from: on.has("from"),
  };
}

const isArchetypeKind = (kind: DemoPostKind) =>
  kind === "article" ||
  kind === "liveticker" ||
  kind === "decree" ||
  kind === "testimony";

/**
 * Resolves the playground's selected body kind into the {@link PostProps}
 * slots that drive {@link usePostType}.
 */
function bodySlotsForKind(
  kind: DemoPostKind,
): Pick<PostProps, "content" | "media" | "archetype"> {
  const caption =
    "First time hiking the Bucegi plateau -- the fog lifted right as we hit the saddle.";
  switch (kind) {
    case "text":
      return { content: caption };
    case "text-url":
      return {
        content:
          "The post-mortem I promised. The third lesson -- structured logging -- would have caught it a week earlier.",
        media: sampleLink,
      };
    case "image":
      return {
        content:
          "Morning rooftops on the way to the studio. The light only does this for about ten minutes in November.",
        media: sampleImage,
      };
    case "video":
      return {
        content:
          "Quick studio walkthrough of the v0.4 colour-tokens release -- swatches, contrast bands, and the WCAG-AA pairs view.",
        media: sampleVideo,
      };
    case "audio":
      return {
        content: "Voice-note recap of tonight's rollout -- forty-seven seconds.",
        media: sampleAudio,
      };
    case "gallery":
      return {
        content: "Polaroids from the community print night.",
        media: sampleGallery,
      };
    case "mosaic":
      return {
        content: "Four stops in Yanaka this morning, stacked in reading order.",
        media: sampleMosaic,
      };
    case "carousel":
      return {
        content: "Four iterations of the same chart -- swipe through.",
        media: sampleCarousel,
      };
    case "poll":
      return {
        content: "Polling the team before we lock the renderer.",
        media: samplePoll,
      };
    case "event":
      return {
        content: "Town hall next week -- RSVP if you're coming.",
        media: sampleEvent,
      };
    case "petition":
      return {
        content: "Please sign if you use the 22 after midnight.",
        media: samplePetition,
      };
    case "fundraiser":
      return {
        content: "We're halfway to fixing the roof.",
        media: sampleFundraiser,
      };
    case "dataset":
      return { content: "Fresh budget ledger drop.", media: sampleDataset };
    case "fact-check":
      return {
        content: "Independent check on last week's headline.",
        media: sampleFactCheck,
      };
    case "vote-record":
      return {
        content: "My roll-call on the night-bus motion.",
        media: sampleVoteRecord,
      };
    case "article":
      return { archetype: { kind: "article", article: sampleArticle } };
    case "liveticker":
      return {
        archetype: { kind: "liveticker", liveticker: sampleLiveticker },
      };
    case "endorsement":
      return {
        content: "Our chapter's position on Bill 42.",
        media: sampleEndorsement,
      };
    case "commitment":
      return {
        content: "Committing to the audit timeline.",
        media: sampleCommitment,
      };
    case "disclosure":
      return { content: "Transparency note for Q2.", media: sampleDisclosure };
    case "decree":
      return { archetype: { kind: "decree", decree: sampleDecree } };
    case "testimony":
      return {
        archetype: { kind: "testimony", testimony: sampleTestimony },
      };
  }
}

/** Plain-text excerpt for quote passages (full embed body uses {@link bodySlotsForKind}). */
function embedPassageForKind(
  kind: DemoPostKind,
  body: Pick<PostProps, "content" | "media" | "archetype">,
): string {
  if (typeof body.content === "string" && body.content.length > 0) {
    return body.content.length > 120
      ? `${body.content.slice(0, 117)}…`
      : body.content;
  }
  const archetype = body.archetype;
  if (archetype?.kind === "article") {
    return archetype.article.dek ?? archetype.article.title;
  }
  if (archetype?.kind === "liveticker") {
    return archetype.liveticker.entries[0]?.content ?? archetype.liveticker.title;
  }
  if (archetype?.kind === "decree") {
    return archetype.decree.summary;
  }
  if (archetype?.kind === "testimony") {
    return archetype.testimony.statement;
  }
  return (
    DEMO_POST_KINDS.find((entry) => entry.id === kind)?.label ??
    "Embedded original"
  );
}

/** Builds {@link EmbeddedPostData} for the playground embed-type picker. */
function embeddedPostDataForKind(kind: DemoPostKind): EmbeddedPostData {
  const body = bodySlotsForKind(kind);
  return {
    author: authors.felix,
    content: body.content,
    media: body.media,
    archetype: body.archetype,
    onPress: () =>
      console.log(`Open embedded ${kind} original by Felix Carter`),
  };
}

/** Resolves the playground relation picker into a {@link PostRelation}. */
function relationForKind(
  kind: DemoRelationKind,
  embedKind: DemoPostKind,
): PostRelation | undefined {
  const post = embeddedPostDataForKind(embedKind);
  switch (kind) {
    case "none":
      return undefined;
    case "repost":
      return { kind: "repost", post };
    case "comment":
      return { kind: "comment", post };
    case "quote": {
      const embedBody = bodySlotsForKind(embedKind);
      return {
        kind: "quote",
        post,
        passage: embedPassageForKind(embedKind, embedBody),
      };
    }
    case "correction":
      return {
        kind: "correction",
        post,
        note: "An earlier version said 40%; the actual figure was 14%.",
      };
    case "retraction":
      return {
        kind: "retraction",
        post,
        reason: "The underlying dataset was published in error.",
      };
  }
}

/**
 * Comment thread wired beneath the `Extended` showcase. Each comment's author
 * drops `from` to demonstrate the tight density preset the comment row uses
 * by default; one is pre-liked to surface the filled-red Heart treatment,
 * one omits `likeCount` to exercise the same `0 / undefined`-hides rule the
 * parent action row uses.
 */
const sampleComments: PostComment[] = [
  {
    id: "comment-aria",
    author: { source: randomAvatar("Aria"), name: "Aria Popescu", flag: "RO" },
    content:
      "Curious how the producer-side validation cost shows up in the new traces -- did you also rip the JSON-schema check out, or just moved it?",
    likeCount: 12,
    liked: true,
    onLikePress: () => console.log("Like comment by Aria"),
    onReplyPress: () => console.log("Reply to Aria"),
  },
  {
    id: "comment-mila",
    author: { source: randomAvatar("Mila"), name: "Mila Olteanu", flag: "RO" },
    content:
      "190ms off the P99 in one evening is wild. Was the dedupe key obvious in hindsight or did it take a few tries?",
    likeCount: 4,
    onLikePress: () => console.log("Like comment by Mila"),
    onReplyPress: () => console.log("Reply to Mila"),
  },
  {
    id: "comment-ren",
    author: { source: randomAvatar("Ren"), name: "Ren Müller", flag: "DE" },
    content:
      "Looking forward to the post-mortem. The structured-logging angle is the one I always forget to write up.",
    onLikePress: () => console.log("Like comment by Ren"),
    onReplyPress: () => console.log("Reply to Ren"),
  },
];

/**
 * Shorthand log-wired handler set for a given demo. Tags every press with the
 * demo label so the Metro / browser console makes it obvious which sample
 * fired.
 */
const logHandlers = (label: string) => ({
  onMenuPress: () => console.log(`Menu opened on ${label}'s post`),
  onLikePress: () => console.log(`Like by ${label}`),
  onCommentPress: () => console.log(`Comment on ${label}'s post`),
  onRepostPress: () => console.log(`Re-post by ${label}`),
  onSharePress: () => console.log(`Share ${label}'s post`),
  onBookmarkPress: () => console.log(`Bookmark ${label}'s post`),
  onMentionPress: (handle: string) =>
    console.log(`Mention tapped on ${label}'s post: @${handle}`),
  onUrlPress: (href: string) =>
    console.log(`URL tapped on ${label}'s post: ${href}`),
  onHashtagPress: (tag: string) =>
    console.log(`Hashtag tapped on ${label}'s post: #${tag}`),
});

/**
 * Default-exported screen registered with the UI Kit stack as `post`.
 */
export default function PostScreen() {
  const platformUser = usePlatformUser();
  const { user } = useUser();
  const [postKind, setPostKind] = useState<DemoPostKind>("text");
  const [relationKind, setRelationKind] =
    useState<DemoRelationKind>("none");
  const [embedPostKind, setEmbedPostKind] = useState<DemoPostKind>("text");
  const [activeFlags, setActiveFlags] =
    useState<readonly string[]>(INITIAL_ACTIVE_FLAGS);

  const viewerAuthor = useMemo((): ProfileProps => {
    if (platformUser) {
      return platformUserToProfileProps(
        platformUser,
        user?.imageUrl,
        user?.id,
      );
    }
    return authors.aria;
  }, [platformUser, user?.imageUrl, user?.id]);

  useEffect(() => {
    if (!isArchetypeKind(postKind)) {
      return;
    }
    setActiveFlags((prev) =>
      prev.includes("structured")
        ? prev.filter((slug) => slug !== "structured")
        : prev,
    );
  }, [postKind]);

  const toggles = useMemo(
    () => togglesFromActiveFlags(activeFlags),
    [activeFlags],
  );

  const previewPost = useMemo((): PostProps => {
    const body = bodySlotsForKind(postKind);
    const relation = relationForKind(relationKind, embedPostKind);
    const structuredOn =
      toggles.structured && !isArchetypeKind(postKind);

    let content = body.content;
    if (relation) {
      content = structuredOn
        ? PLAYGROUND_STRUCTURED_CONTENT
        : PLAYGROUND_OUTER_CONTENT;
    } else if (structuredOn) {
      content = PLAYGROUND_STRUCTURED_CONTENT;
    }

    const author: ProfileProps = toggles.from
      ? viewerAuthor
      : (() => {
        const { from: _location, ...withoutLocation } = viewerAuthor;
        return withoutLocation;
      })();

    return {
      author,
      content,
      media: body.media,
      archetype: body.archetype,
      relation,
      likeCount: 43,
      commentCount: 8,
      repostCount: 3,
      liked: toggles.liked,
      bookmarked: toggles.bookmarked,
      showMenu: toggles.menu,
      showShare: toggles.share,
      showBookmark: toggles.share,
      showComments: toggles.comments,
      comments: toggles.comments ? sampleComments : undefined,
      ...logHandlers("Playground"),
    };
  }, [postKind, relationKind, embedPostKind, toggles, viewerAuthor]);

  return (
    <Page>
      <Lede>
        <Code>Post</Code> is a three-tier composition: a <Code>Profile</Code>{" "}
        header, an optional body (<Code>content</Code> + <Code>media</Code> or
        an <Code>archetype</Code> teaser), and an action footer. Flip the
        controls below to see how each orthogonal slot changes the live row.
      </Lede>

      <Section
        title="Playground"
        subtitle="Flip the orthogonal slots; the Post below updates immediately."
      >
        <Description>
          <Code>Post type</Code> is the outer row; when a relation embed is on,
          <Code>Embed type</Code> picks which body kind Felix&apos;s original
          carries inside the inset (repost, comment, quote, correction,
          retraction). Combine any outer × embed pair — e.g. a poll that
          comments on an image post. Flags cover row chrome only.
        </Description>

        <View style={styles.toggleGroup}>
          <Eyebrow>Post type (outer)</Eyebrow>
          <ToggleButton
            variant="ghost"
            maxColumnsPerRow={3}
            options={POST_KIND_OPTIONS}
            defaultValue={postKind}
            onChange={(slug) => setPostKind(slug as DemoPostKind)}
          />
        </View>

        <View style={styles.toggleGroup}>
          <Eyebrow>Relation</Eyebrow>
          <ToggleButton
            variant="ghost"
            maxColumnsPerRow={3}
            options={RELATION_KIND_OPTIONS}
            defaultValue={relationKind}
            onChange={(slug) =>
              setRelationKind(slug as DemoRelationKind)
            }
          />
        </View>

        {relationHasEmbed(relationKind) ? (
          <View style={styles.toggleGroup}>
            <Eyebrow>Embed type (original)</Eyebrow>
            <ToggleButton
              variant="ghost"
              maxColumnsPerRow={3}
              options={POST_KIND_OPTIONS}
              value={embedPostKind}
              onChange={(slug) =>
                setEmbedPostKind(slug as DemoPostKind)
              }
            />
          </View>
        ) : null}

        <View style={styles.toggleGroup}>
          <Eyebrow>Flags</Eyebrow>
          <ToggleButton
            multiple
            variant="ghost"
            maxColumnsPerRow={3}
            options={FLAG_OPTIONS}
            value={activeFlags}
            disabledSlugs={
              isArchetypeKind(postKind) ? ["structured"] : []
            }
            onChange={setActiveFlags}
          />
        </View>

        <View style={styles.previewSlot}>
          <View style={styles.postWrap}>
            <Post {...previewPost} />
          </View>
        </View>

        <Caption>
          <Label>API: </Label>
          <Code>{`<Post showMenu={${toggles.menu}} showShare={${toggles.share}} showBookmark={${toggles.share}} showComments={${toggles.comments}} liked={${toggles.liked}} bookmarked={${toggles.bookmarked}} />`}</Code>
        </Caption>
        {relationKind !== "none" ? (
          <Caption follow>
            <Label>Relation: </Label>
            <Code>{`relation={{ kind: "${relationKind}", post: { /* ${embedPostKind} */ ... } }}`}</Code>
          </Caption>
        ) : null}
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  toggleGroup: {
    marginTop: 14,
    gap: 6,
  },
  previewSlot: {
    marginTop: 20,
    marginBottom: 12,
  },
  postWrap: {
    width: "100%",
    alignSelf: "stretch",
  },
});
