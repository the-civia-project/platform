import { css } from "hono/css";

/** Injected via `<Style>{globalStyles}</Style>` — plain selectors, not `:-hono-global`. */
export const globalStyles = css`
  :root {
    --font-mono:
      "JetBrains Mono", ui-monospace, "Cascadia Code", "Segoe UI Mono",
      monospace;
    --eu-blue: #003399;
    --eu-blue-deep: #001a4d;
    --eu-blue-bright: #0052cc;
    --eu-gold: #ffcc00;
    --eu-gold-soft: rgba(255, 204, 0, 0.18);
    --bg: #030818;
    --border: rgba(255, 255, 255, 0.1);
    --border-strong: rgba(255, 204, 0, 0.22);
    --accent: var(--eu-blue-bright);
    --accent-soft: rgba(0, 82, 204, 0.22);
    --text: #f8fafc;
    --muted: rgba(226, 232, 240, 0.62);
    --radius: 10px;
    --avatar-bg: #0a1638;
  }

  html,
  body {
    padding: 0;
    margin: 0;
    font-family: var(--font-mono);
  }

  body {
    min-height: 100vh;
    font-size: 14px;
    color: var(--text);
    background-color: var(--bg);
    background-image:
      radial-gradient(
        ellipse 95% 60% at 50% -18%,
        rgba(0, 51, 153, 0.45),
        transparent 68%
      ),
      radial-gradient(
        ellipse 50% 40% at 100% 100%,
        rgba(0, 82, 204, 0.18),
        transparent 55%
      ),
      radial-gradient(
        ellipse 40% 35% at 0% 85%,
        rgba(255, 204, 0, 0.08),
        transparent 50%
      ),
      linear-gradient(180deg, var(--eu-blue-deep) 0%, var(--bg) 100%);
  }

  h1 {
    margin: 0;
    font-weight: 700;
    font-size: clamp(2rem, 6vw, 2.85rem);
    line-height: 1.08;
    letter-spacing: 0.01em;
    background: linear-gradient(
      165deg,
      #ffffff 0%,
      #ffe566 38%,
      #66a3ff 72%,
      #003399 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  h2 {
    margin: 0 0 28px;
    font-size: clamp(0.8rem, 2vw, 0.95rem);
    font-weight: 600;
    line-height: 1.4;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--muted);
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  input {
    background-color: rgba(3, 12, 36, 0.65);
    color: var(--text);
    font-size: 14px;
    font-family: inherit;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  input:focus {
    outline: none;
    border-color: rgba(0, 82, 204, 0.65);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  button {
    background: linear-gradient(
      180deg,
      var(--eu-blue-bright) 0%,
      var(--eu-blue) 100%
    );
    border: 1px solid rgba(255, 204, 0, 0.28);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    padding: 10px 20px;
    border-radius: var(--radius);
    margin-left: 16px;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      box-shadow 0.2s ease,
      filter 0.2s ease;
    box-shadow:
      0 4px 16px rgba(0, 51, 153, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }

  button:hover {
    filter: brightness(1.06);
    box-shadow:
      0 6px 22px rgba(0, 51, 153, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  button:active {
    transform: translateY(1px);
  }
`;

export const wrapperClass = css`
  /* wrapper */
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 80rem;
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(24px, 6vw, 56px);
  box-sizing: border-box;
`;
