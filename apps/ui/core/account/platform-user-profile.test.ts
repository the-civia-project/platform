import { describe, expect, it } from "vitest";
import {
  handleWithoutAtPrefix,
  platformUserFlagAlpha2,
  platformUserToProfileHeader,
  platformUserToProfileProps,
} from "./platform-user-profile";
import type { PlatformUser } from "./platform-api";

const sampleUser: PlatformUser = {
  user_id: "00000000-0000-0000-0000-000000000001",
  citizen_of: [642],
  tag_label: "whimsical_axolotl",
  tag_discriminator: 7,
  handle: "@whimsical.axolotl.42",
  name: null,
  location: "Bucharest, Romania",
  avatar_key: null,
  avatar_url: null,
};

describe("platform user profile mapping", () => {
  it("strips the @ prefix from stored handles", () => {
    expect(handleWithoutAtPrefix("@aria.popescu")).toBe("aria.popescu");
  });

  it("maps citizenship numeric codes to alpha-2 flags", () => {
    expect(platformUserFlagAlpha2(sampleUser)).toBe("RO");
  });

  it("omits the display name when the account has none stored", () => {
    expect(platformUserToProfileHeader(sampleUser)).toEqual({
      avatar: expect.stringContaining("dicebear"),
      handle: "whimsical.axolotl.42",
      flag: "RO",
      location: "Bucharest, Romania",
    });
  });

  it("includes the stored display name when present", () => {
    expect(
      platformUserToProfileHeader({ ...sampleUser, name: "  Aria Popescu  " }),
    ).toMatchObject({
      name: "Aria Popescu",
    });
  });

  it("builds Profile row props without a fake name", () => {
    expect(platformUserToProfileProps(sampleUser)).toEqual({
      source: expect.stringContaining("dicebear"),
      handle: "whimsical.axolotl.42",
      flag: "RO",
      from: "Bucharest, Romania",
    });
  });
});
