import { resolvePlatformUserAvatar } from "../account/avatar-from-handle";
import type { PlatformUser } from "../account/platform-api";

/**
 * Avatar URL for the signed-in viewer: platform upload, then handle-based
 * DiceBear, then Clerk profile image, then a guest seed.
 */
export function resolveUserAvatarSource(
  platform: PlatformUser | null,
  clerkImageUrl?: string | null,
  clerkUserId?: string | null,
): string {
  return resolvePlatformUserAvatar(platform, clerkImageUrl, clerkUserId);
}
