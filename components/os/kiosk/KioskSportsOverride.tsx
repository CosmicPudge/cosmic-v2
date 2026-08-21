"use client";

import type { SportsEvent } from "@/core/contracts/Sports";

import KioskFootballView from "./sports/KioskFootballView";
import KioskBaseballView from "./sports/KioskBaseballView";
import KioskF1View from "./sports/KioskF1View";
import KioskNascarView from "./sports/KioskNascarView";

export default function KioskSportsOverride({
  event,
}: {
  event: SportsEvent;
}) {
  switch (event.sport) {
    case "nfl":
      return (
        <KioskFootballView
          event={event}
        />
      );

    case "mlb":
      return (
        <KioskBaseballView
          event={event}
        />
      );

    case "f1":
      return (
        <KioskF1View
          event={event}
        />
      );

    case "nascar":
      return (
        <KioskNascarView
          event={event}
        />
      );

    default:
      return null;
  }
}