import { describe, expect, it } from "vitest";
import { pickPostType } from "../post-type";
import {
  hasMatchingUrlSegment,
  hasPostContent,
  postBodyTileForKind,
  resolvePostBody,
} from "./resolve-post-body";

describe("hasPostContent", () => {
  it("returns false for absent content", () => {
    expect(hasPostContent(undefined)).toBe(false);
  });

  it("returns false for empty string and empty array", () => {
    expect(hasPostContent("")).toBe(false);
    expect(hasPostContent([])).toBe(false);
  });

  it("returns true for non-empty string and structured segments", () => {
    expect(hasPostContent("hello")).toBe(true);
    expect(hasPostContent([{ kind: "text", text: "hi" }])).toBe(true);
  });
});

describe("hasMatchingUrlSegment", () => {
  const href = "https://example.test/page";

  it("returns false for plain-string content", () => {
    expect(hasMatchingUrlSegment(`see ${href}`, href)).toBe(false);
  });

  it("returns true when a url segment matches exactly", () => {
    expect(
      hasMatchingUrlSegment(
        [{ kind: "url", href }, { kind: "text", text: " — worth it." }],
        href,
      ),
    ).toBe(true);
  });

  it("returns false when no url segment matches", () => {
    expect(
      hasMatchingUrlSegment(
        [{ kind: "url", href: "https://other.test" }],
        href,
      ),
    ).toBe(false);
  });
});

describe("postBodyTileForKind", () => {
  it("maps every classifier kind except text to a tile", () => {
    const kinds = [
      "text-url",
      "image",
      "video",
      "audio",
      "gallery",
      "mosaic",
      "carousel",
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
      "article",
      "liveticker",
      "decree",
      "testimony",
    ] as const;

    for (const kind of kinds) {
      expect(postBodyTileForKind(kind)).not.toBeNull();
    }
    expect(postBodyTileForKind("text")).toBeNull();
  });
});

describe("resolvePostBody", () => {
  it("classifies degenerate empty posts as text with no slots", () => {
    expect(resolvePostBody({})).toEqual({
      kind: "text",
      layout: "standard",
      tile: null,
      hasContent: false,
      showInlineUrl: false,
      showMedia: false,
    });
  });

  it("enables commentary only for text posts with content", () => {
    expect(resolvePostBody({ content: "hello" })).toMatchObject({
      kind: "text",
      hasContent: true,
      showMedia: false,
    });
  });

  it("routes link previews with auto URL line when content is plain string", () => {
    const media = {
      kind: "link" as const,
      preview: {
        url: "https://nytimes.com/article",
        title: "Headline",
        domain: "nytimes.com",
      },
    };
    const resolved = resolvePostBody({ content: "Worth a read", media });
    expect(resolved).toEqual({
      kind: "text-url",
      layout: "standard",
      tile: "link-preview",
      hasContent: true,
      showInlineUrl: true,
      showMedia: true,
      linkUrl: "https://nytimes.com/article",
    });
    expect(pickPostType({ content: "Worth a read", media })).toEqual({
      kind: "text-url",
      url: "https://nytimes.com/article",
    });
  });

  it("suppresses the auto URL line when structured content already carries the href", () => {
    const url = "https://example.test/page";
    const resolved = resolvePostBody({
      content: [
        { kind: "text", text: "Read " },
        { kind: "url", href: url },
      ],
      media: {
        kind: "link",
        preview: { url, title: "Page", domain: "example.test" },
      },
    });
    expect(resolved.showInlineUrl).toBe(false);
    expect(resolved.showMedia).toBe(true);
    expect(resolved.tile).toBe("link-preview");
  });

  it("routes image posts with optional commentary", () => {
    expect(
      resolvePostBody({
        content: "Caption.",
        media: {
          kind: "image",
          image: { source: "https://x.test/a.jpg", alt: "alpha" },
        },
      }),
    ).toMatchObject({
      kind: "image",
      layout: "standard",
      tile: "image",
      hasContent: true,
      showInlineUrl: false,
      showMedia: true,
    });
  });

  it("routes structured tiles by classifier kind", () => {
    const cases = [
      ["poll", "poll"],
      ["event", "event"],
      ["petition", "petition"],
      ["fundraiser", "fundraiser"],
      ["dataset", "dataset"],
      ["fact-check", "fact-check"],
      ["vote-record", "vote-record"],
      ["endorsement", "endorsement"],
      ["commitment", "commitment"],
      ["disclosure", "disclosure"],
    ] as const;

    for (const [mediaKind, tile] of cases) {
      const resolved = resolvePostBody({
        media: { kind: mediaKind, [mediaKind]: minimalPayload(mediaKind) },
      } as Parameters<typeof resolvePostBody>[0]);
      expect(resolved.kind).toBe(mediaKind);
      expect(resolved.tile).toBe(tile);
      expect(resolved.showMedia).toBe(true);
    }
  });

  it("routes archetype posts to archetype layout with teaser tile and no commentary", () => {
    const article = {
      title: "Budget vote",
      dek: "What changed overnight.",
      byline: "By City desk",
      dateline: "Published 12 June 2026",
      cover: { source: "https://x.test/cover.jpg", alt: "Chamber" },
      readingTimeLabel: "5 min read",
    };
    const resolved = resolvePostBody({
      content: "",
      archetype: { kind: "article", article },
    });
    expect(resolved).toEqual({
      kind: "article",
      layout: "archetype",
      tile: "article-teaser",
      hasContent: false,
      showInlineUrl: false,
      showMedia: true,
    });
  });

  it("gives archetype precedence over media when both are present", () => {
    const resolved = resolvePostBody({
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
    });
    expect(resolved.layout).toBe("archetype");
    expect(resolved.kind).toBe("decree");
    expect(resolved.tile).toBe("decree-teaser");
    expect(resolved.hasContent).toBe(false);
  });
});

/** Minimal media payloads so structured-tile routing tests stay terse. */
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
