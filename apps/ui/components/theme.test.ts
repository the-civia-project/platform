import { describe, expect, it } from "vitest";
import {
  resolveTheme,
  type ColorScheme,
  type Theme,
  type ThemeFlavor,
} from "./theme";

describe("resolveTheme", () => {
  const palette: ReadonlyArray<[ThemeFlavor, ColorScheme, Theme]> = [
    [
      "gazette",
      "light",
      {
        fg: "#1f1810",
        fgEmphasis: "#2a1f15",
        fgMuted: "#7a6a55",
        fgInverse: "#f5ecdb",

        surfaceCard: "#ffffff",
        surfaceSubtle: "#f3ecdc",
        surfaceInput: "#efe6d2",
        surfaceWell: "#e6dcc4",
        surfaceInverse: "#241b13",

        borderDefault: "#dccfb3",
        borderSubtle: "#e2d6bc",
        borderEmphasis: "#b8a47e",
        borderHandle: "#cdbf9c",

        primary: "#1d4ed8",
        onPrimary: "#ffffff",
        danger: "#b91c1c",
        onDanger: "#ffffff",
        success: "#65a30d",
        onSuccess: "#ffffff",

        scrim: "rgba(0,0,0,0.45)",
      },
    ],
    [
      "gazette",
      "dark",
      {
        fg: "#f5ecdb",
        fgEmphasis: "#fff5e0",
        fgMuted: "#a89881",
        fgInverse: "#241b13",

        surfaceCard: "#0c0805",
        surfaceSubtle: "#1c150e",
        surfaceInput: "#2c2118",
        surfaceWell: "#33271c",
        surfaceInverse: "#f5ecdb",

        borderDefault: "#3d2f22",
        borderSubtle: "#3a2c20",
        borderEmphasis: "#5e4d3c",
        borderHandle: "#3a2d20",

        primary: "#4d83df",
        onPrimary: "#ffffff",
        danger: "#dc2626",
        onDanger: "#ffffff",
        success: "#84cc16",
        onSuccess: "#ffffff",

        scrim: "rgba(0,0,0,0.45)",
      },
    ],
    [
      "matrix",
      "light",
      {
        fg: "#0f1f14",
        fgEmphasis: "#14532d",
        fgMuted: "#3f6b52",
        fgInverse: "#ecfdf5",

        surfaceCard: "#f3faf5",
        surfaceSubtle: "#e5f4eb",
        surfaceInput: "#d7ecdd",
        surfaceWell: "#c5e4cf",
        surfaceInverse: "#052e1a",

        borderDefault: "#9dc4ae",
        borderSubtle: "#b5d4c3",
        borderEmphasis: "#4ade80",
        borderHandle: "#86c79a",

        primary: "#16a34a",
        onPrimary: "#ffffff",
        danger: "#b91c1c",
        onDanger: "#ffffff",
        success: "#15803d",
        onSuccess: "#ffffff",

        scrim: "rgba(0,0,0,0.45)",
      },
    ],
    [
      "matrix",
      "dark",
      {
        fg: "#86efac",
        fgEmphasis: "#bbf7d0",
        fgMuted: "#4ade80",
        fgInverse: "#020806",

        surfaceCard: "#020a06",
        surfaceSubtle: "#061810",
        surfaceInput: "#0c2618",
        surfaceWell: "#0f3320",
        surfaceInverse: "#bbf7d0",

        borderDefault: "#166534",
        borderSubtle: "#14532d",
        borderEmphasis: "#22c55e",
        borderHandle: "#15803d",

        primary: "#22c55e",
        onPrimary: "#ffffff",
        danger: "#f87171",
        onDanger: "#ffffff",
        success: "#4ade80",
        onSuccess: "#ffffff",

        scrim: "rgba(0,0,0,0.45)",
      },
    ],
    [
      "pulse",
      "light",
      {
        fg: "#1a162e",
        fgEmphasis: "#2d2648",
        fgMuted: "#6b6589",
        fgInverse: "#faf5ff",

        surfaceCard: "#ffffff",
        surfaceSubtle: "#f5f3ff",
        surfaceInput: "#ede9fe",
        surfaceWell: "#ddd6fe",
        surfaceInverse: "#3b0764",

        borderDefault: "#d4c9f5",
        borderSubtle: "#e0d8fc",
        borderEmphasis: "#8b5cf6",
        borderHandle: "#c4b5fd",

        primary: "#7c3aed",
        onPrimary: "#ffffff",
        danger: "#e11d48",
        onDanger: "#ffffff",
        success: "#059669",
        onSuccess: "#ffffff",

        scrim: "rgba(0,0,0,0.45)",
      },
    ],
    [
      "pulse",
      "dark",
      {
        fg: "#ede9fe",
        fgEmphasis: "#faf5ff",
        fgMuted: "#8b7fb5",
        fgInverse: "#130a24",

        surfaceCard: "#0a0814",
        surfaceSubtle: "#131024",
        surfaceInput: "#1c1633",
        surfaceWell: "#241d40",
        surfaceInverse: "#ede9fe",

        borderDefault: "#362f52",
        borderSubtle: "#2e2845",
        borderEmphasis: "#a78bfa",
        borderHandle: "#4c3f75",

        primary: "#a78bfa",
        onPrimary: "#ffffff",
        danger: "#fb7185",
        onDanger: "#ffffff",
        success: "#34d399",
        onSuccess: "#ffffff",

        scrim: "rgba(0,0,0,0.45)",
      },
    ],
    [
      "ember",
      "light",
      {
        fg: "#281418",
        fgEmphasis: "#3a1f22",
        fgMuted: "#8f6268",
        fgInverse: "#fff5f3",

        surfaceCard: "#fff9f7",
        surfaceSubtle: "#ffefea",
        surfaceInput: "#ffe4dc",
        surfaceWell: "#ffd3c4",
        surfaceInverse: "#2a1418",

        borderDefault: "#e2b8ae",
        borderSubtle: "#eed0c8",
        borderEmphasis: "#cc5a4a",
        borderHandle: "#d49a8e",

        primary: "#f54e36",
        onPrimary: "#ffffff",
        danger: "#e11d48",
        onDanger: "#ffffff",
        success: "#15803d",
        onSuccess: "#ffffff",

        scrim: "rgba(0,0,0,0.45)",
      },
    ],
    [
      "ember",
      "dark",
      {
        fg: "#ffebe3",
        fgEmphasis: "#fff4ee",
        fgMuted: "#c49388",
        fgInverse: "#1e1214",

        surfaceCard: "#110d0e",
        surfaceSubtle: "#1a1416",
        surfaceInput: "#261c1f",
        surfaceWell: "#33262a",
        surfaceInverse: "#fff4ee",

        borderDefault: "#523d42",
        borderSubtle: "#423338",
        borderEmphasis: "#ff8a6d",
        borderHandle: "#5e4549",

        primary: "#ff8f77",
        onPrimary: "#ffffff",
        danger: "#fb7185",
        onDanger: "#ffffff",
        success: "#4ade80",
        onSuccess: "#ffffff",

        scrim: "rgba(0,0,0,0.45)",
      },
    ],
    [
      "default",
      "light",
      {
        fg: "#141414",
        fgEmphasis: "#000000",
        fgMuted: "#6b6b6b",
        fgInverse: "#ffffff",

        surfaceCard: "#ffffff",
        surfaceSubtle: "#f7f7f7",
        surfaceInput: "#ededed",
        surfaceWell: "#e0e0e0",
        surfaceInverse: "#141414",

        borderDefault: "#cccccc",
        borderSubtle: "#d9d9d9",
        borderEmphasis: "#8b5cf6",
        borderHandle: "#b3b3b3",

        primary: "#7c3aed",
        onPrimary: "#ffffff",
        danger: "#dc2626",
        onDanger: "#ffffff",
        success: "#15803d",
        onSuccess: "#ffffff",

        scrim: "rgba(0,0,0,0.45)",
      },
    ],
    [
      "default",
      "dark",
      {
        fg: "#f5f5f5",
        fgEmphasis: "#ffffff",
        fgMuted: "#a3a3a3",
        fgInverse: "#141414",

        surfaceCard: "#0a0a0a",
        surfaceSubtle: "#141414",
        surfaceInput: "#1f1f1f",
        surfaceWell: "#2a2a2a",
        surfaceInverse: "#f5f5f5",

        borderDefault: "#3d3d3d",
        borderSubtle: "#333333",
        borderEmphasis: "#c4b5fd",
        borderHandle: "#525252",

        primary: "#a78bfa",
        onPrimary: "#ffffff",
        danger: "#ef4444",
        onDanger: "#ffffff",
        success: "#34d399",
        onSuccess: "#ffffff",

        scrim: "rgba(0,0,0,0.45)",
      },
    ],
  ];

  it.each(palette)(
    "resolves the %s %s palette to the pinned cell",
    (flavor, scheme, expected) => {
      expect(resolveTheme(scheme, flavor)).toEqual(expected);
    },
  );

  it("defaults flavor to default when omitted", () => {
    expect(resolveTheme("light")).toEqual(resolveTheme("light", "default"));
  });

  it("returns a stable reference for the same scheme and flavor", () => {
    expect(resolveTheme("light", "gazette")).toBe(
      resolveTheme("light", "gazette"),
    );
    expect(resolveTheme("dark", "matrix")).toBe(resolveTheme("dark", "matrix"));
    expect(resolveTheme("dark", "ember")).toBe(resolveTheme("dark", "ember"));
    expect(resolveTheme("light", "default")).toBe(
      resolveTheme("light", "default"),
    );
  });

  it("returns frozen palettes", () => {
    expect(Object.isFrozen(resolveTheme("light", "pulse"))).toBe(true);
    expect(Object.isFrozen(resolveTheme("dark", "matrix"))).toBe(true);
  });

  describe("cross-scheme invariants", () => {
    const flavors: ThemeFlavor[] = [
      "gazette",
      "matrix",
      "pulse",
      "ember",
      "default",
    ];

    it("primary, danger, and success always paint white on top", () => {
      for (const flavor of flavors) {
        for (const scheme of ["light", "dark"] as const) {
          const t = resolveTheme(scheme, flavor);
          expect(t.onPrimary).toBe("#ffffff");
          expect(t.onDanger).toBe("#ffffff");
          expect(t.onSuccess).toBe("#ffffff");
        }
      }
    });

    it("scrim is identical across schemes within a flavor", () => {
      for (const flavor of flavors) {
        const light = resolveTheme("light", flavor);
        const dark = resolveTheme("dark", flavor);
        expect(light.scrim).toBe(dark.scrim);
      }
    });
  });
});
