import { DONUT_CONFIG } from "@/services/donuts/config";
import { createPendingDonutOrder } from "@/services/donuts/repository";
import { DonutOrderError, type CreatePendingDonutOrderInput } from "@/services/donuts/orderValidation";

export async function POST(request: Request) {
  if (!DONUT_CONFIG.enabled) return Response.json({ error: "Cosmic Donuts ordering is disabled in this environment." }, { status: 503 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "A JSON order object is required.", code: "invalid" }, { status: 400 });
  try {
    const result = await createPendingDonutOrder(body as CreatePendingDonutOrderInput);
    return Response.json(result, { status: result.idempotent ? 200 : 201 });
  } catch (error) {
    if (error instanceof DonutOrderError) return Response.json({ error: error.message, code: error.code }, { status: error.code === "conflict" ? 409 : 400 });
    return Response.json({ error: "Unable to create the order." }, { status: 500 });
  }
}
