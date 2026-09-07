import "server-only";

export interface WebPushConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export function getWebPushConfig(): WebPushConfig | null {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.WEB_PUSH_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}
