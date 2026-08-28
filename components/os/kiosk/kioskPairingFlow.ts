export type ApprovedPairingFlowState = "authenticated" | "enrolling" | "reconnecting" | "recovery_required";

type HelperBody = { state?: string; handoffToken?: string };

type ApprovedPairingFlowOptions = {
  bootId: string;
  pairingCode: string;
  requestHelper: (body: { bootId: string; pairingCode: string }) => Promise<{ ok: boolean; body: HelperBody | null }>;
  consumeHandoff: (handoffToken: string) => Promise<boolean>;
  onAuthenticated: () => Promise<void>;
};

export async function completeApprovedPairing(options: ApprovedPairingFlowOptions): Promise<ApprovedPairingFlowState> {
  const helper = await options.requestHelper({ bootId: options.bootId, pairingCode: options.pairingCode }).catch(() => ({ ok: false, body: null }));
  if (!helper.ok || helper.body?.state !== "ready" || !helper.body.handoffToken) {
    if (helper.body?.state === "needs_provisioning") return "enrolling";
    if (helper.body?.state === "identity_recovery" || helper.body?.state === "recovery_required") return "recovery_required";
    return "reconnecting";
  }
  if (!await options.consumeHandoff(helper.body.handoffToken)) return "reconnecting";
  await options.onAuthenticated();
  return "authenticated";
}
