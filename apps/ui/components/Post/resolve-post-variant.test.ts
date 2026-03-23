import { describe, expect, it } from "vitest";
import { pickPostType } from "../post-type";
import {
  hasMatchingUrlSegment,
  hasPostContent,
  resolvePostVariant,
} from "./resolve-post-variant";

describe("resolvePostVariant", () => {
  it("classifies degenerate empty posts as text with empty text slot", () => {
    expect(resolvePostVariant({ linkColor: "#000" })).toEqual({
      kind: "text",
      props: {
        text: {
          content: undefined,
          hasContent: false,
          linkColor: "#000",
          onMentionPress: undefined,
          onUrlPress: undefined,
          onHashtagPress: undefined,
        },
      },
    });
  });

  it("routes text posts with commentary", () => {
    const resolved = resolvePostVariant({
      content: "hello",
      linkColor: "#111",
    });
    expect(resolved).toMatchObject({
      kind: "text",
      props: {
        text: {
          content: "hello",
          hasContent: true,
          linkColor: "#111",
        },
      },
    });
  });

  it("routes link previews with inline URL when content is plain string", () => {
    const media = {
      kind: "link" as const,
      preview: {
        url: "https://nytimes.com/article",
        title: "Headline",
        domain: "nytimes.com",
      },
    };
    const resolved = resolvePostVariant({
      content: "Worth a read",
      media,
      linkColor: "#222",
    });
    expect(resolved.kind).toBe("text-url");
    if (resolved.kind !== "text-url") throw new Error("expected text-url");
    expect(resolved.props.showInlineUrl).toBe(true);
    expect(resolved.props.link.media).toBe(media);
    expect(pickPostType({ content: "Worth a read", media })).toEqual({
      kind: "text-url",
      url: "https://nytimes.com/article",
    });
  });

  it("suppresses inline URL when structured content already carries the href", () => {
    const url = "https://example.test/page";
    const resolved = resolvePostVariant({
      content: [
        { kind: "text", text: "Read " },
        { kind: "url", href: url },
      ],
      media: {
        kind: "link",
        preview: { url, title: "Page", domain: "example.test" },
      },
      linkColor: "#333",
    });
    expect(resolved.kind).toBe("text-url");
    if (resolved.kind !== "text-url") throw new Error("expected text-url");
    expect(resolved.props.showInlineUrl).toBe(false);
  });

  it("routes image posts with optional commentary", () => {
    const media = {
      kind: "image" as const,
      image: { source: "https://x.test/a.jpg", alt: "alpha" },
    };
    const resolved = resolvePostVariant({
      content: "Caption.",
      media,
      linkColor: "#444",
    });
    expect(resolved.kind).toBe("image");
    if (resolved.kind !== "image") throw new Error("expected image");
    expect(resolved.props.text.hasContent).toBe(true);
    expect(resolved.props.image.media).toBe(media);
  });

  it("routes structured tiles by classifier kind", () => {
    const cases = [
      "poll",
      "event",
      "petition",
      "fundraiser",
      "dataset",
      "fact-check",
      "vote-record",
      "endorsement",
      "commitment",
      "disclosure",
    ] as const;

    for (const mediaKind of cases) {
      const resolved = resolvePostVariant({
        media: { kind: mediaKind, [mediaKind]: minimalPayload(mediaKind) },
        linkColor: "#555",
      } as Parameters<typeof resolvePostVariant>[0]);
      expect(resolved.kind).toBe(mediaKind);
      expect(
        (resolved.props as { text: { hasContent: boolean } }).text.hasContent,
      ).toBe(false);
    }
  });

  it("routes archetype posts to teaser-only type components", () => {
    const article = {
      title: "Budget vote",
      dek: "What changed overnight.",
      byline: "By City desk",
      dateline: "Published 12 June 2026",
      cover: { source: "https://x.test/cover.jpg", alt: "Chamber" },
      readingTimeLabel: "5 min read",
    };
    const resolved = resolvePostVariant({
      content: "",
      archetype: { kind: "article", article },
      linkColor: "#666",
    });
    expect(resolved).toEqual({
      kind: "article",
      props: {
        archetype: { kind: "article", article },
        onArchetypePress: undefined,
      },
    });
  });

  it("gives archetype precedence over media when both are present", () => {
    const resolved = resolvePostVariant({
      content: "ignored for layout",
      media: {
        kind: "image",
        image: { source: "https://x.test/a.jpg", alt: "a" },
      },
      archetype: {
        kind: "decree",
        decree: {
          issuingBody: "Council",
          decreeNumber: "12/2026",
          title: "Night-bus extension",
          summary: "Service resumes on route 22.",
          signingAuthority: "Signed: Mayor",
        },
      },
      linkColor: "#777",
    });
    expect(resolved.kind).toBe("decree");
    expect(resolved.props).toMatchObject({
      archetype: { kind: "decree" },
    });
  });
});

describe("hasPostContent (variant)", () => {
  it("re-exports the same rules as resolve-post-body", () => {
    expect(hasPostContent(undefined)).toBe(false);
    expect(hasPostContent("")).toBe(false);
    expect(hasPostContent("hello")).toBe(true);
  });
});

describe("hasMatchingUrlSegment (variant)", () => {
  it("re-exports the same rules as resolve-post-body", () => {
    const href = "https://example.test/page";
    expect(hasMatchingUrlSegment(`see ${href}`, href)).toBe(false);
    expect(
      hasMatchingUrlSegment(
        [{ kind: "url", href }, { kind: "text", text: " — worth it." }],
        href,
      ),
    ).toBe(true);
  });
});

function minimalPayload(kind: string): unknown {
  switch (kind) {
    case "poll":
      return {
        question: "Q?",
        options: [{ id: "a", label: "A", votes: 0 }],
      };
    case "event":
      return {
        title: "Town hall",
        start: new Date("2026-06-01T18:00:00"),
        format: "in-person",
        rsvpCount: 0,
      };
    case "petition":
      return { title: "Fix the bus", signatureCount: 0 };
    case "fundraiser":
      return {
        title: "Roof fund",
        raised: 0,
        goal: 100,
        currency: "EUR",
      };
    case "dataset":
      return { name: "Budget CSV" };
    case "fact-check":
      return { claim: "Claim.", verdict: "true" };
    case "vote-record":
      return {
        billReference: "Bill 1",
        capacity: "Councillor",
        yea: 0,
        nay: 0,
        abstain: 0,
      };
    case "endorsement":
      return {
        capacity: "Chapter",
        targetKind: "bill",
        targetLabel: "Bill 42",
        statement: "Support.",
      };
    case "commitment":
      return {
        capacity: "Mayor",
        text: "Audit by Q3.",
        byDate: "2026-09-30",
      };
    case "disclosure":
      return {
        type: "gift",
        counterparty: "Vendor",
        amount: "€200",
        purpose: "Meal",
      };
    default:
      return {};
  }
}
