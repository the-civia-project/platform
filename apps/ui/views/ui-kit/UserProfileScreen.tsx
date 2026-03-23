/**
 * UI Kit screen for {@link UserProfile}, the profile-page composition:
 * an X-style header (full-bleed banner, overlapping avatar with ring,
 * action overlay, identity stack, bio, meta row, stats row) followed
 * by a generic tab strip above a {@link "../../components/Feed".Feed}
 * body that swaps data on tab change.
 *
 * Like {@link "./FeedScreen".default}, this screen deliberately does
 * **not** wrap in {@link "../../components/Page".Page}: the
 * {@link UserProfile} is a vertical scroll container (it owns a Feed
 * inside), and nesting two vertical scrollers re-introduces the
 * gesture-conflict problem documented on `Feed.tsx`. The component is
 * mounted as the screen's only top-level child.
 *
 * Posts on each tab come from three independent random generators
 * (one per tab) so the user can scroll each tab without exhausting the
 * others. The three generators share an author pool but specialise on
 * the body shape:
 *
 * - `posts` -- text-only or text + image posts authored by the subject.
 * - `media` -- square image tiles in a three-column infinite grid.
 * - `reposts` -- posts authored by the subject that wrap an original
 *   via a {@link "../../components/Post".RepostRelation} on
 *   {@link "../../components/Post".PostProps.relation}, so the inset
 *   shows the user *amplifying* somebody else.
 * - `replies` -- posts authored by the subject that wrap an original
 *   via a {@link "../../components/Post".CommentRelation} on
 *   {@link "../../components/Post".PostProps.relation}, so the inset
 *   shows the user *responding* to somebody else.
 *
 * The screen runs the {@link UserProfile} in **uncontrolled** mode:
 * the kit owns the active-tab state internally and the screen reacts
 * via the `onTabChange` observer (a Metro log, in the demo). The
 * controlled `activeTabId` contract is still pinned by
 * `components/UserProfile/resolve-active-tab.test.ts` -- no on-screen
 * affordance is needed to exercise it.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Calendar,
  Link as LinkIcon,
  Mail,
  MoreVertical,
} from "lucide-react-native";
import Button, { IconButton } from "../../components/Button";
import type { FeedItem } from "../../components/Feed";
import type { ProfileProps } from "../../components/Profile";
import { Description } from "../../components/Typography";
import UserProfile, {
  type ResolveMediaThumbnailSource,
  type UserProfileMediaItem,
  type UserProfileMeta,
  type UserProfileStat,
  type UserProfileTabConfig,
} from "../../components/UserProfile";
import { randomAvatar } from "../../core/demo/random-avatar";

/**
 * Stable subject identity. One record per field so the
 * {@link UserProfile} API
 * (`avatar` / `name` / `handle` / `flag` / `location`) reads at the
 * call site without an extra adapter step.
 *
 * The demo deliberately pairs an RO nationality (`flag`) with a
 * non-RO residence (`location`) -- a Romanian citizen based in
 * Berlin -- so the screen exercises the kit's "flag is citizenship,
 * location is current city" split rather than letting visitors
 * assume the two are interchangeable redundant signals of the same
 * place.
 */
const SUBJECT = {
  avatar: randomAvatar("Aria"),
  name: "Aria Popescu",
  handle: "aria",
  flag: "RO",
  location: "Berlin, Germany",
} as const;

/**
 * Banner image URL. Sourced from Picsum so the demo runs offline-
 * lite (Picsum redirects to a CDN); pinned by seed so the same image
 * appears on every reload.
 */
const BANNER_URL = "https://picsum.photos/seed/aria-banner/1200/400";

/**
 * Counterparties Aria reposts and replies to. Mirrors a subset of the
 * {@link "./FeedScreen".default} author pool so visitors recognise the
 * cast across the kit.
 */
const COUNTERPARTIES: ProfileProps[] = [
  {
    source: randomAvatar("Felix"),
    name: "Felix Carter",
    flag: "US",
    from: "Brooklyn, NY",
  },
  {
    source: randomAvatar("Ren"),
    name: "Ren Müller",
    flag: "DE",
    from: "Munich, Germany",
  },
  {
    source: randomAvatar("Lin"),
    name: "Lin Tanaka",
    flag: "JP",
    from: "Tokyo, Japan",
  },
  {
    source: randomAvatar("Sara"),
    name: "Sara Becker",
    flag: "DE",
    from: "Berlin, Germany",
  },
  {
    source: randomAvatar("Mila"),
    name: "Mila Olteanu",
    flag: "RO",
    from: "Cluj, Romania",
  },
];

/**
 * Body pool Aria draws from for her own posts. Mid-length captions so
 * the column reads as a real personal timeline (long-form drafts, hike
 * notes, studio shots) without leaning on the heavier `LONG_BODIES`
 * set the {@link "./FeedScreen".default} generator uses.
 */
const POST_BODIES: string[] = [
  "Two weeks in on the new editorial pipeline -- the layout team got their first end-to-end preview run today and it landed. Writing up the retro tomorrow.",
  "Walking the Bucegi plateau in the fog this morning. The visibility dropped to twenty metres for the saddle stretch and I didn't see another hiker for an hour.",
  "Notebook scribbles from the strategy offsite. Three frameworks worth keeping, four worth throwing out, one worth a longer post.",
  "Released v0.5 of the colour-tokens package. Picker now exports the flat WCAG-AA array alongside the indexed tree -- two views of the same data, picked at the import site.",
  "Long bus ride. Re-reading the second draft of the comms doc and it still doesn't say the thing it needs to say in the first paragraph. Cutting half of it.",
  "First snow on Tâmpa this morning. Hiked up before sunrise and got the light I've been chasing for a month.",
];

/**
 * Body pool Aria uses when commenting on other posts -- short,
 * response-shaped sentences that read like Twitter / Bluesky replies.
 * Kept separate from {@link POST_BODIES} so the "Replies" tab feels
 * distinct from "Posts" even when the recycler skims close.
 */
const REPLY_BODIES: string[] = [
  "Strongly agree -- the cost driver was the validation in the producer, not the fuzzy match. We saw the same thing.",
  "Counterpoint: structured logging would have caught it earlier, but the alerting rule was the part that needed fixing.",
  "This is the post-mortem I've been waiting for -- point 2 alone is worth the whole read.",
  "Same lesson on our side. Took us a quarter to find it.",
  "Beautifully put. Quoting this in next week's review.",
  "Curious how the producer-side validation cost shows up in the new traces.",
];

/**
 * Originals the subject reposts or replies to. Each entry pairs an
 * author from {@link COUNTERPARTIES} with a body that reads as the
 * *post being referenced*, not the subject's commentary.
 */
const ORIGINAL_BODIES: string[] = [
  "Spent the afternoon rewriting our notification pipeline. Three lessons: validation belongs on the consumer, dedupe on (user_id, payload_hash) was 40% cheaper than fuzzy match, and structured logging would have caught it a week earlier.",
  "Eight months in: hire for slope not intercept, have the boring 1:1 every week even when nothing is wrong, write down the decision you didn't make.",
  "We finally killed the legacy bridge service. Two years of small migrations, one final week of cut-over. The graph is so much cleaner now.",
  "Two views of the same palette: an indexed tree for typed runtime lookup, and a flat array of WCAG-AA pairs for picker UIs.",
  "Why 1.5 is the wrong default line-height for body copy and what we settled on after three rounds of A/B tests.",
];

/**
 * The bio paragraph rendered below the identity stack. Free-form
 * editorial copy, the same texture as a real personal-site about
 * line.
 */
const BIO_TEXT =
  "Editorial pipelines, civic design, slower-paced internet. Walking the Carpathians whenever the desk lets me; otherwise reading notes and shipping the colour-tokens package.";

/**
 * The labels, ids, and contribution counts for the kit's tab strip.
 * Hoisted to module scope so the tabs array memo below stays small
 * (it only has to thread the per-tab feeds in).
 */
const TAB_DEFS: ReadonlyArray<{ id: string; label: string; count?: number }> = [
  { id: "posts", label: "Posts", count: 482 },
  { id: "reposts", label: "Reposts", count: 76 },
  { id: "replies", label: "Replies", count: 1240 },
  { id: "media", label: "Media", count: 318 },
];

/** Full-size Picsum URL for lightbox / preview on tile press. */
const mediaFullUrl = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/1200`;

/**
 * Demo thumbnail resolver: square edge matches one grid column at the
 * current device pixel ratio ({@link mediaGridThumbnailPixelSize}).
 */
const picsumMediaThumbnail: ResolveMediaThumbnailSource = (item, pixelSize) =>
  `https://picsum.photos/seed/${encodeURIComponent(item.id)}/${pixelSize}/${pixelSize}`;

/** Uniform pick from a non-empty readonly array. */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** `true` with probability `p` (in `[0, 1]`). */
function chance(p: number): boolean {
  return Math.random() < p;
}

/** Random integer in `[0, max)`. */
function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Lazily-realised engagement counts for one fabricated post.
 * Independent dice per axis so the recycler sees the full hide / show
 * matrix without crowding it.
 */
function randomCounts() {
  return {
    likeCount: chance(0.8) ? randInt(2500) : undefined,
    commentCount: chance(0.6) ? randInt(80) : undefined,
    repostCount: chance(0.5) ? randInt(200) : undefined,
  };
}

/**
 * Random toggle states (`liked`, `commented`, `reposted`). The
 * Reposts and Replies builders force the relevant axis on themselves
 * because every row on that tab *is* a re-post or a reply by the
 * subject; this helper only rolls the others.
 */
function randomActives() {
  return {
    liked: chance(0.3),
    commented: chance(0.15),
    reposted: chance(0.15),
  };
}

/**
 * Builds one fabricated `posts`-tab item. Plain text body (no media)
 * keeps the demo readable; the {@link "./FeedScreen".default} screen
 * already exercises every media shape against
 * {@link "../../components/Post".default}. The outer author is the
 * {@link SUBJECT} adapted from the {@link UserProfile} identity props
 * into the {@link "../../components/Profile".ProfileProps} shape the
 * {@link FeedItem} embeds.
 */
/**
 * Builds one fabricated `media`-tab tile. Square Picsum crops keep the
 * three-column grid visually even; `onPress` logs to Metro so the
 * demo exercises the optional preview affordance.
 */
function buildMediaItem(n: number): UserProfileMediaItem {
  const id = `up-media-${n}`;
  return {
    id,
    source: mediaFullUrl(id),
    alt: `Photo ${n + 1}`,
    aspectRatio: 1,
    onPress: () =>
      console.log(`[UserProfile demo] open full image ${id}`),
  };
}

function buildPostsItem(n: number): FeedItem {
  return {
    id: `up-posts-${n}`,
    author: subjectAsProfile(),
    content: pick(POST_BODIES),
    ...randomCounts(),
    ...randomActives(),
  };
}

/**
 * Builds one fabricated `reposts`-tab item: outer author is the
 * subject, the outer `content` is occasionally Aria's commentary (75%
 * of the time) and otherwise omitted (a "pure" re-share with no
 * commentary). The embedded original sits in
 * {@link "../../components/Post".PostProps.relation} as a
 * {@link "../../components/Post".RepostRelation} with a counterparty
 * author and an `ORIGINAL_BODIES` line. `reposted` is forced on
 * because every row on this tab represents an active re-post by the
 * subject.
 */
function buildRepostsItem(n: number): FeedItem {
  const counterparty = pick(COUNTERPARTIES);
  return {
    id: `up-reposts-${n}`,
    author: subjectAsProfile(),
    content: chance(0.75) ? pick(REPLY_BODIES) : undefined,
    relation: {
      kind: "repost",
      post: {
        author: counterparty,
        content: pick(ORIGINAL_BODIES),
      },
    },
    ...randomCounts(),
    ...randomActives(),
    reposted: true,
  };
}

/**
 * Builds one fabricated `replies`-tab item: outer author is the
 * subject, the outer `content` is the reply text (always present --
 * a reply without commentary would render as just an embedded inset,
 * which is the {@link buildRepostsItem} shape). The original sits in
 * {@link "../../components/Post".PostProps.relation} as a
 * {@link "../../components/Post".CommentRelation} with a counterparty
 * author. `commented` is forced on so the comment action shows the
 * "viewer has participated" treatment.
 */
function buildRepliesItem(n: number): FeedItem {
  const counterparty = pick(COUNTERPARTIES);
  return {
    id: `up-replies-${n}`,
    author: subjectAsProfile(),
    content: pick(REPLY_BODIES),
    relation: {
      kind: "comment",
      post: {
        author: counterparty,
        content: pick(ORIGINAL_BODIES),
      },
    },
    ...randomCounts(),
    ...randomActives(),
    commented: true,
  };
}

/**
 * Adapts the {@link SUBJECT} record into the
 * {@link "../../components/Profile".ProfileProps} shape used by the
 * {@link FeedItem.author} slot. The two shapes deliberately differ at
 * the {@link UserProfile} layer (separate avatar / name / handle /
 * flag / location props) but the embedded posts inside a feed row
 * still use the legacy compound shape, so the adapter lives here as
 * a thin bridge. {@link SUBJECT.location} carries through to the
 * embedded `from` so each in-feed post chip mirrors the header's
 * residence rather than the citizenship -- consistent with how the
 * top-level identity stack reads the two facts.
 */
function subjectAsProfile(): ProfileProps {
  return {
    source: SUBJECT.avatar,
    name: SUBJECT.name,
    flag: SUBJECT.flag,
    from: SUBJECT.location,
  };
}

/**
 * Generator factory: every tab uses the same shape (infinite stream
 * of {@link FeedItem}s, counter-keyed by `n`) but with a different
 * per-item builder. Wrapping the loop in a factory means the three
 * tabs can hold three independent counters at the same time -- if
 * they shared a generator, scrolling one would pull the other tabs'
 * ids forward and collide with previously-rendered rows.
 */
function makeGenerator<T>(
  build: (n: number) => T,
): Generator<T, never, unknown> {
  function* gen(): Generator<T, never, unknown> {
    let n = 0;
    while (true) {
      yield build(n++);
    }
  }
  return gen();
}

/** Posts pulled from each feed tab's generator per page append. */
const PAGE_SIZE = 6;

/** Media tiles appended each time the grid requests another page. */
const MEDIA_PAGE_SIZE = 300;

/** Initial media buffer on first paint (multiple of three for full rows). */
const MEDIA_INITIAL_SIZE = 300;

/**
 * Drains `count` items off the iterator into a fresh array. Same
 * helper as {@link "./FeedScreen".default} -- the call sites stay
 * short and the intent ("pull N off the generator") reads at every
 * use.
 */
function takeFromGenerator<T>(
  gen: Generator<T, never, unknown>,
  count: number,
): T[] {
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(gen.next().value);
  }
  return out;
}

/**
 * Default-exported screen registered with the UI Kit stack as
 * `user-profile`. Mounts the {@link UserProfile} as the screen's
 * only top-level child and seeds each tab with one page off its own
 * random generator; every `onEndReached` firing pulls another page.
 *
 * The screen runs the kit in uncontrolled mode (the kit owns the
 * active-tab state) and reacts to transitions via the `onTabChange`
 * observer, which logs to Metro so the demo trace stays visible.
 */
export default function UserProfileScreen() {
  // One generator per tab. Created once and held for the lifetime of
  // the screen so the per-tab counters survive re-renders -- a
  // generator re-created on every render would restart at `n = 0` and
  // collide with previously-rendered ids on every paint.
  const [postsGen] = useState(() => makeGenerator(buildPostsItem));
  const [mediaGen] = useState(() => makeGenerator(buildMediaItem));
  const [repostsGen] = useState(() => makeGenerator(buildRepostsItem));
  const [repliesGen] = useState(() => makeGenerator(buildRepliesItem));

  const [postsItems, setPostsItems] = useState<FeedItem[]>(() =>
    takeFromGenerator(postsGen, PAGE_SIZE),
  );
  const [mediaItems, setMediaItems] = useState<UserProfileMediaItem[]>(() =>
    takeFromGenerator(mediaGen, MEDIA_INITIAL_SIZE),
  );
  const [repostsItems, setRepostsItems] = useState<FeedItem[]>(() =>
    takeFromGenerator(repostsGen, PAGE_SIZE),
  );
  const [repliesItems, setRepliesItems] = useState<FeedItem[]>(() =>
    takeFromGenerator(repliesGen, PAGE_SIZE),
  );

  // Page counters are informational only (Metro log). Refs keep them
  // out of the render path; nothing on screen depends on the values.
  const postsPageRef = useRef(1);
  const mediaPageRef = useRef(1);
  const repostsPageRef = useRef(1);
  const repliesPageRef = useRef(1);

  // Per-tab refresh-in-flight booleans. Held independently so a pull
  // on one tab doesn't toggle the spinner on the others; the
  // `onRefresh` handlers below flip the matching slot to `true`
  // before the fake fetch and back to `false` when it resolves.
  const [postsRefreshing, setPostsRefreshing] = useState(false);
  const [mediaRefreshing, setMediaRefreshing] = useState(false);
  const [repostsRefreshing, setRepostsRefreshing] = useState(false);
  const [repliesRefreshing, setRepliesRefreshing] = useState(false);

  const onPostsEndReached = useCallback(() => {
    const page = ++postsPageRef.current;
    console.log(
      `[UserProfile demo] posts -- generating ${PAGE_SIZE} more (page ${page})`,
    );
    setPostsItems((prev) => [
      ...prev,
      ...takeFromGenerator(postsGen, PAGE_SIZE),
    ]);
  }, [postsGen]);

  const onMediaEndReached = useCallback(() => {
    const page = ++mediaPageRef.current;
    console.log(
      `[UserProfile demo] media -- generating ${MEDIA_PAGE_SIZE} more (page ${page})`,
    );
    setMediaItems((prev) => [
      ...prev,
      ...takeFromGenerator(mediaGen, MEDIA_PAGE_SIZE),
    ]);
  }, [mediaGen]);

  const onRepostsEndReached = useCallback(() => {
    const page = ++repostsPageRef.current;
    console.log(
      `[UserProfile demo] reposts -- generating ${PAGE_SIZE} more (page ${page})`,
    );
    setRepostsItems((prev) => [
      ...prev,
      ...takeFromGenerator(repostsGen, PAGE_SIZE),
    ]);
  }, [repostsGen]);

  const onRepliesEndReached = useCallback(() => {
    const page = ++repliesPageRef.current;
    console.log(
      `[UserProfile demo] replies -- generating ${PAGE_SIZE} more (page ${page})`,
    );
    setRepliesItems((prev) => [
      ...prev,
      ...takeFromGenerator(repliesGen, PAGE_SIZE),
    ]);
  }, [repliesGen]);

  const onTabChange = useCallback((id: string) => {
    console.log(`[UserProfile demo] active tab -> ${id}`);
  }, []);

  // Per-tab pull-to-refresh handlers. Each flips its matching
  // `refreshing` boolean to `true`, waits 1200ms (long enough for
  // the platform spinner to read as a real fetch), and prepends a
  // fresh page off the matching generator before flipping
  // `refreshing` back to `false`. Prepending (rather than replacing)
  // keeps the deep-scrolled rows the user already saw -- a real
  // product would diff against server data, but the demo is happy
  // showing "new posts arrived at the top".
  const onPostsRefresh = useCallback(async () => {
    console.log(`[UserProfile demo] posts -- pull-to-refresh`);
    setPostsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setPostsItems((prev) => [
      ...takeFromGenerator(postsGen, PAGE_SIZE),
      ...prev,
    ]);
    setPostsRefreshing(false);
  }, [postsGen]);

  const onMediaRefresh = useCallback(async () => {
    console.log(`[UserProfile demo] media -- pull-to-refresh`);
    setMediaRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setMediaItems((prev) => [
      ...takeFromGenerator(mediaGen, MEDIA_PAGE_SIZE),
      ...prev,
    ]);
    setMediaRefreshing(false);
  }, [mediaGen]);

  const onRepostsRefresh = useCallback(async () => {
    console.log(`[UserProfile demo] reposts -- pull-to-refresh`);
    setRepostsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setRepostsItems((prev) => [
      ...takeFromGenerator(repostsGen, PAGE_SIZE),
      ...prev,
    ]);
    setRepostsRefreshing(false);
  }, [repostsGen]);

  const onRepliesRefresh = useCallback(async () => {
    console.log(`[UserProfile demo] replies -- pull-to-refresh`);
    setRepliesRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setRepliesItems((prev) => [
      ...takeFromGenerator(repliesGen, PAGE_SIZE),
      ...prev,
    ]);
    setRepliesRefreshing(false);
  }, [repliesGen]);

  // Meta entries (joined date, links). Geographic facts -- nationality
  // (flag) and current residence (location) -- live on the identity
  // stack's flag row instead, so the meta row doesn't need a separate
  // MapPin entry. Memoised so the user-profile's header memo doesn't
  // blow up on every render of this screen.
  const meta = useMemo<UserProfileMeta[]>(
    () => [
      { icon: Calendar, label: "Joined March 2018" },
      { icon: LinkIcon, label: "aria.example/notes" },
      { icon: LinkIcon, label: "aria.example/colors" },
      { icon: LinkIcon, label: "github.com/aria-popescu" },
    ],
    [],
  );

  // Stats entries. Posts is display-only (no `onPress`); Followers
  // and Following are pressable, mirroring the social-media
  // convention where tapping the count opens the matching list.
  const stats = useMemo<UserProfileStat[]>(
    () => [
      { label: "Posts", value: 482 },
      {
        label: "Followers",
        value: 12_400,
        onPress: () =>
          console.log("[UserProfile demo] open followers list"),
      },
      {
        label: "Following",
        value: 312,
        onPress: () =>
          console.log("[UserProfile demo] open following list"),
      },
    ],
    [],
  );

  // Action row over the banner. Every cell uses the {@link Button}
  // `inverted` variant -- the card fill + emphasis border reads as a
  // floating chip against the banner image, which is the look the
  // X-style header expects (and keeps the three actions visually
  // matched rather than mixing a filled primary CTA with two ghost
  // icon buttons). The horizontal wrapper carries `gap` so the cells
  // sit side-by-side; each press logs to Metro since the demo
  // doesn't ship a follow / message flow.
  const actions = useMemo(
    () => (
      <View style={styles.actionsRow}>
        <Button
          variant="inverted"
          onPress={() => console.log("[UserProfile demo] follow tapped")}
        >
          Follow
        </Button>
        <IconButton
          icon={Mail}
          accessibilityLabel="Message"
          variant="inverted"
          shape="round"
          onPress={() => console.log("[UserProfile demo] message tapped")}
        />
        <IconButton
          icon={MoreVertical}
          accessibilityLabel="More options"
          variant="inverted"
          shape="round"
          onPress={() => console.log("[UserProfile demo] menu tapped")}
        />
      </View>
    ),
    [],
  );

  // The kit's tab descriptors. Memoised on the per-tab arrays + the
  // paging callbacks so re-renders that don't touch the underlying
  // state don't rebuild the tabs array. The static `TAB_DEFS`
  // supplies the labels and counts; each tab's feed wires the
  // matching paging state.
  const tabs = useMemo<[UserProfileTabConfig, ...UserProfileTabConfig[]]>(
    () => [
      {
        id: TAB_DEFS[0].id,
        label: TAB_DEFS[0].label,
        count: TAB_DEFS[0].count,
        feed: {
          posts: postsItems,
          onEndReached: onPostsEndReached,
          onRefresh: onPostsRefresh,
          refreshing: postsRefreshing,
        },
      },
      {
        id: TAB_DEFS[1].id,
        label: TAB_DEFS[1].label,
        count: TAB_DEFS[1].count,
        feed: {
          posts: repostsItems,
          onEndReached: onRepostsEndReached,
          onRefresh: onRepostsRefresh,
          refreshing: repostsRefreshing,
        },
      },
      {
        id: TAB_DEFS[2].id,
        label: TAB_DEFS[2].label,
        count: TAB_DEFS[2].count,
        feed: {
          posts: repliesItems,
          onEndReached: onRepliesEndReached,
          onRefresh: onRepliesRefresh,
          refreshing: repliesRefreshing,
        },
      },
      {
        id: TAB_DEFS[3].id,
        label: TAB_DEFS[3].label,
        count: TAB_DEFS[3].count,
        media: {
          images: mediaItems,
          onEndReached: onMediaEndReached,
          onRefresh: onMediaRefresh,
          refreshing: mediaRefreshing,
          resolveThumbnailSource: picsumMediaThumbnail,
        },
      },
    ],
    [
      postsItems,
      mediaItems,
      repostsItems,
      repliesItems,
      onPostsEndReached,
      onMediaEndReached,
      onRepostsEndReached,
      onRepliesEndReached,
      onPostsRefresh,
      onMediaRefresh,
      onRepostsRefresh,
      onRepliesRefresh,
      postsRefreshing,
      mediaRefreshing,
      repostsRefreshing,
      repliesRefreshing,
    ],
  );

  return (
    <View style={styles.screen}>
      <UserProfile
        avatar={SUBJECT.avatar}
        name={SUBJECT.name}
        handle={SUBJECT.handle}
        flag={SUBJECT.flag}
        location={SUBJECT.location}
        banner={{ source: BANNER_URL }}
        bio={<Description>{BIO_TEXT}</Description>}
        meta={meta}
        stats={stats}
        actions={actions}
        tabs={tabs}
        onTabChange={onTabChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Root frame for the screen -- a plain `flex: 1` `View` that gives
   * the {@link UserProfile}'s inner Feed a definite height to
   * virtualise against.
   */
  screen: {
    flex: 1,
  },
  /**
   * Layout for the actions slot that the {@link UserProfile} renders
   * over the banner. Horizontal row, small gap between cells; the
   * outer slot is right-anchored by the user-profile so this row
   * only needs to lay its own cells side-by-side.
   */
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
