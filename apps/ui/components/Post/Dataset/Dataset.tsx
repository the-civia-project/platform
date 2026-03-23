/**
 * Visual silhouette of a dataset attachment. Renders the dataset's
 * "Dataset" eyebrow, name, optional description, a structured
 * metadata row (rows, columns, license, freshness), and a list of
 * downloads -- each as a pressable row that fires the host's
 * download intent. **Does not run a download pipeline** -- the kit
 * primitive paints the shape; the actual file transfer, ledger
 * recording, and per-identity quotas live upstream.
 *
 * Reach for this kind when an organisation publishes machine-
 * readable data alongside narrative commentary -- council budgets,
 * sensor archives, OpenData releases. The kit doesn't validate the
 * metadata (no "rows must be a number" coercion); product code is
 * expected to format / sanity-check the values before they reach
 * the renderer.
 */
import { Database, Download, FileText } from "lucide-react-native";
import { StyleSheet, Text as RNText, View } from "react-native";
import { BorderedRow } from "../../BorderedRow";
import { ExcerptText } from "../../ExcerptText";
import { KindHeader } from "../../KindHeader";
import { MetaLine } from "../../MetaLine";
import { StructuredTile } from "../../StructuredTile";
import { Text } from "../../Typography";
import { useTheme } from "../../use-theme";

/**
 * One downloadable file inside a {@link PostDataset}. The kit doesn't
 * carry the URL itself; pressing a row fires
 * {@link DatasetProps.onDownloadPress} with the row's
 * {@link PostDatasetDownload.id} so the host can route to the right
 * fetch / open path.
 */
export type PostDatasetDownload = {
  /** Stable identifier used as the React key + the press-handler argument. */
  id: string;
  /** Display label ("budget-2026.csv", "council-roll-call.json"). */
  label: string;
  /**
   * Optional one-line description of the file's contents. Rendered
   * as muted copy on a second line under the label; pass `undefined`
   * to render just the label.
   */
  description?: string;
  /**
   * Optional caller-friendly size label ("2.4 MB", "412 KB").
   * Rendered as a right-edge metadata pill. The kit doesn't format
   * bytes -- product code chooses the locale convention.
   */
  size?: string;
  /**
   * Optional caller-friendly format label ("CSV", "JSON", "Parquet").
   * Rendered next to the size as another right-edge metadata pill.
   */
  format?: string;
};

/**
 * Tile-data shape -- the half of {@link DatasetProps} that describes
 * the dataset itself. Pairs 1:1 with
 * {@link "../Post".DatasetMedia.dataset}.
 */
export type PostDataset = {
  /** Headline dataset name. */
  name: string;
  /**
   * Optional one-paragraph description. Rendered as muted body copy
   * under the name; the kit caps it at 3 lines.
   */
  description?: string;
  /**
   * Optional row count. Rendered as `"X rows"` in the metadata row.
   * The kit renders the number through `.toLocaleString()` so a 1.2M
   * dataset reads as "1,200,000 rows" rather than "1200000".
   */
  rowCount?: number;
  /** Optional column count. Rendered as `"X cols"` next to the row count. */
  columnCount?: number;
  /**
   * Optional license label ("CC BY 4.0", "Public Domain", "Council
   * Open Data v2"). The kit doesn't resolve license URLs; the label
   * is read-only.
   */
  license?: string;
  /**
   * Optional freshness label ("Updated weekly", "As of June 1",
   * "Static archive"). The kit doesn't parse the string -- choose
   * the convention that matches the dataset's actual cadence.
   */
  freshnessLabel?: string;
  /**
   * List of downloadable files. Empty arrays / `undefined` render
   * the tile without a downloads section -- a dataset can be
   * "announced but not yet released".
   */
  downloads?: PostDatasetDownload[];
};

/**
 * Public props for {@link Dataset}.
 */
export type DatasetProps = PostDataset & {
  /**
   * Optional press handler. Fires with the tapped
   * {@link PostDatasetDownload.id} when a row is tapped. When
   * omitted, the rows render as static (no `Pressable`) -- the
   * tile reads as a record of "what's in the dataset" without
   * surfacing a download affordance.
   */
  onDownloadPress?: (downloadId: string) => void;
};

/**
 * Renders the dataset silhouette described in the file header.
 *
 * @param props - {@link DatasetProps}
 */
export function Dataset({
  name,
  description,
  rowCount,
  columnCount,
  license,
  freshnessLabel,
  downloads,
  onDownloadPress,
}: DatasetProps) {
  const meta: string[] = [];
  if (rowCount !== undefined)
    meta.push(`${rowCount.toLocaleString()} rows`);
  if (columnCount !== undefined)
    meta.push(`${columnCount.toLocaleString()} cols`);
  if (license) meta.push(license);
  if (freshnessLabel) meta.push(freshnessLabel);

  return (
    <StructuredTile variant="attachment">
      <KindHeader icon={Database} label="Dataset" />
      <Text style={styles.name}>{name}</Text>
      {description != null ? <ExcerptText lines={3}>{description}</ExcerptText> : null}
      {meta.length > 0 ? <MetaLine segments={meta} tone="footer" /> : null}
      {downloads != null && downloads.length > 0 ? (
        <View style={styles.downloads}>
          {downloads.map((d) => (
            <DownloadRow
              key={d.id}
              download={d}
              onPress={onDownloadPress ? () => onDownloadPress(d.id) : undefined}
            />
          ))}
        </View>
      ) : null}
    </StructuredTile>
  );
}

export default Dataset;

/**
 * One row inside the downloads section. Renders a `FileText` glyph,
 * the label + optional description on the left, format / size pills
 * + a `Download` glyph on the right. Pressable when `onPress` is
 * wired; static otherwise.
 *
 * Kept private to this file because the row's geometry only makes
 * sense inside the dataset tile.
 */
function DownloadRow({
  download,
  onPress,
}: {
  download: PostDatasetDownload;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <BorderedRow
      leading={<FileText size={16} color={theme.fgMuted} />}
      title={download.label}
      subtitle={download.description}
      trailing={
        <View style={styles.downloadMeta}>
          {download.format != null ? (
            <RNText
              style={[styles.downloadPill, { color: theme.fgMuted }]}
              numberOfLines={1}
            >
              {download.format}
            </RNText>
          ) : null}
          {download.size != null ? (
            <RNText
              style={[styles.downloadPill, { color: theme.fgMuted }]}
              numberOfLines={1}
            >
              {download.size}
            </RNText>
          ) : null}
          {onPress != null ? <Download size={14} color={theme.primary} /> : null}
        </View>
      }
      onPress={onPress}
      accessibilityLabel={`Download ${download.label}`}
    />
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  downloads: {
    gap: 6,
  },
  downloadMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  downloadPill: {
    fontSize: 11,
    lineHeight: 14,
    fontVariant: ["tabular-nums"],
  },
});
