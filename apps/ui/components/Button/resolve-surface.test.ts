import { describe, expect, it } from "vitest";
import { resolveTheme, type ColorScheme } from "../theme";
import {
  resolveButtonSurface,
  type ButtonSurface,
  type ButtonVariant,
} from "./resolve-surface";

describe("resolveButtonSurface", () => {
  // Full variant x scheme palette as a table. Every cell is pinned so any
  // colour tweak shows up in the diff as a single literal change; nobody
  // can quietly retune the palette without the test going red and a
  // reviewer signing off on the exact (variant, scheme) cell that moved.
  // Values are sourced from the Gazette palette in `../theme.ts` -- when a
  // token there changes, the corresponding cell below moves with it.
  const palette: ReadonlyArray<[ButtonVariant, ColorScheme, ButtonSurface]> = [
    // simple -- inverse surface + inverse foreground, no border (the "ink
    // stamp" reading: walnut on cream / cream on walnut).
    [
      "simple",
      "light",
      {
        backgroundColor: "#241b13",
        color: "#f5ecdb",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],
    [
      "simple",
      "dark",
      {
        backgroundColor: "#f5ecdb",
        color: "#241b13",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],

    // inverted -- raised card surface + body foreground + emphasis stroke.
    // Reads as a chrome-on-page button; the border keeps it visible when it
    // floats over a same-toned card.
    [
      "inverted",
      "light",
      {
        backgroundColor: "#ffffff",
        color: "#1f1810",
        borderWidth: 1,
        borderColor: "#b8a47e",
      },
    ],
    [
      "inverted",
      "dark",
      {
        backgroundColor: "#0c0805",
        color: "#f5ecdb",
        borderWidth: 1,
        borderColor: "#5e4d3c",
      },
    ],

    // primary -- brand-accent fill, no border.
    [
      "primary",
      "light",
      {
        backgroundColor: "#1d4ed8",
        color: "#ffffff",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],
    [
      "primary",
      "dark",
      {
        backgroundColor: "#4d83df",
        color: "#ffffff",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],

    // danger -- destructive accent fill, no border.
    [
      "danger",
      "light",
      {
        backgroundColor: "#b91c1c",
        color: "#ffffff",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],
    [
      "danger",
      "dark",
      {
        backgroundColor: "#dc2626",
        color: "#ffffff",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],

    // ghost -- transparent fill with an emphasis hairline border.
    [
      "ghost",
      "light",
      {
        backgroundColor: "transparent",
        color: "#2a1f15",
        borderWidth: 1,
        borderColor: "#b8a47e",
      },
    ],
    [
      "ghost",
      "dark",
      {
        backgroundColor: "transparent",
        color: "#fff5e0",
        borderWidth: 1,
        borderColor: "#5e4d3c",
      },
    ],

    // full-ghost -- transparent fill, no border, emphasis foreground.
    [
      "full-ghost",
      "light",
      {
        backgroundColor: "transparent",
        color: "#2a1f15",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],
    [
      "full-ghost",
      "dark",
      {
        backgroundColor: "transparent",
        color: "#fff5e0",
        borderWidth: 0,
        borderColor: "transparent",
      },
    ],

    // link -- transparent fill, brand-accent label, underline. The only
    // variant that sets `textDecorationLine`.
    [
      "link",
      "light",
      {
        backgroundColor: "transparent",
        color: "#1d4ed8",
        borderWidth: 0,
        borderColor: "transparent",
        textDecorationLine: "underline",
      },
    ],
    [
      "link",
      "dark",
      {
        backgroundColor: "transparent",
        color: "#4d83df",
        borderWidth: 0,
        borderColor: "transparent",
        textDecorationLine: "underline",
      },
    ],
  ];

  it.each(palette)(
    "%s in %s mode resolves to the pinned palette cell",
    (variant, scheme, expected) => {
      expect(resolveButtonSurface(variant, resolveTheme(scheme, "gazette"))).toEqual(
        expected,
      );
    },
  );

  it("returns a fresh object on every call (no shared mutable surface)", () => {
    // Spread targets in React Native StyleSheets must not alias each
    // other -- aliasing would let an upstream call accidentally mutate a
    // shared surface and bleed across buttons. Pin the contract here.
    const a = resolveButtonSurface("primary", resolveTheme("light", "gazette"));
    const b = resolveButtonSurface("primary", resolveTheme("light", "gazette"));
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  describe("cross-variant invariants", () => {
    const allVariants: ButtonVariant[] = [
      "simple",
      "inverted",
      "primary",
      "danger",
      "ghost",
      "full-ghost",
      "link",
    ];
    const bothSchemes: ColorScheme[] = ["light", "dark"];

    it("only the link variant sets textDecorationLine", () => {
      // Underline is a label-only treatment that's meaningful exactly
      // once in the palette. Catches drift where someone adds an
      // underline to a second variant without realising IconButton
      // ignores it.
      for (const scheme of bothSchemes) {
        for (const variant of allVariants) {
          const surface = resolveButtonSurface(
            variant,
            resolveTheme(scheme, "gazette"),
          );
          if (variant === "link") {
            expect(surface.textDecorationLine).toBe("underline");
          } else {
            expect(surface.textDecorationLine).toBeUndefined();
          }
        }
      }
    });

    it("only ghost and inverted have a visible border", () => {
      // The kit's stroke discipline: only two variants pay the hairline
      // cost. If a future variant adds a border, this test points at it
      // and the reviewer can decide if that's intentional.
      const stroked: readonly ButtonVariant[] = ["ghost", "inverted"];
      for (const scheme of bothSchemes) {
        for (const variant of allVariants) {
          const surface = resolveButtonSurface(
            variant,
            resolveTheme(scheme, "gazette"),
          );
          if (stroked.includes(variant)) {
            expect(surface.borderWidth).toBe(1);
            expect(surface.borderColor).not.toBe("transparent");
          } else {
            expect(surface.borderWidth).toBe(0);
            expect(surface.borderColor).toBe("transparent");
          }
        }
      }
    });

    it("simple paints the active scheme's inverse surface and inverse foreground", () => {
      // Pins the structural promise the variant doc string makes:
      // `simple` is the "ink stamp" -- the OPPOSITE scheme's body surface
      // and body foreground. If someone retunes either theme slot, this
      // test forces them to retune both halves of the swap together (or
      // remove the documented promise).
      for (const scheme of bothSchemes) {
        const t = resolveTheme(scheme, "gazette");
        const simple = resolveButtonSurface("simple", t);
        expect(simple.backgroundColor).toBe(t.surfaceInverse);
        expect(simple.color).toBe(t.fgInverse);
      }
    });

    it("inverted paints the raised card surface, body foreground, and emphasis border", () => {
      // Pins the structural promise the variant doc string makes:
      // `inverted` is the "chrome on page" pill -- same fill as a Card,
      // body foreground, plus a hairline emphasis stroke.
      for (const scheme of bothSchemes) {
        const t = resolveTheme(scheme, "gazette");
        const inverted = resolveButtonSurface("inverted", t);
        expect(inverted.backgroundColor).toBe(t.surfaceCard);
        expect(inverted.color).toBe(t.fg);
        expect(inverted.borderColor).toBe(t.borderEmphasis);
      }
    });

    it("primary, danger, and the brand accents pair with their theme on-accent foreground", () => {
      // Accent fills are always paired with the theme's documented on-accent
      // label colour so contrast stays legible against the saturated
      // background. Pinning via the theme bag (rather than a hard-coded
      // `#ffffff`) means a future palette swap that retones the on-accent
      // tokens flows through here automatically.
      for (const scheme of bothSchemes) {
        const t = resolveTheme(scheme, "gazette");
        expect(resolveButtonSurface("primary", t).color).toBe(t.onPrimary);
        expect(resolveButtonSurface("danger", t).color).toBe(t.onDanger);
      }
    });
  });
});
