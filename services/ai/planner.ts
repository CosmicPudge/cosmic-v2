import type { CosmicAIPermissions } from "@/core/contracts/AI";
export function planAIRequest(message: string, permissions: CosmicAIPermissions) {
  const lower = message.toLowerCase(); const tools: Array<{ name: string; args: { module?: string; query?: string } }> = [];
  if (/\b(weather|temperature|feels like|rain|precipitation|wind|forecast)\b/i.test(lower)) return [{ name: "current_weather", args: { query: message.slice(0, 400) } }];
  if (/\b(settings|timezone|time zone|units|favorite teams|enabled modules|display name)\b/i.test(lower)) return [{ name: "account_settings", args: { query: message.slice(0, 400) } }];
  if (/\b(score|scores|game|games|sports|standings|play next|team|baseball|football|basketball|soccer|race)\b/i.test(lower)) return [{ name: "sports_lookup", args: { query: message.slice(0, 400) } }];
  if (/\b(calendar|event|events|appointment|meeting|today|tomorrow|upcoming|next event)\b/i.test(lower)) return [{ name: "calendar_lookup", args: { query: message.slice(0, 400) } }];
  const modules = ["finance", "garage", "notes", "projects", "school"] as const;
  const selectedModule = modules.find((item) => lower.includes(item))
    ?? (/assignment|course|class|school|canvas|due this week|due tomorrow|schedule/i.test(lower) ? "school" : undefined);
  if (selectedModule && permissions.modules[selectedModule]) tools.push({ name: "private_summary", args: { module: selectedModule } });
  const current = /today|latest|current|recent|news|weather|price|score|schedule/i.test(message);
  if (current && permissions.modules.publicWeb) tools.push({ name: "public_web_search", args: { query: message.slice(0, 400) } });
  return tools.slice(0, 2);
}
