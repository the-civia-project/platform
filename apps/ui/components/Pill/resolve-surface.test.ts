import { describe, expect, it } from "vitest";
import { resolveTheme } from "../theme";
import { resolvePillMutedSurface } from "./resolve-surface";

describe("resolvePillMutedSurface", () => {
  it("maps Gazette light tokens to the recessed chip surface", () => {
    const theme = resolveTheme("light", "gazette");
    expect(resolvePillMutedSurface(theme)).toEqual({
      backgroundColor: theme.surfaceWell,
      color: theme.fgMuted,
      borderWidth: 1,
      borderColor: theme.borderHandle,
    });
  });
});
