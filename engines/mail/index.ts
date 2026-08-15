import type { Engine } from "@/core/contracts/Engine";
import type { MailMessage, MailSnapshot } from "@/core/contracts";

export interface MailProviderAdapter {
  getMessages(options?: { limit?: number; unreadOnly?: boolean }): Promise<MailMessage[]>;
  getMessage(id: string): Promise<MailMessage>;
}

export class MailEngine implements Engine<MailSnapshot> {
  private snapshot: MailSnapshot | null = null;
  private lastUpdated: Date | null = null;

  constructor(private readonly provider: MailProviderAdapter) {}

  async initialize(): Promise<void> { await this.refresh(); }
  async refresh(): Promise<void> {
    const messages = await this.provider.getMessages({ limit: 50 });
    const sorted = [...messages].sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
    this.lastUpdated = new Date();
    this.snapshot = { messages: sorted, unreadCount: sorted.filter((message) => message.unread).length, lastUpdated: this.lastUpdated };
  }
  async getSnapshot(): Promise<MailSnapshot> {
    if (!this.snapshot || !this.lastUpdated || Date.now() - this.lastUpdated.getTime() >= 3 * 60 * 1000) await this.refresh();
    return this.snapshot!;
  }
  async getMessages(options?: { limit?: number; unreadOnly?: boolean }): Promise<MailMessage[]> { return this.provider.getMessages(options); }
  async getMessage(id: string): Promise<MailMessage> { return this.provider.getMessage(id); }
  isReady(): boolean { return this.snapshot !== null; }
  getLastUpdated(): Date | null { return this.lastUpdated; }
}
