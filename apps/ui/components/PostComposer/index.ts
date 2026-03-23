/**
 * Barrel for the kit's `PostComposer` family. Named-principal style
 * (matches {@link "../Drawer".Drawer} / {@link "../Input".TextInput})
 * because the family ships several closely-coupled exports that callers
 * benefit from discovering by name:
 *
 * - {@link PostComposer} -- the surface-agnostic composer primitive.
 * - {@link PostComposerPreview} -- a thin wrapper that projects a draft
 *   through {@link "../Post".Post} for live previewing.
 * - {@link PostDraft} + the pure helpers (`emptyDraft`, `withContent`,
 *   `withMedia`, ...) -- the controlled-flow API.
 * - {@link draftToPostProps} -- the standalone adapter, exported so
 *   callers that want to render their own preview (or feed the draft to
 *   another consumer of {@link "../Post".PostProps}) don't have to
 *   reach for {@link PostComposerPreview}.
 *
 * `AttachmentBar` and `MediaDraftPreview` are deliberately *not*
 * exported here -- they're family-internal pieces of the composer's
 * composition, not general primitives.
 */
export {
  PostComposer,
  PostComposerPreview,
  type PostComposerProps,
  type PostComposerPreviewProps,
} from "./PostComposer";
export {
  addPictures,
  clearMedia,
  clearRelation,
  draftToPostProps,
  emptyDraft,
  isSubmittable,
  removeMediaImage,
  withContent,
  withDataset,
  withDisclosure,
  withEndorsement,
  withFactCheck,
  withVoteRecord,
  withCommitment,
  withEvent,
  withFundraiser,
  withMedia,
  withPetition,
  withPoll,
  withRelation,
  withArchetype,
  clearArchetype,
  type PostDraft,
} from "./draft";
