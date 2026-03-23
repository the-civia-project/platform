/**
 * User-profile pattern: the kit's canonical "profile page" composition.
 * An X / Twitter-style header carries a full-bleed banner, an
 * overlapping {@link Avatar} ring, an absolute action row pinned to
 * the banner's top-right, an identity stack (display name + `@handle`
 * + flag + location), an optional bio paragraph, an optional meta row
 * (icon + label pairs -- joined date, link, ...), and an optional
 * stats row (K/M-formatted `value` + `label` pairs, each optionally
 * pressable). The flag and location read as two distinct facts on the
 * same line: the flag is the user's *citizenship / nationality*
 * (`UserProfileProps.flag`, an ISO 3166-1 alpha-2 code), and the
 * location is *where they live now* (`UserProfileProps.location`, a
 * free-form city / country / region string) -- a Romanian citizen
 * based in Berlin reads as `flag="RO"` + `location="Berlin, Germany"`,
 * not as two redundant signals of the same place. A generic tab strip
 * sits below the header reading from a caller-supplied
 * {@link UserProfileTabConfig} array. Post tabs render a
 * {@link "../Feed".Feed} body; media tabs render a three-column
 * {@link "./UserProfileMediaGallery".UserProfileMediaGallery} of the
 * user's posted images.
 *
 * The composition is built around four rules:
 *
 * 1. **The {@link Feed} is the screen's scroll container.** The header
 *    splits across two Feed slots so the X-style identity stack
 *    scrolls away while the tab strip stays pinned: the banner /
 *    avatar / identity / bio / meta / stats ride inside the Feed's
 *    {@link "../Feed".FeedProps.ListHeaderComponent} slot, while the
 *    tab strip rides inside {@link "../Feed".FeedProps.stickyHeader}
 *    and sticks to the viewport's top edge once the user scrolls
 *    past the rest of the header. Mounting the user-profile alongside
 *    an outer `ScrollView` ({@link "../Page".Page} included) re-
 *    introduces the nested-scroll problem documented on
 *    {@link "../Feed".Feed} (the outer container captures vertical pan
 *    on iOS / Android and the recycler never gets to scroll). Mount the
 *    user-profile as the screen's full-height top-level child; if the
 *    surrounding view needs prose intro, push it into the parent layout
 *    *above* the user-profile and size it so the recycler still has a
 *    definite height to virtualise against.
 *
 * 2. **The parent owns per-tab paging state, not the user-profile.**
 *    Each {@link UserProfileTabConfig.feed} carries its own `posts`
 *    array and `onEndReached` callback (plus the optional `hasMore`
 *    and `emptyState` knobs that {@link "../Feed".Feed} exposes); the
 *    user-profile never mutates them and never coalesces the streams.
 *    That keeps the contract symmetrical with a stand-alone Feed
 *    (parent appends to its array on `onEndReached`) and lets each tab
 *    page independently -- switching tabs reads what the parent has
 *    fetched for that tab so far without losing the user's other paging
 *    progress.
 *
 * 3. **Each tab keeps its own scroll position; re-tap walks the
 *    active tab to the top.** The component renders one
 *    {@link "../Feed".Feed} per tab in the strip (siblings inside a
 *    single column, with `display: "none"` toggling the inactive
 *    ones out of layout) so each tab's recycler holds onto its own
 *    scroll offset across transitions: switching from Reposts back
 *    to Posts lands the user wherever they left Posts off, not at
 *    the top. Re-tapping the *already-active* tab still drives
 *    {@link "../Feed".FeedHandle.scrollToTop} on that tab's feed --
 *    the Twitter / X "tap the selected tab to jump to top"
 *    convention -- and does *not* fire
 *    {@link UserProfileProps.onTabChange} (no transition, no
 *    observation). The per-tab feeds register their imperative
 *    handles into one `feedRefs` Map keyed by tab id so the re-tap
 *    can address the right recycler regardless of how many tabs are
 *    in the strip.
 *
 * 4. **Active tab is controlled-or-uncontrolled.** Pass
 *    {@link UserProfileProps.activeTabId} for full control (route /
 *    deep-link binding, parent-driven tab pickers); omit it and the
 *    component owns the active-tab state internally, seeded with
 *    {@link UserProfileProps.defaultTabId} (falling back to the first
 *    tab in {@link UserProfileProps.tabs}). The two props are mutually
 *    exclusive in practice: when `activeTabId` is set it always wins,
 *    so a `defaultTabId` passed alongside it is silently ignored.
 *    {@link UserProfileProps.onTabChange} fires on real transitions
 *    originating from a press; external pushes of `activeTabId` from
 *    the parent don't re-fire the observer (the parent is the source).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Image as RNImage,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type LayoutChangeEvent,
} from "react-native";
import type { LucideIcon } from "lucide-react-native";
import CountryFlag from "react-native-country-flag";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import Avatar, { AVATAR_DIM_PX } from "../Avatar";
import {
  Feed,
  type FeedHandle,
  type FeedItem,
} from "../Feed";
import {
  UserProfileMediaGallery,
  type UserProfileMedia,
  type UserProfileMediaGalleryHandle,
} from "./UserProfileMediaGallery";
import { Code, Text } from "../Typography";
import { useTheme } from "../use-theme";
import { formatStatValue } from "./format-stat";
import {
  computeTabPressOutcome,
  getInitialActiveTabId,
  resolveActiveTabId,
} from "./resolve-active-tab";
import {
  resolveHeaderShape,
  type UserProfileHeaderShape,
} from "./resolve-header-shape";

/**
 * Banner image displayed full-bleed at the top of the user-profile
 * header. Optional -- pass `undefined` (or omit
 * {@link UserProfileProps.banner} entirely) to render the bannerless
 * variant, in which case the avatar sits in the body without an
 * overlap and the action row (if any) falls back to a body-level
 * right-aligned slot above the identity stack.
 */
export type UserProfileBanner = {
  /**
   * Remote image URL displayed as the banner. Passed straight to React
   * Native's {@link RNImage} as the `uri` source; consumers are
   * responsible for serving an asset that reads well at the resolved
   * aspect ratio.
   */
  source: string;
  /**
   * Display aspect ratio (`width / height`) for the banner image.
   * Defaults to `3` -- the social-media convention (X / Bluesky /
   * Instagram all converge on roughly 3:1 banners) and a comfortable
   * fit at every phone width.
   * @defaultValue 3
   */
  aspectRatio?: number;
};

/**
 * One entry in the header's meta row -- typically a small icon plus a
 * piece of secondary copy about the subject (joined date, profile
 * link, location modifier, employer). Multiple entries lay out left-to-
 * right with horizontal wrap, separated by a 12px gap; the icon paints
 * in {@link Theme.fgMuted} and the label inherits the row's caption
 * rhythm so the whole strip reads as "secondary context, not headline".
 */
export type UserProfileMeta = {
  /**
   * Lucide icon component rendered to the left of the label at 14px
   * stroke in {@link Theme.fgMuted}. Pass the icon component itself
   * (e.g. `Calendar` from `lucide-react-native`), not a JSX element.
   */
  icon: LucideIcon;
  /**
   * The meta entry's label. `ReactNode` (rather than `string`) so
   * consumers can mix inline {@link "../Typography".Code} for URLs,
   * `<Pressable>` wrappers for links, or any other small inline
   * composition -- the meta row gives the entry no styling of its own
   * beyond the caption-rhythm copy colour applied to a wrapping Text.
   */
  label: ReactNode;
};

/**
 * One entry in the header's stats row -- a numeric `value` paired with
 * a short `label` ("Posts", "Followers", "Following"). Values render
 * with K/M abbreviation past 1,000 / 1,000,000 so a million-follower
 * profile reads "1.2M Followers" rather than "1,234,567 Followers" and
 * the row stays single-line on phone widths. The whole pair is
 * pressable when {@link UserProfileStat.onPress} is set, matching the
 * social-media convention where tapping "Followers" opens the followers
 * list and tapping "Following" opens the following list; without
 * `onPress` the pair renders as plain copy with no press affordance.
 */
export type UserProfileStat = {
  /**
   * Short label trailing the value (e.g. `"Posts"`, `"Followers"`).
   * Painted in {@link Theme.fgMuted} so the value carries the visual
   * weight; keep labels at sentence case so the row reads as natural
   * language.
   */
  label: string;
  /**
   * Raw count. Formatted with K/M abbreviation in display: `1234` ->
   * `"1.2K"`, `1_500_000` -> `"1.5M"`. Negative values are clamped to
   * 0 (a stat can be zero -- "0 Posts" on a fresh account -- but
   * "-2 Followers" never makes sense in this context).
   */
  value: number;
  /**
   * Optional press handler. When set, the pair becomes a `Pressable`
   * with `accessibilityRole="button"` and the kit's standard press
   * feedback (opacity dip); the visible chrome is unchanged so the
   * affordance reads as "this number is a link" rather than "this
   * number is a button". Leave undefined for stats that are display-
   * only (Posts is usually inert; Followers / Following typically open
   * follow lists).
   */
  onPress?: () => void;
};

/**
 * Per-tab feed contract: the same shape a stand-alone
 * {@link "../Feed".Feed} would consume, just plumbed through one tab's
 * config. A {@link UserProfile} consumes one of these per tab (via
 * {@link UserProfileTabConfig.feed}); the parent owns each tab's
 * array independently and appends to it on `onEndReached`, exactly
 * like a stand-alone Feed.
 *
 * The shape mirrors the relevant slice of {@link "../Feed".FeedProps}
 * so a call site already wiring a Feed can lift its `posts` +
 * paging callback into the user-profile one tab at a time without
 * rewriting the data layer. The Feed-level `onEndReachedThreshold` and
 * `ListHeaderComponent` deliberately don't surface here -- the
 * threshold is shared across all tabs (one screen of lead time, see
 * {@link "../Feed".FeedProps} for the rationale) and the header slot
 * is owned by the user-profile itself.
 */
export type UserProfileFeed = {
  /**
   * Posts currently loaded for this tab, top-to-bottom. Forwarded
   * verbatim to {@link "../Feed".FeedProps.posts} when this tab is
   * active. Append new items in response to
   * {@link UserProfileFeed.onEndReached}; the user-profile mutates
   * nothing.
   */
  posts: FeedItem[];
  /**
   * Called once when the user scrolls within a full viewport height of
   * the bottom (the Feed-level default
   * {@link "../Feed".FeedProps.onEndReachedThreshold} of `1`). The
   * consumer is expected to fetch this tab's next page and append it
   * to {@link UserProfileFeed.posts}. Tabs are independent -- a fire
   * on one tab does not invalidate any state on the others.
   *
   * Suppressed at the {@link "../Feed".Feed} level when
   * {@link UserProfileFeed.hasMore} is `false` (a finite tab, e.g. a
   * user's full post history once the last page has been fetched).
   */
  onEndReached: () => void;
  /**
   * Whether this tab has more pages left to load. Forwarded to
   * {@link "../Feed".FeedProps.hasMore}. The default, `true`, is the
   * canonical "infinite stream" shape (spinner footer, paging
   * callback). Flip to `false` for finite contributions -- a user with
   * a bounded post history, an archive of replies that's been fully
   * walked -- and the Feed ends cleanly at the last row.
   * @defaultValue true
   */
  hasMore?: boolean;
  /**
   * React node rendered in the Feed's empty slot when
   * {@link UserProfileFeed.posts} is empty. Forwarded verbatim to
   * {@link "../Feed".FeedProps.emptyState}. Pass an `<Eyebrow>` /
   * `<Description>` pair (or any small layout) for tabs that
   * legitimately have nothing in them -- a fresh account's Replies
   * tab, an archive with no entries -- so the user reads "nothing
   * here" rather than the perpetual-load spinner.
   */
  emptyState?: ReactNode;
  /**
   * Called when the user pulls down on this tab's feed to refresh.
   * Forwarded verbatim to {@link "../Feed".FeedProps.onRefresh}. Each
   * tab owns its own refresh handler -- a refresh on Reposts doesn't
   * touch Posts or Replies -- so consumers can wire three independent
   * fetches if the underlying source is per-tab. Leave undefined to
   * disable the pull-to-refresh gesture on this tab specifically.
   */
  onRefresh?: () => void | Promise<void>;
  /**
   * Whether a pull-to-refresh is currently in flight for this tab.
   * Forwarded verbatim to {@link "../Feed".FeedProps.refreshing}.
   * Ignored unless {@link UserProfileFeed.onRefresh} is also set --
   * the kit doesn't render a `RefreshControl` without a handler to
   * drive it.
   *
   * @defaultValue false
   */
  refreshing?: boolean;
};

/**
 * One tab in the {@link UserProfile} strip. The kit ships nothing
 * hard-coded about tab semantics: callers supply whichever set their
 * product needs (the canonical "Posts / Reposts / Replies", but also
 * "Media / Tagged / Likes", "Drafts / Published", etc.). The strip
 * renders the tabs left-to-right in the order they're passed; reorder
 * by reordering the {@link UserProfileProps.tabs} array.
 *
 * Each tab carries either a post {@link UserProfileFeedTabConfig.feed}
 * (rendered by {@link "../Feed".Feed}) or a
 * {@link UserProfileMediaTabConfig.media} grid (rendered by
 * {@link "./UserProfileMediaGallery".UserProfileMediaGallery}).
 */
type UserProfileTabBase = {
  /**
   * Stable identifier for the tab. Used as the React key on the tab
   * cell, as the value of {@link UserProfileProps.activeTabId} /
   * {@link UserProfileProps.defaultTabId}, and forwarded to
   * {@link UserProfileProps.onTabChange} on transitions. Must be
   * unique across all entries in {@link UserProfileProps.tabs}.
   */
  id: string;
  /**
   * Visible label rendered inside the tab cell. Short -- the strip
   * splits horizontal space evenly across all tabs, so long labels
   * wrap or truncate on phone widths.
   */
  label: string;
  /**
   * Optional contribution count rendered as a small muted suffix on
   * the label (e.g. "Posts · 124"). Formatted with K/M abbreviation
   * past 1,000 / 1,000,000, matching the stats row's convention.
   * Omit when the count isn't known (e.g. cursor-paged feeds where
   * the total isn't reliably available) -- the label renders cleanly
   * on its own.
   */
  count?: number;
};

/**
 * Posts-tab descriptor: infinite {@link "../Feed".Feed} stream.
 */
export type UserProfileFeedTabConfig = UserProfileTabBase & {
  /**
   * The tab's feed payload. Forwarded to the inner
   * {@link "../Feed".Feed} when this tab is active; ignored on the
   * other tabs. See {@link UserProfileFeed} for the shape.
   */
  feed: UserProfileFeed;
};

/**
 * Media-tab descriptor: infinite three-column image grid via
 * {@link "./UserProfileMediaGallery".UserProfileMediaGallery}.
 */
export type UserProfileMediaTabConfig = UserProfileTabBase & {
  /**
   * The tab's media payload. Forwarded to
   * {@link "./UserProfileMediaGallery".UserProfileMediaGallery} when
   * this tab is active. See
   * {@link "./UserProfileMediaGallery".UserProfileMedia} for the shape.
   */
  media: UserProfileMedia;
};

/**
 * One tab in the {@link UserProfile} strip -- either a post feed or a
 * media grid. Discriminated by the presence of `feed` vs `media`.
 */
export type UserProfileTabConfig =
  | UserProfileFeedTabConfig
  | UserProfileMediaTabConfig;

/** Narrows a tab config to the media-grid variant. */
function isMediaTab(
  tab: UserProfileTabConfig,
): tab is UserProfileMediaTabConfig {
  return "media" in tab;
}

/** Imperative scroll surface shared by feed and media tab bodies. */
type UserProfileTabScrollHandle = {
  scrollToTop: (options?: { animated?: boolean }) => void;
};

/**
 * Props for {@link UserProfile}.
 */
export type UserProfileProps = {
  /**
   * Remote image URL displayed in the header's overlapping avatar.
   * Forwarded to {@link Avatar} at `size="xl"` `shape="round"`. The
   * avatar sits inside a 4-pixel surface-card ring so its silhouette
   * reads cleanly over the banner (or, in the bannerless variant,
   * sits inertly at the top of the body).
   */
  avatar: string;
  /**
   * The subject's display name -- full name, nickname, or handle-as-
   * name when the product doesn't separate the two. Rendered at the
   * top of the identity stack at 24px / 700, painted in
   * {@link Theme.fgEmphasis} so it carries the strongest visual
   * weight on the page.
   */
  name: string;
  /**
   * Optional username (no leading `@` -- the strip adds it). When
   * present, renders on the line below {@link UserProfileProps.name}
   * in {@link Theme.fgMuted} with the kit's monospace face so it reads
   * unambiguously as "this is the canonical handle, not display copy".
   * Omit for profile views that don't surface a handle (e.g. anonymous
   * authors, system accounts).
   */
  handle?: string;
  /**
   * ISO 3166-1 alpha-2 country code (e.g. `"RO"`, `"US"`) the user
   * holds as their *citizenship / nationality*. When set, a small
   * {@link CountryFlag} renders inline on the line below the
   * `@handle`, paired with the free-form {@link UserProfileProps.location}
   * to its right when that is also set. Lower-cased internally before
   * being handed to `react-native-country-flag`. Use
   * {@link UserProfileProps.location} -- not this prop -- for the
   * user's *current city* (which may differ from their citizenship,
   * e.g. a Romanian citizen based in Berlin reads as `flag="RO"` +
   * `location="Berlin, Germany"`).
   */
  flag?: string;
  /**
   * Optional free-form string describing where the user is *based
   * right now*: city, country, region, or any combination ("Berlin,
   * Germany", "Eastern Europe", "Remote"). Renders to the right of
   * {@link UserProfileProps.flag} on the same line so the citizen-
   * ship / residence pair reads as one row. Falls back to flag-only
   * when omitted (and to nothing when the flag is also unset). Pair
   * with {@link UserProfileProps.flag} rather than treating the two
   * as interchangeable -- the flag carries nationality, this carries
   * residence.
   */
  location?: string;
  /**
   * Optional banner image displayed full-bleed at the top of the
   * header. When set, the avatar sits half-over the banner's bottom
   * edge and the action row (if any) anchors absolutely to the
   * banner's top-right. When omitted, the header renders the
   * "bannerless" shape: no banner image, avatar at the top of the
   * body, action row inline above the identity stack.
   */
  banner?: UserProfileBanner;
  /**
   * Optional bio paragraph rendered below the identity stack. Accepts
   * `ReactNode` (rather than `string`) so consumers can mix inline
   * formatting, links, and mentions -- the user-profile gives the
   * slot no opinion beyond placement and a small breathing margin.
   */
  bio?: ReactNode;
  /**
   * Optional secondary-context entries surfaced as a horizontal meta
   * row below the bio. See {@link UserProfileMeta} for the shape.
   * Common entries: joined date (Calendar icon), profile link (Link
   * icon), employer (Briefcase icon). Pass an empty array (or omit
   * the prop entirely) to skip the row.
   */
  meta?: UserProfileMeta[];
  /**
   * Optional `{value, label}` pairs surfaced as a horizontal stats
   * row below the meta. See {@link UserProfileStat} for the shape.
   * The canonical entries are Posts / Followers / Following but the
   * kit is agnostic about the set and the order -- pass whatever
   * matches the product. Each stat pair is independently pressable
   * when its `onPress` is set.
   */
  stats?: UserProfileStat[];
  /**
   * Optional action row rendered over the banner (top-right, absolute)
   * when {@link UserProfileProps.banner} is set, or above the identity
   * stack (right-aligned) when it isn't. Accepts any `ReactNode` --
   * the user-profile gives the slot no layout opinion, so consumers
   * typically pass a small horizontal `View` containing
   * {@link "../Button".default}s / {@link "../Button".IconButton}s
   * for "Follow", "Message", and overflow.
   */
  actions?: ReactNode;
  /**
   * Tab descriptors rendered in the strip below the header, left-to-
   * right in array order. At least one entry is required -- the type
   * is a non-empty tuple so the compiler catches accidental empty
   * arrays. See {@link UserProfileTabConfig} for the per-tab shape.
   */
  tabs: [UserProfileTabConfig, ...UserProfileTabConfig[]];
  /**
   * Externally-controlled active-tab id. When provided, always wins
   * over the internal state -- the user-profile reads this prop on
   * every render and {@link UserProfileProps.defaultTabId} is silently
   * ignored. Use when the active tab is owned by the parent (deep-
   * link sync, controlled pickers, persistence layers). Omit for the
   * uncontrolled shape, where the kit holds the state internally.
   */
  activeTabId?: string;
  /**
   * Seed for the internal active-tab state. Only consulted when
   * {@link UserProfileProps.activeTabId} is unset -- when both are
   * provided, the controlled prop wins. Defaults to the id of the
   * first entry in {@link UserProfileProps.tabs}.
   * @defaultValue The first tab's `id`.
   */
  defaultTabId?: string;
  /**
   * Called after a real tab transition: a tab press onto a different
   * tab. Re-tapping the active tab fires `scrollToTop` but does *not*
   * fire this observer. External pushes of
   * {@link UserProfileProps.activeTabId} from the parent also don't
   * fire it -- the parent is the source of the change in that case.
   *
   * @param id - The id of the newly-active tab (matches one of the
   *   entries in {@link UserProfileProps.tabs}).
   */
  onTabChange?: (id: string) => void;
};

/**
 * Side length (logical px) of the wrapper that paints the avatar's
 * surface-card ring. Computed once at module scope as `xl + 2*ring` so
 * the avatar's clipping circle stays at the kit's standard `xl` size
 * (96px) while the wrapper carries an extra 4-pixel band of
 * surface-card colour on every side. Exported nowhere -- a private
 * layout constant.
 */
const AVATAR_RING_WIDTH = 4;
const AVATAR_RING_SIZE = AVATAR_DIM_PX.xl + AVATAR_RING_WIDTH * 2;

/**
 * Negative top margin used to lift the avatar wrapper so half of its
 * silhouette overlaps the banner. Equal to half the wrapper's side
 * length, so the avatar's vertical centre lines up with the banner /
 * body seam.
 */
const AVATAR_OVERLAP = AVATAR_RING_SIZE / 2;

/**
 * Renders a user's profile-page composition. See
 * {@link UserProfileProps} for the data contract and the file header
 * for the four structural rules (Feed-as-scroll-container,
 * parent-owns-paging, tab-change snaps to top, controlled-or-
 * uncontrolled active tab).
 *
 * @param props - {@link UserProfileProps}
 */
export default function UserProfile({
  avatar,
  name,
  handle,
  flag,
  location,
  banner,
  bio,
  meta,
  stats,
  actions,
  tabs,
  activeTabId,
  defaultTabId,
  onTabChange,
}: UserProfileProps) {
  // Internal active-tab state, seeded once via
  // {@link getInitialActiveTabId} (returns `defaultTabId` or the first
  // tab's id as fallback). The seed is computed at mount only; later
  // renders fold the controlled prop on top via
  // {@link resolveActiveTabId} so the internal state survives a parent
  // that re-renders with a different defaultTabId mid-life (mirrors
  // React's lazy useState semantics for the same case).
  const [internalTabId, setInternalTabId] = useState<string>(() =>
    getInitialActiveTabId(defaultTabId, tabs[0].id),
  );
  const resolvedTabId = resolveActiveTabId(activeTabId, internalTabId);

  // One imperative handle per tab, registered by the per-tab body
  // wrappers below via callback refs. Held in a Map keyed by tab id
  // so re-taps of the active tab can address the right recycler
  // without index arithmetic. The ref itself never changes identity;
  // its Map contents do, on every Feed / media-gallery mount / unmount.
  const tabScrollRefs = useRef<Map<string, UserProfileTabScrollHandle | null>>(
    new Map(),
  );

  const handleTabPress = useCallback(
    (id: string) => {
      // Decide first whether this press is a real transition or a
      // re-tap of the currently active tab. The pure resolver
      // ({@link computeTabPressOutcome}) returns the rules so the
      // shouldFire / shouldUpdate booleans can be unit-pinned in
      // Node tests rather than re-derived inline.
      const outcome = computeTabPressOutcome(
        id,
        resolvedTabId,
        activeTabId !== undefined,
      );
      if (outcome.shouldUpdateInternalState) setInternalTabId(id);
      if (outcome.shouldFireOnTabChange) onTabChange?.(id);
      // Re-tap (no real transition) walks the active feed back to the
      // first post -- the X / Twitter convention. Transitions leave
      // every feed's scroll position alone so the destination tab
      // restores wherever the user last left it.
      if (!outcome.shouldFireOnTabChange) {
        tabScrollRefs.current.get(id)?.scrollToTop({ animated: true });
      }
    },
    [resolvedTabId, activeTabId, onTabChange],
  );

  // Stable header element. Memoised on the inputs the header actually
  // depends on (every identity / slot prop) so post appends (every
  // `onEndReached` firing on the active tab's feed) leave the element
  // identity unchanged and FlashList keeps its header measurement
  // cached. The tabs array and resolved id deliberately don't appear
  // in the dep list -- the tab strip lives in {@link stickyTabBar}
  // below, not inside this header, so tab transitions only invalidate
  // the sticky memo. The same element reference is passed into every
  // per-tab Feed below; each Feed mounts its own copy of the subtree
  // (FlashList's ListHeaderComponent slot is per-instance), so the
  // memo's job is to keep the *element identity* stable, not the
  // rendered tree count.
  const header = useMemo(
    () => (
      <UserProfileHeader
        avatar={avatar}
        name={name}
        handle={handle}
        flag={flag}
        location={location}
        banner={banner}
        bio={bio}
        meta={meta}
        stats={stats}
        actions={actions}
      />
    ),
    [avatar, name, handle, flag, location, banner, bio, meta, stats, actions],
  );

  // Sticky tab strip. Sits at the top of the post column when the
  // header is fully visible, and pins to the viewport's top edge once
  // the user scrolls past the X-style header above. Memoised on the
  // tabs array, the resolved active id, and the press handler so a
  // press that doesn't change the active id (re-tap) doesn't churn
  // the element identity. Like {@link header}, the same element is
  // passed into every per-tab Feed -- only the visible Feed's copy
  // is on screen at a time (the rest are `display: "none"` siblings).
  const stickyTabBar = useMemo(
    () => (
      <UserProfileTabStrip
        tabs={tabs}
        activeTabId={resolvedTabId}
        onTabPress={handleTabPress}
      />
    ),
    [tabs, resolvedTabId, handleTabPress],
  );

  return (
    <View style={styles.feeds}>
      {tabs.map((tab) => {
        const isActive = tab.id === resolvedTabId;
        const registerScrollRef = (
          handle: UserProfileTabScrollHandle | null,
        ) => {
          tabScrollRefs.current.set(tab.id, handle);
        };
        return (
          <View
            key={tab.id}
            style={[styles.tabFeed, !isActive && styles.tabFeedHidden]}
            // Hide the inactive panels from assistive tech: the visible
            // tab is the only one the user can interact with, so screen
            // readers shouldn't surface duplicate post columns from
            // the panels stacked behind. The active panel announces
            // normally.
            accessibilityElementsHidden={!isActive}
            importantForAccessibility={
              isActive ? "auto" : "no-hide-descendants"
            }
          >
            {isMediaTab(tab) ? (
              <UserProfileMediaGallery
                ref={(handle: UserProfileMediaGalleryHandle | null) => {
                  registerScrollRef(handle);
                }}
                images={tab.media.images}
                onEndReached={tab.media.onEndReached}
                hasMore={tab.media.hasMore}
                emptyState={tab.media.emptyState}
                onRefresh={tab.media.onRefresh}
                refreshing={tab.media.refreshing}
                resolveThumbnailSource={tab.media.resolveThumbnailSource}
                ListHeaderComponent={header}
                stickyHeader={stickyTabBar}
              />
            ) : (
              <Feed
                ref={(handle: FeedHandle | null) => {
                  registerScrollRef(handle);
                }}
                posts={tab.feed.posts}
                onEndReached={tab.feed.onEndReached}
                hasMore={tab.feed.hasMore}
                emptyState={tab.feed.emptyState}
                onRefresh={tab.feed.onRefresh}
                refreshing={tab.feed.refreshing}
                ListHeaderComponent={header}
                stickyHeader={stickyTabBar}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Header rendered above the first post via the inner Feed's
 * {@link "../Feed".FeedProps.ListHeaderComponent} slot. Owns the
 * X-style layout *up to but not including* the tab strip: full-bleed
 * banner with an absolute action row, overlapping avatar with a
 * surface-card ring, identity stack, bio, meta row, stats row.
 *
 * The tab strip is rendered separately by {@link UserProfile} and
 * passed to the Feed via {@link "../Feed".FeedProps.stickyHeader} so
 * it can pin to the viewport's top edge after the rest of the header
 * scrolls off. Pulling the strip out of this sub-component means the
 * header memo doesn't re-render on tab transitions (the strip has
 * its own memo on the {@link UserProfile} side).
 */
function UserProfileHeader({
  avatar,
  name,
  handle,
  flag,
  location,
  banner,
  bio,
  meta,
  stats,
  actions,
}: {
  avatar: string;
  name: string;
  handle?: string;
  flag?: string;
  location?: string;
  banner?: UserProfileBanner;
  bio?: ReactNode;
  meta?: UserProfileMeta[];
  stats?: UserProfileStat[];
  actions?: ReactNode;
}) {
  const theme = useTheme();
  // Pure-function resolver returns one boolean per optional slot, so
  // the JSX below stays a flat checklist (no inline truthy ternaries
  // duplicating the rules) and the same rules are unit-pinned in
  // `resolve-header-shape.test.ts`. The `shape.hasMeta` / `hasStats`
  // gates are what enforce the kit's "identity-only header when only
  // required props are passed" contract.
  const shape: UserProfileHeaderShape = resolveHeaderShape({
    banner,
    actions,
    handle,
    flag,
    location,
    bio,
    meta,
    stats,
  });

  return (
    <View>
      {shape.hasBanner && banner ? (
        <View style={styles.bannerWrap}>
          <RNImage
            source={{ uri: banner.source }}
            style={[
              styles.bannerImage,
              { aspectRatio: banner.aspectRatio ?? 3 },
              { backgroundColor: theme.surfaceWell },
            ]}
            accessibilityIgnoresInvertColors
          />
          {shape.hasActionsOverlay ? (
            <View style={styles.actionsOverBanner} pointerEvents="box-none">
              {actions}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.body}>
        {shape.hasActionsInline ? (
          <View style={styles.actionsInline} pointerEvents="box-none">
            {actions}
          </View>
        ) : null}

        <View
          style={[
            styles.avatarRing,
            shape.avatarOverlaps && styles.avatarRingOverlap,
            { backgroundColor: theme.surfaceCard },
          ]}
        >
          <Avatar
            source={avatar}
            size="xl"
            shape="round"
            accessibilityLabel={`${name}'s avatar`}
          />
        </View>

        <UserProfileIdentity
          name={name}
          handle={handle}
          flag={flag}
          location={location}
          shape={shape}
        />

        {shape.hasBio ? <View style={styles.bioRow}>{bio}</View> : null}

        {shape.hasMeta && meta ? <UserProfileMetaRow entries={meta} /> : null}

        {shape.hasStats && stats ? (
          <UserProfileStatsRow entries={stats} />
        ) : null}
      </View>
    </View>
  );
}

/**
 * Identity stack rendered directly below the avatar: display name on
 * the first line (large + bold), `@handle` on the second (muted +
 * monospace, omitted when {@link UserProfileProps.handle} is unset),
 * country flag + residence on the third (each independently omitted
 * when {@link UserProfileProps.flag} / {@link UserProfileProps.location}
 * are unset; the row itself collapses when both are unset).
 *
 * The flag-and-location pair sits on a single row by design: flag is
 * citizenship / nationality, location is current residence, and
 * reading them side-by-side ("RO Berlin, Germany") communicates that
 * split without spending two rows on geography.
 *
 * Kept as a named sub-component so the {@link UserProfileHeader}'s
 * `.map` body stays linear -- the conditional handle / flag rows
 * have enough wiring that inlining them would crowd the parent.
 */
function UserProfileIdentity({
  name,
  handle,
  flag,
  location,
  shape,
}: {
  name: string;
  handle?: string;
  flag?: string;
  location?: string;
  shape: UserProfileHeaderShape;
}) {
  const theme = useTheme();

  return (
    <View style={styles.identity}>
      <Text style={[styles.name, { color: theme.fgEmphasis }]} numberOfLines={1}>
        {name}
      </Text>
      {shape.hasHandleRow && handle ? (
        <View style={styles.handleRow}>
          <Code>{`@${handle}`}</Code>
        </View>
      ) : null}
      {shape.hasFlagRow ? (
        <View style={styles.flagRow}>
          {flag ? (
            <CountryFlag isoCode={flag} size={14} style={styles.flag} />
          ) : null}
          {location ? (
            <Text
              style={[styles.location, { color: theme.fgMuted }]}
              numberOfLines={1}
            >
              {location}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Meta row: a flex-wrap of icon + label pairs separated by a 12px gap.
 * Lays out below the bio and above the stats row, painted in
 * {@link Theme.fgMuted} so the strip reads as "secondary context" --
 * the same visual weight as captions throughout the kit.
 */
function UserProfileMetaRow({
  entries,
}: {
  entries: ReadonlyArray<UserProfileMeta>;
}) {
  const theme = useTheme();
  return (
    <View style={styles.metaRow}>
      {entries.map((entry, index) => {
        const Icon = entry.icon;
        return (
          <View key={index} style={styles.metaEntry}>
            <Icon size={14} color={theme.fgMuted} strokeWidth={2} />
            <Text style={[styles.metaLabel, { color: theme.fgMuted }]}>
              {entry.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Stats row: a flex-wrap of `value` + `label` pairs separated by a
 * middot. Each pair is independently pressable when its `onPress` is
 * set; the visible chrome is unchanged so the affordance reads as
 * "this number is a link" rather than "this number is a button".
 */
function UserProfileStatsRow({
  entries,
}: {
  entries: ReadonlyArray<UserProfileStat>;
}) {
  const theme = useTheme();
  return (
    <View style={styles.statsRow}>
      {entries.map((entry, index) => {
        const content = (
          <RNText style={styles.statBody}>
            <RNText style={[styles.statValue, { color: theme.fgEmphasis }]}>
              {formatStatValue(entry.value)}
            </RNText>{" "}
            <RNText style={[styles.statLabel, { color: theme.fgMuted }]}>
              {entry.label}
            </RNText>
          </RNText>
        );
        // Middot separator before every entry except the first. Lives
        // inside the inner-text run so it inherits the wrap rhythm --
        // a wrapped row keeps the dot on the original line, which
        // reads better than orphaning it onto the next line.
        const separator =
          index > 0 ? (
            <RNText
              style={[styles.statSeparator, { color: theme.fgMuted }]}
              accessibilityElementsHidden
            >
              {"  ·  "}
            </RNText>
          ) : null;

        if (entry.onPress) {
          return (
            <Pressable
              key={index}
              onPress={entry.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${entry.value} ${entry.label}`}
              style={({ pressed }) => [
                styles.statPressable,
                webFocusOutlineStyle(),
                pressed && styles.statPressed,
              ]}
              hitSlop={6}
            >
              {separator}
              {content}
            </Pressable>
          );
        }
        return (
          <View key={index} style={styles.statPressable}>
            {separator}
            {content}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Horizontal tab strip rendered as the last band of the header.
 * Reads from the {@link UserProfileProps.tabs} array; each tab cell
 * carries `accessibilityRole="tab"`, an `accessibilityState.selected`
 * flag, and an `accessibilityHint` so screen readers announce the
 * active tab and the cell's affordance. The strip itself carries
 * `accessibilityRole="tablist"` and `accessibilityLiveRegion="polite"`
 * so transitions announce automatically.
 *
 * The active underline is a single {@link Animated.View} sibling of
 * the tab cells -- not a per-cell child of the active tab as it used
 * to be. The view's `width` is the per-cell width derived from the
 * tablist's `onLayout`-measured width; its `translateX` is animated
 * to `activeIndex * cellWidth` on every active-tab change, with
 * `useNativeDriver: true` so the spring runs on the native side and
 * doesn't compete with the post column's scroll updates. The very
 * first move snaps via `setValue` (no spring), so the underline lands
 * under the correct tab on mount instead of always animating in from
 * the leftmost cell.
 *
 * The strip is intentionally a flat in-file render (not a separate
 * `Tabs` primitive) because today the user-profile is the only
 * consumer of a horizontal tab row in the kit; when a second consumer
 * lands, lift this into `components/Tabs/` and keep the
 * `accessibilityRole="tab"` row contract intact.
 */
function UserProfileTabStrip({
  tabs,
  activeTabId,
  onTabPress,
}: {
  tabs: ReadonlyArray<UserProfileTabConfig>;
  activeTabId: string;
  onTabPress: (id: string) => void;
}) {
  const theme = useTheme();

  // Layout-measured width of the tablist, captured via `onLayout` on
  // the wrapper. `cellWidth` derives from it on every render so the
  // underline's `width` updates if the parent ever changes (rotation,
  // window resize on web, foldable open / close). 0 until the first
  // layout pass; the effect below handles that case by `setValue`-ing
  // the underline to 0 width / 0 offset.
  const [tablistWidth, setTablistWidth] = useState(0);
  const cellWidth = tabs.length > 0 ? tablistWidth / tabs.length : 0;

  // The Animated.Value driving the underline's `translateX`. Allocated
  // once (`useRef` + lazy initializer) so the same node is reused
  // across renders -- recreating the value would reset the animation
  // mid-transition and visually snap the underline.
  const underlineXRef = useRef<Animated.Value | null>(null);
  if (underlineXRef.current === null) {
    underlineXRef.current = new Animated.Value(0);
  }
  const underlineX = underlineXRef.current;

  // Flips to `true` after the first paint with a non-zero cell width.
  // Until then, every position update is a `setValue` (snap), so the
  // underline lands under the correct tab on mount instead of
  // animating in from offset 0. Subsequent updates use a spring.
  const hasMeasuredRef = useRef(false);

  useEffect(() => {
    if (cellWidth <= 0) return;
    const activeIndex = Math.max(
      0,
      tabs.findIndex((tab) => tab.id === activeTabId),
    );
    const target = activeIndex * cellWidth;
    if (!hasMeasuredRef.current) {
      underlineX.setValue(target);
      hasMeasuredRef.current = true;
      return;
    }
    Animated.spring(underlineX, {
      toValue: target,
      useNativeDriver: true,
      bounciness: 4,
      speed: 16,
    }).start();
  }, [activeTabId, cellWidth, tabs, underlineX]);

  const onTablistLayout = useCallback((event: LayoutChangeEvent) => {
    setTablistWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View
      style={[styles.tabBar, { borderBottomColor: theme.borderDefault }]}
      accessibilityRole="tablist"
      accessibilityLiveRegion="polite"
      onLayout={onTablistLayout}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabPress(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            accessibilityHint={
              isActive
                ? `${tab.label} tab, double tap to scroll to top`
                : `Switch to the ${tab.label} tab`
            }
            style={({ pressed }) => [
              styles.tab,
              webFocusOutlineStyle(),
              pressed && styles.tabPressed,
            ]}
            hitSlop={6}
          >
            {/*
              Raw RN Text rather than the themed Typography Text because
              the tab paints label colour explicitly from the active /
              inactive split: themed Text would append `theme.fg` after
              the inline `color` and win, collapsing the two states.
              Same idiom Accordion's toggle and Button's label use.
            */}
            <RNText
              style={[
                styles.tabLabel,
                isActive && styles.tabLabelActive,
                { color: isActive ? theme.fgEmphasis : theme.fgMuted },
              ]}
            >
              {tab.label}
              {typeof tab.count === "number" ? (
                <RNText style={[styles.tabCount, { color: theme.fgMuted }]}>
                  {" "}
                  {formatStatValue(tab.count)}
                </RNText>
              ) : null}
            </RNText>
          </Pressable>
        );
      })}
      <Animated.View
        style={[
          styles.tabUnderline,
          {
            backgroundColor: theme.primary,
            width: cellWidth,
            transform: [{ translateX: underlineX }],
          },
        ]}
        // Pure visual decoration -- screen readers describe the active
        // tab via {@link accessibilityState.selected} on the cell, so
        // the underline shouldn't add a second announcement.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Outer column that hosts the per-tab {@link "../Feed".Feed}
   * siblings. `flex: 1` is what gives each Feed inside a definite
   * height to virtualise against -- the user-profile is the screen's
   * only top-level scroller, so the parent View is expected to fill
   * the screen.
   */
  feeds: {
    flex: 1,
  },
  /**
   * Per-tab Feed wrapper. `flex: 1` lets the visible panel claim the
   * entire {@link styles.feeds} column; the `display: "none"` toggle
   * on {@link styles.tabFeedHidden} pulls the inactive panels out of
   * layout so the visible one is the only one that takes flex space.
   * Mount cost stays low because every wrapper holds its own Feed
   * across the lifetime of the user-profile -- the recycler's
   * internal scroll offset survives the hide / show cycle, which is
   * what gives each tab its independent scroll memory.
   */
  tabFeed: {
    flex: 1,
  },
  /**
   * Hides the inactive per-tab Feed panels. `display: "none"` is
   * preferred over `opacity: 0` / `pointerEvents: "none"` here
   * because the panel needs to drop out of layout (otherwise three
   * full-height Feeds would stack inside {@link styles.feeds} and
   * each would render to a third of the screen height) while still
   * keeping its native subtree mounted so the FlashList scroll
   * position survives the next hide cycle.
   */
  tabFeedHidden: {
    display: "none",
  },
  /**
   * Wrapper for the full-bleed banner. `position: "relative"` is the
   * anchor for the absolute action row (`actionsOverBanner`); no
   * horizontal padding because the banner spans the full FlashList
   * header width.
   */
  bannerWrap: {
    position: "relative",
  },
  /**
   * Banner image styles. `width: "100%"` so the image fills the
   * FlashList header width; the per-render aspect ratio is supplied
   * inline from {@link UserProfileBanner.aspectRatio} (default 3).
   * Background colour is filled inline from
   * {@link Theme.surfaceWell} so the slot stays legibly opaque while
   * the image loads.
   */
  bannerImage: {
    width: "100%",
  },
  /**
   * Body wrapper applied to the identity stack, bio, meta, and stats
   * rows (the tab strip lives in {@link "../Feed".FeedProps.stickyHeader}
   * now, not in here). Horizontal padding matches {@link "../Page".Page}'s
   * `paddingHorizontal: 20` so the column lines up with the post bodies
   * below (which carry the same padding from
   * {@link "../Feed".Feed}'s `styles.item`). `paddingBottom` reserves
   * the breathing space the tab strip's old `marginTop: 20` used to
   * inject inline -- without it, the stats row's last digits would
   * sit flush against the sticky strip's top edge.
   */
  body: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  /**
   * Inline action-row slot used in the bannerless variant: right-
   * aligned above the identity stack so the actions read at the top
   * of the body. `paddingTop` matches the original kit screen's
   * vertical rhythm so the row doesn't crowd the navigation header.
   */
  actionsInline: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 16,
  },
  /**
   * Absolute action-row slot anchored to the banner's top-right.
   * `pointerEvents="box-none"` (applied on the JSX) lets taps that
   * miss the inner buttons pass through to the banner -- the slot is
   * not its own affordance, just a positioning anchor.
   */
  actionsOverBanner: {
    position: "absolute",
    top: 12,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  /**
   * 4-pixel surface-card ring around the avatar. The wrapper is a
   * square with full corner radius so the ring reads as a circle
   * matching the avatar's `shape="round"`. Background colour is
   * filled inline from {@link Theme.surfaceCard} so the ring blends
   * into the page (and visually punches a hole through the banner
   * in the overlap variant).
   */
  avatarRing: {
    width: AVATAR_RING_SIZE,
    height: AVATAR_RING_SIZE,
    borderRadius: AVATAR_RING_SIZE / 2,
    padding: AVATAR_RING_WIDTH,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  /**
   * Negative top margin applied when the banner is present, lifting
   * the wrapper so the avatar's vertical centre lines up with the
   * banner / body seam. Half the wrapper's side length matches the
   * convention every social client converges on (X / Bluesky /
   * Mastodon all overlap the avatar half-and-half).
   */
  avatarRingOverlap: {
    marginTop: -AVATAR_OVERLAP,
  },
  /**
   * Identity stack: a column of `name`, `handle`, and the flag row.
   * Sits directly below the avatar with a small `marginTop` for
   * breathing room.
   */
  identity: {
    marginTop: 12,
  },
  /**
   * Display-name line. 24px / 700 is intentionally heavier than any
   * {@link "../Typography".default} role today; the user-profile
   * header is the only place in the kit that needs a "page subject"
   * size, so the style stays local rather than promoted to
   * Typography.
   */
  name: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  /**
   * Wraps the `@handle`. Tiny top margin so the handle reads as a
   * line of its own without crowding the name above.
   */
  handleRow: {
    marginTop: 2,
  },
  /**
   * Citizenship + residence row. Carries the flag and the
   * location string on a single inline row sitting below the
   * `@handle` line; `marginTop` gives it daylight from the handle
   * above. `gap` controls the spacing between the flag glyph and
   * the location label so the two read as one geographic
   * statement. Kept as a row (rather than dropping the wrapper
   * around just the flag) so future identity additions (e.g.
   * verification badges) can land on the same baseline without
   * re-introducing the layout scaffolding.
   */
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  /**
   * Flag's hairline corner radius matches the Profile row's flag
   * style. No border here -- the user-profile header doesn't apply
   * the 40%-alpha hairline the Profile row uses, since the larger
   * flag (`size: 14`) reads cleanly without it on either theme.
   */
  flag: {
    borderRadius: 2,
  },
  /**
   * Location text sitting to the right of the flag on the same row.
   * Body rhythm (14/20) so it reads as a peer to the `@handle`
   * directly above it -- the flag glyph then floats at the row's
   * vertical center thanks to `flagRow`'s `alignItems: "center"`.
   * `flexShrink: 1` lets the text truncate with the row's
   * single-line `numberOfLines` prop on narrow widths rather than
   * pushing the row past the identity stack's edge.
   */
  location: {
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  /**
   * Bio paragraph wrapper. Top margin gives the bio breathing room
   * from the identity stack above; the bio's own typography (a
   * caller-supplied {@link "../Typography".Description} or similar)
   * carries the inner styling.
   */
  bioRow: {
    marginTop: 12,
  },
  /**
   * Meta row container. `flexWrap: "wrap"` lets multi-entry rows
   * reflow onto a second line at narrow widths rather than horizontal-
   * scroll. `gap` controls the spacing between entries (vertical too,
   * for the wrap case).
   */
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
    columnGap: 12,
    marginTop: 12,
  },
  /**
   * Single meta entry: icon + label, with a small gap between the two
   * so they read as one unit.
   */
  metaEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  /**
   * Meta label text. Caption rhythm (13/19) so it sits one notch
   * smaller than body copy.
   */
  metaLabel: {
    fontSize: 13,
    lineHeight: 19,
  },
  /**
   * Stats row container. Wraps like the meta row; uses inline-text
   * runs for each entry so middot separators stay on the same line
   * as their entry on wrap.
   */
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 4,
    marginTop: 14,
  },
  /**
   * Pressable wrapper around one stat entry. No padding -- the entry
   * is sized by its inner text run so the press target hugs the
   * copy. {@link styles.statPressed} dips the opacity on press.
   */
  statPressable: {
    flexDirection: "row",
  },
  /**
   * Press feedback for {@link styles.statPressable}. Matches the
   * Accordion toggle / tab cell opacity dip (0.6) so every tappable
   * text row in the kit feels the same under press.
   */
  statPressed: {
    opacity: 0.6,
  },
  /**
   * Outer Text wrapping the value, separator (when not first), and
   * label of one stat entry. The whole entry lives in one Text run so
   * the wrap break never orphans the label onto its own line.
   */
  statBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  /**
   * Bold value style. Colour is filled inline from
   * {@link Theme.fgEmphasis} so the number carries the visual weight
   * over the muted label beside it.
   */
  statValue: {
    fontWeight: "700",
  },
  /**
   * Muted label trailing the value (e.g. `"Followers"`). Colour is
   * filled inline from {@link Theme.fgMuted}.
   */
  statLabel: {
    fontWeight: "400",
  },
  /**
   * Middot separator between consecutive stats. Same colour as
   * {@link styles.statLabel} so it sits quietly inside the row.
   * `accessibilityElementsHidden` (applied on the JSX) keeps screen
   * readers from announcing the dot as a list bullet.
   */
  statSeparator: {
    fontWeight: "400",
  },
  /**
   * Tab strip row. Renders inside the Feed's
   * {@link "../Feed".FeedProps.stickyHeader} slot rather than inline
   * inside the body, so it carries no `marginTop` of its own -- the
   * surrounding {@link styles.body}'s `paddingBottom` reserves the
   * breathing space above it instead. The bottom hairline gives the
   * strip a baseline rule even before the user scrolls, which is what
   * visually separates it from the first post below (otherwise the
   * sticky surface would bleed straight into the post column). Colour
   * is filled inline from {@link Theme.borderDefault}.
   */
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  /**
   * Individual tab cell -- `flex: 1` so the tabs split the row
   * evenly regardless of label length, `position: "relative"` so the
   * active underline can anchor to the cell's bottom edge with
   * absolute positioning.
   */
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  /**
   * Press feedback for the tab cell. Matches Accordion's toggle
   * (same `opacity: 0.6` value) so the kit's "tappable text row"
   * affordances feel consistent under press.
   */
  tabPressed: {
    opacity: 0.6,
  },
  /**
   * Base tab label. Sized one notch smaller than body so the strip
   * sits lower-key than the identity above. Letter-spacing matches
   * the previous TABS implementation so the visual continuity
   * survives the API revamp.
   */
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  /**
   * Bolder weight for the active tab's label. Paired with the
   * {@link Theme.fgEmphasis} colour applied inline (vs. the inactive
   * {@link Theme.fgMuted}), so an active tab reads as "strong + dark"
   * against the muted ones beside it without leaning on colour
   * alone -- weight differences survive screenshots, accessibility
   * audits, and the small-screen render where colour distinctions
   * compress.
   */
  tabLabelActive: {
    fontWeight: "700",
  },
  /**
   * Muted-count suffix on the tab label (e.g. "Posts 124"). Lives
   * inside the same Text run as the label so it inherits the wrap
   * rhythm; weight stays normal so the count doesn't compete with
   * the bold label.
   */
  tabCount: {
    fontWeight: "400",
  },
  /**
   * 2-pixel underline anchored to the tablist's bottom edge. Rendered
   * as a single {@link Animated.View} sibling of the tab cells (not
   * one underline per cell) so the active-tab transition can animate
   * the indicator across the strip rather than fade two siblings in
   * and out. `width` is set inline to the per-cell width derived from
   * the tablist's layout; `translateX` is the animated value the
   * spring drives every active-tab change. Sits flush with the tab
   * strip's hairline bottom border (so the two read as a single
   * thicker stroke under the active label) and spans one cell width
   * -- Twitter / X / Bluesky all use a full-cell indicator rather
   * than a centred marker, and matching the convention keeps the
   * active-state read immediate.
   */
  tabUnderline: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: 2,
  },
});
