/**
 * Visual silhouette of a poll attachment. Renders the question, each
 * option as a percentage-bar row, and a footer with the total tally
 * and an optional deadline label. **Does not run a ballot** -- the
 * kit primitive paints the shape; the real vote pipeline (option
 * selection persistence, deduplication, deadline enforcement, public
 * tally aggregation) lives upstream of this file, same precedent as
 * {@link "../../Media".Video} / {@link "../../Media".Audio}.
 *
 * The component is **read-only by default** in two ways:
 *
 * 1. When {@link PollProps.onVotePress} is omitted, every option row
 *    renders as a static {@link "react-native".View}, not a
 *    {@link "react-native".Pressable} -- the poll is "results only".
 * 2. When {@link PostPoll.viewerVoteId} is set (the viewer has
 *    already voted), the rows render as static even if a handler is
 *    wired -- the kit doesn't let a viewer vote twice through the
 *    primitive, because the upstream pipeline owns the "one ballot
 *    per identity" invariant.
 *
 * Only when *both* `onVotePress` is wired *and* `viewerVoteId` is
 * `undefined` do the rows become pressable. The selected option (when
 * present) is highlighted with the kit's `primary` accent.
 *
 * Percentages are computed from the running tallies on the options
 * (`option.votes / total`); the total is the sum of every option's
 * `votes` so a one-vote poll where the viewer hasn't voted yet
 * renders `100% / 0% / 0%` against the one option that has been
 * picked elsewhere. Zero-vote polls fall back to `0%` on every
 * option (no division-by-zero hazard).
 *
 * @example
 * ```tsx
 * <Poll
 *   question="Which library lane should we adopt for the new design system?"
 *   options={[
 *     { id: "react-native-svg",         label: "React Native SVG",     votes: 84 },
 *     { id: "react-native-skia",        label: "React Native Skia",    votes: 49 },
 *     { id: "platform-native-vectors",  label: "Platform-native (PDF / SVG bridges)", votes: 12 },
 *   ]}
 *   deadlineLabel="Closes Friday 18:00"
 *   onVotePress={(id) => console.log("Vote", id)}
 * />
 * ```
 */
import { StyleSheet, Text as RNText, View } from "react-native";
import { MetaLine } from "../../MetaLine";
import { ProportionRow } from "../../ProportionRow";
import { StructuredTile } from "../../StructuredTile";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";

/**
 * One option in a {@link PostPoll}. Mirrors the shape a public-consultation
 * ballot row would carry: a stable identifier so the viewer's vote can
 * map back to one option across re-renders, a display label, and a
 * running tally.
 */
export type PostPollOption = {
  /**
   * Stable identifier. Used as the React `key` for the row *and* as
   * the value passed to {@link PollProps.onVotePress}; must be
   * unique within the poll's {@link PostPoll.options} list. The kit
   * doesn't normalise this string (no case-folding, no trimming) --
   * the upstream pipeline owns id semantics.
   */
  id: string;
  /**
   * Display copy for the option. Rendered as a single-line label
   * inside the option row; wraps to two lines if the row's width
   * forces it (the kit doesn't truncate).
   */
  label: string;
  /**
   * Running tally for this option. Used to compute the option's
   * percentage of the total (sum across every option). Pass `0` for
   * unstarted polls; the kit renders `0%` cleanly without dividing
   * by zero.
   */
  votes: number;
};

/**
 * Tile-data shape -- the half of {@link PollProps} that describes the
 * poll itself. Carved out as a named type so consumers that *store*
 * poll attachments (drafts, feed rows, future poll archives) can
 * type their records with a single shape and pair each record with
 * its own press handler at render time rather than baking the
 * handler into storage.
 *
 * Pairs 1:1 with {@link "../Post".PollMedia.poll}.
 */
export type PostPoll = {
  /**
   * Headline / call-to-vote. Rendered above the option rows in the
   * kit's emphasised body weight so it reads as the tile's primary
   * subject. The kit doesn't render a leading `Q:` glyph or any other
   * decoration; pass the question verbatim.
   */
  question: string;
  /**
   * Two-or-more options the poll lets viewers vote between. The kit
   * doesn't enforce the lower bound at the type level (TypeScript
   * tuples for "2 or more" aren't ergonomic for a JSON-shaped
   * record); product code should not pass `< 2` options because the
   * resulting tile reads as nonsense, but the renderer doesn't
   * throw. Rendered in array order, top to bottom.
   */
  options: PostPollOption[];
  /**
   * Optional human-readable deadline ("Closes Friday 18:00", "Open
   * for 7 more days"). Rendered in the footer next to the total
   * vote count. The kit doesn't parse this string -- formatting,
   * relative-time math, and timezone display are the caller's call.
   */
  deadlineLabel?: string;
  /**
   * Optional {@link PostPollOption.id} the viewer has already chosen.
   * When set, the matching option row gets the kit's `primary` accent
   * treatment + a check glyph, and every row becomes static (no
   * `Pressable`) so the viewer can't re-vote through the kit. When
   * omitted, no option is highlighted; rows are pressable iff
   * {@link PollProps.onVotePress} is also wired.
   */
  viewerVoteId?: string;
};

/**
 * Public props for {@link Poll}.
 */
export type PollProps = PostPoll & {
  /**
   * Optional press handler. Fires with the tapped option's
   * {@link PostPollOption.id} when the viewer picks one. When
   * omitted, every option row renders as a static {@link View};
   * when wired *and* {@link PostPoll.viewerVoteId} is undefined,
   * rows become pressable. The kit never fires this handler for a
   * row whose `id` matches the current `viewerVoteId` -- the
   * viewer has already voted, the row is inert.
   *
   * Wire to your "cast vote" mutation; the parent flips
   * {@link PostPoll.viewerVoteId} from inside this handler to
   * surface the new state.
   */
  onVotePress?: (optionId: string) => void;
};

/**
 * Renders the poll silhouette described in the file header.
 *
 * @param props - {@link PollProps}
 */
export function Poll({
  question,
  options,
  deadlineLabel,
  viewerVoteId,
  onVotePress,
}: PollProps) {
  const theme = useTheme();
  const total = options.reduce((sum, o) => sum + o.votes, 0);
  const hasVoted = viewerVoteId !== undefined;
  const totalLabel = `${total} ${total === 1 ? "vote" : "votes"}`;

  return (
    <StructuredTile variant="attachment" gap={12}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const ratio = total > 0 ? option.votes / total : 0;
          return (
            <ProportionRow
              key={option.id}
              label={option.label}
              ratio={ratio}
              trailing={`${Math.round(ratio * 100)}%`}
              selected={option.id === viewerVoteId}
              onPress={
                hasVoted || onVotePress == null
                  ? undefined
                  : () => onVotePress(option.id)
              }
              accessibilityHint="Casts a vote for this option"
            />
          );
        })}
      </View>
      {deadlineLabel != null ? (
        <MetaLine segments={[totalLabel, deadlineLabel]} tone="footer" />
      ) : (
        <RNText style={[styles.footer, { color: theme.fgMuted }]}>
          {totalLabel}
        </RNText>
      )}
    </StructuredTile>
  );
}

export default Poll;

const styles = StyleSheet.create({
  question: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  options: {
    gap: 8,
  },
  footer: {
    fontSize: 12,
    lineHeight: 16,
  },
});
