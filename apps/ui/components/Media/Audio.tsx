/**
 * Mock audio post primitive: a hairline-bordered pill with a primary play
 * button on the left, a static waveform of vertical bars in the middle,
 * and an optional duration label on the right. **Does not actually play
 * audio** -- this is a stand-in for the eventual voice-note surface so the
 * rest of the post composition (header, body, embed inset, footer) can
 * be exercised against an audio-shaped {@link "../Post".PostMedia} while
 * the playback story is still being designed.
 *
 * The waveform is purely decorative: a fixed set of vertical bars at
 * deterministic heights derived from the audio's {@link AudioData.source}
 * URL, so the same audio always renders the same shape across reloads.
 * Pass {@link AudioData.peaks} to override the mock with real peak
 * amplitudes (the output of a server-side waveform analysis, etc.); each
 * value is clamped to `[0, 1]`.
 *
 * When real playback lands, this file will grow a controlled
 * `playing` / `progress` pair and the play button's icon will toggle
 * between {@link Play} and {@link Pause} as the audio runs. The outer
 * dimensions match the eventual final shape so swapping in the live
 * version won't shift the surrounding post layout.
 *
 * @example
 * ```tsx
 * <Audio
 *   source="https://example.com/audio/voice-note.mp3"
 *   alt="Voice note: thoughts on the morning commute"
 *   durationSeconds={32}
 *   onPress={() => console.log("Play audio")}
 * />
 * ```
 */
import { Play } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import { IconButton } from "../Button";
import { useTheme } from "../use-theme";

/**
 * Tile-data shape -- the half of {@link AudioProps} that describes the
 * audio itself. Carved out as a named type so consumers that *store*
 * audio attachments (drafts, feed rows, future audio playlists) can
 * type their records with a single shape and pair each record with its
 * own press handler at render time rather than baking the handler
 * into storage.
 */
export type AudioData = {
  /**
   * Remote audio URL. Not actually fetched / played by the mock -- it's
   * used as a deterministic seed for the placeholder waveform (so the
   * same audio always shows the same bars) and is the value the
   * eventual real-playback wiring will hand to its audio engine.
   */
  source: string;
  /**
   * Screen-reader description of the audio's content. Required so the
   * kit's accessibility contract is enforced at the type level -- an
   * audio attachment with no label is invisible to assistive tech,
   * and a media-only post can't lean on body copy to compensate when
   * there isn't any. Doubles as the play button's `accessibilityLabel`
   * (the button announces as "Play <alt>").
   */
  alt: string;
  /**
   * Optional duration in seconds. When set, rendered as `m:ss` on the
   * right edge of the pill (`32` -> `"0:32"`, `90` -> `"1:30"`).
   * Hidden when omitted -- the right edge collapses cleanly.
   */
  durationSeconds?: number;
  /**
   * Optional pre-computed waveform peaks normalised to `[0, 1]` (each
   * entry is the relative amplitude of one slice of the audio). When
   * provided, the component renders one bar per entry. When omitted,
   * a deterministic mock waveform of {@link WAVEFORM_BAR_COUNT} bars
   * is generated from {@link AudioData.source}.
   *
   * Values outside `[0, 1]` are clamped so a caller passing raw
   * amplitudes (which might overshoot `1`) gets a graceful render
   * rather than a bar that overflows the pill.
   */
  peaks?: number[];
};

/**
 * Public props for {@link Audio}.
 */
export type AudioProps = AudioData & {
  /**
   * Optional press handler. Wired to the play button -- press fires
   * this callback (typical use: start playback in your audio engine).
   * When omitted, the play button still renders but is inert. The
   * surrounding pill is not pressable on its own; only the play
   * button carries the tap target so the rest of the bar stays
   * "passive metadata" the way the surrounding kit conventions
   * (`LinkPreview`, `Image`) treat their non-action areas.
   */
  onPress?: () => void;
};

/**
 * Default number of waveform bars rendered when the caller doesn't
 * supply {@link AudioData.peaks}. 48 bars at 2px wide with 2px gaps
 * lands at ~192px of waveform width -- comfortable inside a post
 * body at typical phone widths without crowding the play button or
 * the duration label.
 */
const WAVEFORM_BAR_COUNT = 48;
/** Bar height ceiling in logical pixels. The pill's inner content area is `WAVEFORM_HEIGHT` tall. */
const WAVEFORM_HEIGHT = 32;
/** Minimum bar height so even near-silent slices stay visible as a hairline. */
const MIN_BAR_HEIGHT = 3;

/**
 * Renders the mock audio pill described in the file header.
 *
 * @param props - {@link AudioProps}
 */
export function Audio({
  source,
  alt,
  durationSeconds,
  peaks,
  onPress,
}: AudioProps) {
  const theme = useTheme();
  const resolvedPeaks = useMemo(
    () => peaks ?? generateMockPeaks(source, WAVEFORM_BAR_COUNT),
    [peaks, source],
  );

  return (
    <View
      style={[styles.container, { borderColor: theme.borderDefault }]}
      accessibilityLabel={alt}
    >
      <IconButton
        icon={Play}
        size="md"
        variant="primary"
        shape="round"
        onPress={onPress}
        accessibilityLabel={`Play ${alt}`}
      />
      <View
        style={styles.waveform}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {resolvedPeaks.map((peak, index) => {
          const clamped = Math.max(0, Math.min(1, peak));
          const height = Math.max(
            MIN_BAR_HEIGHT,
            Math.round(clamped * WAVEFORM_HEIGHT),
          );
          return (
            <View
              key={index}
              style={[styles.bar, { height, backgroundColor: theme.fgMuted }]}
            />
          );
        })}
      </View>
      {durationSeconds !== undefined ? (
        <RNText
          style={[styles.duration, { color: theme.fgMuted }]}
          numberOfLines={1}
        >
          {formatDuration(durationSeconds)}
        </RNText>
      ) : null}
    </View>
  );
}

export default Audio;

/**
 * Deterministic FNV-1a-flavoured hash over `seed`, seeded by `salt` so
 * the same seed produces a different output for each bar index. Pure --
 * no React, no platform APIs -- so the mock waveform is stable across
 * renders, reloads, and platforms (a given audio URL always paints the
 * same bars).
 */
function hashStringToUnit(seed: string, salt: number): number {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 1000) / 1000;
}

/**
 * Builds `count` mock waveform peaks in `[0.2, 1.0]` from `seed`. The
 * floor at `0.2` keeps every bar visibly above the minimum height so
 * the waveform reads as a continuous shape rather than a sparse row
 * of tall spikes over near-zero dips.
 */
function generateMockPeaks(seed: string, count: number): number[] {
  return Array.from({ length: count }, (_, i) => 0.2 + 0.8 * hashStringToUnit(seed, i));
}

/**
 * Formats `seconds` as `m:ss`. Negative inputs floor to `0:00`; values
 * past an hour fall through to `M:ss` (e.g. `3600` -> `"60:00"`) on
 * purpose -- the audio pill is sized for voice notes, not full
 * podcasts, so the simpler format is right for every realistic input.
 */
function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  /**
   * Hairline-bordered pill. Matches {@link "./LinkPreview".LinkPreview}'s
   * outline (same `borderRadius: 16` + hairline border) so a feed mixing
   * the two embed shapes reads with a consistent surface vocabulary.
   * Padding is tighter than `LinkPreview`'s thumbnail-bearing card
   * because the pill is one row (button + waveform + duration), not a
   * three-row stack.
   */
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  /**
   * Waveform slot: takes whatever width is left after the play button
   * and (optional) duration label. `alignItems: "center"` centres each
   * bar vertically inside the {@link WAVEFORM_HEIGHT}-tall row so
   * shorter bars float in the middle rather than sitting on the
   * baseline -- the standard waveform visualisation pattern.
   */
  waveform: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: WAVEFORM_HEIGHT,
  },
  /**
   * Per-bar geometry. `width: 2` + `borderRadius: 1` reads as a thin
   * rounded stick; the height is painted inline per bar from the
   * resolved peak so each bar can speak its own amplitude.
   */
  bar: {
    width: 2,
    borderRadius: 1,
  },
  /**
   * `m:ss` duration label pinned to the right edge of the pill.
   * `tabularNums` keeps consecutive digits the same width so the label
   * doesn't shimmer between values when (eventually) animated against
   * a live playback timer.
   */
  duration: {
    fontSize: 13,
    lineHeight: 16,
    fontVariant: ["tabular-nums"],
    marginRight: 4,
  },
});
