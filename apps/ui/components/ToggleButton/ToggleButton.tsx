/**
 * Segmented toggle control built from {@link Button}-styled cells in a wrapping
 * grid. Each cell renders a caller-supplied `{ label, slug }` pair; pressing a
 * cell updates the selection and notifies the parent via `onChange`.
 *
 * **Single-select** (default) behaves like a radio group: one active cell,
 * re-pressing the active cell is a no-op. **Multi-select** (`multiple`) toggles
 * membership per cell so any number of options can be active at once.
 *
 * Shell dimensions and the variant palette come from {@link "../Button"}:
 * inactive cells paint the group's {@link ButtonVariant} (with small
 * normalisations -- see {@link "./resolve-cell-surface"}), and active cells
 * promote to `primary` unless the group variant is `simple`, `inverted`, or
 * `danger`. `link` is supported but renders without an underline.
 *
 * Grid layout (row chunking, outer-corner radius) lives in
 * {@link "./resolve-layout"}; only the top and bottom rows carry rounded
 * corners so the group reads as one {@link Button}-sized pill.
 */
import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import {
  BUTTON_LABEL_FONT_SIZE_PX,
  BUTTON_LABEL_LINE_HEIGHT_PX,
  BUTTON_PADDING_HORIZONTAL_PX,
  BUTTON_PADDING_VERTICAL_PX,
} from "../Button/metrics";
import {
  DISABLED_OPACITY,
  type ButtonVariant,
} from "../Button/surface";
import { useTheme } from "../use-theme";
import { resolveToggleCellSurface } from "./resolve-cell-surface";
import {
  getColumnsPerRow,
  resolveBaseCornerRadius,
  resolveCornerRadii,
  type ToggleButtonCornerRadii,
} from "./resolve-layout";
import {
  createInitialSelection,
  nextSelectionOnPress,
  selectionToSlugArray,
  valueToSelectionSet,
} from "./toggle-selection";

/**
 * Visible label + stable identifier for one toggle cell.
 */
export type ToggleButtonOption = {
  /** Visible label rendered inside the cell. */
  label: string;
  /** Stable identifier forwarded to {@link ToggleButtonProps.onChange}. */
  slug: string;
};

/** Shared props for both selection modes. */
type ToggleButtonPropsBase = {
  /**
   * Options to render, in order, as grid cells. When empty, the control
   * renders `null`.
   */
  options: ReadonlyArray<ToggleButtonOption>;
  /**
   * Visual variant for inactive cells -- same palette as {@link Button}.
   * Active cells promote per {@link "./resolve-cell-surface"}.
   *
   * @defaultValue `"ghost"`
   */
  variant?: ButtonVariant;
  /**
   * Maximum number of option cells per row before wrapping. Layout-only;
   * does not change shell size (always matches {@link Button}).
   *
   * @defaultValue 3
   */
  maxColumnsPerRow?: number;
  /**
   * Disables every cell when `true`: press handlers are dropped, pressed
   * feedback is suppressed, and the group presents as inert.
   *
   * @defaultValue false
   */
  disabled?: boolean;
  /**
   * Slugs that render inert even when the group is enabled. Useful when a
   * given option is invalid for the current caller state.
   */
  disabledSlugs?: readonly string[];
};

/** Single-select {@link ToggleButton} props. */
export type ToggleButtonPropsSingle = ToggleButtonPropsBase & {
  /**
   * When `false` or omitted, exactly one cell is active at a time.
   *
   * @defaultValue false
   */
  multiple?: false;
  /**
   * Initial selected slug. Falls back to the first option's slug when
   * omitted.
   */
  defaultValue?: string;
  /** Controlled selected slug (overrides internal state). */
  value?: string;
  /**
   * Called with the newly selected slug when the selection changes.
   */
  onChange?: (slug: string) => void;
};

/** Multi-select {@link ToggleButton} props. */
export type ToggleButtonPropsMultiple = ToggleButtonPropsBase & {
  /** When `true`, each cell toggles independently; zero or more may be active. */
  multiple: true;
  /**
   * Initially selected slugs. Defaults to an empty selection.
   */
  defaultValue?: readonly string[];
  /** Controlled selected slugs (overrides internal state). */
  value?: readonly string[];
  /**
   * Called with the full active slug list (in `options` order) whenever
   * membership changes.
   */
  onChange?: (slugs: readonly string[]) => void;
};

/**
 * Public props for {@link ToggleButton}.
 */
export type ToggleButtonProps =
  | ToggleButtonPropsSingle
  | ToggleButtonPropsMultiple;

/**
 * Segmented toggle control: a pill-shaped group of labelled cells.
 *
 * @param props - {@link ToggleButtonProps}
 */
export function ToggleButton(props: ToggleButtonProps) {
  const {
    options,
    variant = "ghost",
    maxColumnsPerRow = 3,
    disabled = false,
    disabledSlugs = [],
  } = props;
  const multiple = props.multiple === true;

  const theme = useTheme();

  const firstSlug = options[0]?.slug;
  const optionSlugs = useMemo(
    () => options.map((option) => option.slug),
    [options],
  );
  const disabledSlugSet = useMemo(
    () => new Set(disabledSlugs),
    [disabledSlugs],
  );

  const [internalSelected, setInternalSelected] = useState(() =>
    createInitialSelection(multiple, props.defaultValue, firstSlug),
  );

  const controlledValue = multiple
    ? (props as ToggleButtonPropsMultiple).value
    : (props as ToggleButtonPropsSingle).value;

  const selectedSet = useMemo(() => {
    if (controlledValue !== undefined) {
      return valueToSelectionSet(multiple, controlledValue);
    }
    return internalSelected;
  }, [controlledValue, internalSelected, multiple]);

  if (options.length === 0) {
    return null;
  }

  const columnsPerRow = getColumnsPerRow(maxColumnsPerRow, options.length);
  const rows: ToggleButtonOption[][] = [];
  if (columnsPerRow > 0) {
    for (let index = 0; index < options.length; index += columnsPerRow) {
      rows.push(options.slice(index, index + columnsPerRow));
    }
  }

  const notifyChange = (next: Set<string>) => {
    if (multiple) {
      (props as ToggleButtonPropsMultiple).onChange?.(
        selectionToSlugArray(next, optionSlugs),
      );
      return;
    }
    const slug = selectionToSlugArray(next, optionSlugs)[0];
    if (slug) {
      (props as ToggleButtonPropsSingle).onChange?.(slug);
    }
  };

  const handlePress = (slug: string) => {
    if (disabled || disabledSlugSet.has(slug)) {
      return;
    }
    const next = nextSelectionOnPress(multiple, selectedSet, slug);
    if (!next) {
      return;
    }
    if (controlledValue === undefined) {
      setInternalSelected(next);
    }
    notifyChange(next);
  };

  const cornerRadius = resolveBaseCornerRadius();
  const groupInactiveSurface = resolveToggleCellSurface(variant, theme, false);
  const rootBorderWidth =
    groupInactiveSurface.borderWidth > 0
      ? groupInactiveSurface.borderWidth
      : 1;
  const rootBorderColor =
    groupInactiveSurface.borderWidth > 0
      ? groupInactiveSurface.borderColor
      : theme.borderDefault;

  const rootStyle: StyleProp<ViewStyle> = [
    styles.root,
    {
      borderColor: rootBorderColor,
      borderWidth: rootBorderWidth,
      borderRadius: cornerRadius,
    },
    disabled && styles.rootDisabled,
  ];

  const groupAccessibilityRole = multiple ? undefined : "radiogroup";
  const cellAccessibilityRole = multiple ? "checkbox" : "radio";

  return (
    <View
      style={rootStyle}
      accessibilityRole={groupAccessibilityRole}
      accessibilityState={{ disabled }}
    >
      {rows.map((row, rowIndex) => {
        const rowKey = row.map((option) => option.slug).join("|");
        const isLastRow = rowIndex === rows.length - 1;
        return (
          <View
            key={rowKey || rowIndex}
            style={[
              styles.row,
              !isLastRow && { borderBottomColor: theme.borderDefault },
            ]}
          >
            {row.map((option, columnIndex) => {
              const isActive = selectedSet.has(option.slug);
              const isCellDisabled =
                disabled || disabledSlugSet.has(option.slug);
              const isLastColumn = columnIndex === row.length - 1;
              const cornerRadii: ToggleButtonCornerRadii = resolveCornerRadii({
                rowIndex,
                columnIndex,
                rowCount: rows.length,
                columnCount: row.length,
              });
              const surface = resolveToggleCellSurface(
                variant,
                theme,
                isActive,
              );

              const cellBaseStyle: StyleProp<ViewStyle> = [
                styles.cell,
                {
                  backgroundColor: surface.backgroundColor,
                  borderRightColor: theme.borderDefault,
                },
                !isLastColumn && styles.cellWithRightBorder,
                cornerRadii,
              ];

              const inner = (
                <View style={cellBaseStyle}>
                  <RNText
                    style={[
                      styles.label,
                      Platform.OS === "android" && styles.labelAndroid,
                      {
                        color: surface.color,
                        textDecorationLine:
                          surface.textDecorationLine ?? "none",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {option.label}
                  </RNText>
                </View>
              );

              if (isCellDisabled) {
                return (
                  <View
                    key={option.slug}
                    style={styles.cellWrapper}
                    accessibilityRole={cellAccessibilityRole}
                    accessibilityState={{
                      selected: isActive,
                      disabled: true,
                      checked: multiple ? isActive : undefined,
                    }}
                  >
                    {inner}
                  </View>
                );
              }

              return (
                <Pressable
                  key={option.slug}
                  accessibilityRole={cellAccessibilityRole}
                  accessibilityState={{
                    selected: isActive,
                    checked: multiple ? isActive : undefined,
                  }}
                  accessibilityLabel={option.label}
                  accessibilityHint={
                    multiple
                      ? isActive
                        ? `Turn off ${option.label}`
                        : `Turn on ${option.label}`
                      : isActive
                        ? `${option.label} selected`
                        : `Select ${option.label}`
                  }
                  style={({ pressed }) => [
                    styles.cellWrapper,
                    webFocusOutlineStyle(),
                    pressed && styles.cellPressed,
                  ]}
                  onPress={() => handlePress(option.slug)}
                  hitSlop={6}
                >
                  {inner}
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
  },
  rootDisabled: {
    opacity: DISABLED_OPACITY,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cellWrapper: {
    flex: 1,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: BUTTON_PADDING_HORIZONTAL_PX,
    paddingVertical: BUTTON_PADDING_VERTICAL_PX,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  cellWithRightBorder: {},
  cellPressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: BUTTON_LABEL_FONT_SIZE_PX,
    lineHeight: BUTTON_LABEL_LINE_HEIGHT_PX,
    textAlign: "center",
  },
  labelAndroid: {
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});

export default ToggleButton;
