/**
 * Internal staged-media preview for
 * {@link "./PostComposer".PostComposer}. Renders the editable side of
 * the draft's {@link PostMedia} attachment with the remove affordances
 * the user needs to actually edit a draft: a single `IconButton(X)`
 * overlayed on the whole-attachment surfaces, and per-thumbnail
 * `IconButton(X)` overlays on the multi-image surfaces so the user can
 * drop one photo without losing the rest.
 *
 * Kind dispatch follows the same discriminated union the rendered post
 * consumes, but the preview deliberately departs from a strict WYSIWYG
 * mapping in favour of editability:
 *
 * - `link` -- {@link "../Media".LinkPreview} (full embed card) with a
 *   single corner X.
 * - `image` -- {@link "../Media".Image} (single rounded photo) with a
 *   single corner X.
 * - `video` -- {@link "../Media".Video} (poster + play overlay) with
 *   a single corner X. The composer doesn't currently *stage* videos
 *   (no video picker is wired in), but the shape is part of
 *   {@link PostMedia} and the preview handles it exhaustively so a
 *   future video-pick flow drops in without a new branch.
 * - `audio` -- {@link "../Media".Audio} (mock waveform + play button)
 *   with a single corner X. Same "shape is wired before the picker"
 *   convention as `video` -- the composer doesn't surface a voice-
 *   note recorder yet, but staging an audio attachment from outside
 *   (a host-provided handler, a deep-linked file) renders here
 *   without a new branch.
 * - `poll` -- {@link "../Poll".Poll} rendered in its read-only paint
 *   (no `onVotePress`) plus a single corner X. The poll's *editing*
 *   surface (question / option authoring, deadline) lives in the
 *   host's poll-configuration drawer, not as inline tap targets on
 *   the staged preview -- same convention every other structured
 *   attachment will follow.
 * - `gallery` / `mosaic` / `carousel` -- a uniform 3-column grid of
 *   square thumbnails, one per image, each with its own corner X. The
 *   grid intentionally does *not* mirror the rendered post's layout
 *   (mixed-aspect mosaic stack, paged carousel, ...) -- it's an
 *   editing surface, not a preview. The kit screen pairs the composer
 *   with a live `<Post>` projection that renders the real layouts, so
 *   callers still see the final shape there.
 *
 * Kept private to the `PostComposer` family because the "render-with-
 * remove-overlays" shape is composer-specific.
 */
import { X } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { IconButton } from "../Button";
import {
  Audio,
  Image as MediaImage,
  LinkPreview,
  Video,
} from "../Media";
import { Commitment } from "../Post/Commitment";
import { Dataset } from "../Post/Dataset";
import { Disclosure } from "../Post/Disclosure";
import { Endorsement } from "../Post/Endorsement";
import { FactCheck } from "../Post/FactCheck";
import { VoteRecord } from "../Post/VoteRecord";
import { Event } from "../Post/Event";
import { Fundraiser } from "../Post/Fundraiser";
import { Petition } from "../Post/Petition";
import { Poll } from "../Post/Poll";
import type { PostMedia } from "../Post";

/**
 * Public props for {@link MediaDraftPreview}.
 */
export type MediaDraftPreviewProps = {
  /** Staged attachment to render. See {@link PostMedia}. */
  media: PostMedia;
  /**
   * Optional handler for the whole-attachment remove `IconButton(X)`.
   * Applies to the `link` and `image` shapes (which expose a single
   * corner X) and is ignored on the multi-image shapes (which expose
   * per-thumbnail removes via {@link onRemoveImage} instead). Typical
   * wiring is `() => onChange(clearMedia(draft))`. When omitted, no
   * remove affordance is shown for the single-block shapes -- the
   * staged preview reads as read-only.
   */
  onRemove?: () => void;
  /**
   * Optional handler for the per-thumbnail remove `IconButton(X)` on
   * multi-image attachments (`gallery` / `mosaic` / `carousel`).
   * Receives the 0-based index of the tapped thumbnail. Typical wiring
   * is `(i) => onChange(removeMediaImage(draft, i))` -- the helper
   * drops the matching image and clears the media slot when the last
   * image is removed. When omitted, no per-image remove affordance is
   * shown (the preview reads as read-only for multi-image shapes).
   */
  onRemoveImage?: (index: number) => void;
  /**
   * Disables every remove affordance and dims the entire preview. Pair
   * with the composer's `disabled` / `submitting` state so the user
   * can't drop attachments mid-submit.
   * @defaultValue false
   */
  disabled?: boolean;
};

/**
 * Renders the staged attachment preview block. See
 * {@link MediaDraftPreviewProps}.
 *
 * @param props - {@link MediaDraftPreviewProps}
 */
export function MediaDraftPreview({
  media,
  onRemove,
  onRemoveImage,
  disabled = false,
}: MediaDraftPreviewProps) {
  if (
    media.kind === "gallery" ||
    media.kind === "mosaic" ||
    media.kind === "carousel"
  ) {
    return (
      <View style={[styles.grid, disabled && styles.disabled]}>
        {media.images.map((image, index) => (
          <View key={`${image.source}-${index}`} style={styles.gridTile}>
            <MediaImage source={image.source} alt={image.alt} aspectRatio={1} />
            {onRemoveImage ? (
              <View style={styles.removeButton}>
                <IconButton
                  icon={X}
                  size="sm"
                  variant="inverted"
                  shape="round"
                  disabled={disabled}
                  onPress={() => onRemoveImage(index)}
                  accessibilityLabel={`Remove image ${index + 1}`}
                />
              </View>
            ) : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, disabled && styles.disabled]}>
      {media.kind === "link" ? (
        <LinkPreview preview={media.preview} />
      ) : media.kind === "video" ? (
        <Video {...media.video} />
      ) : media.kind === "audio" ? (
        <Audio {...media.audio} />
      ) : media.kind === "poll" ? (
        // Read-only paint: the editing surface for a poll (question /
        // option authoring, deadline) lives in the host's poll
        // configuration drawer, not as inline tap targets on the
        // staged preview -- same precedent the link preview follows.
        <Poll {...media.poll} />
      ) : media.kind === "event" ? (
        // Read-only paint: the editing surface for an event (title /
        // date / place / format) lives in the host's event-
        // configuration drawer; the staged preview shows the eventual
        // feed-row shape without offering an inline RSVP affordance.
        <Event {...media.event} />
      ) : media.kind === "petition" ? (
        // Same read-only convention: editing the petition's title /
        // ask / goal / deadline happens in the host drawer.
        <Petition {...media.petition} />
      ) : media.kind === "fundraiser" ? (
        // Same read-only convention: editing the fundraiser's
        // title / pitch / goal / currency / deadline / transparency
        // link happens in the host drawer.
        <Fundraiser {...media.fundraiser} />
      ) : media.kind === "dataset" ? (
        // Same read-only convention: editing the dataset's name /
        // description / metadata / downloads list happens in the
        // host drawer.
        <Dataset {...media.dataset} />
      ) : media.kind === "fact-check" ? (
        // Same read-only convention: editing the claim / verdict /
        // evidence rows happens in the host drawer.
        <FactCheck
          {...media.factCheck}
          verdictLabels={media.verdictLabels}
        />
      ) : media.kind === "vote-record" ? (
        // Same read-only convention: editing the roll-call fields
        // happens in the host drawer.
        <VoteRecord {...media.voteRecord} />
      ) : media.kind === "endorsement" ? (
        <Endorsement endorsement={media.endorsement} />
      ) : media.kind === "commitment" ? (
        <Commitment commitment={media.commitment} />
      ) : media.kind === "disclosure" ? (
        <Disclosure disclosure={media.disclosure} />
      ) : (
        <MediaImage {...media.image} />
      )}
      {onRemove ? (
        <View style={styles.removeButton}>
          <IconButton
            icon={X}
            size="sm"
            variant="inverted"
            shape="round"
            disabled={disabled}
            onPress={onRemove}
            accessibilityLabel="Remove attachment"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Relative positioning context for the floating remove button -- same
   * anchor pattern {@link "../Post".Post} uses for its kebab overflow
   * menu.
   */
  wrap: {
    position: "relative",
  },
  /**
   * Dimmed overlay applied when the composer is `disabled`. Mirrors the
   * `TextInput` / `TextArea` disabled treatment so every disabled
   * affordance in the composer reads with the same opacity.
   */
  disabled: {
    opacity: 0.5,
  },
  /**
   * Floating remove-button wrapper. 8px inset from the top-right corner
   * keeps the pill clear of the photo's edge and leaves room for the
   * `inverted` chrome to read on top of any colour the photo lands on.
   * Same shape for the single-block (link / image) corner X and the
   * per-thumbnail X on the multi-image stack.
   */
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  /**
   * 3-column flex-wrap grid for the multi-image previews. The grid is
   * deliberately uniform (square tiles, fixed columns) regardless of
   * which {@link PostMedia} kind the draft carries -- the composer's
   * job here is "let the user manage a list of images", not "show what
   * the rendered post will look like". 6px gap matches the kit's
   * standard tight-grid rhythm ({@link "../Media".Mosaic} stack,
   * {@link "../Media".Carousel} dots).
   */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  /**
   * Single grid cell. `width: "32%"` leaves three tiles per row plus
   * two 6px gaps without overflowing the container at typical
   * composer widths; `position: relative` anchors the per-tile remove
   * button. The inner `<Image aspectRatio={1} />` claims 100% of this
   * cell, so the photo is cropped to a perfect square.
   */
  gridTile: {
    width: "32%",
    position: "relative",
  },
});
