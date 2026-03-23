import { TestimonyTeaser } from "../../Testimony/TestimonyTeaser";
import type { PostArchetype } from "../../Post";

export type TestimonyBodyProps = {
  archetype: Extract<PostArchetype, { kind: "testimony" }>;
  onArchetypePress?: () => void;
};

export function TestimonyBody({
  archetype,
  onArchetypePress,
}: TestimonyBodyProps) {
  return (
    <TestimonyTeaser
      testimony={archetype.testimony}
      onPress={onArchetypePress}
    />
  );
}
