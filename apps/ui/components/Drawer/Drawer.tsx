/**
 * Bottom-sheet modal: slides up from the bottom of the screen with a fading
 * backdrop. Sizes to its content (capped at ~85% of screen height), exposes
 * optional `title`/`subtitle` + `footer` slots, and dispatches `onClose` from
 * the backdrop tap, the Android hardware back button, or the optional X in
 * the header.
 *
 * Internally uses React Native's `Modal` for stacking + Android back-button
 * wiring, plus the built-in `Animated` API for the slide/fade so the
 * component doesn't depend on `react-native-reanimated` being initialised
 * at runtime. `useNativeDriver: true` keeps the transform/opacity work on
 * the native thread, so the bottom sheet stays smooth even when JS is busy.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react-native";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { IconButton } from "../Button";
import { Text } from "../Typography";
import { useTheme } from "../use-theme";

/**
 * Screen height read once at module load. The sheet's off-screen position is
 * larger than this value (the sheet itself is shorter), so this is only used
 * as a starting `translateY` and a cap for the sheet's maxHeight.
 */
const SCREEN_HEIGHT = Dimensions.get("window").height;
/** Open animation runs slightly slower than close so the entrance feels deliberate. */
const ANIM_DURATION_OPEN = 260;
const ANIM_DURATION_CLOSE = 220;

/**
 * Props for the {@link Drawer} bottom-sheet primitive.
 */
export type DrawerProps = {
  /**
   * Whether the drawer is currently visible. The parent owns this state and
   * flips it back to `false` from {@link DrawerProps.onClose}; the drawer
   * stays mounted internally during the close animation so the slide-out is
   * visible.
   */
  open: boolean;
  /**
   * Invoked when the user requests dismissal -- backdrop tap, the X button in
   * the header (when shown), or the Android hardware back button. The parent
   * is expected to set `open` to `false` in response.
   */
  onClose: () => void;
  /** Optional heading rendered at the top of the sheet. */
  title?: string;
  /** Optional supporting line under the title; ignored when no `title`/`subtitle` is set. */
  subtitle?: string;
  /** Body content -- typically a column of {@link DrawerItem}s or a small form. */
  children: ReactNode;
  /**
   * Optional persistent action row docked at the bottom of the sheet. Typically
   * a `Button` or two; renders above the safe-area inset so the footer
   * doesn't slide under the home indicator on iOS.
   */
  footer?: ReactNode;
  /**
   * Suppresses the close button beside the title. Use for confirmation flows
   * where the only valid exits are the footer buttons (e.g. "Delete account
   * -- Cancel / Delete"); the backdrop tap and hardware back are still wired.
   * Ignored when no header is rendered (i.e. neither `title` nor `subtitle`).
   * @defaultValue false
   */
  hideCloseButton?: boolean;
  /**
   * Suppresses the small grabber handle at the top of the sheet. The handle is
   * a visual affordance hint -- even though this build doesn't ship a
   * swipe-to-dismiss gesture yet, the bar helps the sheet read as
   * dismissable. Turn it off for fullscreen dialogs or compact menus where
   * the chrome would feel heavy.
   * @defaultValue false
   */
  hideHandle?: boolean;
};

/**
 * Renders a themed bottom sheet. See {@link DrawerProps}.
 *
 * @param props - {@link DrawerProps}
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  hideCloseButton = false,
  hideHandle = false,
}: DrawerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Internal mount state -- lags behind `open` for the close animation. Without
  // this we'd unmount the Modal the instant `open` flipped to `false`, killing
  // the slide-out. The state is reconciled in the effect below.
  const [rendered, setRendered] = useState(open);

  // `useRef` so the Animated.Value instances aren't recreated on re-render.
  // Initialised to match the requested `open` state so the very first paint
  // doesn't flash the sheet at the wrong position.
  const translateY = useRef(
    new Animated.Value(open ? 0 : SCREEN_HEIGHT),
  ).current;
  const backdropOpacity = useRef(
    new Animated.Value(open ? 1 : 0),
  ).current;

  useEffect(() => {
    if (open) {
      // Mount immediately so the slide-up plays on the very next frame.
      setRendered(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIM_DURATION_OPEN,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIM_DURATION_OPEN,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!rendered) return;

    // Closing -- animate out, then drop the Modal. `finished` guards against
    // interrupted animations (e.g. parent toggled `open` back to `true`
    // mid-close); we only unmount when the close actually completes.
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: ANIM_DURATION_CLOSE,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIM_DURATION_CLOSE,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setRendered(false);
    });
  }, [open, rendered, translateY, backdropOpacity]);

  if (!rendered) return null;

  const hasHeader = Boolean(title || subtitle);
  const showCloseButton = hasHeader && !hideCloseButton;

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {/*
          Backdrop is its own animated layer so its opacity fades independently
          of the sheet's slide. The pressable is full-screen and underneath
          the sheet so taps anywhere outside the sheet dismiss the drawer.
        */}
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: theme.scrim, opacity: backdropOpacity },
          ]}
          pointerEvents="auto"
        >
          <Pressable
            style={[StyleSheet.absoluteFill, webFocusOutlineStyle()]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Dismiss drawer"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surfaceCard,
              // Add safe-area inset to the configured padding so the footer
              // (or trailing body content) sits clear of the home indicator.
              paddingBottom: Math.max(insets.bottom, 8) + 12,
              transform: [{ translateY }],
            },
          ]}
        >
          {hideHandle ? null : (
            <View
              style={[styles.handle, { backgroundColor: theme.borderHandle }]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          )}

          {hasHeader ? (
            <View style={styles.header}>
              <View style={styles.headerText}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
              </View>
              {showCloseButton ? (
                <IconButton
                  icon={X}
                  size="sm"
                  variant="full-ghost"
                  shape="round"
                  onPress={onClose}
                  accessibilityLabel="Close drawer"
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.body}>{children}</View>

          {footer ? (
            <View style={[styles.footer, { borderTopColor: theme.borderDefault }]}>
              {footer}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  /**
   * Modal's full-screen wrapper. `flex-end` parks the sheet at the bottom; the
   * backdrop sits behind it as an absolute layer.
   */
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor is themed inline by {@link Drawer} via {@link Theme.scrim}.
  },
  /**
   * The sheet itself. `maxHeight` caps growth at 85% of the viewport so a tall
   * action list still leaves a usable backdrop strip at the top for dismissal.
   * Top corners are rounded; bottom corners are square because the sheet
   * butts against the edge of the screen.
   */
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: SCREEN_HEIGHT * 0.85,
    // iOS shadow + Android elevation give the sheet a little lift over the
    // backdrop so the seam between sheet and dimmed background reads cleanly.
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  /**
   * Small grabber. Decorative only -- `accessibilityElementsHidden` keeps it
   * out of screen-reader navigation.
   */
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 12,
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  body: {
    paddingBottom: 4,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
  },
});
