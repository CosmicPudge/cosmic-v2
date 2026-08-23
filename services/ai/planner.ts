import type { CosmicAIPermissions } from "@/core/contracts/AI";
export function planAIRequest(message: string, permissions: CosmicAIPermissions) {
  const lower = message.toLowerCase(); const tools: Array<{ name: string; args: { module?: string; query?: string } }> = [];
  const modules = ["finance", "garage", "notes", "projects", "school"] as const;
  const selectedModule = modules.find((item) => lower.includes(item));
  if (selectedModule && permissions.modules[selectedModule]) tools.push({ name: "private_summary", args: { module: selectedModule } });
  const current = /today|latest|current|recent|news|weather|price|score|schedule/i.test(message);
  if (current && permissions.modules.publicWeb) tools.push({ name: "public_web_search", args: { query: message.slice(0, 400) } });
  return tools.slice(0, 2);
}
