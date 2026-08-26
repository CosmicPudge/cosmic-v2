import type {
  BaseballUniform,
  BaseballUniformAsset,
} from "@/core/contracts/sports/Baseball";
import { fetchJson, isRecord, number, records, string } from "../types";

const MLB_UNIFORMS_BASE = "https://statsapi.mlb.com/api/v1/uniforms/game";
const CACHE_SECONDS = 900;

interface GameUniforms {
  home?: BaseballUniform;
  away?: BaseballUniform;
}

const cache = new Map<string, { expiresAt: number; value: Promise<GameUniforms> }>();

function normalizeAsset(value: unknown): BaseballUniformAsset | undefined {
  if (!isRecord(value)) return undefined;
  const type = isRecord(value.uniformAssetType) ? value.uniformAssetType : undefined;
  return {
    id: number(value.uniformAssetId) !== undefined ? String(number(value.uniformAssetId)) : undefined,
    code: string(value.uniformAssetCode),
    text: string(value.uniformAssetText),
    typeCode: type ? string(type.uniformAssetTypeCode) : undefined,
    typeText: type ? string(type.uniformAssetTypeText) : undefined,
    active: typeof value.active === "boolean" ? value.active : undefined,
  };
}

function normalizeSide(value: unknown): BaseballUniform | undefined {
  if (!isRecord(value)) return undefined;
  const assets = records(value.uniformAssets)
    .map(normalizeAsset)
    .filter((asset): asset is BaseballUniformAsset => Boolean(asset));
  return {
    teamId: number(value.id) !== undefined ? String(number(value.id)) : undefined,
    teamName: string(value.teamName),
    assets,
  };
}

async function fetchGameUniforms(gamePk: string): Promise<GameUniforms> {
  const payload = await fetchJson(`${MLB_UNIFORMS_BASE}?gamePks=${encodeURIComponent(gamePk)}`, CACHE_SECONDS);
  const record = records(isRecord(payload) ? payload.uniforms : undefined)
    .find((item) => String(number(item.gamePk) ?? "") === gamePk);
  if (!record) return {};
  return {
    home: normalizeSide(record.home),
    away: normalizeSide(record.away),
  };
}

/**
 * Uniform metadata is deliberately cached separately from the fast live-feed
 * data. A provider outage returns no uniforms and cannot break live scoring.
 */
export async function getMlbGameUniforms(gamePk: number | string): Promise<GameUniforms> {
  const key = String(gamePk);
  const current = cache.get(key);
  if (current && current.expiresAt > Date.now()) return current.value;

  const value = fetchGameUniforms(key).catch(() => ({}));
  cache.set(key, { value, expiresAt: Date.now() + CACHE_SECONDS * 1_000 });
  return value;
}

