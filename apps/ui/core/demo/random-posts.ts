/**
 * Shared random-post generator used by UI Kit demo screens that need a
 * stream of fabricated {@link FeedItem}s. Originally lived inline inside
 * {@link "./FeedScreen".default}; lifted out so other screens (post,
 * media, user-profile demos, etc.) can pull from the same data shape
 * without duplicating the cast of authors, body pools, and per-shape
 * media builders.
 *
 * The public entry point is {@link randomPosts}: a long-lived generator
 * that yields a fresh randomly-fabricated {@link FeedItem} on every
 * `next()` call. By default it samples uniformly across the canonical
 * body shapes:
 *
 * - Text
 * - Text + Link preview
 * - Text + Image
 * - Image-only
 * - Text + Video (mock player: 16:9 poster + centered play button)
 * - Text + Gallery
 * - Text + Mosaic
 * - Text + Carousel
 * - Text + Poll (mock ballot: question + options + tally + optional deadline)
 * - Text + Event (mock event card: date + title + time + place + RSVP)
 * - Text + Petition (mock petition: title + ask + progress + sign)
 * - Text + Fundraiser (mock fundraiser: title + pitch + money progress + donate)
 * - Text + Dataset (mock dataset: name + metadata row + downloads list)
 * - Text + Fact-check (mock fact-check: claim + verdict badge + evidence rows)
 * - Text + Vote record (mock roll-call: bill ref + capacity + yea/nay/abstain tally)
 * - Text + Endorsement (mock endorsement: capacity + target + statement)
 * - Text + Commitment (mock commitment: capacity + text + by-date + optional status)
 * - Text + Disclosure (mock transparency: type + counterparty + amount + purpose)
 * - Text + Article (mock editorial: archetype teaser -- headline, dek, cover)
 * - Text + Liveticker (mock ticker: archetype teaser -- title + latest entry + live pulse)
 * - Text + Decree (mock decree: archetype teaser -- issuing body, number, title, summary)
 * - Text + Testimony (mock testimony: archetype teaser -- capacity, statement preview)
 * - Text + Re-post
 * - Text (Comment) + Post
 * - Text + Quote
 * - Text + Correction
 * - Text + Retraction
 *
 * The generator never produces "comment thread visible" rows -- no
 * inline {@link PostProps.comments} array, no `showComments: true`. Feeds
 * in this codebase keep their comment threads collapsed by default
 * and open them on the post-detail view, so generating already-opened
 * rows would be off-pattern; consumers that need comment data for a
 * different screen should fabricate it themselves or
 * extend this module with a dedicated helper.
 *
 * The body shape can be pinned via the options bag (see
 * {@link RandomPostsOptions}): pass `shape: "carousel"` for a feed
 * of carousel posts only, or omit the field to roll uniformly across
 * all ten shapes -- the default behaviour. The `"comment"` shape code
 * was previously spelled `"commented"`; renamed when the kit's
 * relation axis was unified onto a single discriminated union
 * (`{ kind: "comment", post }`) so the generator's shape code now
 * matches {@link "../../components/Post".PostRelation}'s discriminant
 * verbatim.
 *
 * Author, body copy, engagement counts, active states, and per-media
 * tile counts / aspect ratios all roll their own orthogonal dice on
 * top of the shape axis, so even a fully-pinned filter still varies
 * along every sub-axis with enough yields -- including the niche
 * slots (no-location authors via {@link makeAuthor}'s `omitFrom`,
 * long bodies from {@link LONG_BODIES}). The kebab overflow is *not*
 * rolled: {@link "../../components/Feed".Feed} blocks per-row kebabs
 * by design, so this module never sets the prop.
 *
 * Bodies also roll for structured {@link PostContent} on every yield:
 * with probability {@link STRUCTURED_PROBABILITY} the generator
 * discards the plain-string `body` and substitutes a structured
 * array drawn from {@link STRUCTURED_TEMPLATES}. The templates
 * splice random inline `@`-mentions
 * ({@link randomMentionSegment} -- drawn from the same
 * {@link AUTHOR_SEEDS} pool so tagged users are characters from the
 * same cast as authors), random `#`-hashtags
 * ({@link randomHashtagSegment}), and random inline URLs
 * ({@link randomUrlSegment}) into a fixed prose skeleton. Different
 * templates use different mixes (thanks-with-mention, tag-led
 * announcement, full-combo write-up, etc.), so a long scroll
 * exercises every segment-mix shape the kit's
 * {@link "../../components/Post".PostProps.content} accepts. Relation
 * insets (repost / comment) still carry plain-string `content`
 * because the kit's `EmbeddedPostData.content` slot is typed as
 * `string`, not `PostContent`.
 *
 * Each yielded post receives a unique stable id (`random-N`) drawn from
 * an internal counter, so the same id always refers to the same fabricated
 * post and FlashList's cell recycling stays consistent. Hold the
 * generator across renders (e.g. with `useState(() => randomPosts())`)
 * so the counter survives -- a fresh generator on every render would
 * restart at `random-0` and collide with already-rendered ids.
 *
 * @example
 * ```tsx
 * // FeedScreen-style: random across every shape.
 * const [gen] = useState(() => randomPosts());
 * const [posts, setPosts] = useState(() => takeFromGenerator(gen, 8));
 *
 * // Carousel-only feed for a media-focused demo.
 * const carousels = randomPosts({ shape: "carousel" });
 * ```
 */
import type { FeedItem } from "../../components/Feed";
import type {
  CarouselMedia,
  CommitmentMedia,
  DatasetMedia,
  DisclosureMedia,
  EndorsementMedia,
  EventMedia,
  FactCheckMedia,
  FundraiserMedia,
  VoteRecordMedia,
  GalleryMedia,
  ImageMedia,
  LinkMedia,
  LinkPreview,
  MosaicMedia,
  PetitionMedia,
  PollMedia,
  PostContent,
  PostHashtagSegment,
  PostMentionSegment,
  PostArchetype,
  PostUrlSegment,
  VideoMedia,
} from "../../components/Post";
import type { PostEventFormat } from "../../components/Post/Event";
import type { FactCheckVerdict } from "../../components/Post/FactCheck";
import type { PostVoteChoice } from "../../components/Post/VoteRecord";
import { randomAvatar } from "./random-avatar";

/**
 * Builds a Picsum Photos URL at the requested dimensions. The seed pins
 * the image so the same fabricated post always shows the same photo
 * across re-renders (which keeps FlashList's recycler from flickering
 * as cells scroll in and out).
 */
const picsumUrl = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;

/**
 * Author seed used by {@link randomPosts}: the inputs to {@link makeAuthor}
 * rather than a pre-built {@link FeedItem.author} object, so the
 * generator can drop `from` on a per-post basis to exercise the "fresh
 * post, no location" Post variant without duplicating the rest of the
 * record.
 */
type AuthorSeed = {
  /** DiceBear seed (also doubles as the visible first name). */
  seed: string;
  /** Display name rendered by the {@link "../../components/Profile".default} row. */
  name: string;
  /**
   * Mastodon-style handle (without the leading `@`) used by
   * {@link randomMentionSegment} when the generator tags this author
   * inside another post's structured {@link PostContent}. Pinned per
   * seed rather than derived from `name` so non-ASCII display names
   * (Müller, García) still resolve to ASCII-clean handles compatible
   * with {@link "../../validation/handle".validateHandle}.
   */
  handle: string;
  /** ISO 3166-1 alpha-2 country code rendered as a flag glyph. */
  flag: string;
  /** Location string -- dropped randomly to exercise the no-location shape. */
  from: string;
};

/**
 * Author pool {@link randomPosts} draws from. The first six entries
 * match the cast in {@link "./PostScreen".default} so visitors see
 * familiar faces across the two demo screens; the rest are extras
 * that broaden the pool's geographic + name variety so the recycler
 * doesn't repeat authors as quickly in a long scroll.
 *
 * When adding a new entry: keep `seed` short (it doubles as the
 * visible first name and goes into the DiceBear URL) and spread the
 * `flag` / `from` across continents -- new entries reinforce the
 * "this could be anyone, anywhere" mood of a real feed rather than
 * doubling down on regions already covered.
 */
const AUTHOR_SEEDS: AuthorSeed[] = [
  { seed: "Aria", name: "Aria Popescu", handle: "aria.popescu", flag: "RO", from: "Bucharest, Romania" },
  { seed: "Felix", name: "Felix Carter", handle: "felix.carter", flag: "US", from: "Brooklyn, NY" },
  { seed: "Ren", name: "Ren Müller", handle: "ren.muller", flag: "DE", from: "Munich, Germany" },
  { seed: "Mila", name: "Mila Olteanu", handle: "mila.olteanu", flag: "RO", from: "Cluj, Romania" },
  { seed: "Lin", name: "Lin Tanaka", handle: "lin.tanaka", flag: "JP", from: "Tokyo, Japan" },
  { seed: "Sara", name: "Sara Becker", handle: "sara.becker", flag: "DE", from: "Berlin, Germany" },
  { seed: "Ines", name: "Ines García", handle: "ines.garcia", flag: "ES", from: "Barcelona, Spain" },
  { seed: "Theo", name: "Theo Laurent", handle: "theo.laurent", flag: "FR", from: "Lyon, France" },
  { seed: "Noa", name: "Noa van Dijk", handle: "noa.vandijk", flag: "NL", from: "Amsterdam, Netherlands" },
  { seed: "Maja", name: "Maja Andersson", handle: "maja.andersson", flag: "SE", from: "Stockholm, Sweden" },
  { seed: "Priya", name: "Priya Iyer", handle: "priya.iyer", flag: "IN", from: "Bengaluru, India" },
  { seed: "Mateo", name: "Mateo Silva", handle: "mateo.silva", flag: "BR", from: "São Paulo, Brazil" },
  { seed: "Olu", name: "Olu Adeyemi", handle: "olu.adeyemi", flag: "NG", from: "Lagos, Nigeria" },
  { seed: "Jisoo", name: "Jisoo Park", handle: "jisoo.park", flag: "KR", from: "Seoul, South Korea" },
];

/**
 * Short-body pool: one-sentence-to-short-paragraph captions sampled by
 * default. Plenty of variety so consecutive yields rarely collide --
 * but the same body can appear twice in a row without breaking the
 * demo since each surrounding post gets its own randomised author,
 * media, and engagement state.
 *
 * When adding new entries: keep the voice in the existing mood
 * (observational, creative-professional, low-key first-person -- the
 * sort of caption a real product feed surfaces) and prefer the
 * spread-double-hyphen style (` -- `) for em-dashes so the corpus
 * stays visually consistent. Bodies long enough to wrap several lines
 * belong in {@link LONG_BODIES}, not here.
 */
const BODIES: string[] = [
  "First time hiking the Bucegi plateau -- the fog lifted right as we hit the saddle. Best three hours of the week.",
  "Morning rooftops on the way to the studio. The light only does this for about ten minutes in November.",
  "Three frames from the walk through Yanaka this morning. Each one wanted a different shape.",
  "Released v0.4 of the colour-tokens package -- picker now exports a flat array of WCAG-AA pairs in addition to the tree.",
  "Three polaroids from the studio session last weekend. The dark-room scans came out tighter than I expected.",
  "Iterations one through four of the same wordmark. Swipe through to see how the counters tightened up between rounds.",
  "Late-evening notebook scribbles from the strategy offsite. Will type these up properly tomorrow.",
  "Long bus ride, short observation: the difference between a working draft and a finished one is reading it tomorrow.",
  "Sketches from this morning's coffee, before email pulled me back to the inbox.",
  "Migrated the docs site from MDX to plain Markdown over the weekend. Build is 70% faster, and the linter finally catches typos in code fences.",
  "Trying a new pour-over ratio this week -- 1:14, slightly coarser grind. Noticeably brighter, less of the chocolate end of the cup.",
  "Public-transit notebook, week 12: still surprised every time how often the slowest route through a city is also the best one for thinking.",
  "Final review pass on the type specimen. Two weights were almost identical at 14px so I cut one -- the family reads tighter for it.",
  "The forecast said rain, the river said otherwise. Ran the loop and came back drenched but happy.",
  "Shipped the new search index this morning. Zero degraded requests in the first hour -- first time that's ever been true on a launch day.",
  "Two hours in the museum's textile wing, an hour and a half of which I spent in front of one piece. Came out with the feeling, not the words.",
  "Annual reminder: the bug you can reproduce is the bug you can fix. Half the morning gone to figuring out the steps.",
  "Walked the long way home along the canal. Whatever was bothering me at 6pm wasn't bothering me at 7.",
];

/**
 * Long-body pool sampled with low probability so the "long body, fully
 * engaged" variant surfaces every dozen-or-so yields rather than crowding
 * the feed. Bodies long enough to wrap several lines and exercise the
 * Post's multi-line text rendering inside a Feed row.
 *
 * When adding new entries: keep the voice in the same mood as
 * {@link BODIES} (low-key first-person, observational, creative-
 * professional) but stretch the form -- numbered lessons, multi-
 * paragraph reflection, an essay's worth of one thought. Anything
 * that fits in one or two sentences belongs in {@link BODIES}, not
 * here.
 */
const LONG_BODIES: string[] = [
  "Spent the afternoon rewriting our notification pipeline. Three lessons. " +
    "One: the producer was doing format validation that belonged in the consumer, " +
    "which doubled our hot-path cost. Two: deduping on (user_id, payload_hash) " +
    "was 40% cheaper than the previous fuzzy match. Three: structured logging " +
    "would have caught it a week earlier. Writing a longer post-mortem this weekend.",
  "Eight months in, here's what I'd tell past-me about running a small team. " +
    "Hire for slope, not intercept. Have the boring 1:1 every week even when " +
    "nothing's wrong. Write down the decision you didn't make, not just the one " +
    "you did -- the alternatives are what your future self will want to read.",
  "Migrated the rate limiter from Redis to plain Postgres last week. Three " +
    "reasons. One: the Redis cluster was its own outage surface and we'd " +
    "already paged twice this quarter. Two: Postgres can express the leaky-" +
    "bucket window in thirty lines of SQL and we already monitor it. Three: " +
    "cutting one dependency made the deploy script 200 lines shorter. The " +
    "cost was about 3ms of added latency per request, which we paid for in " +
    "much lower variance -- the p99 came down even though the p50 went up.",
  "Three iterations into the new analytics dashboard and we still don't have " +
    "the empty state right. First version showed a blank chart with a 'no " +
    "data yet' label -- felt accusatory. Second showed a sample chart with " +
    "dimmed colours -- people thought it was real and asked why their " +
    "numbers were so low. Third hides the chart entirely and renders a " +
    "getting-started checklist instead. Best read of the three; the team " +
    "is reasonably sure it's still wrong, just less wrong than before.",
  "Quietest week of the year at work, so I spent the gap re-reading the " +
    "engineering decisions we made in spring. Two patterns. Every decision " +
    "that took longer than a week to make has aged better than the ones we " +
    "shipped fast. And every decision we wrote down -- even the ones nobody " +
    "disagreed with at the time -- is the one we're now able to revisit " +
    "cleanly. Conclusion: write more, defend less.",
  "Two weeks across the Balkans by train and bus, with one backpack and a " +
    "notebook. Three things I keep coming back to. Sarajevo's coffee " +
    "culture is the most patient social ritual I've ever sat inside -- you " +
    "do not rush a fildžan. Kotor's old town fits in your palm and yet you " +
    "can spend a whole afternoon walking the same three streets and feel " +
    "like you found something new each loop. And the night train from " +
    "Belgrade to Bar is a small museum of railways the rest of Europe " +
    "forgot, in the best possible way.",
];

/**
 * Pool of correction notes sampled by the `"correction"` shape branch
 * in {@link buildRandomPost}. Each entry is the kind of short
 * "what was wrong, what's fixed" line a real correction post would
 * carry above the original body in the embedded inset; phrased
 * verbatim with the right level of formality for a public record.
 * Distinct from {@link RETRACTION_REASONS} (terser, fact-based) and
 * from the regular {@link BODIES} pool (which is general-purpose
 * prose, not an editorial note).
 */
const CORRECTION_NOTES: string[] = [
  "An earlier version of this post said the migration cut latency by 40%; the actual figure was 14%. Apologies for the typo.",
  "Updated the timeline: the new policy takes effect on June 1, not May 1 as originally written.",
  "The original post named the wrong sponsor on the bill -- corrected to reflect the actual lead sponsor.",
  "Fixed the link to the source dataset; the previous version pointed to an outdated mirror.",
  "Originally attributed the quote to the wrong committee member. The correct speaker is named below.",
  "Updated the casualty figure to match the official statement released this morning.",
  "Corrected the spelling of the witness's name and updated the dateline.",
];

/**
 * Pool of poll questions sampled by the `"poll"` shape branch in
 * {@link buildRandomPost}. Pairs 1:1 with {@link POLL_OPTION_POOLS} by
 * index: a poll is built by picking a question and the matching
 * option pool, so the questions and the options stay topically
 * consistent inside a single generated post.
 *
 * When adding new entries: add a matching option pool to
 * {@link POLL_OPTION_POOLS} at the same index. Lengths must agree --
 * the lookup is by index, not by key, to keep the data structure
 * lightweight. Civic-process voice (committee picks, public
 * consultations, governance votes, lightweight team picks) reads
 * cleanest in the demo.
 */
const POLL_QUESTIONS: string[] = [
  "Which library lane should we adopt for the new design system?",
  "Where should the next neighbourhood town hall be hosted?",
  "Pick a focus theme for the public-consultation campaign next quarter.",
  "What's the most urgent infrastructure topic on this council agenda?",
  "Which time slot works best for the all-hands?",
];

/**
 * Per-question option pools sampled by the `"poll"` shape branch.
 * Index aligned with {@link POLL_QUESTIONS}; pools carry 2-4 plausible
 * answers each so the rendered poll exercises both the short-tail
 * (binary pick) and the long-tail (four-option ballot) shapes.
 */
const POLL_OPTION_POOLS: ReadonlyArray<ReadonlyArray<string>> = [
  ["React Native SVG", "React Native Skia", "Platform-native bridges"],
  ["Old town library", "Community centre", "School auditorium", "Online only"],
  ["Housing affordability", "Public transit", "Air quality", "Education"],
  ["Tram extension", "Roadworks audit", "Cycle network", "Heating subsidies"],
  ["Tuesday 14:00", "Wednesday 10:00", "Thursday 16:00"],
];

/**
 * Pool of event titles sampled by the `"event"` shape branch in
 * {@link buildRandomPost}. Index-paired with {@link EVENT_PLACES} so
 * a generated event reads cohesively (a "neighbourhood town hall"
 * lands at the community centre, not at a downtown rooftop bar).
 * Lengths must agree -- the lookup is by index.
 */
const EVENT_TITLES: string[] = [
  "Neighbourhood town hall: budget Q&A",
  "Open dataset release: civic infrastructure",
  "Candidate debate: city-council seat",
  "Community workshop: cycling network",
  "Public consultation: housing policy",
];

/**
 * Per-event place pool. Index aligned with {@link EVENT_TITLES}.
 */
const EVENT_PLACES: string[] = [
  "Community Centre, Sector 2",
  "On Civia",
  "Old town library",
  "School auditorium",
  "City hall, room 204",
];

/**
 * Per-petition pool sampled by the `"petition"` shape branch. Each
 * entry is a `{ title, ask }` pair that reads as a plausible civic
 * petition.
 */
/**
 * Per-fundraiser pool sampled by the `"fundraiser"` shape branch.
 * Each entry carries a {@link PostFundraiser} sans amounts, so the
 * generator can roll the money figures separately per yield.
 */
const FUNDRAISERS: ReadonlyArray<{
  title: string;
  pitch: string;
  currency: string;
}> = [
  {
    title: "Repair the community-centre roof",
    pitch:
      "The east-wing roof leaks every storm. We're raising for materials and a contractor for a single weekend repair.",
    currency: "EUR",
  },
  {
    title: "School-supply drive: Sector 4 elementary",
    pitch:
      "Backpacks, notebooks, and basic kits for 180 first-graders entering the new term.",
    currency: "RON",
  },
  {
    title: "Restore the public-park benches on Strada Aviatorilor",
    pitch:
      "Forty benches, all on their last legs. We're sourcing reclaimed wood and a local welder for the frames.",
    currency: "EUR",
  },
  {
    title: "Emergency-fund for displaced families after the floods",
    pitch:
      "Direct cash grants distributed by the local Red Cross chapter, with weekly ledger posts here.",
    currency: "USD",
  },
];

/**
 * Per-dataset pool sampled by the `"dataset"` shape branch. Each
 * entry carries the static half of a {@link PostDataset} -- name,
 * description, optional license, optional freshness label, and a
 * fixed downloads list -- so the generator can roll the volatile
 * fields (rows / cols counts) separately per yield while the
 * narrative stays cohesive (a "council budget" dataset always
 * ships budget-shaped files).
 */
const DATASETS: ReadonlyArray<{
  name: string;
  description: string;
  license: string;
  freshnessLabel: string;
  downloads: ReadonlyArray<{
    id: string;
    label: string;
    description?: string;
    size?: string;
    format?: string;
  }>;
}> = [
  {
    name: "Council budget 2026 -- line-item ledger",
    description:
      "Per-line allocations and disbursements across every department, exported in both wide and long form.",
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
  {
    name: "Air-quality sensor archive (2024-2025)",
    description:
      "Hourly PM2.5, PM10, NO2, and O3 readings from every city-deployed sensor over the last two years.",
    license: "Public Domain",
    freshnessLabel: "Static archive",
    downloads: [
      {
        id: "hourly",
        label: "aq-hourly-2024-2025.parquet",
        description: "Columnar -- recommended for analysis.",
        size: "412 MB",
        format: "Parquet",
      },
      {
        id: "daily",
        label: "aq-daily-2024-2025.csv",
        description: "Pre-rolled daily averages.",
        size: "8.2 MB",
        format: "CSV",
      },
    ],
  },
  {
    name: "Council roll-call votes -- 51st session",
    description:
      "Every roll-call vote in the 51st session, with per-member positions and bill metadata.",
    license: "Council Open Data v2",
    freshnessLabel: "Updated after each session",
    downloads: [
      {
        id: "votes",
        label: "roll-calls.json",
        description: "Full vote records with member positions.",
        size: "3.6 MB",
        format: "JSON",
      },
      {
        id: "bills",
        label: "bills.csv",
        description: "Bill metadata -- titles, sponsors, dates.",
        size: "180 KB",
        format: "CSV",
      },
    ],
  },
  {
    name: "Transit ridership 2025 -- per-stop hourly",
    description:
      "Boarding counts at every metro and bus stop, broken down by hour-of-day.",
    license: "CC BY 4.0",
    freshnessLabel: "Updated monthly",
    downloads: [
      {
        id: "ridership",
        label: "ridership-2025.parquet",
        size: "96 MB",
        format: "Parquet",
      },
    ],
  },
];

/**
 * Per-claim pool sampled by the `"fact-check"` shape branch in
 * {@link buildRandomPost}. The generator pairs each entry with a
 * uniformly-random {@link FactCheckVerdict} so every badge tier
 * surfaces over time; optional summary / evidence / checked-at
 * labels roll on separate dice per yield.
 */
const FACT_CHECK_CLAIMS: ReadonlyArray<{
  claim: string;
  summary?: string;
  evidence?: ReadonlyArray<{
    id: string;
    label: string;
    sourceLabel?: string;
  }>;
}> = [
  {
    claim:
      "The council cut the night-bus operating budget by 40% in the 2025 fiscal year.",
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
  },
  {
    claim:
      "Turnout in the city-wide housing referendum exceeded 72% of eligible voters.",
    summary:
      "Preliminary rolls show 68.4% once overseas ballots are excluded from the headline figure.",
    evidence: [
      {
        id: "ec",
        label: "Electoral commission preliminary tally",
        sourceLabel: "EC press release, June 2",
      },
    ],
  },
  {
    claim:
      "The new tram extension opened six weeks ahead of the contractor's published schedule.",
    evidence: [
      {
        id: "pmo",
        label: "Project milestone log (PDF)",
        sourceLabel: "City PMO",
      },
    ],
  },
  {
    claim:
      "Air-quality sensors in Sector 3 recorded zero exceedance days last winter.",
  },
  {
    claim:
      "The NGO's transparency report was filed before the statutory deadline in all four audited years.",
  },
];

const VERDICTS: readonly FactCheckVerdict[] = [
  "true",
  "mostly-true",
  "misleading",
  "false",
  "unverifiable",
];

/**
 * Per-roll-call pool sampled by the `"vote-record"` shape branch in
 * {@link buildRandomPost}. Tallies roll independently per yield;
 * the seed supplies the public-record copy only.
 */
const VOTE_RECORD_SEEDS: ReadonlyArray<{
  billReference: string;
  motionTitle?: string;
  chamber?: string;
  voterCapacity: string;
}> = [
  {
    billReference: "Bill 42 / 2026 -- night-bus service levels",
    motionTitle: "Second reading: restore Route 22 evening headway to 20 minutes.",
    chamber: "City council plenary",
    voterCapacity: "as delegate for Sector 2 residents",
  },
  {
    billReference: "Motion M-14 (budget amendment)",
    chamber: "Finance committee",
    voterCapacity: "ex officio, non-voting member (recorded abstention)",
  },
  {
    billReference: "Resolution R-2026-09 -- public park hours",
    motionTitle: "Extend summer closing time to 22:00 on weekends.",
    voterCapacity: "as ward councillor",
  },
  {
    billReference: "Committee vote CV-118 / housing density pilot",
    voterCapacity: "as citizen appointee to the planning board",
  },
];

const ARTICLE_SEEDS: ReadonlyArray<{
  title: string;
  dek: string;
  byline: string;
  dateline: string;
  coverSeed: string;
  coverAlt: string;
  readingTimeLabel: string;
  body: readonly string[];
}> = [
  {
    title: "The council's own night-bus data contradicts the 40% talking point",
    dek: "We matched last year's boardings CSV to ward-level census rolls. The headline cut isn't where riders disappeared.",
    byline: "By Mila Olteanu · City desk",
    dateline: "Published 8 June 2026",
    coverSeed: "article-nightbus",
    coverAlt: "Empty bus stop at night in the rain",
    readingTimeLabel: "9 min read",
    body: [
      "Every councillor who voted for the cut cited the same finance-committee slide: a 40% nominal reduction in the night-bus line item. That number is accurate for the spreadsheet row; it is not accurate for passenger-hours once you weight boardings by ward.",
      "We reconstructed the April boardings file the council published under open-data rules and joined it to the 2021 census commuter matrix. The steepest drops cluster in three wards -- all of them outside the tram ring, all of them with above-median hospitality employment.",
    ],
  },
  {
    title: "How the transparency pilot changed comment periods",
    dek: "Six months of machine-readable agendas -- what organisers learned, and what still fails.",
    byline: "By Felix Carter · Civic tech",
    dateline: "Published 2 June 2026",
    coverSeed: "article-transparency",
    coverAlt: "Laptop open on a public meeting agenda PDF",
    readingTimeLabel: "6 min read",
    body: [
      "When agendas started shipping as HTML alongside PDFs, third-party bots could finally diff agenda changes within minutes of publish. That sounds dry until you watch how many substantive amendments land less than 48 hours before a vote.",
      "This piece interviews five organisers who used the diff feeds to file timely public comments -- and two who still missed windows because the HTML feed lagged the PDF by half a day.",
    ],
  },
];

const LIVETICKER_SEEDS: ReadonlyArray<{
  title: string;
  entries: readonly { id: string; timeLabel: string; content: string }[];
}> = [
  {
    title: "Plenary vote -- Route 22 night service",
    entries: [
      { id: "lt-1", timeLabel: "19:40", content: "Quorum confirmed; roll call starting." },
      { id: "lt-2", timeLabel: "19:52", content: "Amendment A withdrawn after voice vote." },
      { id: "lt-3", timeLabel: "20:06", content: "Main motion passes 28--14--3. Reporting final tally." },
    ],
  },
  {
    title: "Storm advisory -- central corridor",
    entries: [
      { id: "lt-s1", timeLabel: "21:10", content: "Met office upgrades warning to amber for sectors 1--3." },
      { id: "lt-s2", timeLabel: "21:22", content: "Transit control: expect 10--15 min delays on all surface lines." },
    ],
  },
];

/**
 * Rolls a fresh {@link PostArchetype} `decree` variant for feed demos.
 */
function randomDecreeArchetype(): PostArchetype {
  return {
    kind: "decree",
    decree: {
      issuingBody: pick([
        "City Council of Example",
        "Ministry of Transport",
        "Regional health authority",
      ]),
      decreeNumber: pick(["Decree 142/2026", "Ordinance 12-B", "Executive order 2026-04"]),
      title: pick([
        "Temporary night-bus headway restoration",
        "Snow-load roof standard for public halls",
      ]),
      summary: pick([
        "Sets a 20-minute evening headway on Route 22 until the fiscal year-end audit completes.",
        "Requires municipally owned halls over 400 sqm to publish a certified snow-load study before winter.",
      ]),
      fullTextAttachmentLabel: pick([
        "Full text (PDF, 8 pages)",
        "Gazette extract (PDF, 3 pages)",
      ]),
      signingAuthority: pick([
        "Signed: Mayor, City of Example",
        "Countersigned: Clerk of the council",
      ]),
      ...(chance(0.4)
        ? {
            body: [
              "Article 1 establishes interim service levels. Article 2 sets reporting dates to the mobility committee.",
            ],
          }
        : {}),
    },
  };
}

/**
 * Rolls a fresh {@link PostArchetype} `testimony` variant for feed demos.
 */
function randomTestimonyArchetype(): PostArchetype {
  return {
    kind: "testimony",
    testimony: {
      witnessCapacity: pick([
        "as expert witness (urban mobility)",
        "as resident impacted by the corridor closure",
      ]),
      eventDateLabel: pick(["12 June 2026", "3 May 2026"]),
      locationLabel: pick(["Council chamber", "Committee room B, town hall"]),
      statement: pick([
        "The headway data I submitted shows a 38% drop, not 40%; both figures appear in the same spreadsheet on adjacent rows.",
        "I rely on the Route 22 after midnight five nights a week; there is no parallel service when the line stops at 22:00.",
      ]),
      ...(chance(0.5)
        ? { citedEvidenceLabel: "Exhibit A: Ridership CSV (April 2026)." }
        : {}),
      ...(chance(0.3)
        ? {
            body: [
              "Cross-examination clarified that the 40% headline referred to nominal budget, not passenger-hours.",
            ],
          }
        : {}),
    },
  };
}

const PETITIONS: ReadonlyArray<{ title: string; ask: string }> = [
  {
    title: "Restore the night bus along the Route 22 corridor",
    ask: "The 22 used to run through 1am; service was cut last spring. We're asking the council to restore the evening shift.",
  },
  {
    title: "Open the rail-yard footbridge for pedestrians",
    ask: "The bridge has been fenced off for nine months. We're asking for a temporary safety review so foot traffic can resume.",
  },
  {
    title: "Add a crosswalk at the Mihai Eminescu / 14th intersection",
    ask: "Three near-misses this year. We're asking for a marked crosswalk and a signal change before the school term starts.",
  },
  {
    title: "Publish the council's draft budget in machine-readable form",
    ask: "The 2026 budget is only available as a scanned PDF. We're asking for the underlying CSVs to be released alongside.",
  },
  {
    title: "Save the community garden on Strada Toamnei",
    ask: "The plot is on the council's redevelopment list. We're asking for the garden to be designated as protected green space.",
  },
];

/**
 * Pool of retraction reasons sampled by the `"retraction"` shape
 * branch in {@link buildRandomPost}. Each entry is a short, factual
 * explanation of why a post is being withdrawn -- terser than
 * {@link CORRECTION_NOTES} because a retraction is "this whole post
 * was wrong, here's why" rather than "this detail in the post is
 * fixed".
 */
const RETRACTION_REASONS: string[] = [
  "The underlying source has been disputed by two independent witnesses; retracting until we can verify.",
  "The dataset cited here turned out to have been published in error; the publisher has since pulled it.",
  "The figure quoted has been confirmed inaccurate; we are working on a corrected analysis.",
  "Retracting after the named party demonstrated that the timeline was reconstructed from a second-hand account.",
  "The original recording was misattributed; we have removed the post pending a corrected source.",
];

/**
 * Topic-tag pool sampled by {@link randomHashtagSegment}. Kept on-topic
 * for the kit demo's professional / creative voice and broad enough
 * that consecutive yields rarely collide.
 *
 * When adding new entries: prefer camelCase for multi-word tags
 * (`#AsyncRust`, `#openInfra`) and lowercase for single words
 * (`#typescript`, `#wcag`); the kit doesn't case-fold tags before
 * firing {@link "../../components/Post".PostProps.onHashtagPress}, so
 * mixed casing in the pool exercises the "caller owns normalisation"
 * convention. Bare tags only -- no leading `#` (the kit renders the
 * prefix itself).
 */
const HASHTAGS = [
  "rustlang",
  "AsyncRust",
  "typescript",
  "designsystems",
  "uxwriting",
  "typography",
  "fontdesign",
  "linuxdesktop",
  "darkroom",
  "openinfra",
  "platforms",
  "devex",
  "wcag",
  "a11y",
  "colortheory",
  "openstreetmap",
  "infraweek",
  "tooling",
] as const;

/**
 * Pool of inline URLs sampled by {@link randomUrlSegment} for the
 * structured-content branch. Distinct from {@link LINK_PREVIEWS}: those
 * power the {@link LinkMedia} OG card (full preview with thumbnail and
 * title), these are bare URLs that ride inside a body paragraph
 * alongside surrounding commentary.
 *
 * When adding new entries: pick URLs whose
 * {@link "../../components/post-url".prettifyUrl} form reads like
 * something a real author would drop mid-paragraph -- short
 * `aphyr.com/posts/...` paths and recognisable hosts
 * (`web.dev/...`, `github.com/owner/...`) sit better next to prose
 * than opaque shortener URLs. The kit deliberately doesn't accept
 * a caller-supplied anchor-text override for URL segments (so
 * readers can always see where a link points), which means the
 * `href` itself is what surfaces -- pick `href`s that read well
 * once prettified.
 */
const INLINE_URLS: ReadonlyArray<string> = [
  "https://aphyr.com/posts/regression-analysis",
  "https://blog.example.com/2026/05/dedupe-postmortem",
  "https://web.dev/articles/scroll-restoration",
  "https://docs.example.com/colour-tokens",
  "https://github.com/civia/colour-tokens",
  "https://alistapart.com/article/four-empty-states",
  "https://web.dev/articles/inert-attribute",
  "https://civia.eu/blog/feed-primitive",
] as const;

/**
 * Link-preview pool for the {@link LinkMedia} shape. Roomy enough that
 * the generator can vary which preview lands on which post without the
 * same card coming back too often, while keeping every entry on-topic
 * for the kit demo's professional / creative mood.
 *
 * When adding new entries: mix shapes deliberately -- not every link
 * in a real feed is a blog post. The pool intentionally spans
 * article-style URLs (civia.eu/blog, alistapart.com, web.dev),
 * release-note URLs (github.com/.../releases/tag/...), and repo URLs
 * (github.com/owner/name) so the preview card renders against
 * different title lengths, slash-bearing titles, and version numbers.
 * Vary the `domain` text length too -- a 8-character domain and a
 * 14-character one stress the preview's domain row differently.
 * Stick with Picsum seeds shaped `link-<short-id>` so cached photos
 * stay deterministic across renders.
 */
const LINK_PREVIEWS: LinkPreview[] = [
  {
    url: "https://civia.eu/blog/notifications-postmortem",
    title: "How we cut our notification pipeline cost by 40%",
    description:
      "A short post-mortem on switching from fuzzy hashing to exact dedup, and the structured logging that surfaced the regression earlier than the alerts.",
    domain: "civia.eu",
    image: picsumUrl("link-pipeline", 1200, 675),
  },
  {
    url: "https://civia.eu/blog/colour-tokens-v04",
    title: "Colour tokens v0.4 -- flat arrays for designers, trees for engineers",
    description:
      "Two views of the same palette: an indexed tree for typed runtime lookup, and a flat array of WCAG-AA pairs for picker UIs.",
    domain: "civia.eu",
    image: picsumUrl("link-tokens", 1200, 675),
  },
  {
    url: "https://example.com/articles/typography-rhythm",
    title: "Vertical rhythm for product copy",
    description:
      "Why 1.5 is the wrong default line-height for body copy and what we settled on after three rounds of A/B tests.",
    domain: "example.com",
    image: picsumUrl("link-typography", 1200, 675),
  },
  {
    url: "https://civia.eu/blog/feed-primitive",
    title: "Why our Feed never lets the user reach the bottom",
    description:
      "On the UX invariant behind our infinite-scroll surface -- onEndReached firing a full screen early, the always-on spinner footer, and why both read as 'more is coming' rather than 'this is the end.'",
    domain: "civia.eu",
    image: picsumUrl("link-feed", 1200, 675),
  },
  {
    url: "https://github.com/civia/eidas-stub/releases/tag/v0.3.0",
    title:
      "civia/eidas-stub v0.3.0 -- Drizzle migrations, OIDC discovery, and rotated signing keys",
    description:
      "Release notes for the fake eIDAS provider: switched from raw SQL to Drizzle, added the .well-known/openid-configuration endpoint, and tightened the JWT signing-key rotation cadence.",
    domain: "github.com",
    image: picsumUrl("link-eidas-release", 1200, 675),
  },
  {
    url: "https://alistapart.com/article/four-empty-states",
    title: "The four empty states every product needs",
    description:
      "Most products treat the empty state as a single screen. Walking through four kinds -- new user, filtered-no-results, error, restored -- and why conflating them makes onboarding feel accusatory.",
    domain: "alistapart.com",
    image: picsumUrl("link-empty-states", 1200, 675),
  },
  {
    url: "https://github.com/civia/colour-tokens",
    title: "civia/colour-tokens -- a typed palette that exports both shapes",
    description:
      "Source for the design-tokens package referenced in the v0.4 release notes. One generator builds the indexed tree for typed runtime lookup and the flat WCAG-AA-paired array for picker UIs from the same source palette.",
    domain: "github.com",
    image: picsumUrl("link-colour-tokens-repo", 1200, 675),
  },
  {
    url: "https://web.dev/articles/scroll-restoration-feeds",
    title: "Scroll restoration patterns for client-rendered feeds",
    description:
      "How modern frameworks save and restore scroll position across navigation events, and why list virtualisers' maintainVisibleContentPosition behaviour solves the 'new items prepended on top' case without the consumer doing anything.",
    domain: "web.dev",
    image: picsumUrl("link-scroll-restoration", 1200, 675),
  },
];

/** Aspect-ratio pool for single-image posts. */
const IMAGE_ASPECTS = [16 / 9, 4 / 5, 3 / 2, 1] as const;

/**
 * Aspect-ratio cycle for {@link MosaicMedia}. The mosaic shape exists
 * specifically for mixed shapes, so the generator walks this list with a
 * random offset to make sure consecutive tiles disagree on their
 * proportions.
 */
const MOSAIC_ASPECTS = [16 / 9, 1, 4 / 5, 3 / 4] as const;

/**
 * Canonical body-shape codes the generator dispatches on. Picked
 * uniformly when the caller doesn't pin a shape via
 * {@link RandomPostsOptions.shape}.
 *
 * `repost` and `comment` are deliberately split into separate codes
 * (rather than rolling one "relation" code with an inner kind sub-roll)
 * so the per-frame probability of each surface is obvious at a glance:
 * 1 in 10 yields is a repost inset, 1 in 10 is a commented-post inset,
 * 1 in 10 is the mock-video tile, etc.
 * {@link "../../components/Post".default} renders the relation
 * variants with their own "Reposted" / "Commented" indicators above
 * the rail.
 */
const SHAPES = [
  "text",
  "link",
  "image",
  "image-only",
  "video",
  "gallery",
  "mosaic",
  "carousel",
  "poll",
  "event",
  "petition",
  "fundraiser",
  "dataset",
  "fact-check",
  "vote-record",
  "endorsement",
  "commitment",
  "disclosure",
  "article",
  "liveticker",
  "decree",
  "testimony",
  "repost",
  "comment",
  "quote",
  "correction",
  "retraction",
] as const;

/**
 * Body-shape filter for {@link RandomPostsOptions.shape}. One entry per
 * canonical post shape; export it so consumers can pass it through
 * API surfaces, store it in state, etc., without re-typing the union.
 */
export type RandomPostShape = (typeof SHAPES)[number];

/**
 * Options accepted by {@link randomPosts}.
 */
export type RandomPostsOptions = {
  /**
   * Restricts the generator to one body shape. When omitted, the
   * generator picks uniformly across every {@link RandomPostShape}
   * code for every yield -- the default the {@link "./FeedScreen".default}
   * demo relies on. Pass a specific shape (`"carousel"`, `"poll"`,
   * `"comment"`, ...) when a screen needs a focused stream (a media
   * demo, a commented-post demo, etc.).
   */
  shape?: RandomPostShape;
};

/** Picks a uniformly-random element from `arr`. */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Returns `true` with probability `p` (in `[0, 1]`). */
function chance(p: number): boolean {
  return Math.random() < p;
}

/** Returns a random integer in `[0, max)`. */
function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/** Returns a random integer in `[min, max]` (inclusive on both ends). */
function randIntBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Materialises an {@link AuthorSeed} into a {@link FeedItem.author} record,
 * optionally dropping `from` to exercise the "no location" Profile shape.
 */
function makeAuthor(seed: AuthorSeed, omitFrom: boolean): FeedItem["author"] {
  return omitFrom
    ? { source: randomAvatar(seed.seed), name: seed.name, flag: seed.flag }
    : {
        source: randomAvatar(seed.seed),
        name: seed.name,
        flag: seed.flag,
        from: seed.from,
      };
}

/**
 * Rolls a fresh {@link ImageMedia} for one fabricated post. The seed in
 * the Picsum URL is keyed off the post counter (passed in by
 * {@link buildRandomPost}) so the same id always resolves to the same
 * photo across re-renders -- cell recycling otherwise would re-fetch a
 * different photo every time the post scrolled back into view.
 */
function randomImageMedia(n: number): ImageMedia {
  const aspect = pick(IMAGE_ASPECTS);
  return {
    kind: "image",
    image: {
      source: picsumUrl(`r-img-${n}`, 1200, Math.round(1200 / aspect)),
      alt: "Photo placeholder from Picsum",
      aspectRatio: aspect,
    },
  };
}

/**
 * Rolls a fresh {@link VideoMedia} for one fabricated post. Always
 * uses the 16:9 aspect that the mock video tile defaults to -- the
 * generator deliberately doesn't roll vertical or square shapes here
 * because the kit's playback pipeline is upstream of this file and
 * the safest default for the placeholder poster is the same one
 * {@link "../../components/Media".Video} ships. The Picsum seed is
 * keyed off the post counter so the same id always resolves to the
 * same poster across re-renders (same recycler-stability invariant
 * {@link randomImageMedia} relies on).
 */
function randomVideoMedia(n: number): VideoMedia {
  return {
    kind: "video",
    video: {
      source: picsumUrl(`r-vid-${n}`, 1280, 720),
      alt: "Video poster placeholder from Picsum",
    },
  };
}

/**
 * Rolls a fresh {@link GalleryMedia} with 2-5 tiles. The 5-tile case
 * exercises the `+N` overlay on the fourth slot ({@link GalleryMedia}
 * shows at most four).
 */
function randomGalleryMedia(n: number): GalleryMedia {
  const count = randIntBetween(2, 5);
  return {
    kind: "gallery",
    images: Array.from({ length: count }, (_, i) => ({
      source: picsumUrl(`r-gal-${n}-${i}`, 800, 800),
      alt: `Gallery tile ${i + 1}`,
    })),
  };
}

/**
 * Rolls a fresh {@link MosaicMedia} with 2-3 tiles. Aspect ratios walk
 * {@link MOSAIC_ASPECTS} from a random offset so consecutive tiles
 * disagree on their proportions, which is the whole point of the mosaic
 * shape (and dodges {@link "../../components/Post".default}'s `__DEV__`
 * "all-uniform mosaic" warning).
 */
function randomMosaicMedia(n: number): MosaicMedia {
  const count = randIntBetween(2, 3);
  const start = randInt(MOSAIC_ASPECTS.length);
  return {
    kind: "mosaic",
    images: Array.from({ length: count }, (_, i) => {
      const aspect = MOSAIC_ASPECTS[(start + i) % MOSAIC_ASPECTS.length];
      return {
        source: picsumUrl(`r-mos-${n}-${i}`, 1200, Math.round(1200 / aspect)),
        alt: `Mosaic tile ${i + 1}`,
        aspectRatio: aspect,
      };
    }),
  };
}

/**
 * Rolls a fresh {@link CarouselMedia} with 3-5 uniform tiles. Aspect
 * flips between Instagram-square (`1`) and Twitter-portrait (`4/5`) so
 * both frames render in the demo over time.
 */
function randomCarouselMedia(n: number): CarouselMedia {
  const count = randIntBetween(3, 5);
  const aspect = chance(0.5) ? 1 : 4 / 5;
  return {
    kind: "carousel",
    aspectRatio: aspect,
    images: Array.from({ length: count }, (_, i) => ({
      source: picsumUrl(`r-car-${n}-${i}`, 1000, Math.round(1000 / aspect)),
      alt: `Carousel slide ${i + 1}`,
    })),
  };
}

/** Wraps {@link LINK_PREVIEWS} so {@link buildBaseRandomPost} reads symmetrically. */
function randomLinkMedia(): LinkMedia {
  return { kind: "link", preview: pick(LINK_PREVIEWS) };
}

/**
 * Rolls a fresh {@link PollMedia} with a matched question / option
 * pool drawn from {@link POLL_QUESTIONS} + {@link POLL_OPTION_POOLS}.
 * Each option lands a stable id (`opt-<index>`) so React keying inside
 * the poll tile stays predictable across re-renders; tallies are
 * 0-200 random ints (with the "no votes yet" 0 case included via the
 * lower bound) so the demo exercises both the empty-ballot shape and
 * the running-ballot shape. With probability 0.5 the post also gets
 * a deadline label so the footer alternates between the
 * "tally only" and "tally + deadline" branches; with probability
 * ~0.4 one option is marked as the viewer's vote, which flips the
 * tile into its read-only "results" paint with the primary accent
 * on the chosen row.
 */
/**
 * Rolls a fresh {@link EventMedia} with a matched title / place pair
 * drawn from {@link EVENT_TITLES} + {@link EVENT_PLACES}. The start
 * instant is 1-30 days in the future (rounded to the next half-hour
 * for cleaner time-range labels); the end is 1-3 hours after that
 * with a one-in-three chance of being omitted entirely so the
 * "start only" footer shape also surfaces. Format flips roughly
 * 70/30 between in-person and online. RSVP count rolls 0-300 to
 * exercise both empty and busy events; the viewer's RSVP state is
 * set on roughly 30% of generated events so the "Going" pill shows
 * up in a long scroll.
 */
function randomEventMedia(): EventMedia {
  const index = randInt(EVENT_TITLES.length);
  const title = EVENT_TITLES[index];
  const place = EVENT_PLACES[index];
  const dayOffset = randIntBetween(1, 30);
  const startHour = randIntBetween(9, 20);
  const startMinute = chance(0.5) ? 0 : 30;
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  start.setHours(startHour, startMinute, 0, 0);
  const omitEnd = chance(0.33);
  let end: Date | undefined;
  if (!omitEnd) {
    end = new Date(start);
    end.setHours(end.getHours() + randIntBetween(1, 3));
  }
  const format: PostEventFormat = chance(0.7) ? "in-person" : "online";
  return {
    kind: "event",
    event: {
      title,
      place,
      start,
      ...(end ? { end } : {}),
      format,
      rsvpCount: randInt(300),
      ...(chance(0.3) ? { viewerRsvped: true } : {}),
    },
  };
}

/**
 * Rolls a fresh {@link PetitionMedia} drawn from {@link PETITIONS}.
 * Signature count rolls 0-5000 with a 50/50 chance of having a goal
 * (1.2-3x the current count, rounded to a clean 500-step) so both
 * "no target" and "progress-bar" shapes surface. Roughly one in
 * three petitions land with the viewer's signature recorded, which
 * flips the affordance to "Signed" in the primary accent. About
 * half of generated petitions carry a deadline label; the rest are
 * open-ended.
 */
/**
 * Rolls a fresh {@link FundraiserMedia} drawn from
 * {@link FUNDRAISERS}. Goal rolls 2000-50000 in 500-step increments;
 * raised is `goal * ratio` where `ratio` is uniform in `[0, 1.05]`
 * so the "over-goal" shape (community fundraisers that overshoot)
 * also surfaces. Roughly half carry a deadline label; half carry a
 * transparency-link label.
 */
/**
 * Rolls a fresh {@link DatasetMedia} drawn from {@link DATASETS}. Row
 * count rolls 100-2_000_000 across a wide log-flavoured range so the
 * `.toLocaleString()` formatting exercises both the short ("420
 * rows") and the long ("1,420,000 rows") shapes; column count rolls
 * 3-40 because real civic datasets are rarely wider than that. The
 * downloads list is taken verbatim from the seed -- the kit
 * primitive paints what it's given.
 */
function randomDatasetMedia(): DatasetMedia {
  const seed = pick(DATASETS);
  const rowCount = randIntBetween(1, 2000) * randIntBetween(100, 1000);
  const columnCount = randIntBetween(3, 40);
  return {
    kind: "dataset",
    dataset: {
      name: seed.name,
      description: seed.description,
      rowCount,
      columnCount,
      license: seed.license,
      freshnessLabel: seed.freshnessLabel,
      downloads: seed.downloads.map((d) => ({ ...d })),
    },
  };
}

/**
 * Rolls a fresh {@link FactCheckMedia} drawn from
 * {@link FACT_CHECK_CLAIMS} with a uniformly-random
 * {@link FactCheckVerdict} from {@link VERDICTS}. Summary and
 * evidence lists are included with independent probability so the
 * demo exercises both the minimal "claim + badge" shape and the
 * full chrome.
 */
function randomFactCheckMedia(): FactCheckMedia {
  const seed = pick(FACT_CHECK_CLAIMS);
  const verdict = pick(VERDICTS);
  return {
    kind: "fact-check",
    factCheck: {
      claim: seed.claim,
      verdict,
      ...(seed.summary !== undefined && chance(0.65)
        ? { summary: seed.summary }
        : {}),
      ...(seed.evidence !== undefined && chance(0.55)
        ? { evidence: seed.evidence.map((e) => ({ ...e })) }
        : {}),
      ...(chance(0.45)
        ? {
            checkedAtLabel: pick([
              "Checked June 10, 2026",
              "Updated yesterday",
              "Verified this morning",
            ]),
          }
        : {}),
    },
  };
}

/**
 * Rolls a fresh {@link VoteRecordMedia} drawn from
 * {@link VOTE_RECORD_SEEDS}. Yea / nay / abstain counts roll
 * independently; the viewer's recorded vote is present on roughly
 * one-third of yields so both the interactive and read-only tally
 * shapes surface in a long scroll.
 */
function randomVoteRecordMedia(): VoteRecordMedia {
  const seed = pick(VOTE_RECORD_SEEDS);
  const yea = randInt(200);
  const nay = randInt(200);
  const abstain = chance(0.4) ? randInt(40) : 0;
  const viewerChoices: readonly PostVoteChoice[] = ["yea", "nay", "abstain"];
  const viewerVote = chance(0.35) ? pick(viewerChoices) : undefined;
  return {
    kind: "vote-record",
    voteRecord: {
      billReference: seed.billReference,
      ...(seed.motionTitle !== undefined ? { motionTitle: seed.motionTitle } : {}),
      ...(seed.chamber !== undefined ? { chamber: seed.chamber } : {}),
      voterCapacity: seed.voterCapacity,
      yea,
      nay,
      abstain,
      ...(viewerVote !== undefined ? { viewerVote } : {}),
    },
  };
}

/**
 * Rolls a fresh {@link PostArchetype} `article` variant from {@link ARTICLE_SEEDS}.
 * Paywall badge appears on roughly one-third of yields; body copy is copied
 * verbatim from the seed for the detail route when consumers mount the
 * default export from `components/Post/Article/Article.tsx`.
 */
function randomArticleArchetype(): PostArchetype {
  const seed = pick(ARTICLE_SEEDS);
  return {
    kind: "article",
    article: {
      title: seed.title,
      dek: seed.dek,
      byline: seed.byline,
      dateline: seed.dateline,
      cover: {
        source: picsumUrl(seed.coverSeed, 800, 450),
        alt: seed.coverAlt,
      },
      readingTimeLabel: seed.readingTimeLabel,
      ...(chance(0.35) ? { paywalled: true } : {}),
      body: [...seed.body],
    },
  };
}

/**
 * Rolls a fresh {@link PostArchetype} `liveticker` variant from {@link LIVETICKER_SEEDS}.
 * Roughly half the yields mark the ticker as live with a pulse; the rest ship a
 * closed label so both status shapes appear in a long feed.
 */
function randomLivetickerArchetype(): PostArchetype {
  const seed = pick(LIVETICKER_SEEDS);
  const live = chance(0.5);
  return {
    kind: "liveticker",
    liveticker: {
      title: seed.title,
      entries: seed.entries.map((e) => ({ ...e })),
      ...(live
        ? { live: true }
        : { closedLabel: pick(["Closed -- 20:18", "Final update", "Ticker archived"]) }),
    },
  };
}

function randomEndorsementMedia(): EndorsementMedia {
  const targetKinds = ["person", "org", "bill", "candidate"] as const;
  return {
    kind: "endorsement",
    endorsement: {
      endorserCapacity: pick([
        "as party chair",
        "on behalf of the chapter",
        "as sitting councillor for Ward 4",
      ]),
      targetKind: pick(targetKinds),
      targetLabel: pick([
        "Green slate 2026",
        "Bill 12 / transit levy",
        "Dr. M. Ionescu",
      ]),
      statement: pick([
        "Endorses the platform in full.",
        "Supports passage without amendment.",
        "Public good outweighs narrow cost objections.",
      ]),
    },
  };
}

function randomCommitmentMedia(): CommitmentMedia {
  return {
    kind: "commitment",
    commitment: {
      committerCapacity: pick([
        "as mayor",
        "as finance committee chair",
        "on behalf of the coalition",
      ]),
      commitmentText: pick([
        "We will publish the full audit within 30 days of receipt.",
        "We will hold a second public hearing before the final vote.",
        "We will not table unrelated amendments during this reading.",
      ]),
      byDateLabel: pick(["by 15 July 2026", "by end of Q3 2026", "within 14 days"]),
      ...(chance(0.4)
        ? {
            fulfillmentLabel: pick(["On track", "Partially met", "Under review"]),
          }
        : {}),
    },
  };
}

function randomDisclosureMedia(): DisclosureMedia {
  const kinds = ["received", "paid", "owns", "paid-by"] as const;
  return {
    kind: "disclosure",
    disclosure: {
      kind: pick(kinds),
      counterparty: pick([
        "Example Media Ltd",
        "Northwind Civic PAC",
        "Strada Verde NGO",
      ]),
      amountLabel: pick(["2,400", "12,500", "890"]),
      currency: pick(["EUR", "RON", "USD"]),
      purpose: pick([
        "Speaking fee",
        "Sponsored newsletter slot",
        "Research subcontract",
      ]),
    },
  };
}

function randomFundraiserMedia(): FundraiserMedia {
  const seed = pick(FUNDRAISERS);
  const goal = randIntBetween(4, 100) * 500;
  const ratio = Math.random() * 1.05;
  const raised = Math.round((goal * ratio) / 10) * 10;
  return {
    kind: "fundraiser",
    fundraiser: {
      title: seed.title,
      pitch: seed.pitch,
      currency: seed.currency,
      raised,
      goal,
      ...(chance(0.5)
        ? {
            deadlineLabel: pick([
              "Open until June 30",
              "Closes in 12 days",
              "Closing this Friday",
              "Drive ends end of month",
            ]),
          }
        : {}),
      ...(chance(0.5)
        ? {
            transparencyLabel: pick([
              "Read the budget",
              "Public ledger",
              "Weekly spend report",
            ]),
          }
        : {}),
    },
  };
}

function randomPetitionMedia(): PetitionMedia {
  const seed = pick(PETITIONS);
  const signatureCount = randInt(5001);
  const hasGoal = chance(0.5);
  const goal = hasGoal
    ? Math.max(
        500,
        Math.round((signatureCount * randIntBetween(12, 30)) / 10 / 500) * 500,
      )
    : undefined;
  const deadlineLabel = chance(0.5)
    ? pick([
        "Open until July 1",
        "Closes in 12 days",
        "Closing this Friday",
        "Open all month",
      ])
    : undefined;
  return {
    kind: "petition",
    petition: {
      title: seed.title,
      ask: seed.ask,
      signatureCount,
      ...(goal !== undefined ? { goal } : {}),
      ...(deadlineLabel !== undefined ? { deadlineLabel } : {}),
      ...(chance(0.33) ? { viewerSigned: true } : {}),
    },
  };
}

function randomPollMedia(): PollMedia {
  const index = randInt(POLL_QUESTIONS.length);
  const question = POLL_QUESTIONS[index];
  const optionLabels = POLL_OPTION_POOLS[index];
  const options = optionLabels.map((label, i) => ({
    id: `opt-${i}`,
    label,
    votes: randInt(200),
  }));
  const viewerVoteId = chance(0.4)
    ? options[randInt(options.length)].id
    : undefined;
  const deadlineLabel = chance(0.5)
    ? pick([
        "Closes Friday 18:00",
        "Open for 7 more days",
        "Closes at the end of the month",
        "Ends Tuesday at noon",
      ])
    : undefined;
  return {
    kind: "poll",
    poll: {
      question,
      options,
      ...(viewerVoteId !== undefined ? { viewerVoteId } : {}),
      ...(deadlineLabel !== undefined ? { deadlineLabel } : {}),
    },
  };
}

/**
 * Builds a fresh {@link PostMentionSegment} tagging a uniformly-picked
 * author from {@link AUTHOR_SEEDS}. The handle resolves to the seed's
 * {@link AuthorSeed.handle} (ASCII-clean, Mastodon-style); the
 * display falls back to the seed's full name so the rendered tag
 * reads naturally inside body copy (`"Aria Popescu"` instead of the
 * bare `@aria.popescu`).
 *
 * Callers that need a specific author should build the segment
 * inline instead -- the generator-facing helpers in this module are
 * deliberately uniform-random so the long-scroll demo varies along
 * the same axes the rest of the generator does.
 */
function randomMentionSegment(): PostMentionSegment {
  const seed = pick(AUTHOR_SEEDS);
  return {
    kind: "mention",
    handle: seed.handle,
    display: seed.name,
  };
}

/**
 * Builds a fresh {@link PostHashtagSegment} from a uniformly-picked
 * entry in {@link HASHTAGS}. The tag is the bare string (no leading
 * `#`); {@link "../../components/Post".renderHashtagSegment} prepends
 * the `#` at render time.
 */
function randomHashtagSegment(): PostHashtagSegment {
  return { kind: "hashtag", tag: pick(HASHTAGS) };
}

/**
 * Builds a fresh {@link PostUrlSegment} from a uniformly-picked entry
 * in {@link INLINE_URLS}. URL segments don't carry a caller-supplied
 * anchor-text override -- the kit always renders the
 * {@link "../../components/post-url".prettifyUrl} form of the `href`
 * so readers can see the destination -- which keeps the generator
 * pleasantly trivial.
 */
function randomUrlSegment(): PostUrlSegment {
  return { kind: "url", href: pick(INLINE_URLS) };
}

/**
 * Random engagement counts. Each count has an independent chance of being
 * hidden (returned as `undefined`), which exercises Post's
 * `0 / undefined` hide rule alongside the visible counts.
 */
function randomCounts() {
  return {
    likeCount: chance(0.8) ? randInt(2500) : undefined,
    commentCount: chance(0.7) ? randInt(80) : undefined,
    repostCount: chance(0.55) ? randInt(200) : undefined,
  };
}

/**
 * Random toggle states for the engagement actions. `liked` is the most
 * common (matches real product feeds where most-viewed posts are
 * already-liked); `commented` / `reposted` are rarer because their
 * "viewer participated" semantics are rarer in practice.
 */
function randomActives() {
  return {
    liked: chance(0.35),
    commented: chance(0.15),
    reposted: chance(0.15),
    bookmarked: chance(0.2),
  };
}

/**
 * Probability that a given yielded post replaces its plain-string
 * body with a structured {@link PostContent} array containing inline
 * mentions, URLs, and/or hashtags. Tuned to roughly mirror what a
 * real feed looks like -- one in three posts surfaces at least one
 * inline segment, the rest stay short-form plain copy.
 *
 * Tweak with care: too high and every demo row reads as a
 * tag-cloud, swamping the body-shape catalog the FeedScreen is
 * really demonstrating; too low and the structured-content path
 * never shows up in a casual scroll.
 */
const STRUCTURED_PROBABILITY = 0.35;

/**
 * Template pool sampled by {@link maybeBuildStructuredContent}. Each
 * entry is a pure factory that returns a fresh {@link PostContent}
 * array with random {@link randomMentionSegment} /
 * {@link randomHashtagSegment} / {@link randomUrlSegment} fills
 * spliced into a fixed prose skeleton. Different templates use
 * different mixes (mention-only thanks, hashtag-led announcement,
 * full-combo write-up) so consecutive structured-content posts vary
 * along the segment-mix axis without the generator having to roll
 * counts of each kind separately.
 *
 * When adding new entries: keep the voice in the same mood as
 * {@link BODIES} (low-key first-person, observational,
 * creative-professional) so the structured branch and the
 * plain-string branch read as one corpus. Mix segment kinds
 * deliberately -- not every template needs all three; a tag-led
 * announcement (hashtag-only) and a shoutout (mention-only) are
 * just as realistic as the full combo, and adding them keeps the
 * distribution honest.
 */
const STRUCTURED_TEMPLATES: ReadonlyArray<() => PostContent> = [
  // Mention + hashtag: the "thanks for the review" pattern.
  () => [
    { kind: "text", text: "Huge thanks to " },
    randomMentionSegment(),
    { kind: "text", text: " for the deep review on the " },
    randomHashtagSegment(),
    {
      kind: "text",
      text: " refactor -- catch list landed in main this morning.",
    },
  ],
  // Hashtag + URL: the "quick read recommendation" pattern.
  () => [
    { kind: "text", text: "Quick read on " },
    randomHashtagSegment(),
    { kind: "text", text: " this morning -- " },
    randomUrlSegment(),
    { kind: "text", text: ". Worth your coffee." },
  ],
  // Mention + URL: the "collab note" pattern.
  () => [
    { kind: "text", text: "Walked " },
    randomMentionSegment(),
    { kind: "text", text: " through the new state machine over at " },
    randomUrlSegment(),
    { kind: "text", text: ". Notes are messy but the diagram is final." },
  ],
  // Two mentions + hashtag: the "multi-author thanks" pattern.
  () => [
    { kind: "text", text: "Couldn't have shipped the " },
    randomHashtagSegment(),
    { kind: "text", text: " migration without " },
    randomMentionSegment(),
    { kind: "text", text: " and " },
    randomMentionSegment(),
    { kind: "text", text: ". Beer is on me at the next offsite." },
  ],
  // Three hashtags: the "tag-dense announcement" pattern.
  () => [
    { kind: "text", text: "Slides from yesterday's talk are up. " },
    randomHashtagSegment(),
    { kind: "text", text: " · " },
    randomHashtagSegment(),
    { kind: "text", text: " · " },
    randomHashtagSegment(),
  ],
  // Full combo: mention + URL + hashtag.
  () => [
    { kind: "text", text: "Pair-programming with " },
    randomMentionSegment(),
    { kind: "text", text: " on the new " },
    randomHashtagSegment(),
    { kind: "text", text: " adapter. WIP branch + design doc at " },
    randomUrlSegment(),
    { kind: "text", text: " -- feedback welcome." },
  ],
  // Hashtag-only: the "tag-led short post" pattern.
  () => [
    { kind: "text", text: "Three weeks deep into " },
    randomHashtagSegment(),
    {
      kind: "text",
      text: " and I'm finally starting to see the shape of the rules.",
    },
  ],
  // Mention-only: the "shoutout" pattern.
  () => [
    { kind: "text", text: "Reading " },
    randomMentionSegment(),
    {
      kind: "text",
      text: "'s latest piece on resilience patterns and underlining roughly every other line.",
    },
  ],
];

/**
 * With probability {@link STRUCTURED_PROBABILITY}, returns a fresh
 * structured {@link PostContent} array drawn from one of the
 * {@link STRUCTURED_TEMPLATES} -- discarding the plain-string `body`
 * argument because the templates carry their own prose skeleton.
 * Otherwise returns `body` verbatim so the resulting post stays in
 * the original {@link BODIES} / {@link LONG_BODIES} corpus.
 *
 * Returning either a `string` or a `PostContent` array hands the
 * decision to the caller's `content?: PostContent` slot, which
 * accepts both shapes by design (see the
 * {@link "../../components/Post".PostContent} JSDoc) -- no special
 * narrowing needed at the call site.
 */
function maybeBuildStructuredContent(body: string): PostContent {
  if (!chance(STRUCTURED_PROBABILITY)) return body;
  return pick(STRUCTURED_TEMPLATES)();
}

/**
 * Body-shape builder: assembles the post slots that correspond to the
 * given {@link RandomPostShape} (content, optional media, optional
 * reposted post, optional commented post). The returned row is always
 * thread-collapsed -- no inline `comments` array, no
 * `showComments: true` -- because feeds in this codebase keep their
 * threads collapsed by
 * default (the post-detail view is where threads open). The kebab
 * overflow is similarly never set on the returned row:
 * {@link "../../components/Feed".Feed} omits per-row kebabs by design,
 * so the generator skips the prop entirely.
 *
 * Content for every body-text-bearing shape (everything except
 * `image-only`) is rolled through {@link maybeBuildStructuredContent}
 * exactly once at the top of the function and reused across the
 * switch arms -- so a single post commits to one body shape
 * (plain-string or structured), it doesn't mix. Relation insets
 * (repost / comment) keep plain-string content drawn fresh from
 * {@link BODIES} because the kit's `EmbeddedPostData.content`
 * accepts `string` only.
 *
 * @param n - Stable per-post counter used to seed the post id and the
 *   Picsum URLs so the same fabricated post always renders with the
 *   same photo across re-renders.
 * @param shape - The body shape to build. Picked by the caller --
 *   either uniformly across {@link SHAPES} when the consumer didn't
 *   pin a shape, or the consumer-supplied
 *   {@link RandomPostsOptions.shape}.
 */
function buildRandomPost(n: number, shape: RandomPostShape): FeedItem {
  const seed = pick(AUTHOR_SEEDS);
  const author = makeAuthor(seed, chance(0.15));
  const counts = randomCounts();
  const actives = randomActives();
  const id = `random-${n}`;
  const body = chance(0.15) ? pick(LONG_BODIES) : pick(BODIES);
  // Roll for structured content once per post. Body-text-bearing
  // shapes share this value so a single post always commits to one
  // body shape (plain-string vs structured) -- partial mixing would
  // be incoherent. Relation insets (repost / comment) keep plain
  // strings because `EmbeddedPostData.content` is still typed as
  // `string`, not `PostContent` (see the Post.tsx note on
  // deliberately leaving the embedded slot to plain copy).
  const content = maybeBuildStructuredContent(body);

  switch (shape) {
    case "text":
      return { id, author, content, ...counts, ...actives };
    case "link":
      return {
        id,
        author,
        content,
        media: randomLinkMedia(),
        ...counts,
        ...actives,
      };
    case "image":
      return {
        id,
        author,
        content,
        media: randomImageMedia(n),
        ...counts,
        ...actives,
      };
    case "image-only":
      return {
        id,
        author,
        media: randomImageMedia(n),
        ...counts,
        ...actives,
      };
    case "video":
      return {
        id,
        author,
        content,
        media: randomVideoMedia(n),
        ...counts,
        ...actives,
      };
    case "gallery":
      return {
        id,
        author,
        content,
        media: randomGalleryMedia(n),
        ...counts,
        ...actives,
      };
    case "mosaic":
      return {
        id,
        author,
        content,
        media: randomMosaicMedia(n),
        ...counts,
        ...actives,
      };
    case "carousel":
      return {
        id,
        author,
        content,
        media: randomCarouselMedia(n),
        ...counts,
        ...actives,
      };
    case "poll":
      return {
        id,
        author,
        content,
        media: randomPollMedia(),
        ...counts,
        ...actives,
      };
    case "event":
      return {
        id,
        author,
        content,
        media: randomEventMedia(),
        ...counts,
        ...actives,
      };
    case "petition":
      return {
        id,
        author,
        content,
        media: randomPetitionMedia(),
        ...counts,
        ...actives,
      };
    case "fundraiser":
      return {
        id,
        author,
        content,
        media: randomFundraiserMedia(),
        ...counts,
        ...actives,
      };
    case "dataset":
      return {
        id,
        author,
        content,
        media: randomDatasetMedia(),
        ...counts,
        ...actives,
      };
    case "fact-check":
      return {
        id,
        author,
        content,
        media: randomFactCheckMedia(),
        ...counts,
        ...actives,
      };
    case "vote-record":
      return {
        id,
        author,
        content,
        media: randomVoteRecordMedia(),
        ...counts,
        ...actives,
      };
    case "endorsement":
      return {
        id,
        author,
        content,
        media: randomEndorsementMedia(),
        ...counts,
        ...actives,
      };
    case "commitment":
      return {
        id,
        author,
        content,
        media: randomCommitmentMedia(),
        ...counts,
        ...actives,
      };
    case "disclosure":
      return {
        id,
        author,
        content,
        media: randomDisclosureMedia(),
        ...counts,
        ...actives,
      };
    case "article":
      return {
        id,
        author,
        content: "",
        archetype: randomArticleArchetype(),
        ...counts,
        ...actives,
      };
    case "liveticker":
      return {
        id,
        author,
        content: "",
        archetype: randomLivetickerArchetype(),
        ...counts,
        ...actives,
      };
    case "decree":
      return {
        id,
        author,
        content: "",
        archetype: randomDecreeArchetype(),
        ...counts,
        ...actives,
      };
    case "testimony":
      return {
        id,
        author,
        content: "",
        archetype: randomTestimonyArchetype(),
        ...counts,
        ...actives,
      };
    case "repost": {
      const repostedSeed = pick(AUTHOR_SEEDS);
      const repostedAuthor = makeAuthor(repostedSeed, chance(0.2));
      return {
        id,
        author,
        content,
        relation: {
          kind: "repost",
          post: {
            author: repostedAuthor,
            content: pick(BODIES),
          },
        },
        ...counts,
        ...actives,
      };
    }
    case "comment": {
      const commentedSeed = pick(AUTHOR_SEEDS);
      const commentedAuthor = makeAuthor(commentedSeed, chance(0.2));
      return {
        id,
        author,
        content,
        relation: {
          kind: "comment",
          post: {
            author: commentedAuthor,
            content: pick(BODIES),
          },
        },
        ...counts,
        ...actives,
      };
    }
    case "quote": {
      const quotedSeed = pick(AUTHOR_SEEDS);
      const quotedAuthor = makeAuthor(quotedSeed, chance(0.2));
      // The source body is what the passage was supposedly drawn
      // from; the passage itself is a different `BODIES` line so the
      // demo reads as "outer poster pulled this verbatim span out of
      // the source" without us having to substring-slice the source.
      // Real product code would pass a literal slice of the source.
      return {
        id,
        author,
        content,
        relation: {
          kind: "quote",
          post: {
            author: quotedAuthor,
            content: pick(BODIES),
          },
          passage: pick(BODIES),
        },
        ...counts,
        ...actives,
      };
    }
    case "correction": {
      const correctedSeed = pick(AUTHOR_SEEDS);
      const correctedAuthor = makeAuthor(correctedSeed, chance(0.2));
      return {
        id,
        author,
        content,
        relation: {
          kind: "correction",
          post: {
            author: correctedAuthor,
            content: pick(BODIES),
          },
          note: pick(CORRECTION_NOTES),
        },
        ...counts,
        ...actives,
      };
    }
    case "retraction": {
      const retractedSeed = pick(AUTHOR_SEEDS);
      const retractedAuthor = makeAuthor(retractedSeed, chance(0.2));
      return {
        id,
        author,
        content,
        relation: {
          kind: "retraction",
          post: {
            author: retractedAuthor,
            content: pick(BODIES),
          },
          reason: pick(RETRACTION_REASONS),
        },
        ...counts,
        ...actives,
      };
    }
  }
}

/**
 * Generator that yields a fresh, randomly-fabricated {@link FeedItem}
 * every time `next()` is called. Infinite -- the `while (true)` loop
 * has no exit, so the return type is `never` and `.next().value`
 * always narrows to {@link FeedItem}.
 *
 * See the file-level JSDoc for the taxonomy of post types yielded, the
 * filtering options accepted via {@link RandomPostsOptions}, and the
 * "hold the generator across renders" caveat.
 *
 * @param options - Optional filters; see {@link RandomPostsOptions}.
 *   Defaults to `{}`, which rolls the body shape uniformly across every
 *   {@link RandomPostShape} code (the {@link "./FeedScreen".default}
 *   demo's behaviour).
 */
export function* randomPosts(
  options: RandomPostsOptions = {},
): Generator<FeedItem, never, unknown> {
  let n = 0;
  while (true) {
    // Re-roll the shape on every yield when the consumer didn't pin
    // one. Pinning happens by reading from `options.shape` *inside*
    // the loop rather than capturing once before the loop -- this way
    // a future consumer that mutates the options object between yields
    // would see the change. Cheap and matches the principle of least
    // surprise.
    const shape = options.shape ?? pick(SHAPES);
    yield buildRandomPost(n++, shape);
  }
}

/**
 * Drains `count` posts off a {@link randomPosts} generator into a fresh
 * array. Wrapping the `for` loop keeps call sites short and makes the
 * contract -- "drain N items off the iterator" -- explicit at every
 * use.
 *
 * Lives in this module rather than in any individual screen because
 * any kit screen that holds a {@link randomPosts} generator in state
 * will want this exact helper to seed the initial page and to extend
 * the array on every `onEndReached` firing.
 *
 * @param gen - A generator yielded by {@link randomPosts} (or any
 *   `Generator<FeedItem, never, unknown>`).
 * @param count - How many items to pull off the iterator. The
 *   generator is infinite so `count` is the only stopping condition.
 */
export function takeFromGenerator(
  gen: Generator<FeedItem, never, unknown>,
  count: number,
): FeedItem[] {
  const out: FeedItem[] = [];
  for (let i = 0; i < count; i++) {
    out.push(gen.next().value);
  }
  return out;
}
