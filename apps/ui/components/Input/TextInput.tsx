/**
 * Single-line, theme-aware text input -- the kit's baseline form primitive.
 *
 * Composes React Native's {@link RNTextInput} inside a chrome wrapper that owns
 * the border, fill, and corner radius (so the input itself stays a thin styling
 * shell) and adds the slots almost every real-world form needs:
 * a {@link TextInputProps.label} above the field, a {@link TextInputProps.helper}
 * line below it, and an {@link TextInputProps.error} message that swaps the
 * helper for validation feedback while painting the border in the kit's
 * danger colour. The field tracks its own focus state internally so the
 * border thickens to the theme foreground while the user is typing -- a
 * clear "this is where input lands" cue across both light and dark schemes
 * -- and then relaxes back to the idle hairline on blur (with the error
 * border overriding both states whenever an error is present). A {@link
 * TextInputProps.type} prop bundles the right native flag combo for common
 * field kinds (email, phone, URL, number, password, search), and each
 * underlying RN keyboard prop is forwarded as an explicit escape hatch so
 * the same primitive works everywhere from usernames to one-time codes.
 */
import { useState } from "react";
import {
  StyleSheet,
  TextInput as RNTextInput,
  Text as RNText,
  View,
} from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import {
  inputChromeStyles,
  resolveInputBorderColor,
  useInputSurface,
} from "./surface";

/**
 * Preset bundle that pre-configures the kit's {@link TextInput} for a common
 * kind of value (email, phone, URL, ...). Mirrors HTML's `<input type="...">`
 * convention so the call site reads as a single self-descriptive prop rather
 * than the four or five native flags an email/phone/URL field normally needs.
 *
 * - `text` *(default)* -- no preset. The underlying RN input keeps its default
 *   keyboard, capitalization, and correction. Use for free-form text where
 *   none of the typed presets fit (display names, comments, generic strings).
 * - `email` -- email-address keyboard (`@` and `.` keys promoted on iOS),
 *   no auto-capitalize, no auto-correct.
 * - `phone` -- numeric phone-pad keyboard, no auto-capitalize, no auto-correct.
 * - `url` -- URL keyboard (`.com` shortcut on iOS), no auto-capitalize, no
 *   auto-correct.
 * - `number` -- numeric keyboard. Use for PINs, OTPs, quantities, and other
 *   digit-only inputs.
 * - `password` -- masks the value as dots and disables suggestions. The kit
 *   doesn't ship a "show password" toggle yet -- pair with a {@link
 *   TextInputProps.helper} for the password rules.
 * - `search` -- text keyboard with the on-screen `Search` return key wired to
 *   {@link TextInputProps.onSubmitEditing}.
 */
export type TextInputType =
  | "text"
  | "email"
  | "phone"
  | "url"
  | "number"
  | "password"
  | "search";

/**
 * Internal: the subset of native props one {@link TextInputType} can preset.
 * Every field is optional -- a preset only declares the keys it cares about,
 * so `text` is `{}` and the others touch just the flags that meaningfully
 * differ from the OS default.
 */
type TextInputPreset = {
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  returnKeyType?: TextInputProps["returnKeyType"];
};

/**
 * Lookup table from {@link TextInputType} to the RN passthroughs the kit
 * applies when no explicit caller prop overrides them. Co-located with the
 * type union so adding a new preset is one literal change in one place.
 */
const TYPE_PRESETS: Record<TextInputType, TextInputPreset> = {
  text: {},
  email: {
    keyboardType: "email-address",
    autoCapitalize: "none",
    autoCorrect: false,
  },
  phone: {
    keyboardType: "phone-pad",
    autoCapitalize: "none",
    autoCorrect: false,
  },
  url: {
    keyboardType: "url",
    autoCapitalize: "none",
    autoCorrect: false,
  },
  number: {
    keyboardType: "numeric",
    autoCapitalize: "none",
    autoCorrect: false,
  },
  password: {
    autoCapitalize: "none",
    autoCorrect: false,
    secureTextEntry: true,
  },
  search: {
    autoCapitalize: "none",
    autoCorrect: false,
    returnKeyType: "search",
  },
};

/**
 * Public surface for {@link TextInput}.
 *
 * The shape is intentionally close to React Native's `TextInput` so familiarity
 * carries over; the additions are the visual chrome props ({@link label},
 * {@link helper}, {@link disabled}) that wrap the native input in a kit-styled
 * shell, plus a {@link type} preset that bundles the right native flags for
 * common field kinds (email, phone, URL, ...).
 */
export type TextInputProps = {
  /**
   * Current input value. The input is **controlled** -- the parent owns the
   * string and updates it via {@link onChangeText}. Pass an empty string to
   * render the placeholder.
   */
  value: string;
  /**
   * Called with the new value on every keystroke. Use to drive the parent's
   * state; the input does not buffer internally.
   */
  onChangeText: (text: string) => void;
  /**
   * Ghosted text shown when {@link value} is empty. Doubles as the
   * accessibility name when neither {@link label} nor
   * {@link accessibilityLabel} is provided, so write it as a useful name
   * ("Email address") rather than a long sentence.
   */
  placeholder?: string;
  /**
   * Optional headline rendered above the field. Acts as the visible name of
   * the input and as the default {@link accessibilityLabel}. Skip it for
   * single-purpose chrome inputs (e.g. a search row in a toolbar) where the
   * placeholder is enough.
   */
  label?: string;
  /**
   * Optional supporting line rendered under the field. Use for the
   * **proactive** half of feedback: format hints ("3-24 characters,
   * letters and numbers"), context ("Visible on your profile"), one-line
   * disclaimers. When {@link error} is set the helper is hidden so the
   * error reads cleanly -- pair the two so the field always carries either
   * the helper or the error, never both at once.
   */
  helper?: string;
  /**
   * Validation error message. Truthy = error mode: the string itself is the
   * message rendered in place of {@link helper}, and the field's border
   * swaps to the kit's danger colour for as long as the prop is set
   * (regardless of focus). Pass `undefined` or `""` when the value is
   * valid; the prop is the single source of truth for "this field is
   * wrong", so parents typically derive it from their own validation
   * pipeline and let it clear itself as the user types.
   *
   * No icon, no shake animation, no toast -- just the border colour and the
   * message swap. Keep error copy specific and actionable ("Email is
   * already in use" rather than "Invalid input").
   */
  error?: string;
  /**
   * Disables interaction and dims the entire field (chrome, label, helper).
   * Forwarded to the native input as `editable={false}` so taps don't
   * summon the keyboard.
   * @defaultValue false
   */
  disabled?: boolean;
  /**
   * Preset bundle for the kind of value this field collects. Resolves
   * sensible defaults for {@link keyboardType}, {@link autoCapitalize},
   * {@link autoCorrect}, {@link secureTextEntry}, and {@link returnKeyType}
   * -- so an email field is one prop, not four. Explicit caller props still
   * win; pass any of those native flags on top of `type` to override one
   * piece of the preset without losing the rest.
   *
   * See {@link TextInputType} for the catalogue.
   * @defaultValue "text"
   */
  type?: TextInputType;
  /**
   * Renders the value as masked dots and disables most keyboard suggestions.
   * Usually you'd reach for {@link type}=`"password"` instead, which also
   * sets the right capitalization/correct defaults; this prop stays as the
   * lower-level escape hatch for non-password fields you want masked (e.g.
   * a credit-card CVV).
   */
  secureTextEntry?: boolean;
  /**
   * Native auto-capitalization behaviour. Most form inputs want `"none"`
   * (emails, usernames, codes) or `"sentences"` (free-form prose).
   */
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /**
   * Keyboard variant requested from the OS. `"email-address"` for emails,
   * `"numeric"` for OTP / quantity, `"phone-pad"` for phone numbers,
   * `"url"` for URLs. Falls through to the OS default text keyboard when
   * omitted.
   */
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "url";
  /**
   * Toggles iOS auto-correct. Defaults to RN's default (on); pass `false`
   * for usernames, codes, addresses, and other tokens that shouldn't be
   * mangled.
   */
  autoCorrect?: boolean;
  /**
   * Focuses the field as soon as it mounts. Use sparingly -- only when the
   * input is unambiguously the page's primary affordance (search overlay,
   * single-field modal). Avoid in long forms; multiple `autoFocus`es race.
   * @defaultValue false
   */
  autoFocus?: boolean;
  /** Hard cap on the number of characters the user can type. */
  maxLength?: number;
  /**
   * Submit-key label on the keyboard. `"done"` for terminal fields,
   * `"next"` to chain through a form, `"search"` for search boxes,
   * `"send"` for message composers.
   */
  returnKeyType?: "default" | "done" | "go" | "next" | "search" | "send";
  /** Called when the user presses the keyboard's submit key. */
  onSubmitEditing?: () => void;
  /** Called when the field gains focus (after the internal focus state flips). */
  onFocus?: () => void;
  /** Called when the field loses focus (after the internal focus state flips). */
  onBlur?: () => void;
  /**
   * Overrides the auto-derived accessibility name. Falls back to
   * {@link label} → {@link placeholder} when omitted.
   */
  accessibilityLabel?: string;
  /**
   * Optional hint read by screen readers after the label. Use for
   * disambiguation that doesn't belong in the visible {@link helper}
   * (e.g. "Letters and numbers only").
   */
  accessibilityHint?: string;
};

/**
 * Single-line themed text field. See {@link TextInputProps} for the full surface.
 */
export function TextInput({
  value,
  onChangeText,
  placeholder,
  label,
  helper,
  error,
  disabled = false,
  type = "text",
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  autoCorrect,
  autoFocus,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  onFocus,
  onBlur,
  accessibilityLabel,
  accessibilityHint,
}: TextInputProps) {
  // Resolve the `type` preset and let explicit caller props win over it. The
  // nullish coalescer is important here -- for boolean flags (`autoCorrect`,
  // `secureTextEntry`), an explicit `false` is meaningful and must NOT fall
  // through to the preset. `??` handles that correctly where `||` would
  // mis-treat `false` as "absent".
  const preset = TYPE_PRESETS[type];
  const resolvedKeyboardType = keyboardType ?? preset.keyboardType;
  const resolvedAutoCapitalize = autoCapitalize ?? preset.autoCapitalize;
  const resolvedAutoCorrect = autoCorrect ?? preset.autoCorrect;
  const resolvedSecureTextEntry = secureTextEntry ?? preset.secureTextEntry;
  const resolvedReturnKeyType = returnKeyType ?? preset.returnKeyType;
  // Internal focus flag drives the border-thickening focus ring. We track it
  // here (rather than asking the parent to manage it) because the visual
  // treatment is the kit's, not the caller's -- every consumer wants the same
  // focus cue, and exposing a `focused` prop would just push that boilerplate
  // up. We still forward the underlying onFocus/onBlur so callers that *do*
  // need to react (e.g. for analytics, scroll-into-view) can.
  const [focused, setFocused] = useState(false);
  const surface = useInputSurface();

  // Treat any non-empty string as the error mode. Storing the boolean
  // separately makes the JSX below read top-to-bottom without repeating the
  // `Boolean(error)` check (and lets us swap the border before deciding
  // whether to render the helper or the error line).
  const isError = Boolean(error);
  const borderColor = resolveInputBorderColor(surface, { focused, isError });

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
          placeholder={placeholder}
          placeholderTextColor={surface.placeholder}
          editable={!disabled}
          style={[
            styles.input,
            webFocusOutlineStyle(),
            { color: surface.foreground },
          ]}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          secureTextEntry={resolvedSecureTextEntry}
          autoCapitalize={resolvedAutoCapitalize}
          keyboardType={resolvedKeyboardType}
          autoCorrect={resolvedAutoCorrect}
          autoFocus={autoFocus}
          maxLength={maxLength}
          returnKeyType={resolvedReturnKeyType}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          accessibilityHint={accessibilityHint}
          aria-invalid={isError}
        />
      </View>
      {/*
        Helper / error are mutually exclusive: error wins when set, helper
        shows otherwise. Keeping the slot to a single line at a time avoids
        the layout jitter you'd get from stacking both, and forces callers
        to pick one piece of feedback for the user to read.

        `accessibilityLiveRegion="polite"` on the error line nudges Android
        screen readers to announce the message when it appears or changes,
        without preempting the user's current focus -- the closest RN gets to
        the web's `aria-errormessage` association.
      */}
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
   * Inner native input. Padding sits here (not on the shared `field`
   * style in {@link inputChromeStyles}) so taps anywhere inside the pill
   * focus the input. `fontSize: 16` keeps mobile browsers from
   * auto-zooming when the field gains focus (irrelevant for native, but
   * harmless and good policy).
   */
  input: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
