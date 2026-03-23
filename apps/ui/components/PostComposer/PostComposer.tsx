/**
 * Surface-agnostic post composer. Renders the editable side of every
 * shape a {@link "../Post".Post} can take -- a multi-line body, an
 * optional {@link "../Post".PostMedia} attachment, and an optional
 * cross-reference {@link "../Post".PostRelation} (a repost, comment, or
 * one of the Tier 5 relation variants) -- inside a flat composition
 * that the caller can drop into a {@link "../Drawer".Drawer} modal, a
 * {@link "../Page".Page} screen, or a {@link "../Feed".Feed}'s
 * `ListHeaderComponent` without changing a single prop.
 *
 * The composer is **controlled**: the parent owns a {@link PostDraft}
 * and feeds it back through {@link PostComposerProps.value} /
 * {@link PostComposerProps.onChange}. The pure helpers in
 * {@link "./draft"} (`withContent`, `withMedia`, `clearMedia`, ...)
 * cover the common mutations so callers stay one line per intent;
 * {@link "./draft".isSubmittable} drives the disabled state of the
 * submit button and {@link "./draft".draftToPostProps} adapts the
 * draft into the shape the rendered {@link "../Post".Post} consumes for
 * a live preview.
 *
 * Layout (top-to-bottom): author row, {@link "../Input".TextArea}
 * body, staged media preview, embed preview, action row (attachment
 * icons pinned left; Preview / optional Cancel / primary submit text
 * buttons pinned right). The body's {@link "../Input".TextArea}
 * auto-grows from its `minRows` baseline as the user types, so the
 * composer starts compact in feed-header surfaces and expands in
 * place.
 *
 * The preview affordance is owned by the composer itself: tapping the
 * "Preview" button opens a {@link "../Drawer".Drawer} that renders a
 * live {@link "../Post".Post} projection of the current draft (via
 * {@link "./draft".draftToPostProps}) so the user can sanity-check the
 * final shape before submitting. The preview is gated on
 * {@link "./draft".isSubmittable} -- previewing a bare empty draft
 * would just paint an empty card.
 *
 * The composer never owns its own *outer* modal, scroll container, or
 * picker integration: pickers (`expo-image-picker`), link OG
 * resolution, and the eventual submit network call live in
 * `apps/ui/core/composer/*` and are wired in by the caller. That keeps
 * the kit primitive pure presentational for everything except the
 * self-contained preview UX.
 *
 * Note on links: there is no "add link" attachment affordance on the
 * composer. URLs are extracted automatically from the body text the
 * user types; the matching auto-resolution flow lives in
 * {@link "../../core/composer/use-draft-link-extraction".useDraftLinkExtraction}
 * and is wired in by the host (alongside `useImagePicker` and
 * `useSubmitPost`). The composer just renders whatever staged
 * {@link "../Post".LinkMedia} the draft happens to carry.
 */
import { useState, type PropsWithChildren } from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import Button from "../Button";
import { Drawer } from "../Drawer";
import { TextArea } from "../Input";
import Post, {
  EmbeddedPostInset,
  type PostArchetype,
  type PostProps,
} from "../Post";
import Profile, { type ProfileProps } from "../Profile";
import { useTheme } from "../use-theme";
import { AttachmentBar } from "./AttachmentBar";
import { MediaDraftPreview } from "./MediaDraftPreview";
import {
  clearArchetype,
  clearMedia,
  draftToPostProps,
  isSubmittable,
  removeMediaImage,
  withContent,
  type PostDraft,
} from "./draft";

function formatArchetypeKind(kind: PostArchetype["kind"]): string {
  switch (kind) {
    case "article":
      return "Article";
    case "liveticker":
      return "Liveticker";
    case "decree":
      return "Decree";
    case "testimony":
      return "Testimony";
  }
}

/**
 * Public props for {@link PostComposer}.
 */
export type PostComposerProps = {
  /**
   * Identity row rendered at the top of the composer. Always the
   * *current viewer*, since a composer is "the post you are about to
   * make"; threaded in by the caller because the draft itself never
   * carries an author.
   */
  author: ProfileProps;
  /**
   * Current draft. The composer is fully controlled: the parent owns the
   * draft and feeds it back via {@link onChange}. Reach for the pure
   * helpers in {@link "./draft"} (`emptyDraft`, `withContent`,
   * `withMedia`, ...) to construct successive values without
   * mutating in place.
   */
  value: PostDraft;
  /**
   * Called with the next draft whenever the user mutates any field --
   * typing in the body, removing a staged attachment, etc. Pass the
   * value through to your `useState` setter to drive the controlled
   * flow.
   */
  onChange: (next: PostDraft) => void;
  /**
   * Press handler for the primary submit button. Only wired when the
   * draft is {@link "./draft".isSubmittable | submittable} and the
   * composer is not {@link submitting}; the button stays rendered (but
   * disabled) otherwise so the user always sees the affordance.
   */
  onSubmit?: () => void;
  /**
   * Optional secondary press handler rendered as a "Cancel" button to
   * the left of submit. Use it in modal / dedicated-screen surfaces
   * where the caller wants to expose an explicit dismissal; omit it in
   * inline-feed-top surfaces where the user just stops typing.
   */
  onCancel?: () => void;
  /**
   * Forwarded to {@link AttachmentBar}'s "pick pictures" icon. Wire
   * to a picker hook (`useImagePicker().pickPictures`) and stage the
   * result via {@link "./draft".addPictures}, which auto-routes
   * between {@link "../Post".ImageMedia} (one photo) and
   * {@link "../Post".GalleryMedia} (two or more). Omit to hide the
   * icon entirely (the bar's "render-only-affordances-the-host-
   * supports" rule, also used by {@link "../Post".Post}'s
   * `showShare` / `showMenu`).
   */
  onAddPictures?: () => void;
  /**
   * Forwarded to {@link AttachmentBar}'s "attach a poll" icon. Wire to
   * a handler that opens your poll-configuration drawer; once the user
   * confirms the question / options, stage the result via
   * {@link "./draft".withPoll}. Omit to hide the icon entirely (same
   * "render-only-affordances-the-host-supports" rule
   * {@link onAddPictures} uses).
   */
  onAddPoll?: () => void;
  /**
   * Forwarded to {@link AttachmentBar}'s "attach an event" icon.
   * Wire to a handler that opens your event-configuration drawer;
   * once the user confirms title / date / place / format, stage the
   * result via {@link "./draft".withEvent}. Omit to hide the icon
   * entirely (same convention as {@link onAddPictures} /
   * {@link onAddPoll}).
   */
  onAddEvent?: () => void;
  /**
   * Forwarded to {@link AttachmentBar}'s "attach a petition" icon.
   * Wire to a handler that opens your petition-configuration drawer;
   * once the user confirms title / ask / goal / deadline, stage the
   * result via {@link "./draft".withPetition}. Omit to hide the icon
   * entirely.
   */
  onAddPetition?: () => void;
  /**
   * Forwarded to {@link AttachmentBar}'s "attach a fundraiser" icon.
   * Wire to a handler that opens your fundraiser-configuration
   * drawer; stage the result via
   * {@link "./draft".withFundraiser}. Omit to hide the icon
   * entirely.
   */
  onAddFundraiser?: () => void;
  /**
   * Forwarded to {@link AttachmentBar}'s "attach a dataset" icon.
   * Stage the result via {@link "./draft".withDataset}. Omit to
   * hide the icon entirely.
   */
  onAddDataset?: () => void;
  /**
   * Forwarded to {@link AttachmentBar}'s "attach a fact-check" icon.
   * Stage the result via {@link "./draft".withFactCheck}. Omit to
   * hide the icon entirely.
   */
  onAddFactCheck?: () => void;
  /**
   * Forwarded to {@link AttachmentBar}'s "attach a vote record" icon.
   * Stage the result via {@link "./draft".withVoteRecord}. Omit to
   * hide the icon entirely.
   */
  onAddVoteRecord?: () => void;
  /**
   * Forwarded to {@link AttachmentBar}'s "attach an endorsement" icon.
   * Stage the result via {@link "./draft".withEndorsement}. Omit to hide.
   */
  onAddEndorsement?: () => void;
  /**
   * Forwarded to {@link AttachmentBar}'s "attach a commitment" icon.
   * Stage the result via {@link "./draft".withCommitment}. Omit to hide.
   */
  onAddCommitment?: () => void;
  /**
   * Forwarded to {@link AttachmentBar}'s "attach a disclosure" icon.
   * Stage the result via {@link "./draft".withDisclosure}. Omit to hide.
   */
  onAddDisclosure?: () => void;
  /**
   * Suspends interaction while a submit is in flight. Disables the
   * submit button, the cancel button, the attachment bar, and the
   * remove affordances on any staged media -- so the optimistic state
   * the parent paints up doesn't drift as the user keeps editing.
   * @defaultValue false
   */
  submitting?: boolean;
  /**
   * Optional submission-level error message. Rendered as a danger-tinted
   * line below the action row -- distinct from the body's per-field
   * validation (which lives on the {@link "../Input".TextArea}'s own
   * `error` slot) and reserved for the "submit failed" signal.
   */
  error?: string;
  /**
   * Placeholder shown inside the body {@link "../Input".TextArea} when
   * the draft's content is empty. Doubles as the accessibility name
   * when no explicit label is provided.
   * @defaultValue "What's happening?"
   */
  placeholder?: string;
  /**
   * Hard cap on the number of characters the body can hold. Forwarded
   * to the underlying {@link "../Input".TextArea}'s `maxLength`.
   * @defaultValue 500
   */
  maxLength?: number;
  /**
   * Label rendered inside the submit button. Defaults to a single word
   * so the action reads quickly; widen for context-specific copy
   * ("Reply", "Repost", "Share").
   * @defaultValue "Post"
   */
  submitLabel?: string;
  /**
   * Focuses the body field as soon as the composer mounts. Forward to
   * the underlying {@link "../Input".TextArea}'s `autoFocus`. Use in
   * modal / dedicated-screen surfaces where the composer is
   * unambiguously the primary affordance; avoid in long-scrolling
   * feeds.
   * @defaultValue false
   */
  autoFocus?: boolean;
};

/**
 * Renders the composer surface. See {@link PostComposerProps}.
 *
 * @param props - {@link PostComposerProps}
 */
export function PostComposer({
  author,
  value,
  onChange,
  onSubmit,
  onCancel,
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
  submitting = false,
  error,
  placeholder = "What's happening?",
  maxLength = 500,
  submitLabel = "Post",
  autoFocus = false,
}: PostComposerProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const canSubmit = isSubmittable(value) && !submitting;
  const canPreview = isSubmittable(value) && !submitting;
  const showMediaPreview = value.media !== undefined;
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Profile {...author} size="sm" inline />

      <TextArea
        value={value.content}
        onChangeText={(content) => onChange(withContent(value, content))}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        disabled={submitting}
        accessibilityLabel="Post body"
      />

      {value.archetype !== undefined ? (
        <View
          style={[
            styles.archetypeStrip,
            {
              borderColor: theme.borderDefault,
              backgroundColor: theme.surfaceWell,
            },
          ]}
        >
          <RNText style={[styles.archetypeStripLabel, { color: theme.fgMuted }]}>
            Staged body: {formatArchetypeKind(value.archetype.kind)}
          </RNText>
          <Button
            variant="ghost"
            disabled={submitting}
            onPress={() => onChange(clearArchetype(value))}
          >
            Clear
          </Button>
        </View>
      ) : null}

      {showMediaPreview && value.media ? (
        <MediaDraftPreview
          media={value.media}
          onRemove={() => onChange(clearMedia(value))}
          onRemoveImage={(index) =>
            onChange(removeMediaImage(value, index))
          }
          disabled={submitting}
        />
      ) : null}

      {value.relation ? (
        /*
          The composer doesn't surface a remove affordance on the
          relation: it's set by the host context (the post that opened
          the composer), and dropping it there would mean "stop
          referencing this" -- the right action for that is to close
          the composer entirely, which the host owns.
        */
        <EmbeddedPostInset relation={value.relation} />
      ) : null}

      <View style={styles.actionRow}>
        <AttachmentBar
          onAddPictures={onAddPictures}
          onAddPoll={onAddPoll}
          onAddEvent={onAddEvent}
          onAddPetition={onAddPetition}
          onAddFundraiser={onAddFundraiser}
          onAddDataset={onAddDataset}
          onAddFactCheck={onAddFactCheck}
          onAddVoteRecord={onAddVoteRecord}
          onAddEndorsement={onAddEndorsement}
          onAddCommitment={onAddCommitment}
          onAddDisclosure={onAddDisclosure}
          disabled={submitting}
        />
        <View style={styles.actionGroup}>
          <Button
            variant="ghost"
            onPress={() => setPreviewOpen(true)}
            disabled={!canPreview}
          >
            Preview
          </Button>
          {onCancel ? (
            <Button variant="ghost" onPress={onCancel} disabled={submitting}>
              Cancel
            </Button>
          ) : null}
          <Button
            variant="primary"
            onPress={onSubmit}
            disabled={!canSubmit}
          >
            {submitting ? "Posting..." : submitLabel}
          </Button>
        </View>
      </View>

      {error ? <SubmissionError message={error} /> : null}

      <Drawer
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Preview"
        subtitle="How this post will look in the feed."
      >
        <Post {...draftToPostProps(value, author)} />
      </Drawer>
    </View>
  );
}

/**
 * Submission-level error line rendered below the action row. Kept as a
 * private component so the danger styling stays co-located with the
 * composer's other prose; if a future consumer needs the same shape
 * elsewhere it's a candidate to lift.
 */
function SubmissionError({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <RNText
      accessibilityLiveRegion="polite"
      style={[styles.error, { color: theme.danger }]}
    >
      {message}
    </RNText>
  );
}

/**
 * Live `<Post>` projection of a draft. Convenience wrapper around
 * {@link "./draft".draftToPostProps} + {@link "../Post".Post} so
 * screens that want a side-by-side preview don't have to import both
 * directly. Children, if any, render *above* the preview -- handy for
 * a one-line "Live preview" eyebrow.
 *
 * Exported as a named sibling rather than the composer's default so
 * callers can pick either composition independently:
 *
 * ```tsx
 * <PostComposer value={draft} onChange={setDraft} author={me} />
 * <PostComposerPreview draft={draft} author={me} />
 * ```
 */
export type PostComposerPreviewProps = {
  /** Draft to project into a {@link "../Post".Post} render. */
  draft: PostDraft;
  /** Identity to attribute the projected post to -- typically the current viewer. */
  author: ProfileProps;
  /** Optional {@link PostProps} overrides forwarded after the projection. */
  overrides?: Partial<PostProps>;
};

export function PostComposerPreview({
  draft,
  author,
  overrides,
  children,
}: PropsWithChildren<PostComposerPreviewProps>) {
  // Inline projection so the live-preview block doesn't drag the draft
  // module's adapter into every consumer's import list; the call site
  // can stay `<PostComposerPreview draft author />` regardless of how
  // the adapter evolves.
  const projected: PostProps = {
    ...draftToPostProps(draft, author),
    ...overrides,
  };
  return (
    <View style={styles.previewWrap}>
      {children}
      <Post {...projected} />
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Outer vertical stack for the expanded composer. 12px gap matches
   * {@link "../Post".Post}'s `container` rhythm so a composer and a
   * rendered post read with the same vertical cadence -- useful when
   * the composer sits directly above a feed.
   */
  container: {
    width: "100%",
    gap: 12,
  },
  archetypeStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    width: "100%",
    alignSelf: "stretch",
  },
  archetypeStripLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  /**
   * Bottom action row. Mirrors {@link "../Post".Post}'s footer
   * `actionRow`: attachment-intent icon cluster pinned left,
   * text-button cluster (Preview / optional Cancel / primary submit)
   * pinned right via `space-between`.
   */
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  /**
   * Right-side text-button group: Preview + optional Cancel + the
   * primary submit button. 12px gap matches the attachment bar's
   * internal rhythm so left and right sides of the row read with the
   * same density.
   */
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  /**
   * Submission-level error message. Same font ramp as the
   * `TextInput` / `TextArea` helper line so the composer's two error
   * surfaces (per-field on the body input, screen-level here) share a
   * single typographic shape.
   */
  error: {
    fontSize: 13,
    lineHeight: 18,
  },
  /**
   * Wrapper for the live `<Post>` projection -- pinned to the
   * composer's full inline width so the preview matches whatever
   * container the composer itself is sized to.
   */
  previewWrap: {
    width: "100%",
    gap: 8,
  },
});
