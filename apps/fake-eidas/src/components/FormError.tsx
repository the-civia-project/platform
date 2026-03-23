import { css } from "hono/css";
import type { FC } from "hono/jsx";

const errorClass = css`
  /* form-error */
  color: #f00;
  font-size: 14px;
  margin-bottom: 16px;
`;

type FormErrorProps = {
  message: string;
};

export const FormError: FC<FormErrorProps> = ({ message }) => {
  return <p class={errorClass}>{message}</p>;
};
