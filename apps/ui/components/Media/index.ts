/**
 * Public surface for the kit's media primitives. Seven standalone
 * components that compose into anything that needs to render photos,
 * a mock video poster, a mock audio pill, or a resolved link preview:
 *
 * - {@link Image} -- a single rounded photo with optional press feedback.
 *   The atom every other media primitive defers to for tile rendering, so
 *   a future visual change (radius retune, accessibility-label policy,
 *   placeholder strategy) lands everywhere at once.
 * - {@link Video} -- a mock single-video tile: a rounded poster image
 *   with a centered play-button overlay painted on top. Stands in for a
 *   real player while the playback pipeline is upstream of the kit; the
 *   visual silhouette (and the `kind: "video"` shape it backs in
 *   {@link "../Post".Post}'s media slot) is ready today.
 * - {@link Audio} -- a mock audio pill: a hairline-bordered row with a
 *   primary play button, a deterministic waveform, and an optional
 *   duration label. Same "ship the silhouette while the playback
 *   pipeline catches up" pattern {@link Video} uses, but for voice
 *   notes / podcasts rather than video clips.
 * - {@link Mosaic} -- a vertical stack of differently-shaped {@link Image}
 *   tiles, each at its own declared aspect ratio. Use for posts that
 *   deliberately mix landscape, portrait, and square photos.
 * - {@link Carousel} -- a horizontal paged sequence of uniformly-shaped
 *   {@link Image} tiles with a {@link Dots} indicator below and (on
 *   desktop web) chevron overlays for pointer-only users.
 * - {@link Dots} -- pagination indicator used by {@link Carousel}, exposed
 *   on its own so other paginated surfaces (paged sheets, onboarding,
 *   light-weight previewers) can reuse it without rebuilding the
 *   geometry.
 * - {@link LinkPreview} -- hairline-bordered embed card for a resolved
 *   OpenGraph payload (thumbnail + title + description + domain). Used
 *   inside {@link "../Post".Post}'s `media` slot and reused by
 *   {@link "../PostComposer".PostComposer}'s staged-attachment preview.
 *
 * The Post component composes these into the `media` slot of its
 * discriminated union; consumers building feeds, previewers, or any other
 * media-bearing surface can import the same primitives directly without
 * pulling in `Post.tsx`.
 *
 * @example
 * ```tsx
 * import {
 *   Image,
 *   Video,
 *   Audio,
 *   Mosaic,
 *   Carousel,
 *   Dots,
 *   LinkPreview,
 * } from "ui/components/Media";
 *
 * <Image source="..." alt="Sunlit rooftops" />
 *
 * <Video source="..." alt="Studio walkthrough" onPress={openPlayer} />
 *
 * <Audio source="..." alt="Voice note" durationSeconds={32} onPress={play} />
 *
 * <Mosaic images={mosaicImages} onImagePress={openPreviewer} />
 *
 * <Carousel images={carouselImages} aspectRatio={1} onImagePress={openPreviewer} />
 *
 * <Dots count={total} activeIndex={current} />
 *
 * <LinkPreview preview={resolvedOg} onPress={openUrl} />
 * ```
 */
export { Image, type ImageData, type ImageProps } from "./Image";
export { Video, type VideoData, type VideoProps } from "./Video";
export { Audio, type AudioData, type AudioProps } from "./Audio";
export { Mosaic, type MosaicImage, type MosaicProps } from "./Mosaic";
export {
  Carousel,
  type CarouselImage,
  type CarouselProps,
} from "./Carousel";
export { Dots, type DotsProps } from "./Dots";
export {
  LinkPreview,
  type LinkPreviewData,
  type LinkPreviewProps,
} from "./LinkPreview";
