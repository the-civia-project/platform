import { describe, expect, it } from "vitest";
import { resolveTheme, type ColorScheme } from "../../theme";
import {
  DEFAULT_VERDICT_LABELS,
  resolveFactCheckBadgeSurface,
  type FactCheckBadgeSurface,
  type FactCheckVerdict,
} from "./resolve-surface";

describe("resolveFactCheckBadgeSurface", () => {
  // Full verdict x scheme palette as a table. Every cell is pinned so any
  // colour tweak shows up in the diff as a single literal change; nobody
  // can quietly retune the verdict palette without the test going red and
  // a reviewer signing off on the exact (verdict, scheme) cell that moved.
  // Values are sourced from the Gazette palette in `../theme.ts` -- when
  // a token there changes, the corresponding cell below moves with it.
  const palette: ReadonlyArray<
    [FactCheckVerdict, ColorScheme, FactCheckBadgeSurface]
  > = [
    [
      "true",
      "light",
      {
        backgroundColor: "#65a30d",
        color: "#ffffff",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],
    [
      "true",
      "dark",
      {
        backgroundColor: "#84cc16",
        color: "#ffffff",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],

    [
      "mostly-true",
      "light",
      {
        backgroundColor: "transparent",
        color: "#65a30d",
        borderWidth: 1,
        borderColor: "#65a30d",
      },
    ],
    [
      "mostly-true",
      "dark",
      {
        backgroundColor: "transparent",
        color: "#84cc16",
        borderWidth: 1,
        borderColor: "#84cc16",
      },
    ],

    [
      "misleading",
      "light",
      {
        backgroundColor: "transparent",
        color: "#2a1f15",
        borderWidth: 1,
        borderColor: "#b8a47e",
      },
    ],
    [
      "misleading",
      "dark",
      {
        backgroundColor: "transparent",
        color: "#fff5e0",
        borderWidth: 1,
        borderColor: "#5e4d3c",
      },
    ],

    [
      "false",
      "light",
      {
        backgroundColor: "#b91c1c",
        color: "#ffffff",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],
    [
      "false",
      "dark",
      {
        backgroundColor: "#dc2626",
        color: "#ffffff",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],

    [
      "unverifiable",
      "light",
      {
        backgroundColor: "transparent",
        color: "#7a6a55",
        borderWidth: 1,
        borderColor: "#dccfb3",
      },
    ],
    [
      "unverifiable",
      "dark",
      {
        backgroundColor: "transparent",
        color: "#a89881",
        borderWidth: 1,
        borderColor: "#3d2f22",
      },
    ],
  ];

  it.each(palette)(
    "%s in %s mode resolves to the pinned palette cell",
    (verdict, scheme, expected) => {
      expect(
        resolveFactCheckBadgeSurface(verdict, resolveTheme(scheme, "gazette")),
      ).toEqual(expected);
    },
  );

  it("returns a fresh object on every call (no shared mutable surface)", () => {
    const a = resolveFactCheckBadgeSurface("true", resolveTheme("light", "gazette"));
    const b = resolveFactCheckBadgeSurface("true", resolveTheme("light", "gazette"));
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  describe("cross-verdict invariants", () => {
    const allVerdicts: FactCheckVerdict[] = [
      "true",
      "mostly-true",
      "misleading",
      "false",
      "unverifiable",
    ];
    const bothSchemes: ColorScheme[] = ["light", "dark"];

    it("only `true` and `false` use a saturated fill (the other three are outlined)", () => {
      // Pins the structural promise the verdict palette makes: only the two
      // confident verdicts pay the saturated-accent cost; the three
      // qualified ones are outlined neutrals. If a future verdict gets a
      // fill, this test points at it.
      const filled: readonly FactCheckVerdict[] = ["true", "false"];
      for (const scheme of bothSchemes) {
        for (const verdict of allVerdicts) {
          const surface = resolveFactCheckBadgeSurface(
            verdict,
            resolveTheme(scheme, "gazette"),
          );
          if (filled.includes(verdict)) {
            expect(surface.backgroundColor).not.toBe("transparent");
            expect(surface.borderWidth).toBe(0);
            expect(surface.borderColor).toBe("transparent");
          } else {
            expect(surface.backgroundColor).toBe("transparent");
            expect(surface.borderWidth).toBe(1);
            expect(surface.borderColor).not.toBe("transparent");
          }
        }
      }
    });

    it("`true` and `false` pair with their theme on-accent foreground", () => {
      // Saturated fills are always paired with the theme's documented
      // on-accent label colour so contrast stays legible against the
      // saturated background.
      for (const scheme of bothSchemes) {
        const t = resolveTheme(scheme, "gazette");
        expect(resolveFactCheckBadgeSurface("true", t).color).toBe(
          t.onSuccess,
        );
        expect(resolveFactCheckBadgeSurface("false", t).color).toBe(
          t.onDanger,
        );
      }
    });

    it("`mostly-true` borrows the success colour for both label and stroke", () => {
      // Pins the "softened confident" reading: the qualified True is
      // visually adjacent to True (same accent) but never paints a fill.
      for (const scheme of bothSchemes) {
        const t = resolveTheme(scheme, "gazette");
        const surface = resolveFactCheckBadgeSurface("mostly-true", t);
        expect(surface.color).toBe(t.success);
        expect(surface.borderColor).toBe(t.success);
      }
    });
  });

  describe("DEFAULT_VERDICT_LABELS", () => {
    it("ships a label for every verdict", () => {
      const verdicts: FactCheckVerdict[] = [
        "true",
        "mostly-true",
        "misleading",
        "false",
        "unverifiable",
      ];
      for (const verdict of verdicts) {
        expect(typeof DEFAULT_VERDICT_LABELS[verdict]).toBe("string");
        expect(DEFAULT_VERDICT_LABELS[verdict].length).toBeGreaterThan(0);
      }
    });
  });
});
