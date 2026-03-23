/**
 * Barrel for the kit's input family. Two siblings share a single chrome
 * surface (label / field / helper / error border) through
 * {@link useInputSurface} and {@link inputChromeStyles}, so a re-tune of
 * the focus border or the disabled opacity lands on both at once:
 *
 * - {@link TextInput} -- single-line field with a {@link TextInputType}
 *   preset catalogue for common kinds (email / phone / URL / number /
 *   password / search).
 * - {@link TextArea} -- multi-line field that grows from
 *   {@link TextAreaProps.minRows} up to {@link TextAreaProps.maxRows}.
 *   Reach for it when the value wraps across lines (composer bodies,
 *   bios, comments).
 *
 * The `Select` picker lives in `../Select` (separate barrel) but shares the same
 * chrome tokens via {@link useInputSurface}.
 */
export {
  TextInput,
  type TextInputProps,
  type TextInputType,
} from "./TextInput";
export { TextArea, type TextAreaProps } from "./TextArea";
export {
  inputChromeStyles,
  resolveInputBorderColor,
  useInputSurface,
  type InputSurface,
} from "./surface";
