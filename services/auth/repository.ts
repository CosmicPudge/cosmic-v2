import "server-only";

import { isDatabaseConfigured } from "@/services/database/client";
import { databaseAuthRepository } from "./databaseRepository";
import { fileAuthRepository } from "./localStore";
import type { AuthRepository } from "./contracts";

export function getAuthRepository(): AuthRepository {
  if (isDatabaseConfigured()) return databaseAuthRepository;
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is required in production; file-backed authentication is disabled.");
  return fileAuthRepository;
}

export function getAuthRepositoryMode() { return isDatabaseConfigured() ? "postgresql" as const : "local-file" as const; }
