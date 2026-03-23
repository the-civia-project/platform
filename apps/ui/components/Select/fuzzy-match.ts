/**
 * Typo-tolerant fuzzy matching for the kit `Select` option filter.
 *
 * Each option haystack is scored on a 0–1000 confidence scale (higher is a
 * better match). The scorer combines ordered subsequence matching (fast path
 * for abbreviations) with bounded-edit (Levenshtein) similarity against the
 * full haystack, individual tokens, and short sliding windows so typos such as
 * `pariz` → `Paris` or `amsterdm` → `Amsterdam` still surface the right row.
 * Pure functions only — safe to unit-test in Node.
 */
import type { SelectOption } from "./types";

/** Minimum confidence (0–1000) required to keep an option in the result set. */
const MIN_CONFIDENCE = 220;

/**
 * Edit-distance budget for {@link levenshteinSimilarity} derived from query
 * length — short queries stay strict to limit false positives.
 */
function maxAllowedEdits(queryLength: number): number {
  if (queryLength <= 2) return 0;
  if (queryLength <= 4) return 1;
  return Math.min(3, Math.floor(queryLength / 3));
}

/**
 * Classic Levenshtein distance between two strings (insert / delete / substitute).
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const n = b.length;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n]!;
}

/**
 * Maps edit distance to a 0–1000 confidence with prefix and length bonuses.
 * Returns `null` when the distance exceeds the typo budget.
 */
function levenshteinSimilarity(
  query: string,
  target: string,
): number | null {
  if (!target.length) return null;

  const dist = levenshtein(query, target);
  const allowed = maxAllowedEdits(query.length);
  if (dist > allowed) return null;

  const maxLen = Math.max(query.length, target.length);
  let score = ((maxLen - dist) / maxLen) * 700;

  if (target.startsWith(query)) score += 220;
  else if (target.length >= query.length) {
    const prefix = target.slice(0, query.length);
    if (levenshtein(query, prefix) <= allowed) score += 140;
  }

  if (target.length <= query.length + 2) score += 60;

  return score;
}

/**
 * Ordered subsequence match with gap / consecutive bonuses (no typos).
 * Returns `null` when not all query characters appear in order.
 */
function subsequenceConfidence(query: string, haystack: string): number | null {
  let qi = 0;
  let prevMatch = -1;
  let score = 0;

  for (let hi = 0; hi < haystack.length && qi < query.length; hi++) {
    if (haystack[hi] !== query[qi]) continue;

    const isFirst = prevMatch === -1;
    const gap = isFirst ? 0 : hi - prevMatch - 1;
    const startsHaystack = isFirst && hi === 0;
    const consecutive = !isFirst && hi === prevMatch + 1;
    const wordStart = isFirst && (hi === 0 || haystack[hi - 1] === " ");

    score += 40;
    if (startsHaystack) score += 80;
    if (wordStart) score += 50;
    if (consecutive) score += 35;
    score -= gap * 6;

    prevMatch = hi;
    qi++;
  }

  if (qi < query.length) return null;

  if (haystack.startsWith(query)) score += 180;
  return score + 120;
}

/**
 * Collects candidate substrings to compare with the query (full haystack,
 * whitespace-delimited tokens, and short windows anchored in the haystack).
 */
function similarityCandidates(query: string, haystack: string): string[] {
  const pad = maxAllowedEdits(query.length) + 2;
  const maxWindow = query.length + pad;
  const out = new Set<string>();

  out.add(haystack);
  for (const word of haystack.split(/\s+/)) {
    if (word) out.add(word);
  }

  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] === query[0]) {
      out.add(haystack.slice(i, i + maxWindow));
    }
  }

  return [...out];
}

/**
 * Best Levenshtein-based confidence across {@link similarityCandidates}.
 */
function bestTypoConfidence(query: string, haystack: string): number | null {
  let best: number | null = null;
  for (const candidate of similarityCandidates(query, haystack)) {
    const score = levenshteinSimilarity(query, candidate);
    if (score === null) continue;
    best = best === null ? score : Math.max(best, score);
  }
  return best;
}

/**
 * Computes fuzzy match confidence for `query` against `haystack`, or `null`
 * when the match is too weak to show.
 *
 * - Trimming: leading/trailing whitespace on `query` is ignored; an empty
 *   string after trim matches everything with confidence `0` (show full list).
 * - Case: comparison is ASCII case-insensitive via `toLowerCase()`.
 * - Typos: bounded edit distance per {@link maxAllowedEdits}.
 * - Ranking: higher confidence is a better match (subsequence beats loose
 *   typo matches when both apply).
 *
 * @param query - User-typed filter text.
 * @param haystack - Option label plus any {@link SelectOption.searchText}.
 * @returns Confidence in `0…1000` (higher is better) or `null` when excluded.
 */
export function fuzzyScore(query: string, haystack: string): number | null {
  const q = query.trim().toLowerCase();
  const h = haystack.toLowerCase();
  if (q.length === 0) return 0;

  const candidates = [
    subsequenceConfidence(q, h),
    bestTypoConfidence(q, h),
  ].filter((s): s is number => s !== null);

  if (candidates.length === 0) return null;

  const best = Math.max(...candidates);
  return best >= MIN_CONFIDENCE ? best : null;
}

/**
 * Builds the default search string for one option: {@link SelectOption.label}
 * plus optional {@link SelectOption.searchText}, joined with a space so
 * abbreviations and metadata participate in fuzzy ranking without changing
 * the visible label.
 *
 * @typeParam T - Option value type carried alongside the label.
 * @param option - Row definition from the select option list.
 */
export function defaultSelectSearchHaystack<T>(option: SelectOption<T>): string {
  const extra = option.searchText?.trim();
  return extra ? `${option.label} ${extra}` : option.label;
}

/**
 * Returns options ordered by descending match confidence. When `query` is
 * empty or whitespace-only, returns a shallow copy of `options` in source order.
 *
 * @typeParam T - Option value type.
 * @param options - Full option list before filtering.
 * @param query - Current search string from the picker field.
 * @param haystackFor - Maps each option to the string passed to {@link fuzzyScore}.
 */
export function rankSelectOptionsByFuzzyQuery<T>(
  options: ReadonlyArray<SelectOption<T>>,
  query: string,
  haystackFor: (option: SelectOption<T>) => string = defaultSelectSearchHaystack,
): SelectOption<T>[] {
  const trimmed = query.trim();
  if (!trimmed) return [...options];

  const ranked = options
    .map((option) => ({
      option,
      confidence: fuzzyScore(trimmed, haystackFor(option)),
    }))
    .filter(
      (row): row is { option: SelectOption<T>; confidence: number } =>
        row.confidence !== null,
    )
    .sort((a, b) => b.confidence - a.confidence);

  return ranked.map((row) => row.option);
}
