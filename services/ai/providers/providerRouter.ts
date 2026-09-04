import type { AIProvider } from "../provider";
import { getCloudflareAIProvider } from "./cloudflare";

export type AIProviderId = "openai" | "cloudflare-workers-ai";

export function getConfiguredAIProvider(): AIProvider {
  return process.env.AI_PROVIDER?.trim().toLocaleLowerCase() === "cloudflare" ? getCloudflareAIProvider() : getOpenAI();
}

export function getConfiguredAIProviders(preference?: AIProviderId[]): AIProvider[] {
  const cloudflareConfigured = Boolean(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() && process.env.CLOUDFLARE_AI_API_TOKEN?.trim());
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const cloudflare = cloudflareConfigured ? getCloudflareAIProvider() : null;
  const openAI = openAIConfigured ? getOpenAI() : null;
  const configured = new Map<AIProviderId, AIProvider | null>([["openai", openAI], ["cloudflare-workers-ai", cloudflare]]);
  const orderedIds = preference ?? (process.env.AI_PROVIDER?.trim().toLocaleLowerCase() === "cloudflare" ? ["cloudflare-workers-ai", "openai"] : ["openai", "cloudflare-workers-ai"]);
  const ordered = orderedIds.map((id) => configured.get(id));
  return ordered.filter((provider): provider is AIProvider => Boolean(provider));
}

let getOpenAI: () => AIProvider;
export function registerOpenAIProvider(factory: () => AIProvider) { getOpenAI = factory; }
