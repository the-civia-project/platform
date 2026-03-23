import { Hono } from "hono";
import type { FC } from "hono/jsx";
import { CreatePersonForm } from "../../components/CreatePersonForm.tsx";
import { Layout } from "../../components/Layout.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { PageTitle } from "../../components/PageTitle.tsx";
import { PersonGrid } from "../../components/PersonGrid.tsx";
import { getPeople } from "../../db/queries.ts";
import type { Person } from "../../db/schema.ts";
import { createPersonRoutes } from "./create-person.tsx";

/** Home URL: `/`, keeping the app `redirect` query when present. */
function homeHref(redirect: string): string {
  try {
    const url = new URL(redirect);
    const inner = url.searchParams.get("redirect");
    if (inner) {
      return `/?redirect=${encodeURIComponent(inner)}`;
    }
    if (
      url.hostname.includes("eidas.localhost") ||
      url.hostname === "localhost"
    ) {
      return "/";
    }
  } catch {
    /* redirect is the callback URL string, not a parsed URL */
  }
  return `/?redirect=${encodeURIComponent(redirect)}`;
}

const PersonList: FC<{
  people: Person[];
  redirect: string;
  error?: string;
}> = ({ people, redirect, error }) => {
  return (
    <Layout>
      <PageHeader homeHref={homeHref(redirect)} />
      <PageTitle>Choose your person</PageTitle>
      <PersonGrid people={people} redirect={redirect} />
      <CreatePersonForm redirect={redirect} error={error} />
    </Layout>
  );
};

export const personListRoutes = new Hono()
  .route("/", createPersonRoutes)
  .get("/", async (ctx) => {
    const redirect = ctx.req.query("redirect") ?? ctx.req.url;
    const error = ctx.req.query("error");

    const people = await getPeople();

    return ctx.html(
      <PersonList people={people} redirect={redirect} error={error} />,
    );
  });
