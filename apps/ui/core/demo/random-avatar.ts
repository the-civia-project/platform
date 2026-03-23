/**
 * Shared avatar-URL helper used by every UI Kit demo screen that
 * needs a stable cartoon avatar. Keeping a single helper means the
 * same seed (e.g. `Aria`) renders the same face across
 * UI Kit screens and {@link "./random-posts".randomPosts} -- demo authors stay visually
 * consistent everywhere the kit shows people.
 *
 * Backed by DiceBear's Avataaars endpoint; the function name describes
 * the role (give me an avatar URL), the URL template documents the
 * implementation.
 */

/**
 * Builds an avatar URL for a given seed, sourced from DiceBear's
 * Avataaars endpoint.
 *
 * Despite the name, this is **deterministic**: the same seed always
 * returns the same generated face. The "random" framing reflects the
 * intent at the call site (demo data needs *some* face, any face will
 * do) rather than non-determinism in the helper itself.
 *
 * @param seed - Free-form string used as the DiceBear seed. Passing a
 *   stable identifier (a first name, a handle) keeps demo avatars
 *   consistent across re-renders and across screens.
 * @returns A `https://api.dicebear.com/9.x/avataaars/webp` URL that
 *   can be dropped straight into an `<Image source>` or {@link
 *   "../../components/Avatar".AvatarProps.source} slot.
 *
 * @example
 * ```ts
 * const avatar = randomAvatar("Aria");
 * // → https://api.dicebear.com/9.x/avataaars/webp?seed=Aria
 * ```
 */
export const randomAvatar = (seed: string): string =>
  `https://api.dicebear.com/9.x/avataaars/webp?seed=${encodeURIComponent(seed)}`;
