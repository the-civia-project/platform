import { LivetickerTeaser } from "../../Liveticker/LivetickerTeaser";
import type { PostArchetype } from "../../Post";

export type LivetickerBodyProps = {
  archetype: Extract<PostArchetype, { kind: "liveticker" }>;
  onArchetypePress?: () => void;
};

export function LivetickerBody({
  archetype,
  onArchetypePress,
}: LivetickerBodyProps) {
  return (
    <LivetickerTeaser
      liveticker={archetype.liveticker}
      onPress={onArchetypePress}
    />
  );
}
