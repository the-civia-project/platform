/**
 * Tests for {@link "./resolve-header-shape".resolveHeaderShape}, the
 * pure folder that decides which optional sub-trees of the
 * {@link "./UserProfile".default} header should render. Pins the
 * kit's test-required "identity-only header when only required props
 * are passed" contract along with the action-row routing rules
 * (banner present → absolute overlay; banner absent → inline above
 * identity).
 */
import { describe, expect, it } from "vitest";
import {
  resolveHeaderShape,
  type ResolveHeaderShapeInput,
} from "./resolve-header-shape";

/**
 * The all-`undefined` base input: nothing optional is set. Tests
 * spread this and override the slot under inspection so each case
 * varies one axis at a time.
 */
const BASE: ResolveHeaderShapeInput = {
  banner: undefined,
  actions: undefined,
  handle: undefined,
  flag: undefined,
  location: undefined,
  bio: undefined,
  meta: undefined,
  stats: undefined,
};

describe("resolveHeaderShape", () => {
  it("renders identity-only when only required props are passed", () => {
    // The kit's test-pinned "identity-only header" contract: with no
    // optional slot set, every gate is `false` and the header renders
    // just the avatar + identity stack.
    expect(resolveHeaderShape(BASE)).toEqual({
      hasBanner: false,
      hasActionsOverlay: false,
      hasActionsInline: false,
      hasHandleRow: false,
      hasFlagRow: false,
      hasBio: false,
      hasMeta: false,
      hasStats: false,
      avatarOverlaps: false,
    });
  });

  describe("banner", () => {
    it("flips `hasBanner` and `avatarOverlaps` together", () => {
      const shape = resolveHeaderShape({
        ...BASE,
        banner: { source: "https://example.com/banner.jpg" },
      });
      expect(shape.hasBanner).toBe(true);
      expect(shape.avatarOverlaps).toBe(true);
    });

    it("leaves the other slot gates unchanged when no other props are set", () => {
      const shape = resolveHeaderShape({
        ...BASE,
        banner: { source: "https://example.com/banner.jpg" },
      });
      expect(shape.hasActionsOverlay).toBe(false);
      expect(shape.hasActionsInline).toBe(false);
      expect(shape.hasHandleRow).toBe(false);
      expect(shape.hasFlagRow).toBe(false);
      expect(shape.hasBio).toBe(false);
      expect(shape.hasMeta).toBe(false);
      expect(shape.hasStats).toBe(false);
    });
  });

  describe("actions routing", () => {
    it("renders the overlay slot when banner and actions are both set", () => {
      const shape = resolveHeaderShape({
        ...BASE,
        banner: { source: "https://example.com/banner.jpg" },
        actions: "follow",
      });
      expect(shape.hasActionsOverlay).toBe(true);
      expect(shape.hasActionsInline).toBe(false);
    });

    it("renders the inline slot when actions is set but banner is not", () => {
      const shape = resolveHeaderShape({
        ...BASE,
        actions: "follow",
      });
      expect(shape.hasActionsOverlay).toBe(false);
      expect(shape.hasActionsInline).toBe(true);
    });

    it("renders neither slot when actions is unset (regardless of banner)", () => {
      const shapeNoBanner = resolveHeaderShape(BASE);
      const shapeWithBanner = resolveHeaderShape({
        ...BASE,
        banner: { source: "https://example.com/banner.jpg" },
      });
      expect(shapeNoBanner.hasActionsOverlay).toBe(false);
      expect(shapeNoBanner.hasActionsInline).toBe(false);
      expect(shapeWithBanner.hasActionsOverlay).toBe(false);
      expect(shapeWithBanner.hasActionsInline).toBe(false);
    });

    it("treats null actions as 'unset' (no slot mounts)", () => {
      const shape = resolveHeaderShape({ ...BASE, actions: null });
      expect(shape.hasActionsOverlay).toBe(false);
      expect(shape.hasActionsInline).toBe(false);
    });
  });

  describe("flag row", () => {
    it("flips on when flag is set", () => {
      const shape = resolveHeaderShape({ ...BASE, flag: "RO" });
      expect(shape.hasFlagRow).toBe(true);
    });

    it("flips on when location is set (flag absent)", () => {
      // The flag row carries both citizenship (flag) and residence
      // (location); either alone is enough to render the row, since
      // the two are conceptually distinct and the demo of a
      // diaspora citizen with only a location is a real case.
      const shape = resolveHeaderShape({
        ...BASE,
        location: "Berlin, Germany",
      });
      expect(shape.hasFlagRow).toBe(true);
    });

    it("flips on when both flag and location are set", () => {
      const shape = resolveHeaderShape({
        ...BASE,
        flag: "RO",
        location: "Berlin, Germany",
      });
      expect(shape.hasFlagRow).toBe(true);
    });

    it("stays off when flag and location are both unset", () => {
      expect(resolveHeaderShape(BASE).hasFlagRow).toBe(false);
    });
  });

  describe("handle row", () => {
    it("flips on when handle is set", () => {
      expect(
        resolveHeaderShape({ ...BASE, handle: "aria" }).hasHandleRow,
      ).toBe(true);
    });

    it("stays off when handle is unset", () => {
      expect(resolveHeaderShape(BASE).hasHandleRow).toBe(false);
    });
  });

  describe("bio", () => {
    it("flips on for truthy ReactNodes (strings, elements)", () => {
      expect(resolveHeaderShape({ ...BASE, bio: "Bio text" }).hasBio).toBe(
        true,
      );
    });

    it("stays off for null / undefined / empty string", () => {
      expect(resolveHeaderShape({ ...BASE, bio: null }).hasBio).toBe(false);
      expect(resolveHeaderShape({ ...BASE, bio: undefined }).hasBio).toBe(
        false,
      );
      expect(resolveHeaderShape({ ...BASE, bio: "" }).hasBio).toBe(false);
    });
  });

  describe("meta array", () => {
    it("flips on for non-empty arrays", () => {
      const shape = resolveHeaderShape({
        ...BASE,
        meta: [{ icon: () => null, label: "Joined" }],
      });
      expect(shape.hasMeta).toBe(true);
    });

    it("stays off for empty arrays (no-meta is the same as undefined-meta)", () => {
      // The empty-array case is what differs from the truthy `bio`
      // check above -- the kit treats `meta: []` as "no entries to
      // render" so the row sub-tree stays unmounted instead of
      // rendering an empty flex container.
      expect(resolveHeaderShape({ ...BASE, meta: [] }).hasMeta).toBe(false);
    });

    it("stays off for undefined", () => {
      expect(resolveHeaderShape(BASE).hasMeta).toBe(false);
    });
  });

  describe("stats array", () => {
    it("flips on for non-empty arrays", () => {
      const shape = resolveHeaderShape({
        ...BASE,
        stats: [{ label: "Posts", value: 1 }],
      });
      expect(shape.hasStats).toBe(true);
    });

    it("stays off for empty arrays", () => {
      expect(resolveHeaderShape({ ...BASE, stats: [] }).hasStats).toBe(false);
    });

    it("stays off for undefined", () => {
      expect(resolveHeaderShape(BASE).hasStats).toBe(false);
    });
  });
});
