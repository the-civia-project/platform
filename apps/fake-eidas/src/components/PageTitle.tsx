import type { FC, PropsWithChildren } from "hono/jsx";

export const PageTitle: FC<PropsWithChildren> = ({ children }) => {
  return <h2>{children}</h2>;
};
