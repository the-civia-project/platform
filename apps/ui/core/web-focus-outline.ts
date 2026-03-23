/**
 * Web focus chrome: {@link installWebFocusOutlineReset} (bootstrap) and {@link webFocusOutlineStyle}.
 *
 * Globals alone can lose to load order or UA quirks; inline styles from {@link webFocusOutlineStyle}
 * target the actual DOM node RN Web emits.
 */
import { Platform, type ViewStyle } from "react-native";

const STYLE_ELEMENT_ID = "civia-web-focus-outline-reset";

const CSS = `button::-moz-focus-inner {
  border: 0 !important;
}

html input:focus,
html input:focus-visible,
html textarea:focus,
html textarea:focus-visible,
html button:focus,
html button:focus-visible,
html select:focus,
html select:focus-visible,
html a:focus,
html a:focus-visible,
html [tabindex]:not([tabindex="-1"]):focus,
html [tabindex]:not([tabindex="-1"]):focus-visible,
html div[role="button"]:focus,
html div[role="button"]:focus-visible,
html div[role="textbox"]:focus,
html div[role="textbox"]:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

html *:focus,
html *:focus-visible {
  outline: none !important;
}
`;

/**
 * Call once from {@link "../index" `index`} before `registerRootComponent` so rules exist before
 * the first paint. No-op on native. Does not remove the tag (page lifetime).
 */
export function installWebFocusOutlineReset(): void {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return;
  }

  let el = document.getElementById(STYLE_ELEMENT_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ELEMENT_ID;
    document.head.appendChild(el);
  }
  el.textContent = CSS;
}

/**
 * Merge into `Pressable` / `TouchableOpacity` / `TextInput` style arrays on web. RN Web forwards
 * these to the DOM so the UA ring is suppressed even when a late-loaded stylesheet would
 * restore it. Returns `undefined` on native so style arrays stay unchanged.
 */
export function webFocusOutlineStyle(): ViewStyle | undefined {
  if (Platform.OS !== "web") {
    return undefined;
  }
  return {
    outlineWidth: 0,
    // RN `ViewStyle` omits CSS `none`; RN Web applies it on DOM.
    // @ts-expect-error — valid on web; omitted from RN typedefs
    outlineStyle: "none",
  };
}
