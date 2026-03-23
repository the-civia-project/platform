/**
 * Fake submit handler for the post composer -- matches the kit's
 * "kit primitive + real wiring, no backend" scope: the composer is
 * fully wired into a `useSubmitPost`-style hook, but the hook itself
 * just simulates a network call. Swap this module out for a real
 * `POST /posts` integration when the API lands.
 *
 * The hook owns:
 *
 * - `submitting` -- `true` between the user pressing submit and the
 *   fake delay resolving. Drives the composer's `submitting` prop so
 *   the surface dims correctly.
 * - `error` -- last submission error message, or `undefined`. Drives
 *   the composer's `error` prop. Auto-clears on the next `submit`
 *   call.
 * - `submit(draft)` -- async function. Awaits a 500ms timer, logs the
 *   draft to the console (so devs can verify the wiring without a
 *   real backend), and resolves to `true` on success / `false` on
 *   simulated failure.
 *
 * The simulated-failure code path is opt-in via {@link SubmitOptions.failureRate};
 * the default `0` keeps the kit-screen happy-path demo from flickering
 * red unexpectedly. Set it to e.g. `0.5` in a debug toggle to exercise
 * the error treatment without a backend.
 */
import { useCallback, useRef, useState } from "react";
import type { PostDraft } from "../../components/PostComposer";

/**
 * Options for {@link useSubmitPost}. All optional; defaults model the
 * happy path.
 */
export type SubmitOptions = {
  /**
   * Fake latency in milliseconds. The submit returns `true` (or
   * `false`, see {@link failureRate}) after this many ms.
   * @defaultValue 500
   */
  latencyMs?: number;
  /**
   * Probability of a simulated submission failure, in `[0, 1]`. The
   * default `0` always succeeds. Set to a positive value in dev tools
   * to exercise the composer's `error` treatment.
   * @defaultValue 0
   */
  failureRate?: number;
};

/**
 * Public API returned by {@link useSubmitPost}.
 */
export type SubmitPostApi = {
  /**
   * Submits the given draft. Returns `true` on success, `false` on
   * (simulated) failure. The hook owns the in-flight state -- callers
   * just `await`, the composer's chrome dims from
   * {@link SubmitPostApi.submitting} and surfaces the error from
   * {@link SubmitPostApi.error}.
   */
  submit: (draft: PostDraft) => Promise<boolean>;
  /** `true` while a submit is in flight. */
  submitting: boolean;
  /** Last submission error message, or `undefined`. */
  error: string | undefined;
  /** Clears the error state. Use when the user starts editing again. */
  clearError: () => void;
};

/**
 * Returns the submit-post API. State is local to the hook -- mount it
 * inside the screen that owns the composer.
 *
 * @param options - {@link SubmitOptions}
 */
export function useSubmitPost(options: SubmitOptions = {}): SubmitPostApi {
  const { latencyMs = 500, failureRate = 0 } = options;

  // Refs so the latest options are visible to the inner `submit` even
  // when the caller passes a new options object on each render (the
  // hook re-creates `submit` lazily otherwise, which thrashes any
  // `useEffect` that depends on it).
  const latencyRef = useRef(latencyMs);
  latencyRef.current = latencyMs;
  const failureRef = useRef(failureRate);
  failureRef.current = failureRate;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const submit = useCallback(async (draft: PostDraft): Promise<boolean> => {
    setError(undefined);
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, latencyRef.current));
      if (Math.random() < failureRef.current) {
        // eslint-disable-next-line no-console
        console.warn("[useSubmitPost] simulated failure for draft", draft);
        setError("Couldn't post just now. Try again in a moment.");
        return false;
      }
      // eslint-disable-next-line no-console
      console.log("[useSubmitPost] submitted draft", draft);
      return true;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const clearError = useCallback(() => setError(undefined), []);

  return { submit, submitting, error, clearError };
}
