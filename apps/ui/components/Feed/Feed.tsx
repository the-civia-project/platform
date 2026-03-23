/**
 * Infinite-scrolling list of {@link Post}s rendered on top of
 * `@shopify/flash-list`'s {@link FlashList}. The Feed is the canonical
 * "stream of posts" surface -- timelines, profile feeds, hashtag pages --
 * and is built around one strict UX invariant by default: **the user must
 * never reach the end of an infinite feed**.
 *
 * Internally the Feed flattens the consumer's `posts` array into a
 * discriminated row union ({@link FeedRow}) before handing it to
 * FlashList. The union has three shapes -- `"post"` (the canonical
 * row), `"sticky"` (the optional {@link FeedProps.stickyHeader} pinned
 * at the top of the post column), and `"empty"` (the
 * {@link FeedProps.emptyState} hoisted into the data array when
 * `posts` is empty, so it sits below the sticky header). The
 * sticky-as-data-row idiom is what lets FlashList's
 * `stickyHeaderIndices` pin a custom React node to the top of the
 * scroll surface; the empty-as-data-row variant exists for the same
 * reason -- FlashList's `ListEmptyComponent` is skipped whenever any
 * row (including the sticky) is in the data array, so the empty slot
 * has to live inside the data list too.
 *
 * That invariant is enforced two ways for the default "more is coming"
 * shape:
 *
 * 1. {@link FeedProps.onEndReached} fires while the bottom edge is still a
 *    full viewport height away from the rendered end (default
 *    {@link FeedProps.onEndReachedThreshold} is `1`), so the consumer has a
 *    generous lead time to append more items before the user catches up.
 * 2. A spinner footer (see {@link FeedFooter}) is rendered below the last
 *    item so the user reads a "loading more" affordance rather than a hard
 *    bottom edge while the consumer is mid-fetch.
 *
 * Two opt-outs honour the cases the default contract cannot:
 *
 * - {@link FeedProps.hasMore} `= false` -- the consumer is telling the
 *   Feed the list is *finite*: no more pages will ever arrive. The
 *   spinner footer is suppressed and {@link FeedProps.onEndReached} stops
 *   firing, so the feed ends cleanly at the last post (a user with a
 *   bounded contribution history, an archive view, a hashtag exhausted
 *   of fresh posts).
 * - {@link FeedProps.emptyState} -- React node rendered in the recycler's
 *   empty slot when `posts.length === 0`. Takes the place of the spinner
 *   footer in that case so an empty feed reads as "nothing here" rather
 *   than "still loading" -- the right message for a tab the user
 *   genuinely has no entries on (a fresh profile's Replies tab, a
 *   never-used hashtag).
 *
 * The Feed is the scrollable; **do not nest it inside another vertical
 * `ScrollView`** (including the kit's {@link "../Page".Page} wrapper).
 * On web both layers can negotiate the wheel cleanly, but on iOS and
 * Android the outer container captures the vertical pan and the inner
 * recycler never gets to scroll -- no `nestedScrollEnabled` combination
 * fully resolves that. In real product views, mount the Feed as the
 * screen's full-height top-level child; reach for
 * {@link FeedProps.ListHeaderComponent} when the screen also needs a
 * scrolling intro (a profile-feed header, a hashtag page intro, the kit
 * demo's prose).
 *
 * FlashList v2 powers the recycler under the hood. It runs JS-only on the
 * New Architecture, handles dynamic item sizes without estimates, and
 * keeps the user's scroll position stable as new items are appended via
 * the default `maintainVisibleContentPosition` behaviour -- exactly the
 * shape an infinite feed wants.
 *
 * One per-row prop is deliberately blocked: the kebab overflow menu
 * (`showMenu` / `onMenuPress` on {@link Post}) is **never** rendered for
 * a Feed row. Feeds are dense, vertically repeating surfaces; a kebab
 * on every line adds visual noise without offering an action that isn't
 * already reachable by opening the post. See {@link FeedItem} for how
 * that invariant is encoded -- the menu slots are omitted from the row
 * shape, and the renderer pins `showMenu` to `false` after the spread
 * as a runtime backstop.
 *
 * The other engagement handlers ({@link PostProps.onLikePress} and
 * siblings) are also stripped from the row shape -- but for a different
 * reason. A feed view almost always wants to react to "user liked
 * *which* post?", and wiring that per row would force the consumer to
 * close over each item when they build the array. Instead, the Feed
 * exposes a single {@link FeedProps.onPostLike} (plus comment / repost /
 * bookmark / share / press siblings) that already carries the {@link FeedItem} as
 * its argument. The renderer maps those Feed-level callbacks back onto
 * each Post's per-row handlers under the hood, so consumers get one
 * stable handler per kind of intent and Post's primitive API stays
 * untouched.
 */
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentType,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  FlashList,
  type FlashListRef,
  type ListRenderItemInfo,
} from "@shopify/flash-list";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import Post, { type PostProps } from "../Post";
import { useTheme } from "../use-theme";

/**
 * One row in the {@link Feed}: {@link PostProps} forwarded verbatim to
 * {@link Post}, minus the kebab-menu slots and the four engagement
 * handlers (see below), plus a stable {@link FeedItem.id} that FlashList
 * uses to key cells across renders.
 *
 * Keeping the row shape as `PostProps & { id }` (rather than wrapping the
 * post in a `post` field) means callers can build a feed by mapping over
 * server records straight into the {@link FeedProps.posts} array -- the
 * Feed has no opinions about a row beyond "it renders as a Post".
 *
 * `showMenu` and `onMenuPress` are deliberately omitted from the row
 * shape: the kebab overflow menu belongs to the post-*detail* view, not
 * the feed row, where it would add visual noise to every line in a
 * long scroll without offering an action that isn't already reachable
 * by opening the post. If a future product genuinely needs in-feed
 * kebabs, expose them as a Feed-level prop instead of leaking them per
 * row -- per-row toggling would re-introduce the noise this omission
 * deletes.
 *
 * `showShare` and `showBookmark` are also omitted: the Feed is a public
 * save-and-share surface by definition, so every row's Bookmark and Share
 * affordances are opted-in unconditionally inside {@link Feed} rather than
 * left to per-row configuration. This matches the {@link Post}-level default
 * ("hidden unless opted in") while keeping the Feed's appearance consistent
 * across every row -- some posts surfacing Bookmark or Share and others not
 * would read as flaky.
 *
 * The engagement handlers (`onLikePress`, `onCommentPress`,
 * `onRepostPress`, `onSharePress`, `onBookmarkPress`) are also omitted because the Feed
 * exposes Feed-level equivalents ({@link FeedProps.onPostLike} and
 * siblings) that already carry the {@link FeedItem} argument. Letting
 * callers wire per-row handlers would force them to close over each
 * item when they build the array and would leave consumers with two
 * places to read for "what fires when someone presses Like?" -- one
 * Feed-level slot per intent is enough.
 *
 * Same logic for `onMentionPress`, `onUrlPress`, and `onHashtagPress`:
 * the Feed exposes {@link FeedProps.onPostMention},
 * {@link FeedProps.onPostUrlPress}, and
 * {@link FeedProps.onPostHashtag} -- single Feed-level callbacks
 * fired for any inline `@`-mention, URL link, or `#`-hashtag tap,
 * with both the row and the tapped handle / `href` / tag handed
 * over -- so per-row consumers don't have to close over each item
 * when building the array.
 */
export type FeedItem = Omit<
  PostProps,
  | "showMenu"
  | "onMenuPress"
  | "showShare"
  | "showBookmark"
  | "onLikePress"
  | "onCommentPress"
  | "onRepostPress"
  | "onSharePress"
  | "onBookmarkPress"
  | "onMentionPress"
  | "onUrlPress"
  | "onHashtagPress"
> & {
  /**
   * Stable identifier for the post. Used as the FlashList key, so it must
   * be unique across the entire {@link FeedProps.posts} array and stable
   * across appends -- the same post should keep the same id when more
   * pages are loaded.
   */
  id: string;
};

/**
 * Discriminated union of row shapes the recycler renders. Internal to
 * {@link Feed} -- consumers never construct these directly. The
 * component flattens the public `posts: FeedItem[]` plus the optional
 * {@link FeedProps.stickyHeader} and {@link FeedProps.emptyState}
 * into one `FeedRow[]` array before handing it to FlashList, so the
 * renderer can branch on a single discriminant (`kind`) rather than
 * juggling sibling slots (`ListHeaderComponent`,
 * `ListEmptyComponent`, sticky overlay, ...) that each carry their
 * own quirks.
 *
 * Three shapes:
 *
 * - `"sticky"` -- the {@link FeedProps.stickyHeader} node. Always
 *   exactly one when set, always injected at index `0` so
 *   `stickyHeaderIndices={[0]}` resolves cleanly. Painted on a
 *   {@link Theme.surfaceCard} background.
 * - `"post"` -- the canonical row, wrapping one {@link FeedItem} into
 *   a rendered {@link Post}. The majority of every feed is these.
 * - `"empty"` -- the {@link FeedProps.emptyState} node, injected only
 *   when the consumer's `posts` array is empty AND `emptyState` is
 *   set. Lives in the data list (rather than FlashList's
 *   `ListEmptyComponent` slot) so it can render *below* the sticky
 *   header on tabs that genuinely have nothing in them.
 */
type FeedRow =
  | { kind: "sticky"; node: ReactNode }
  | { kind: "post"; item: FeedItem }
  | { kind: "empty"; node: ReactNode };

/**
 * Props for {@link Feed}.
 */
export type FeedProps = {
  /**
   * Posts currently in the feed, top-to-bottom. Append new items to this
   * array in response to {@link FeedProps.onEndReached}; the Feed mutates
   * nothing and assumes the parent owns paging state.
   */
  posts: FeedItem[];
  /**
   * Called once when the user scrolls within
   * {@link FeedProps.onEndReachedThreshold} viewport heights of the
   * bottom. The consumer is expected to fetch the next page and append it
   * to {@link FeedProps.posts} so the user never catches the end. Fires at
   * most once per scroll segment -- FlashList re-arms the callback only
   * after new content shifts the threshold further away again.
   *
   * Suppressed when {@link FeedProps.hasMore} is `false`: a finite list
   * has nothing left to fetch, so the kit drops the callback rather than
   * firing it once at the bottom for the consumer to silently ignore.
   */
  onEndReached: () => void;
  /**
   * Distance from the bottom, measured in visible list heights, at which
   * {@link FeedProps.onEndReached} fires. A value of `1` triggers the
   * callback one full screen before the rendered end; lower values fetch
   * later (closer to the bottom), higher values fetch earlier. The default
   * is deliberately generous -- the whole point of the Feed is the user
   * must never reach the end, so we give the consumer a screen of lead
   * time to honour the contract.
   * @defaultValue 1
   */
  onEndReachedThreshold?: number;
  /**
   * Whether the feed has more pages still to load. The default, `true`,
   * is the canonical "infinite stream" shape: the spinner footer renders
   * below the last post and {@link FeedProps.onEndReached} fires as the
   * user nears the bottom. Flip to `false` when the consumer knows the
   * list is *finite* and bounded -- a user's full post history once the
   * last page returns no new rows, a single hashtag exhausted of
   * results, an archive view with a known end. With `hasMore: false`
   * the spinner footer is suppressed (the list ends cleanly at the last
   * post) and {@link FeedProps.onEndReached} no longer fires (no more
   * pages to fetch).
   *
   * Orthogonal to {@link FeedProps.emptyState}: an empty feed with
   * `hasMore: true` reads as "loading" (or shows the empty state if
   * provided), while an empty feed with `hasMore: false` reads as
   * "this list is finished and there was nothing in it" (the empty
   * state, if provided, still renders -- the spinner stays off either
   * way).
   * @defaultValue true
   */
  hasMore?: boolean;
  /**
   * React node rendered in the recycler's empty slot when
   * {@link FeedProps.posts} is empty. Takes the place of the spinner
   * footer for the empty-feed case so the user reads "nothing here"
   * rather than "still loading" -- the right message for a tab the
   * user genuinely has no entries on (a fresh profile's Replies tab,
   * a hashtag with no posts yet). When omitted on an empty feed the
   * recycler renders nothing in the empty slot and the spinner footer
   * still shows (gated by {@link FeedProps.hasMore}) so the screen
   * doesn't go entirely blank during an in-flight first page.
   *
   * The node is rendered inside a 24-padded centred slot so simple
   * `<Eyebrow>` / `<Description>` pairs read with the same vertical
   * breathing room as the rest of the kit's prose; consumers that want
   * a full-bleed empty state should reach for a custom wrapper.
   */
  emptyState?: ReactNode;
  /**
   * Optional content rendered above the first post, scrolling together
   * with the feed body. Useful when the screen needs an intro that would
   * otherwise have to live inside a separate scrollable above the Feed
   * -- profile-feed headers, hashtag page introductions, the UI Kit
   * demo's prose. Because the Feed is the screen's only vertical scroll
   * container, nesting prose in here is the canonical way to add
   * non-post content without re-introducing the nested-scroll problem.
   *
   * Accepts the same shapes as FlashList's `ListHeaderComponent`: a
   * React element (`<Header />`) or a component reference (`Header`).
   *
   * Paired with {@link FeedProps.stickyHeader} for the canonical
   * "scrolling header above a pinned tab strip" shape that
   * {@link "../UserProfile".default} uses: the X-style identity /
   * banner / bio / meta / stats panel rides in
   * {@link FeedProps.ListHeaderComponent} (scrolls away), the tab strip
   * rides in {@link FeedProps.stickyHeader} (stays pinned).
   */
  ListHeaderComponent?: ComponentType | ReactElement | null;
  /**
   * Optional React node pinned to the top of the *post column* as the
   * user scrolls. Stays in document flow below
   * {@link FeedProps.ListHeaderComponent} initially -- so the scrolling
   * header still owns the top of the surface on mount -- and sticks to
   * the viewport's top edge once the user scrolls past it. Painted on
   * a {@link Theme.surfaceCard} background so post bodies sliding
   * underneath don't bleed through the sticky's text.
   *
   * Implementation note: the Feed injects this node as a synthetic
   * row at `data[0]` (with a `__sticky` kind that the renderer
   * branches on) and passes `stickyHeaderIndices={[0]}` to FlashList.
   * That's why scrolling past the sticky doesn't unmount it -- the
   * row stays in the data list, FlashList just keeps it pinned. The
   * separator hairline between adjacent rows is suppressed under the
   * sticky so the strip's bottom edge reads cleanly into the first
   * post.
   *
   * Canonical use: the {@link "../UserProfile".default} tab strip --
   * a horizontal row of pressables that needs to stay reachable as
   * the user scrolls through a tab's feed. Leave undefined when the
   * Feed has nothing to pin (a stand-alone timeline, a hashtag page).
   */
  stickyHeader?: ReactNode;
  /**
   * Called when the user performs a pull-to-refresh gesture from the
   * top of the post column. The consumer is expected to fetch the
   * latest page from the source, replace (or prepend to) its
   * {@link FeedProps.posts} array, and flip {@link FeedProps.refreshing}
   * back to `false` when the work is done.
   *
   * Wiring this opts the Feed into React Native's `RefreshControl` --
   * the platform-native pull spinner appears at the top of the
   * scroll surface and reads as the canonical "fetch latest" gesture
   * on both iOS and Android. Leave undefined to disable the gesture
   * entirely; the spinner footer at the bottom is unaffected (that
   * one belongs to the "load more" loop driven by
   * {@link FeedProps.onEndReached}, not refresh).
   *
   * Return type is `void | Promise<void>` so consumers can either
   * fire-and-forget (parent owns its own refreshing state) or `await`
   * an inline operation; the Feed never inspects the return value
   * itself, but typing the promise variant keeps async handlers
   * legible at the call site.
   */
  onRefresh?: () => void | Promise<void>;
  /**
   * Whether a pull-to-refresh is currently in flight. Forwarded
   * verbatim to `RefreshControl`'s `refreshing` prop, which is what
   * keeps the platform spinner visible (and the pull gesture
   * suppressed) while the consumer fetches. Ignored unless
   * {@link FeedProps.onRefresh} is also set -- the kit doesn't render
   * a `RefreshControl` without a handler to drive it.
   *
   * @defaultValue false
   */
  refreshing?: boolean;
  /**
   * Fires when the user taps anywhere on a post row that isn't already
   * claimed by an inner pressable (the engagement actions, an embedded
   * post inset, a media tile). The canonical "open the post detail"
   * intent -- wire this to a navigator push that takes the consumer to
   * a screen rendering the same post in detail view (typically with
   * `showComments` flipped and the full comment thread).
   *
   * When this handler is left undefined the Feed renders rows as plain
   * non-interactive views; setting it is what tells the Feed "rows are
   * pressable for me". Inner pressables (action buttons, embedded
   * posts, media tiles) still win the touch responder when they cover
   * the press point, so action presses never accidentally trigger an
   * "open detail" navigation.
   *
   * @param post - The full {@link FeedItem} that was tapped. Carries
   *   the `id` and every {@link Post} prop, so navigators can hand off
   *   the same shape they'd build a detail view from.
   */
  onPostPress?: (post: FeedItem) => void;
  /**
   * Fires when the user presses the Like action on a row. The Feed
   * treats this as a *toggle intent*: the consumer is expected to read
   * the post's current {@link Post.liked} state and flip it (and
   * `likeCount`) in their store, then pass the updated post back via
   * the {@link FeedProps.posts} array. The kit holds no like state of
   * its own -- a `liked: true` row that fires this means "user wants
   * to unlike", and a `liked: false` row means "user wants to like".
   *
   * @param post - The full {@link FeedItem} whose Like button was
   *   pressed, captured at render time. Use `post.id` to match the
   *   row in your store and `post.liked` to choose the toggle
   *   direction.
   */
  onPostLike?: (post: FeedItem) => void;
  /**
   * Fires when the user presses the Comment action on a row. An
   * *intent* signal (the kit doesn't manage compose UI or thread
   * state): typical wirings either expand the thread inline by
   * flipping {@link Post.showComments} on that row, open a compose sheet,
   * or navigate to the post detail focused on the reply field.
   *
   * @param post - The full {@link FeedItem} whose Comment button was
   *   pressed.
   */
  onPostComment?: (post: FeedItem) => void;
  /**
   * Fires when the user presses the Re-post action on a row. Same
   * toggle-intent shape as {@link FeedProps.onPostLike}: read
   * {@link Post.reposted}, flip it (and `repostCount`), pass the
   * updated post back. If your product layers a "quote with comment"
   * affordance on top, fire that compose flow from here instead.
   *
   * @param post - The full {@link FeedItem} whose Re-post button was
   *   pressed.
   */
  onPostRepost?: (post: FeedItem) => void;
  /**
   * Fires when the user presses the Share action on a row. The kit
   * doesn't ship a share sheet -- this is the hand-off to the
   * platform's native share UI (or an in-app share modal). The post is
   * passed in full so consumers can build the share payload (URL,
   * snippet, image preview) without re-fetching.
   *
   * @param post - The full {@link FeedItem} whose Share button was
   *   pressed.
   */
  onPostShare?: (post: FeedItem) => void;
  /**
   * Fires when the user presses the Bookmark action on a row. Same
   * toggle-intent shape as {@link FeedProps.onPostLike}: read
   * {@link Post.bookmarked}, flip it, pass the updated post back.
   *
   * @param post - The full {@link FeedItem} whose Bookmark button was
   *   pressed.
   */
  onPostBookmark?: (post: FeedItem) => void;
  /**
   * Fires when an inline `@`-mention inside any row's body copy is
   * tapped. The row and the tapped handle are both passed: the row so
   * consumers can re-derive context (which post the mention came from,
   * what feed the user is on) without closing over each item at build
   * time, the handle so a single "open profile" navigator can be wired
   * once at the Feed level rather than per row.
   *
   * The handle arrives **without** the leading `@`, matching the value
   * stored on {@link "../Post".PostMentionSegment.handle} and consumed
   * by routers / lookup tables. Wire to your "open user profile" flow.
   *
   * Only mention segments inside structured
   * {@link "../Post".PostContent} arrays are actionable -- the kit
   * does not parse `@handle` tokens out of plain-string `content`, so
   * a literal `@` in body copy (email, hashtag-adjacent handle the
   * author isn't tagging) stays inert and won't fire this callback.
   *
   * @param post - The full {@link FeedItem} the mention was rendered in.
   * @param handle - The mentioned user's handle, without the `@` prefix.
   */
  onPostMention?: (post: FeedItem, handle: string) => void;
  /**
   * Fires when an inline URL link inside any row's body copy is
   * tapped. The row and the segment's raw `href` are both passed:
   * the row so consumers can re-derive context (which post the link
   * came from, what feed the user is on) without closing over each
   * item at build time, the `href` so a single "open URL" dispatcher
   * can be wired once at the Feed level rather than per row.
   *
   * The `href` arrives **verbatim** -- scheme intact (`https://...`,
   * `mailto:...`, custom schemes), never the prettified display the
   * kit shows inline -- so callers route directly without
   * round-tripping. Typically wire to `Linking.openURL(href)` on
   * React Native or `window.open(href, "_blank")` on the web.
   *
   * Only URL segments inside structured
   * {@link "../Post".PostContent} arrays are actionable -- the kit
   * does not parse `https://` tokens out of plain-string `content`,
   * so a literal URL in body copy (a CLI command, a code example,
   * a markdown snippet) stays inert and won't fire this callback.
   *
   * @param post - The full {@link FeedItem} the URL was rendered in.
   * @param href - The segment's raw URL, with scheme intact.
   */
  onPostUrlPress?: (post: FeedItem, href: string) => void;
  /**
   * Fires when an inline hashtag inside any row's body copy is
   * tapped. The row and the bare tag string are both passed: the
   * row so consumers can re-derive context (which post the hashtag
   * came from, what feed the user is on) without closing over each
   * item at build time, the tag so a single "open hashtag feed"
   * dispatcher can be wired once at the Feed level rather than per
   * row.
   *
   * The tag arrives **without** the leading `#`, matching the value
   * stored on {@link "../Post".PostHashtagSegment.tag} and how the
   * kit stores handles on {@link "../Post".PostMentionSegment.handle}.
   * Wire to your search / hashtag-feed / topic-page navigator.
   *
   * Only hashtag segments inside structured
   * {@link "../Post".PostContent} arrays are actionable -- the kit
   * does not parse `#` tokens out of plain-string `content`, so a
   * literal `#` in body copy (a numbered list, a markdown heading
   * example, a temperature reading) stays inert and won't fire this
   * callback.
   *
   * @param post - The full {@link FeedItem} the hashtag was rendered in.
   * @param tag - The segment's tag, without the leading `#`.
   */
  onPostHashtag?: (post: FeedItem, tag: string) => void;
};

/**
 * Imperative handle returned via {@link Feed}'s `ref`. Exposes a deliberately
 * narrow scroll surface so parents can drive scroll position after state
 * changes the user wouldn't anticipate -- replacing the entire
 * {@link FeedProps.posts} array, switching tabs in a profile feed, applying
 * a new filter -- without leaking FlashList's full imperative API into the
 * kit. If a richer surface is needed later, expose specific methods one at
 * a time rather than handing out the underlying ref wholesale.
 */
export type FeedHandle = {
  /**
   * Scrolls the feed back to the first post, sweeping past any
   * {@link FeedProps.ListHeaderComponent} rendered above the post list.
   * "Top of the feed" deliberately means the top of the post column
   * rather than the top of the underlying scroll surface: the header
   * carries auxiliary content (profile banner, hashtag intro, kit demo
   * prose) that consumers don't usually think of as part of the feed
   * itself, so a "scroll to top" action that landed inside the header
   * would feel like missing the target.
   *
   * Pair with a `setPosts(seed)` call when the parent replaces the
   * feed contents wholesale: without resetting scroll the user would
   * land somewhere past the new last post, since FlashList preserves
   * position by default when item keys at the current offset still
   * exist in the new data.
   *
   * When the feed is empty (no items currently in
   * {@link FeedProps.posts}), the call falls back to a plain
   * scroll-to-zero so an only-header view at least returns to a known
   * position.
   *
   * @param options - Optional animation flag.
   * @param options.animated - Whether the scroll animates. Defaults to
   *   `true` so the reset reads as an intentional transition rather than
   *   a jarring snap.
   */
  scrollToTop: (options?: { animated?: boolean }) => void;
};

/**
 * Renders an infinite-scrolling list of {@link Post}s. See {@link FeedProps}
 * for the data contract and {@link FeedHandle} for the imperative surface
 * available via `ref`.
 *
 * @param props - {@link FeedProps}
 * @param ref - {@link FeedHandle} -- optional, attach when the parent
 *   needs to drive scroll position imperatively (e.g. after a tab swap
 *   or a "reset feed" action).
 */
export const Feed = forwardRef<FeedHandle, FeedProps>(function Feed(
  {
    posts,
    onEndReached,
    onEndReachedThreshold = 1,
    hasMore = true,
    emptyState,
    ListHeaderComponent,
    stickyHeader,
    onRefresh,
    refreshing = false,
    onPostPress,
    onPostLike,
    onPostComment,
    onPostRepost,
    onPostShare,
    onPostBookmark,
    onPostMention,
    onPostUrlPress,
    onPostHashtag,
  },
  ref,
) {
  // Internal FlashList ref. Wrapped (rather than forwarded directly) so
  // {@link FeedHandle} stays narrow -- only the scroll helpers the kit
  // promises are exposed to consumers. Typed against {@link FeedRow}
  // rather than {@link FeedItem} because the recycler's data array is
  // the flattened union, not the bare post list.
  const listRef = useRef<FlashListRef<FeedRow>>(null);

  useImperativeHandle(
    ref,
    () => ({
      scrollToTop: ({ animated = true } = {}) => {
        const list = listRef.current;
        if (!list) return;
        // "Top of the feed" means the first row of the post column,
        // not the top of {@link FeedProps.ListHeaderComponent} above
        // it. With {@link FeedProps.stickyHeader} set, the sticky
        // row *is* the top of the column (it sits at index 0 in the
        // data array), so the same `scrollToIndex(0)` lands the
        // sticky strip flush against the viewport's top edge --
        // exactly the read consumers want.
        const data = list.props.data;
        if (data && data.length > 0) {
          // FlashList resolves the scroll on the next frame; the kit
          // fires-and-forgets because consumers pair this with a
          // synchronous state update and don't need to await the
          // animation.
          void list.scrollToIndex({ index: 0, animated });
        } else {
          // Empty data list -- nothing to land on, so fall back to
          // the raw scroll-to-zero. Only reached when there is no
          // sticky, no empty state, and no posts: a degenerate
          // header-only view.
          list.scrollToTop({ animated });
        }
      },
    }),
    [],
  );

  // Flatten the consumer's `posts` plus the optional sticky / empty
  // slots into one {@link FeedRow} array. The injection order is
  // fixed: sticky at index 0 (so `stickyHeaderIndices={[0]}` resolves
  // without arithmetic), then either the real posts or the empty
  // row, never both. Memoised on the inputs so FlashList's recycler
  // doesn't see a new array reference on unrelated re-renders.
  const data = useMemo<FeedRow[]>(() => {
    const rows: FeedRow[] = [];
    if (stickyHeader !== undefined && stickyHeader !== null) {
      rows.push({ kind: "sticky", node: stickyHeader });
    }
    if (posts.length === 0 && emptyState !== undefined && emptyState !== null) {
      rows.push({ kind: "empty", node: emptyState });
    } else {
      for (const item of posts) {
        rows.push({ kind: "post", item });
      }
    }
    return rows;
  }, [posts, stickyHeader, emptyState]);

  // `stickyHeaderIndices` is only meaningful when there *is* a sticky
  // row; passing `[]` on every render would re-allocate the array
  // reference. Compute once via memo: `[0]` when sticky is set,
  // `undefined` otherwise (FlashList's API treats undefined and an
  // empty array equivalently, and undefined keeps the prop off the
  // wire).
  const stickyHeaderIndices = useMemo(
    () => (stickyHeader !== undefined && stickyHeader !== null ? [0] : undefined),
    [stickyHeader],
  );

  const renderItem = useCallback(
    ({ item: row }: ListRenderItemInfo<FeedRow>) => {
      if (row.kind === "sticky") {
        return <StickyHeaderRow>{row.node}</StickyHeaderRow>;
      }
      if (row.kind === "empty") {
        return <EmptyRow>{row.node}</EmptyRow>;
      }
      const item = row.item;
      // Pull `id` off the row before forwarding to Post -- it's metadata for
      // the recycler, not a Post prop.
      const { id: _id, ...postProps } = item;
      // Each Post-level handler is wired only when its Feed-level
      // counterpart is set: leaving the per-row handler `undefined`
      // means {@link Post}'s action button renders inert (no press
      // feedback round-trip), matching consumers who pass `undefined`
      // for the action they don't care about. Closures capture the
      // current `item` so the consumer's Feed-level callback receives
      // the row in full -- the recycler will re-create them on the
      // next render anyway.
      const postNode = (
        <Post
          {...postProps}
          showMenu={false}
          showShare
          showBookmark
          onLikePress={onPostLike ? () => onPostLike(item) : undefined}
          onCommentPress={
            onPostComment ? () => onPostComment(item) : undefined
          }
          onRepostPress={onPostRepost ? () => onPostRepost(item) : undefined}
          onSharePress={onPostShare ? () => onPostShare(item) : undefined}
          onBookmarkPress={
            onPostBookmark ? () => onPostBookmark(item) : undefined
          }
          onMentionPress={
            onPostMention
              ? (handle) => onPostMention(item, handle)
              : undefined
          }
          onUrlPress={
            onPostUrlPress
              ? (href) => onPostUrlPress(item, href)
              : undefined
          }
          onHashtagPress={
            onPostHashtag
              ? (tag) => onPostHashtag(item, tag)
              : undefined
          }
        />
      );
      // Wrap in a {@link Pressable} only when {@link FeedProps.onPostPress}
      // is set; leaving rows as a plain {@link View} when the consumer
      // hasn't asked for row presses keeps the responder-system surface
      // out of the way for feeds that purely list posts. When the
      // wrapper *is* a Pressable, inner pressables (action buttons,
      // embedded post insets, media tiles) win the responder via React
      // Native's bubble-up convention, so the outer onPress only fires
      // for taps on bare body / avatar / content text.
      if (onPostPress) {
        return (
          <Pressable
            style={[styles.item, webFocusOutlineStyle()]}
            onPress={() => onPostPress(item)}
          >
            {postNode}
          </Pressable>
        );
      }
      return <View style={styles.item}>{postNode}</View>;
    },
    [
      onPostPress,
      onPostLike,
      onPostComment,
      onPostRepost,
      onPostShare,
      onPostBookmark,
      onPostMention,
      onPostUrlPress,
      onPostHashtag,
    ],
  );

  const keyExtractor = useCallback((row: FeedRow, index: number) => {
    if (row.kind === "sticky") return "__feed-sticky";
    if (row.kind === "empty") return "__feed-empty";
    return `post-${row.item.id}-${index}`;
  }, []);

  // Spinner footer renders only when the list is still paged ("more is
  // coming") *and* has at least one post beneath it; on an empty feed
  // (whether the empty-state row is showing or not) the spinner would
  // stack under the sticky / empty slot and read as a contradictory
  // "this list is empty and also loading". On a finite feed
  // ({@link FeedProps.hasMore} `false`) the spinner is gone wholesale
  // -- the list ends cleanly at the last post.
  const showSpinnerFooter = hasMore && posts.length > 0;
  // {@link FeedProps.onEndReached} is suppressed on finite feeds: with no
  // more pages to fetch, leaving the callback wired would just fire once
  // at the bottom for the consumer to silently ignore. Passing
  // `undefined` to FlashList disables the trigger entirely.
  const effectiveOnEndReached = hasMore ? onEndReached : undefined;
  // RefreshControl built only when the consumer wires
  // {@link FeedProps.onRefresh}; otherwise pulled state isn't a
  // valid affordance and the native spinner shouldn't render. The
  // wrapper closure boxes the consumer's handler so a void return
  // doesn't trip FlashList's prop typing -- React Native expects a
  // `() => void` for RefreshControl's onRefresh, and the kit accepts
  // `void | Promise<void>` for legibility, so the bridge happens here.
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => {
        void onRefresh();
      }}
    />
  ) : undefined;

  return (
    <FlashList
      ref={listRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={effectiveOnEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ItemSeparatorComponent={FeedSeparator}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={showSpinnerFooter ? FeedFooter : null}
      stickyHeaderIndices={stickyHeaderIndices}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    />
  );
});

/**
 * Hairline divider rendered between adjacent {@link Post}s. The Post itself
 * is chromeless on the page background, so the feed needs a visible line of
 * separation between rows -- otherwise consecutive posts blur into one
 * continuous body of text. The line uses {@link Theme.borderDefault} so it
 * matches every other hairline in the kit ({@link "../card".Card},
 * {@link "../Hero".Hero}, the quote inset inside {@link Post}).
 *
 * Kept as a module-level component (rather than inlined) so FlashList can
 * memoise the reference and reuse the same node across recycling cycles.
 *
 * Renders nothing when the row above the separator isn't a post: the
 * sticky header already provides its own visual ceiling via the
 * {@link Theme.surfaceCard} background underneath it, so a hairline
 * below the sticky would stack a second rule onto the same edge; the
 * empty-state row is the only thing in the column and never has a
 * neighbour to divide from. FlashList passes the row before the
 * separator as `leadingItem`, so the discriminant check below covers
 * both cases without needing index math.
 */
function FeedSeparator({ leadingItem }: { leadingItem?: FeedRow | null }) {
  const theme = useTheme();
  if (!leadingItem || leadingItem.kind !== "post") return null;
  return (
    <View style={[styles.separator, { backgroundColor: theme.borderDefault }]} />
  );
}

/**
 * Wrapper around the {@link FeedProps.stickyHeader} node when it
 * renders as a row in the recycler. Paints the surface that the
 * sticky pin rides on so posts sliding beneath the strip don't bleed
 * through the consumer's text -- the strip itself is whatever React
 * node the consumer passes, and consumers shouldn't have to remember
 * to wrap their own background.
 *
 * Lifted out of {@link renderItem} so the closure stays cheap and so
 * the `useTheme()` call happens at the right level (renderItem is a
 * useCallback and can't call hooks).
 */
function StickyHeaderRow({ children }: PropsWithChildren) {
  const theme = useTheme();
  return (
    <View style={[styles.sticky, { backgroundColor: theme.surfaceCard }]}>
      {children}
    </View>
  );
}

/**
 * Wrapper around the {@link FeedProps.emptyState} node when it renders
 * as a row in the recycler. Centres the empty-state copy inside a
 * generous 24-padded slot so simple `<Eyebrow>` / `<Description>`
 * pairs land with the kit's standard vertical breathing room;
 * consumers that want a full-bleed empty state should wrap their own
 * chrome before passing here.
 *
 * Lifted out of {@link renderItem} for the same reason as
 * {@link StickyHeaderRow}: keeps the closure cheap and the styles
 * adjacent to their related row variant.
 */
function EmptyRow({ children }: PropsWithChildren) {
  return <View style={styles.empty}>{children}</View>;
}

/**
 * Spinner footer rendered below the last post on infinite feeds
 * ({@link FeedProps.hasMore} `true`, the default) when at least one
 * post is on screen. The spinner reads as "the feed continues beyond
 * this point" -- the visible side of the Feed's "user must never reach
 * the end" invariant. Tinted with {@link Theme.fgMuted} so it sits
 * quietly under the last post rather than competing for attention.
 *
 * Suppressed on finite feeds ({@link FeedProps.hasMore} `false`) and on
 * empty feeds (so it doesn't stack under
 * {@link FeedProps.emptyState}) -- see the gating logic next to
 * {@link FlashList}'s `ListFooterComponent` for the resolution rules.
 */
function FeedFooter() {
  const theme = useTheme();
  return (
    <View style={styles.footer}>
      <ActivityIndicator color={theme.fgMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Per-row gutter inside the FlashList cell. Horizontal padding matches
   * {@link "../Page".Page}'s `paddingHorizontal: 20` so a Feed mounted full-
   * screen lines up with kit screens elsewhere; vertical padding gives the
   * post copy breathing room above and below the divider hairline.
   */
  item: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  /**
   * Hairline divider between {@link Post}s. The colour is filled inline by
   * {@link FeedSeparator} from the kit's {@link Theme.borderDefault} token.
   * `marginHorizontal` matches {@link styles.item}'s padding so the line
   * spans the same column as the post bodies.
   */
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },
  /**
   * Footer slot housing the {@link ActivityIndicator} when it renders.
   * The generous vertical padding keeps the spinner from hugging the
   * last post's action row, so the "more is coming" reading lands
   * cleanly. Whether the slot mounts at all is controlled by the
   * `showSpinnerFooter` gate inside {@link Feed}; see that comment for
   * the per-prop rules.
   */
  footer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  /**
   * Centred frame around {@link FeedProps.emptyState}. The horizontal
   * padding matches {@link styles.item} so empty copy lines up with the
   * post column the consumer would otherwise be reading; the generous
   * vertical padding gives the "nothing here" message room to breathe
   * without pinning it to the top of the viewport.
   */
  empty: {
    paddingHorizontal: 20,
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  /**
   * Frame around {@link FeedProps.stickyHeader} when it renders as a
   * pinned row. No padding -- the consumer's sticky node owns its own
   * layout (gap, padding, borders, etc.) so the wrapper only carries
   * the surface fill (filled inline from {@link Theme.surfaceCard}).
   * Without the fill, posts scrolling under the sticky would bleed
   * through, since FlashList paints sticky rows transparently by
   * default.
   */
  sticky: {},
});
