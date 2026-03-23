/**
 * Tests for {@link "./resolve-cell-surface"} -- pins how group variants map
 * to active / inactive {@link ButtonSurface} lookups.
 */
import { describe, expect, it } from "vitest";
import { resolveButtonSurface } from "../Button/resolve-surface";
import { resolveTheme } from "../theme";
import {
  resolveToggleCellSurface,
  resolveToggleInactiveVariant,
  resolveToggleSelectedVariant,
} from "./resolve-cell-surface";

describe("resolveToggleInactiveVariant", () => {
  it("maps link to full-ghost for grid cells", () => {
    expect(resolveToggleInactiveVariant("link")).toBe("full-ghost");
  });

  it("passes ghost through unchanged", () => {
    expect(resolveToggleInactiveVariant("ghost")).toBe("ghost");
  });
});

describe("resolveToggleSelectedVariant", () => {
  it("promotes ghost to primary", () => {
    expect(resolveToggleSelectedVariant("ghost")).toBe("primary");
  });

  it("keeps simple, inverted, and danger on the selected cell", () => {
    expect(resolveToggleSelectedVariant("simple")).toBe("simple");
    expect(resolveToggleSelectedVariant("inverted")).toBe("inverted");
    expect(resolveToggleSelectedVariant("danger")).toBe("danger");
  });
});

describe("resolveToggleCellSurface", () => {
  it("paints inactive ghost cells with the ghost palette", () => {
    const t = resolveTheme("light", "gazette");
    expect(resolveToggleCellSurface("ghost", t, false)).toEqual(
      resolveButtonSurface("ghost", t),
    );
  });

  it("paints selected ghost cells with primary", () => {
    const t = resolveTheme("light", "gazette");
    const surface = resolveToggleCellSurface("ghost", t, true);
    expect(surface.backgroundColor).toBe(t.primary);
    expect(surface.color).toBe(t.onPrimary);
  });

  it("uses ghost for inactive cells when the group variant is primary", () => {
    const t = resolveTheme("light", "gazette");
    const surface = resolveToggleCellSurface("primary", t, false);
    expect(surface.backgroundColor).toBe("transparent");
    expect(surface.borderWidth).toBe(1);
  });

  it("keeps simple on the selected cell and ghost on siblings", () => {
    const t = resolveTheme("dark", "gazette");
    const selected = resolveToggleCellSurface("simple", t, true);
    const inactive = resolveToggleCellSurface("simple", t, false);
    expect(selected.backgroundColor).toBe(t.surfaceInverse);
    expect(inactive.backgroundColor).toBe("transparent");
    expect(inactive.borderWidth).toBe(1);
  });
});
