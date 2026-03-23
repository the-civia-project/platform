import type { FC } from "hono/jsx";
import { raw } from "hono/html";
import { DICEBEAR_AVATAAARS } from "./avatar.ts";

const avatarPreviewScript = `
(() => {
  const base = ${JSON.stringify(DICEBEAR_AVATAAARS)};
  const defaultSeed = "new-person";

  for (const form of document.querySelectorAll("[data-avatar-preview-form]")) {
    const input = form.querySelector('input[name="name"]');
    const img = form.querySelector("[data-avatar-preview]");
    if (!input || !img) continue;

    let lastSeed = "";

    const update = () => {
      const seed = input.value.trim() || defaultSeed;
      if (seed === lastSeed) return;
      lastSeed = seed;
      img.src = base + "?seed=" + encodeURIComponent(seed);
    };

    input.addEventListener("input", update);
    update();
  }
})();
`.trim();

export const AvatarPreviewScript: FC = () => (
  <script>{raw(avatarPreviewScript)}</script>
);
