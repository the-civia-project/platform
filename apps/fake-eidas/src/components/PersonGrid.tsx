import type { FC } from "hono/jsx";
import type { Person } from "../db/schema.ts";
import { gridClass } from "./person-grid-styles.ts";
import { PersonCard } from "./PersonCard.tsx";

type PersonGridProps = {
  people: Person[];
  redirect: string;
};

export const PersonGrid: FC<PersonGridProps> = ({ people, redirect }) => {
  return (
    <ul class={gridClass}>
      {people.map((person) => (
        <PersonCard key={person.id} person={person} redirect={redirect} />
      ))}
    </ul>
  );
};
