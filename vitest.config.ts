import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // Test environment
    environment: "node",

    // Global test APIs (describe, it, expect)
    globals: true,

    // Setup files
    setupFiles: ["./src/__tests__/setup.ts"],

    // Include patterns
    include: ["src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],

    // Exclude patterns
    exclude: ["node_modules", ".next", "skills", "examples"],

    // Coverage config
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/supabase/**", "src/lib/db.ts"],
    },
  },
});
