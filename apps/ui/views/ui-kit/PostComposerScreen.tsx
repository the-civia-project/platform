/**
 * UI Kit screen documenting the
 * {@link "../../components/PostComposer".PostComposer} primitive. The
 * composer ships a controlled {@link PostDraft} model and projects 1:1
 * onto the rendered {@link "../../components/Post".Post}, so this
 * screen leans on that symmetry: every block holds its own draft via
 * `useState`, and the trickier blocks render the matching live
 * `<Post>` preview alongside the composer to prove the projection is
 * faithful.
 *
 * Layout follows the kit's standard `Page` + `Section` + `ExampleBlock`
 * shape with one twist -- each example's draft state has to be hoisted
 * out of the row data and into the screen body, because `ExampleBlock`
 * rows are computed inside a `useMemo` that can't host hooks. The
 * sections below therefore declare a small helper component per demo
 * (one local draft per component) and the rows just reference them.
 */
import { useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Button from "../../components/Button";
import { Drawer } from "../../components/Drawer";
import { Page } from "../../components/Page";
import {
  addPictures,
  clearArchetype,
  clearMedia,
  emptyDraft,
  PostComposer,
  PostComposerPreview,
  withArchetype,
  withContent,
  withMedia,
  withPoll,
  withRelation,
  type PostDraft,
} from "../../components/PostComposer";
import type { PostArchetype } from "../../components/Post";
import { TextArea, TextInput } from "../../components/Input";
import type { PostPoll } from "../../components/Post/Poll";
import type { ProfileProps } from "../../components/Profile";
import { Section } from "../../components/Section";
import {
  Caption,
  Code,
  Description,
  Label,
  Lede,
  Strong,
  Text,
} from "../../components/Typography";
import { useDraftLinkExtraction } from "../../core/composer/use-draft-link-extraction";
import {
  ExampleBlock,
  type ExampleBlockProps,
} from "./components/ExampleBlock";

/** Row data with a stable React `key`, used by the per-section maps. */
type DemoRow = ExampleBlockProps & { key: string };

/**
 * Stand-in identity for the composer's author row. Hard-coded so every
 * demo on this screen reads with the same viewer; production code would
 * read this from auth state.
 */
const AUTHOR: ProfileProps = {
  source: "https://i.pravatar.cc/96?img=12",
  name: "Aria Popescu",
  flag: "RO",
};

/** Sample author for embedded posts -- different from {@link AUTHOR} so the inset reads as someone else. */
const EMBED_AUTHOR: ProfileProps = {
  source: "https://i.pravatar.cc/96?img=33",
  name: "Bogdan Ivanov",
  flag: "BG",
};

/**
 * Default-exported screen registered with the UI Kit stack as
 * `post-composer`.
 */
export default function PostComposerScreen() {
  const surfaceRows: DemoRow[] = useMemo(
    () => [
      {
        key: "default",
        name: "default",
        summary: (
          <Description>
            Mount the composer directly inside a column &mdash; no
            wrapping surface, no modal. The body{" "}
            <Code>TextArea</Code> auto-grows from its 3-row baseline as
            you type, so the composer starts compact and expands in
            place.
          </Description>
        ),
        description: (
          <Description>
            Controlled: the parent owns a <Code>PostDraft</Code> and
            feeds it back through <Code>value</Code> /{" "}
            <Code>onChange</Code>. The submit button is gated on{" "}
            <Code>isSubmittable(draft)</Code> &mdash; non-whitespace text,
            staged media, or a repost / comment embed all flip it
            enabled.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<PostComposer author={me} value={draft} onChange={setDraft} onSubmit={...} />`}</Code>
          </Caption>
        ),
        samples: <DefaultDemo />,
      },
      {
        key: "drawer",
        name: "in a Drawer",
        summary: (
          <Description>
            Modal bottom-sheet surface: open a <Code>Drawer</Code> and
            put the composer in its body. Submit closes the drawer; the
            backdrop tap dismisses it via the kit's standard{" "}
            <Code>Drawer</Code> wiring.
          </Description>
        ),
        description: (
          <Description>
            The composer never owns the modal &mdash; the caller does.
            That keeps the same primitive useful in a Drawer, a full
            screen, or a feed header without forking the component.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<Drawer open onClose={...}><PostComposer ... /></Drawer>`}</Code>
          </Caption>
        ),
        samples: <DrawerSurfaceDemo />,
      },
    ],
    [],
  );

  const mediaRows: DemoRow[] = useMemo(
    () => [
      {
        key: "link",
        name: "link",
        summary: (
          <Description>
            <Code>LinkMedia</Code> is staged automatically from URLs
            the user types in the body &mdash; there is no manual
            "attach link" affordance. The staged preview re-uses the
            same <Code>{`<LinkPreview>`}</Code> primitive the rendered
            post uses, so WYSIWYG.
          </Description>
        ),
        description: (
          <Description>
            Wired by the host via{" "}
            <Code>useDraftLinkExtraction({"{"} draft, onChange, resolve {"}"})</Code>:
            the hook watches the body for the first <Code>http</Code>{" "}
            / <Code>https</Code> URL, debounces, runs the resolver
            (<Code>useLinkResolver().resolve</Code> in product code),
            and stages the result as <Code>LinkMedia</Code>. The demo
            seeds the preview directly so the staged shape is visible
            without a network round-trip; try the default surface
            above to see the auto-extraction wired against a stubbed
            resolver.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`useDraftLinkExtraction({ draft, onChange: setDraft, resolve })`}</Code>
          </Caption>
        ),
        samples: <MediaDemo seeded="link" />,
      },
      {
        key: "image",
        name: "image",
        summary: (
          <Description>
            Single-photo attachment. Staged preview is a{" "}
            <Code>{`<Image>`}</Code> with the kit's default 16:9
            framing.
          </Description>
        ),
        description: (
          <Description>
            <Code>useImagePicker().pickPictures()</Code> wraps{" "}
            <Code>expo-image-picker</Code>'s system sheet; the demo
            seeds an example URL directly so visitors can see the
            staged shape without granting library access. One picked
            photo lands as <Code>image</Code>;{" "}
            <Code>addPictures()</Code> auto-promotes to{" "}
            <Code>gallery</Code> when a second is added.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`addPictures(draft, [picked])`}</Code>
          </Caption>
        ),
        samples: <MediaDemo seeded="image" />,
      },
      {
        key: "gallery",
        name: "gallery",
        summary: (
          <Description>
            Multi-photo attachment. The staged preview is a uniform
            3-column grid of square thumbnails with a per-image X
            overlay so users can drop one photo without losing the
            rest; the live <Code>Post</Code> preview shows the final
            grid layout.
          </Description>
        ),
        description: (
          <Description>
            <Code>useImagePicker().pickPictures()</Code> opens the
            system sheet in multi-select mode and{" "}
            <Code>addPictures()</Code> appends to whatever's already
            staged, capping the combined list at four. Drop to a
            single photo (via the per-tile X) and the draft demotes
            back to <Code>image</Code>.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`addPictures(draft, picked /* up to 4 */)`}</Code>
          </Caption>
        ),
        samples: <MediaDemo seeded="gallery" />,
      },
      {
        key: "mosaic",
        name: "mosaic",
        summary: (
          <Description>
            Vertical stack of mixed-aspect photos. Same editable
            3-column thumbnail grid as <Code>gallery</Code> &mdash;
            each tile carries its own X overlay; the live{" "}
            <Code>Post</Code> preview renders the real{" "}
            <Code>Mosaic</Code> layout.
          </Description>
        ),
        description: (
          <Description>
            Use when the photos have meaningfully different shapes
            (portrait + landscape) and the rendered post should
            preserve each tile's aspect rather than crop into a grid.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`withMedia(draft, { kind: "mosaic", images: [{ source, alt, aspectRatio }, ...] })`}</Code>
          </Caption>
        ),
        samples: <MediaDemo seeded="mosaic" />,
      },
      {
        key: "carousel",
        name: "carousel",
        summary: (
          <Description>
            Horizontal paged photo sequence with a <Code>Dots</Code>{" "}
            indicator. Same editable 3-column thumbnail grid as{" "}
            <Code>gallery</Code>; the live <Code>Post</Code> preview
            renders the real <Code>Carousel</Code> layout.
          </Description>
        ),
        description: (
          <Description>
            Reach for this when there are many photos and the user
            should be able to step through them rather than scroll a
            long vertical stack.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`withMedia(draft, { kind: "carousel", images: [...], aspectRatio: 1 })`}</Code>
          </Caption>
        ),
        samples: <MediaDemo seeded="carousel" />,
      },
      {
        key: "poll",
        name: "poll",
        summary: (
          <Description>
            Structured ballot tile. The composer's poll icon opens a{" "}
            <Code>Drawer</Code> that lets the host configure the
            question + options before staging; the rendered tile is a
            read-only paint (no <Code>onVotePress</Code>) so the
            composer's preview matches the eventual feed-row shape.
          </Description>
        ),
        description: (
          <Description>
            <Code>withPoll(draft, poll)</Code> stages a{" "}
            <Code>poll</Code> media variant verbatim &mdash; question,
            options, optional <Code>deadlineLabel</Code>, optional{" "}
            <Code>viewerVoteId</Code>. The real ballot pipeline
            (one-vote-per-identity, deadline enforcement, public-tally
            aggregation) lives upstream of the kit, same precedent{" "}
            <Code>video</Code> / <Code>audio</Code> follow.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`withPoll(draft, { question, options, deadlineLabel })`}</Code>
          </Caption>
        ),
        samples: <PollComposerDemo />,
      },
    ],
    [],
  );

  const embedRows: DemoRow[] = useMemo(
    () => [
      {
        key: "repost",
        name: "with repost relation",
        summary: (
          <Description>
            Stage a repost. The composer renders the original via the
            kit's <Code>EmbeddedPostInset</Code> with a "Reposted"
            header above the rail; the user's commentary lives in the
            body.
          </Description>
        ),
        description: (
          <Description>
            A bare repost without commentary is submittable &mdash; the
            embedded original carries the meaning. The composer doesn't
            surface a remove affordance on the embed because the embed
            was set by the host context.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`withRelation(draft, { kind: "repost", post: { author, content } })`}</Code>
          </Caption>
        ),
        samples: <EmbedDemo seeded="repost" />,
      },
      {
        key: "comment",
        name: "with comment relation",
        summary: (
          <Description>
            Stage a reply. Identical structure to the repost variant;
            the inset's header swaps to "Commented".
          </Description>
        ),
        description: (
          <Description>
            The two relation variants are mutually exclusive at the
            type level &mdash; the discriminated-union shape admits
            exactly one variant per draft, and{" "}
            <Code>withRelation</Code> just overwrites the slot, so
            staging a comment automatically discards a previously-set
            repost (and vice versa) without a separate clear step.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`withRelation(draft, { kind: "comment", post: { author, content } })`}</Code>
          </Caption>
        ),
        samples: <EmbedDemo seeded="comment" />,
      },
    ],
    [],
  );

  const archetypeRows: DemoRow[] = useMemo(
    () => [
      {
        key: "archetype-switch",
        name: "decree / testimony",
        summary: (
          <Description>
            Whole-post archetypes live on the draft&apos;s{" "}
            <Code>archetype</Code> field and project through{" "}
            <Code>draftToPostProps</Code> the same way{" "}
            <Code>PostProps.archetype</Code> drives the feed row: body copy
            and staged media are suppressed in favour of the teaser.{" "}
            <Code>withArchetype</Code> clears <Code>media</Code>; every
            media helper clears the archetype slot so the two stay mutually
            exclusive.
          </Description>
        ),
        description: (
          <Description>
            Product hosts typically expose this as a mode switch rather than
            a second attachment row; this block wires the pure helpers directly
            so the behaviour is visible without a product shell.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`withArchetype(draft, { kind: "decree", decree: { ... } })`}</Code>
            {" · "}
            <Code>clearArchetype(draft)</Code>
          </Caption>
        ),
        samples: <ArchetypeModeDemo />,
      },
    ],
    [],
  );

  const stateRows: DemoRow[] = useMemo(
    () => [
      {
        key: "submitting",
        name: "submitting",
        summary: (
          <Description>
            Pass <Code>submitting</Code> while a submit is in flight.
            The body, attachment row, and remove affordances dim, the
            submit button reads "Posting...", and presses are blocked
            so the optimistic state doesn't drift as the user keeps
            editing.
          </Description>
        ),
        description: (
          <Description>
            In production, the parent flips this from the{" "}
            <Code>useSubmitPost</Code> hook's{" "}
            <Code>submitting</Code> flag; this demo pins it on so the
            treatment is visible.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<PostComposer submitting ... />`}</Code>
          </Caption>
        ),
        samples: <StateDemo flavour="submitting" />,
      },
      {
        key: "error",
        name: "error",
        summary: (
          <Description>
            Pass <Code>error</Code> with a non-empty message to render
            a danger-tinted line below the action row. Distinct from
            per-field validation (which sits on the body{" "}
            <Code>TextArea</Code>'s own <Code>error</Code> slot) and
            reserved for the "submit failed" signal.
          </Description>
        ),
        description: (
          <Description>
            Pair with <Code>useSubmitPost</Code> so the error clears on
            the next <Code>submit</Code> call automatically; this demo
            pins the error string so the chrome stays visible.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<PostComposer error="Couldn't post just now. Try again." ... />`}</Code>
          </Caption>
        ),
        samples: <StateDemo flavour="error" />,
      },
      {
        key: "with-cancel",
        name: "with onCancel",
        summary: (
          <Description>
            Pass <Code>onCancel</Code> to expose a secondary{" "}
            <Code>ghost</Code> button to the left of submit. Use in
            modal / dedicated-screen surfaces where the caller wants an
            explicit dismissal.
          </Description>
        ),
        description: (
          <Description>
            Omit in inline-feed-top surfaces &mdash; the user just stops
            typing in those flows; a cancel button there reads as
            redundant.
          </Description>
        ),
        usage: (
          <Caption>
            <Label>API: </Label>
            <Code>{`<PostComposer onCancel={dismiss} ... />`}</Code>
          </Caption>
        ),
        samples: <StateDemo flavour="cancel" />,
      },
    ],
    [],
  );

  const previewRow: DemoRow = useMemo(
    () => ({
      key: "live-preview",
      name: "live preview",
      summary: (
        <Description>
          The composer's <Code>PostDraft</Code> projects 1:1 onto the
          rendered <Code>Post</Code> via{" "}
          <Code>draftToPostProps(draft, author)</Code>. Edit the
          composer below; the preview rerenders on every keystroke.
        </Description>
      ),
      description: (
        <Description>
          Use the standalone <Code>PostComposerPreview</Code> wrapper to
          avoid threading the adapter into every consumer; it accepts
          arbitrary{" "}
          <Code>{`Partial<PostProps>`}</Code> overrides via the{" "}
          <Code>overrides</Code> prop so callers can layer engagement /
          action props on the preview without affecting the draft.
        </Description>
      ),
      usage: (
        <Caption>
          <Label>API: </Label>
          <Code>{`<PostComposerPreview draft={draft} author={author} />`}</Code>
        </Caption>
      ),
      samples: <LivePreviewDemo />,
      isLast: true,
    }),
    [],
  );

  return (
    <Page>
      <Lede>
        <Code>PostComposer</Code> is the kit's post-creation primitive
        &mdash; a surface-agnostic composition that lets a user write
        prose, stage every <Code>PostMedia</Code> shape, embed a repost
        / reply, and submit the result. The composer is{" "}
        <Strong>controlled</Strong>: the parent owns a{" "}
        <Code>PostDraft</Code> and feeds it back through{" "}
        <Code>value</Code> / <Code>onChange</Code>; the pure helpers in{" "}
        <Code>./draft</Code> (<Code>withContent</Code>,{" "}
        <Code>withMedia</Code>, <Code>withRelation</Code>, ...)
        cover every common mutation. The primitive never owns its own
        outer modal, scroll container, or picker integration &mdash;
        pickers, link resolution, and submit live in{" "}
        <Code>core/composer/*</Code> and are wired in by the caller. The
        body <Code>TextArea</Code> auto-grows from its 3-row baseline
        as         the user types, so the same primitive sits compact at the
        top of a feed and expands in place into a full editor. The
        action row's <Strong>Preview</Strong> button opens a built-in
        drawer that renders the draft through <Code>Post</Code> so the
        user can sanity-check the final shape before submitting; for
        an always-on side-by-side projection pair with{" "}
        <Code>PostComposerPreview</Code> (or call{" "}
        <Code>draftToPostProps</Code> directly). Link previews are
        auto-extracted from the body text via{" "}
        <Code>useDraftLinkExtraction</Code> &mdash; there is no manual
        "attach link" affordance; the user types a URL and the
        preview stages itself once the debounce settles.
      </Lede>

      <Section
        title="Surfaces"
        subtitle="Drop the same primitive directly into a column or inside a Drawer."
      >
        {surfaceRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === surfaceRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="Media shapes"
        subtitle="One block per PostMedia variant -- staged preview re-uses the rendered post's primitives."
      >
        {mediaRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === mediaRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="Embeds"
        subtitle="Repost and comment relations -- read-only insets above the body."
      >
        {embedRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === embedRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="Archetype mode"
        subtitle="Decree and testimony replace commentary + media; helpers keep the draft aligned with PostProps."
      >
        {archetypeRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === archetypeRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="States"
        subtitle="submitting, error, cancel affordance."
      >
        {stateRows.map((row, index) => (
          <ExampleBlock
            key={row.key}
            name={row.name}
            summary={row.summary}
            description={row.description}
            usage={row.usage}
            samples={row.samples}
            isLast={index === stateRows.length - 1}
          />
        ))}
      </Section>

      <Section
        title="Live preview"
        subtitle="The draft renders straight back through <Post /> via draftToPostProps."
      >
        <ExampleBlock {...previewRow} />
      </Section>
    </Page>
  );
}

/* ----------------------------------------------------------------- *
 * Per-demo components. Each holds its own draft so a visitor can
 * type into one block without affecting another, matching the
 * pattern established in `InputScreen`. Kept local because each is
 * tied to a specific row of prose; lifting them would just add
 * indirection without a reuser.
 * ----------------------------------------------------------------- */

const SAMPLE_LINK = {
  url: "https://civia.eu/blog/composer-primitive",
  title: "Designing a surface-agnostic post composer",
  description:
    "What we learned shipping the same primitive into a Drawer, a full screen, and the top of a feed.",
  domain: "civia.eu",
  image: "https://picsum.photos/seed/composer-link/1200/675",
};

const SAMPLE_IMAGE = {
  source: "https://picsum.photos/seed/composer-image/1200/675",
  alt: "Sunlit rooftops over a cobblestoned plaza",
};

const SAMPLE_GALLERY = [
  {
    source: "https://picsum.photos/seed/composer-g1/800/600",
    alt: "Wooden desk with notebooks",
  },
  {
    source: "https://picsum.photos/seed/composer-g2/800/600",
    alt: "Cup of coffee on a stone table",
  },
  {
    source: "https://picsum.photos/seed/composer-g3/800/600",
    alt: "Window onto a courtyard garden",
  },
];

const SAMPLE_MOSAIC = [
  { ...SAMPLE_GALLERY[0], aspectRatio: 16 / 9 },
  { ...SAMPLE_GALLERY[1], aspectRatio: 1 },
  { ...SAMPLE_GALLERY[2], aspectRatio: 4 / 5 },
];

const SAMPLE_CAROUSEL = SAMPLE_GALLERY.map((g) => ({ ...g }));

const SAMPLE_EMBED_AUTHOR = EMBED_AUTHOR;
const SAMPLE_EMBED_CONTENT =
  "The kit's media primitives compose so cleanly that lifting the link preview took ten minutes and three small changes.";

const DEMO_ARCHETYPE_DECREE: PostArchetype = {
  kind: "decree",
  decree: {
    issuingBody: "City Council of Example",
    decreeNumber: "Decree 142/2026",
    title: "Temporary night-bus headway restoration",
    summary:
      "Sets a 20-minute evening headway on Route 22 until the fiscal year-end audit completes.",
    fullTextAttachmentLabel: "Full text (PDF, 8 pages)",
    signingAuthority: "Signed: Mayor, City of Example",
  },
};

const DEMO_ARCHETYPE_TESTIMONY: PostArchetype = {
  kind: "testimony",
  testimony: {
    witnessCapacity: "as expert witness (urban mobility)",
    eventDateLabel: "12 June 2026",
    locationLabel: "Council chamber",
    statement:
      "The headway data I submitted shows a 38% drop, not 40%; both figures appear on adjacent rows of the published spreadsheet.",
    citedEvidenceLabel: "Exhibit A: Ridership CSV (April 2026).",
  },
};

const ARC_MODE_POLL: PostPoll = {
  question: "Does staging a poll clear the archetype slot?",
  options: [
    { id: "arc-p1", label: "Yes — media wins", votes: 2 },
    { id: "arc-p2", label: "Show me", votes: 0 },
  ],
};

function DefaultDemo() {
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const pickIndex = useRef(0);
  useDraftLinkExtraction({ draft, onChange: setDraft, resolve: stubResolve });
  return (
    <View style={styles.composerWrap}>
      <PostComposer
        author={AUTHOR}
        value={draft}
        onChange={setDraft}
        onAddPictures={() => {
          const next = SAMPLE_PICTURE_REEL[pickIndex.current % SAMPLE_PICTURE_REEL.length];
          pickIndex.current += 1;
          setDraft((d) => addPictures(d, [next]));
        }}
      />
    </View>
  );
}

/**
 * Sample pool the {@link DefaultDemo}'s "Add pictures" stub draws
 * from. Each tap of the icon picks the next photo so visitors can
 * see {@link addPictures} promote `image` -> `gallery` -> capped
 * gallery without a real picker dialog.
 */
const SAMPLE_PICTURE_REEL = [SAMPLE_IMAGE, ...SAMPLE_GALLERY];

/**
 * Demo resolver used by the kit screen. The product wiring in{" "}
 * `views/Home.tsx` and `views/Compose.tsx` uses{" "}
 * `useLinkResolver().resolve`, which does a real client-side OG
 * fetch; for the kit screen we hand back a pre-canned preview so
 * the auto-extraction flow demoes without a network call.
 */
async function stubResolve(url: string) {
  return {
    url,
    title: "Sample link preview",
    description:
      "Auto-extracted from the composer body. Tap the X to dismiss; remove the URL and re-type to bring the preview back.",
    domain: safeDomain(url),
    image: SAMPLE_LINK.image,
  };
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "example.com";
  }
}

function DrawerSurfaceDemo() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  return (
    <View>
      <Button variant="primary" onPress={() => setOpen(true)}>
        Open composer drawer
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="New post"
        subtitle="The same primitive, dropped into the kit's Drawer."
      >
        <PostComposer
          author={AUTHOR}
          value={draft}
          onChange={setDraft}
          onSubmit={() => {
            setDraft(emptyDraft());
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </Drawer>
    </View>
  );
}

type MediaFlavour = "link" | "image" | "gallery" | "mosaic" | "carousel";

function MediaDemo({ seeded }: { seeded: MediaFlavour }) {
  const [draft, setDraft] = useState<PostDraft>(() => {
    switch (seeded) {
      case "link":
        return withMedia(
          withContent(emptyDraft(), "Worth a read this morning."),
          { kind: "link", preview: SAMPLE_LINK },
        );
      case "image":
        return withMedia(
          withContent(emptyDraft(), "A view from the studio."),
          { kind: "image", image: SAMPLE_IMAGE },
        );
      case "gallery":
        return withMedia(
          withContent(emptyDraft(), "Three pieces from this morning."),
          { kind: "gallery", images: SAMPLE_GALLERY },
        );
      case "mosaic":
        return withMedia(
          withContent(emptyDraft(), "Some shapes from the weekend."),
          { kind: "mosaic", images: SAMPLE_MOSAIC },
        );
      case "carousel":
        return withMedia(
          withContent(emptyDraft(), "Swipe through the set."),
          { kind: "carousel", images: SAMPLE_CAROUSEL, aspectRatio: 1 },
        );
    }
  });
  return (
    <View style={styles.composerWrap}>
      <PostComposer author={AUTHOR} value={draft} onChange={setDraft} />
    </View>
  );
}

/**
 * Demo for the composer's poll attachment flow. Renders the
 * composer with the poll icon wired through {@link AttachmentBar.onAddPoll},
 * which opens a small configuration {@link "../../components/Drawer".Drawer}
 * where the host edits the question + comma-separated options before
 * staging the result via {@link withPoll}.
 *
 * The drawer is intentionally minimal -- a single-line question field
 * and a multiline options field whose entries map 1:1 to
 * {@link PostPoll.options} -- because product code will wrap the
 * same drawer pattern with the appropriate identity-aware chrome
 * (formal vs informal poll, signing capacity, deadline picker, ...);
 * the kit demo proves the {@link "../../components/PostComposer".PostComposer.onAddPoll}
 * affordance round-trips through {@link withPoll}.
 */
function PollComposerDemo() {
  const [draft, setDraft] = useState<PostDraft>(() =>
    withContent(
      emptyDraft(),
      "What's the right next step on the community-centre proposal?",
    ),
  );
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState(
    "Where should the next neighbourhood town hall be hosted?",
  );
  const [optionsText, setOptionsText] = useState(
    "Old town library\nCommunity centre\nSchool auditorium",
  );
  const [deadline, setDeadline] = useState("Closes Friday 18:00");

  const stagePoll = () => {
    const labels = optionsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (!question.trim() || labels.length < 2) {
      // Guard against the empty / single-option draft; the kit doesn't
      // throw on bad data but the rendered tile would read as nonsense.
      // Product code would surface inline validation here.
      setOpen(false);
      return;
    }
    const poll: PostPoll = {
      question: question.trim(),
      options: labels.map((label, i) => ({
        id: `opt-${i}`,
        label,
        votes: 0,
      })),
      ...(deadline.trim() ? { deadlineLabel: deadline.trim() } : {}),
    };
    setDraft((d) => withPoll(d, poll));
    setOpen(false);
  };

  return (
    <View style={styles.composerWrap}>
      <PostComposer
        author={AUTHOR}
        value={draft}
        onChange={setDraft}
        onAddPoll={() => setOpen(true)}
      />
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Configure poll"
        subtitle="One option per line. Hit 'Attach poll' when you're happy."
      >
        <View style={styles.pollDrawerStack}>
          <TextInput
            label="Question"
            value={question}
            onChangeText={setQuestion}
            placeholder="What's the call to vote?"
          />
          <TextArea
            label="Options"
            value={optionsText}
            onChangeText={setOptionsText}
            placeholder={"Option one\nOption two\nOption three"}
            minRows={3}
            maxRows={6}
          />
          <TextInput
            label="Deadline (optional)"
            value={deadline}
            onChangeText={setDeadline}
            placeholder="Closes Friday 18:00"
          />
          <View style={styles.pollDrawerActions}>
            {draft.media?.kind === "poll" ? (
              <Button
                variant="ghost"
                onPress={() => {
                  setDraft((d) => clearMedia(d));
                  setOpen(false);
                }}
              >
                Remove staged poll
              </Button>
            ) : null}
            <Button variant="primary" onPress={stagePoll}>
              Attach poll
            </Button>
          </View>
        </View>
      </Drawer>
    </View>
  );
}

function EmbedDemo({ seeded }: { seeded: "repost" | "comment" }) {
  const [draft, setDraft] = useState<PostDraft>(() => {
    const seed = withContent(emptyDraft(), "");
    return withRelation(seed, {
      kind: seeded,
      post: {
        author: SAMPLE_EMBED_AUTHOR,
        content: SAMPLE_EMBED_CONTENT,
      },
    });
  });
  return (
    <View style={styles.composerWrap}>
      <PostComposer
        author={AUTHOR}
        value={draft}
        onChange={setDraft}
        placeholder={
          seeded === "repost"
            ? "Add a comment (optional)..."
            : "Write a reply..."
        }
        submitLabel={seeded === "repost" ? "Repost" : "Reply"}
      />
    </View>
  );
}

function ArchetypeModeDemo() {
  const [draft, setDraft] = useState<PostDraft>(() =>
    withContent(
      emptyDraft(),
      "Body text is present for typing exercises; once an archetype is staged, the feed preview ignores it until you clear the archetype.",
    ),
  );
  return (
    <View style={styles.composerWrap}>
      <View style={styles.archetypeModeActions}>
        <Button
          variant="ghost"
          onPress={() => setDraft((d) => withArchetype(d, DEMO_ARCHETYPE_DECREE))}
        >
          Stage decree
        </Button>
        <Button
          variant="ghost"
          onPress={() =>
            setDraft((d) => withArchetype(d, DEMO_ARCHETYPE_TESTIMONY))
          }
        >
          Stage testimony
        </Button>
        <Button variant="ghost" onPress={() => setDraft((d) => clearArchetype(d))}>
          Clear archetype
        </Button>
        <Button
          variant="ghost"
          onPress={() => setDraft((d) => withPoll(d, ARC_MODE_POLL))}
        >
          Stage poll (clears archetype)
        </Button>
      </View>
      <PostComposer author={AUTHOR} value={draft} onChange={setDraft} />
    </View>
  );
}

function StateDemo({
  flavour,
}: {
  flavour: "submitting" | "error" | "cancel";
}) {
  const [draft, setDraft] = useState<PostDraft>(() =>
    withContent(emptyDraft(), "A draft in flight..."),
  );
  return (
    <View style={styles.composerWrap}>
      <PostComposer
        author={AUTHOR}
        value={draft}
        onChange={setDraft}
        submitting={flavour === "submitting"}
        error={
          flavour === "error"
            ? "Couldn't post just now. Try again in a moment."
            : undefined
        }
        onCancel={flavour === "cancel" ? () => setDraft(emptyDraft()) : undefined}
      />
    </View>
  );
}

function LivePreviewDemo() {
  const [draft, setDraft] = useState<PostDraft>(() =>
    withMedia(
      withContent(
        emptyDraft(),
        "Edit me to see the preview rerender in real time.",
      ),
      { kind: "link", preview: SAMPLE_LINK },
    ),
  );
  return (
    <View style={styles.previewLayout}>
      <View style={styles.composerWrap}>
        <Text style={styles.previewEyebrow}>Composer</Text>
        <PostComposer author={AUTHOR} value={draft} onChange={setDraft} />
      </View>
      <View style={styles.composerWrap}>
        <PostComposerPreview draft={draft} author={AUTHOR}>
          <Text style={styles.previewEyebrow}>Live preview</Text>
        </PostComposerPreview>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Sample column that gives the composer 100% of the example block's
   * width. Mirrors {@link "./InputScreen".styles.sampleColumn} so the
   * pill takes the full width rather than auto-sizing to its content.
   */
  composerWrap: {
    width: "100%",
    alignSelf: "stretch",
    gap: 12,
  },
  /**
   * Two-up layout for the live-preview demo: composer on the left,
   * projected `<Post>` on the right; collapses to a single stacked
   * column on narrow viewports thanks to `flexWrap`.
   */
  previewLayout: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    gap: 24,
  },
  /**
   * Eyebrow label rendered above the composer / preview halves of the
   * live-preview demo. Same muted neutral as the kit's metadata copy.
   */
  previewEyebrow: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.6,
  },
  /**
   * Vertical stack inside the poll-configuration drawer. 12px gap
   * matches the composer's outer rhythm so the drawer reads as the
   * same density of inputs as the composer above it.
   */
  pollDrawerStack: {
    gap: 12,
  },
  /**
   * Bottom action row of the poll drawer. Right-aligned cluster of
   * text buttons -- same vocabulary as the composer's own action row.
   */
  pollDrawerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
  },
  archetypeModeActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
});
