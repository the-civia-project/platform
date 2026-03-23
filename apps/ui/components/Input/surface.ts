/**
 * Shared chrome surface for the kit's text-entry primitives -- the
 * variant-style sibling that {@link "./TextInput".TextInput} and
 * {@link "./TextArea".TextArea} both consume so the label / field / helper
 * stack reads identically across the family (a re-tune of the focus
 * border, the helper colour, or the disabled opacity lands everywhere in
 * one change). Mirrors {@link "../Button/surface".useButtonSurface}: a
 * single hook resolves the theme-aware palette and a single
 * {@link inputChromeStyles} StyleSheet carries the layout that doesn't
 * vary between siblings.
 *
 * The per-sibling differences (single-line vs multi-line `input` styling,
 * the `type` preset on `TextInput`) stay inside each component file. This
 * module only owns the *shared* surface.
 */
import { StyleSheet } from "react-native";
import { useTheme } from "../use-theme";

/**
 * Resolved colour palette returned by {@link useInputSurface}. Every
 * field in the family pulls its tints from this record so a future
 * palette retune lands in one place. The hex tokens themselves still
 * come from {@link "../theme".useTheme}; this type is the contract the
 * components see.
 */
export type InputSurface = {
  /**
   * Fill behind the native input. Pulled from {@link Theme.surfaceInput}
   * so the field affordance reads clearly even when not focused.
   */
  background: string;
  /** Foreground for the typed value and the label text. */
  foreground: string;
  /**
   * Ghosted-text colour for the field's placeholder. Same neutral the
   * helper / muted-foreground tokens use elsewhere in the kit.
   */
  placeholder: string;
  /** Hairline border drawn when the field is idle (not focused, no error). */
  borderIdle: string;
  /**
   * Border drawn while the field is focused. Painted on top of
   * {@link InputSurface.borderIdle} via a colour swap (not a width
   * change) so the focus cue introduces zero layout movement.
   */
  borderFocus: string;
  /** Helper-line text colour. */
  helper: string;
  /**
   * Border + helper-line colour for the error state. Wins over both
   * {@link InputSurface.borderIdle} and {@link InputSurface.borderFocus}
   * for as long as the consumer's `error` prop is set.
   */
  error: string;
};

/**
 * Pure resolution helper used by both inputs in the family. The border
 * precedence is `error > focused > idle` -- the error colour ignores
 * focus entirely so the user sees the same red pill while they're
 * fixing the value, rather than the border bouncing red/black on every
 * focus/blur.
 *
 * Exposed as a standalone function so tests and the inputs themselves
 * can rely on the same resolution rule.
 */
export function resolveInputBorderColor(
  surface: InputSurface,
  state: { focused: boolean; isError: boolean },
): string {
  if (state.isError) return surface.error;
  if (state.focused) return surface.borderFocus;
  return surface.borderIdle;
}

/**
 * Reads the active theme and returns the resolved input palette. Memoised
 * indirectly via {@link useTheme} so it doesn't allocate a new object on
 * every render unless the underlying theme reference changes (e.g. OS or flavour switch).
 */
export function useInputSurface(): InputSurface {
  const theme = useTheme();
  return {
    background: theme.surfaceInput,
    foreground: theme.fgEmphasis,
    placeholder: theme.fgMuted,
    borderIdle: theme.borderSubtle,
    borderFocus: theme.fgEmphasis,
    helper: theme.fgMuted,
    error: theme.danger,
  };
}

/**
 * Shared layout styles for the input family. `wrap`, `disabled`,
 * `label`, `field`, and `helper` are identical across
 * {@link "./TextInput".TextInput} and {@link "./TextArea".TextArea}; the
 * per-sibling `input` style stays inside each component file because
 * single-line and multi-line inputs want different padding and height
 * rules.
 */
export const inputChromeStyles = StyleSheet.create({
  /**
   * Vertical stack for the three slots: label | field | helper. `gap: 6`
   * keeps each row visually close enough that the trio reads as a single
   * input rather than three independent texts.
   */
  wrap: {
    flexDirection: "column",
    gap: 6,
    width: "100%",
  },
  /**
   * Disabled overlay applied to the whole wrap (chrome, label, helper). A
   * single opacity layer is simpler than recolouring each piece and stays
   * consistent with how {@link "../Button".Button} handles its own
   * disabled state.
   */
  disabled: {
    opacity: 0.5,
  },
  /**
   * The visible field name. Slightly muted weight-wise compared to body
   * text so it reads as metadata, not as a heading.
   */
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  /**
   * Outer chrome of the input. Owns the fill, border, and corner radius;
   * the inner native input owns padding so its hit area covers the full
   * pill.
   */
  field: {
    borderWidth: 1,
    borderRadius: 10,
  },
  /**
   * Supporting line under the field -- shared by both the helper and the
   * error message. Colour is injected inline (muted neutral for helper,
   * danger red for error) so the same row geometry serves both states
   * and the swap reads as a clean colour change, not a layout change.
   */
  helper: {
    fontSize: 13,
  },
});
