"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { widgetId: string; children: ReactNode; }
interface State { failed: boolean; }

export default class KioskWidgetErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") console.error(`[kiosk-widget] failed id=${this.props.widgetId} message=${JSON.stringify(error.message.slice(0, 200))} component=${JSON.stringify(info.componentStack?.trim().slice(0, 160) ?? "unknown")}`);
    this.setState({ failed: true });
  }

  render() {
    if (this.state.failed) return <div className="grid h-full min-h-0 place-items-center bg-[#030511] p-6 text-center text-white"><div><p className="text-xs uppercase tracking-[.28em] text-cyan-200/55">Cosmic Kiosk</p><p className="mt-3 text-sm text-white/55">This scene is temporarily unavailable.</p></div></div>;
    return this.props.children;
  }
}
