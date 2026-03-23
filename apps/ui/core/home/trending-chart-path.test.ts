import { describe, expect, it } from "vitest";
import {
  buildSingleSeriesAreaPath,
  buildTrendingChartGeometry,
  pointsToPath,
  seriesToPoints,
} from "./trending-chart-path";

describe("trending-chart-path", () => {
  it("builds a path from two points", () => {
    const points = seriesToPoints([1, 3], 100, 50, 1, 3);
    expect(pointsToPath(points)).toBe("M0.00,50.00 L100.00,0.00");
  });

  it("uses a shared scale across series", () => {
    const [low, high] = buildTrendingChartGeometry(
      [
        [1, 2],
        [8, 10],
      ],
      80,
      40,
    );
    expect(low).toContain("M0.00,40.00");
    expect(high).toContain("L80.00,0.00");
  });

  it("closes a single-series area path along the bottom edge", () => {
    const area = buildSingleSeriesAreaPath([1, 3, 2], 60, 30);
    expect(area).toMatch(/Z$/);
    expect(area).toContain("L60.00,30.00");
    expect(area).toContain("L0.00,30.00");
  });
});
