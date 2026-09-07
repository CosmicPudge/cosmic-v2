export type LatestWriteDiagnostic =
  | "coalesced"
  | "stale"
  | "slow"
  | "timeout";

type PendingWrite = {
  content: string;
  shouldWrite: () => boolean;
  resolve: () => void;
  reject: (error: unknown) => void;
};

export class LatestWriteQueue {
  private active = false;
  private pending: PendingWrite | null = null;
  private readonly writer: (content: string) => Promise<unknown>;
  private readonly diagnose: (type: LatestWriteDiagnostic, content: string, durationMs?: number) => void;
  private readonly timeoutMs: number;

  constructor(
    writer: (content: string) => Promise<unknown>,
    diagnose: (
      type: LatestWriteDiagnostic,
      content: string,
      durationMs?: number,
    ) => void = () => undefined,
    timeoutMs = 3_000,
  ) {
    this.writer = writer;
    this.diagnose = diagnose;
    this.timeoutMs = timeoutMs;
  }

  enqueue(
    content: string,
    shouldWrite: () => boolean = () => true,
  ) {
    return new Promise<void>((resolve, reject) => {
      if (this.pending) {
        this.diagnose("coalesced", this.pending.content);
        this.pending.resolve();
      }

      this.pending = {
        content,
        shouldWrite,
        resolve,
        reject,
      };

      if (!this.active) {
        void this.flush();
      }
    });
  }

  private async flush() {
    this.active = true;

    while (this.pending) {
      const request = this.pending;
      this.pending = null;

      if (!request.shouldWrite()) {
        this.diagnose("stale", request.content);
        request.resolve();
        continue;
      }

      const startedAt = performance.now();
      let timeoutHandle: ReturnType<typeof setTimeout>;

      try {
        await Promise.race([
          this.writer(request.content),
          new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(() => {
              reject(new Error("bridge write timed out"));
            }, this.timeoutMs);
          }),
        ]);
        const durationMs = performance.now() - startedAt;

        if (durationMs > 500) {
          this.diagnose(
            "slow",
            request.content,
            durationMs,
          );
        }

        request.resolve();
      } catch (error) {
        const durationMs = performance.now() - startedAt;
        if (
          error instanceof Error &&
          error.message === "bridge write timed out"
        ) {
          this.diagnose(
            "timeout",
            request.content,
            durationMs,
          );
        }
        request.reject(error);
      } finally {
        clearTimeout(timeoutHandle);
      }
    }

    this.active = false;
  }
}
