import { StyleSheet } from "react-native";

/**
 * Shared layout tokens for {@link "./PostBodyContent"} and gallery tiles
 * under {@link "./PostBodyByType}. Kept in one module so every body
 * subcomponent shares the same commentary ramp and press feedback.
 */
export const bodyStyles = StyleSheet.create({
  content: {
    fontSize: 15,
    lineHeight: 24,
  },
  pressableActive: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  galleryFrame: {
    borderRadius: 16,
    overflow: "hidden",
    gap: 0,
    width: "100%",
  },
  galleryRow: {
    flexDirection: "row",
  },
  galleryRowInner: {
    flex: 1,
    flexDirection: "row",
    gap: 0,
  },
  galleryColumn: {
    flex: 1,
    flexDirection: "column",
    gap: 0,
  },
  galleryTile: {
    flex: 1,
    overflow: "hidden",
  },
  galleryMoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  galleryMoreText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  gallery2to1: {
    aspectRatio: 2,
  },
  gallery16to9: {
    aspectRatio: 16 / 9,
  },
  gallery1to1: {
    aspectRatio: 1,
  },
});
