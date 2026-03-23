import { Style } from "hono/css";
import type { FC, PropsWithChildren } from "hono/jsx";
import { Backdrop } from "./Backdrop.tsx";
import { globalStyles, wrapperClass } from "./theme.ts";

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#001a4d" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Style>{globalStyles}</Style>
        <Style />
      </head>
      <body hx-boost="true">
        <Backdrop />
        <main class={wrapperClass}>{children}</main>
      </body>
    </html>
  );
};
