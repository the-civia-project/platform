/**
 * Profile row: leading {@link Avatar}, then an identity stack (display name, optional
 * `@handle`, country flag, optional `from` location). When {@link ProfileProps.handle}
 * or {@link ProfileProps.from} is set and {@link ProfileProps.inline} is off, the stack
 * uses multiple lines (name, then `@handle`, then flag + location). With only a name and
 * flag, the flag stays inline at the end of the name. The `flag` prop accepts an ISO 3166-1 alpha-2 country
 * code and is rendered as a real PNG via `react-native-country-flag` (FlagCDN), with a
 * theme-inverted hairline border so the flag rectangle reads cleanly on either theme.
 */
import { StyleSheet, View } from "react-native";
import CountryFlag from "react-native-country-flag";
import Avatar, { type AvatarSize } from "./Avatar";
import { Code, Text } from "./Typography";
import { useTheme } from "./use-theme";

/** Accessibility label for the leading avatar from identity fields. */
function profileAvatarLabel(name?: string, handle?: string): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return `${trimmedName}'s avatar`;
  }
  if (handle) {
    return `@${handle}'s avatar`;
  }
  return "User avatar";
}

/**
 * `#rrggbb` foreground token to `rgba(r,g,b,a)` for hairlines over raster assets.
 */
function hexFgToRgba(fg: string, alpha: number): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(fg.trim());
  if (!m) {
    return fg;
  }
  const n = Number.parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Density preset for the {@link Profile} row.
 *
 * - `md` (default): the screen-header sizing -- `Avatar` 48px, name 17px, meta 14px,
 *   flag 16px, 12px gap. Use for the top of a screen, a profile card hero, or any
 *   surface where the person is the primary subject.
 * - `sm`: the compact preset -- `Avatar` 32px, name 14px, meta 12px, flag 12px, 8px
 *   gap. Use inside nested compositions where the person is secondary context:
 *   comment author rows, member chips in a sidebar list.
 * - `xs`: the densest preset -- `Avatar` 24px, name 13px, meta 11px, flag 11px, 6px
 *   gap. Designed for the {@link PostRelation} embedded inset (repost / comment
 *   / quote / correction / retraction) and similarly cramped slots (inline
 *   mentions, autocomplete results, very dense lists) where every pixel counts
 *   and the surrounding type sets the dominant rhythm.
 */
export type ProfileSize = "xs" | "sm" | "md";

/**
 * Props for the default-exported {@link Profile}.
 */
export type ProfileProps = {
  /** Remote image URL displayed in the leading avatar. */
  source: string;
  /** Display name -- full name, nickname, or username. Omitted when unknown. */
  name?: string;
  /**
   * Canonical username without the leading `@`. Renders as {@link Code}
   * `@{handle}` on its own line in stacked layouts, or inline after the
   * display name when {@link ProfileProps.inline} is set. When
   * {@link ProfileProps.name} is omitted, the handle becomes the primary
   * line instead.
   */
  handle?: string;
  /**
   * ISO 3166-1 alpha-2 country code (e.g. `"RO"`, `"US"`, `"GB"`). Forwarded to
   * `react-native-country-flag` lower-cased, which resolves a small PNG from FlagCDN.
   */
  flag?: string;
  /** Optional free-form location -- where the user states they live. */
  from?: string;
  /**
   * Density preset. Defaults to `md` (header sizing); pass `sm` for compact contexts
   * like nested posts, comment authors, or member chips.
   * @defaultValue "md"
   */
  size?: ProfileSize;
  /**
   * Forces the single-line layout. When set, `name`, `flag`, and (if present) `from`
   * all render on one row instead of stacking the location underneath the name. Use
   * it in slots where vertical room is scarce -- the {@link PostRelation} embedded
   * inset, autocomplete rows, member chips -- and pair with a small `size` for the
   * densest possible row.
   *
   * Orthogonal to both {@link ProfileProps.size} and {@link ProfileProps.from}: this
   * prop only controls *layout*, never visibility. If you want to hide the location
   * entirely (inline or not), simply omit `from`.
   * @defaultValue false
   */
  inline?: boolean;
};

/**
 * Per-size visual tokens, kept in one table so the row stays internally consistent
 * (avatar / name / meta / flag / gap all scale together). Extending the preset list
 * with `lg`/`xl` later only needs an entry here.
 */
const SIZE_TOKENS: Record<
  ProfileSize,
  {
    /** Pass-through to {@link Avatar}'s own size preset. */
    avatar: AvatarSize;
    /** Bold display-name font size. */
    nameFontSize: number;
    /** Secondary line font size (the `from` location). */
    metaFontSize: number;
    /** Secondary line line-height. */
    metaLineHeight: number;
    /** `react-native-country-flag` height; width tracks the FlagCDN aspect. */
    flag: number;
    /** Flex gap between the avatar and the text column. */
    rowGap: number;
  }
> = {
  md: {
    avatar: "md",
    nameFontSize: 17,
    metaFontSize: 14,
    metaLineHeight: 20,
    flag: 16,
    rowGap: 12,
  },
  sm: {
    avatar: "sm",
    nameFontSize: 14,
    metaFontSize: 12,
    metaLineHeight: 18,
    flag: 12,
    rowGap: 8,
  },
  xs: {
    avatar: "xs",
    nameFontSize: 13,
    metaFontSize: 11,
    metaLineHeight: 16,
    flag: 11,
    rowGap: 6,
  },
};

/**
 * Renders a profile row.
 *
 * @param props - {@link ProfileProps}
 */
export default function Profile({
  source,
  name,
  handle,
  flag,
  from,
  size = "md",
  inline = false,
}: ProfileProps) {
  const theme = useTheme();
  const tokens = SIZE_TOKENS[size];
  const flagStyle = {
    borderWidth: 1,
    borderColor: hexFgToRgba(theme.fg, 0.4),
    borderRadius: 2,
  };

  // Per-size dynamic overrides applied on top of the base text styles. Kept inline (not
  // in `StyleSheet`) because each value comes straight from {@link SIZE_TOKENS}, so the
  // single source of truth stays the token table.
  const nameDynamic = { fontSize: tokens.nameFontSize };
  const metaDynamic = {
    fontSize: tokens.metaFontSize,
    lineHeight: tokens.metaLineHeight,
  };

  const trimmedName = name?.trim();
  const hasName = Boolean(trimmedName);
  const hasHandle = Boolean(handle);
  const hasFlag = Boolean(flag);
  const hasFrom = Boolean(from);
  const hasGeo = hasFlag || hasFrom;
  // Stacked layout when the caller wants multiple lines and at least one field needs
  // to sit below the primary identity line (`from`, or `@handle` when not inline).
  const stacked = !inline && (hasFrom || hasHandle);
  const avatarLabel = profileAvatarLabel(trimmedName, handle);

  const handleLine = hasHandle ? (
    <View style={styles.handleRow}>
      <Code>{`@${handle}`}</Code>
    </View>
  ) : null;

  const geoRow = hasGeo ? (
    <View style={styles.metaRow}>
      {hasFlag ? (
        <CountryFlag isoCode={flag!} size={tokens.flag} style={flagStyle} />
      ) : null}
      {from ? (
        <Text style={[styles.meta, metaDynamic]} numberOfLines={1}>
          {from}
        </Text>
      ) : null}
    </View>
  ) : null;

  return (
    <View style={[styles.row, { gap: tokens.rowGap }]}>
      <Avatar
        source={source}
        size={tokens.avatar}
        accessibilityLabel={avatarLabel}
      />
      <View style={styles.text}>
        {stacked ? (
          <>
            {hasName ? (
              <Text style={[styles.name, nameDynamic]} numberOfLines={1}>
                {trimmedName}
              </Text>
            ) : hasHandle ? (
              <View style={styles.handleRow}>
                <Code>{`@${handle}`}</Code>
              </View>
            ) : null}
            {hasName && handleLine}
            {geoRow}
          </>
        ) : (
          <View style={styles.nameRow}>
            {hasName ? (
              <Text style={[styles.name, nameDynamic]} numberOfLines={1}>
                {trimmedName}
              </Text>
            ) : hasHandle ? (
              <Code>{`@${handle}`}</Code>
            ) : null}
            {inline && hasName && hasHandle ? (
              <Code>{`@${handle}`}</Code>
            ) : null}
            {hasFlag ? (
              <CountryFlag
                isoCode={flag!}
                size={tokens.flag}
                style={flagStyle}
              />
            ) : null}
            {from ? (
              <Text style={[styles.meta, metaDynamic]} numberOfLines={1}>
                {from}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // `gap` is set inline from the size token; keeping it out of the StyleSheet lets
  // RN's style merger apply the dynamic value without us juggling two flat styles.
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontWeight: "600",
    flexShrink: 1,
  },
  handleRow: {
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  meta: {
    opacity: 0.68,
    flexShrink: 1,
  },
});
