/**
 * React hook surface for {@link PostType} classification. Thin shell
 * around the pure {@link pickPostType} -- the only post-type surface that
 * depends on React, so the underlying classifier in `./post-type` stays
 * unit-testable in Node and reusable outside a render tree.
 *
 * Consumers in `components/`, `views/`, and `core/` should reach for
 * {@link usePostType} from here when they're inside a component; pure
 * code (analytics pipelines, server-side feed routing, tests) imports
 * {@link pickPostType} from `./post-type` directly.
 *
 * Re-exports {@link pickPostType}, {@link PostType}, and
 * {@link PostTypeInput} so a single import covers both the runtime hook
 * and the underlying types.
 */
import { useMemo } from "react";
import {
  pickPostType,
  type PostType,
  type PostTypeInput,
} from "./post-type";

export { pickPostType, type PostType, type PostTypeInput };

/**
 * React hook that classifies a {@link Post}'s shape from its body-driving
 * props. Memoises against `content`, `media`, and `archetype` so the returned
 * {@link PostType} keeps a stable reference between renders when none of the
 * inputs change -- safe to pass into `useEffect` deps or `memo`'d
 * children without churning.
 *
 * The classifier is pure and synchronous; the only reason this is a hook
 * (rather than a plain function call) is the memoisation. Code that
 * already has the inputs in hand and doesn't need a stable reference can
 * call {@link pickPostType} directly.
 *
 * @param input - The body-driving props from a `PostProps` -- pass
 *                `{ content, media, archetype }` (or the full props object;
 *                {@link PostTypeInput} accepts any structurally
 *                compatible value).
 * @returns The active {@link PostType}, stable across renders unless
 *          `content`, `media`, or `archetype` change identity.
 */
export function usePostType(input: PostTypeInput): PostType {
  const { content, media, archetype } = input;
  return useMemo(
    () => pickPostType({ content, media, archetype }),
    [content, media, archetype],
  );
}
