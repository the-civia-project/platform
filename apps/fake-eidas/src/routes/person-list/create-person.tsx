import { Hono } from "hono";
import { isCountryCode } from "../../constants/countries.ts";
import { createPerson } from "../../db/mutations.ts";

export const createPersonRoutes = new Hono().post("/new", async (ctx) => {
  const redirect = ctx.req.query("redirect");
  const referer = ctx.req.header("Referer");

  const body = await ctx.req.formData();
  const name = body.get("name") as string;
  const countryRaw = body.get("country");
  const country = countryRaw ? Number(countryRaw) : NaN;

  if (!name || name.length === 0) {
    return ctx.redirect(`${referer}?error=Name is required`);
  }

  if (!isCountryCode(country)) {
    return ctx.redirect(`${referer}?error=Country is required`);
  }

  const person = await createPerson(name, country);

  return ctx.redirect(
    `${redirect}?code=${person.id}&country=${person.citizen_of}`,
  );
});
