import Dataset from "../../Dataset/Dataset";
import type { DatasetMedia } from "../../Post";

export type DatasetBodyProps = { media: DatasetMedia };

export function DatasetBody({ media }: DatasetBodyProps) {
  return (
    <Dataset
      {...media.dataset}
      onDownloadPress={media.onDownloadPress}
    />
  );
}
