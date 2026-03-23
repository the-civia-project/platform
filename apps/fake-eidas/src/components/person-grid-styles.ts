import { css } from "hono/css";

export const gridClass = css`
  /* person-grid */
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: 16px;
  width: 100%;
  max-width: 80rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 960px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }

  & > li {
    display: flex;
    width: 100%;
    min-width: 0;
    min-height: 100%;
  }
`;

export const personLinkClass = css`
  /* person-link */
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  padding: 24px;
  min-height: 5.5rem;
  box-sizing: border-box;
  border: 1px solid var(--border, #222);
  border-radius: var(--radius, 12px);
  background: rgba(0, 0, 0, 0.2);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;

  &:hover {
    background-color: rgba(0, 51, 153, 0.14);
    border-color: var(--border-strong, rgba(255, 204, 0, 0.22));
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.25),
      0 0 20px rgba(0, 51, 153, 0.12);
    transform: translateY(-2px);
    cursor: pointer;
  }
`;

export const gridPersonLinkClass = css`
  ${gridClass} {
    ${personLinkClass} {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      width: 100%;
      height: 100%;
      min-height: 12rem;
      padding: 28px 20px;
      box-sizing: border-box;
    }
  }

  @media (max-width: 639px) {
    ${gridClass} {
      ${personLinkClass} {
        flex-direction: row;
        align-items: center;
      }
    }
  }
`;

export const personInfoClass = css`
  /* person-info */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  align-self: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

export const gridPersonInfoClass = css`
  ${gridClass} {
    ${personInfoClass} {
      align-self: stretch;
      align-items: flex-start;
      width: 100%;
      flex: 1;
    }
  }
`;

export const personNameClass = css`
  /* person-name */
  max-width: 100%;
  font-size: 14px;
  line-height: 1.25;
  pointer-events: none;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
`;

export const gridPersonNameClass = css`
  ${gridClass} {
    ${personInfoClass} {
      ${personNameClass} {
        width: 100%;
        text-align: left;
      }
    }
  }
`;

export const countryClass = css`
  /* country */
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.25;
  pointer-events: none;
  min-width: 0;
  width: 100%;
`;

export const countryPrimaryClass = css`
  /* country-primary */
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
`;

export const countryFlagClass = css`
  /* country-flag */
  display: block;
  flex-shrink: 0;
  border-radius: 2px;
  object-fit: cover;
`;

export const countryNameClass = css`
  /* country-name */
  flex: 1 1 0;
  min-width: 0;
  font-size: 14px;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
  text-align: left;
`;

export const countryCodesClass = css`
  /* country-codes */
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  max-width: 100%;
  font-size: 14px;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  white-space: nowrap;
`;

export const avatarGridClass = css`
  /* avatar-grid */
  width: 64px;
  height: 64px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: var(--avatar-bg, #12141c);
  object-fit: cover;
`;

export const gridAvatarAlignClass = css`
  ${gridClass} {
    ${personLinkClass} {
      ${avatarGridClass} {
        align-self: center;
      }
    }
  }
`;
