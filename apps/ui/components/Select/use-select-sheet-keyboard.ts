/**
 * Web-only keyboard control for an open {@link Select} sheet: arrow keys move the
 * highlight, Enter commits it. Uses a document capture listener because RN Web
 * does not reliably forward `onKeyDown` from {@link TextInput} or {@link View}.
 */
import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { Platform } from "react-native";
import { moveSelectHighlightIndex } from "./select-sheet-keyboard";
import type { SelectOption } from "./types";

type UseSelectSheetKeyboardArgs<T> = {
  /** Whether the picker sheet is visible. */
  open: boolean;
  /** Rows currently shown in the sheet (after optional fuzzy filter). */
  visibleOptions: ReadonlyArray<SelectOption<T>>;
  /** Active keyboard highlight index (`-1` when empty). */
  highlightedIndex: number;
  /** Updates {@link UseSelectSheetKeyboardArgs.highlightedIndex}. */
  setHighlightedIndex: Dispatch<SetStateAction<number>>;
  /** Applies the chosen row and closes the sheet. */
  commitOption: (option: SelectOption<T>) => void;
};

const NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "Enter"]);

/**
 * Attaches web keyboard navigation while `open` is true. No-op on native.
 */
export function useSelectSheetKeyboard<T>({
  open,
  visibleOptions,
  highlightedIndex,
  setHighlightedIndex,
  commitOption,
}: UseSelectSheetKeyboardArgs<T>): void {
  const highlightedIndexRef = useRef(highlightedIndex);
  highlightedIndexRef.current = highlightedIndex;

  const visibleOptionsRef = useRef(visibleOptions);
  visibleOptionsRef.current = visibleOptions;

  const commitOptionRef = useRef(commitOption);
  commitOptionRef.current = commitOption;

  useEffect(() => {
    if (!open || Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!NAV_KEYS.has(event.key)) return;

      const options = visibleOptionsRef.current;
      if (options.length === 0) return;

      event.preventDefault();

      if (event.key === "ArrowDown") {
        setHighlightedIndex((current) =>
          moveSelectHighlightIndex(current, 1, options.length),
        );
        return;
      }
      if (event.key === "ArrowUp") {
        setHighlightedIndex((current) =>
          moveSelectHighlightIndex(current, -1, options.length),
        );
        return;
      }
      const option = options[highlightedIndexRef.current];
      if (option) commitOptionRef.current(option);
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, setHighlightedIndex]);
}
