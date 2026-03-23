import { css, cx } from "hono/css";
import type { FC } from "hono/jsx";
import { avatarGridClass } from "./person-grid-styles.ts";

const avatarFormClass = css`
  /* avatar-form */
  width: 64px;
  height: 64px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: var(--avatar-bg, #12141c);
  object-fit: cover;
`;

type AvatarProps = {
  src: string;
  alt: string;
  variant?: "grid" | "form";
  preview?: boolean;
};

export const Avatar: FC<AvatarProps> = ({
  src,
  alt,
  variant = "grid",
  preview = false,
}) => {
  const className = variant === "form" ? avatarFormClass : cx(avatarGridClass);

  return (
    <img
      class={className}
      src={src}
      alt={alt}
      {...(preview ? { "data-avatar-preview": true } : {})}
    />
  );
};
