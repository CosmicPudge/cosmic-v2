import assert from "node:assert/strict";
import test from "node:test";

const env = process.env as Record<string, string | undefined>;
async function loadProvider() {
  const previousKey = env.OPENWEATHER_API_KEY;
  env.OPENWEATHER_API_KEY = "test-key";
  const provider = await import("./OpenWeatherProvider");
  if (previousKey === undefined) delete env.OPENWEATHER_API_KEY; else env.OPENWEATHER_API_KEY = previousKey;
  return provider.getOpenWeather;
}

test("preserves unauthorized current-weather status without exposing the body", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "secret provider detail" }), { status: 401 });
  try { const getOpenWeather = await loadProvider(); await assert.rejects(() => getOpenWeather(40, -111), (error: unknown) => (error as { category?: string; status?: number }).category === "invalid-response" && (error as { status?: number }).status === 401); }
  finally { globalThis.fetch = previousFetch; }
});

test("classifies provider timeouts", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { const error = new Error("aborted"); error.name = "AbortError"; throw error; };
  try { const getOpenWeather = await loadProvider(); await assert.rejects(() => getOpenWeather(40, -111), (error: unknown) => (error as { category?: string }).category === "timeout"); }
  finally { globalThis.fetch = previousFetch; }
});

test("accepts a valid current-weather payload", async () => {
  const previousFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return calls === 1
      ? new Response(JSON.stringify({ name: "Test City", weather: [{ icon: "01d", main: "Clear", description: "clear sky" }], main: { temp: 70, feels_like: 69, humidity: 30 }, wind: { speed: 4, deg: 180 }, sys: { sunrise: 1, sunset: 2 } }), { status: 200 })
      : new Response(JSON.stringify({ list: [] }), { status: 200 });
  };
  try { const getOpenWeather = await loadProvider(); const result = await getOpenWeather(40, -111); assert.equal(result.city, "Test City"); assert.equal(result.temp, 70); }
  finally { globalThis.fetch = previousFetch; }
});
