import dotenv from "dotenv";
import { seed } from "drizzle-seed";
import { countryCodes } from "../constants/countries.ts";
import { people } from "./schema.ts";
import { db } from "./drizzle.ts";

dotenv.config({ path: "../../.env", quiet: true });

async function main() {
  await seed(db, { people }).refine((f) => ({
    people: {
      columns: {
        id: f.uuid(),
        name: f.fullName(),
        citizen_of: f.valuesFromArray({ values: countryCodes }),
        created_at: f.datetime(),
      },
      count: 5,
    },
  }));
}

main();
