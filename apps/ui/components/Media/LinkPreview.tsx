/**
 * Hairline-bordered embed card that renders a resolved OpenGraph link
 * preview -- the canonical "this is an external page, summarised" surface
 * the kit uses both inside a {@link "../Post".Post}'s `media` slot and in
 * the {@link "../PostComposer".PostComposer}'s staged-attachment preview.
 *
 * The card composes three rows -- thumbnail (optional, 16:9 banner), then
 * a title / description / domain stack -- inside a single rounded outline.
 * The hairline border matches every other bordered surface in the kit
 * ({@link "../card".Card}, {@link "../Hero"}, the
 * {@link "../Input/TextInput"} pill) tonally; the rounded outer corner is
 * enforced by `overflow: "hidden"` so the thumbnail respects the radius
 * without per-corner CSS.
 *
 * When {@link LinkPreviewProps.onPress} is set, the card becomes a
 * `Pressable` with the kit's standard opacity-dip + scale-down press
 * feedback (mirrors {@link "../Media/Image".Image} and the embedded post
 * inset). The accessibility hint names the destination domain so the
 * screen-reader announcement reads "<title>. <description>. <domain>.
 * Button. Opens <domain> in your browser." rather than a generic "button".
 *
 * @example
 * ```tsx
 * <LinkPreview
 *   preview={{
 *     url: "https://example.com/article",
 *     title: "How the kit composes media",
 *     description: "A short OG description...",
 *     domain: "example.com",
 *     image: "https://example.com/og.png",
 *   }}
 *   onPress={() => Linking.openURL("https://example.com/article")}
 * />
 * ```
 */
import {
  Image as RNImage,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { useTheme } from "../use-theme";

/**
 * Resolved OpenGraph payload describing a link to be previewed. The
 * component renders what it's given; fetching, caching, and OG-tag
 * extraction are caller responsibilities (typically a server-side
 * resolver invoked at post-creation time so feeds don't pay the network
 * cost at scroll).
 *
 * Carved out as a named data shape (mirroring {@link "./Image".ImageData})
 * so consumers that *store* link previews (e.g. a feed row, a draft) can
 * type their records with a single shape and pair them with handlers at
 * render time.
 */
export type LinkPreviewData = {
  /**
   * Canonical URL the preview points at. Surfaced in the press handler's
   * intent but not rendered directly -- the visible domain badge uses
   * {@link LinkPreviewData.domain}.
   */
  url: string;
  /** OG `title`. Bold first row in the preview card; truncated to one line. */
  title: string;
  /**
   * Optional OG `description`. Secondary row, regular weight, truncated to two
   * lines. Omit when the site doesn't expose one and the card collapses to a
   * title + domain pair.
   */
  description?: string;
  /**
   * Hostname displayed under the title (`"nytimes.com"`, `"civia.eu"`).
   * Pre-computed by the caller because trimming `www.` and stripping
   * subdomains is a policy decision, not parsing -- different products
   * want different canonicalisations.
   */
  domain: string;
  /**
   * Optional thumbnail URL (typically OG `image`). When set, rendered as
   * a 16:9 banner at the top of the preview card; when absent, the card
   * collapses to a text-only embed with just the title / description /
   * domain rows.
   */
  image?: string;
};

/**
 * Public props for {@link LinkPreview}.
 */
export type LinkPreviewProps = {
  /** Resolved OpenGraph payload -- see {@link LinkPreviewData}. */
  preview: LinkPreviewData;
  /**
   * Optional press handler. When set, the preview becomes a `Pressable`
   * with the kit's standard opacity-dip + scale-down feedback. Typical
   * use is `() => Linking.openURL(preview.url)` to launch the link in an
   * external browser.
   */
  onPress?: () => void;
};

/**
 * Renders a hairline-bordered embed card for a single OpenGraph link
 * preview. See {@link LinkPreviewProps}.
 *
 * @param props - {@link LinkPreviewProps}
 */
export function LinkPreview({ preview, onPress }: LinkPreviewProps) {
  const theme = useTheme();
  const baseStyle = [styles.card, { borderColor: theme.borderDefault }];
  const inner = (
    <>
      {preview.image ? (
        <RNImage source={{ uri: preview.image }} style={styles.thumb} />
      ) : null}
      <View style={styles.meta}>
        <RNText
          style={[styles.title, { color: theme.fgEmphasis }]}
          numberOfLines={1}
        >
          {preview.title}
        </RNText>
        {preview.description ? (
          <RNText
            style={[styles.description, { color: theme.fg }]}
            numberOfLines={2}
          >
            {preview.description}
          </RNText>
        ) : null}
        <RNText
          style={[styles.domain, { color: theme.fgMuted }]}
          numberOfLines={1}
        >
          {preview.domain}
        </RNText>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint={`Opens ${preview.domain} in your browser`}
        onPress={onPress}
        style={({ pressed }) => [
          ...baseStyle,
          webFocusOutlineStyle(),
          pressed && styles.pressed,
        ]}
      >
        {inner}
      </Pressable>
    );
  }
  return <View style={baseStyle}>{inner}</View>;
}

export default LinkPreview;

const styles = StyleSheet.create({
  /**
   * Hairline-bordered card. `overflow: "hidden"` lets the thumbnail respect
   * the outer 16px radius without per-corner CSS, and `borderColor` is
   * themed inline from the kit's hairline-border token so the card lines
   * up with every other bordered surface tonally.
   */
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: "hidden",
  },
  /**
   * 16:9 banner thumbnail. Matches the single-image default and the
   * gallery-of-three frame so a feed of mixed media keeps a consistent
   * rhythm.
   */
  thumb: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  /**
   * Title / description / domain stack. Padding is slightly looser than
   * the surrounding body's flush layout so the embed reads as its own
   * little card; `gap: 4` ties the three rows together as one block.
   */
  meta: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  domain: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  /**
   * Pressed-state overlay shared with the other tappable surfaces in the
   * kit ({@link "../Media/Image".Image}, the embedded-post inset). Mirrors
   * {@link "../card".DisclosureCard}'s feedback so tappable surfaces feel
   * identical across the kit.
   */
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});
