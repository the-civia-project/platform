export const TREND_CHART_DAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export type TrendChartPoint = { x: number; y: number };

/**
 * Maps a numeric series into plot coordinates. Values are scaled against the
 * shared min/max across every series passed to
 * {@link buildTrendingChartGeometry} so lines are comparable on one axis.
 */
export function seriesToPoints(
  values: readonly number[],
  plotWidth: number,
  plotHeight: number,
  min: number,
  max: number,
): TrendChartPoint[] {
  if (values.length === 0) {
    return [];
  }
  const range = max - min || 1;
  const step =
    values.length > 1 ? plotWidth / (values.length - 1) : plotWidth / 2;

  return values.map((value, index) => ({
    x: index * step,
    y: plotHeight - ((value - min) / range) * plotHeight,
  }));
}

export function pointsToPath(points: readonly TrendChartPoint[]): string {
  if (points.length === 0) {
    return "";
  }
  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`,
    )
    .join(" ");
}

function resolveSeriesScale(values: readonly number[]) {
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 1;
  return {
    min: min === max ? min - 1 : min,
    max: min === max ? max + 1 : max,
  };
}

export function buildTrendingChartGeometry(
  series: readonly (readonly number[])[],
  plotWidth: number,
  plotHeight: number,
) {
  const flat = series.flat();
  const min = flat.length > 0 ? Math.min(...flat) : 0;
  const max = flat.length > 0 ? Math.max(...flat) : 1;
  const paddedMin = min === max ? min - 1 : min;
  const paddedMax = min === max ? max + 1 : max;

  return series.map((values) =>
    pointsToPath(
      seriesToPoints(values, plotWidth, plotHeight, paddedMin, paddedMax),
    ),
  );
}

/** Line path for one topic, scaled to that topic's own min/max. */
export function buildSingleSeriesPath(
  values: readonly number[],
  plotWidth: number,
  plotHeight: number,
): string {
  const { min, max } = resolveSeriesScale(values);
  return pointsToPath(
    seriesToPoints(values, plotWidth, plotHeight, min, max),
  );
}

/** Closed area under {@link buildSingleSeriesPath} for a soft background fill. */
export function buildSingleSeriesAreaPath(
  values: readonly number[],
  plotWidth: number,
  plotHeight: number,
): string {
  const { min, max } = resolveSeriesScale(values);
  const points = seriesToPoints(values, plotWidth, plotHeight, min, max);
  if (points.length === 0) {
    return "";
  }
  const line = pointsToPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L${last.x.toFixed(2)},${plotHeight.toFixed(2)} L${first.x.toFixed(2)},${plotHeight.toFixed(2)} Z`;
}
