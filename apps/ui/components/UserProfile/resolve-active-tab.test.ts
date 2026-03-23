/**
 * Tests for {@link "./resolve-active-tab"}, the pure state-machine
 * behind {@link "./UserProfile".default}'s controlled-or-uncontrolled
 * active-tab contract. Pins the regression-prone semantics the plan
 * calls out: `defaultTabId` seeds the initial active tab, re-tapping
 * the active tab does *not* fire `onTabChange` while tapping a
 * different tab fires it exactly once, and `activeTabId` (when
 * provided) wins over internal state.
 *
 * Runs in pure Node -- the resolver imports no React or React Native,
 * so the rules survive the kit's vitest config without dragging in
 * a renderer.
 */
import { describe, expect, it } from "vitest";
import {
  computeTabPressOutcome,
  getInitialActiveTabId,
  resolveActiveTabId,
} from "./resolve-active-tab";

describe("getInitialActiveTabId", () => {
  it("returns the caller's defaultTabId when set", () => {
    expect(getInitialActiveTabId("replies", "posts")).toBe("replies");
  });

  it("falls back to the first tab's id when defaultTabId is undefined", () => {
    expect(getInitialActiveTabId(undefined, "posts")).toBe("posts");
  });

  it("treats an empty-string defaultTabId as a real id (no fallback)", () => {
    // Edge case the kit deliberately doesn't massage: empty string is a
    // valid id and `??` lets it through. Pinning the behaviour so a
    // future refactor doesn't quietly switch to `||` and start
    // treating empty strings as "unset".
    expect(getInitialActiveTabId("", "posts")).toBe("");
  });
});

describe("resolveActiveTabId", () => {
  it("returns the internal state when activeTabId is undefined (uncontrolled)", () => {
    expect(resolveActiveTabId(undefined, "posts")).toBe("posts");
  });

  it("returns activeTabId when it is set (controlled wins over internal state)", () => {
    // The kit's test-pinned "external state beats internal state"
    // rule: a controlled parent's value always wins, even when the
    // internal state still holds a stale id from before the parent
    // started driving.
    expect(resolveActiveTabId("replies", "posts")).toBe("replies");
  });

  it("treats activeTabId='' as a real id (not 'unset')", () => {
    expect(resolveActiveTabId("", "posts")).toBe("");
  });
});

describe("computeTabPressOutcome", () => {
  describe("re-tap of the already-active tab", () => {
    it("does not update internal state in the uncontrolled shape", () => {
      const outcome = computeTabPressOutcome("posts", "posts", false);
      expect(outcome.shouldUpdateInternalState).toBe(false);
    });

    it("does not fire onTabChange (the kit's single-fire-per-transition rule)", () => {
      const outcome = computeTabPressOutcome("posts", "posts", false);
      expect(outcome.shouldFireOnTabChange).toBe(false);
    });

    it("behaves identically in the controlled shape (re-tap is still a no-op)", () => {
      const outcome = computeTabPressOutcome("posts", "posts", true);
      expect(outcome).toEqual({
        shouldUpdateInternalState: false,
        shouldFireOnTabChange: false,
      });
    });
  });

  describe("new tap (transition)", () => {
    it("updates internal state and fires onTabChange in the uncontrolled shape", () => {
      const outcome = computeTabPressOutcome("replies", "posts", false);
      expect(outcome).toEqual({
        shouldUpdateInternalState: true,
        shouldFireOnTabChange: true,
      });
    });

    it("fires onTabChange but leaves internal state alone in the controlled shape", () => {
      // The parent owns the source of truth when controlled, so the
      // kit only notifies via `onTabChange`; pushing into the internal
      // state would create a stale shadow that drifts the first time
      // the parent rejects the transition.
      const outcome = computeTabPressOutcome("replies", "posts", true);
      expect(outcome).toEqual({
        shouldUpdateInternalState: false,
        shouldFireOnTabChange: true,
      });
    });
  });
});
