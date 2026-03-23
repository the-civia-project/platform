/**
 * Multi-line themed text input -- the kit's text-area sibling to
 * {@link "./TextInput".TextInput}. Composes the same label / helper /
 * error chrome through {@link "./surface".inputChromeStyles} so the
 * single-line and multi-line surfaces feel identical except where they
 * have to differ: the inner native input is `multiline`, the field
 * **auto-grows** with content from {@link TextAreaProps.minRows} up to
 * {@link TextAreaProps.maxRows} (then scrolls inside the pill), and the
 * caret aligns to the top of the field on every platform so a
 * partially-filled area doesn't centre its content vertically.
 *
 * Auto-grow is driven by React Native's `onContentSizeChange` event:
 * every keystroke (and every external `value` change) re-measures the
 * natural content height and the field clamps that into the
 * `[minRows, maxRows]` range. Falling back on `minHeight` / `maxHeight`
 * alone -- which is what the kit shipped first -- leaves RN sizing the
 * field at the wider of the two bounds on iOS / Android, so the area
 * either starts too tall or never grows; the explicit `height` style
 * driven by the measured size is the canonical fix.
 *
 * Reach for {@link "./TextArea".TextArea} whenever the value is prose
 * that wraps across lines: post composer bodies, bios, comments, long
 * description fields. The `type` preset catalogue from
 * {@link "./TextInput".TextInput} is intentionally absent here -- a
 * multi-line phone or email field is incoherent, so the surface drops
 * those options rather than offering them and rejecting them.
 */
import { useState } from "react";
import {
  StyleSheet,
  TextInput as RNTextInput,
  Text as RNText,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import {
  inputChromeStyles,
  resolveInputBorderColor,
  useInputSurface,
} from "./surface";

/**
 * Public surface for {@link TextArea}.
 *
 * Mirrors the chrome subset of {@link "./TextInput".TextInputProps}
 * (label / helper / error / disabled / accessibility / focus
 * forwarding) and adds the two row-height knobs that turn the field
 * into a multi-line surface.
 */
export type TextAreaProps = {
  /**
   * Current value. The area is **controlled** -- the parent owns the
   * string and updates it via {@link onChangeText}. Pass an empty string
   * to render the placeholder.
   */
  value: string;
  /**
   * Called with the new value on every keystroke. Use to drive the
   * parent's state; the area does not buffer internally.
   */
  onChangeText: (text: string) => void;
  /**
   * Ghosted text shown when {@link value} is empty. Doubles as the
   * accessibility name when neither {@link label} nor
   * {@link accessibilityLabel} is provided, so write it as a useful name
   * ("Body", "Bio") rather than a long sentence.
   */
  placeholder?: string;
  /**
   * Optional headline rendered above the field. Acts as the visible name
   * of the area and as the default {@link accessibilityLabel}.
   */
  label?: string;
  /**
   * Optional supporting line under the field -- the **proactive** half of
   * feedback (format hints, character-count nudges, context). Hidden when
   * {@link error} is set so the error reads cleanly.
   */
  helper?: string;
  /**
   * Validation error message. Truthy = error mode: the string itself is
   * the message rendered in place of {@link helper}, and the field's
   * border swaps to the kit's danger colour for as long as the prop is
   * set (regardless of focus). Pass `undefined` or `""` when the value
   * is valid.
   */
  error?: string;
  /**
   * Disables interaction and dims the entire field (chrome, label,
   * helper). Forwarded to the native input as `editable={false}` so taps
   * don't summon the keyboard.
   * @defaultValue false
   */
  disabled?: boolean;
  /**
   * Minimum number of rows the field shows when empty. Acts as the
   * lower bound of the auto-grow range -- the area never shrinks below
   * this many rows regardless of how short the value is. Pair with
   * {@link maxRows} to bound the growth ceiling.
   * @defaultValue 3
   */
  minRows?: number;
  /**
   * Maximum number of rows the field grows to before content starts to
   * scroll inside the pill. Acts as the upper bound of the auto-grow
   * range; passing `undefined` lets the area grow without bound (rarely
   * what you want -- the surrounding screen will struggle to lay out an
   * unbounded text block).
   * @defaultValue 8
   */
  maxRows?: number;
  /** Hard cap on the number of characters the user can type. */
  maxLength?: number;
  /**
   * Focuses the field as soon as it mounts. Use sparingly -- only when
   * the area is unambiguously the screen's primary affordance (a
   * full-page composer, a single-field modal). Avoid in long forms;
   * multiple `autoFocus`es race.
   * @defaultValue false
   */
  autoFocus?: boolean;
  /** Called when the field gains focus. */
  onFocus?: () => void;
  /** Called when the field loses focus. */
  onBlur?: () => void;
  /**
   * Overrides the auto-derived accessibility name. Falls back to
   * {@link label} → {@link placeholder} when omitted.
   */
  accessibilityLabel?: string;
  /**
   * Optional hint read by screen readers after the label. Use for
   * disambiguation that doesn't belong in the visible {@link helper}.
   */
  accessibilityHint?: string;
};

/**
 * Approximate height of one row of input text at the kit's
 * `fontSize: 16` + `lineHeight: 22` ramp. Used to derive `minHeight` and
 * `maxHeight` from {@link TextAreaProps.minRows} / `maxRows` so callers
 * size the field in rows rather than raw pixels.
 */
const ROW_HEIGHT_PX = 22;

/**
 * Multi-line themed text field. See {@link TextAreaProps} for the full
 * surface.
 *
 * @param props - {@link TextAreaProps}
 */
export function TextArea({
  value,
  onChangeText,
  placeholder,
  label,
  helper,
  error,
  disabled = false,
  minRows = 3,
  maxRows = 8,
  maxLength,
  autoFocus,
  onFocus,
  onBlur,
  accessibilityLabel,
  accessibilityHint,
}: TextAreaProps) {
  const surface = useInputSurface();
  const [focused, setFocused] = useState(false);

  const isError = Boolean(error);
  const borderColor = resolveInputBorderColor(surface, { focused, isError });

  // Row-driven height range. Reserve vertical padding on top of the
  // row-derived height so the first / last rows breathe inside the
  // pill -- otherwise the row count translates to a tight visual
  // height that crops descenders.
  const verticalPadding = 12 * 2;
  const minHeight = minRows * ROW_HEIGHT_PX + verticalPadding;
  const maxHeight =
    maxRows !== undefined
      ? maxRows * ROW_HEIGHT_PX + verticalPadding
      : undefined;

  // Measured natural content height. Seeds at `minHeight` so the field
  // paints at the right size on first render before the first
  // `onContentSizeChange` fires (the event lags one layout pass behind
  // mount on iOS, and not at all on web until the first user input).
  const [contentHeight, setContentHeight] = useState(minHeight);
  const resolvedHeight =
    maxHeight !== undefined
      ? Math.min(maxHeight, Math.max(minHeight, contentHeight))
      : Math.max(minHeight, contentHeight);

  const handleContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => {
    // RN's reported `contentSize.height` already includes the inner
    // `paddingVertical`, so it can be compared directly against
    // `minHeight` / `maxHeight` (which are computed in the same scale)
    // without an extra padding adjustment.
    setContentHeight(event.nativeEvent.contentSize.height);
  };

  return (
    <View
      style={[inputChromeStyles.wrap, disabled && inputChromeStyles.disabled]}
    >
      {label ? (
        <RNText
          style={[inputChromeStyles.label, { color: surface.foreground }]}
        >
          {label}
        </RNText>
      ) : null}
      <View
        style={[
          inputChromeStyles.field,
          { backgroundColor: surface.background, borderColor },
        ]}
      >
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          onContentSizeChange={handleContentSizeChange}
          placeholder={placeholder}
          placeholderTextColor={surface.placeholder}
          editable={!disabled}
          multiline
          // iOS centres multiline content vertically by default, which
          // reads as broken when the area is partially filled. Pinning
          // the alignment to "top" matches Android's native behaviour
          // and gives the caret a predictable home regardless of how
          // many rows are filled.
          textAlignVertical="top"
          style={[
            styles.input,
            webFocusOutlineStyle(),
            { color: surface.foreground, height: resolvedHeight },
          ]}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          autoCapitalize="sentences"
          autoCorrect
          autoFocus={autoFocus}
          maxLength={maxLength}
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          accessibilityHint={accessibilityHint}
          aria-invalid={isError}
        />
      </View>
      {isError ? (
        <RNText
          style={[inputChromeStyles.helper, { color: surface.error }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </RNText>
      ) : helper ? (
        <RNText
          style={[inputChromeStyles.helper, { color: surface.helper }]}
        >
          {helper}
        </RNText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Inner native input. Padding lives here (not on the shared `field`
   * chrome) so taps anywhere inside the pill focus the area. `fontSize`
   * and `lineHeight` define the per-row metrics used to compute the
   * row-driven `minHeight` / `maxHeight` from the caller's
   * {@link TextAreaProps.minRows} / `maxRows`.
   */
  input: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
