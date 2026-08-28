import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

const testMode = process.env.NODE_ENV === "test";
config({ path: testMode ? ".env.test" : ".env.local", override: testMode, quiet: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run Drizzle migrations.");
}

if (testMode) {
  const parsed = new URL(databaseUrl);
  const hostAllowed = ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname);
  const database = parsed.pathname.replace(/^\//, "");
  if (!hostAllowed || database !== "cosmic_test" || decodeURIComponent(parsed.username) !== "cosmic_test") {
    throw new Error("Refusing test database access: expected local cosmic_test as cosmic_test.");
  }
}

export default defineConfig({
  schema: "./services/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
