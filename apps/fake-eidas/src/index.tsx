import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "typed-htmx";
import { personListRoutes } from "./routes/person-list/index.tsx";

const app = new Hono();

app.route("/", personListRoutes);

serve(
  {
    fetch: app.fetch,
    port: 3000,
    hostname: "eidas.localhost",
  },
  (info) => {
    console.log(`Server is running on http://eidas.localhost:${info.port}`);
  },
);
