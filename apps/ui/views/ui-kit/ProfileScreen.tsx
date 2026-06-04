/**
 * UI Kit screen for the people-row primitives: {@link Avatar} (the building block) and
 * {@link Profile} (the composition on top of it). Two sections -- one per component --
 * each with one block per prop or variant. Sample images come from DiceBear's Avataaars
 * endpoint, keyed by a stable seed.
 */
import { useMemo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Avatar, {
  AVATAR_DIM_PX,
  AVATAR_SIZE_NAMES,
  type AvatarSize,
} from "../../components/Avatar";
import Profile from "../../components/Profile";
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
import { randomAvatar } from "../../core/demo/random-avatar";

/** Row data with a stable React `key`, used for both the Avatar and Profile section lists. */
type DemoRow = ExampleBlockProps & { key: string };

/**
 * Default-exported screen registered with the UI Kit stack as `profile`.
 */
export default function ProfileScreen() {
  const avatarRows: DemoRow[] = useMemo(() => {
    /** Wraps an avatar with a small caption underneath; column width tracks the largest sample. */
    const valueColumn = (value: string, child: ReactNode) => (
      <View style={styles.sampleColumn}>
        {child}
        <Code>{value}</Code>
      </View>
    );

    return [
      {
        key: "size",
        name: "size",
        summary: (
          <Description>
            Square side length picked from the preset scale &mdash;{" "}
            <Code>xs</Code> {AVATAR_DIM_PX.xs}px, <Code>sm</Code>{" "}
            {AVATAR_DIM_PX.sm}px, <Code>md</Code> {AVATAR_DIM_PX.md}px
            (default), <Code>lg</Code> {AVATAR_DIM_PX.lg}px,{" "}
            <Code>xl</Code> {AVATAR_DIM_PX.xl}px.
          </Description>
        ),
        description: (
          <Description>
            Use smaller presets for list rows and inline metadata, larger
            presets for profile headers and empty states.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Avatar source="..." size="xs | sm | md | lg | xl" />`}</Code>
          </Caption>
        ),
        samples: (
          <>
            {AVATAR_SIZE_NAMES.map((size: AvatarSize) =>
              valueColumn(
                size,
                <Avatar
                  source={randomAvatar("The Civia Platform")}
                  size={size}
                  accessibilityLabel={`The Civia Platform avatar at ${size}`}
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
            <Code>rounded</Code> (default) keeps the avatar a soft square
            with a corner radius scaled to ~25% of its side &mdash;
            friendly without looking like a person stamp.{" "}
            <Code>round</Code> clips to a full circle, which reads as a
            profile portrait and is the right pick for member lists,
            mentions, and account chrome.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Avatar source="..." shape="rounded | round" />  // default rounded`}</Code>
          </Caption>
        ),
        samples: (
          <>
            {valueColumn(
              "rounded",
              <Avatar
                source={randomAvatar("Alexandru")}
                shape="rounded"
                accessibilityLabel="Alexandru avatar, rounded"
              />,
            )}
            {valueColumn(
              "round",
              <Avatar
                source={randomAvatar("Tudor")}
                shape="round"
                accessibilityLabel="Tudor avatar, round"
              />,
            )}
          </>
        ),
      },
    ];
  }, []);

  const profileRows: DemoRow[] = useMemo(
    () => [
      {
        key: "default",
        name: "with location",
        summary: (
          <Description>
            Full profile &mdash; avatar, name, country flag, and a
            free-form location string. The flag is rendered from an ISO
            3166-1 alpha-2 code (e.g. <Code>"RO"</Code>,{" "}
            <Code>"US"</Code>, <Code>"JP"</Code>); the <Code>from</Code>{" "}
            text follows it on the second line.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Profile source="..." name="..." flag="RO" from="Bucharest, Romania" />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.profileStack}>
            <Profile
              source={randomAvatar("Aria")}
              name="Aria Popescu"
              flag="RO"
              from="Bucharest, Romania"
            />
            <Profile
              source={randomAvatar("Felix")}
              name="Felix Carter"
              flag="US"
              from="Brooklyn, NY"
            />
            <Profile
              source={randomAvatar("Luna")}
              name="Luna Tanaka"
              flag="JP"
              from="Tokyo, Japan"
            />
          </View>
        ),
      },
      {
        key: "size",
        name: "size",
        summary: (
          <Description>
            Density preset that scales every visual at once &mdash; avatar,
            name, meta, flag, and the avatar-to-text gap &mdash; so the
            row stays internally consistent across contexts.
          </Description>
        ),
        description: (
          <Description>
            <Code>md</Code> (default) is the screen-header sizing
            (48 / 17 / 14 / 16, gap 12). <Code>sm</Code> is the compact
            preset (32 / 14 / 12 / 12, gap 8) for comment authors and
            sidebar member chips. <Code>xs</Code> is the densest
            (24 / 13 / 11 / 11, gap 6), tuned for the embedded-post inset
            (the kit's <Code>PostRelation</Code> variants &mdash; repost,
            comment, and the Tier 5 cross-references) and other very
            cramped slots like inline mentions or autocomplete results.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Profile ... size="md | sm | xs" />  // default md`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.profileStack}>
            <Profile
              source={randomAvatar("Aria")}
              name="Aria Popescu"
              flag="RO"
              from="Bucharest, Romania"
              size="md"
            />
            <Profile
              source={randomAvatar("Aria")}
              name="Aria Popescu"
              flag="RO"
              from="Bucharest, Romania"
              size="sm"
            />
            <Profile
              source={randomAvatar("Aria")}
              name="Aria Popescu"
              flag="RO"
              from="Bucharest, Romania"
              size="xs"
            />
          </View>
        ),
      },
      {
        key: "inline",
        name: "inline",
        summary: (
          <Description>
            Forces the single-line layout: name, flag, and (if present){" "}
            <Code>from</Code> all ride on one row instead of stacking the
            location underneath the name.
          </Description>
        ),
        description: (
          <Description>
            Layout-only &mdash; never visibility: omit <Code>from</Code>{" "}
            if you want it gone. Orthogonal to <Code>size</Code> too, so
            any density works. The samples render the same Aria record at{" "}
            <Code>md</Code> and <Code>xs</Code> with <Code>inline</Code>{" "}
            on; Bucharest stays in view, just packed tighter against the
            flag. <Code>xs</Code> + <Code>inline</Code> is exactly the
            shape every <Code>PostRelation</Code> variant (repost,
            comment, ...) uses for the embedded author row.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Profile ... from="..." inline />  // one row: name + flag + from`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.profileStack}>
            <Profile
              source={randomAvatar("Aria")}
              name="Aria Popescu"
              flag="RO"
              from="Bucharest, Romania"
              inline
            />
            <Profile
              source={randomAvatar("Aria")}
              name="Aria Popescu"
              flag="RO"
              from="Bucharest, Romania"
              size="xs"
              inline
            />
          </View>
        ),
      },
      {
        key: "with-handle",
        name: "with handle",
        summary: (
          <Description>
            Full identity including a canonical <Code>@handle</Code> on its
            own line (muted monospace via <Code>Code</Code>) between the
            display name and the flag / location row.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Profile source="..." name="..." handle="aria.popescu" flag="RO" from="..." />`}</Code>
          </Caption>
        ),
        samples: (
          <Profile
            source={randomAvatar("Aria")}
            name="Aria Popescu"
            handle="aria.popescu"
            flag="RO"
            from="Bucharest, Romania"
          />
        ),
      },
      {
        key: "no-from",
        name: "without location",
        summary: (
          <Description>
            Same row, with <Code>from</Code> omitted. The second line is
            dropped and the flag moves inline at the end of the name
            &mdash; use this when you have the country but not a specific
            city, or when location is intentionally private.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Profile source="..." name="..." flag="DE" />  // from omitted`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.profileStack}>
            <Profile
              source={randomAvatar("Ren")}
              name="Ren Müller"
              flag="DE"
            />
            <Profile
              source={randomAvatar("Pixel")}
              name="Pixel Hayes"
              flag="GB"
            />
          </View>
        ),
      },
    ],
    [],
  );

  return (
    <Page>
      <Lede>
        Avatar and Profile are the people-row primitives. <Code>Avatar</Code>{" "}
        is the building block &mdash; a cached remote image at one of five preset
        sizes, with rounded or full-circle outline and a theme-contrasting
        fill so transparent source images stay legible.{" "}
        <Code>Profile</Code> composes it with a name and a country flag (PNG
        via <Code>react-native-country-flag</Code>) plus an optional location
        string, ships in three density presets via <Code>size</Code>{" "}
        (<Code>md</Code> for screen headers, <Code>sm</Code> for comment
        authors and sidebar member chips, <Code>xs</Code> for very cramped
        slots like quoted posts, inline mentions, and autocomplete), and
        accepts an <Code>inline</Code> flag that collapses the row to a
        single line &mdash; name, flag, and any <Code>from</Code> sit together
        rather than stacking. Both axes are orthogonal, so callers can mix
        any density with either layout. Sample images come from{" "}
        <Code>api.dicebear.com</Code>'s Avataaars style; pass any seed to
        get a stable cartoon back.
      </Lede>

      <Section
        title="Avatar"
        subtitle="Cached image with size and shape presets."
      >
        {avatarRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === avatarRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="Profile"
        subtitle="Avatar + name + flag, with an optional location line."
      >
        {profileRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === profileRows.length - 1}
          />
        ))}
      </Section>
    </Page>
  );
}

const styles = StyleSheet.create({
  sampleColumn: {
    width: 112,
    alignItems: "center",
    gap: 8,
  },
  profileStack: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "column",
    gap: 16,
  },
});
