/**
 * Auto-extraction glue between a {@link "../../components/PostComposer".PostDraft}'s
 * body text and the link-resolver hook
 * ({@link "./use-link-resolver"}). Watches the draft's `content` for
 * the first `http`/`https` URL via {@link "./extract-url".extractFirstUrl},
 * debounces, resolves it through the caller-supplied resolver, and
 * stages the resulting preview as
 * {@link "../../components/Post".LinkMedia} on the draft.
 *
 * Lives in `core/composer/` because the composer itself stays
 * presentational -- URL detection, resolver wiring, and the
 * debounce timer are app-internal concerns, not kit primitives.
 *
 * Behavioural contract:
 *
 * - **First URL wins.** The rendered post shows a single link
 *   preview card, so detecting just the first URL keeps the
 *   composer's preview aligned with what the user will eventually
 *   see in the feed.
 * - **Debounced.** Resolution waits {@link DEBOUNCE_MS} after the
 *   last keystroke before firing, so typing a URL character-by-
 *   character doesn't spam the resolver.
 * - **Yields to manual attachments.** If the draft already carries
 *   non-link media (image, gallery, mosaic, carousel), the hook
 *   does nothing -- the user's explicit attachment wins.
 * - **Honors dismissal.** When the user taps the X on a staged
 *   link preview, the URL is added to an in-memory dismissal set
 *   so it isn't immediately re-staged while it's still in the
 *   body. Removing the URL from the body and re-typing it clears
 *   the dismissal so the user can opt back in.
 * - **Clears stale previews.** If the URL leaves the body entirely
 *   (user deletes it), any matching staged link preview is
 *   cleared so the composer doesn't show a preview that no longer
 *   has a URL behind it.
 *
 * The hook returns nothing -- it's a side-effect wired to the
 * draft's lifecycle. Mount it next to `useState<PostDraft>` and pass
 * the resolver from {@link "./use-link-resolver".useLinkResolver}.
 *
 * @example
 * ```tsx
 * const [draft, setDraft] = useState<PostDraft>(emptyDraft);
 * const { resolve } = useLinkResolver();
 * useDraftLinkExtraction({ draft, onChange: setDraft, resolve });
 * ```
 */
import { useEffect, useRef } from "react";
import type { LinkPreviewData } from "../../components/Media";
import {
  clearMedia,
  withMedia,
  type PostDraft,
} from "../../components/PostComposer";
import { extractFirstUrl } from "./extract-url";

/**
 * Window in milliseconds we wait after the last `content` change
 * before kicking off the resolver. 500ms is a comfortable
 * "finished-typing" gap that matches the rhythm of other in-app
 * debounces ({@link "../data-collection/application"}'s lookups).
 */
export const DEBOUNCE_MS = 500;

/**
 * Inputs for {@link useDraftLinkExtraction}.
 */
export type UseDraftLinkExtractionParams = {
  /**
   * The current draft. The hook watches `draft.content` and
   * `draft.media` to drive its decisions; the parent stays the
   * source of truth.
   */
  draft: PostDraft;
  /**
   * Setter the hook calls to stage a resolved
   * {@link "../../components/Post".LinkMedia} (or to clear a stale
   * one). Pass the same setter you give to the composer's
   * `onChange` -- the auto-extraction flow shares the same
   * controlled-flow plumbing.
   */
  onChange: (next: PostDraft) => void;
  /**
   * URL → {@link LinkPreviewData} resolver. Typically{" "}
   * `useLinkResolver().resolve` in product code; the hook treats it
   * as an opaque async function so tests / demos can pass a stub
   * that returns canned previews without a network call.
   */
  resolve: (url: string) => Promise<LinkPreviewData | null>;
};

/**
 * Wires the auto-extraction flow described in the module header.
 * See {@link UseDraftLinkExtractionParams}.
 */
export function useDraftLinkExtraction({
  draft,
  onChange,
  resolve,
}: UseDraftLinkExtractionParams): void {
  // Stash live references so the effects can read the latest values
  // without depending on identity-unstable callbacks.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const resolveRef = useRef(resolve);
  resolveRef.current = resolve;

  // Tracks URLs the user has dismissed (tapped the X on a staged
  // link). Entries are pruned when the URL leaves the body so a
  // re-typed URL re-opens the auto-stage path.
  const dismissedRef = useRef<Set<string>>(new Set());

  // Tracks `draft.media` from the previous render so we can detect
  // the "link -> undefined" transition that signals a dismissal.
  const prevMediaRef = useRef(draft.media);

  // Effect 1: detect dismissal. Runs whenever the media slot
  // changes. Declared *before* the content-watch effect so the
  // dismissed-set update lands before the next render's content
  // effect reads it.
  useEffect(() => {
    const prev = prevMediaRef.current;
    if (prev?.kind === "link" && draft.media === undefined) {
      dismissedRef.current.add(prev.preview.url);
    }
    prevMediaRef.current = draft.media;
  }, [draft.media]);

  // Effect 2: watch the body for URLs, debounce, resolve, and
  // stage the preview. Cleanup cancels in-flight timers so a
  // burst of keystrokes only resolves once.
  useEffect(() => {
    const detected = extractFirstUrl(draft.content);

    pruneDismissals(dismissedRef.current, detected);

    if (!detected) {
      const current = draftRef.current.media;
      if (current?.kind === "link") {
        onChangeRef.current(clearMedia(draftRef.current));
      }
      return;
    }

    if (dismissedRef.current.has(detected)) return;
    if (draft.media && draft.media.kind !== "link") return;
    if (
      draft.media?.kind === "link" &&
      draft.media.preview.url === detected
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      const preview = await resolveRef.current(detected);
      if (!preview) return;
      // Re-validate after the async hop -- the user may have edited
      // the body, dismissed the preview, or attached another media
      // kind in the meantime.
      const latest = draftRef.current;
      if (extractFirstUrl(latest.content) !== detected) return;
      if (dismissedRef.current.has(detected)) return;
      if (latest.media && latest.media.kind !== "link") return;
      onChangeRef.current(withMedia(latest, { kind: "link", preview }));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draft.content, draft.media]);
}

/**
 * Drops dismissed URLs that are no longer in the body so a user who
 * removes-and-retypes a URL gets the preview back. The current
 * detected URL is preserved (we want it to stay dismissed until the
 * user removes it).
 */
function pruneDismissals(
  dismissed: Set<string>,
  detected: string | null,
): void {
  for (const url of dismissed) {
    if (url !== detected) {
      dismissed.delete(url);
    }
  }
}
