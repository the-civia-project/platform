/**
 * UI Kit screen for {@link Feed}, the infinite-scrolling stream of
 * {@link "../../components/Post".default}s built on `@shopify/flash-list`.
 *
 * Unlike every other kit screen, this one **does not wrap in
 * {@link "../../components/Page".Page}**. The Feed is itself a vertical
 * scroll container, and nesting two vertical scrollers on mobile
 * produces ambiguous gesture handling: the outer one wins the pan and
 * the inner recycler never gets to scroll (web does the right thing only
 * by accident, because wheel events bubble). The Feed is therefore
 * mounted as the screen's top-level child, and the kit-style prose intro
 * (Lede, Section heading, description, usage caption) is pushed into the
 * Feed's {@link FeedProps.ListHeaderComponent} slot so it scrolls
 * together with the post list above the first row.
 *
 * Posts come from {@link randomPosts}, the shared kit demo generator
 * (see {@link "./random-posts"} for the data shape, the taxonomy of
 * yielded post types, and the filtering options). This screen calls
 * it with no arguments, so a generously long scroll surfaces every
 * body shape, archetype teaser, and relation variant the generator
 * implements (see {@link "./random-posts"}). The seed page is the first
 * eight yields; every {@link FeedProps.onEndReached} firing pulls
 * another eight via {@link takeFromGenerator}.
 *
 * A circular reset {@link IconButton} (the {@link RotateCcw} icon) floats
 * in the bottom-right corner above the safe-area inset. Tapping it just
 * tells the {@link FeedHandle} to scroll back to the top of the post
 * list -- the data itself is untouched (no fresh page off the generator,
 * no page-counter reset), so it reads as a "jump to top" affordance
 * rather than a destructive action.
 *
 * The nine Feed-level callbacks ({@link FeedProps.onPostPress},
 * {@link FeedProps.onPostLike}, {@link FeedProps.onPostComment},
 * {@link FeedProps.onPostRepost}, {@link FeedProps.onPostBookmark},
 * {@link FeedProps.onPostShare}, {@link FeedProps.onPostMention},
 * {@link FeedProps.onPostUrlPress}, {@link FeedProps.onPostHashtag}) are all
 * wired here. Like, Re-post, and Bookmark mutate state in place so the demo
 * flips boolean (+ count where applicable) round-trip as you tap; Comment,
 * Share, "open post", inline
 * `@`-mention, inline URL, and inline `#`-hashtag presses log to
 * Metro since the demo doesn't ship a compose UI, share sheet,
 * detail-view navigator, profile router, URL opener, or hashtag
 * feed. Watch the JS console as you scroll to see each callback
 * fire with the matching {@link FeedItem.id} -- mention presses
 * additionally surface the tapped handle, URL presses the raw
 * `href` (scheme intact), hashtag presses the bare tag (no `#`
 * prefix), so the routing wiring is visible too.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { RotateCcw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Accordion } from "../../components/Accordion";
import Button, { IconButton } from "../../components/Button";
import { Feed, type FeedHandle, type FeedItem } from "../../components/Feed";
import { Section } from "../../components/Section";
import {
  Caption,
  Code,
  Description,
  Eyebrow,
  Label,
  Lede,
  Text,
} from "../../components/Typography";
import { useTheme } from "../../components/use-theme";
import { randomPosts, takeFromGenerator } from "../../core/demo/random-posts";

/** Number of posts pulled from {@link randomPosts} per page. */
const PAGE_SIZE = 8;

/** Number of posts in the {@link Variant} `"finite"` slice -- short on purpose so the user can scroll to the end without grinding through pages. */
const FINITE_SIZE = 3;

/**
 * Which of the three {@link Feed} shapes the screen is currently rendering.
 * Selected by the in-header variant picker; each value resolves to a
 * different combination of `posts`, `hasMore`, `onEndReached`, and
 * `emptyState` props on the same {@link Feed} instance.
 */
type Variant = "infinite" | "finite" | "empty";

/** Variant picker entries, declared once so the picker JSX stays a flat `.map`. */
const VARIANTS: ReadonlyArray<{ id: Variant; label: string }> = [
  { id: "infinite", label: "Infinite" },
  { id: "finite", label: "Finite" },
  { id: "empty", label: "Empty" },
];

/**
 * Sticky-header toggle entries -- two options ("Off" / "On") rendered
 * by the same picker shape as {@link VARIANTS}. Pulling the entries to
 * module scope keeps the toggle JSX a flat `.map` matching the variant
 * picker; the {@link FeedScreen}-level state holds the resolved
 * boolean.
 */
const STICKY_OPTIONS: ReadonlyArray<{ id: "off" | "on"; label: string }> = [
  { id: "off", label: "Off" },
  { id: "on", label: "On" },
];

const styles = StyleSheet.create({
  /**
   * Root frame for the screen -- a plain `flex: 1` `View` that gives the
   * {@link Feed} a definite height to virtualise against and provides
   * the positioning context for the absolutely-positioned reset FAB
   * stacked over it.
   */
  screen: {
    flex: 1,
  },
  /**
   * Kit-prose container rendered above the first post via
   * {@link FeedProps.ListHeaderComponent}. Horizontal padding matches
   * {@link "../../components/Page".Page}'s `paddingHorizontal: 20` so
   * the prose column lines up with the post bodies below (which carry
   * their own matching padding from {@link Feed}'s `styles.item`); the
   * top padding mirrors `Page`'s `paddingTop: 16` so the visual rhythm
   * lands close to a kit screen's even though we deliberately don't use
   * Page here.
   */
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  /**
   * Small breathing room between {@link Section}'s default trailing
   * description and the API caption, so the two lines read as two rows
   * rather than a single dense paragraph.
   */
  usageLine: {
    marginTop: 8,
  },
  /**
   * Horizontal row holding the variant-picker {@link Button}s. `gap: 8`
   * separates the three pills; `flexWrap: "wrap"` lets the row reflow on
   * narrow surfaces so the picker stays usable even at the smallest
   * supported widths. `marginTop` keeps the row clear of the Description
   * paragraph above it.
   */
  variantPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  /**
   * Anchor for the floating reset {@link IconButton}. `position: "absolute"`
   * lifts the slot out of the {@link styles.screen} flow so it floats over
   * the {@link Feed}; the right edge is pinned 24 logical pixels from the
   * screen edge for a comfortable thumb reach, and the bottom offset is
   * applied inline (`insets.bottom + 24`) so the FAB sits clear of the
   * home indicator / nav bar on devices with non-zero safe-area insets.
   *
   * The slot itself sizes to the FAB (`width: 48`, `height: 48` from
   * {@link IconButton}'s `size="lg"`), so the absolutely-positioned
   * footprint is exactly the tappable area -- everything outside the FAB
   * remains a hit target for the {@link Feed} below. `pointerEvents:
   * "box-none"` on the JSX node belt-and-braces the behaviour: if the
   * wrapper ever grows to enclose extra padding, taps in the padding
   * still pass through to the recycler.
   */
  fabSlot: {
    position: "absolute",
    right: 24,
  },
  /**
   * Sticky-demo toolbar layout. Horizontal row, identity-style padding
   * (matches {@link "../../components/Page".Page}'s `paddingHorizontal:
   * 20` so the label lines up with post bodies below); bottom hairline
   * fills inline from {@link Theme.borderDefault} so the strip ends on
   * a clear baseline rule.
   */
  stickyBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  /**
   * "Latest posts" label inside {@link styles.stickyBar}. Bolder than
   * the kit's body text so it reads as the strip's headline rather
   * than commentary copy.
   */
  stickyLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  /**
   * Hint copy paired with {@link styles.stickyLabel}. Caption rhythm
   * (13/19) so it sits one notch smaller than the label, painted in
   * {@link Theme.fgMuted} so it reads as a footnote.
   */
  stickyHint: {
    fontSize: 13,
    lineHeight: 19,
  },
});

/**
 * Header rendered above the first post via
 * {@link FeedProps.ListHeaderComponent}. Carries the kit's standard
 * Lede + Section heading + description + API caption that would normally
 * live inside a {@link "../../components/Page".Page} -- but because the
 * Feed is the screen's only vertical scroll container, the prose has to
 * scroll *with* the feed body rather than alongside it.
 *
 * The header also hosts the variant picker (a row of three pill
 * {@link "../../components/Button".default}s) that toggles the demo
 * between the canonical infinite stream, a finite three-post list, and
 * an empty feed paired with an explanatory empty state. Selection
 * state is held by the parent {@link FeedScreen}; this component
 * receives the current {@link Variant} and an `onVariantPress` callback
 * via props. The header is memoised in {@link FeedScreen} so the
 * element identity only changes on a real variant transition -- post
 * appends (every {@link FeedProps.onEndReached} firing) leave the
 * header intact and FlashList keeps its measurement cached.
 */
function FeedKitHeader({
  variant,
  onVariantPress,
  sticky,
  onStickyPress,
}: {
  variant: Variant;
  onVariantPress: (variant: Variant) => void;
  sticky: "off" | "on";
  onStickyPress: (next: "off" | "on") => void;
}) {
  return (
    <View style={styles.header}>
      <Lede>
        <Code>Feed</Code> is the kit's infinite-scrolling stream of{" "}
        <Code>Post</Code>s, built on <Code>@shopify/flash-list</Code>.
        The bottom edge is intentionally unreachable &mdash; the
        spinner footer always reads as "more is coming", and{" "}
        <Code>onEndReached</Code> fires a full screen before the
        rendered end so the consumer has time to honour the contract.
      </Lede>

      <Section
        title="Feed"
        subtitle="Infinite-scrolling Post stream with always-on loading footer."
      >
        <Accordion
          summary={
            <Description>
              Wire <Code>onEndReached</Code> to append the next page to{" "}
              <Code>posts</Code>; the parent owns paging state and the
              Feed mutates nothing.
            </Description>
          }
        >
          <Description>
            Each row carries a stable <Code>id</Code> for FlashList
            key&shy;ing, and the rest of the row is forwarded verbatim
            to <Code>Post</Code> &mdash; including media,{" "}
            <Code>relation</Code> (a repost / comment / quote /
            correction / retraction variant of{" "}
            <Code>PostRelation</Code>), and the engagement counters. The posts below come from{" "}
            <Code>randomPosts()</Code>, a long-lived generator that
            yields a fresh randomly-fabricated <Code>FeedItem</Code>{" "}
            on every <Code>next()</Code> call &mdash; the seed page is
            the first eight yields and every <Code>onEndReached</Code>{" "}
            firing pulls another eight. With enough scrolling, every
            taxonomy item documented in the <Code>random-posts.ts</Code>{" "}
            module header eventually surfaces. The generator never produces
            rows with an inline comment thread &mdash; feeds in this
            codebase keep their threads collapsed and open them on the
            post-detail view, so the row data deliberately omits{" "}
            <Code>showComments</Code> and <Code>comments</Code>. Author,
            body length, engagement counts, and active states all roll
            independently on top, so the recycler exercises every
            shape along every sub-axis. The kebab overflow stays off
            for every row &mdash; <Code>Feed</Code> blocks per-row
            kebabs on principle (noisy affordance on a repeating line),
            so the generator never bothers rolling it. Each{" "}
            <Code>onEndReached</Code> firing also prints a "generating
            N more random posts (page N)" line to Metro so you can
            watch the callback chain as you scroll. The circular reset
            button floating bottom-right uses the <Code>Feed</Code>'s
            ref handle to scroll back to the top of the post list
            &mdash; it doesn't touch the data, so tapping it after deep
            scrolling jumps you back to <Code>random-0</Code> without
            forfeiting any of the rows you've already pulled in.
            {"\n\n"}
            Nine Feed-level callbacks are wired into this demo so you
            can see each intent fire end-to-end.{" "}
            <Code>onPostLike</Code> and <Code>onPostRepost</Code> flip the
            matching boolean + count directly on the row in state;{" "}
            <Code>onPostBookmark</Code> flips bookmarked on/off with no
            count. All three feel fully round-trippy
            (the counts respect <Code>Post</Code>'s "active means at
            least 1" invariant on the way up and floor at 0 on the way
            down). <Code>onPostComment</Code>, <Code>onPostShare</Code>,
            <Code>onPostMention</Code>, <Code>onPostUrlPress</Code>,
            <Code>onPostHashtag</Code>, and <Code>onPostPress</Code>{" "}
            log to Metro: in a real product they'd hand off to a
            compose UI, the native share sheet, a profile router, a
            URL opener (typically <Code>Linking.openURL</Code>), a
            hashtag feed, and a detail-view navigator respectively.{" "}
            <Code>onPostMention</Code>, <Code>onPostUrlPress</Code>,
            and <Code>onPostHashtag</Code> all arrive with both the
            row and the tapped payload (a bare handle without the{" "}
            <Code>@</Code> for mentions, a raw <Code>href</Code> with
            scheme intact for URLs, a bare tag without the{" "}
            <Code>#</Code> for hashtags) so a single Feed-level
            callback can drive routing for every inline link of that
            kind across the screen. Tapping anywhere on a row that
            isn't an action button, an inline mention, an inline URL,
            an inline hashtag, an embedded post inset, or a media
            tile counts as a row press &mdash; React Native's
            responder system lets the inner pressables win their own
            touches, so action presses never accidentally double as
            "open detail".
          </Description>
        </Accordion>

        <View style={styles.usageLine}>
          <Caption>
            <Label>API: </Label>
            <Code>{`<Feed posts={posts} onEndReached={loadMore} onPostPress={open} onPostLike={toggleLike} onPostComment={openThread} onPostRepost={toggleRepost} onPostBookmark={toggleBookmark} onPostShare={share} onPostMention={openProfile} onPostUrlPress={openUrl} onPostHashtag={openHashtag} />`}</Code>
          </Caption>
        </View>
      </Section>

      <Section
        title="Variants"
        subtitle="hasMore and emptyState shape the bottom of the feed."
      >
        <Description>
          <Code>hasMore</Code> (default <Code>true</Code>) gates the
          spinner footer and the <Code>onEndReached</Code> callback.
          Flip it to <Code>false</Code> for a finite list &mdash; the
          feed ends cleanly at the last post and no further pages are
          requested. <Code>emptyState</Code> renders in the recycler's
          empty slot when <Code>posts</Code> is empty, replacing the
          spinner with the consumer's "nothing here" message. Pick a
          variant below to drive the demo Feed into each shape:
        </Description>

        <View style={styles.variantPicker} accessibilityRole="tablist">
          {VARIANTS.map((entry) => {
            const isActive = entry.id === variant;
            return (
              <Button
                key={entry.id}
                variant={isActive ? "primary" : "ghost"}
                onPress={() => onVariantPress(entry.id)}
              >
                {entry.label}
              </Button>
            );
          })}
        </View>

        <View style={styles.usageLine}>
          <Caption>
            <Label>API: </Label>
            <Code>{`<Feed posts={posts} onEndReached={loadMore} hasMore={hasMore} emptyState={<Empty />} />`}</Code>
          </Caption>
        </View>
      </Section>

      <Section
        title="Pull to refresh"
        subtitle="onRefresh + refreshing wire the platform spinner at the top."
      >
        <Description>
          <Code>onRefresh</Code> opts the Feed into React Native's{" "}
          <Code>RefreshControl</Code>: pulling down past the top edge
          fires the callback and surfaces the platform-native spinner
          while the consumer fetches. <Code>refreshing</Code> is the
          boolean the consumer holds to indicate "still working". The
          demo wires this on the Infinite variant only -- pull down
          on the post column and watch the 1.2s fake fetch prepend a
          fresh page; toggle to Finite or Empty and the gesture is
          gone (the kit hides the spinner entirely when the consumer
          doesn't pass <Code>onRefresh</Code>).
        </Description>

        <View style={styles.usageLine}>
          <Caption>
            <Label>API: </Label>
            <Code>{`<Feed posts={posts} onEndReached={loadMore} onRefresh={fetchLatest} refreshing={isFetching} />`}</Code>
          </Caption>
        </View>
      </Section>

      <Section
        title="Sticky header"
        subtitle="Pin a React node to the top of the post column on scroll."
      >
        <Description>
          <Code>stickyHeader</Code> rides at the top of the post
          column. While the rest of{" "}
          <Code>ListHeaderComponent</Code> (this prose, the section
          headings, the picker rows) is still visible, the sticky sits
          in document flow below it; once the user scrolls past, the
          sticky pins to the viewport's top edge and the posts
          continue scrolling underneath. Paint of choice is{" "}
          <Code>theme.surfaceCard</Code> so feed bodies don't bleed
          through.
        </Description>

        <View style={styles.variantPicker} accessibilityRole="tablist">
          {STICKY_OPTIONS.map((entry) => {
            const isActive = entry.id === sticky;
            return (
              <Button
                key={entry.id}
                variant={isActive ? "primary" : "ghost"}
                onPress={() => onStickyPress(entry.id)}
              >
                {entry.label}
              </Button>
            );
          })}
        </View>

        <View style={styles.usageLine}>
          <Caption>
            <Label>API: </Label>
            <Code>{`<Feed posts={posts} onEndReached={loadMore} stickyHeader={<Toolbar />} />`}</Code>
          </Caption>
        </View>
      </Section>
    </View>
  );
}

/**
 * Demo sticky-header node. Mimics the kind of strip a real product
 * would mount here -- a "Latest" label paired with a soft hairline
 * underneath -- so the user can see what the canonical surface looks
 * like when pinned. Painted on top of the {@link Feed}'s own
 * surface-card wrapper, so this node only contributes layout
 * (padding) and copy.
 *
 * Kept as its own component (rather than inlined into the FeedScreen
 * memo) so the `useTheme` call lives at the right level and the
 * styles read adjacent to the toolbar copy.
 */
function StickyDemoBar() {
  const theme = useTheme();
  return (
    <View
      style={[styles.stickyBar, { borderBottomColor: theme.borderDefault }]}
    >
      <Text style={[styles.stickyLabel, { color: theme.fgEmphasis }]}>
        Latest posts
      </Text>
      <Text style={[styles.stickyHint, { color: theme.fgMuted }]}>
        Scrolls under
      </Text>
    </View>
  );
}

/**
 * Empty-state node rendered by the {@link Feed} when the demo is in the
 * `"empty"` variant. Lives at module scope so the same element instance
 * is reused across renders &mdash; React's reference equality is enough
 * to keep FlashList's empty-slot measurement cached.
 */
const EMPTY_STATE_NODE = (
  <>
    <Eyebrow>No posts</Eyebrow>
    <Description>
      This feed has nothing to show right now. Pass{" "}
      <Code>emptyState</Code> when <Code>posts</Code> is empty to
      render this message in place of the spinner footer.
    </Description>
  </>
);

/**
 * Default-exported screen registered with the UI Kit stack as `feed`.
 *
 * Mounts the {@link Feed} directly as the screen's root child (no
 * {@link "../../components/Page".Page} wrapper) -- see the file header
 * for why. The kit prose lives in {@link FeedKitHeader} and rides along
 * with the feed body via {@link FeedProps.ListHeaderComponent}. A
 * floating reset {@link IconButton} sits over the bottom-right corner
 * of the feed, anchored above the safe-area inset; tapping it scrolls
 * back to the top of the post list via the {@link FeedHandle} ref
 * without touching the underlying data.
 *
 * The nine Feed-level callbacks are wired to interactive demos:
 * `onPostLike` and `onPostRepost` flip boolean + count; `onPostBookmark`
 * flips bookmarked only (no count). All three feel round-trippy.
 * `onPostComment`, `onPostShare`,
 * `onPostMention`,
 * `onPostUrlPress`, `onPostHashtag`, and `onPostPress` log to Metro,
 * standing in for the compose UI, native share sheet, profile
 * router, URL opener, hashtag feed, and detail-view navigation a
 * real product would wire here -- none of them mutate state,
 * because the generator never produces rows with an inline comment
 * thread or structured-content mentions / URLs / hashtags and the
 * demo deliberately doesn't fake one
 * on click.
 *
 * The header's variant picker drives the screen-level {@link Variant}
 * state, which the {@link Feed} JSX below reads via
 * {@link resolveVariantProps} to swap its `posts` / `hasMore` /
 * `onEndReached` / `emptyState` props in one branch. The engagement
 * handlers attempt the toggle against both the infinite-stream array
 * and the finite slice; whichever array hosts the row applies the
 * update, the other silently no-ops on its `prev.map` since the id
 * isn't there.
 */
export default function FeedScreen() {
  const [variant, setVariant] = useState<Variant>("infinite");
  // Sticky-header toggle. Held separately from {@link Variant} so the
  // sticky stays on across variant flips (or vice versa). Mapped to
  // the actual `stickyHeader` prop via `sticky === "on" ?
  // STICKY_NODE : undefined` at the Feed call site.
  const [sticky, setSticky] = useState<"off" | "on">("off");
  // Pull-to-refresh state. Held here (rather than inside
  // {@link handleRefresh}) so the spinner reflects the latest value
  // across re-renders -- React Native's `RefreshControl` reads
  // `refreshing` on every render, so any storage that survives one
  // render works (a ref wouldn't, since the spinner's view never
  // re-reads).
  const [refreshing, setRefreshing] = useState(false);
  // Infinite-stream generator is created once and reused for the
  // lifetime of the screen -- {@link handleEndReached} keeps pulling
  // fresh items off it as the user scrolls. There's deliberately no
  // reset path: the reset button is a pure scroll-to-top affordance
  // now (see {@link handleReset}), so nothing ever swaps the generator
  // out from under the feed.
  const [generator] = useState(() => randomPosts());
  const [posts, setPosts] = useState<FeedItem[]>(() =>
    takeFromGenerator(generator, PAGE_SIZE),
  );
  // Finite-variant posts are drawn from a throwaway generator and
  // frozen at mount, so toggling the variant picker back and forth
  // doesn't redraw the three rows the user just looked at. A
  // standalone state slot (rather than `useMemo`) keeps the engagement
  // handlers symmetrical with the infinite variant: both arrays are
  // setState targets so Like / Repost / Comment can flip booleans on
  // either side without branching on the active variant.
  const [finitePosts, setFinitePosts] = useState<FeedItem[]>(() =>
    takeFromGenerator(randomPosts(), FINITE_SIZE),
  );
  // Page counter is informational (Metro log only), so a ref is cheaper
  // than state -- nothing renders against it.
  const pageRef = useRef(1);
  // Imperative handle into the Feed -- the {@link handleReset} button
  // uses it to drive `scrollToTop({ animated: true })`, which is the
  // entire job of the reset affordance now that the data stays put.
  const feedRef = useRef<FeedHandle>(null);
  const insets = useSafeAreaInsets();

  const handleEndReached = useCallback(() => {
    const page = ++pageRef.current;
    console.log(
      `[Feed demo] onEndReached -- generating ${PAGE_SIZE} more random posts (page ${page})`,
    );
    setPosts((prev) => [...prev, ...takeFromGenerator(generator, PAGE_SIZE)]);
  }, [generator]);

  // "Reset" is a position-only operation: the button just walks the
  // feed back to the first post via the {@link FeedHandle} so the user
  // can re-skim from the top after a deep scroll. The data array, the
  // page counter, and the generator are intentionally untouched -- a
  // destructive "throw away all loaded posts" reset would be a
  // different affordance and is deliberately not what this button does.
  const handleReset = useCallback(() => {
    feedRef.current?.scrollToTop({ animated: true });
  }, []);

  // Variant transition snaps the feed back to the top so the new
  // first post lands at offset 0 -- otherwise the previous scroll
  // offset (which can sit deep into a stale array) would map onto an
  // arbitrary row of the new variant's data, or onto the empty slot.
  // The `setVariant` updater bails on a re-tap of the active variant
  // so {@link FeedHandle.scrollToTop} can still fire as the "jump to
  // top" affordance without forcing a no-op re-render.
  const handleVariantPress = useCallback((next: Variant) => {
    setVariant((prev) => (prev === next ? prev : next));
    feedRef.current?.scrollToTop({ animated: true });
  }, []);

  // Sticky toggle. Same bail-on-noop shape as the variant picker;
  // also fires `scrollToTop` on a real transition so the user can see
  // the sticky strip arrive (or leave) from a known scroll position
  // rather than mid-scroll where the visual cue is harder to read.
  const handleStickyPress = useCallback((next: "off" | "on") => {
    setSticky((prev) => (prev === next ? prev : next));
    feedRef.current?.scrollToTop({ animated: true });
  }, []);

  // Pull-to-refresh handler. Flips `refreshing` to `true`, waits
  // 1200ms (long enough for the platform spinner to read as a real
  // fetch), pulls a fresh page off the generator, and prepends it
  // to {@link posts} so the user can see "new posts arrived at the
  // top". Mirrors the {@link UserProfileScreen}'s per-tab refresh
  // shape so the contract demos identically on both screens.
  const handleRefresh = useCallback(async () => {
    console.log("[Feed demo] onRefresh -- pulling a fresh page");
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setPosts((prev) => [...takeFromGenerator(generator, PAGE_SIZE), ...prev]);
    setRefreshing(false);
  }, [generator]);

  // `setPosts((prev) => ...)` keeps the toggle correct across rapid
  // taps and concurrent state updates -- the callback's `post` argument
  // is the snapshot at *render* time, so we use `post.id` to find the
  // row and read the *latest* `liked` from inside the updater. Both
  // the infinite and finite arrays receive the update: whichever one
  // contains the row mutates, the other no-ops on its `prev.map` since
  // the id isn't present. The count math mirrors the kit's invariant
  // in {@link Post}'s PostAction: `liked: true` always shows at least
  // 1, so unliking drops the count by 1 floored at 0 and liking adds 1
  // from `?? 0`.
  const handlePostLike = useCallback((post: FeedItem) => {
    const apply = (prev: FeedItem[]) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked: !p.liked,
              likeCount: p.liked
                ? Math.max((p.likeCount ?? 0) - 1, 0)
                : (p.likeCount ?? 0) + 1,
            }
          : p,
      );
    setPosts(apply);
    setFinitePosts(apply);
  }, []);

  // Same toggle shape as {@link handlePostLike} but against
  // `reposted` / `repostCount`. Kept as a sibling rather than a
  // factored helper because the two intents read better at the call
  // site as independent handlers (`onPostLike`, `onPostRepost`) and
  // the body is short enough that the duplication isn't worth a
  // closure-over-key helper.
  const handlePostRepost = useCallback((post: FeedItem) => {
    const apply = (prev: FeedItem[]) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              reposted: !p.reposted,
              repostCount: p.reposted
                ? Math.max((p.repostCount ?? 0) - 1, 0)
                : (p.repostCount ?? 0) + 1,
            }
          : p,
      );
    setPosts(apply);
    setFinitePosts(apply);
  }, []);

  // Comment is an *intent* signal in this demo: the generator never
  // produces rows with an inline `comments` array, so toggling
  // {@link Post.showComments} would be a no-op visually. A real product
  // would open a compose sheet or navigate to the post detail focused
  // on the reply field; the demo stands in with a console line that
  // shows the callback fired with the right row context.
  const handlePostComment = useCallback((post: FeedItem) => {
    console.log(
      `[Feed demo] onPostComment -- user wants to comment on ${post.id} by ${post.author.name}`,
    );
  }, []);

  const handlePostShare = useCallback((post: FeedItem) => {
    console.log(
      `[Feed demo] onPostShare -- user wants to share ${post.id} by ${post.author.name}`,
    );
  }, []);

  const handlePostBookmark = useCallback((post: FeedItem) => {
    const apply = (prev: FeedItem[]) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, bookmarked: !p.bookmarked } : p,
      );
    setPosts(apply);
    setFinitePosts(apply);
  }, []);

  // Inline mention press. Real products would navigate to the
  // mentioned user's profile; the demo logs the row context + bare
  // handle so the wiring is visible in the console as a smoke test
  // for the Feed-level {@link FeedProps.onPostMention} pass-through.
  const handlePostMention = useCallback(
    (post: FeedItem, handle: string) => {
      console.log(
        `[Feed demo] onPostMention -- @${handle} tapped inside ${post.id} by ${post.author.name}`,
      );
    },
    [],
  );

  // Inline URL press. Real products typically call
  // {@link Linking.openURL} (RN) or {@link window.open} (web); the
  // demo logs the row context + raw `href` (scheme intact) so the
  // wiring is visible in the console as a smoke test for the
  // Feed-level {@link FeedProps.onPostUrlPress} pass-through.
  const handlePostUrlPress = useCallback(
    (post: FeedItem, href: string) => {
      console.log(
        `[Feed demo] onPostUrlPress -- ${href} tapped inside ${post.id} by ${post.author.name}`,
      );
    },
    [],
  );

  // Inline hashtag press. Real products would navigate to the
  // hashtag's feed (search filter, topic page, trending detail);
  // the demo logs the row context + bare tag (no `#` prefix) so the
  // wiring is visible in the console as a smoke test for the
  // Feed-level {@link FeedProps.onPostHashtag} pass-through.
  const handlePostHashtag = useCallback(
    (post: FeedItem, tag: string) => {
      console.log(
        `[Feed demo] onPostHashtag -- #${tag} tapped inside ${post.id} by ${post.author.name}`,
      );
    },
    [],
  );

  const handlePostPress = useCallback((post: FeedItem) => {
    console.log(
      `[Feed demo] onPostPress -- user wants to open ${post.id} by ${post.author.name}`,
    );
  }, []);

  // Header memoised on the picker states so post appends (every
  // {@link FeedProps.onEndReached} firing) leave the element identity
  // unchanged and FlashList keeps the header's measurement cached;
  // only a real variant or sticky transition rebuilds the picker JSX.
  const header = useMemo(
    () => (
      <FeedKitHeader
        variant={variant}
        onVariantPress={handleVariantPress}
        sticky={sticky}
        onStickyPress={handleStickyPress}
      />
    ),
    [variant, handleVariantPress, sticky, handleStickyPress],
  );

  // Sticky node only constructed when the toggle is "on"; flipping to
  // "off" hands `undefined` to the Feed so the synthetic sticky row
  // never enters the data array (see `Feed.tsx` for the injection
  // rules). Built once at module scope via {@link StickyDemoBar}, so
  // React reuses the same element instance across renders.
  const stickyNode = sticky === "on" ? <StickyDemoBar /> : undefined;

  // Per-variant Feed props. The infinite shape carries the full paging
  // contract (`hasMore: true`, `onEndReached` wired); the finite shape
  // hands the Feed a frozen 3-post slice with `hasMore: false` (no
  // spinner, no callback); the empty shape hands `posts: []` plus the
  // {@link EMPTY_STATE_NODE} so the recycler renders the "nothing here"
  // copy in the empty slot. {@link Feed} treats `onEndReached` as
  // required at the prop level, so the finite / empty branches still
  // pass a no-op closure even though the call site knows it'll never
  // fire (since `hasMore: false` suppresses the trigger).
  const variantProps =
    variant === "infinite"
      ? ({
          posts,
          onEndReached: handleEndReached,
          hasMore: true,
          emptyState: undefined,
        } as const)
      : variant === "finite"
        ? ({
            posts: finitePosts,
            onEndReached: () => undefined,
            hasMore: false,
            emptyState: undefined,
          } as const)
        : ({
            posts: [] as FeedItem[],
            onEndReached: () => undefined,
            hasMore: false,
            emptyState: EMPTY_STATE_NODE,
          } as const);

  return (
    <View style={styles.screen}>
      <Feed
        ref={feedRef}
        posts={variantProps.posts}
        onEndReached={variantProps.onEndReached}
        hasMore={variantProps.hasMore}
        emptyState={variantProps.emptyState}
        ListHeaderComponent={header}
        stickyHeader={stickyNode}
        onRefresh={variant === "infinite" ? handleRefresh : undefined}
        refreshing={refreshing}
        onPostPress={handlePostPress}
        onPostLike={handlePostLike}
        onPostComment={handlePostComment}
        onPostRepost={handlePostRepost}
        onPostBookmark={handlePostBookmark}
        onPostShare={handlePostShare}
        onPostMention={handlePostMention}
        onPostUrlPress={handlePostUrlPress}
        onPostHashtag={handlePostHashtag}
      />
      <View
        style={[styles.fabSlot, { bottom: insets.bottom + 24 }]}
        pointerEvents="box-none"
      >
        <IconButton
          icon={RotateCcw}
          accessibilityLabel="Reset feed"
          onPress={handleReset}
          variant="primary"
          size="lg"
          shape="round"
        />
      </View>
    </View>
  );
}
