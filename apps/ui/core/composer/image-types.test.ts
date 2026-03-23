import { describe, expect, it } from "vitest";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  isAllowedImageAsset,
} from "./image-types";

describe("ALLOWED_IMAGE_MIME_TYPES", () => {
  it("contains exactly JPEG, PNG, and WebP", () => {
    expect([...ALLOWED_IMAGE_MIME_TYPES]).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
  });
});

describe("ALLOWED_IMAGE_EXTENSIONS", () => {
  it("contains exactly jpg, jpeg, png, webp", () => {
    expect([...ALLOWED_IMAGE_EXTENSIONS]).toEqual([
      "jpg",
      "jpeg",
      "png",
      "webp",
    ]);
  });
});

describe("isAllowedImageAsset", () => {
  describe("by mime type", () => {
    it("accepts image/jpeg, image/png, image/webp", () => {
      expect(isAllowedImageAsset({ mimeType: "image/jpeg" })).toBe(true);
      expect(isAllowedImageAsset({ mimeType: "image/png" })).toBe(true);
      expect(isAllowedImageAsset({ mimeType: "image/webp" })).toBe(true);
    });

    it("is case-insensitive", () => {
      expect(isAllowedImageAsset({ mimeType: "Image/JPEG" })).toBe(true);
      expect(isAllowedImageAsset({ mimeType: "IMAGE/PNG" })).toBe(true);
    });

    it("trims surrounding whitespace", () => {
      expect(isAllowedImageAsset({ mimeType: "  image/webp  " })).toBe(true);
    });

    it("rejects HEIC, GIF, BMP, and other image mime types", () => {
      expect(isAllowedImageAsset({ mimeType: "image/heic" })).toBe(false);
      expect(isAllowedImageAsset({ mimeType: "image/gif" })).toBe(false);
      expect(isAllowedImageAsset({ mimeType: "image/bmp" })).toBe(false);
      expect(isAllowedImageAsset({ mimeType: "image/svg+xml" })).toBe(false);
    });

    it("ignores fileName / uri when a mime type is present", () => {
      expect(
        isAllowedImageAsset({
          mimeType: "image/heic",
          fileName: "photo.jpg",
          uri: "file://photo.jpg",
        }),
      ).toBe(false);
    });
  });

  describe("by file extension (no mime type)", () => {
    it("accepts .jpg, .jpeg, .png, .webp via fileName", () => {
      expect(isAllowedImageAsset({ fileName: "photo.jpg" })).toBe(true);
      expect(isAllowedImageAsset({ fileName: "photo.jpeg" })).toBe(true);
      expect(isAllowedImageAsset({ fileName: "photo.png" })).toBe(true);
      expect(isAllowedImageAsset({ fileName: "photo.webp" })).toBe(true);
    });

    it("accepts the same extensions via uri when fileName is absent", () => {
      expect(isAllowedImageAsset({ uri: "file:///tmp/photo.png" })).toBe(true);
      expect(
        isAllowedImageAsset({ uri: "https://example.com/p.webp" }),
      ).toBe(true);
    });

    it("prefers fileName over uri when both are present", () => {
      expect(
        isAllowedImageAsset({
          fileName: "photo.heic",
          uri: "file:///tmp/photo.png",
        }),
      ).toBe(false);
    });

    it("is case-insensitive", () => {
      expect(isAllowedImageAsset({ fileName: "Photo.JPG" })).toBe(true);
      expect(isAllowedImageAsset({ fileName: "PHOTO.WEBP" })).toBe(true);
    });

    it("strips query strings and fragments before reading the extension", () => {
      expect(
        isAllowedImageAsset({
          uri: "https://example.com/p.jpg?token=abc",
        }),
      ).toBe(true);
      expect(
        isAllowedImageAsset({
          uri: "https://example.com/p.webp#anchor",
        }),
      ).toBe(true);
    });

    it("uses the last dot when multiple dots are present", () => {
      expect(isAllowedImageAsset({ fileName: "image.tmp.jpeg" })).toBe(true);
      expect(isAllowedImageAsset({ fileName: "image.jpeg.heic" })).toBe(false);
    });

    it("rejects unsupported extensions", () => {
      expect(isAllowedImageAsset({ fileName: "photo.heic" })).toBe(false);
      expect(isAllowedImageAsset({ fileName: "photo.gif" })).toBe(false);
      expect(isAllowedImageAsset({ fileName: "photo.bmp" })).toBe(false);
      expect(isAllowedImageAsset({ fileName: "photo.svg" })).toBe(false);
    });

    it("rejects when there is no extension at all", () => {
      expect(isAllowedImageAsset({ fileName: "photo" })).toBe(false);
      expect(isAllowedImageAsset({ uri: "file:///tmp/photo" })).toBe(false);
    });

    it("rejects when the dot is part of a directory name, not an extension", () => {
      expect(
        isAllowedImageAsset({ uri: "file:///my.photos/picture" }),
      ).toBe(false);
    });
  });

  describe("empty input", () => {
    it("rejects an asset with no mime type, no fileName, and no uri", () => {
      expect(isAllowedImageAsset({})).toBe(false);
    });

    it("rejects an empty mime type and falls through to extension parsing", () => {
      expect(
        isAllowedImageAsset({ mimeType: "", fileName: "photo.png" }),
      ).toBe(true);
    });

    it("treats null mimeType / fileName / uri the same as undefined", () => {
      expect(
        isAllowedImageAsset({
          mimeType: null,
          fileName: null,
          uri: null,
        }),
      ).toBe(false);
      expect(
        isAllowedImageAsset({
          mimeType: null,
          fileName: "photo.jpg",
          uri: null,
        }),
      ).toBe(true);
    });
  });
});
