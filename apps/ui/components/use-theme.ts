/**
 * React Native hook surface for the kit-wide palette in {@link "./theme"}:
 * resolves the active {@link Theme} from the device colour scheme and optional
 * {@link ThemeFlavor} context so kit primitives re-paint when the user flips
 * light/dark mode or switches flavour (e.g. UI Kit theme switcher).
 *
 * **This is the only module** that should import `useColorScheme` from
 * `react-native` for kit theming -- see {@link useResolvedColorScheme}.
 * Consumers in `components/`, `views/`, and `core/` import {@link useTheme},
 * {@link useResolvedColorScheme}, and {@link useThemeFlavor} from here.
 *
 * Types and the pure resolver are re-exported so callers have a single import
 * surface for runtime + types.
 */
import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
  createElement,
} from "react";
import { useColorScheme } from "react-native";
import {
  resolveTheme,
  type ColorScheme,
  type Theme,
  type ThemeFlavor,
} from "./theme";

export {
  resolveTheme,
  type ColorScheme,
  type Theme,
  type ThemeFlavor,
};

const ThemeFlavorStateContext = createContext<{
  flavor: ThemeFlavor;
  setFlavor: Dispatch<SetStateAction<ThemeFlavor>>;
} | null>(null);

/**
 * Props for {@link ThemeFlavorProvider}.
 */
export type ThemeFlavorProviderProps = {
  /**
   * Initial {@link ThemeFlavor} before the user changes it.
   * @defaultValue "default"
   */
  defaultFlavor?: ThemeFlavor;
};

/**
 * Provides the active {@link ThemeFlavor} for {@link useTheme} and exposes
 * `setFlavor` for the UI Kit switcher (or product settings). Mount once near
 * the app root (e.g. inside the safe-area provider if both are used).
 *
 * @param props - {@link ThemeFlavorProviderProps}
 */
export function ThemeFlavorProvider({
  children,
  defaultFlavor = "default",
}: PropsWithChildren<ThemeFlavorProviderProps>) {
  const [flavor, setFlavor] = useState<ThemeFlavor>(defaultFlavor);
  const value = useMemo(() => ({ flavor, setFlavor }), [flavor]);

  return createElement(
    ThemeFlavorStateContext.Provider,
    { value },
    children,
  );
}

const noopSetFlavor: Dispatch<SetStateAction<ThemeFlavor>> = () => {};

/**
 * Returns the current {@link ThemeFlavor} and `setFlavor` to change it.
 * Outside {@link ThemeFlavorProvider}, reads as `"default"` and `setFlavor`
 * is a no-op so stories and tests do not need the provider.
 *
 * @returns Current flavour and setter.
 */
export function useThemeFlavor(): {
  flavor: ThemeFlavor;
  setFlavor: Dispatch<SetStateAction<ThemeFlavor>>;
} {
  const ctx = useContext(ThemeFlavorStateContext);
  if (!ctx) {
    return { flavor: "default", setFlavor: noopSetFlavor };
  }
  return ctx;
}

/**
 * Resolves React Native's `useColorScheme` to a non-null {@link ColorScheme}.
 * **`null`** (uninitialised on some platforms) maps to **`"light"`** to match
 * the historical default. This is the only supported way to read the OS scheme
 * for kit code -- do not import `useColorScheme` from `react-native` in
 * `components/` for theming.
 *
 * @returns `"light"` or `"dark"`.
 */
export function useResolvedColorScheme(): ColorScheme {
  const scheme = useColorScheme();
  return scheme === "dark" ? "dark" : "light";
}

/**
 * Reads the active appearance and {@link ThemeFlavor}, then returns the fully
 * resolved {@link Theme} from {@link resolveTheme}. Subscribes to OS appearance
 * through {@link useResolvedColorScheme}.
 *
 * @returns The active {@link Theme}.
 */
export function useTheme(): Theme {
  const scheme = useResolvedColorScheme();
  const { flavor } = useThemeFlavor();
  return resolveTheme(scheme, flavor);
}
