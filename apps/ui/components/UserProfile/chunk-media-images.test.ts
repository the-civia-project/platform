import { describe, expect, it } from "vitest";
import { chunkMediaImages } from "./chunk-media-images";

function item(id: string) {
  return { id, source: `https://example.com/${id}`, alt: id };
}

describe("chunkMediaImages", () => {
  it("returns an empty array for no images", () => {
    expect(chunkMediaImages([])).toEqual([]);
  });

  it("chunks into rows of three", () => {
    expect(
      chunkMediaImages([
        item("a"),
        item("b"),
        item("c"),
        item("d"),
        item("e"),
      ]),
    ).toEqual([[item("a"), item("b"), item("c")], [item("d"), item("e")]]);
  });

  it("honours a custom column count", () => {
    expect(chunkMediaImages([item("a"), item("b"), item("c")], 2)).toEqual([
      [item("a"), item("b")],
      [item("c")],
    ]);
  });
});
