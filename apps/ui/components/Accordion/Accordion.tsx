/**
 * Expand / collapse disclosure primitive: an always-visible {@link AccordionProps.summary}
 * slot with a {@link AccordionProps.children} body that is hidden behind a "Show more"
 * toggle until the user opts in. Used by the UI Kit's {@link "../../views/ui-kit/components/ExampleBlock"}
 * to keep long block descriptions one sentence tall by default, but the component is
 * a general-purpose primitive any view can reach for when a long secondary explanation
 * would otherwise clutter the page.
 *
 * Visual shape:
 *
 * - Collapsed -- `[ summary ][ toggle ]`
 * - Expanded  -- `[ summary ][ children ][ toggle ]`
 *
 * The toggle row stays anchored under whatever is currently rendered, which mirrors
 * the Reddit / Slack "Show more / Show less" pattern most users already recognise --
 * the toggle doesn't jump around mid-content.
 *
 * Chromeless by design: no border, no fill, no inset. Drop it inside a {@link "../card".Card}
 * or any other surface if a framed treatment is desired. The toggle itself picks up
 * {@link Theme.primary} as a tinted link-style affordance so it reads as a tappable
 * link rather than a button.
 *
 * Animation runs through React Native's built-in `LayoutAnimation` so the surrounding
 * view's height eases between states without pulling in `react-native-reanimated`
 * (matching the same hands-off dependency stance {@link "../Drawer/Drawer".Drawer}
 * takes for its slide). On Android `LayoutAnimation` requires a one-shot opt-in via
 * `UIManager.setLayoutAnimationEnabledExperimental(true)`; we issue that at module
 * load so callers don't have to remember.
 */
import {
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  UIManager,
  View,
} from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { useTheme } from "../use-theme";

// Android opt-in for the built-in cross-fade / size animations. Safe to call at
// module load -- the flag is idempotent and the underlying setter is guarded for
// platforms (web, iOS) where it's a no-op.
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Props for {@link Accordion}: an always-visible summary plus a toggleable body.
 */
export type AccordionProps = {
  /**
   * Always-visible header content -- typically a one-sentence summary paragraph
   * (`<Description>...</Description>`). Renders flat above the toggle, so the
   * collapsed accordion looks indistinguishable from a stand-alone summary
   * line until the user reveals the rest.
   */
  summary: ReactNode;
  /**
   * Expandable body content rendered between {@link summary} and the toggle
   * row when the accordion is open. Not mounted while collapsed -- a long
   * description doesn't cost any layout work until the user opens it.
   */
  children: ReactNode;
  /**
   * Initial expanded state. Uncontrolled -- the accordion owns the
   * expanded/collapsed flag internally and flips it on each toggle press.
   * @defaultValue false
   */
  defaultExpanded?: boolean;
  /**
   * Caller-visible label rendered next to the chevron while collapsed.
   * @defaultValue "Show more"
   */
  expandLabel?: string;
  /**
   * Caller-visible label rendered next to the chevron while expanded.
   * @defaultValue "Show less"
   */
  collapseLabel?: string;
  /**
   * Optional callback invoked after the internal expanded state flips. Useful
   * when the parent wants to log the disclosure (analytics) or persist the
   * state across navigations -- the accordion still owns the flag, so don't
   * reach for this to control the open state.
   */
  onToggle?: (expanded: boolean) => void;
};

/**
 * Renders an uncontrolled expand / collapse disclosure. See {@link AccordionProps}.
 *
 * @param props - {@link AccordionProps}
 */
export function Accordion({
  summary,
  children,
  defaultExpanded = false,
  expandLabel = "Show more",
  collapseLabel = "Show less",
  onToggle,
}: AccordionProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = useCallback(() => {
    // Configure the next layout pass so the children's mount/unmount animates
    // the surrounding view's height. `easeInEaseOut` matches the timing curve
    // {@link "../Drawer/Drawer".Drawer} uses for its slide so the kit's
    // disclosure surfaces feel related.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  }, [onToggle]);

  const Chevron = expanded ? ChevronUp : ChevronDown;
  const label = expanded ? collapseLabel : expandLabel;

  return (
    <View>
      <View>{summary}</View>
      {expanded ? <View style={styles.body}>{children}</View> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={label}
        onPress={toggle}
        style={({ pressed }) => [
          styles.toggle,
          webFocusOutlineStyle(),
          pressed && styles.togglePressed,
        ]}
        hitSlop={8}
      >
        {/*
          Raw React Native `Text` (rather than the themed Typography `Text`)
          because the toggle paints the primary accent explicitly, and
          Typography's `Text` appends the theme foreground after the caller's
          style -- which would win and undo the accent. Pattern mirrors
          {@link "../Drawer/DrawerItem".DrawerItem}'s destructive label.
        */}
        <RNText style={[styles.toggleLabel, { color: theme.primary }]}>
          {label}
        </RNText>
        <Chevron size={14} color={theme.primary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Breathing room above the expanded body so it reads as a distinct block
   * under the summary rather than continuing the same paragraph. The trailing
   * gap to the toggle is handled by {@link toggle}'s `marginTop`.
   */
  body: {
    marginTop: 8,
  },
  /**
   * Toggle row: chevron + label, hugging the left edge so it reads as a
   * link-style affordance rather than a centered button. `alignSelf:
   * "flex-start"` keeps the tap target the width of the label so the rest of
   * the row stays available for the surrounding content (no accidental
   * full-width press surface that would catch stray taps on the description).
   */
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  togglePressed: {
    opacity: 0.6,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
