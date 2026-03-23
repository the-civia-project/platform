import { css, keyframes } from "hono/css";
import type { FC } from "hono/jsx";

const fakeDotPulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.75;
  }
  70%,
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
`;

const headerClass = css`
  /* page-header */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--border);
  text-align: center;

  &::after {
    content: "";
    display: block;
    width: min(200px, 50%);
    height: 2px;
    margin-top: 4px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--eu-gold) 20%,
      var(--eu-gold) 80%,
      transparent
    );
    opacity: 0.55;
  }
`;

const brandClass = css`
  /* brand */
  cursor: pointer;

  &:hover h1 {
    filter: brightness(1.1);
  }
`;

const fakeClass = css`
  /* fake-badge */
  display: inline-flex;
  align-items: center;
  align-content: center;
  gap: 8px;
  padding: 5px 12px 5px 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffe566;
  background: rgba(255, 204, 0, 0.12);
  border: 1px solid rgba(255, 204, 0, 0.45);
  border-radius: 9999px;
  box-shadow: 0 0 20px rgba(255, 204, 0, 0.1);
`;

const fakeLabelClass = css`
  /* fake-label */
  font-size: 10px;
  line-height: 10px;
`;

const fakeDotClass = css`
  /* fake-dot */
  position: relative;
  display: block;
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--eu-gold);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: var(--eu-gold);
    animation: ${fakeDotPulse} 1.8s ease-out infinite;
  }
`;

type PageHeaderProps = {
  homeHref: string;
};

export const PageHeader: FC<PageHeaderProps> = ({ homeHref }) => {
  return (
    <header class={headerClass}>
      <a href={homeHref} class={brandClass}>
        <h1>eIDAS 2.0</h1>
      </a>
      <span class={fakeClass} role="note">
        <span class={fakeDotClass} aria-hidden="true" />
        <span class={fakeLabelClass}>fake</span>
      </span>
    </header>
  );
};
