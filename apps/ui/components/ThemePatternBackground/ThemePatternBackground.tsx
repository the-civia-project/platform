/**
 * Flavor-specific repeating SVG texture for the app shell: a seamless `Pattern` tile
 * tinted from the active {@link ../theme}.`Theme` so light/dark and palette switches
 * stay coherent. Mount as an absolute-fill layer under navigation (`pointerEvents` off).
 *
 * Motifs (see {@link ../theme}.`ThemeFlavor`):
 * - **gazette** — column rules + baseline grid, editorial newsprint.
 * - **matrix** — static code-rain columns + spine lines that bridge segment and tile-row gaps.
 * - **pulse** — layered pulses: ECG, ripple arcs, **radial ring waves**, square wave, spoke burst.
 * - **ember** — soft heat waves + ember dots, sunset glow.
 * - **default** — halftone dot grid + registration ticks, photographic B&W.
 */
import { useId, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  Pattern,
  Rect,
} from "react-native-svg";
import type { ColorScheme, Theme, ThemeFlavor } from "../theme";
import { useResolvedColorScheme, useTheme, useThemeFlavor } from "../use-theme";
import { hexToRgba } from "./hex-to-rgba";

/**
 * Ink stops derived from {@link Theme} for one pattern layer.
 */
export type PatternInk = {
  /**
   * Grid / strokes / structure — typically `borderSubtle` at low alpha.
   */
  structure: string;
  /**
   * Accent whisper — typically `primary` at lower alpha.
   */
  accent: string;
};

/**
 * Props for {@link ThemePatternBackground}.
 */
export type ThemePatternBackgroundProps = {
  /**
   * Fixed width for the SVG viewBox (e.g. UI Kit thumbnail). When omitted, uses
   * {@link useWindowDimensions} width.
   */
  width?: number;
  /**
   * Fixed height for the SVG viewBox. When omitted, uses window height.
   */
  height?: number;
};

const TILE: Record<ThemeFlavor, { w: number; h: number }> = {
  gazette: { w: 64, h: 64 },
  matrix: { w: 48, h: 48 },
  pulse: { w: 64, h: 64 },
  ember: { w: 64, h: 64 },
  default: { w: 64, h: 64 },
};

function resolveInk(theme: Theme, flavor: ThemeFlavor): PatternInk {
  const structureA =
    flavor === "matrix" ? 0.065 : flavor === "ember" ? 0.052 : 0.048;
  const accentA =
    flavor === "matrix" ? 0.042 : flavor === "ember" ? 0.036 : 0.03;
  return {
    structure: hexToRgba(theme.borderSubtle, structureA),
    accent: hexToRgba(theme.primary, accentA),
  };
}

function GazetteTile({ ink }: { ink: PatternInk }) {
  return (
    <>
      {/* Column rules */}
      <Line
        x1={20}
        y1={0}
        x2={20}
        y2={64}
        stroke={ink.structure}
        strokeWidth={0.75}
      />
      <Line
        x1={44}
        y1={0}
        x2={44}
        y2={64}
        stroke={ink.structure}
        strokeWidth={0.75}
      />
      {/* Baseline grid — include y=0 so the tile repeats every 64px */}
      <Line
        x1={0}
        y1={0}
        x2={64}
        y2={0}
        stroke={ink.structure}
        strokeWidth={0.4}
      />
      <Line
        x1={0}
        y1={16}
        x2={64}
        y2={16}
        stroke={ink.structure}
        strokeWidth={0.4}
      />
      <Line
        x1={0}
        y1={32}
        x2={64}
        y2={32}
        stroke={ink.structure}
        strokeWidth={0.4}
      />
      <Line
        x1={0}
        y1={48}
        x2={64}
        y2={48}
        stroke={ink.structure}
        strokeWidth={0.4}
      />
      {/* Registration corners (L ticks) */}
      <Path
        d="M 2 8 L 2 2 L 8 2"
        stroke={ink.accent}
        strokeWidth={0.85}
        fill="none"
      />
      <Path
        d="M 56 2 L 62 2 L 62 8"
        stroke={ink.accent}
        strokeWidth={0.85}
        fill="none"
      />
      <Path
        d="M 62 56 L 62 62 L 56 62"
        stroke={ink.accent}
        strokeWidth={0.85}
        fill="none"
      />
      <Path
        d="M 8 62 L 2 62 L 2 56"
        stroke={ink.accent}
        strokeWidth={0.85}
        fill="none"
      />
    </>
  );
}

function MatrixTile({ ink }: { ink: PatternInk }) {
  return (
    <>
      {/*
        Static digital-rain: vertical stacks of segments. Thin column spines + tails
        that reach the tile edge bridge gaps between segments and between stacked tile rows.
      */}
      <Line
        x1={0}
        y1={0}
        x2={48}
        y2={0}
        stroke={ink.structure}
        strokeWidth={0.4}
      />
      <Line
        x1={0}
        y1={48}
        x2={48}
        y2={48}
        stroke={ink.structure}
        strokeWidth={0.4}
      />
      {/* Column spines — tie segment gaps into continuous strands */}
      <Line x1={4} y1={0} x2={4} y2={48} stroke={ink.structure} strokeWidth={0.3} />
      <Line x1={11} y1={0} x2={11} y2={48} stroke={ink.structure} strokeWidth={0.3} />
      <Line x1={18} y1={0} x2={18} y2={48} stroke={ink.structure} strokeWidth={0.3} />
      <Line x1={25} y1={0} x2={25} y2={48} stroke={ink.structure} strokeWidth={0.3} />
      <Line x1={32} y1={0} x2={32} y2={48} stroke={ink.structure} strokeWidth={0.3} />
      <Line x1={39} y1={0} x2={39} y2={48} stroke={ink.structure} strokeWidth={0.3} />
      <Line x1={44} y1={2} x2={44} y2={46} stroke={ink.structure} strokeWidth={0.3} />
      {/* Column A */}
      <Rect x={3} y={5} width={2} height={4} fill={ink.accent} />
      <Rect x={3} y={11} width={2} height={8} fill={ink.structure} />
      <Rect x={3} y={22} width={2} height={3} fill={ink.accent} />
      <Rect x={3} y={28} width={2} height={6} fill={ink.structure} />
      <Rect x={3} y={37} width={2} height={10} fill={ink.accent} />
      {/* Column B */}
      <Rect x={10} y={2} width={2} height={6} fill={ink.structure} />
      <Rect x={10} y={11} width={2} height={5} fill={ink.accent} />
      <Rect x={10} y={19} width={2} height={9} fill={ink.structure} />
      <Rect x={10} y={31} width={2} height={15} fill={ink.structure} />
      {/* Column C */}
      <Rect x={17} y={7} width={2} height={3} fill={ink.structure} />
      <Rect x={17} y={12} width={2} height={7} fill={ink.accent} />
      <Rect x={17} y={22} width={2} height={2} fill={ink.structure} />
      <Rect x={17} y={27} width={2} height={14} fill={ink.structure} />
      <Circle cx={18} cy={41} r={1} fill={ink.accent} />
      {/* Column D */}
      <Rect x={24} y={4} width={2} height={5} fill={ink.accent} />
      <Rect x={24} y={12} width={2} height={4} fill={ink.structure} />
      <Rect x={24} y={19} width={2} height={14} fill={ink.accent} />
      <Rect x={24} y={36} width={2} height={11} fill={ink.structure} />
      {/* Column E */}
      <Rect x={31} y={6} width={2} height={10} fill={ink.structure} />
      <Rect x={31} y={19} width={2} height={3} fill={ink.accent} />
      <Rect x={31} y={25} width={2} height={7} fill={ink.structure} />
      <Rect x={31} y={35} width={2} height={12} fill={ink.accent} />
      {/* Column F */}
      <Rect x={38} y={3} width={2} height={7} fill={ink.accent} />
      <Rect x={38} y={13} width={2} height={5} fill={ink.structure} />
      <Rect x={38} y={21} width={2} height={4} fill={ink.accent} />
      <Rect x={38} y={28} width={2} height={19} fill={ink.structure} />
      {/* Angular “glyph” crumbs */}
      <Path
        d="M 44 8 h 3 v 2 h -2 v 3"
        stroke={ink.accent}
        strokeWidth={0.9}
        fill="none"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <Path
        d="M 42 26 h 4 v -3"
        stroke={ink.structure}
        strokeWidth={0.75}
        fill="none"
        strokeLinecap="square"
      />
      <Rect x={43} y={34} width={2} height={5} fill={ink.structure} />
      <Rect x={43} y={42} width={2} height={6} fill={ink.accent} />
    </>
  );
}

function PulseTile({ ink }: { ink: PatternInk }) {
  return (
    <>
      {/*
        Combined static “pulses”: (1) primary heartbeat, (2) secondary beat, (3) ripple arcs,
        (4) full radial ring waves, (5) square wave, (6) radial tick burst — ambient weight only.
      */}
      {/* (1) Main ECG — continuous across the tile seam at y≈32 */}
      <Path
        d="M 0 32 H 15 L 18 22 L 26 42 L 34 26 L 42 32 H 64"
        stroke={ink.accent}
        strokeWidth={1.05}
        fill="none"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* (2) Secondary / smaller amplitude beat — different phase & period feel */}
      <Path
        d="M 0 14 H 26 L 28 9 L 31 17 L 34 7 L 37 14 H 64"
        stroke={ink.structure}
        strokeWidth={0.6}
        fill="none"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* (3) Ripple arcs — sonar / drop-in-water read */}
      <Path
        d="M 48 20 A 8 8 0 0 1 56 12"
        stroke={ink.structure}
        strokeWidth={0.7}
        fill="none"
      />
      <Path
        d="M 44 22 A 12 12 0 0 1 56 10"
        stroke={ink.accent}
        strokeWidth={0.55}
        fill="none"
      />
      <Path
        d="M 52 26 A 4 4 0 0 0 56 22"
        stroke={ink.structure}
        strokeWidth={0.5}
        fill="none"
      />
      {/* (4) Radial ring pulses — 360° wavefronts from a second epicenter */}
      <Circle
        cx={16}
        cy={21}
        r={3.25}
        stroke={ink.accent}
        strokeWidth={0.55}
        fill="none"
      />
      <Circle
        cx={16}
        cy={21}
        r={6.5}
        stroke={ink.structure}
        strokeWidth={0.5}
        fill="none"
      />
      <Circle
        cx={16}
        cy={21}
        r={10}
        stroke={ink.accent}
        strokeWidth={0.4}
        fill="none"
      />
      <Circle
        cx={16}
        cy={21}
        r={13.5}
        stroke={ink.structure}
        strokeWidth={0.38}
        fill="none"
      />
      {/* Tighter radial train — mid-right, clear of ECG belt + bottom square wave */}
      <Circle
        cx={50}
        cy={38}
        r={2.2}
        stroke={ink.structure}
        strokeWidth={0.5}
        fill="none"
      />
      <Circle
        cx={50}
        cy={38}
        r={4.8}
        stroke={ink.accent}
        strokeWidth={0.45}
        fill="none"
      />
      <Circle
        cx={50}
        cy={38}
        r={7.5}
        stroke={ink.structure}
        strokeWidth={0.4}
        fill="none"
      />
      {/* (5) Square wave — clock / logic pulse */}
      <Path
        d="M 2 52 h 5 v -4 h 5 v 4 h 5 v -7 h 5 v 7 h 5 v -3 h 5 v 3 h 5 v -5 h 5 v 5 h 4"
        stroke={ink.accent}
        strokeWidth={0.65}
        fill="none"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* (6) Radial tick burst */}
      <Line
        x1={28}
        y1={54}
        x2={28}
        y2={48}
        stroke={ink.structure}
        strokeWidth={0.55}
      />
      <Line
        x1={28}
        y1={54}
        x2={32}
        y2={50.5}
        stroke={ink.structure}
        strokeWidth={0.55}
      />
      <Line
        x1={28}
        y1={54}
        x2={24}
        y2={50.5}
        stroke={ink.structure}
        strokeWidth={0.55}
      />
      <Line
        x1={28}
        y1={54}
        x2={33}
        y2={53}
        stroke={ink.accent}
        strokeWidth={0.5}
      />
      <Line
        x1={28}
        y1={54}
        x2={23}
        y2={53}
        stroke={ink.accent}
        strokeWidth={0.5}
      />
      {/* Samples / nodes */}
      <Circle cx={10} cy={58} r={1.1} fill={ink.structure} />
      <Circle cx={54} cy={46} r={1.15} fill={ink.accent} />
      <Circle cx={8} cy={26} r={0.9} fill={ink.accent} />
    </>
  );
}

function DefaultTile({ ink }: { ink: PatternInk }) {
  const dots: Array<{ cx: number; cy: number; r: number }> = [
    { cx: 8, cy: 8, r: 1.1 },
    { cx: 24, cy: 8, r: 0.85 },
    { cx: 40, cy: 8, r: 1.2 },
    { cx: 56, cy: 8, r: 0.9 },
    { cx: 16, cy: 24, r: 0.95 },
    { cx: 32, cy: 24, r: 1.15 },
    { cx: 48, cy: 24, r: 0.8 },
    { cx: 8, cy: 40, r: 0.9 },
    { cx: 24, cy: 40, r: 1.05 },
    { cx: 40, cy: 40, r: 0.75 },
    { cx: 56, cy: 40, r: 1.1 },
    { cx: 16, cy: 56, r: 1.0 },
    { cx: 32, cy: 56, r: 0.85 },
    { cx: 48, cy: 56, r: 1.25 },
  ];

  return (
    <>
      {/* Halftone field — staggered dot grid */}
      {dots.map((d, i) => (
        <Circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill={i % 3 === 0 ? ink.accent : ink.structure}
        />
      ))}
      {/* Fine crosshair registration */}
      <Line
        x1={0}
        y1={32}
        x2={64}
        y2={32}
        stroke={ink.structure}
        strokeWidth={0.35}
      />
      <Line
        x1={32}
        y1={0}
        x2={32}
        y2={64}
        stroke={ink.structure}
        strokeWidth={0.35}
      />
      <Path
        d="M 4 4 L 4 12 M 4 4 L 12 4"
        stroke={ink.accent}
        strokeWidth={0.75}
        fill="none"
      />
      <Path
        d="M 60 4 L 60 12 M 60 4 L 52 4"
        stroke={ink.accent}
        strokeWidth={0.75}
        fill="none"
      />
    </>
  );
}

function EmberTile({ ink }: { ink: PatternInk }) {
  return (
    <>
      <Path
        d="M 0 42 C 14 36, 22 52, 32 44 S 50 28, 64 38"
        stroke={ink.structure}
        strokeWidth={0.9}
        fill="none"
      />
      <Path
        d="M 0 50 C 18 44, 26 58, 40 50 S 54 40, 64 48"
        stroke={ink.accent}
        strokeWidth={0.65}
        fill="none"
      />
      <Circle cx={14} cy={18} r={2} fill={ink.accent} />
      <Circle cx={48} cy={22} r={1.5} fill={ink.structure} />
      <Circle cx={30} cy={12} r={1.25} fill={ink.accent} />
      <Circle cx={52} cy={52} r={1.75} fill={ink.structure} />
    </>
  );
}

function PatternContent({
  flavor,
  ink,
}: {
  flavor: ThemeFlavor;
  ink: PatternInk;
}) {
  switch (flavor) {
    case "gazette":
      return <GazetteTile ink={ink} />;
    case "matrix":
      return <MatrixTile ink={ink} />;
    case "pulse":
      return <PulseTile ink={ink} />;
    case "ember":
      return <EmberTile ink={ink} />;
    case "default":
      return <DefaultTile ink={ink} />;
  }
}

/**
 * Full-bleed (or fixed-size) repeating texture driven by {@link useThemeFlavor} and
 * {@link useTheme}. Does not intercept touches.
 *
 * @param props - {@link ThemePatternBackgroundProps}
 */
export default function ThemePatternBackground({
  width: widthOverride,
  height: heightOverride,
}: ThemePatternBackgroundProps) {
  const theme = useTheme();
  const { flavor } = useThemeFlavor();
  const scheme = useResolvedColorScheme() as ColorScheme;
  const { width: winW, height: winH } = useWindowDimensions();
  const w = widthOverride ?? winW;
  const h = heightOverride ?? winH;
  const ink = useMemo(() => resolveInk(theme, flavor), [theme, flavor]);
  const tile = TILE[flavor];
  const rawId = useId();
  const patternId = useMemo(
    () =>
      `civiaTpb-${flavor}-${scheme}-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [flavor, scheme, rawId],
  );
  const fillUrl = `url(#${patternId})`;

  return (
    <View style={styles.fill} pointerEvents="none">
      <Svg width={w} height={h} style={styles.svg}>
        <Defs>
          <Pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width={tile.w}
            height={tile.h}
          >
            <PatternContent flavor={flavor} ink={ink} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={fillUrl} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  svg: {
    flex: 1,
  },
});
