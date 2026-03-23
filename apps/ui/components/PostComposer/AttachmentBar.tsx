/**
 * Internal `IconButton` row docked at the bottom of
 * {@link "./PostComposer".PostComposer}. Today the bar holds a single
 * affordance -- the "pick pictures" icon -- because the composer's
 * other attachment kinds are either auto-extracted (links, from the
 * body text via
 * {@link "../../core/composer/use-draft-link-extraction".useDraftLinkExtraction})
 * or seeded by code paths outside the picker flow (mosaic / carousel,
 * for layout-explicit demos). Each icon emits an *intent*; the actual
 * picker (`expo-image-picker`, ...) lives in
 * `apps/ui/core/composer/*` and is wired in by the screen-level
 * caller, not by the kit primitive.
 *
 * The picture-selection affordance is intentionally unified: one
 * button, multi-select picker, and the draft helpers
 * ({@link "./draft".addPictures}) promote/demote between
 * {@link "../Post".ImageMedia} and {@link "../Post".GalleryMedia}
 * based on the photo count. The bar doesn't surface "single" vs
 * "multi" picture buttons because that distinction is a data-model
 * concern, not a user-facing one.
 *
 * The row mirrors {@link "../Post".Post}'s footer rhythm -- left-
 * aligned cluster of icon-only `IconButton`s at `size="sm"` -- so the
 * composer's action affordances and the rendered post's engagement
 * affordances read with the same visual cadence.
 *
 * Kept local to the `PostComposer` family because the bar's shape is
 * specific to a composer; if a future consumer needs the same row in
 * a non-composer context, this is a candidate to promote to its own
 * module.
 */
import {
  Award,
  BarChart3,
  CalendarDays,
  Database,
  FileSignature,
  HeartHandshake,
  Images,
  PenLine,
  ShieldCheck,
  Vote,
  Wallet,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { IconButton } from "../Button";

/**
 * Public props for {@link AttachmentBar}.
 */
export type AttachmentBarProps = {
  /**
   * Optional handler for the "pick pictures" intent. Fires when the
   * user taps the photos icon. The composer typically wires this to
   * a picker hook (`useImagePicker().pickPictures`) and stages the
   * result via {@link "./draft".addPictures}, which promotes/demotes
   * between {@link "../Post".ImageMedia} and
   * {@link "../Post".GalleryMedia} based on the photo count. When
   * omitted, the icon is hidden entirely so the bar shrinks to the
   * affordances the caller actually supports.
   */
  onAddPictures?: () => void;
  /**
   * Optional handler for the "attach a poll" intent. Fires when the
   * user taps the poll icon. The composer typically wires this to a
   * helper that stages a seed poll via {@link "./draft".withPoll}
   * (and pairs it with a configuration drawer the host opens to edit
   * the question / options before submit). When omitted, the icon is
   * hidden entirely so the bar shrinks to the affordances the caller
   * actually supports -- same rule the picture-pick affordance uses.
   */
  onAddPoll?: () => void;
  /**
   * Optional handler for the "attach an event" intent. Fires when
   * the user taps the calendar icon. The composer typically wires
   * this to a helper that opens the host's event-configuration
   * drawer; once the user confirms title / date / place / format,
   * the result is staged via {@link "./draft".withEvent}. Omit to
   * hide the icon entirely, same rule as the other attachment
   * affordances.
   */
  onAddEvent?: () => void;
  /**
   * Optional handler for the "attach a petition" intent. Fires when
   * the user taps the pen icon. Wire to a handler that opens your
   * petition-configuration drawer; stage the result via
   * {@link "./draft".withPetition}. Omit to hide the icon entirely.
   */
  onAddPetition?: () => void;
  /**
   * Optional handler for the "attach a fundraiser" intent. Fires
   * when the user taps the heart-handshake icon. Stage the result
   * via {@link "./draft".withFundraiser}. Omit to hide the icon
   * entirely.
   */
  onAddFundraiser?: () => void;
  /**
   * Optional handler for the "attach a dataset" intent. Fires when
   * the user taps the database icon. Stage the result via
   * {@link "./draft".withDataset}. Omit to hide the icon entirely.
   */
  onAddDataset?: () => void;
  /**
   * Optional handler for the "attach a fact-check" intent. Fires when
   * the user taps the shield-check icon. Stage the result via
   * {@link "./draft".withFactCheck}. Omit to hide the icon entirely.
   */
  onAddFactCheck?: () => void;
  /**
   * Optional handler for the "attach a vote record" intent. Fires when
   * the user taps the vote icon. Stage the result via
   * {@link "./draft".withVoteRecord}. Omit to hide the icon entirely.
   */
  onAddVoteRecord?: () => void;
  /**
   * Optional handler for the "attach an endorsement" intent. Stage via
   * {@link "./draft".withEndorsement}. Omit to hide the icon entirely.
   */
  onAddEndorsement?: () => void;
  /**
   * Optional handler for the "attach a commitment" intent. Stage via
   * {@link "./draft".withCommitment}. Omit to hide the icon entirely.
   */
  onAddCommitment?: () => void;
  /**
   * Optional handler for the "attach a disclosure" intent. Stage via
   * {@link "./draft".withDisclosure}. Omit to hide the icon entirely.
   */
  onAddDisclosure?: () => void;
  /**
   * Disables every icon in the row. Pair with the composer's `disabled`
   * / `submitting` state so the user can't stage attachments while a
   * submit is in flight.
   * @defaultValue false
   */
  disabled?: boolean;
};

/**
 * Renders the attachment-intent icon row. The `IconButton` is hidden
 * entirely when its handler is omitted -- the kit's "don't render
 * affordances the host doesn't support" rule, also used by `Post`'s
 * `showShare` / `showMenu` opts.
 *
 * @param props - {@link AttachmentBarProps}
 */
export function AttachmentBar({
  onAddPictures,
  onAddPoll,
  onAddEvent,
  onAddPetition,
  onAddFundraiser,
  onAddDataset,
  onAddFactCheck,
  onAddVoteRecord,
  onAddEndorsement,
  onAddCommitment,
  onAddDisclosure,
  disabled = false,
}: AttachmentBarProps) {
  return (
    <View style={styles.row}>
      {onAddPictures ? (
        <IconButton
          icon={Images}
          size="sm"
          onPress={onAddPictures}
          disabled={disabled}
          accessibilityLabel="Add pictures"
        />
      ) : null}
      {onAddPoll ? (
        <IconButton
          icon={BarChart3}
          size="sm"
          onPress={onAddPoll}
          disabled={disabled}
          accessibilityLabel="Attach a poll"
        />
      ) : null}
      {onAddEvent ? (
        <IconButton
          icon={CalendarDays}
          size="sm"
          onPress={onAddEvent}
          disabled={disabled}
          accessibilityLabel="Attach an event"
        />
      ) : null}
      {onAddPetition ? (
        <IconButton
          icon={PenLine}
          size="sm"
          onPress={onAddPetition}
          disabled={disabled}
          accessibilityLabel="Attach a petition"
        />
      ) : null}
      {onAddFundraiser ? (
        <IconButton
          icon={HeartHandshake}
          size="sm"
          onPress={onAddFundraiser}
          disabled={disabled}
          accessibilityLabel="Attach a fundraiser"
        />
      ) : null}
      {onAddDataset ? (
        <IconButton
          icon={Database}
          size="sm"
          onPress={onAddDataset}
          disabled={disabled}
          accessibilityLabel="Attach a dataset"
        />
      ) : null}
      {onAddFactCheck ? (
        <IconButton
          icon={ShieldCheck}
          size="sm"
          onPress={onAddFactCheck}
          disabled={disabled}
          accessibilityLabel="Attach a fact-check"
        />
      ) : null}
      {onAddVoteRecord ? (
        <IconButton
          icon={Vote}
          size="sm"
          onPress={onAddVoteRecord}
          disabled={disabled}
          accessibilityLabel="Attach a vote record"
        />
      ) : null}
      {onAddEndorsement ? (
        <IconButton
          icon={Award}
          size="sm"
          onPress={onAddEndorsement}
          disabled={disabled}
          accessibilityLabel="Attach an endorsement"
        />
      ) : null}
      {onAddCommitment ? (
        <IconButton
          icon={FileSignature}
          size="sm"
          onPress={onAddCommitment}
          disabled={disabled}
          accessibilityLabel="Attach a commitment"
        />
      ) : null}
      {onAddDisclosure ? (
        <IconButton
          icon={Wallet}
          size="sm"
          onPress={onAddDisclosure}
          disabled={disabled}
          accessibilityLabel="Attach a disclosure"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Left-aligned cluster of icon affordances. 12px gap matches
   * {@link "../Post".Post}'s footer rhythm so the composer's attachment
   * row and the rendered post's engagement row read with the same
   * cadence.
   */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
