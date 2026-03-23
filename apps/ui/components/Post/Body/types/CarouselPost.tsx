import { CarouselBody, TextBody } from "../slots";
import type { CarouselBodyProps } from "../slots";
import type { WithTextSlot } from "./withTextSlot";

export type CarouselPostProps = WithTextSlot<{ carousel: CarouselBodyProps }>;

export function CarouselPost({ text, carousel }: CarouselPostProps) {
  return (
    <>
      <TextBody {...text} />
      <CarouselBody {...carousel} />
    </>
  );
}
