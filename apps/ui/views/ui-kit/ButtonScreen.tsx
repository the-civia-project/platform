/**
 * UI Kit screen documenting the {@link Button} and {@link IconButton} controls. Both share
 * the same seven-variant palette (simple, inverted, primary, danger, ghost, full-ghost,
 * link); IconButton adds size and shape presets. Each section uses {@link ExampleBlock}
 * so the layout matches the other kit screens.
 */
import { useMemo, useState, type ReactNode } from "react";
import {
  ExternalLink,
  Heart,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import Button, {
  IconButton,
  type IconButtonSize,
} from "../../components/Button";
import ToggleButton from "../../components/ToggleButton";
import type { ButtonVariant } from "../../components/Button";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import {
  Caption,
  Code,
  Description,
  Label,
  Lede,
  Strong,
} from "../../components/Typography";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";

/**
 * Row data with a stable React `key`, used for both the Button and IconButton section lists.
 */
type DemoRow = ExampleBlockProps & { key: string };

/**
 * Default-exported screen registered with the UI Kit stack as `button`.
 */
export default function ButtonScreen() {
  const buttonRows: DemoRow[] = useMemo(
    () => [
      {
        key: "simple",
        name: "simple",
        summary: (
          <Description>
            Default style: solid black on light backgrounds and solid white
            on dark, with the label inverted for contrast. Use for routine,
            neutral actions where you don't need brand colour.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>
              {`Omit variant, or pass variant="simple". Add disabled={true} for lower opacity and no press handling.`}
            </Code>
          </Caption>
        ),
        samples: (
          <>
            <Button>Continue</Button>
            <Button disabled>Continue</Button>
          </>
        ),
      },
      {
        key: "inverted",
        name: "inverted",
        summary: (
          <Description>
            Strict colour-swap of <Code>simple</Code> &mdash; white-on-black
            flips to black-on-white &mdash; plus a hairline border so the
            pill stays visible against a matching card.
          </Description>
        ),
        description: (
          <Description>
            Unlike <Code>ghost</Code> the fill is opaque, so anything behind
            the button is masked rather than bleeding through. Use for
            affordances that float over body content (a post's overflow
            menu, a card's edit pill, a media overlay action) where
            transparency would let underlying text wash through the chrome.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`variant="inverted" | disabled={true}`}</Code>
          </Caption>
        ),
        samples: (
          <>
            <Button variant="inverted">Continue</Button>
            <Button variant="inverted" disabled>
              Continue
            </Button>
          </>
        ),
      },
      {
        key: "primary",
        name: "primary",
        summary: (
          <Description>
            <Strong>Blue fill</Strong> with white label &mdash; the main
            call-to-action on a screen. Reserve it for one primary path
            (submit, sign in, confirm) so it stays visually dominant.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`variant="primary" | disabled={true}`}</Code>
          </Caption>
        ),
        samples: (
          <>
            <Button variant="primary">Save</Button>
            <Button variant="primary" disabled>
              Save
            </Button>
          </>
        ),
      },
      {
        key: "danger",
        name: "danger",
        summary: (
          <Description>
            Red fill for destructive or irreversible operations (delete,
            remove account, discard without saving). Pair with clear copy
            and confirmations; do not use for ordinary negative actions
            like &ldquo;Cancel&rdquo;.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`variant="danger" | disabled={true}`}</Code>
          </Caption>
        ),
        samples: (
          <>
            <Button variant="danger">Delete account</Button>
            <Button variant="danger" disabled>
              Delete account
            </Button>
          </>
        ),
      },
      {
        key: "ghost",
        name: "ghost",
        summary: (
          <Description>
            Transparent background with a hairline border &mdash; low
            emphasis compared to <Code>simple</Code>. Use for secondary
            actions on busy surfaces, filter toggles, or &ldquo;learn
            more&rdquo; where a filled button would compete with primary.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>
              {`variant="ghost" | disabled={true} (same outline and colors, dimmed with opacity)`}
            </Code>
          </Caption>
        ),
        samples: (
          <>
            <Button variant="ghost">Edit</Button>
            <Button variant="ghost" disabled>
              Edit
            </Button>
          </>
        ),
      },
      {
        key: "full-ghost",
        name: "full-ghost",
        summary: (
          <Description>
            No fill, no border &mdash; just the label in the theme
            foreground colour. Reserve for the lowest-emphasis inline
            actions: <Code>Cancel</Code> next to a primary{" "}
            <Code>Save</Code>, dialog dismissals, or <Code>Skip</Code> on
            onboarding screens.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`variant="full-ghost" | disabled={true}`}</Code>
          </Caption>
        ),
        samples: (
          <>
            <Button variant="full-ghost">Cancel</Button>
            <Button variant="full-ghost" disabled>
              Cancel
            </Button>
          </>
        ),
      },
      {
        key: "link",
        name: "link",
        summary: (
          <Description>
            Brand-blue label with an underline and no chrome &mdash; reads
            as an inline hyperlink rather than a button.
          </Description>
        ),
        description: (
          <Description>
            Use for cross-page references inside body copy (
            <Code>Learn more</Code>, <Code>Privacy policy</Code>,{" "}
            <Code>Read the docs</Code>) where a filled or outlined button
            would over-state a navigation hint.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`variant="link" | disabled={true}`}</Code>
          </Caption>
        ),
        samples: (
          <>
            <Button variant="link">Learn more</Button>
            <Button variant="link" disabled>
              Learn more
            </Button>
          </>
        ),
      },
      {
        key: "toggle-basic",
        name: "ToggleButton (basic)",
        summary: (
          <Description>
            Single-select segmented control built from pill-shaped cells. Press
            updates the uncontrolled selection and calls <Code>onChange</Code>{" "}
            with the option&apos;s slug.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<ToggleButton options={[{ label: "One", slug: "one" }, { label: "Two", slug: "two" }]} defaultValue="one" onChange={(slug) => log("toggle", slug)} />`}</Code>
          </Caption>
        ),
        samples: (
          <ToggleButton
            variant="ghost"
            options={[
              { label: "One", slug: "one" },
              { label: "Two", slug: "two" },
              { label: "Three", slug: "three" },
            ]}
            defaultValue="one"
          />
        ),
      },
      {
        key: "toggle-multiple",
        name: "ToggleButton (multiple)",
        summary: (
          <Description>
            With <Code>multiple</Code>, each cell toggles independently — zero or
            more options can be active. Pressing an active cell turns it off.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<ToggleButton multiple defaultValue={["share", "liked"]} options={[...]} onChange={(slugs) => log("flags", slugs)} />`}</Code>
          </Caption>
        ),
        samples: (
          <ToggleButton
            multiple
            variant="ghost"
            maxColumnsPerRow={3}
            options={[
              { label: "Menu", slug: "menu" },
              { label: "Share", slug: "share" },
              { label: "Liked", slug: "liked" },
            ]}
            defaultValue={["share", "liked"]}
          />
        ),
      },
      {
        key: "toggle-many",
        name: "ToggleButton (many options)",
        summary: (
          <Description>
            Longer option lists wrap into multiple rows; only the outer corners
            of the top and bottom rows are rounded so the group still reads as
            one pill-shaped outline.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<ToggleButton maxColumnsPerRow={4} options={[{ label: "Mon", slug: "mon" }, ...]} />`}</Code>
          </Caption>
        ),
        samples: (
          <ToggleButton
            maxColumnsPerRow={4}
            options={[
              { label: "Mon", slug: "mon" },
              { label: "Tue", slug: "tue" },
              { label: "Wed", slug: "wed" },
              { label: "Thu", slug: "thu" },
              { label: "Fri", slug: "fri" },
              { label: "Sat", slug: "sat" },
              { label: "Sun", slug: "sun" },
            ]}
            defaultValue="mon"
          />
        ),
      },
      {
        key: "toggle-variants",
        name: "ToggleButton (variants)",
        summary: (
          <Description>
            Same options at each <Code>Button</Code> variant, one row per variant.
            Inactive cells use the group variant (with small normalisations);
            the selected cell promotes to <Code>primary</Code> except for{" "}
            <Code>simple</Code>, <Code>inverted</Code>, and <Code>danger</Code>.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<ToggleButton variant="ghost | simple | primary | ..." options={[...]} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.toggleVariantStack}>
            {(
              [
                "ghost",
                "simple",
                "inverted",
                "primary",
                "danger",
              ] as ButtonVariant[]
            ).map((variant) => (
              <View key={variant} style={styles.toggleVariantItem}>
                <Code>{variant}</Code>
                <ToggleButton
                  variant={variant}
                  options={[
                    { label: "A", slug: "a" },
                    { label: "B", slug: "b" },
                    { label: "C", slug: "c" },
                  ]}
                  defaultValue="b"
                />
              </View>
            ))}
          </View>
        ),
      },
    ],
    [],
  );

  const iconButtonRows: DemoRow[] = useMemo(() => {
    /** Wraps a sample with a small caption underneath; column width tracks the largest sample. */
    const valueColumn = (value: string, child: ReactNode) => (
      <View style={styles.sampleColumn}>
        {child}
        <Code>{value}</Code>
      </View>
    );

    return [
      {
        key: "variant",
        name: "variant",
        summary: (
          <Description>
            Same seven-variant palette as <Code>Button</Code> applied to a
            square icon target, with <Code>full-ghost</Code> as the default
            so toolbar / nav icons stay quiet.
          </Description>
        ),
        description: (
          <Description>
            Promote to <Code>simple</Code> / <Code>primary</Code> when the
            press is the main action of a card or modal, or to{" "}
            <Code>inverted</Code> when the button floats over body content
            and needs an opaque fill (this is the variant <Code>Post</Code>
            {" "}uses for its overflow menu). <Code>link</Code> drops the
            underline (no label) and just tints the icon brand-blue.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<IconButton icon={Heart} variant="simple | inverted | primary | danger | ghost | full-ghost | link" accessibilityLabel="..." />  // default full-ghost`}</Code>
          </Caption>
        ),
        samples: (
          <>
            {valueColumn(
              "simple",
              <IconButton
                icon={Heart}
                variant="simple"
                accessibilityLabel="Favourite (simple)"
              />,
            )}
            {valueColumn(
              "inverted",
              <IconButton
                icon={MoreVertical}
                variant="inverted"
                shape="round"
                accessibilityLabel="Post options (inverted)"
              />,
            )}
            {valueColumn(
              "primary",
              <IconButton
                icon={Plus}
                variant="primary"
                accessibilityLabel="Add (primary)"
              />,
            )}
            {valueColumn(
              "danger",
              <IconButton
                icon={Trash2}
                variant="danger"
                accessibilityLabel="Delete (danger)"
              />,
            )}
            {valueColumn(
              "ghost",
              <IconButton
                icon={Search}
                variant="ghost"
                accessibilityLabel="Search (ghost)"
              />,
            )}
            {valueColumn(
              "full-ghost",
              <IconButton
                icon={MoreHorizontal}
                variant="full-ghost"
                accessibilityLabel="More options (full-ghost)"
              />,
            )}
            {valueColumn(
              "link",
              <IconButton
                icon={ExternalLink}
                variant="link"
                accessibilityLabel="Open external link (link)"
              />,
            )}
          </>
        ),
      },
      {
        key: "size",
        name: "size",
        summary: (
          <Description>
            Square side length picked from the preset scale &mdash;{" "}
            <Code>sm</Code> 32px, <Code>md</Code> 40px (default),{" "}
            <Code>lg</Code> 48px. The inner icon is about half the box, so
            sizes scale together. Use <Code>sm</Code> for dense toolbars
            and <Code>lg</Code> for primary FAB-style actions.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<IconButton icon={Heart} size="sm | md | lg" accessibilityLabel="..." />`}</Code>
          </Caption>
        ),
        samples: (
          <>
            {(["sm", "md", "lg"] as IconButtonSize[]).map((size) =>
              valueColumn(
                size,
                <IconButton
                  key={size}
                  icon={Heart}
                  variant="simple"
                  size={size}
                  accessibilityLabel={`Favourite at ${size}`}
                />,
              ),
            )}
          </>
        ),
      },
      {
        key: "shape",
        name: "shape",
        summary: (
          <Description>
            <Code>rounded</Code> (default) keeps the button a soft square
            with a corner radius scaled to ~25% of its side, matching{" "}
            <Code>Avatar</Code>'s rounded preset. <Code>round</Code> clips
            to a full circle &mdash; the right pick for floating action
            buttons and close-style affordances.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<IconButton icon={X} shape="rounded | round" accessibilityLabel="..." />  // default rounded`}</Code>
          </Caption>
        ),
        samples: (
          <>
            {valueColumn(
              "rounded",
              <IconButton
                icon={X}
                variant="ghost"
                shape="rounded"
                accessibilityLabel="Close (rounded)"
              />,
            )}
            {valueColumn(
              "round",
              <IconButton
                icon={X}
                variant="ghost"
                shape="round"
                accessibilityLabel="Close (round)"
              />,
            )}
          </>
        ),
      },
      {
        key: "disabled",
        name: "disabled",
        summary: (
          <Description>
            Same chrome at lower opacity, with press handling removed
            &mdash; matches <Code>Button</Code>'s disabled treatment so the
            two controls feel consistent when used together in a toolbar.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<IconButton icon={Plus} variant="primary" disabled accessibilityLabel="..." />`}</Code>
          </Caption>
        ),
        samples: (
          <>
            {valueColumn(
              "enabled",
              <IconButton
                icon={Plus}
                variant="primary"
                accessibilityLabel="Add"
              />,
            )}
            {valueColumn(
              "disabled",
              <IconButton
                icon={Plus}
                variant="primary"
                disabled
                accessibilityLabel="Add (disabled)"
              />,
            )}
          </>
        ),
      },
    ];
  }, []);

  return (
    <Page>
      <Lede>
        Two related pressables. <Code>Button</Code> is the labelled pill &mdash;
        children render as text inside a rounded-pill background, with no
        intrinsic padding so the label drives the width. <Code>IconButton</Code>{" "}
        is its square sibling for icon-only actions: same seven variants
        (simple, inverted, primary, danger, ghost, full-ghost, link), plus a
        size scale and a rounded/round shape. <Code>Button</Code> defaults to{" "}
        <Code>simple</Code>; <Code>IconButton</Code> defaults to{" "}
        <Code>full-ghost</Code> because icon targets usually live in toolbars
        where heavy chrome over-states the action. Both dim to 45% on{" "}
        <Code>disabled</Code> and stop calling press handlers.
      </Lede>

      <Section
        title="Button"
        subtitle="Labelled pill and ToggleButton -- one block per variant and layout."
      >
        {buttonRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === buttonRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="IconButton"
        subtitle="Square icon-only sibling -- variant, size, shape, and disabled state."
      >
        {iconButtonRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === iconButtonRows.length - 1}
          />
        ))}
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  sampleColumn: {
    width: 80,
    alignItems: "center",
    gap: 8,
  },
  toggleVariantStack: {
    alignSelf: "stretch",
    gap: 16,
  },
  toggleVariantItem: {
    alignSelf: "stretch",
    gap: 8,
  },
});
