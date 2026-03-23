/**
 * React Native hook surface for {@link FormFactor} detection. Subscribes to
 * viewport changes on web so a consumer (e.g. the carousel's chevron
 * overlay) re-renders the moment the viewport crosses the phone/desktop
 * breakpoint. On native there is nothing to subscribe to: the value stays
 * `"mobile"` regardless of rotation or other dimension changes.
 *
 * Thin shell around the pure {@link pickFormFactor} -- this file is the
 * only form-factor surface that touches React Native, which keeps the
 * underlying classifier in `./form-factor` unit-testable in Node. Consumers
 * in `components/`, `views/`, and `core/` should import {@link
 * useFormFactor} or {@link getFormFactor} from here; pure code that already
 * has the inputs in hand can read {@link pickFormFactor} from
 * `./form-factor` directly.
 *
 * Re-exports {@link pickFormFactor} and {@link FormFactor} so consumers
 * pick up both the runtime hook and the underlying types from a single
 * import.
 */
import { useEffect, useState } from "react";
import { Dimensions, Platform } from "react-native";
import { pickFormFactor, type FormFactor } from "./form-factor";

export { pickFormFactor, type FormFactor };

/**
 * One-shot read of the active {@link FormFactor}. Reads `Platform.OS` and
 * `Dimensions.get("window").width` once and feeds them to the pure
 * {@link pickFormFactor}; does not subscribe to viewport changes.
 *
 * Use inside non-React utilities (e.g. one-shot style computations outside
 * a render or initial-state computations that don't need to react to
 * resizes). Inside a component, prefer {@link useFormFactor} so the
 * component re-renders when the viewport crosses the breakpoint on web.
 *
 * @returns The active {@link FormFactor}.
 */
export function getFormFactor(): FormFactor {
  return pickFormFactor(Platform.OS, Dimensions.get("window").width);
}

/**
 * React hook that returns the active {@link FormFactor} and subscribes to
 * viewport changes on web. When the user resizes the browser across the
 * 768px boundary, the returned value flips between `"web-mobile"` and
 * `"web"` and the consumer re-renders, letting a single component swap
 * touch- and pointer-first UI without remounting.
 *
 * On native (`Platform.OS === "ios"` / `"android"` / ...) the value is the
 * constant `"mobile"`; the effect bails out early so we never wire up an
 * unused `Dimensions` listener. The hook is safe to call unconditionally
 * (e.g. from a component that may be rendered on either platform) -- the
 * subscription cost is paid only where it has anything to subscribe to.
 *
 * @returns The active {@link FormFactor}, kept in sync with viewport
 * changes on web.
 */
export function useFormFactor(): FormFactor {
  const [value, setValue] = useState<FormFactor>(getFormFactor);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const subscription = Dimensions.addEventListener("change", () => {
      setValue(getFormFactor());
    });
    return () => subscription.remove();
  }, []);
  return value;
}
