"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

const CRASH_KEY = "cosmic:kiosk-render-failures";
const CRASH_WINDOW_MS = 60_000;

interface Props { children: ReactNode; }
interface State { error: Error | null; resetKey: number; circuitOpen: boolean; }

function safeMessage(error: unknown) {
  return error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 240) : "Unknown kiosk render failure";
}

function recordFailure() {
  if (typeof window === "undefined") return 1;
  try {
    const now = Date.now();
    const previous = JSON.parse(sessionStorage.getItem(CRASH_KEY) ?? "[]") as unknown;
    const timestamps = Array.isArray(previous) ? previous.filter((value): value is number => typeof value === "number" && now - value < CRASH_WINDOW_MS) : [];
    timestamps.push(now);
    sessionStorage.setItem(CRASH_KEY, JSON.stringify(timestamps.slice(-8)));
    return timestamps.length;
  } catch { return 1; }
}

export default class KioskErrorBoundary extends Component<Props, State> {
  private recoveryTimer: number | undefined;

  state: State = { error: null, resetKey: 0, circuitOpen: false };

  componentDidMount() {
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
    if (this.recoveryTimer !== undefined) window.clearTimeout(this.recoveryTimer);
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") console.error(`[kiosk-recovery] render-error=${JSON.stringify(safeMessage(error))} component=${JSON.stringify(info.componentStack?.trim().slice(0, 240) ?? "unknown")}`);
    const failures = recordFailure();
    this.setState({ error, circuitOpen: failures >= 3 });
    if (failures === 1) this.scheduleRecovery(false);
    if (failures === 2) this.scheduleRecovery(true);
  }

  private handleWindowError = (event: ErrorEvent) => {
    if (event.target instanceof HTMLImageElement || event.target instanceof HTMLScriptElement || event.target instanceof HTMLLinkElement) return;
    this.handleExternalFailure(event.error instanceof Error ? event.error : new Error("Kiosk runtime error"));
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (!(event.reason instanceof Error)) return;
    this.handleExternalFailure(event.reason);
  };

  private handleExternalFailure(error: Error) {
    if (this.state.error) return;
    if (process.env.NODE_ENV !== "production") console.error(`[kiosk-recovery] runtime-error=${JSON.stringify(safeMessage(error))}`);
    const failures = recordFailure();
    this.setState({ error, circuitOpen: failures >= 3 });
    if (failures === 1) this.scheduleRecovery(false);
    if (failures === 2) this.scheduleRecovery(true);
  }

  private scheduleRecovery(reload: boolean) {
    this.recoveryTimer = window.setTimeout(() => {
      this.recoveryTimer = undefined;
      if (this.state.circuitOpen) return;
      if (reload) window.location.reload();
      else this.setState((state) => ({ error: null, resetKey: state.resetKey + 1 }));
    }, 3000);
  }

  private retry = () => {
    if (this.recoveryTimer !== undefined) window.clearTimeout(this.recoveryTimer);
    this.recoveryTimer = undefined;
    this.setState((state) => ({ error: null, resetKey: state.resetKey + 1, circuitOpen: false }));
  };

  render() {
    if (!this.state.error) return <div key={this.state.resetKey} className="contents">{this.props.children}</div>;
    return (
      <main className="kiosk-recovery-screen grid min-h-[100dvh] place-items-center overflow-hidden bg-[#030511] px-6 text-center text-white">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[.34em] text-cyan-200/70">Cosmic</p>
          <h1 className="mt-4 text-3xl font-semibold">Something went wrong.</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">{this.state.circuitOpen ? "Your display is safe. Automatic recovery is paused after repeated failures." : "Recovering your display…"}</p>
          <button type="button" onClick={this.retry} className="mt-7 rounded-xl border border-cyan-200/25 bg-cyan-200/10 px-5 py-3 text-sm font-medium text-cyan-50">Retry now</button>
        </div>
      </main>
    );
  }
}
