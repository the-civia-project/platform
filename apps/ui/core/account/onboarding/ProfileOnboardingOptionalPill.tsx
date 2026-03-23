import Pill from "../../../components/Pill";

/**
 * Small "Optional" label shown above the step title in profile onboarding.
 */
export function ProfileOnboardingOptionalPill() {
  return (
    <Pill variant="muted" accessibilityLabel="Optional step">
      Optional
    </Pill>
  );
}
