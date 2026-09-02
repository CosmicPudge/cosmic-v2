import type { AIProvider } from "../provider";
import { getCloudflareAIProvider } from "./cloudflare";

export function getConfiguredAIProvider(): AIProvider {
  return process.env.AI_PROVIDER?.trim().toLocaleLowerCase() === "cloudflare" ? getCloudflareAIProvider() : getOpenAI();
}

let getOpenAI: () => AIProvider;
export function registerOpenAIProvider(factory: () => AIProvider) { getOpenAI = factory; }
