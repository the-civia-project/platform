/**
 * Test-only helpers for the validation suite. The underscore prefix
 * and absence from the barrel mark this as test-internal -- production
 * callers consume validators through the `validation` aggregator in
 * {@link "./index"} and format errors themselves.
 */
import type { ZodError } from "zod";

/**
 * Narrow a validator result to its `ZodError` branch and return the
 * first issue's message. Throws if the result is `true` -- useful in
 * tests that *expect* failure, because `result === true` is the kit's
 * convention for "valid or empty" and means the test setup is wrong.
 *
 * Centralising this extraction keeps every test from repeating the
 * same `result === true ? throw : result.issues[0]?.message` pattern,
 * and forces the suite to agree on which message we surface ("first
 * issue") even as the underlying zod issue tree evolves.
 */
export function firstMessage(result: true | ZodError): string {
  if (result === true) {
    throw new Error(
      "Expected validation to fail, but got `true` (valid or empty).",
    );
  }
  const message = result.issues[0]?.message;
  if (!message) {
    throw new Error("ZodError had no issues -- schema is misconfigured.");
  }
  return message;
}
