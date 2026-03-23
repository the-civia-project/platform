/**
 * Multi-select checklist: {@link DrawerItem} rows inside a {@link Card}, with
 * check accessories for selected options. Supports optional icons and section
 * header copy.
 */
import type { LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import { Card } from "../card/Card";
import { DrawerItem } from "../Drawer";
import { Description, Eyebrow } from "../Typography";
import {
  isStringInSelection,
  toggleStringInSelection,
} from "../selection";

/**
 * One row in {@link SelectableChecklist}.
 */
export type SelectableChecklistItem = {
  /** Stable id in the controlled `value` array. */
  id: string;
  /** Primary label on the row. */
  label: string;
  /** Optional supporting line under the label. */
  description?: string;
  /** Optional leading Lucide icon. */
  icon?: LucideIcon;
};

/**
 * Props for {@link SelectableChecklist}.
 */
export type SelectableChecklistProps = {
  /** Rows rendered inside the card. */
  items: readonly SelectableChecklistItem[];
  /** Selected option ids (controlled). */
  value: readonly string[];
  /** Called with the next selection after a row press. */
  onChange: (value: readonly string[]) => void;
  /** Optional small caps label above the card. */
  eyebrow?: string;
  /** Optional helper line under the eyebrow. */
  blurb?: string;
};

/**
 * Renders a card-wrapped checklist with multi-select behaviour.
 */
export function SelectableChecklist({
  items,
  value,
  onChange,
  eyebrow,
  blurb,
}: SelectableChecklistProps) {
  return (
    <View style={{ gap: 10 }}>
      {eyebrow != null || blurb != null ? (
        <View style={{ gap: 4 }}>
          {eyebrow != null ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          {blurb != null ? <Description>{blurb}</Description> : null}
        </View>
      ) : null}
      <Card header={null} footer={null}>
        <View style={{ gap: 2 }}>
          {items.map((item) => {
            const selected = isStringInSelection(value, item.id);
            return (
              <DrawerItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                description={item.description}
                accessory={selected ? "check" : "none"}
                onPress={() =>
                  onChange(toggleStringInSelection(value, item.id))
                }
                accessibilityState={{ selected }}
                accessibilityHint={
                  selected
                    ? "Tap to remove from selection"
                    : "Tap to add to selection"
                }
              />
            );
          })}
        </View>
      </Card>
    </View>
  );
}
