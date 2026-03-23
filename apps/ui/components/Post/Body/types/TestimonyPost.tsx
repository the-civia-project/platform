import { TestimonyBody } from "../slots";
import type { TestimonyBodyProps } from "../slots";

export type TestimonyPostProps = TestimonyBodyProps;

export function TestimonyPost(props: TestimonyPostProps) {
  return <TestimonyBody {...props} />;
}
