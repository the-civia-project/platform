/**
 * Pure allowed-image-type policy for the composer's image picker.
 * Lives in its own module so the rules ("JPEG, PNG, WebP only") are a
 * plain serialisable record that can be unit-tested in Node without
 * dragging `expo-image-picker` into the picture -- mirrors the split
 * between the pure helpers (`Button/resolve-surface`,
 * `PostComposer/draft`, ...) and the React shells that consume them.
 *
 * The policy intentionally accepts the modern set of web-renderable
 * raster formats and excludes anything that the rendered post can't
 * display cleanly (HEIC -- iOS-only, fails on Android/web; GIF /
 * animated formats -- the rendered post uses a static `Image`; BMP /
 * TIFF -- not supported by RN `Image`; SVG / vector formats -- not a
 * photo). Anything outside the allow-list is filtered out before it
 * reaches the {@link "../../components/PostComposer".PostDraft}.
 *
 * If product ever needs to widen the policy (e.g. accept HEIC by
 * routing it through a conversion step) the allow-list is the single
 * thing to retune -- the picker wiring stays untouched.
 */

/**
 * Canonical MIME types accepted by the composer's image picker. Used
 * by {@link isAllowedImageAsset} as the preferred discriminator when
 * the picker reports a `mimeType` for the asset. Lower-cased so the
 * comparison is case-insensitive at the call site.
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * File-name extensions that map to {@link ALLOWED_IMAGE_MIME_TYPES}.
 * Used as a fallback by {@link isAllowedImageAsset} when the picker
 * doesn't surface a `mimeType` (some Android backends, web file
 * inputs). `"jpg"` and `"jpeg"` are both listed because JPEG files
 * appear in the wild under both extensions and there's no value in
 * being pedantic about it.
 */
export const ALLOWED_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
] as const;

/**
 * Minimal shape this module needs to read off an
 * `expo-image-picker` asset. Carved out so the policy stays
 * framework-free (no `import * as ImagePicker` here) and tests can
 * pass plain objects without constructing real picker results. The
 * `null` half of each union exists because `expo-image-picker` types
 * these fields as `string | null | undefined` (the SDK can hand back
 * an explicit null for missing metadata); we treat null the same as
 * undefined throughout.
 */
export type ImageAssetLike = {
  /** Optional MIME type the picker reported for the asset. */
  mimeType?: string | null;
  /** Optional file name (with extension) the picker reported. */
  fileName?: string | null;
  /** The asset's URI; may include an extension as a last resort. */
  uri?: string | null;
};

/**
 * Returns `true` when `asset` matches the composer's allowed-image-
 * type policy. Resolution order:
 *
 * 1. If the asset reports a `mimeType`, match it (case-insensitively)
 *    against {@link ALLOWED_IMAGE_MIME_TYPES}. Picker backends that
 *    surface a mime type are the authoritative path.
 * 2. Otherwise fall back to parsing the file extension off
 *    `fileName` first, then `uri`. Query strings and fragments are
 *    stripped before the dot lookup so URLs like
 *    `https://.../photo.jpg?token=abc` still resolve to `jpg`.
 * 3. Anything without a usable mime type *or* extension is rejected.
 *
 * Pure: returns the boolean without modifying the input. Exported as
 * a named helper rather than inlined into the picker hook so tests
 * can lock the policy down independently of `expo-image-picker`.
 */
export function isAllowedImageAsset(asset: ImageAssetLike): boolean {
  if (asset.mimeType) {
    const mime = asset.mimeType.trim().toLowerCase();
    return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mime);
  }
  const extension = extensionFrom(asset.fileName) ?? extensionFrom(asset.uri);
  if (!extension) return false;
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(extension);
}

/**
 * Extracts the lowercase extension from a file name or URI, ignoring
 * query strings and fragments. Returns `null` when no extension is
 * present so the caller can short-circuit. Intentionally tolerant:
 * extracts the extension after the last dot rather than the first,
 * so paths like `image.tmp.jpeg` resolve to `jpeg` (the actual
 * format) rather than `tmp`. Accepts `null` as well as `undefined`
 * to mirror the picker's optional-field shape.
 */
function extensionFrom(source: string | null | undefined): string | null {
  if (!source) return null;
  const stripped = source.toLowerCase().split(/[?#]/)[0];
  const lastDot = stripped.lastIndexOf(".");
  const lastSlash = stripped.lastIndexOf("/");
  if (lastDot < 0 || lastDot < lastSlash) return null;
  const ext = stripped.slice(lastDot + 1);
  return ext.length === 0 ? null : ext;
}
