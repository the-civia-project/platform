import { describe, expect, it } from "vitest";
import { avatarFromHandle, resolvePlatformUserAvatar } from "./avatar-from-handle";

describe("avatarFromHandle", () => {
  it("builds a DiceBear URL from the handle seed", () => {
    expect(avatarFromHandle("@whimsical.axolotl.42")).toBe(
      "https://api.dicebear.com/9.x/avataaars/webp?seed=%40whimsical.axolotl.42",
    );
  });
});

describe("resolvePlatformUserAvatar", () => {
  it("uses handle when no platform upload", () => {
    expect(
      resolvePlatformUserAvatar({
        user_id: "id",
        citizen_of: [276],
        tag_label: "x",
        tag_discriminator: 1,
        handle: "@aria.popescu",
        name: null,
        location: "Berlin",
        avatar_key: null,
        avatar_url: null,
      }),
    ).toBe(avatarFromHandle("@aria.popescu"));
  });
});
