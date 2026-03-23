import { describe, expect, it } from "vitest";
import {
  mediaGridThumbnailPixelSize,
  mediaGridTileLogicalSize,
  resolveMediaThumbnailUri,
} from "./resolve-media-thumbnail";
import type { UserProfileMediaItem } from "./UserProfileMediaGallery";

const item: UserProfileMediaItem = {
  id: "a",
  source: "https://example.com/full.jpg",
  thumbnailSource: "https://example.com/thumb.jpg",
  alt: "a",
};

describe("mediaGridTileLogicalSize", () => {
  it("splits width across three columns with gaps", () => {
    expect(mediaGridTileLogicalSize(390, 3, 1)).toBeCloseTo((390 - 2) / 3);
  });
});

describe("mediaGridThumbnailPixelSize", () => {
  it("scales the logical tile by the device pixel ratio", () => {
    const logical = mediaGridTileLogicalSize(390, 3, 0);
    expect(mediaGridThumbnailPixelSize(390, 2, 3, 0)).toBe(
      Math.ceil(logical * 2),
    );
  });
});

describe("resolveMediaThumbnailUri", () => {
  it("prefers the parent resolver", () => {
    expect(
      resolveMediaThumbnailUri(item, 128, (row, px) => `${row.id}@${px}`),
    ).toBe("a@128");
  });

  it("falls back to thumbnailSource then source", () => {
    expect(resolveMediaThumbnailUri(item, 128)).toBe(item.thumbnailSource);
    expect(
      resolveMediaThumbnailUri(
        { ...item, thumbnailSource: undefined },
        128,
      ),
    ).toBe(item.source);
  });
});
