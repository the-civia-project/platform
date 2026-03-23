/**
 * UI Kit screen for the bottom-sheet {@link Drawer} primitive and the matching
 * {@link DrawerItem} row. Each block has a trigger sample that the visitor can
 * tap to see the live drawer slide up; the drawers themselves are lifted to
 * the page root (still inside JSX, but outside any example block) because
 * `Modal` renders top-level regardless of where it appears in the tree.
 */
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Bell,
  BellOff,
  Bookmark,
  Eye,
  EyeOff,
  Flag,
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react-native";
import Button from "../../components/Button";
import { Drawer, DrawerItem } from "../../components/Drawer";
import { Page } from "../../components/Page";
import { Section } from "../../components/Section";
import {
  Caption,
  Code,
  Description,
  Label,
  Lede,
  Text,
} from "../../components/Typography";
import { useTheme } from "../../components/use-theme";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";

/** Row data with a stable React `key`, used for both the Drawer and DrawerItem sections. */
type DemoRow = ExampleBlockProps & { key: string };

/** Languages used by the single-select picker sample below. */
type DemoLanguage = "en" | "es" | "fr" | "ro";
const LANGUAGES: { code: DemoLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ro", label: "Română" },
];

/**
 * Default-exported screen registered with the UI Kit stack as `drawer`.
 */
export default function DrawerScreen() {
  // One open-state per demo -- each block has its own trigger so the visitor
  // can compare patterns side by side without one demo leaking into another.
  // `statsOpen` powers the "with footer actions" demo (informational sheet
  // with utility footer actions); `confirmOpen` is the destructive-item
  // destination so the kit still shows a real destructive flow when the
  // red row in the DrawerItem section is tapped.
  const [basicOpen, setBasicOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [language, setLanguage] = useState<DemoLanguage>("en");

  // Lucide icons render with whatever `color` we pass; the kit's `Text`
  // already auto-themes, so the only piece we need to theme manually is
  // the metric icon's stroke colour. `fgMuted` is the kit's soft neutral --
  // sits between body copy and hairline borders, the right register for a
  // glyph that's context, not content.
  const theme = useTheme();
  const statIconColor = theme.fgMuted;

  const drawerRows: DemoRow[] = useMemo(
    () => [
      {
        key: "default",
        name: "default",
        summary: (
          <Description>
            Bottom sheet with a <Code>title</Code>, a <Code>subtitle</Code>
            , and free-form body content. The X, the backdrop tap, and the
            Android back button all call <Code>onClose</Code>.
          </Description>
        ),
        description: (
          <Description>
            The parent owns the <Code>open</Code> flag and flips it back in
            response to <Code>onClose</Code>. Mounted while closed only
            during the slide-out animation &mdash; once that completes the
            underlying <Code>Modal</Code> unmounts, so the drawer has no
            runtime cost when hidden.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Drawer open={open} onClose={...} title="..." subtitle="...">{body}</Drawer>`}</Code>
          </Caption>
        ),
        samples: (
          <Button onPress={() => setBasicOpen(true)}>Open drawer</Button>
        ),
      },
      {
        key: "footer",
        name: "with footer actions",
        summary: (
          <Description>
            Informational pattern: the <Code>footer</Code> slot is a
            generic row, so it accepts any shape your flow needs &mdash;
            here two utility actions sharing the row equally.
          </Description>
        ),
        description: (
          <Description>
            Copy summary renders as <Code>full-ghost</Code>, Share insights
            as <Code>primary</Code>. The body is content-driven (a compact
            metric list rather than prose), and the header X stays on as
            the canonical dismiss; the footer carries side-utilities, not
            commit/cancel. Footer sits above the safe-area inset, so it
            doesn't slide under the home indicator on iOS.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Drawer ... footer={<><Button variant="full-ghost">Copy summary</Button><Button variant="primary">Share insights</Button></>} />`}</Code>
          </Caption>
        ),
        samples: (
          <Button variant="primary" onPress={() => setStatsOpen(true)}>
              View post statistics&hellip;
          </Button>
        ),
      },
    ],
    [],
  );

  const itemRows: DemoRow[] = useMemo(
    () => [
      {
        key: "action-sheet",
        name: "action sheet",
        summary: (
          <Description>
            Stack <Code>DrawerItem</Code>s inside a <Code>Drawer</Code>
            body to build the post-overflow / share-sheet pattern.
          </Description>
        ),
        description: (
          <Description>
            Each row is a 48px minimum tap target with an optional{" "}
            <Code>icon</Code>, <Code>label</Code>, optional{" "}
            <Code>description</Code>, and an optional{" "}
            <Code>accessory</Code> on the right. Pair with a destructive
            item for moderation flows &mdash; see the next block.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<DrawerItem icon={Bookmark} label="Save" description="Bookmarks live in your library." onPress={...} />`}</Code>
          </Caption>
        ),
        samples: (
          <Button
            variant="full-ghost"
            onPress={() => setActionsOpen(true)}
          >
            Open post options
          </Button>
        ),
      },
      {
        key: "destructive",
        name: "destructive",
        summary: (
          <Description>
            Pass <Code>destructive</Code> to render a row in the red
            foreground used by the <Code>danger</Code> button variant.
            Reserve it for irreversible actions (Delete, Sign out, Block,
            Report).
          </Description>
        ),
        description: (
          <Description>
            Mirror the colour onto the icon and the right-side accessory
            so the tone reads end-to-end. The "destructive" sample is also
            included in the action-sheet preview above (Report row at the
            bottom).
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<DrawerItem icon={Trash2} label="Delete post" destructive onPress={...} />`}</Code>
          </Caption>
        ),
        samples: (
          <View style={styles.itemSample}>
            <DrawerItem
              icon={Trash2}
              label="Delete post"
              description="Removes this post from your timeline."
              destructive
              onPress={() => setConfirmOpen(true)}
            />
          </View>
        ),
      },
      {
        key: "single-select",
        name: "single select",
        summary: (
          <Description>
            Set <Code>accessory="check"</Code> on the currently-selected
            row to build a single-select picker. The parent holds the
            selected value.
          </Description>
        ),
        description: (
          <Description>
            Tapping a row updates the selection and (typically) closes the
            drawer. The picker below remembers its current selection
            &mdash; open it, change the language, and re-open to see the
            check land on the new row.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<DrawerItem label="English" accessory={isSelected ? "check" : "none"} onPress={...} />`}</Code>
          </Caption>
        ),
        samples: (
          <Button variant="ghost" onPress={() => setPickerOpen(true)}>
            Language &middot;{" "}
            {LANGUAGES.find((l) => l.code === language)?.label ?? "--"}
          </Button>
        ),
      },
    ],
    [language],
  );

  return (
    <Page>
      <Lede>
        <Code>Drawer</Code> is the kit's bottom-sheet modal &mdash; a slide-up
        surface for transient panels that don't deserve a full screen. The
        sheet's height tracks its content (capped at ~85% of the viewport),
        the backdrop fades in independently of the slide, and the parent
        owns the <Code>open</Code> flag while the drawer manages its own
        mount lifecycle so the slide-out plays cleanly. Pair the container
        with the matching <Code>DrawerItem</Code> for menu and picker
        patterns: each row is a 48px tap target with optional leading icon,
        description line, and a chevron-or-check accessory, plus a{" "}
        <Code>destructive</Code> variant for delete/block-style actions.
        Animations run on the native thread via React Native's built-in{" "}
        <Code>Animated</Code> (with <Code>useNativeDriver: true</Code>), so
        no runtime dependency on Reanimated.
      </Lede>

      <Section
        title="Drawer"
        subtitle="Bottom-sheet container -- slide animation, backdrop, optional header and footer."
      >
        {drawerRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === drawerRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="DrawerItem"
        subtitle="Tappable menu row for the drawer body -- icon, label, description, accessory."
      >
        {itemRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === itemRows.length - 1}
          />
        ))}
      </Section>

      {/*
        The four live drawers powering the trigger samples above. They live at
        page level (not inside the example blocks) because `Modal` renders
        top-level regardless of placement, and lifting them here keeps each
        drawer's body easy to scan. Each one mounts/unmounts based on its own
        open flag.
      */}

      <Drawer
        open={basicOpen}
        onClose={() => setBasicOpen(false)}
        title="What is this?"
        subtitle="A live preview of the default Drawer shape."
      >
        <Text style={styles.paragraph}>
          A bottom sheet with a title, a subtitle, and arbitrary body content.
          Tap the X, tap the backdrop, or press the device back button to
          dismiss &mdash; the slide-out plays before the modal unmounts.
        </Text>
        <Text style={styles.paragraph}>
          The kit's Drawer is intentionally unopinionated about the body
          slot. Pass plain text, a column of {`<DrawerItem>`}s, a small
          form, or anything else; the sheet sizes to whatever you put in it.
        </Text>
      </Drawer>

      <Drawer
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        title="Post statistics"
        subtitle="Aria Popescu | 2 days ago"
        footer={
          <>
            <View style={styles.footerColumn}>
              <Button
                variant="full-ghost"
                onPress={() => setStatsOpen(false)}
              >
                Copy summary
              </Button>
            </View>
            <View style={styles.footerColumn}>
              <Button
                variant="primary"
                onPress={() => setStatsOpen(false)}
              >
                Share insights
              </Button>
            </View>
          </>
        }
      >
        {/*
          Compact metric list. Five rows, each an icon + label on the left
          and a right-aligned value, mirroring the kind of read-out you'd
          see on an analytics panel. Static numbers are fine here -- the
          point of the demo is the drawer shape, not real data.
        */}
        <View style={styles.statList}>
          <View style={styles.statRow}>
            <Eye size={20} color={statIconColor} strokeWidth={1.75} />
            <Text style={styles.statLabel}>Impressions</Text>
            <Text style={styles.statValue}>1,284</Text>
          </View>
          <View style={styles.statRow}>
            <Heart size={20} color={statIconColor} strokeWidth={1.75} />
            <Text style={styles.statLabel}>Likes</Text>
            <Text style={styles.statValue}>89</Text>
          </View>
          <View style={styles.statRow}>
            <MessageCircle
              size={20}
              color={statIconColor}
              strokeWidth={1.75}
            />
            <Text style={styles.statLabel}>Comments</Text>
            <Text style={styles.statValue}>14</Text>
          </View>
          <View style={styles.statRow}>
            <Repeat2 size={20} color={statIconColor} strokeWidth={1.75} />
            <Text style={styles.statLabel}>Re-posts</Text>
            <Text style={styles.statValue}>5</Text>
          </View>
          <View style={styles.statRow}>
            <UserPlus size={20} color={statIconColor} strokeWidth={1.75} />
            <Text style={styles.statLabel}>Profile visits</Text>
            <Text style={styles.statValue}>32</Text>
          </View>
        </View>
      </Drawer>

      <Drawer
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete this post?"
        subtitle="This action cannot be undone."
        hideCloseButton
        footer={
          <>
            <View style={styles.footerColumn}>
              <Button
                variant="full-ghost"
                onPress={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
            </View>
            <View style={styles.footerColumn}>
              <Button
                variant="danger"
                onPress={() => setConfirmOpen(false)}
              >
                Delete
              </Button>
            </View>
          </>
        }
      >
        <Text style={styles.paragraph}>
          The post and its engagement (likes, comments, re-posts) will be
          removed from your timeline immediately. Anyone who quoted it will
          see a "post removed" placeholder in their thread.
        </Text>
      </Drawer>

      <Drawer
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        title="Post options"
        subtitle="From Aria Popescu -- Bucharest, Romania"
      >
        <DrawerItem
          icon={Bookmark}
          label="Save"
          description="Bookmarks live in your library."
          onPress={() => setActionsOpen(false)}
        />
        <DrawerItem
          icon={Share2}
          label="Share"
          description="Send via Messages, Mail, or copy a link."
          onPress={() => setActionsOpen(false)}
        />
        <DrawerItem
          icon={muted ? Bell : BellOff}
          label={muted ? "Unmute notifications" : "Mute notifications"}
          description={
            muted
              ? "Resume receiving replies and reposts."
              : "Hide replies and reposts from this thread."
          }
          onPress={() => setMuted((m) => !m)}
        />
        <DrawerItem
          icon={UserMinus}
          label="Unfollow Aria"
          description="Keep the post; stop seeing future updates."
          onPress={() => setActionsOpen(false)}
        />
        <DrawerItem
          icon={Flag}
          label="Report"
          description="Send to moderation for review."
          destructive
          onPress={() => setActionsOpen(false)}
        />
      </Drawer>

      <Drawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Language"
        subtitle="Used across the app's UI strings."
      >
        {LANGUAGES.map(({ code, label }) => (
          <DrawerItem
            key={code}
            icon={code === language ? Eye : EyeOff}
            label={label}
            description={code.toUpperCase()}
            accessory={code === language ? "check" : "none"}
            onPress={() => {
              setLanguage(code);
              setPickerOpen(false);
            }}
          />
        ))}
      </Drawer>
    </Page>
  );
}

const styles = StyleSheet.create({
  /**
   * Paragraph spacing inside drawer bodies. Mirrors `Description`'s line height
   * so prose lines up visually with kit body copy elsewhere.
   */
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  /**
   * Each footer button claims half the row via `flex: 1`. Inline because the
   * `Drawer`'s footer is a generic row container (`flexDirection: "row"`),
   * not a two-column shell -- wrappers here keep the buttons equally sized.
   */
  footerColumn: {
    flex: 1,
  },
  /**
   * Wrapper for the standalone destructive DrawerItem sample. Mirrors the
   * drawer's body padding so the row reads the same in the kit as it does
   * inside an actual sheet.
   */
  itemSample: {
    width: "100%",
    paddingHorizontal: 4,
  },
  /**
   * Vertical stack for the post-stats drawer body. The list is the whole
   * body, so there's no extra `marginBottom` like {@link paragraph} uses --
   * the drawer's own footer (or padding, when the footer is absent)
   * already provides the trailing breathing room.
   */
  statList: {
    flexDirection: "column",
  },
  /**
   * One metric row: icon | label | right-aligned value. `gap: 14` matches
   * {@link DrawerItem}'s leading-icon spacing so the two rhythms line up
   * if both shapes ever end up in the same sheet.
   */
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  /**
   * Label sits in the flexible middle column and slightly fades to keep
   * the visual focus on the right-aligned numeric value.
   */
  statLabel: {
    flex: 1,
    fontSize: 15,
    opacity: 0.72,
  },
  /**
   * The headline number. Slightly larger and bolder than the label so
   * the row reads value-first when the visitor's eye lands on it.
   */
  statValue: {
    fontSize: 17,
    fontWeight: "600",
  },
});
