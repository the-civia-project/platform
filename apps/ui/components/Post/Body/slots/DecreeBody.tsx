import { DecreeTeaser } from "../../Decree/DecreeTeaser";
import type { PostArchetype } from "../../Post";

export type DecreeBodyProps = {
  archetype: Extract<PostArchetype, { kind: "decree" }>;
  onArchetypePress?: () => void;
};

export function DecreeBody({ archetype, onArchetypePress }: DecreeBodyProps) {
  return (
    <DecreeTeaser decree={archetype.decree} onPress={onArchetypePress} />
  );
}
