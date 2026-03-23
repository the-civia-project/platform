import Fundraiser from "../../Fundraiser/Fundraiser";
import type { FundraiserMedia } from "../../Post";

export type FundraiserBodyProps = { media: FundraiserMedia };

export function FundraiserBody({ media }: FundraiserBodyProps) {
  return (
    <Fundraiser
      {...media.fundraiser}
      onDonatePress={media.onDonatePress}
      onTransparencyPress={media.onTransparencyPress}
    />
  );
}
