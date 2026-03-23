/**
 * Thin hook over `expo-image-picker` that adapts the picker's
 * {@link ImagePickerAsset} shape into the kit's
 * {@link "../../components/Media".ImageData} shape -- so callers in
 * `views/` can wire the composer's `onAddPictures` intent without
 * touching `expo-image-picker` directly.
 *
 * Lives in `core/` per the AGENTS.md split: the kit primitive
 * (`apps/ui/components/PostComposer`) stays presentational; the
 * picker integration is app-internal feature code.
 *
 * Single-affordance API: the hook exposes one function,
 * {@link ImagePickerApi.pickPictures}, that always launches the
 * system picker in multi-select mode (with `allowsMultipleSelection`
 * flipped off when the caller asks for at most 1 to opt into the
 * native single-pick UI). The caller's
 * {@link "../../components/PostComposer".addPictures} helper
 * promotes/demotes between {@link "../../components/Post".ImageMedia}
 * and {@link "../../components/Post".GalleryMedia} based on the
 * photo count, so a single picker covers both shapes without the
 * host having to branch on selection size.
 *
 * Allowed-type policy: the hook only forwards assets that match
 * {@link "./image-types".isAllowedImageAsset} (JPEG, PNG, WebP).
 * Anything else (HEIC, GIF, animated formats, ...) is dropped from
 * the returned list so the composer never ingests media the rendered
 * `Post` can't display cleanly. The policy itself lives in
 * {@link "./image-types"}; this hook stays focused on picker
 * integration.
 *
 * The hook does **not** request permissions itself -- on iOS and
 * Android, `launchImageLibraryAsync` will prompt the user the first
 * time it's called. A future revision can add an explicit
 * `requestMediaLibraryPermissionsAsync` step if the product needs to
 * show a custom rationale UI.
 */
import { useCallback, useMemo } from "react";
import * as ImagePicker from "expo-image-picker";
import type { ImageData } from "../../components/Media";
import { isAllowedImageAsset } from "./image-types";

/**
 * Public API returned by {@link useImagePicker}.
 */
export type ImagePickerApi = {
  /**
   * Opens the system photo picker and resolves with the user's
   * selection (filtered to the allowed types -- see
   * {@link "./image-types"}). Returns an empty array when the user
   * cancels, picks nothing usable, or picks only files in
   * unsupported formats. The result is capped at `max` (default `4`,
   * mirroring `Post.tsx`'s gallery cap) so callers don't have to
   * post-trim. Returns early with `[]` when `max <= 0`, so a host
   * that's already at the cap can call this safely without checking
   * itself.
   */
  pickPictures: (max?: number) => Promise<ImageData[]>;
};

/**
 * Returns the picker API memoised so the consumer can put it in a
 * `useEffect` dependency list without forcing a re-render on every
 * tick. The default `max` is `4`, matching the rendered post's
 * gallery layout (`Post.tsx` only shows the first four tiles before
 * collapsing extras under a `+N` scrim).
 */
export function useImagePicker(): ImagePickerApi {
  const pickPictures = useCallback(
    async (max = 4): Promise<ImageData[]> => {
      if (max <= 0) return [];
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: max > 1,
        selectionLimit: max,
        quality: 0.9,
      });
      if (result.canceled) return [];
      return result.assets
        .filter(isAllowedImageAsset)
        .slice(0, max)
        .map(assetToImageData);
    },
    [],
  );

  return useMemo(() => ({ pickPictures }), [pickPictures]);
}

/**
 * Projects an `expo-image-picker` {@link ImagePicker.ImagePickerAsset}
 * into the kit's {@link ImageData} shape. The picker's `uri` is the
 * source, `width / height` derives the aspect ratio, and the optional
 * `fileName` (when available) seeds the `alt` -- giving every picked
 * photo a non-empty accessibility label by default. Falls back to a
 * generic "Selected photo" so the kit's "alt is required" contract is
 * always met.
 */
function assetToImageData(asset: ImagePicker.ImagePickerAsset): ImageData {
  const aspectRatio =
    asset.width > 0 && asset.height > 0 ? asset.width / asset.height : undefined;
  const alt = asset.fileName?.trim() || "Selected photo";
  return {
    source: asset.uri,
    alt,
    aspectRatio,
  };
}
