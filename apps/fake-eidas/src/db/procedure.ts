import { eq, sql } from "drizzle-orm";
import { db } from "./drizzle.ts";
import { newsletters } from "./schema.ts";

/**
 * Updates the progress on the newsletter.
 * Marks the newsletter finished when the last emails have been sent by
 * setting the `finished_send_at` to `NOW()`
 *
 * @param uuid the newsletter id
 * @param count how many emails have been sent
 * @returns if the last emails have been sent
 */
export const processNewsletterProgress = async (uuid: string, count: number) =>
  await db.transaction(async (tx) => {
    const result = await tx
      .update(newsletters)
      .set({
        finished: sql`${newsletters.finished} + ${count}`,
      })
      .where(eq(newsletters.uuid, uuid))
      .returning({
        total: newsletters.total,
        finished: newsletters.finished,
      });

    const { total, finished } = result[0];

    if (total === finished) {
      await tx
        .update(newsletters)
        .set({
          finished_send_at: sql`current_timestamp`,
        })
        .where(eq(newsletters.uuid, uuid));

      return true;
    }

    return false;
  });
