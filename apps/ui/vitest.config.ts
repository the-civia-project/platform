import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "validation/**/*.test.ts",
      "components/**/*.test.ts",
      "core/**/*.test.ts",
    ],
    environment: "node",
    globals: false,
    clearMocks: true,
  },
});
