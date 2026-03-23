export const DICEBEAR_AVATAAARS = "https://api.dicebear.com/9.x/avataaars/webp";

const DEFAULT_PREVIEW_SEED = "new-person";

/** DiceBear avataaars URL for a stable seed string. */
export function avatarUrlForSeed(seed: string): string {
  return `${DICEBEAR_AVATAAARS}?seed=${encodeURIComponent(seed)}`;
}

/** DiceBear avataaars URL; stable for a given seed (e.g. person name), random when omitted. */
export function randomAvatar(seed?: string): string {
  return avatarUrlForSeed(seed ?? crypto.randomUUID());
}

export const newPersonPreviewAvatar = () =>
  avatarUrlForSeed(DEFAULT_PREVIEW_SEED);
