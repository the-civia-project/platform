import { randomAvatar } from "../demo/random-avatar";
import type { PlatformUser } from "./platform-api";

/** Deterministic DiceBear avatar URL for a username handle (or any seed). */
export function avatarFromHandle(seed: string): string {
  return randomAvatar(seed);
}

/** Platform MinIO URL, else handle-based DiceBear, else Clerk image, else guest seed. */
export function resolvePlatformUserAvatar(
  platform: PlatformUser | null,
  clerkImageUrl?: string | null,
  clerkUserId?: string | null,
): string {
  if (platform?.avatar_url) {
    return platform.avatar_url;
  }
  if (platform?.handle) {
    return avatarFromHandle(platform.handle);
  }
  if (clerkImageUrl) {
    return clerkImageUrl;
  }
  return avatarFromHandle(clerkUserId ?? "guest");
}
