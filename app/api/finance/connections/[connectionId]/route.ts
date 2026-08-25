import { requireCosmicAccount } from "@/services/auth/server";
import { deleteFinanceConnection, deleteFinanceConnectionData, getFinanceConnection, getFinanceCredential } from "@/services/finance/connectedStore";
import { getFinancialProviderRegistry } from "@/services/finance/providers/registry";
import { assertSameOrigin } from "@/services/security/origin";

export async function DELETE(request: Request, context: { params: Promise<{ connectionId: string }> }) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    const { connectionId } = await context.params;
    const deleteMode = new URL(request.url).searchParams.get("mode") === "delete";
    const connection = await getFinanceConnection(account.id, connectionId);
    if (!connection) return Response.json({ error: "Finance connection not found." }, { status: 404 });
    const credential = await getFinanceCredential(account.id, connectionId);
    const provider = getFinancialProviderRegistry().find((item) => item.id === connection.provider)?.adapter;
    if (credential?.accessToken && provider?.capabilities.supportsDisconnect) await provider.disconnect(credential.accessToken);
    if (deleteMode) {
      await deleteFinanceConnectionData(account.id, connectionId);
      return Response.json({ deleted: true, historicalData: "removed_for_this_institution" });
    }
    await deleteFinanceConnection(account.id, connectionId);
    return Response.json({ disconnected: true, historicalData: "preserved_in_database" });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "The institution could not be disconnected. Historical data was preserved." }, { status: 502 });
  }
}
