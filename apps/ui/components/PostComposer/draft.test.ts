import { describe, expect, it } from "vitest";
import type { ProfileProps } from "../Profile";
import type {
  EmbeddedPostData,
  PostArchetype,
  PostImage,
  PostMedia,
  PostRelation,
} from "../Post";
import {
  addPictures,
  clearArchetype,
  clearMedia,
  clearRelation,
  draftToPostProps,
  emptyDraft,
  isSubmittable,
  removeMediaImage,
  withArchetype,
  withContent,
  withFactCheck,
  withMedia,
  withPoll,
  withRelation,
  withVoteRecord,
  withEndorsement,
  withCommitment,
  withDisclosure,
} from "./draft";
import type { PostCommitment } from "../Post/Commitment";
import type { PostDisclosure } from "../Post/Disclosure";
import type { PostEndorsement } from "../Post/Endorsement";
import type { PostFactCheck } from "../Post/FactCheck";
import type { PostPoll } from "../Post/Poll";
import type { PostVoteRecord } from "../Post/VoteRecord";

const author: ProfileProps = {
  source: "https://example.com/a.png",
  name: "Aria",
  flag: "RO",
};

const linkMedia: PostMedia = {
  kind: "link",
  preview: {
    url: "https://example.com/a",
    title: "An article",
    domain: "example.com",
  },
};

const imageMedia: PostMedia = {
  kind: "image",
  image: { source: "https://example.com/i.png", alt: "Sunlit rooftops" },
};

const videoMedia: PostMedia = {
  kind: "video",
  video: { source: "https://example.com/v.jpg", alt: "Studio walkthrough" },
};

const audioMedia: PostMedia = {
  kind: "audio",
  audio: { source: "https://example.com/a.mp3", alt: "Voice note" },
};

const samplePoll: PostPoll = {
  question: "Which lane should we adopt?",
  options: [
    { id: "alpha", label: "Alpha", votes: 4 },
    { id: "beta", label: "Beta", votes: 2 },
  ],
  deadlineLabel: "Closes Friday 18:00",
};

const sampleFactCheck: PostFactCheck = {
  claim: "The council cut the night-bus budget by 40% last year.",
  verdict: "mostly-true",
  summary:
    "The nominal line-item dropped 38%; the 40% figure rounds up from a press headline.",
  evidence: [
    {
      id: "ledger",
      label: "Approved budget appendix (CSV)",
      sourceLabel: "Open data portal",
    },
  ],
  checkedAtLabel: "Checked June 10, 2026",
};

const sampleVoteRecord: PostVoteRecord = {
  billReference: "Bill 7 / 2026",
  motionTitle: "Third reading: transit levy",
  chamber: "City council",
  voterCapacity: "as delegate for Ward 4",
  yea: 22,
  nay: 18,
  abstain: 1,
  viewerVote: "nay",
};

const sampleEndorsement: PostEndorsement = {
  endorserCapacity: "as party chair",
  targetKind: "candidate",
  targetLabel: "A. Ionescu",
  statement: "Fully supports the climate platform.",
};

const sampleCommitment: PostCommitment = {
  committerCapacity: "as mayor",
  commitmentText: "We will publish the audit within 30 days.",
  byDateLabel: "by 15 July 2026",
};

const sampleDisclosure: PostDisclosure = {
  kind: "paid",
  counterparty: "Example Media Ltd",
  amountLabel: "4,200",
  currency: "EUR",
  purpose: "Sponsored newsletter slot",
};

const embeddedPost: EmbeddedPostData = {
  author,
  content: "the original body",
};

const repostRelation: PostRelation = {
  kind: "repost",
  post: embeddedPost,
};

const commentRelation: PostRelation = {
  kind: "comment",
  post: embeddedPost,
};

const sampleDecreeArchetype: PostArchetype = {
  kind: "decree",
  decree: {
    issuingBody: "City Council",
    decreeNumber: "Decree 1/2026",
    title: "Night-bus levels",
    summary: "Interim headway.",
    signingAuthority: "Mayor",
  },
};

describe("emptyDraft", () => {
  it("returns a draft with empty content and no other slots", () => {
    expect(emptyDraft()).toEqual({ content: "" });
  });

  it("allocates a fresh object on every call", () => {
    expect(emptyDraft()).not.toBe(emptyDraft());
  });
});

describe("withContent", () => {
  it("replaces the content and leaves other fields intact", () => {
    const before = withMedia(emptyDraft(), imageMedia);
    const after = withContent(before, "hello");
    expect(after.content).toBe("hello");
    expect(after.media).toBe(imageMedia);
  });

  it("returns a new object reference", () => {
    const before = emptyDraft();
    expect(withContent(before, "x")).not.toBe(before);
  });
});

describe("withMedia / clearMedia", () => {
  it("sets and clears the media slot", () => {
    const a = withMedia(emptyDraft(), linkMedia);
    expect(a.media).toBe(linkMedia);
    const b = clearMedia(a);
    expect(b.media).toBeUndefined();
  });

  it("replaces an existing attachment when called twice", () => {
    const a = withMedia(emptyDraft(), linkMedia);
    const b = withMedia(a, imageMedia);
    expect(b.media).toBe(imageMedia);
  });

  it("clears a staged archetype when media is set", () => {
    const a = withArchetype(emptyDraft(), sampleDecreeArchetype);
    const b = withMedia(a, imageMedia);
    expect(b.media).toBe(imageMedia);
    expect(b.archetype).toBeUndefined();
  });
});

describe("withArchetype / clearArchetype", () => {
  it("stages an archetype and clears staged media", () => {
    const before = withMedia(emptyDraft(), imageMedia);
    const after = withArchetype(before, sampleDecreeArchetype);
    expect(after.archetype).toEqual(sampleDecreeArchetype);
    expect(after.media).toBeUndefined();
  });

  it("clearArchetype drops the archetype slot", () => {
    const before = withArchetype(emptyDraft(), sampleDecreeArchetype);
    const after = clearArchetype(before);
    expect(after.archetype).toBeUndefined();
  });

  it("withPoll clears a staged archetype", () => {
    const before = withArchetype(emptyDraft(), sampleDecreeArchetype);
    const after = withPoll(before, samplePoll);
    expect(after.archetype).toBeUndefined();
    expect(after.media?.kind).toBe("poll");
  });
});

describe("withPoll", () => {
  it("stages a poll as a `poll` media variant", () => {
    const after = withPoll(emptyDraft(), samplePoll);
    expect(after.media).toEqual({ kind: "poll", poll: samplePoll });
  });

  it("replaces any previously-staged media", () => {
    const before = withMedia(emptyDraft(), imageMedia);
    const after = withPoll(before, samplePoll);
    expect(after.media).toEqual({ kind: "poll", poll: samplePoll });
  });

  it("leaves content and relation untouched", () => {
    const before = withRelation(
      withContent(emptyDraft(), "hello"),
      repostRelation,
    );
    const after = withPoll(before, samplePoll);
    expect(after.content).toBe("hello");
    expect(after.relation).toBe(repostRelation);
  });
});

describe("withFactCheck", () => {
  it("stages a fact-check as a `fact-check` media variant", () => {
    const after = withFactCheck(emptyDraft(), sampleFactCheck);
    expect(after.media).toEqual({
      kind: "fact-check",
      factCheck: sampleFactCheck,
    });
  });

  it("replaces any previously-staged media", () => {
    const before = withMedia(emptyDraft(), imageMedia);
    const after = withFactCheck(before, sampleFactCheck);
    expect(after.media).toEqual({
      kind: "fact-check",
      factCheck: sampleFactCheck,
    });
  });

  it("leaves content and relation untouched", () => {
    const before = withRelation(
      withContent(emptyDraft(), "hello"),
      repostRelation,
    );
    const after = withFactCheck(before, sampleFactCheck);
    expect(after.content).toBe("hello");
    expect(after.relation).toBe(repostRelation);
  });
});

describe("withVoteRecord", () => {
  it("stages a vote-record as a `vote-record` media variant", () => {
    const after = withVoteRecord(emptyDraft(), sampleVoteRecord);
    expect(after.media).toEqual({
      kind: "vote-record",
      voteRecord: sampleVoteRecord,
    });
  });

  it("replaces any previously-staged media", () => {
    const before = withMedia(emptyDraft(), imageMedia);
    const after = withVoteRecord(before, sampleVoteRecord);
    expect(after.media).toEqual({
      kind: "vote-record",
      voteRecord: sampleVoteRecord,
    });
  });

  it("leaves content and relation untouched", () => {
    const before = withRelation(
      withContent(emptyDraft(), "hello"),
      repostRelation,
    );
    const after = withVoteRecord(before, sampleVoteRecord);
    expect(after.content).toBe("hello");
    expect(after.relation).toBe(repostRelation);
  });
});

describe("withEndorsement", () => {
  it("stages an endorsement as an `endorsement` media variant", () => {
    const after = withEndorsement(emptyDraft(), sampleEndorsement);
    expect(after.media).toEqual({
      kind: "endorsement",
      endorsement: sampleEndorsement,
    });
  });

  it("replaces any previously-staged media", () => {
    const before = withMedia(emptyDraft(), imageMedia);
    const after = withEndorsement(before, sampleEndorsement);
    expect(after.media).toEqual({
      kind: "endorsement",
      endorsement: sampleEndorsement,
    });
  });
});

describe("withCommitment", () => {
  it("stages a commitment as a `commitment` media variant", () => {
    const after = withCommitment(emptyDraft(), sampleCommitment);
    expect(after.media).toEqual({
      kind: "commitment",
      commitment: sampleCommitment,
    });
  });
});

describe("withDisclosure", () => {
  it("stages a disclosure as a `disclosure` media variant", () => {
    const after = withDisclosure(emptyDraft(), sampleDisclosure);
    expect(after.media).toEqual({
      kind: "disclosure",
      disclosure: sampleDisclosure,
    });
  });
});

describe("withRelation / clearRelation", () => {
  it("stages a repost relation", () => {
    const a = withRelation(emptyDraft(), repostRelation);
    expect(a.relation).toBe(repostRelation);
  });

  it("staging a comment relation replaces a previously-staged repost", () => {
    const a = withRelation(emptyDraft(), repostRelation);
    const b = withRelation(a, commentRelation);
    expect(b.relation).toBe(commentRelation);
  });

  it("staging a repost relation replaces a previously-staged comment", () => {
    const a = withRelation(emptyDraft(), commentRelation);
    const b = withRelation(a, repostRelation);
    expect(b.relation).toBe(repostRelation);
  });

  it("clearRelation drops the slot", () => {
    const a = withRelation(emptyDraft(), repostRelation);
    const b = clearRelation(a);
    expect(b.relation).toBeUndefined();
  });
});

describe("removeMediaImage", () => {
  const galleryMedia: PostMedia = {
    kind: "gallery",
    images: [
      { source: "https://example.com/1.png", alt: "one" },
      { source: "https://example.com/2.png", alt: "two" },
      { source: "https://example.com/3.png", alt: "three" },
    ],
  };

  const mosaicMedia: PostMedia = {
    kind: "mosaic",
    images: [
      { source: "https://example.com/1.png", alt: "one", aspectRatio: 16 / 9 },
      { source: "https://example.com/2.png", alt: "two", aspectRatio: 1 },
    ],
  };

  const carouselMedia: PostMedia = {
    kind: "carousel",
    images: [
      { source: "https://example.com/1.png", alt: "one" },
      { source: "https://example.com/2.png", alt: "two" },
    ],
  };

  it("drops one image from a gallery and keeps the kind when 2+ remain", () => {
    const before = withMedia(emptyDraft(), galleryMedia);
    const after = removeMediaImage(before, 1);
    expect(after.media).toEqual({
      kind: "gallery",
      images: [galleryMedia.images[0], galleryMedia.images[2]],
    });
  });

  it("demotes a 2-image gallery to a single image when one is removed", () => {
    const before = withMedia(emptyDraft(), {
      kind: "gallery",
      images: [
        { source: "https://example.com/1.png", alt: "one" },
        { source: "https://example.com/2.png", alt: "two" },
      ],
    });
    const after = removeMediaImage(before, 0);
    expect(after.media).toEqual({
      kind: "image",
      image: { source: "https://example.com/2.png", alt: "two" },
    });
  });

  it("drops one image from a mosaic and keeps the kind", () => {
    const before = withMedia(emptyDraft(), mosaicMedia);
    const after = removeMediaImage(before, 0);
    expect(after.media).toEqual({
      kind: "mosaic",
      images: [mosaicMedia.images[1]],
    });
  });

  it("drops one image from a carousel and keeps the kind", () => {
    const before = withMedia(emptyDraft(), carouselMedia);
    const after = removeMediaImage(before, 0);
    expect(after.media).toEqual({
      kind: "carousel",
      images: [carouselMedia.images[1]],
    });
  });

  it("clears the media slot when the last image of a gallery is removed", () => {
    const before = withMedia(emptyDraft(), {
      kind: "gallery",
      images: [{ source: "https://example.com/1.png", alt: "one" }],
    });
    const after = removeMediaImage(before, 0);
    expect(after.media).toBeUndefined();
  });

  it("clears the media slot when the last image of a mosaic is removed", () => {
    const before = withMedia(emptyDraft(), {
      kind: "mosaic",
      images: [
        { source: "https://example.com/1.png", alt: "one", aspectRatio: 1 },
      ],
    });
    const after = removeMediaImage(before, 0);
    expect(after.media).toBeUndefined();
  });

  it("clears the media slot when the last image of a carousel is removed", () => {
    const before = withMedia(emptyDraft(), {
      kind: "carousel",
      images: [{ source: "https://example.com/1.png", alt: "one" }],
    });
    const after = removeMediaImage(before, 0);
    expect(after.media).toBeUndefined();
  });

  it("clears the media slot for a single-image attachment regardless of index", () => {
    const before = withMedia(emptyDraft(), {
      kind: "image",
      image: { source: "https://example.com/1.png", alt: "one" },
    });
    const after = removeMediaImage(before, 5);
    expect(after.media).toBeUndefined();
  });

  it("clears the media slot for a single-video attachment regardless of index", () => {
    const before = withMedia(emptyDraft(), videoMedia);
    const after = removeMediaImage(before, 5);
    expect(after.media).toBeUndefined();
  });

  it("clears the media slot for a single-audio attachment regardless of index", () => {
    const before = withMedia(emptyDraft(), audioMedia);
    const after = removeMediaImage(before, 5);
    expect(after.media).toBeUndefined();
  });

  it("returns the draft unchanged for a link attachment", () => {
    const before = withMedia(emptyDraft(), linkMedia);
    const after = removeMediaImage(before, 0);
    expect(after).toBe(before);
  });

  it("returns the draft unchanged for a fact-check attachment", () => {
    const before = withFactCheck(emptyDraft(), sampleFactCheck);
    const after = removeMediaImage(before, 0);
    expect(after).toBe(before);
  });

  it("returns the draft unchanged for a vote-record attachment", () => {
    const before = withVoteRecord(emptyDraft(), sampleVoteRecord);
    const after = removeMediaImage(before, 0);
    expect(after).toBe(before);
  });

  it("returns the draft unchanged for an endorsement attachment", () => {
    const before = withEndorsement(emptyDraft(), sampleEndorsement);
    const after = removeMediaImage(before, 0);
    expect(after).toBe(before);
  });

  it("returns the draft unchanged for a commitment attachment", () => {
    const before = withCommitment(emptyDraft(), sampleCommitment);
    const after = removeMediaImage(before, 0);
    expect(after).toBe(before);
  });

  it("returns the draft unchanged for a disclosure attachment", () => {
    const before = withDisclosure(emptyDraft(), sampleDisclosure);
    const after = removeMediaImage(before, 0);
    expect(after).toBe(before);
  });

  it("returns the draft unchanged when there is no media", () => {
    const before = emptyDraft();
    const after = removeMediaImage(before, 0);
    expect(after).toBe(before);
  });

  it("returns the draft unchanged for an out-of-bounds index", () => {
    const before = withMedia(emptyDraft(), galleryMedia);
    expect(removeMediaImage(before, -1)).toBe(before);
    expect(removeMediaImage(before, 99)).toBe(before);
  });

  it("preserves the content and relation fields", () => {
    const before = withRelation(
      withContent(withMedia(emptyDraft(), galleryMedia), "hello"),
      repostRelation,
    );
    const after = removeMediaImage(before, 0);
    expect(after.content).toBe("hello");
    expect(after.relation).toBe(repostRelation);
  });
});

describe("addPictures", () => {
  const photoA: PostImage = {
    source: "https://example.com/a.png",
    alt: "A",
  };
  const photoB: PostImage = {
    source: "https://example.com/b.png",
    alt: "B",
  };
  const photoC: PostImage = {
    source: "https://example.com/c.png",
    alt: "C",
  };
  const photoD: PostImage = {
    source: "https://example.com/d.png",
    alt: "D",
  };
  const photoE: PostImage = {
    source: "https://example.com/e.png",
    alt: "E",
  };

  it("returns the draft unchanged when no pictures are passed", () => {
    const before = withContent(emptyDraft(), "hello");
    expect(addPictures(before, [])).toBe(before);
  });

  it("stages a single picture as an image", () => {
    const after = addPictures(emptyDraft(), [photoA]);
    expect(after.media).toEqual({ kind: "image", image: photoA });
  });

  it("stages two pictures as a gallery", () => {
    const after = addPictures(emptyDraft(), [photoA, photoB]);
    expect(after.media).toEqual({
      kind: "gallery",
      images: [photoA, photoB],
    });
  });

  it("promotes an existing image to a gallery when more pictures are added", () => {
    const before = addPictures(emptyDraft(), [photoA]);
    const after = addPictures(before, [photoB]);
    expect(after.media).toEqual({
      kind: "gallery",
      images: [photoA, photoB],
    });
  });

  it("appends to an existing gallery", () => {
    const before = addPictures(emptyDraft(), [photoA, photoB]);
    const after = addPictures(before, [photoC]);
    expect(after.media).toEqual({
      kind: "gallery",
      images: [photoA, photoB, photoC],
    });
  });

  it("caps the combined list at the configured max", () => {
    const before = addPictures(emptyDraft(), [photoA, photoB, photoC]);
    const after = addPictures(before, [photoD, photoE]);
    expect(after.media).toEqual({
      kind: "gallery",
      images: [photoA, photoB, photoC, photoD],
    });
  });

  it("respects a caller-supplied max", () => {
    const after = addPictures(emptyDraft(), [photoA, photoB, photoC], 2);
    expect(after.media).toEqual({
      kind: "gallery",
      images: [photoA, photoB],
    });
  });

  it("replaces a link attachment with the new pictures", () => {
    const before = withMedia(emptyDraft(), linkMedia);
    const after = addPictures(before, [photoA, photoB]);
    expect(after.media).toEqual({
      kind: "gallery",
      images: [photoA, photoB],
    });
  });

  it("replaces a video attachment with the new pictures", () => {
    const before = withMedia(emptyDraft(), videoMedia);
    const after = addPictures(before, [photoA]);
    expect(after.media).toEqual({ kind: "image", image: photoA });
  });

  it("replaces an audio attachment with the new pictures", () => {
    const before = withMedia(emptyDraft(), audioMedia);
    const after = addPictures(before, [photoA]);
    expect(after.media).toEqual({ kind: "image", image: photoA });
  });

  it("replaces a mosaic attachment with the new pictures", () => {
    const before = withMedia(emptyDraft(), {
      kind: "mosaic",
      images: [{ ...photoA, aspectRatio: 1 }, { ...photoB, aspectRatio: 1 }],
    });
    const after = addPictures(before, [photoC]);
    expect(after.media).toEqual({ kind: "image", image: photoC });
  });

  it("replaces a carousel attachment with the new pictures", () => {
    const before = withMedia(emptyDraft(), {
      kind: "carousel",
      images: [photoA, photoB],
    });
    const after = addPictures(before, [photoC, photoD]);
    expect(after.media).toEqual({
      kind: "gallery",
      images: [photoC, photoD],
    });
  });

  it("replaces a fact-check attachment with the new pictures", () => {
    const before = withFactCheck(emptyDraft(), sampleFactCheck);
    const after = addPictures(before, [photoA]);
    expect(after.media).toEqual({ kind: "image", image: photoA });
  });

  it("replaces a vote-record attachment with the new pictures", () => {
    const before = withVoteRecord(emptyDraft(), sampleVoteRecord);
    const after = addPictures(before, [photoA]);
    expect(after.media).toEqual({ kind: "image", image: photoA });
  });

  it("replaces an endorsement attachment with the new pictures", () => {
    const before = withEndorsement(emptyDraft(), sampleEndorsement);
    const after = addPictures(before, [photoA]);
    expect(after.media).toEqual({ kind: "image", image: photoA });
  });

  it("replaces a commitment attachment with the new pictures", () => {
    const before = withCommitment(emptyDraft(), sampleCommitment);
    const after = addPictures(before, [photoA]);
    expect(after.media).toEqual({ kind: "image", image: photoA });
  });

  it("replaces a disclosure attachment with the new pictures", () => {
    const before = withDisclosure(emptyDraft(), sampleDisclosure);
    const after = addPictures(before, [photoA]);
    expect(after.media).toEqual({ kind: "image", image: photoA });
  });

  it("preserves the content and relation fields", () => {
    const before = withRelation(
      withContent(emptyDraft(), "hello"),
      repostRelation,
    );
    const after = addPictures(before, [photoA]);
    expect(after.content).toBe("hello");
    expect(after.relation).toBe(repostRelation);
  });
});

describe("isSubmittable", () => {
  it("rejects a bare empty draft", () => {
    expect(isSubmittable(emptyDraft())).toBe(false);
  });

  it("rejects whitespace-only content", () => {
    expect(isSubmittable(withContent(emptyDraft(), "   \n\t"))).toBe(false);
  });

  it("accepts a draft with non-whitespace content", () => {
    expect(isSubmittable(withContent(emptyDraft(), "hello"))).toBe(true);
  });

  it("accepts a media-only draft", () => {
    expect(isSubmittable(withMedia(emptyDraft(), imageMedia))).toBe(true);
  });

  it("accepts a bare repost relation (no commentary)", () => {
    expect(isSubmittable(withRelation(emptyDraft(), repostRelation))).toBe(
      true,
    );
  });

  it("accepts a bare comment relation (no commentary)", () => {
    expect(isSubmittable(withRelation(emptyDraft(), commentRelation))).toBe(
      true,
    );
  });

  it("accepts an archetype-only draft", () => {
    expect(isSubmittable(withArchetype(emptyDraft(), sampleDecreeArchetype))).toBe(
      true,
    );
  });
});

describe("draftToPostProps", () => {
  it("forwards the draft fields verbatim and stamps the author", () => {
    const draft = withMedia(withContent(emptyDraft(), "hello"), imageMedia);
    const props = draftToPostProps(draft, author);
    expect(props.author).toBe(author);
    expect(props.content).toBe("hello");
    expect(props.media).toBe(imageMedia);
    expect(props.relation).toBeUndefined();
  });

  it("forwards the staged relation when present", () => {
    const draft = withRelation(emptyDraft(), repostRelation);
    const props = draftToPostProps(draft, author);
    expect(props.relation).toBe(repostRelation);
  });

  it("suppresses content and media when an archetype is staged", () => {
    const draft = withArchetype(
      withMedia(withContent(emptyDraft(), "ignored"), imageMedia),
      sampleDecreeArchetype,
    );
    const props = draftToPostProps(draft, author);
    expect(props.content).toBe("");
    expect(props.media).toBeUndefined();
    expect(props.archetype).toEqual(sampleDecreeArchetype);
  });

  it("omits engagement props -- a draft has no likes / comments / actions", () => {
    const props = draftToPostProps(emptyDraft(), author);
    expect(props).not.toHaveProperty("likeCount");
    expect(props).not.toHaveProperty("commentCount");
    expect(props).not.toHaveProperty("showShare");
    expect(props).not.toHaveProperty("showBookmark");
    expect(props).not.toHaveProperty("showMenu");
  });
});
