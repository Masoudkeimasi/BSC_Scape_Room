import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:3100",
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    env: {
      INSTRUCTOR_PASSWORD: "e2e-only-instructor-password",
      DATA_DIR: process.cwd() + "/.data/e2e",
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      SESSION_SECRET: "e2e-only-session-secret-not-for-deployment",
    },
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120000,
  },
  timeout: 60000,
});
