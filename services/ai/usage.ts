import "server-only";
const state = { requests: 0, toolCalls: 0, lastAt: null as string | null };
export function recordAIUsage(toolCalls: number) { state.requests += 1; state.toolCalls += toolCalls; state.lastAt = new Date().toISOString(); }
export function getAIUsage() { return { ...state }; }
