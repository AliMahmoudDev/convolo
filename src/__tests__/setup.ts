/**
 * Vitest Global Setup
 * Runs before all test files
 */
import { beforeAll, afterAll } from "vitest";

// Suppress console.error during tests (e.g., missing env vars warnings)
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Missing Supabase") || args[0].includes("NEXT_PUBLIC_"))
    ) {
      return; // Suppress expected env var warnings in tests
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
