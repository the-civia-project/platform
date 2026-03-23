import { describe, expect, it } from "vitest";
import { pickPostType } from "./post-type";

describe("pickPostType", () => {
  it("classifies content-only posts as 'text'", () => {
    expect(pickPostType({ content: "hello world" })).toEqual({ kind: "text" });
  });

  it("classifies the fully-empty post as 'text'", () => {
    // No content, no media -- a degenerate post still has a kind, and
    // "text" is the most forgiving fallback (the body slot will render
    // nothing, but the header and footer stay).
    expect(pickPostType({})).toEqual({ kind: "text" });
  });

  it("ignores `content` when classifying -- whitespace stays 'text'", () => {
    // The classifier is structural: it never inspects the commentary's
    // string contents. Empty / whitespace-only commentary still reads as
    // a text post.
    expect(pickPostType({ content: "" })).toEqual({ kind: "text" });
    expect(pickPostType({ content: "   " })).toEqual({ kind: "text" });
  });

  it("classifies a link preview with commentary as 'text-url' carrying the URL", () => {
    expect(
      pickPostType({
        content: "Worth a read",
        media: {
          kind: "link",
          preview: {
            url: "https://nytimes.com/article",
            title: "Headline",
            domain: "nytimes.com",
          },
        },
      }),
    ).toEqual({ kind: "text-url", url: "https://nytimes.com/article" });
  });

  it("classifies a link preview without commentary as 'text-url'", () => {
    // The URL is the defining feature of the variant -- a link-only post
    // (no caption) is still a `text-url` post, not a `text` one.
    expect(
      pickPostType({
        media: {
          kind: "link",
          preview: {
            url: "https://example.test/page",
            title: "Page",
            domain: "example.test",
          },
        },
      }),
    ).toEqual({ kind: "text-url", url: "https://example.test/page" });
  });

  it("classifies a single-image post as 'image'", () => {
    expect(
      pickPostType({
        media: {
          kind: "image",
          image: { source: "https://x.test/a.jpg", alt: "alpha" },
        },
      }),
    ).toEqual({ kind: "image" });
  });

  it("classifies a single-image post with commentary as 'image' (not 'text')", () => {
    // Commentary is allowed to accompany any media kind; the media's
    // presence wins for classification, so a caption + image post is an
    // `image` post, not a `text` post.
    expect(
      pickPostType({
        content: "Caption.",
        media: {
          kind: "image",
          image: { source: "https://x.test/a.jpg", alt: "alpha" },
        },
      }),
    ).toEqual({ kind: "image" });
  });

  it("classifies a single-video post as 'video'", () => {
    expect(
      pickPostType({
        media: {
          kind: "video",
          video: { source: "https://x.test/v.jpg", alt: "intro reel" },
        },
      }),
    ).toEqual({ kind: "video" });
  });

  it("classifies a single-video post with commentary as 'video' (not 'text')", () => {
    // Same rule as the image variant: media-bearing posts classify on
    // their media, never on the commentary -- even when the commentary
    // is the more prominent content slot.
    expect(
      pickPostType({
        content: "Caption.",
        media: {
          kind: "video",
          video: { source: "https://x.test/v.jpg", alt: "intro reel" },
        },
      }),
    ).toEqual({ kind: "video" });
  });

  it("classifies a single-audio post as 'audio'", () => {
    expect(
      pickPostType({
        media: {
          kind: "audio",
          audio: {
            source: "https://x.test/a.mp3",
            alt: "voice note",
            durationSeconds: 32,
          },
        },
      }),
    ).toEqual({ kind: "audio" });
  });

  it("classifies a single-audio post with commentary as 'audio' (not 'text')", () => {
    // Same rule as the image and video variants: media-bearing posts
    // classify on their media, never on the commentary.
    expect(
      pickPostType({
        content: "Recorded this on the walk home.",
        media: {
          kind: "audio",
          audio: { source: "https://x.test/a.mp3", alt: "voice note" },
        },
      }),
    ).toEqual({ kind: "audio" });
  });

  it("classifies a gallery post as 'gallery'", () => {
    expect(
      pickPostType({
        media: {
          kind: "gallery",
          images: [
            { source: "https://x.test/1.jpg", alt: "one" },
            { source: "https://x.test/2.jpg", alt: "two" },
          ],
        },
      }),
    ).toEqual({ kind: "gallery" });
  });

  it("classifies a mosaic post as 'mosaic'", () => {
    expect(
      pickPostType({
        media: {
          kind: "mosaic",
          images: [
            {
              source: "https://x.test/1.jpg",
              alt: "one",
              aspectRatio: 4 / 3,
            },
            {
              source: "https://x.test/2.jpg",
              alt: "two",
              aspectRatio: 3 / 4,
            },
          ],
        },
      }),
    ).toEqual({ kind: "mosaic" });
  });

  it("classifies a carousel post as 'carousel'", () => {
    expect(
      pickPostType({
        media: {
          kind: "carousel",
          images: [
            { source: "https://x.test/1.jpg", alt: "one" },
            { source: "https://x.test/2.jpg", alt: "two" },
          ],
        },
      }),
    ).toEqual({ kind: "carousel" });
  });

  it("classifies a poll post as 'poll'", () => {
    expect(
      pickPostType({
        media: {
          kind: "poll",
          poll: {
            question: "Pick a lane.",
            options: [
              { id: "a", label: "Alpha", votes: 3 },
              { id: "b", label: "Beta", votes: 1 },
            ],
          },
        },
      }),
    ).toEqual({ kind: "poll" });
  });

  it("classifies a poll post with commentary as 'poll' (not 'text')", () => {
    // Same media-wins rule the image/video/audio cases enforce: a
    // poll with a caption still classifies on its media slot.
    expect(
      pickPostType({
        content: "Vote before Friday.",
        media: {
          kind: "poll",
          poll: {
            question: "Pick a lane.",
            options: [
              { id: "a", label: "Alpha", votes: 0 },
              { id: "b", label: "Beta", votes: 0 },
            ],
            deadlineLabel: "Closes Friday 18:00",
          },
        },
      }),
    ).toEqual({ kind: "poll" });
  });

  it("classifies an event post as 'event'", () => {
    expect(
      pickPostType({
        media: {
          kind: "event",
          event: {
            title: "Neighbourhood town hall",
            start: new Date("2026-06-12T18:00:00"),
            format: "in-person",
            rsvpCount: 0,
          },
        },
      }),
    ).toEqual({ kind: "event" });
  });

  it("classifies an event post with commentary as 'event' (not 'text')", () => {
    expect(
      pickPostType({
        content: "Bring questions.",
        media: {
          kind: "event",
          event: {
            title: "Neighbourhood town hall",
            start: new Date("2026-06-12T18:00:00"),
            end: new Date("2026-06-12T20:00:00"),
            place: "Community Centre, Sector 2",
            format: "in-person",
            rsvpCount: 42,
          },
        },
      }),
    ).toEqual({ kind: "event" });
  });

  it("classifies a petition post as 'petition'", () => {
    expect(
      pickPostType({
        media: {
          kind: "petition",
          petition: {
            title: "Restore the night bus",
            signatureCount: 1842,
            goal: 2500,
          },
        },
      }),
    ).toEqual({ kind: "petition" });
  });

  it("classifies a petition post with commentary as 'petition' (not 'text')", () => {
    expect(
      pickPostType({
        content: "Sign if you ride the 22 home.",
        media: {
          kind: "petition",
          petition: {
            title: "Restore the night bus",
            signatureCount: 0,
          },
        },
      }),
    ).toEqual({ kind: "petition" });
  });

  it("classifies a fundraiser post as 'fundraiser'", () => {
    expect(
      pickPostType({
        media: {
          kind: "fundraiser",
          fundraiser: {
            title: "Repair the community-centre roof",
            raised: 4820,
            goal: 8000,
            currency: "EUR",
          },
        },
      }),
    ).toEqual({ kind: "fundraiser" });
  });

  it("classifies a fundraiser post with commentary as 'fundraiser' (not 'text')", () => {
    expect(
      pickPostType({
        content: "Even a fiver helps -- we're 60% there.",
        media: {
          kind: "fundraiser",
          fundraiser: {
            title: "Repair the community-centre roof",
            raised: 4820,
            goal: 8000,
            currency: "EUR",
          },
        },
      }),
    ).toEqual({ kind: "fundraiser" });
  });

  it("classifies a dataset post as 'dataset'", () => {
    expect(
      pickPostType({
        media: {
          kind: "dataset",
          dataset: {
            name: "2026 council budget",
            rowCount: 412,
            columnCount: 9,
            license: "CC BY 4.0",
          },
        },
      }),
    ).toEqual({ kind: "dataset" });
  });

  it("classifies a dataset post with commentary as 'dataset' (not 'text')", () => {
    expect(
      pickPostType({
        content: "Long-promised machine-readable budget. Notes inside.",
        media: {
          kind: "dataset",
          dataset: {
            name: "2026 council budget",
          },
        },
      }),
    ).toEqual({ kind: "dataset" });
  });

  it("classifies a fact-check post as 'fact-check'", () => {
    expect(
      pickPostType({
        media: {
          kind: "fact-check",
          factCheck: {
            claim: "The council cut the night-bus budget by 40% last year.",
            verdict: "mostly-true",
            summary:
              "The nominal line-item dropped 38%; the 40% figure rounds up from a press headline.",
            evidence: [
              {
                id: "hansard",
                label: "Finance committee transcript",
                sourceLabel: "Hansard, March 2026",
              },
            ],
            checkedAtLabel: "Checked June 10, 2026",
          },
        },
      }),
    ).toEqual({ kind: "fact-check" });
  });

  it("classifies a fact-check post with commentary as 'fact-check' (not 'text')", () => {
    expect(
      pickPostType({
        content: "Our desk went line-by-line on the budget PDF.",
        media: {
          kind: "fact-check",
          factCheck: {
            claim: "Turnout in the last referendum exceeded 72%.",
            verdict: "false",
          },
        },
      }),
    ).toEqual({ kind: "fact-check" });
  });

  it("classifies a vote-record post as 'vote-record'", () => {
    expect(
      pickPostType({
        media: {
          kind: "vote-record",
          voteRecord: {
            billReference: "Bill 7 / 2026",
            motionTitle: "Third reading: transit levy",
            chamber: "City council",
            voterCapacity: "as delegate for Ward 4",
            yea: 22,
            nay: 18,
            abstain: 1,
            viewerVote: "nay",
          },
        },
      }),
    ).toEqual({ kind: "vote-record" });
  });

  it("classifies a vote-record post with commentary as 'vote-record' (not 'text')", () => {
    expect(
      pickPostType({
        content: "Roll call is closed -- here's how it landed.",
        media: {
          kind: "vote-record",
          voteRecord: {
            billReference: "SR-102",
            voterCapacity: "as recorded observer",
            yea: 5,
            nay: 2,
            abstain: 0,
          },
        },
      }),
    ).toEqual({ kind: "vote-record" });
  });

  it("classifies an article archetype post as 'article'", () => {
    expect(
      pickPostType({
        archetype: {
          kind: "article",
          article: {
            title: "Test headline",
            dek: "Test dek.",
            byline: "By A. Author",
            dateline: "Jan 1, 2026",
            cover: { source: "https://example.com/c.jpg", alt: "Cover" },
            readingTimeLabel: "3 min read",
          },
        },
      }),
    ).toEqual({ kind: "article" });
  });

  it("classifies archetype article ahead of media when both are present", () => {
    expect(
      pickPostType({
        media: {
          kind: "image",
          image: { source: "https://example.com/i.png", alt: "x" },
        },
        archetype: {
          kind: "article",
          article: {
            title: "Headline wins",
            dek: "Dek.",
            byline: "By B. Author",
            dateline: "Jan 2, 2026",
            cover: { source: "https://example.com/c2.jpg", alt: "Cover" },
            readingTimeLabel: "1 min read",
          },
        },
      }),
    ).toEqual({ kind: "article" });
  });

  it("classifies a liveticker archetype post as 'liveticker'", () => {
    expect(
      pickPostType({
        archetype: {
          kind: "liveticker",
          liveticker: {
            title: "Council vote live",
            entries: [
              { id: "1", timeLabel: "18:02", content: "Quorum confirmed." },
            ],
            live: true,
          },
        },
      }),
    ).toEqual({ kind: "liveticker" });
  });

  it("classifies archetype liveticker ahead of media when both are present", () => {
    expect(
      pickPostType({
        media: {
          kind: "image",
          image: { source: "https://example.com/i.png", alt: "x" },
        },
        archetype: {
          kind: "liveticker",
          liveticker: {
            title: "Ticker wins",
            entries: [{ id: "a", timeLabel: "18:10", content: "Motion carried." }],
          },
        },
      }),
    ).toEqual({ kind: "liveticker" });
  });

  it("classifies a decree archetype post as 'decree'", () => {
    expect(
      pickPostType({
        archetype: {
          kind: "decree",
          decree: {
            issuingBody: "City Council",
            decreeNumber: "Decree 1/2026",
            title: "Night-bus levels",
            summary: "Restores interim headway.",
            signingAuthority: "Signed: Mayor",
          },
        },
      }),
    ).toEqual({ kind: "decree" });
  });

  it("classifies archetype decree ahead of media when both are present", () => {
    expect(
      pickPostType({
        media: {
          kind: "image",
          image: { source: "https://example.com/i.png", alt: "x" },
        },
        archetype: {
          kind: "decree",
          decree: {
            issuingBody: "City Council",
            decreeNumber: "D-2",
            title: "Wins",
            summary: "Summary.",
            signingAuthority: "Mayor",
          },
        },
      }),
    ).toEqual({ kind: "decree" });
  });

  it("classifies a testimony archetype post as 'testimony'", () => {
    expect(
      pickPostType({
        archetype: {
          kind: "testimony",
          testimony: {
            witnessCapacity: "as witness",
            eventDateLabel: "Jan 1",
            locationLabel: "Chamber",
            statement: "I observed the vote.",
          },
        },
      }),
    ).toEqual({ kind: "testimony" });
  });

  it("classifies an endorsement post as 'endorsement'", () => {
    expect(
      pickPostType({
        media: {
          kind: "endorsement",
          endorsement: {
            endorserCapacity: "as party chair",
            targetKind: "candidate",
            targetLabel: "A. Ionescu",
            statement: "Fully supports the climate platform.",
          },
        },
      }),
    ).toEqual({ kind: "endorsement" });
  });

  it("classifies a commitment post as 'commitment'", () => {
    expect(
      pickPostType({
        media: {
          kind: "commitment",
          commitment: {
            committerCapacity: "as mayor",
            commitmentText: "We will publish the audit within 30 days.",
            byDateLabel: "by 15 July 2026",
          },
        },
      }),
    ).toEqual({ kind: "commitment" });
  });

  it("classifies a disclosure post as 'disclosure'", () => {
    expect(
      pickPostType({
        media: {
          kind: "disclosure",
          disclosure: {
            kind: "paid",
            counterparty: "Example Media Ltd",
            amountLabel: "4,200",
            currency: "EUR",
            purpose: "Sponsored newsletter slot",
          },
        },
      }),
    ).toEqual({ kind: "disclosure" });
  });
});
