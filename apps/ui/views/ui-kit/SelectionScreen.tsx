/**
 * UI Kit screen for controlled multi-select primitives: {@link SelectablePillGroup},
 * {@link SelectableChecklist}, {@link SelectableTopicCard}, and
 * {@link SelectableTopicList}. All share {@link toggleStringInSelection} for id
 * arrays; pick the presentation that fits copy length and density.
 */
import { useMemo, useState } from "react";
import { Flag, Globe2, Landmark } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import Pill from "../../components/Pill";
import { Cluster } from "../../components/Cluster";
import { SelectableChecklist } from "../../components/SelectableChecklist";
import { SelectablePillGroup } from "../../components/SelectablePillGroup";
import { SelectableTopicCard } from "../../components/SelectableTopicCard";
import { SelectableTopicList } from "../../components/SelectableTopicList";
import {
  isStringInSelection,
  toggleStringInSelection,
} from "../../components/selection";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import {
  Caption,
  Code,
  Description,
  Label,
  Lede,
} from "../../components/Typography";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";

/** Row data with a stable React `key`. */
type DemoRow = ExampleBlockProps & { key: string };

function PillDemo() {
  const [selected, setSelected] = useState(false);

  return (
    <Cluster>
      <Pill variant="muted">Optional</Pill>
      <Pill selected={selected} onPress={() => setSelected((v) => !v)}>
        Toggle me
      </Pill>
      <Pill variant="primary" onPress={() => {}}>
        Always primary
      </Pill>
    </Cluster>
  );
}

function SelectablePillGroupDemo() {
  const [value, setValue] = useState<readonly string[]>(["country"]);

  return (
    <SelectablePillGroup
      eyebrow="Where you care"
      blurb="Short labels that wrap — selected pills use primary."
      options={[
        { id: "local", label: "Where I live" },
        { id: "country", label: "My country" },
        { id: "europe", label: "Europe" },
        { id: "global", label: "Global issues" },
      ]}
      value={value}
      onChange={setValue}
    />
  );
}

function SelectableChecklistDemo() {
  const [value, setValue] = useState<readonly string[]>(["elections"]);

  return (
    <SelectableChecklist
      eyebrow="Civic topics"
      blurb="Card-wrapped DrawerItem rows with check accessories."
      items={[
        {
          id: "local-government",
          label: "Local government",
          description: "Council, mayor, neighbourhood",
          icon: Landmark,
        },
        {
          id: "elections",
          label: "Elections",
          description: "Ballots and campaigns",
          icon: Flag,
        },
        {
          id: "eu-affairs",
          label: "EU affairs",
          description: "Brussels and legislation",
          icon: Globe2,
        },
      ]}
      value={value}
      onChange={setValue}
    />
  );
}

function SelectableTopicCardDemo() {
  const [value, setValue] = useState<readonly string[]>(["democracy"]);
  const id = "democracy";

  return (
    <SelectableTopicCard
      initial="D"
      title="Democracy & trust"
      description="Voting, institutions, public debate"
      selected={isStringInSelection(value, id)}
      onPress={() => setValue((prev) => toggleStringInSelection(prev, id))}
    />
  );
}

function SelectableTopicListDemo() {
  const [value, setValue] = useState<readonly string[]>([]);

  return (
    <SelectableTopicList
      eyebrow="Go deeper"
      blurb="Stacked topic cards — same row primitive as a single card."
      items={[
        {
          id: "democracy",
          title: "Democracy & trust",
          description: "Voting, institutions, public debate",
          initial: "D",
        },
        {
          id: "climate",
          title: "Climate & justice",
          description: "Environment, energy, inequality",
          initial: "C",
        },
        {
          id: "housing",
          title: "Housing & planning",
          description: "Rent, zoning, public space",
          initial: "H",
        },
      ]}
      value={value}
      onChange={setValue}
    />
  );
}

/**
 * Default-exported screen registered with the UI Kit stack as `selection`.
 */
export default function SelectionScreen() {
  const pillRows: DemoRow[] = useMemo(
    () => [
      {
        key: "pill",
        name: "Pill",
        summary: (
          <Description>
            Compact capsule — <Code>muted</Code> for static badges,{" "}
            <Code>ghost</Code> / <Code>primary</Code> for pressable chips.
            Pass <Code>selected</Code> to flip between action variants.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Pill variant="muted">Optional</Pill>`}</Code>
            {" · "}
            <Code>{`<Pill selected={on} onPress={toggle}>Label</Pill>`}</Code>
          </Caption>
        ),
        samples: <PillDemo />,
      },
      {
        key: "pill-group",
        name: "SelectablePillGroup",
        summary: (
          <Description>
            Controlled multi-select built from <Code>Cluster</Code> +{" "}
            <Code>Pill</Code>. Use when options are short labels that should
            wrap across rows.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<SelectablePillGroup options={[{ id, label }]} value={ids} onChange={setIds} />`}</Code>
          </Caption>
        ),
        samples: <SelectablePillGroupDemo />,
      },
    ],
    [],
  );

  const checklistRows: DemoRow[] = useMemo(
    () => [
      {
        key: "checklist",
        name: "SelectableChecklist",
        summary: (
          <Description>
            Icon + label + description inside a <Code>Card</Code>, using{" "}
            <Code>DrawerItem</Code> rows with check accessories. Use when each
            option needs a one-line subtitle.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<SelectableChecklist items={[{ id, label, icon }]} value={ids} onChange={setIds} />`}</Code>
          </Caption>
        ),
        samples: <SelectableChecklistDemo />,
      },
    ],
    [],
  );

  const topicRows: DemoRow[] = useMemo(
    () => [
      {
        key: "topic-card",
        name: "SelectableTopicCard",
        summary: (
          <Description>
            One pressable topic row — leading initial tile, title, description,
            and a check or empty ring. Compose manually when you need a custom
            list layout; otherwise prefer <Code>SelectableTopicList</Code>.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<SelectableTopicCard initial="D" title="..." selected={on} onPress={toggle} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.stretch}>
            <SelectableTopicCardDemo />
          </View>
        ),
      },
      {
        key: "topic-list",
        name: "SelectableTopicList",
        summary: (
          <Description>
            Eyebrow + stacked <Code>SelectableTopicCard</Code> rows. Use when each
            option needs a title and a short description block.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<SelectableTopicList items={[{ id, title, description, initial }]} value={ids} onChange={setIds} />`}</Code>
          </Caption>
        ),
        samples: <SelectableTopicListDemo />,
      },
    ],
    [],
  );

  return (
    <Page>
      <Lede>
        Controlled multi-select families for string ids. Parent screens own{" "}
        <Code>value</Code> and <Code>onChange</Code>; each primitive toggles
        membership via <Code>toggleStringInSelection</Code>. Pick pills for
        compact labels, checklist rows when an icon and subtitle help scanning,
        topic cards when options need a title and two lines of copy.
      </Lede>

      <Section
        title="Pill & SelectablePillGroup"
        subtitle="Capsule chips — static badges, pressable selection, and controlled groups."
      >
        {pillRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            usage={row.usage}
            samples={row.samples}
            isLast={index === pillRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="SelectableChecklist"
        subtitle="Grouped DrawerItem rows inside a Card."
      >
        {checklistRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            usage={row.usage}
            samples={row.samples}
            isLast={index === checklistRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="SelectableTopicCard & list"
        subtitle="DisclosureCard-shaped topic rows — single card or stacked list."
      >
        {topicRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            usage={row.usage}
            samples={row.samples}
            isLast={index === topicRows.length - 1}
          />
        ))}
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  stretch: {
    width: "100%",
    alignSelf: "stretch",
  },
});
