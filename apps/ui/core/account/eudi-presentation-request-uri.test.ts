import { describe, expect, it, vi } from "vitest";

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        eudiVerifierPublicUrl: "https://platform.theciviaproject.org",
      },
    },
  },
}));

import { buildEudiPresentationRequestUri } from "./eudi-presentation-request-uri";

describe("buildEudiPresentationRequestUri", () => {
  it("embeds the platform user id in the wallet request path", () => {
    expect(
      buildEudiPresentationRequestUri("550e8400-e29b-41d4-a716-446655440000"),
    ).toMatch(
      /\/wallet\/request\.jwt\/550e8400-e29b-41d4-a716-446655440000$/,
    );
  });

  it("rejects an empty user id", () => {
    expect(() => buildEudiPresentationRequestUri("   ")).toThrow(/user id/i);
  });
});
