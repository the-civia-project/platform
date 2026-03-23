/**
 * Multi-select pill group: wrapping {@link Pill} cells in a {@link Cluster}.
 * Selected options use `primary`; unselected use `ghost`.
 */
import { View } from "react-native";
import { Cluster } from "../Cluster";
import Pill from "../Pill";
import { Description, Eyebrow } from "../Typography";
import {
  isStringInSelection,
  toggleStringInSelection,
} from "../selection";

/**
 * One pill option in {@link SelectablePillGroup}.
 */
export type SelectablePillOption = {
  /** Stable id in the controlled `value` array. */
  id: string;
  /** Label on the pill button. */
  label: string;
};

/**
 * Props for {@link SelectablePillGroup}.
 */
export type SelectablePillGroupProps = {
  /** Pill options in display order. */
  options: readonly SelectablePillOption[];
  /** Selected option ids (controlled). */
  value: readonly string[];
  /** Called with the next selection after a pill press. */
  onChange: (value: readonly string[]) => void;
  /** Optional small caps label above the pills. */
  eyebrow?: string;
  /** Optional helper line under the eyebrow. */
  blurb?: string;
};

/**
 * Renders a multi-select pill row.
 */
export function SelectablePillGroup({
  options,
  value,
  onChange,
  eyebrow,
  blurb,
}: SelectablePillGroupProps) {
  return (
    <View style={{ gap: 10 }}>
      {eyebrow != null || blurb != null ? (
        <View style={{ gap: 4 }}>
          {eyebrow != null ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          {blurb != null ? <Description>{blurb}</Description> : null}
        </View>
      ) : null}
      <Cluster>
        {options.map((option) => {
          const selected = isStringInSelection(value, option.id);
          return (
            <Pill
              key={option.id}
              selected={selected}
              onPress={() =>
                onChange(toggleStringInSelection(value, option.id))
              }
            >
              {option.label}
            </Pill>
          );
        })}
      </Cluster>
    </View>
  );
}
