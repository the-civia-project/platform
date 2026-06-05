import { describe, expect, it, vi } from "vitest";

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        eudiVerifierPublicUrl: "https://platform.theciviaproject.org",
        platformApiUrl: "https://platform.example",
      },
    },
  },
}));

import { buildEudiPresentationRequestUri } from "./eudi-presentation-request-uri";

describe("buildEudiPresentationRequestUri", () => {
  it("embeds the session id in the wallet presentation start path", () => {
    expect(
      buildEudiPresentationRequestUri("550e8400-e29b-41d4-a716-446655440000"),
    ).toMatch(
      /\/wallet\/presentation\/start\/550e8400-e29b-41d4-a716-446655440000$/,
    );
  });

  it("rejects an empty session id", () => {
    expect(() => buildEudiPresentationRequestUri("   ")).toThrow(/session id/i);
  });
});
