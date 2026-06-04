import type { ProfileProps } from "../../components/Profile";
import { citizenshipAlpha2, isCitizenshipNumericCode } from "./countries";
import { resolvePlatformUserAvatar } from "./avatar-from-handle";
import type { PlatformUser } from "./platform-api";

/** Strip the leading `@` stored on platform handles for {@link UserProfile} props. */
export function handleWithoutAtPrefix(handle: string): string {
  return handle.startsWith("@") ? handle.slice(1) : handle;
}

/** First supported citizenship as an ISO alpha-2 flag code for profile headers. */
export function platformUserFlagAlpha2(user: PlatformUser): string | undefined {
  for (const code of user.citizen_of) {
    if (!isCitizenshipNumericCode(code)) {
      continue;
    }
    const alpha2 = citizenshipAlpha2(code);
    if (alpha2) {
      return alpha2;
    }
  }
  return undefined;
}

export type PlatformUserProfileHeader = {
  avatar: string;
  name?: string;
  handle?: string;
  flag?: string;
  location?: string;
};

/**
 * Maps {@link PlatformUser} (from GET `/me`) into {@link UserProfile} header props.
 * Only surfaces a display name when the platform account has one stored.
 */
export function platformUserToProfileHeader(
  user: PlatformUser,
  clerkImageUrl?: string | null,
  clerkUserId?: string | null,
): PlatformUserProfileHeader {
  const header: PlatformUserProfileHeader = {
    avatar: resolvePlatformUserAvatar(user, clerkImageUrl, clerkUserId),
  };

  const name = user.name?.trim();
  if (name) {
    header.name = name;
  }

  if (user.handle) {
    header.handle = handleWithoutAtPrefix(user.handle);
  }

  const flag = platformUserFlagAlpha2(user);
  if (flag) {
    header.flag = flag;
  }

  const location = user.location?.trim();
  if (location) {
    header.location = location;
  }

  return header;
}

/** {@link ProfileProps} author row for in-feed post chips. */
export function platformUserToProfileProps(
  user: PlatformUser,
  clerkImageUrl?: string | null,
  clerkUserId?: string | null,
): ProfileProps {
  const header = platformUserToProfileHeader(user, clerkImageUrl, clerkUserId);
  return {
    source: header.avatar,
    ...(header.name ? { name: header.name } : {}),
    ...(header.handle ? { handle: header.handle } : {}),
    ...(header.flag ? { flag: header.flag } : {}),
    ...(header.location ? { from: header.location } : {}),
  };
}
