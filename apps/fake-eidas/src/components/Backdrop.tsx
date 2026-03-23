import { css, cx, keyframes } from "hono/css";
import type { FC } from "hono/jsx";

const drift = keyframes`
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(2%, 2%) scale(1.03);
  }
`;

const backdropClass = css`
  /* backdrop */
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
`;

const glowClass = css`
  /* backdrop-glow */
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: ${drift} 24s ease-in-out infinite;
`;

const glowAClass = css`
  /* backdrop-glow-a */
  width: min(560px, 95vw);
  height: min(560px, 95vw);
  top: -14%;
  left: 50%;
  translate: -50% 0;
  background: rgba(0, 51, 153, 0.42);
`;

const glowBClass = css`
  /* backdrop-glow-b */
  width: min(400px, 75vw);
  height: min(400px, 75vw);
  bottom: -10%;
  right: -8%;
  animation-delay: -12s;
  background: rgba(255, 204, 0, 0.12);
`;

const gridClass = css`
  /* backdrop-grid */
  position: absolute;
  inset: 0;
  opacity: 0.2;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 75% 65% at 50% 38%, black, transparent);
`;

const glowACombined = cx(glowClass, glowAClass);
const glowBCombined = cx(glowClass, glowBClass);

export const Backdrop: FC = () => {
  return (
    <div class={backdropClass} aria-hidden="true">
      <div class={glowACombined} />
      <div class={glowBCombined} />
      <div class={gridClass} />
    </div>
  );
};
