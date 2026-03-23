/**
 * Infinite-scrolling three-column media grid for the {@link UserProfile}
 * "Media" tab. Built on `@shopify/flash-list` with the same structural
 * slots as {@link "../Feed".Feed}: {@link UserProfileMediaGalleryProps.ListHeaderComponent}
 * carries the profile header, an optional {@link UserProfileMediaGalleryProps.stickyHeader}
 * row pins the tab strip, and {@link UserProfileMediaGalleryProps.onEndReached}
 * fires well ahead of the bottom so the parent can append the next page
 * of tiles before the user catches up. Image bytes are warmed in the
 * background via `expo-image` prefetch ({@link "./use-media-gallery-prefetch"})
 * and tiles stay on a solid well fill until decode completes so the user
 * never sees a progressive load.
 *
 * Images are chunked into full-width rows of three square tiles (the
 * X / Twitter media-tab layout) rather than using FlashList's
 * `numColumns`, so the sticky tab strip can occupy a single full-width
 * recycler row without fighting column-span rules.
 */
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  PixelRatio,
  RefreshControl,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  FlashList,
  type FlashListRef,
  type ListRenderItemInfo,
  type ViewToken,
} from "@shopify/flash-list";
import { useTheme } from "../use-theme";
import { chunkMediaImages } from "./chunk-media-images";
import { MediaGalleryTile } from "./MediaGalleryTile";
import {
  mediaGridThumbnailPixelSize,
  mediaGridTileLogicalSize,
  resolveMediaThumbnailUri,
  type ResolveMediaThumbnailSource,
} from "./resolve-media-thumbnail";
import { useMediaGalleryPrefetch } from "./use-media-gallery-prefetch";

/** Number of square tiles laid out per recycler row. */
const COLUMNS = 3;

/**
 * How many viewport heights before the bottom to request the next page.
 * Higher than {@link "../Feed".Feed}'s default so metadata paging stays
 * ahead of fast scrolls through dense photo grids.
 */
const DEFAULT_END_REACHED_THRESHOLD = 2;

/**
 * One image surfaced in the profile media grid. Mirrors the tile-data
 * half of {@link "../Media".ImageData} plus a stable recycler id and an
 * optional press handler wired at render time.
 */
export type UserProfileMediaItem = {
  /**
   * Stable identifier for the tile. Used as the FlashList key fragment;
   * must stay unique across {@link UserProfileMedia.images} and stable
   * across appends.
   */
  id: string;
  /**
   * Full-size (or canonical) asset URL -- used for lightbox / preview on
   * {@link UserProfileMediaItem.onPress}, not for the grid decode. The grid
   * fetches {@link UserProfileMediaItem.thumbnailSource} or the URL from
   * {@link UserProfileMedia.resolveThumbnailSource} sized to one column
   * width (see {@link "./resolve-media-thumbnail".mediaGridThumbnailPixelSize}).
   */
  source: string;
  /**
   * Optional pre-built thumbnail URL. When set (and no
   * {@link UserProfileMedia.resolveThumbnailSource} is provided), used
   * verbatim for grid tiles. Omit when the parent resolver derives a
   * sized URL from {@link source}.
   */
  thumbnailSource?: string;
  /**
   * Screen-reader label for the tile. Required so media-only tabs stay
   * accessible without body copy to lean on.
   */
  alt: string;
  /**
   * Display aspect ratio (`width / height`). Defaults to `1` -- square
   * tiles match the canonical profile-media grid (X / Instagram media
   * tabs crop to uniform squares in the grid even when the source
   * asset is portrait or landscape).
   * @defaultValue 1
   */
  aspectRatio?: number;
  /**
   * Optional press handler. When set, the tile becomes a button that
   * opens a preview / lightbox in the product layer.
   */
  onPress?: () => void;
};

/**
 * Per-tab media payload the parent owns, parallel to
 * {@link "./UserProfile".UserProfileFeed} for post tabs.
 */
export type UserProfileMedia = {
  /**
   * Images currently loaded for this tab, top-to-bottom / left-to-right
   * within each row of three. Append in response to
   * {@link UserProfileMedia.onEndReached}; the gallery mutates nothing.
   */
  images: UserProfileMediaItem[];
  /**
   * Called when the user scrolls within one viewport height of the
   * bottom. The consumer fetches the next page and appends to
   * {@link UserProfileMedia.images}.
   */
  onEndReached: () => void;
  /**
   * Whether more pages remain. When `false`, the spinner footer is
   * suppressed and {@link UserProfileMedia.onEndReached} stops firing.
   * @defaultValue true
   */
  hasMore?: boolean;
  /**
   * Node rendered when {@link UserProfileMedia.images} is empty.
   * Forwarded into the recycler below the sticky header, matching
   * {@link "../Feed".Feed}'s empty-row semantics.
   */
  emptyState?: ReactNode;
  /**
   * Pull-to-refresh handler for this tab. Leave undefined to disable
   * the gesture on this tab specifically.
   */
  onRefresh?: () => void | Promise<void>;
  /**
   * Whether a pull-to-refresh is in flight. Ignored unless
   * {@link UserProfileMedia.onRefresh} is set.
   * @defaultValue false
   */
  refreshing?: boolean;
  /**
   * Builds a square thumbnail URL sized to the current grid column width
   * ({@link "./resolve-media-thumbnail".mediaGridThumbnailPixelSize}).
   * When omitted, tiles use {@link UserProfileMediaItem.thumbnailSource}
   * or fall back to {@link UserProfileMediaItem.source}.
   */
  resolveThumbnailSource?: ResolveMediaThumbnailSource;
};

/**
 * Props for {@link UserProfileMediaGallery}.
 */
export type UserProfileMediaGalleryProps = {
  /** {@link UserProfileMedia.images} for the active tab. */
  images: UserProfileMediaItem[];
  /** {@link UserProfileMedia.onEndReached}. */
  onEndReached: () => void;
  /**
   * Distance from the bottom in viewport heights at which
   * {@link UserProfileMediaGalleryProps.onEndReached} fires.
   * @defaultValue 1
   */
  onEndReachedThreshold?: number;
  /**
   * {@link UserProfileMedia.hasMore}.
   * @defaultValue true
   */
  hasMore?: boolean;
  /** {@link UserProfileMedia.emptyState}. */
  emptyState?: ReactNode;
  /**
   * Profile header rendered above the grid via FlashList's
   * `ListHeaderComponent` slot. Accepts the same shapes as
   * {@link "../Feed".FeedProps.ListHeaderComponent}.
   */
  ListHeaderComponent?: ComponentType | ReactElement | null;
  /**
   * Tab strip pinned below the header once the user scrolls past the
   * profile chrome. Injected as a full-width sticky recycler row.
   */
  stickyHeader?: ReactNode;
  /** {@link UserProfileMedia.onRefresh}. */
  onRefresh?: () => void | Promise<void>;
  /**
   * {@link UserProfileMedia.refreshing}.
   * @defaultValue false
   */
  refreshing?: boolean;
  /**
   * {@link UserProfileMedia.resolveThumbnailSource} -- forwarded from the
   * active tab's media payload.
   */
  resolveThumbnailSource?: ResolveMediaThumbnailSource;
};

/**
 * Imperative scroll surface exposed via `ref`. Matches
 * {@link "../Feed".FeedHandle} so {@link "./UserProfile".default} can
 * treat post and media tabs uniformly for the re-tap scroll-to-top
 * affordance.
 */
export type UserProfileMediaGalleryHandle = {
  /**
   * Scrolls to the top of the media column (first grid row or sticky
   * strip), not the top of {@link UserProfileMediaGalleryProps.ListHeaderComponent}.
   *
   * @param options - Optional animation flag.
   * @param options.animated - Whether the scroll animates. Defaults to
   *   `true`.
   */
  scrollToTop: (options?: { animated?: boolean }) => void;
};

type MediaGalleryRow =
  | { kind: "sticky"; node: ReactNode }
  | { kind: "empty"; node: ReactNode }
  | {
      kind: "row";
      items: UserProfileMediaItem[];
      /** Index of {@link items}[0] in the flat image list. */
      imageStartIndex: number;
    };

/**
 * Renders the profile media grid. See {@link UserProfileMediaGalleryProps}
 * for the data contract.
 *
 * @param props - {@link UserProfileMediaGalleryProps}
 * @param ref - {@link UserProfileMediaGalleryHandle}
 */
export const UserProfileMediaGallery = forwardRef<
  UserProfileMediaGalleryHandle,
  UserProfileMediaGalleryProps
>(function UserProfileMediaGallery(
  {
    images,
    onEndReached,
    onEndReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
    hasMore = true,
    emptyState,
    ListHeaderComponent,
    stickyHeader,
    onRefresh,
    refreshing = false,
    resolveThumbnailSource,
  },
  ref,
) {
  const { width: windowWidth } = useWindowDimensions();
  const gap = StyleSheet.hairlineWidth;
  const tileSize = mediaGridTileLogicalSize(windowWidth, COLUMNS, gap);
  const thumbnailPixelSize = mediaGridThumbnailPixelSize(
    windowWidth,
    PixelRatio.get(),
    COLUMNS,
    gap,
  );

  const resolveThumbnail = useCallback(
    (item: UserProfileMediaItem) =>
      resolveMediaThumbnailUri(
        item,
        thumbnailPixelSize,
        resolveThumbnailSource,
      ),
    [thumbnailPixelSize, resolveThumbnailSource],
  );

  const listRef = useRef<FlashListRef<MediaGalleryRow>>(null);
  const [lastVisibleImageIndex, setLastVisibleImageIndex] = useState(-1);

  useMediaGalleryPrefetch(
    images,
    hasMore,
    onEndReached,
    lastVisibleImageIndex,
    resolveThumbnail,
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToTop: ({ animated = true } = {}) => {
        const list = listRef.current;
        if (!list) return;
        const data = list.props.data;
        if (data && data.length > 0) {
          void list.scrollToIndex({ index: 0, animated });
        } else {
          list.scrollToTop({ animated });
        }
      },
    }),
    [],
  );

  const data = useMemo<MediaGalleryRow[]>(() => {
    const rows: MediaGalleryRow[] = [];
    if (stickyHeader !== undefined && stickyHeader !== null) {
      rows.push({ kind: "sticky", node: stickyHeader });
    }
    if (images.length === 0 && emptyState !== undefined && emptyState !== null) {
      rows.push({ kind: "empty", node: emptyState });
    } else {
      let imageIndex = 0;
      for (const items of chunkMediaImages(images, COLUMNS)) {
        rows.push({ kind: "row", items, imageStartIndex: imageIndex });
        imageIndex += items.length;
      }
    }
    return rows;
  }, [images, stickyHeader, emptyState]);

  const stickyHeaderIndices = useMemo(
    () =>
      stickyHeader !== undefined && stickyHeader !== null ? [0] : undefined,
    [stickyHeader],
  );

  const renderItem = useCallback(
    ({ item: row }: ListRenderItemInfo<MediaGalleryRow>) => {
      if (row.kind === "sticky") {
        return <StickyHeaderRow>{row.node}</StickyHeaderRow>;
      }
      if (row.kind === "empty") {
        return <EmptyRow>{row.node}</EmptyRow>;
      }
      return (
        <View style={[styles.row, { gap, marginBottom: gap }]}>
          {Array.from({ length: COLUMNS }, (_, index) => {
            const item = row.items[index];
            if (!item) {
              return (
                <View
                  key={`pad-${index}`}
                  style={{ width: tileSize, height: tileSize }}
                />
              );
            }
            return (
              <MediaGalleryTile
                key={item.id}
                item={item}
                thumbnailUri={resolveThumbnail(item)}
                size={tileSize}
              />
            );
          })}
        </View>
      );
    },
    [gap, tileSize, resolveThumbnail],
  );

  const keyExtractor = useCallback((row: MediaGalleryRow, index: number) => {
    if (row.kind === "sticky") return "__media-sticky";
    if (row.kind === "empty") return "__media-empty";
    const lead = row.items[0];
    return `row-${lead?.id ?? "empty"}-${index}`;
  }, []);

  const showSpinnerFooter = hasMore && images.length > 0;
  const effectiveOnEndReached = hasMore ? onEndReached : undefined;
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<MediaGalleryRow>[] }) => {
      let max = -1;
      for (const token of viewableItems) {
        const row = token.item;
        if (!row || row.kind !== "row") continue;
        max = Math.max(
          max,
          row.imageStartIndex + row.items.length - 1,
        );
      }
      if (max >= 0) setLastVisibleImageIndex(max);
    },
    [],
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
  }).current;

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
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={showSpinnerFooter ? MediaGalleryFooter : null}
      stickyHeaderIndices={stickyHeaderIndices}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      extraData={thumbnailPixelSize}
    />
  );
});

function StickyHeaderRow({ children }: PropsWithChildren) {
  const theme = useTheme();
  return (
    <View style={[styles.sticky, { backgroundColor: theme.surfaceCard }]}>
      {children}
    </View>
  );
}

function EmptyRow({ children }: PropsWithChildren) {
  return <View style={styles.empty}>{children}</View>;
}

function MediaGalleryFooter() {
  const theme = useTheme();
  return (
    <View style={styles.footer}>
      <ActivityIndicator color={theme.fgMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  sticky: {
    width: "100%",
  },
  empty: {
    padding: 24,
    alignItems: "center",
  },
  footer: {
    paddingVertical: 24,
    alignItems: "center",
  },
});
