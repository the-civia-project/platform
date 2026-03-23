/**
 * Group of {@link SelectableTopicCard} rows with optional section header copy.
 * Controlled multi-select over string ids.
 */
import { View } from "react-native";
import { Description, Eyebrow } from "../Typography";
import { SelectableTopicCard } from "../SelectableTopicCard";
import {
  isStringInSelection,
  toggleStringInSelection,
} from "../selection";

/**
 * One topic option in {@link SelectableTopicList}.
 */
export type SelectableTopicListItem = {
  /** Stable id in the controlled `value` array. */
  id: string;
  /** Primary line passed to {@link SelectableTopicCard}. */
  title: string;
  /** Supporting copy passed to {@link SelectableTopicCard}. */
  description: string;
  /**
   * Leading tile letter.
   * @defaultValue First character of `title`
   */
  initial?: string;
};

/**
 * Props for {@link SelectableTopicList}.
 */
export type SelectableTopicListProps = {
  /** Options rendered as topic cards. */
  items: readonly SelectableTopicListItem[];
  /** Selected option ids (controlled). */
  value: readonly string[];
  /** Called with the next selection after a row press. */
  onChange: (value: readonly string[]) => void;
  /** Optional small caps label above the list. */
  eyebrow?: string;
  /** Optional helper line under the eyebrow. */
  blurb?: string;
};

/**
 * Renders a vertical list of {@link SelectableTopicCard} options.
 */
export function SelectableTopicList({
  items,
  value,
  onChange,
  eyebrow,
  blurb,
}: SelectableTopicListProps) {
  return (
    <View style={{ gap: 10 }}>
      {eyebrow != null || blurb != null ? (
        <View style={{ gap: 4 }}>
          {eyebrow != null ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          {blurb != null ? <Description>{blurb}</Description> : null}
        </View>
      ) : null}
      <View style={{ gap: 10 }}>
        {items.map((item) => {
          const selected = isStringInSelection(value, item.id);
          return (
            <SelectableTopicCard
              key={item.id}
              initial={item.initial ?? item.title.charAt(0).toUpperCase()}
              title={item.title}
              description={item.description}
              selected={selected}
              onPress={() => onChange(toggleStringInSelection(value, item.id))}
            />
          );
        })}
      </View>
    </View>
  );
}
