import "server-only";

function configured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.COSMIC_AUTH_FROM_EMAIL);
}

export function isPasswordRecoveryEmailConfigured() {
  return configured();
}

export async function sendPasswordResetEmail(input: { to: string; resetUrl: string }) {
  if (!configured()) throw new Error("Password recovery email is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.COSMIC_AUTH_FROM_EMAIL!,
      to: [input.to],
      subject: "Reset your Cosmos password",
      text: `A password reset was requested for your Cosmos account.

Open this secure link to choose a new password:
${input.resetUrl}

This link expires in 30 minutes and can only be used once.

If you did not request this reset, you can ignore this email.`,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Password recovery email could not be sent.");
}
