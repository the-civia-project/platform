import { db } from "./drizzle.ts";
import { people } from "./schema.ts";

export function createPerson(name: string, country: number) {
  return db
    .insert(people)
    .values({ name, citizen_of: country })
    .returning()
    .then(([person]) => person);
}
