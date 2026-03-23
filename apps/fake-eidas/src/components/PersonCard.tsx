import { cx } from "hono/css";
import type { FC } from "hono/jsx";
import {
  countryFlagUrl,
  formatCountryCodesLabel,
  getCountryName,
} from "../constants/countries.ts";
import type { Person } from "../db/schema.ts";
import { randomAvatar } from "../routes/person-list/avatar.ts";
import {
  avatarGridClass,
  countryClass,
  countryCodesClass,
  countryFlagClass,
  countryNameClass,
  countryPrimaryClass,
  gridAvatarAlignClass,
  gridPersonInfoClass,
  gridPersonLinkClass,
  gridPersonNameClass,
  personInfoClass,
  personLinkClass,
  personNameClass,
} from "./person-grid-styles.ts";

type PersonCardProps = {
  person: Person;
  redirect: string;
};

export const PersonCard: FC<PersonCardProps> = ({ person, redirect }) => {
  const flagUrl = countryFlagUrl(person.citizen_of);

  return (
    <li>
      <a
        href={`${redirect}?code=${person.id}&country=${person.citizen_of}`}
        class={cx(personLinkClass, gridPersonLinkClass)}
      >
        <img
          class={cx(avatarGridClass, gridAvatarAlignClass)}
          src={randomAvatar(person.name)}
          alt="avatar"
        />
        <div class={cx(personInfoClass, gridPersonInfoClass)}>
          <div class={cx(personNameClass, gridPersonNameClass)}>
            {person.name}
          </div>
          <div class={countryClass}>
            <div class={countryPrimaryClass}>
              {flagUrl && (
                <img
                  class={countryFlagClass}
                  src={flagUrl}
                  alt=""
                  width={20}
                  height={15}
                />
              )}
              <span class={countryNameClass}>
                {getCountryName(person.citizen_of)}
              </span>
            </div>
            <span class={countryCodesClass}>
              {formatCountryCodesLabel(person.citizen_of)}
            </span>
          </div>
        </div>
      </a>
    </li>
  );
};
