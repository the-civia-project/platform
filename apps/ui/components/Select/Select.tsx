/**
 * Themed single-choice picker: a closed field that matches {@link TextInput}
 * chrome opens a {@link Drawer} listing {@link SelectProps.options}.
 * {@link SelectProps.size} scales the closed trigger (`xs` | `sm` | `md`).
 * When the list is long enough (or search is forced on), a {@link TextInput} `search`
 * row appears at the top of the sheet, receives keyboard focus via
 * {@link TextInput}'s `autoFocus`, and options are ranked with
 * {@link rankSelectOptionsByFuzzyQuery} so abbreviations and typos still
 * surface the intended row, ordered by descending match confidence. On web,
 * the first visible row is highlighted while the sheet is open; arrow keys
 * move the highlight and Enter commits it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react-native";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import { webFocusOutlineStyle } from "../../core/web-focus-outline";
import { Drawer } from "../Drawer";
import { DrawerItem } from "../Drawer/DrawerItem";
import {
  inputChromeStyles,
  resolveInputBorderColor,
  useInputSurface,
} from "../Input/surface";
import { TextInput } from "../Input/TextInput";
import { useTheme } from "../use-theme";
import {
  defaultSelectSearchHaystack,
  rankSelectOptionsByFuzzyQuery,
} from "./fuzzy-match";
import { SELECT_TRIGGER_METRICS_PX, type SelectSize } from "./metrics";
import { initialSelectHighlightIndex } from "./select-sheet-keyboard";
import type { SelectOption } from "./types";
import { useSelectSheetKeyboard } from "./use-select-sheet-keyboard";

/**
 * When {@link SelectProps.search} is `"auto"`, the filter field is shown once
 * the option count reaches this threshold (inclusive).
 */
export const SELECT_SEARCH_THRESHOLD = 10;

const WINDOW_HEIGHT = Dimensions.get("window").height;

/**
 * Props for {@link Select}.
 *
 * @typeParam T - Stored value type for {@link SelectProps.value}.
 */
export type SelectProps<T = string> = {
  /**
   * Full option list rendered inside the picker sheet.
   */
  options: ReadonlyArray<SelectOption<T>>;
  /**
   * Currently selected value, or `null` when nothing is chosen yet.
   */
  value: T | null;
  /**
   * Called when the user picks a row. The parent should store `next` in
   * {@link SelectProps.value} so the trigger label updates.
   */
  onChange: (next: T) => void;
  /**
   * Ghosted label in the closed trigger when {@link SelectProps.value} is
   * `null`.
   */
  placeholder: string;
  /**
   * Optional headline above the trigger (same slot as the TextInput `label`).
   */
  label?: string;
  /**
   * Optional supporting line under the trigger (same slot as the TextInput `helper`).
   */
  helper?: string;
  /**
   * Validation message; when set, mirrors the TextInput `error` border
   * and replaces the helper line.
   */
  error?: string;
  /**
   * Disables opening the sheet and greys the chrome.
   * @defaultValue false
   */
  disabled?: boolean;
  /**
   * Drawer heading. Ignored when empty -- prefer a short noun ("Country",
   * "Time zone").
   * @defaultValue "Choose"
   */
  sheetTitle?: string;
  /**
   * Controls the optional fuzzy filter row at the top of the sheet.
   *
   * - `"auto"` *(default)* -- show search when `options.length` is at least
   *   {@link SelectProps.searchThreshold}.
   * - `true` -- always show search.
   * - `false` -- never show search (scroll only).
   *
   * @defaultValue "auto"
   */
  search?: "auto" | boolean;
  /**
   * Option count at which `"auto"` mode enables the search row.
   * @defaultValue {@link SELECT_SEARCH_THRESHOLD}
   */
  searchThreshold?: number;
  /**
   * Placeholder on the in-drawer filter field when search is visible.
   * @defaultValue "Search…"
   */
  filterPlaceholder?: string;
  /**
   * Equality for matching {@link SelectProps.value} to an option. Defaults to
   * `Object.is` -- override when values are objects compared by id.
   */
  valueEquals?: (a: T, b: T) => boolean;
  /**
   * Maps each option to the haystack string passed to the fuzzy scorer. The
   * default joins {@link SelectOption.label} and {@link SelectOption.searchText}.
   */
  haystackFor?: (option: SelectOption<T>) => string;
  /**
   * Overrides the closed-field accessibility name. Falls back to
   * {@link SelectProps.label} → {@link SelectProps.placeholder}.
   */
  accessibilityLabel?: string;
  /**
   * Optional screen-reader hint for the trigger.
   */
  accessibilityHint?: string;
  /**
   * Closed-trigger scale: padding, label size, and chevron track {@link SelectSize}.
   * @defaultValue "md"
   */
  size?: SelectSize;
};

/**
 * Single-select field that opens a searchable bottom sheet. See {@link SelectProps}.
 *
 * @typeParam T - Stored value type.
 * @param props - {@link SelectProps}
 */
export function Select<T = string>({
  options,
  value,
  onChange,
  placeholder,
  label,
  helper,
  error,
  disabled = false,
  sheetTitle = "Choose",
  search = "auto",
  searchThreshold = SELECT_SEARCH_THRESHOLD,
  filterPlaceholder = "Search…",
  valueEquals = Object.is,
  haystackFor = defaultSelectSearchHaystack,
  accessibilityLabel,
  accessibilityHint,
  size = "md",
}: SelectProps<T>) {
  const theme = useTheme();
  const surface = useInputSurface();
  const triggerMetrics = SELECT_TRIGGER_METRICS_PX[size];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pressed, setPressed] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<FlatList<SelectOption<T>>>(null);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const commitOption = useCallback(
    (option: SelectOption<T>) => {
      onChange(option.value);
      setOpen(false);
    },
    [onChange],
  );

  const isError = Boolean(error);
  const borderColor = resolveInputBorderColor(surface, {
    focused: open || pressed,
    isError,
  });

  const selected = useMemo(
    () => options.find((o) => value !== null && valueEquals(o.value, value)),
    [options, value, valueEquals],
  );

  const showSearch =
    search === true || (search === "auto" && options.length >= searchThreshold);

  const visibleOptions = useMemo(() => {
    if (!showSearch) return [...options];
    return rankSelectOptionsByFuzzyQuery(options, query, haystackFor);
  }, [options, query, showSearch, haystackFor]);

  useEffect(() => {
    if (!open) {
      setHighlightedIndex(-1);
      return;
    }
    setHighlightedIndex(initialSelectHighlightIndex(visibleOptions.length));
  }, [open, visibleOptions]);

  useEffect(() => {
    if (!open || highlightedIndex < 0) return;
    listRef.current?.scrollToIndex({
      index: highlightedIndex,
      animated: true,
      viewPosition: 0.5,
    });
  }, [open, highlightedIndex]);

  useSelectSheetKeyboard({
    open,
    visibleOptions,
    highlightedIndex,
    setHighlightedIndex,
    commitOption,
  });

  const triggerLabel = selected?.label ?? placeholder;
  const triggerMuted = !selected;

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

      <Pressable
        disabled={disabled}
        onPress={disabled ? undefined : () => setOpen(true)}
        onPressIn={disabled ? undefined : () => setPressed(true)}
        onPressOut={disabled ? undefined : () => setPressed(false)}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
        accessibilityHint={accessibilityHint}
        style={[
          inputChromeStyles.field,
          webFocusOutlineStyle(),
          { backgroundColor: surface.background, borderColor },
        ]}
      >
        <View
          style={[
            styles.triggerInner,
            {
              gap: triggerMetrics.gap,
              paddingHorizontal: triggerMetrics.paddingHorizontal,
              paddingVertical: triggerMetrics.paddingVertical,
              minHeight: triggerMetrics.minHeight,
            },
          ]}
        >
          <RNText
            numberOfLines={1}
            style={[
              styles.triggerText,
              {
                fontSize: triggerMetrics.fontSize,
                color: triggerMuted ? surface.placeholder : surface.foreground,
              },
            ]}
          >
            {triggerLabel}
          </RNText>
          <ChevronDown
            size={triggerMetrics.chevronSize}
            color={theme.fgMuted}
            strokeWidth={2}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
      </Pressable>

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

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={sheetTitle}
        hideHandle={false}
      >
        <View style={styles.sheetBody}>
          {showSearch ? (
            <View style={styles.searchWrap}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                type="search"
                placeholder={filterPlaceholder}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          ) : null}

          {visibleOptions.length === 0 ? (
            <RNText style={[styles.empty, { color: surface.helper }]}>
              No matches
            </RNText>
          ) : (
            <FlatList
                ref={listRef}
                data={visibleOptions}
                keyExtractor={(item, index) => {
                  const v = item.value as unknown;
                  if (typeof v === "string" || typeof v === "number") {
                    return `${String(v)}-${index}`;
                  }
                  return `${index}-${item.label}`;
                }}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                onScrollToIndexFailed={({ index }) => {
                  listRef.current?.scrollToOffset({
                    offset: index * 48,
                    animated: true,
                  });
                }}
                renderItem={({ item, index }) => (
                  <DrawerItem
                    label={item.label}
                    highlighted={index === highlightedIndex}
                    accessory={
                      value !== null && valueEquals(item.value, value)
                        ? "check"
                        : "none"
                    }
                    onPress={() => commitOption(item)}
                    accessibilityLabel={item.label}
                    accessibilityState={{
                      selected: index === highlightedIndex,
                    }}
                  />
                )}
              />
          )}
        </View>
      </Drawer>
    </View>
  );
}

const styles = StyleSheet.create({
  triggerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  /**
   * Mirrors {@link TextInput} inner rhythm at {@link SelectSize} `"md"` so the
   * trigger and inputs feel like one family; smaller sizes tighten the pill for
   * dense toolbars (the sheet search field keeps {@link TextInput}'s default scale).
   */
  triggerText: {
    flex: 1,
    minWidth: 0,
  },
  sheetBody: {
    gap: 8,
  },
  searchWrap: {
    marginBottom: 4,
  },
  list: {
    maxHeight: WINDOW_HEIGHT * 0.48,
  },
  empty: {
    fontSize: 15,
    paddingVertical: 12,
    textAlign: "center",
  },
});
