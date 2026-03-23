import { pgSchema, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const customSchema = pgSchema("fake_eidas");

export const people = customSchema.table("people", {
  /**
   * The unique identifier for the person.
   *
   * Will be given by the eIDAS provider to identify the person.
   */
  id: uuid("id").primaryKey().defaultRandom(),
  /**
   * The name of the person.
   *
   * Used to display the person's name for identification purposes.
   */
  name: text("name").notNull(),

  /**
   * The country of citizenship of the person.
   */
  citizen_of: integer("citizen_of").notNull(),
  /**
   * The date and time the person was created.
   *
   * Used to track the creation time of the person.
   */
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type Person = typeof people.$inferSelect;
