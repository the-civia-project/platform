import {
  Image as RNImage,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from "react-native";
import { webFocusOutlineStyle } from "../../../../core/web-focus-outline";
import { Image } from "../../../Media";
import { useTheme } from "../../../use-theme";
import { bodyStyles } from "./bodyStyles";
import type { GalleryMedia, PostImage } from "../../Post";

export type GalleryBodyProps = {
  media: GalleryMedia;
};

/** @param props - {@link GalleryBodyProps} */
export function GalleryBody({ media }: GalleryBodyProps) {
  return <GalleryBlock {...media} />;
}

function GalleryBlock({ images, onImagePress }: GalleryMedia) {
  const visible = images.slice(0, 4);
  const extras = Math.max(0, images.length - 4);
  if (visible.length === 0) return null;

  const tileHandler = onImagePress
    ? (index: number) => () => onImagePress(index)
    : () => undefined;

  if (visible.length === 1) {
    return <Image {...visible[0]} onPress={tileHandler(0)} />;
  }

  if (visible.length === 2) {
    return (
      <View
        style={[bodyStyles.galleryFrame, bodyStyles.galleryRow, bodyStyles.gallery2to1]}
      >
        <GalleryTile image={visible[0]} onPress={tileHandler(0)} extras={0} />
        <GalleryTile image={visible[1]} onPress={tileHandler(1)} extras={0} />
      </View>
    );
  }

  if (visible.length === 3) {
    return (
      <View
        style={[
          bodyStyles.galleryFrame,
          bodyStyles.galleryRow,
          bodyStyles.gallery16to9,
        ]}
      >
        <GalleryTile image={visible[0]} onPress={tileHandler(0)} extras={0} />
        <View style={bodyStyles.galleryColumn}>
          <GalleryTile image={visible[1]} onPress={tileHandler(1)} extras={0} />
          <GalleryTile image={visible[2]} onPress={tileHandler(2)} extras={0} />
        </View>
      </View>
    );
  }

  return (
    <View style={[bodyStyles.galleryFrame, bodyStyles.gallery1to1]}>
      <View style={bodyStyles.galleryRowInner}>
        <GalleryTile image={visible[0]} onPress={tileHandler(0)} extras={0} />
        <GalleryTile image={visible[1]} onPress={tileHandler(1)} extras={0} />
      </View>
      <View style={bodyStyles.galleryRowInner}>
        <GalleryTile image={visible[2]} onPress={tileHandler(2)} extras={0} />
        <GalleryTile
          image={visible[3]}
          onPress={tileHandler(3)}
          extras={extras}
        />
      </View>
    </View>
  );
}

type GalleryTileProps = {
  image: PostImage;
  onPress?: () => void;
  extras: number;
};

function GalleryTile({ image, onPress, extras }: GalleryTileProps) {
  const theme = useTheme();
  const innards = (
    <>
      <RNImage
        source={{ uri: image.source }}
        style={StyleSheet.absoluteFill}
        accessibilityLabel={image.alt}
      />
      {extras > 0 ? (
        <View
          style={[
            bodyStyles.galleryMoreOverlay,
            { backgroundColor: theme.scrim },
          ]}
        >
          <RNText style={bodyStyles.galleryMoreText}>+{extras}</RNText>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint={
          extras > 0
            ? `Opens image preview. ${extras} more ${extras === 1 ? "photo" : "photos"}.`
            : "Opens image preview"
        }
        accessibilityLabel={image.alt}
        onPress={onPress}
        style={({ pressed }) => [
          bodyStyles.galleryTile,
          webFocusOutlineStyle(),
          pressed && bodyStyles.pressableActive,
        ]}
      >
        {innards}
      </Pressable>
    );
  }
  return <View style={bodyStyles.galleryTile}>{innards}</View>;
}
