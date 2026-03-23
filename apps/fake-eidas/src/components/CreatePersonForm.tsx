import { css } from "hono/css";
import type { FC } from "hono/jsx";
import { newPersonPreviewAvatar } from "../routes/person-list/avatar.ts";
import { AvatarPreviewScript } from "../routes/person-list/avatar-preview.tsx";
import { Avatar } from "./Avatar.tsx";
import { CountryPicker } from "./CountryPicker.tsx";
import { FormError } from "./FormError.tsx";

const formClass = css`
  /* create-person-form */
  margin-top: 32px;
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 80rem;
  padding: 16px;
  border: 1px solid var(--border, #222);
  border-radius: var(--radius, 12px);
  background: rgba(0, 0, 0, 0.2);
  box-sizing: border-box;

  @media (max-width: 639px) {
    flex-direction: column;
    align-items: stretch;

    & [data-avatar-preview] {
      align-self: center;
    }
  }
`;

const fieldsClass = css`
  /* create-person-fields */
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;

  & input[type="text"] {
    width: 100%;
  }
`;

const submitClass = css`
  /* create-person-submit */
  margin-left: 0;

  @media (max-width: 639px) {
    width: 100%;
    margin-top: 8px;
  }
`;

type CreatePersonFormProps = {
  redirect: string;
  error?: string;
};

export const CreatePersonForm: FC<CreatePersonFormProps> = ({
  redirect,
  error,
}) => {
  return (
    <form
      action={`/new?redirect=${redirect}`}
      method="post"
      class={formClass}
      data-avatar-preview-form
    >
      <Avatar
        src={newPersonPreviewAvatar()}
        alt="avatar"
        variant="form"
        preview
      />
      <div class={fieldsClass}>
        <input type="text" name="name" placeholder="Name" required />
        <CountryPicker />
        {error ? <FormError message={error} /> : null}
      </div>
      <button type="submit" class={submitClass}>
        Add
      </button>
      <AvatarPreviewScript />
    </form>
  );
};
