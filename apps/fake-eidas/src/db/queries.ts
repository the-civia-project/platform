import { asc } from "drizzle-orm";
import { db } from "./drizzle.ts";
import { people } from "./schema.ts";

export async function getPeople() {
  return await db.select().from(people).orderBy(asc(people.name));
}
