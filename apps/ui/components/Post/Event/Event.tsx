/**
 * Visual silhouette of an event attachment. Renders a card with a
 * date stack on the left, a textual stack on the right (title, time
 * range, place, online/in-person flag, RSVP count), and an optional
 * RSVP affordance pinned to the bottom. **Does not run an RSVP
 * pipeline** -- the kit primitive paints the shape; real ticketing,
 * reminders, calendar exports, and identity-bound RSVP records live
 * upstream of this file, same precedent {@link "../../Media".Video} /
 * {@link "../../Media".Audio} / {@link "../Poll".Poll} use.
 *
 * The component is **read-only by default**: when
 * {@link EventProps.onRsvpPress} is omitted there is no RSVP button.
 * When the handler is wired *and* {@link PostEvent.viewerRsvped} is
 * `false` (or unset), an "RSVP" button appears; when the viewer has
 * already RSVPed (`viewerRsvped: true`), the button reads "Going" and
 * the press handler still fires so the host can offer to drop the
 * RSVP -- the kit defers to the upstream pipeline on whether re-tap
 * means cancel or no-op.
 *
 * The card carries the same hairline-bordered envelope every other
 * structured-tile primitive uses
 * ({@link "../../Media".LinkPreview} / {@link "../../Media".Audio} /
 * {@link "../Poll".Poll}) so a feed mixing them reads with a
 * consistent surface vocabulary.
 *
 * @example
 * ```tsx
 * <Event
 *   title="Neighbourhood town hall: budget Q&A"
 *   start={new Date("2026-06-12T18:00:00")}
 *   end={new Date("2026-06-12T20:00:00")}
 *   place="Community Centre, Sector 2"
 *   format="in-person"
 *   rsvpCount={42}
 *   onRsvpPress={() => console.log("RSVP")}
 * />
 * ```
 */
import { Globe, MapPin, Users } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import Button from "../../Button";
import { StructuredTile } from "../../StructuredTile";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";

/**
 * Where the event happens. Drives the kit's `MapPin` vs `Globe` icon
 * and the small label next to it -- "In person" vs "Online". A
 * future hybrid case would extend the union with `"hybrid"`; the kit
 * doesn't currently render it because the demo data never produces a
 * meaningful hybrid record (a hybrid event has *both* a physical
 * place *and* a join URL, which is two affordances the kit primitive
 * doesn't have room for at feed-row density).
 */
export type PostEventFormat = "online" | "in-person";

/**
 * Tile-data shape -- the half of {@link EventProps} that describes the
 * event itself. Carved out as a named type so consumers that *store*
 * event attachments (drafts, feed rows, future event archives) can
 * type their records with a single shape and pair each record with
 * its own RSVP handler at render time.
 *
 * Pairs 1:1 with {@link "../Post".EventMedia.event}.
 */
export type PostEvent = {
  /**
   * Headline / event title. Rendered as the tile's primary line in
   * the kit's emphasised body weight. No prefix glyph, no decoration;
   * pass the title verbatim.
   */
  title: string;
  /**
   * Start instant. The kit renders the date stack from this value
   * (day-of-month numeral + abbreviated month) and the time-range
   * line ("18:00", "18:00 - 20:00") from `start` + {@link end}. Pass
   * a `Date`; the kit does no timezone math -- the value's local
   * representation is what reads.
   */
  start: Date;
  /**
   * Optional end instant. When set the time-range line reads
   * `start - end` ("18:00 - 20:00"); when omitted it reads just the
   * start time. The kit does not validate `end > start` -- product
   * code is expected to enforce the ordering before the record
   * reaches the renderer.
   */
  end?: Date;
  /**
   * Place string. For in-person events this is the venue + locality
   * ("Community Centre, Sector 2"); for online events it can be a
   * platform name ("On Civia") or omitted entirely (the format
   * label then carries the line). The kit renders it as a single
   * line of muted copy under the time range.
   */
  place?: string;
  /**
   * Online vs in-person. Drives the kit's globe / map-pin glyph next
   * to the format label. {@link "./Event".PostEventFormat} for the
   * full union.
   */
  format: PostEventFormat;
  /**
   * Running tally of RSVPs. Rendered as a small users-icon row at
   * the bottom of the tile ("42 going"). Pass `0` for unstarted
   * events; the kit renders "0 going" cleanly rather than hiding
   * the row -- "no one has RSVPed yet" is a meaningful signal.
   */
  rsvpCount: number;
  /**
   * Whether the *viewer* has already RSVPed. When `true` the RSVP
   * button (if rendered) reads "Going" and gets the kit's primary
   * accent; when `false` (or omitted) the button reads "RSVP". The
   * kit does *not* deduplicate presses -- the upstream pipeline
   * owns the "one RSVP per identity" invariant; the kit just paints
   * the state.
   * @defaultValue false
   */
  viewerRsvped?: boolean;
};

/**
 * Public props for {@link Event}.
 */
export type EventProps = PostEvent & {
  /**
   * Optional press handler. Fires when the viewer taps the RSVP
   * button. When omitted no button is rendered -- the tile reads as
   * an announcement-style event-record. When wired the button shows
   * "RSVP" (or "Going" when {@link PostEvent.viewerRsvped} is set);
   * either way the press fires this handler. Product code typically
   * routes the handler to an "add to / drop from my events" mutation
   * and flips `viewerRsvped` from inside it so the new state
   * surfaces.
   */
  onRsvpPress?: () => void;
};

/**
 * Renders the event silhouette described in the file header.
 *
 * @param props - {@link EventProps}
 */
export function Event({
  title,
  start,
  end,
  place,
  format,
  rsvpCount,
  viewerRsvped = false,
  onRsvpPress,
}: EventProps) {
  const theme = useTheme();
  const FormatIcon = format === "online" ? Globe : MapPin;
  const formatLabel = format === "online" ? "Online" : "In person";
  const rsvpLabel = `${rsvpCount} ${rsvpCount === 1 ? "going" : "going"}`;

  return (
    <StructuredTile variant="attachment">
      <View style={styles.row}>
        <DateStack date={start} />
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <RNText
            style={[styles.timeRange, { color: theme.fgEmphasis }]}
            numberOfLines={1}
          >
            {formatTimeRange(start, end)}
          </RNText>
          {place ? (
            <RNText
              style={[styles.metaLine, { color: theme.fgMuted }]}
              numberOfLines={1}
            >
              {place}
            </RNText>
          ) : null}
          <View style={styles.metaRow}>
            <FormatIcon size={14} color={theme.fgMuted} />
            <RNText style={[styles.metaLine, { color: theme.fgMuted }]}>
              {formatLabel}
            </RNText>
            <RNText style={[styles.metaSep, { color: theme.fgMuted }]}>
              {"\u00B7"}
            </RNText>
            <Users size={14} color={theme.fgMuted} />
            <RNText style={[styles.metaLine, { color: theme.fgMuted }]}>
              {rsvpLabel}
            </RNText>
          </View>
        </View>
      </View>
      {onRsvpPress ? (
        <View style={styles.actionRow}>
          <Button
            variant={viewerRsvped ? "primary" : "simple"}
            onPress={onRsvpPress}
          >
            {viewerRsvped ? "Going" : "RSVP"}
          </Button>
        </View>
      ) : null}
    </StructuredTile>
  );
}

export default Event;

/**
 * Date-stack glyph on the left of the event tile. Two-line stack:
 * day-of-month numeral on top in a heavier weight, abbreviated month
 * underneath in the kit's muted foreground. Doesn't render the year
 * -- a kit-row event is virtually always "in the next few weeks" and
 * cluttering the stack with a year reads as date-of-archive rather
 * than date-of-event. Product code that needs explicit year context
 * can put it in the {@link PostEvent.place} or title.
 *
 * Kept private to this file because the stack's geometry (84px
 * width, two-line layout) only makes sense inside the event tile.
 */
function DateStack({ date }: { date: Date }) {
  const theme = useTheme();
  const day = date.getDate();
  const month = date.toLocaleString(undefined, { month: "short" });
  return (
    <View style={[styles.dateStack, { backgroundColor: theme.surfaceWell }]}>
      <RNText
        style={[styles.dateMonth, { color: theme.fgMuted }]}
        numberOfLines={1}
      >
        {month.toUpperCase()}
      </RNText>
      <RNText
        style={[styles.dateDay, { color: theme.fgEmphasis }]}
        numberOfLines={1}
      >
        {day}
      </RNText>
    </View>
  );
}

/**
 * Formats the time-range line under the title. Returns `"18:00 -
 * 20:00"` when both bounds are present, `"18:00"` when only `start`
 * is. Uses `Date#toLocaleTimeString` with `hour: "2-digit"` and
 * `minute: "2-digit"` so the output respects the host locale's
 * conventions (24-hour in most of Europe, 12-hour in en-US) without
 * the kit baking in a format preference.
 */
function formatTimeRange(start: Date, end?: Date): string {
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const startLabel = start.toLocaleTimeString(undefined, opts);
  if (!end) return startLabel;
  const endLabel = end.toLocaleTimeString(undefined, opts);
  return `${startLabel} \u2013 ${endLabel}`;
}

const styles = StyleSheet.create({
  /**
   * Outer hairline-bordered card. Matches the kit's structured-tile
   * surface vocabulary so a feed mixing event / poll / link previews
   * reads with a consistent envelope.
   */
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  /**
   * Horizontal layout: date stack on the left, textual stack on the
   * right. 12px gap matches the container's internal rhythm.
   */
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  /**
   * Two-line date stack. Fixed width so the right-side text body
   * gets predictable wrap behaviour regardless of the day-of-month's
   * digit count (1 vs 31).
   */
  dateStack: {
    width: 56,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26,
  },
  /**
   * Vertical stack on the right side of the row. `flex: 1` so the
   * title can wrap inside its 2-line cap without the row's children
   * fighting for width.
   */
  body: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  timeRange: {
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
  },
  metaLine: {
    fontSize: 12,
    lineHeight: 16,
  },
  /**
   * Bottom meta row: format-icon + label + middle dot + RSVP count.
   * `flexWrap` lets the line break on very narrow tiles rather than
   * truncating the rsvp count.
   */
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  metaSep: {
    fontSize: 12,
    paddingHorizontal: 2,
  },
  /**
   * Right-aligned action row with the RSVP affordance. Mirrors the
   * action-row vocabulary {@link "../Post".Post}'s footer uses.
   */
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
