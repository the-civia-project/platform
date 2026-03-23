import { PropsWithChildren } from "react";
import useApplication from "./application";

export default function DataCollection({ children }: PropsWithChildren) {
  useApplication();

  return <>{children}</>;
}
