import {
  CreateStartUpPageContainer,
  OsEventTypeList,
  TextContainerProperty,
  TextContainerUpgrade,
  waitForEvenAppBridge,
} from "@evenrealities/even_hub_sdk";

import { HUD } from "./constants";
import { hudViews } from "./views";

import { getCosmicStatus } from "../data/cosmicClient";
import { getNextCalendarEvent } from "../data/calendarClient";
import { getCosmicSports } from "../data/sportsClient";
import { getCosmicMusic } from "../data/musicClient";
import { getCosmicCallStatus } from "../data/callClient";
import type { CosmicCallStatus } from "../data/callClient";
import type { CosmicSportsResponse } from "../data/sportsClient";
import {
  formatSportsContext as formatSportsContextValue,
  formatSportsScore,
} from "./sportsContext";
import {
  formatNavigationDistance as formatNavigationDistanceValue,
  getNavigationArrow,
  getNavigationManeuverLabel,
  shouldUseLargeNavigationArrow,
  formatUrgentNavigationContext,
} from "./navigationContext";
import {
  formatCalendarContext,
} from "./calendarContext";
import type {
  CosmicCalendarEvent,
} from "../data/calendarClient";

import { getCosmicNavigation } from "../data/navigationClient";

import type {
  CosmicNavigationState,
} from "../data/navigationClient";

import type {
  HudPriority,
  HudView,
} from "./types";

import {
  canReplaceView,
} from "../context/priority";
import {
  resolveContext,
} from "../context/contextResolver";
import {
  LatestWriteQueue,
} from "./latestWriteQueue";

export class CosmicHudService {
  private bridge:
    Awaited<
      ReturnType<
        typeof waitForEvenAppBridge
      >
    >;
  private lastSportsContent = "";
  private lastStatusContent = "";
  private lastClockContent = "";
  private lastContextStripContent = "";
  private contextSportsRefreshAt = 0;
  private contextSportsRefreshInterval = 30_000;
  private contextCalendarRefreshAt = 0;
  private contextCalendarRefreshInterval = 30_000;
  private contextCalendarEvent: CosmicCalendarEvent | null = null;
  private lastSportsContextContent = "";
  private contextStripRefreshInFlight = false;
  private contextStripOperationId = 0;
  private callStatus: CosmicCallStatus | null = null;
  private currentView = 0;
  private lastMusicRefresh = 0;
  private lastMusicContent = "";
  private lastSportsRefresh = 0;
  private lastCalendarRefresh = 0;
  private isCardVisible = false;
  private sportsRefreshInterval = 30_000;
  private lastRenderedContent:
    Record<string, string> = {};
  private liveRefreshInFlight = new Set<string>();
  private bridgeWrites = new Map<string, LatestWriteQueue>();
  private navigationOperationId = 0;
  private renderEpoch = 0;
  private clockUpdateInFlight = false;
  private clockUpdatePending = false;
  private readonly diagnosticsEnabled =
    import.meta.env.DEV &&
    new URLSearchParams(
      globalThis.location?.search ?? "",
    ).has("hudDiagnostics");
  private readonly heartbeatMode =
    this.diagnosticsEnabled
      ? new URLSearchParams(
        globalThis.location?.search ?? "",
      ).get("hudHeartbeat")
      : null;
  private diagnosticCounts = new Map<string, number>();
  private lastClockTickAt: number | null = null;
  private heartbeatCounter = 0;

  private activePriority:
    HudPriority = "passive";

  private dismissTimer:
    | ReturnType<typeof setTimeout>
    | null = null;
  private currentCalendarEvent:
    | {
      title: string;
      start: string;
      location?: string | null;
    }
    | null = null;

  private lastCalendarCountdownMinute:
    number | null = null;

  private constructor(
    bridge: Awaited<
      ReturnType<
        typeof waitForEvenAppBridge
      >
    >,
  ) {
    this.bridge = bridge;
  }

  static async create() {
    const bridge =
      await waitForEvenAppBridge();

    const service =
      new CosmicHudService(
        bridge,
      );

    await service.initialize();

    return service;
  }

  // --------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------

  private async initialize() {
    const timeContainer =
      new TextContainerProperty({
        xPosition: 10,
        yPosition: 8,
        width: 200,
        height: 40,
        borderWidth: 0,
        borderColor: 5,
        paddingLength: 0,
        containerID: HUD.timeId,
        containerName:
          "cosmic-time",
        content: "--:--",
        isEventCapture: 0,
      });

    const statusContainer =
      new TextContainerProperty({
        xPosition: 410,
        yPosition: 8,
        width: 156,
        height: 60,
        borderWidth: 0,
        borderColor: 5,
        paddingLength: 0,
        containerID:
          HUD.statusId,
        containerName:
          "cosmic-status",
        content: "--°",
        isEventCapture: 0,
      });

    const cardContainer =
      new TextContainerProperty({
        xPosition: 120,
        yPosition: 95,
        width: 336,
        height: 150,
        borderWidth: 0,
        borderColor: 5,
        paddingLength: 0,
        containerID: HUD.cardId,
        containerName:
          "cosmic-card",
        content: "",
        isEventCapture: 0,
      });
    const contextContainer =
      new TextContainerProperty({
        xPosition: 188,
        yPosition: 8,
        width: 200,
        height: 60,
        borderWidth: 0,
        borderColor: 5,
        paddingLength: 0,
        containerID: HUD.contextId,
        containerName: "cosmic-context",
        content: "",
        isEventCapture: 0,
      });
    const inputContainer =
      new TextContainerProperty({
        xPosition: 0,
        yPosition: 0,
        width: 1,
        height: 1,
        borderWidth: 0,
        borderColor: 5,
        paddingLength: 0,
        containerID: 99,
        containerName: "cosmic-input",
        content: " ",
        isEventCapture: 1,
      });
    await this.bridge
      .createStartUpPageContainer(
        new CreateStartUpPageContainer(
          {
            containerTotalNum: 5,

            textObject: [
              timeContainer,
              statusContainer,
              contextContainer,
              cardContainer,
              inputContainer,
            ],
          },
        ),
      );

    this.registerInput();

    await this.updateClock("initialize");
    await this.updateCosmicStatus();

    if (!this.heartbeatMode) {
      await this.refreshContextStrip();
    }

    this.schedulePassiveLoop(
      "calendar-countdown",
      10_000,
      () => this.updateCalendarCountdown(),
    );
    this.schedulePassiveLoop(
      "clock",
      1_000,
      () => this.updateClock("timer"),
    );
    this.schedulePassiveLoop(
      "status",
      60_000,
      () => this.updateCosmicStatus(),
    );
    this.schedulePassiveLoop(
      "live-refresh",
      1_000,
      () => this.runLiveRefresh(),
    );

    if (this.heartbeatMode) {
      this.schedulePassiveLoop(
        "diagnostic-heartbeat",
        1_000,
        () => this.updateDiagnosticHeartbeat(),
      );
    }

    console.log(
      "Cosmic HUD service initialized",
    );
  }

  private schedulePassiveLoop(
    name: string,
    intervalMs: number,
    callback: () => Promise<void>,
  ) {
    let lastFiredAt: number | null = null;

    const tick = async () => {
      const firedAt = Date.now();
      this.logDiagnostic(
        `${name} timer fired`,
        {
          elapsedMs: lastFiredAt === null
            ? null
            : firedAt - lastFiredAt,
          intervalMs,
        },
      );
      lastFiredAt = firedAt;

      try {
        await callback();
      } catch (error) {
        console.error(
          `Passive ${name} update failed:`,
          error,
        );
      } finally {
        setTimeout(() => {
          void tick();
        }, intervalMs);
      }
    };

    setTimeout(() => {
      void tick();
    }, intervalMs);
  }

  private logDiagnostic(
    name: string,
    details: Record<string, unknown> = {},
  ) {
    if (!this.diagnosticsEnabled) {
      return;
    }

    const count =
      (this.diagnosticCounts.get(name) ?? 0) + 1;
    this.diagnosticCounts.set(name, count);

    if (count > 10 && count % 30 !== 0) {
      return;
    }

    console.debug(
      `[HUD diagnostic] ${name}`,
      {
        count,
        performanceNow: Math.round(performance.now()),
        visibilityState: document.visibilityState,
        ...details,
      },
    );
  }

  private async updateDiagnosticHeartbeat() {
    if (!this.heartbeatMode) {
      return;
    }

    this.heartbeatCounter += 1;
    const content = `TEST ${String(this.heartbeatCounter).padStart(2, "0")}`;
    const startedAt = performance.now();

    if (this.heartbeatMode === "direct") {
      const success =
        await this.bridge
          .textContainerUpgrade(
            new TextContainerUpgrade({
              containerID: HUD.contextId,
              containerName: "cosmic-context",
              contentOffset: 0,
              contentLength: 0,
              content,
            }),
          );
      this.logDiagnostic(
        "direct heartbeat resolved",
        {
          content,
          success,
          durationMs: Math.round(
            performance.now() - startedAt,
          ),
        },
      );
      return;
    }

    await this.updateText(
      HUD.contextId,
      "cosmic-context",
      content,
    );
    this.logDiagnostic(
      "queued heartbeat resolved",
      {
        content,
        durationMs: Math.round(
          performance.now() - startedAt,
        ),
      },
    );
  }

  // --------------------------------------------------
  // WEATHER
  // --------------------------------------------------

  private async updateCosmicStatus() {
    try {
      const status =
        await getCosmicStatus();

      const content =
        `${Math.round(
          status.weather.temperature,
        )}°\n${status.weather.condition}`;

      if (
        content ===
        this.lastStatusContent
      ) {
        return;
      }

      this.lastStatusContent =
        content;

      await this.updateText(
        HUD.statusId,
        "cosmic-status",
        content,
      );

      console.log(
        "LIVE HUD UPDATED: weather",
      );
    } catch (error) {
      console.error(
        "Failed to fetch Cosmic status:",
        error,
      );

      const fallback = "--°";

      if (
        fallback ===
        this.lastStatusContent
      ) {
        return;
      }

      this.lastStatusContent =
        fallback;

      await this.updateText(
        HUD.statusId,
        "cosmic-status",
        fallback,
      );
    }
  }

  // --------------------------------------------------
  // CALENDAR
  // --------------------------------------------------

  private async getCalendarCard():
    Promise<HudView> {
    try {
      const calendar =
        await getNextCalendarEvent();

      if (!calendar.nextEvent) {
        this.currentCalendarEvent =
          null;

        this.lastCalendarCountdownMinute =
          null;
        return {
          id: "calendar",
          title: "CALENDAR",
          body:
            "No upcoming events",
          priority: "glance",
          timeoutMs: 8000,
        };
      }

      const event =
        calendar.nextEvent;

      this.currentCalendarEvent = {
        title: event.title,
        start: event.start,
        location:
          event.location ?? null,
      };

      let timeText: string;

      if (
        event.minutesUntil < 60
      ) {
        timeText =
          `${event.minutesUntil} min`;
      } else if (
        event.minutesUntil <
        24 * 60
      ) {
        const hours =
          Math.floor(
            event.minutesUntil /
            60,
          );

        const minutes =
          event.minutesUntil %
          60;

        timeText =
          minutes > 0
            ? `${hours}h ${minutes}m`
            : `${hours}h`;
      } else {
        timeText =
          new Intl.DateTimeFormat(
            "en-US",
            {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            },
          ).format(
            new Date(
              event.start,
            ),
          );
      }

      const bodyParts = [
        event.title,
        timeText,
      ];

      if (event.location) {
        bodyParts.push(
          event.location,
        );
      }

      return {
        id: "calendar",
        title: "CALENDAR",
        body:
          bodyParts.join("\n"),
        priority: "glance",
        timeoutMs: 8000,
      };
    } catch (error) {
      console.error(
        "Failed to load calendar:",
        error,
      );

      return {
        id: "calendar",
        title: "CALENDAR",
        body:
          "Calendar unavailable",
        priority: "glance",
        timeoutMs: 8000,
      };
    }
  }

  private async updateCalendarCountdown() {
    if (
      !this.isCardVisible ||
      hudViews[this.currentView]?.id !==
      "calendar" ||
      !this.currentCalendarEvent
    ) {
      return;
    }

    const start =
      new Date(
        this.currentCalendarEvent.start,
      ).getTime();

    const now = Date.now();

    const minutesUntil =
      Math.max(
        0,
        Math.ceil(
          (start - now) / 60_000,
        ),
      );

    if (
      minutesUntil ===
      this.lastCalendarCountdownMinute
    ) {
      return;
    }

    this.lastCalendarCountdownMinute =
      minutesUntil;

    let timeText: string;

    if (minutesUntil < 60) {
      timeText =
        `${minutesUntil} min`;
    } else if (
      minutesUntil <
      24 * 60
    ) {
      const hours =
        Math.floor(
          minutesUntil / 60,
        );

      const minutes =
        minutesUntil % 60;

      timeText =
        minutes > 0
          ? `${hours}h ${minutes}m`
          : `${hours}h`;
    } else {
      timeText =
        new Intl.DateTimeFormat(
          "en-US",
          {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
          },
        ).format(
          new Date(
            this.currentCalendarEvent.start,
          ),
        );
    }

    const bodyParts = [
      this.currentCalendarEvent
        .title,
      timeText,
    ];

    if (
      this.currentCalendarEvent
        .location
    ) {
      bodyParts.push(
        this.currentCalendarEvent
          .location,
      );
    }

    const view: HudView = {
      id: "calendar",
      title: "CALENDAR",
      body:
        bodyParts.join("\n"),
      priority: "glance",
      timeoutMs: 8000,
    };

    await this.refreshVisibleView(
      view,
    );
  }

  // --------------------------------------------------
  // SPORTS
  // --------------------------------------------------

  private async getSportsCard():
    Promise<HudView> {
    try {
      const sports =
        await getCosmicSports();
      if (!sports.game) {
        this.sportsRefreshInterval =
          5 * 60_000;
      } else if (
        sports.game.state === "live"
      ) {
        this.sportsRefreshInterval =
          3000;
      } else if (
        sports.game.state === "pregame"
      ) {
        this.sportsRefreshInterval =
          30_000;
      } else {
        this.sportsRefreshInterval =
          5 * 60_000;
      }

      if (!sports.game) {
        return {
          id: "sports",
          title: "SPORTS",
          body:
            "No Angels game scheduled",
          priority: "glance",
          timeoutMs: 8000,
        };
      }

      const game =
        sports.game;

      if (
        game.state === "live"
      ) {
        const live =
          game.live;

        const inningText =
          live?.inning &&
            live?.inningHalf
            ? `${live.inningHalf.toUpperCase()} ${live.inning}`
            : "LIVE";

        const outsText =
          live
            ? `${live.outs} OUT${live.outs === 1
              ? ""
              : "S"
            }`
            : "";

        const countText =
          live
            ? `${live.balls}-${live.strikes}`
            : "";

        return {
          id: "sports",

          title:
            "ANGELS  LIVE",

          body: [
            `${game.awayAbbr} ${formatSportsScore(game.awayScore)}   ${game.homeAbbr} ${formatSportsScore(game.homeScore)}`,
            `${inningText}  ${outsText}`,
            countText,
          ]
            .filter(Boolean)
            .join("\n"),

          priority: "glance",

          timeoutMs: 8000,
        };
      }

      const gameTime =
        new Intl.DateTimeFormat(
          "en-US",
          {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
          },
        ).format(
          new Date(
            game.gameDate,
          ),
        );

      const matchup =
        game.isHome
          ? `${game.homeAbbr} vs ${game.awayAbbr}`
          : `${game.awayAbbr} @ ${game.homeAbbr}`;

      return {
        id: "sports",
        title: "ANGELS",

        body: [
          matchup,
          gameTime,
          game.status,
        ].join("\n"),

        priority: "glance",

        timeoutMs: 8000,
      };
    } catch (error) {
      console.error(
        "Failed to load sports:",
        error,
      );

      return {
        id: "sports",
        title: "SPORTS",
        body:
          "Sports unavailable",
        priority: "glance",
        timeoutMs: 8000,
      };
    }
  }

  // --------------------------------------------------
  // MUSIC
  // --------------------------------------------------

  private async getMusicCard():
    Promise<HudView> {
    try {
      const music =
        await getCosmicMusic();

      if (!music.connected) {
        return {
          id: "music",
          title: "MUSIC",
          body:
            "Spotify disconnected",
          priority: "glance",
          timeoutMs: 8000,
        };
      }

      if (
        !music.playback ||
        !music.playback.track
      ) {
        return {
          id: "music",
          title: "MUSIC",
          body:
            "Nothing playing",
          priority: "glance",
          timeoutMs: 8000,
        };
      }

      const track =
        music.playback.track;

      const bodyParts = [
        track.title,
        track.artists.join(", "),
        music.playback.playing
          ? "Playing"
          : "Paused",
      ];

      if (
        music.playback
          .deviceName
      ) {
        bodyParts.push(
          music.playback
            .deviceName,
        );
      }

      return {
        id: "music",
        title: "MUSIC",
        body:
          bodyParts.join("\n"),
        priority: "glance",
        timeoutMs: 8000,
      };
    } catch (error) {
      console.error(
        "Failed to load music:",
        error,
      );

      return {
        id: "music",
        title: "MUSIC",
        body:
          "Music unavailable",
        priority: "glance",
        timeoutMs: 8000,
      };
    }
  }

  // --------------------------------------------------
  // NAVIGATION FORMATTING
  // --------------------------------------------------

  private formatDistance(
    meters: number,
  ) {
    return formatNavigationDistanceValue(meters);
  }

  private getNavigationTitle(
    navigation:
      CosmicNavigationState,
  ) {
    return getNavigationManeuverLabel(
      navigation.nextManeuver?.type,
      navigation.nextManeuver?.modifier,
    );
  }

  private buildNavigationView(
    navigation:
      CosmicNavigationState,
  ): HudView {
    const maneuver =
      navigation.nextManeuver;

    if (!maneuver) {
      return {
        id: "navigation",
        title: "NAVIGATION",
        body:
          `Continue to ${navigation.destination}`,
        priority: "attention",
        timeoutMs: 8000,
      };
    }

    const distance =
      this.formatDistance(
        maneuver.distanceMeters,
      );

    const arrow =
      getNavigationArrow(
        maneuver.type,
        maneuver.modifier,
      );
    const title =
      this.getNavigationTitle(navigation);
    const street =
      maneuver.streetName?.trim() ||
      null;

    const arrival =
      navigation.arrivalTime
        ? new Intl.DateTimeFormat(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
          },
        ).format(
          new Date(
            navigation.arrivalTime,
          ),
        )
        : `${navigation.etaMinutes} min`;

    if (
      arrow &&
      shouldUseLargeNavigationArrow(
        maneuver.distanceMeters,
        maneuver.type,
        maneuver.modifier,
      )
    ) {
      const body = [
        maneuver.type.toLowerCase().includes("arriv")
          ? "ARRIVE"
          : distance,
        street,
      ].filter(Boolean).join("\n");

      return {
        id: "navigation",
        title: arrow,
        body,
        priority:
          maneuver.distanceMeters <= 130
            ? "critical"
            : "attention",
        timeoutMs: 8000,
      };
    }

    return {
      id: "navigation",

      title,

      body: [
        street || maneuver.instruction,
        "",
        distance,
        "",
        `ETA ${arrival}`,
      ].join("\n"),

      priority:
        maneuver.distanceMeters <=
          130
          ? "critical"
          : "attention",

      timeoutMs: 8000,
    };
  }

  private async getNavigationCard():
    Promise<HudView> {
    try {
      const response =
        await getCosmicNavigation();

      if (!response.navigation) {
        return {
          id: "navigation",
          title: "NAVIGATION",
          body:
            "No active route",
          priority: "attention",
          timeoutMs: 8000,
        };
      }

      return (
        this.buildNavigationView(
          response.navigation,
        )
      );
    } catch (error) {
      console.error(
        "Failed to load navigation:",
        error,
      );

      return {
        id: "navigation",
        title: "NAVIGATION",
        body:
          "Navigation unavailable",
        priority: "attention",
        timeoutMs: 8000,
      };
    }
  }

  // --------------------------------------------------
  // LIVE HUD REFRESH
  // --------------------------------------------------

  private async runLiveRefresh() {
    await this.refreshContextStrip();

    if (!this.isCardVisible) {
      return;
    }

    const current =
      hudViews[this.currentView];

    if (
      current.id !== "music" &&
      current.id !== "sports" &&
      current.id !== "calendar"
    ) {
      return;
    }

    if (
      this.liveRefreshInFlight.has(current.id)
    ) {
      return;
    }

    this.liveRefreshInFlight.add(current.id);

    const now = Date.now();

    try {
      switch (current.id) {
        case "music": {
          if (
            now -
            this.lastMusicRefresh <
            2000
          ) {
            return;
          }

          this.lastMusicRefresh = now;

          const view =
            await this.getMusicCard();

          const content =
            `${view.title}\n\n${view.body}`;

          if (
            content ===
            this.lastMusicContent
          ) {
            return;
          }

          this.lastMusicContent =
            content;

          await this.refreshVisibleView(
            view,
          );

          break;
        }

        case "sports": {
          if (
            now -
            this.lastSportsRefresh <
            this.sportsRefreshInterval
          ) {
            return;
          }

          this.lastSportsRefresh = now;

          const view =
            await this.getSportsCard();

          const content =
            `${view.title}\n\n${view.body}`;

          if (
            content ===
            this.lastSportsContent
          ) {
            return;
          }

          this.lastSportsContent =
            content;

          await this.refreshVisibleView(
            view,
          );

          break;
        }

        case "calendar": {
          if (
            now -
            this.lastCalendarRefresh <
            30_000
          ) {
            return;
          }

          this.lastCalendarRefresh = now;

          const view =
            await this.getCalendarCard();

          await this.refreshVisibleView(
            view,
          );

          break;
        }
      }
    } catch (error) {
      console.error(
        "Live HUD refresh failed:",
        error,
      );
    } finally {
      this.liveRefreshInFlight.delete(
        current.id,
      );
    }
  }

  // --------------------------------------------------
  // CONTEXT STRIP
  // --------------------------------------------------

  private truncateContext(
    content: string,
  ) {
    const maxLength = 25;

    return content.length > maxLength
      ? `${content.slice(0, maxLength - 1)}…`
      : content;
  }

  private formatCallContext(
    call: CosmicCallStatus,
  ) {
    if (call.state === "ringing") {
      return call.outgoing === false ? "Incoming Call" : "Calling";
    }

    if (call.state === "dialing") {
      return "Calling";
    }

    if (call.state !== "connected" && call.state !== "held") {
      return "";
    }

    const connectedAt = call.connectedAt
      ? new Date(call.connectedAt).getTime()
      : null;
    const elapsedSeconds = connectedAt
      ? Math.max(0, Math.floor((Date.now() - connectedAt) / 1000))
      : 0;
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = String(elapsedSeconds % 60).padStart(2, "0");
    const label = call.state === "held" ? "Call Held" : "Active Call";

    return this.truncateContext(
      `${label} • ${String(minutes).padStart(2, "0")}:${seconds}`,
    );
  }

  private formatSportsContext(
    response: CosmicSportsResponse,
  ) {
    return formatSportsContextValue(response);
  }

  private async renderContextStrip(
    content: string,
  ) {
    if (
      content === this.lastContextStripContent
    ) {
      return;
    }

    const operationId =
      ++this.contextStripOperationId;

    await this.updateText(
      HUD.contextId,
      "cosmic-context",
      content,
      () =>
        operationId ===
        this.contextStripOperationId,
    );

    if (
      operationId ===
      this.contextStripOperationId
    ) {
      this.lastContextStripContent = content;
    }
  }

  private async refreshContextStrip() {
    if (this.contextStripRefreshInFlight) {
      this.logDiagnostic(
        "context refresh skipped while in flight",
      );
      return;
    }

    this.contextStripRefreshInFlight = true;
    this.logDiagnostic("context refresh started");

    try {
      let navigationContext = "";
      const refreshCalendar =
        Date.now() >= this.contextCalendarRefreshAt;
      const refreshSports =
        Date.now() >= this.contextSportsRefreshAt;

      const [navigationResult, callResult, calendarResult, sportsResult] =
        await Promise.allSettled([
          getCosmicNavigation(),
          getCosmicCallStatus(),
          refreshCalendar
            ? getNextCalendarEvent()
            : Promise.resolve(null),
          refreshSports
            ? getCosmicSports()
            : Promise.resolve(null),
        ]);

      if (navigationResult.status === "fulfilled") {
        navigationContext =
          formatUrgentNavigationContext(
            navigationResult.value,
          );
        this.logDiagnostic(
          "navigation context resolved",
          { active: Boolean(navigationContext) },
        );
      } else {
        console.error(
          "Failed to refresh navigation context:",
          navigationResult.reason,
        );
      }

      if (callResult.status === "fulfilled") {
        this.callStatus = callResult.value;
        this.logDiagnostic(
          "call context resolved",
          { state: this.callStatus?.state ?? null },
        );
      } else {
        this.callStatus = null;
        console.error(
          "Failed to refresh call context:",
          callResult.reason,
        );
      }

      if (refreshCalendar) {
        if (calendarResult.status === "fulfilled") {
          this.contextCalendarEvent =
            calendarResult.value?.nextEvent ?? null;
        } else {
          console.error(
            "Failed to refresh calendar context:",
            calendarResult.reason,
          );
        }

        this.contextCalendarRefreshAt =
          Date.now() +
          this.contextCalendarRefreshInterval;
      }

      if (refreshSports) {
        if (sportsResult.status === "fulfilled") {
          const sports = sportsResult.value;
          this.logDiagnostic(
            "sports context request resolved",
            {
              state: sports?.game?.state ?? null,
            },
          );

          this.contextSportsRefreshInterval =
            sports?.game?.state === "live"
              ? 1000
              : 30_000;
          this.contextSportsRefreshAt =
            Date.now() +
            this.contextSportsRefreshInterval;
          this.lastSportsContextContent =
            sports ? this.formatSportsContext(sports) : "";
        } else {
          console.error(
            "Failed to refresh sports context:",
            sportsResult.reason,
          );
          // Retry promptly after a failed live read without blocking the
          // other context sources or displaying an invented result.
          this.contextSportsRefreshAt =
            Date.now() + 1000;
        }
      }

      const callContext =
        this.callStatus &&
        this.callStatus.state !== "idle" &&
        this.callStatus.state !== "ended"
          ? this.formatCallContext(this.callStatus)
          : "";
      const calendarContext =
        formatCalendarContext(this.contextCalendarEvent);
      const resolvedContext = resolveContext({
        navigation: navigationContext,
        call: callContext,
        calendar: calendarContext,
        sports: this.lastSportsContextContent,
      });

      this.logDiagnostic(
        "context source selected",
        resolvedContext,
      );
      await this.renderContextStrip(
        resolvedContext.content,
      );
    } catch (error) {
      console.error(
        "Failed to refresh context strip:",
        error,
      );
      await this.renderContextStrip("");
    } finally {
      this.contextStripRefreshInFlight =
        false;
    }
  }

  private async updateActiveCallDuration() {
    if (
      this.callStatus?.state !== "connected" &&
      this.callStatus?.state !== "held"
    ) {
      return;
    }

    await this.renderContextStrip(
      this.formatCallContext(
        this.callStatus,
      ),
    );
  }

  private async refreshVisibleView(
    view: HudView,
  ) {
    if (!this.isCardVisible) {
      return;
    }

    const current =
      hudViews[this.currentView];

    if (current.id !== view.id) {
      return;
    }

    const content =
      `${view.title}\n\n${view.body}`;
    const renderEpoch =
      this.renderEpoch;
    const isCurrentRender = () =>
      this.isCardVisible &&
      this.renderEpoch === renderEpoch &&
      hudViews[this.currentView]?.id ===
        view.id;

    /*
     * Don't send the same content to
     * the glasses repeatedly.
     */
    if (
      this.lastRenderedContent[
      view.id
      ] === content
    ) {
      return;
    }

    await this.updateText(
      HUD.cardId,
      "cosmic-card",
      content,
      isCurrentRender,
    );

    if (!isCurrentRender()) {
      return;
    }

    this.lastRenderedContent[
      view.id
    ] = content;

    console.log(
      `LIVE HUD UPDATED: ${view.id}`,
    );
  }
  // --------------------------------------------------
  // TEXT UPDATE
  // --------------------------------------------------

  private async updateText(
    id: number,
    name: string,
    content: string,
    shouldWrite: () => boolean = () => true,
  ) {
    const key = `${id}:${name}`;
    const queue = this.bridgeWrites.get(key) ??
      new LatestWriteQueue(
        async (nextContent) => {
          const startedAt = performance.now();
          this.logDiagnostic(
            "bridge write invoked",
            {
              containerID: id,
              containerName: name,
              content: nextContent,
            },
          );

          const success =
            await this.bridge
              .textContainerUpgrade(
                new TextContainerUpgrade({
                  containerID: id,
                  containerName: name,
                  contentOffset: 0,
                  contentLength: 0,
                  content: nextContent,
                }),
              );

          if (!success) {
            throw new Error(
              `textContainerUpgrade returned false for ${name}`,
            );
          }

          this.logDiagnostic(
            "bridge write resolved",
            {
              containerID: id,
              containerName: name,
              content: nextContent,
              success,
              durationMs: Math.round(
                performance.now() - startedAt,
              ),
            },
          );

          console.log(
            "TEXT UPDATE:",
            {
              name,
              success,
              content: nextContent,
            },
          );
        },
        (type, nextContent, durationMs) => {
          const details = {
            containerID: id,
            containerName: name,
            content: nextContent,
            ...(durationMs === undefined
              ? {}
              : { durationMs: Math.round(durationMs) }),
          };

          if (type === "slow") {
            console.warn("Slow bridge update:", details);
          } else if (type === "timeout") {
            console.error("Timed out bridge update:", details);
          } else if (type === "coalesced") {
            console.warn("Coalesced bridge update:", details);
          } else {
            console.warn("Discarded stale bridge update:", details);
          }
        },
      );

    this.bridgeWrites.set(key, queue);
    await queue.enqueue(content, shouldWrite);
  }

  // --------------------------------------------------
  // CLOCK
  // --------------------------------------------------

  private getTime() {
    return new Intl.DateTimeFormat(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      },
    ).format(
      new Date(),
    );
  }

  private async updateClock(
    source: "initialize" | "timer",
  ) {
    const now = Date.now();
    this.logDiagnostic(
      "clock update entered",
      {
        source,
        elapsedSincePreviousMs:
          this.lastClockTickAt === null
            ? null
            : now - this.lastClockTickAt,
      },
    );
    this.lastClockTickAt = now;

    if (this.clockUpdateInFlight) {
      this.clockUpdatePending = true;
      this.logDiagnostic(
        "clock update coalesced",
      );
      return;
    }

    this.clockUpdateInFlight = true;

    try {
      const content = this.getTime();

      if (
        content !== this.lastClockContent
      ) {
        this.logDiagnostic(
          "clock content generated",
          { content },
        );

        await this.updateText(
          HUD.timeId,
          "cosmic-time",
          content,
        );

        this.lastClockContent = content;
        this.logDiagnostic(
          "clock update resolved",
          { content },
        );
      }

      await this.updateActiveCallDuration();
    } finally {
      this.clockUpdateInFlight = false;

      if (this.clockUpdatePending) {
        this.clockUpdatePending = false;
        void this.updateClock("timer");
      }
    }
  }

  // --------------------------------------------------
  // NORMAL 8 SECOND DISMISS
  // --------------------------------------------------

  private resetDismissTimer(
  timeoutMs = 10_000,
) {
  if (this.dismissTimer) {
    clearTimeout(
      this.dismissTimer,
    );
  }

  this.dismissTimer =
    setTimeout(() => {
      void this.dismissCard();
    }, timeoutMs);
}

  async dismissCard() {
    this.navigationOperationId += 1;
    this.renderEpoch += 1;

    if (this.dismissTimer) {
      clearTimeout(
        this.dismissTimer,
      );

      this.dismissTimer =
        null;
    }

    this.isCardVisible = false;

    this.activePriority =
      "passive";

    await this.updateText(
      HUD.cardId,
      "cosmic-card",
      "",
    );

    console.log(
      "HUD dismissed",
    );
  }

  // --------------------------------------------------
  // STATIC VIEW
  // --------------------------------------------------

  private async renderCurrentCard() {
    const view =
      hudViews[
      this.currentView
      ];

    this.isCardVisible = true;

    this.activePriority =
      view.priority;

    const content =
      `${view.title}\n\n${view.body}`;

    await this.updateText(
      HUD.cardId,
      "cosmic-card",
      content,
    );

    this.lastRenderedContent[
      view.id
    ] = content;

    this.resetDismissTimer();
  }

  // --------------------------------------------------
  // DYNAMIC VIEW
  // --------------------------------------------------

  private async renderView(
    view: HudView,
    shouldRender: () => boolean = () => true,
  ) {
    if (!shouldRender()) {
      return;
    }

    this.isCardVisible = true;

    this.activePriority =
      view.priority;

    const content =
      `${view.title}\n\n${view.body}`;

    await this.updateText(
      HUD.cardId,
      "cosmic-card",
      content,
      shouldRender,
    );

    if (!shouldRender()) {
      return;
    }

    this.lastRenderedContent[
      view.id
    ] = content;

    this.resetDismissTimer();
  }
  // --------------------------------------------------
  // CONTEXT PRIORITY
  // --------------------------------------------------

  async showContext(
    view: HudView,
    force = false,
    shouldRender: () => boolean = () => true,
  ) {
    if (!shouldRender()) {
      return;
    }

    if (
      !canReplaceView(
        view,
        this.activePriority,
        this.isCardVisible,
        force,
      )
    ) {
      return;
    }

    const index =
      hudViews.findIndex(
        (item) =>
          item.id ===
          view.id,
      );

    if (index >= 0) {
      this.currentView =
        index;
    }

    await this.renderView(
      view,
      shouldRender,
    );
  }

  // --------------------------------------------------
  // LOAD CURRENT VIEW
  // --------------------------------------------------

  private async loadCurrentView(
    operationId: number,
  ) {
    const view =
      hudViews[
      this.currentView
      ];
    const renderEpoch =
      this.renderEpoch;
    const isCurrentOperation = () =>
      operationId ===
        this.navigationOperationId &&
      renderEpoch === this.renderEpoch;

    if (
      view.id === "calendar"
    ) {
      await this.showContext(
        await this
          .getCalendarCard(),
        true,
        isCurrentOperation,
      );

      return;
    }

    if (
  view.id === "sports"
) {
  const sportsView =
    await this.getSportsCard();

  this.lastSportsContent =
    `${sportsView.title}\n\n${sportsView.body}`;

  await this.showContext(
    sportsView,
    true,
    isCurrentOperation,
  );

  return;
}

    if (
      view.id === "music"
    ) {
      const musicView =
        await this.getMusicCard();

      this.lastMusicContent =
        `${musicView.title}\n\n${musicView.body}`;

      await this.showContext(
        musicView,
        true,
        isCurrentOperation,
      );

      return;
    }

    if (
      view.id === "navigation"
    ) {
      await this.showContext(
        await this
          .getNavigationCard(),
        true,
        isCurrentOperation,
      );

      return;
    }

    if (isCurrentOperation()) {
      await this.renderCurrentCard();
    }
  }

  // --------------------------------------------------
  // MANUAL NAVIGATION
  // --------------------------------------------------

  private async nextCard() {
    const operationId =
      ++this.navigationOperationId;

    if (
      !this.isCardVisible
    ) {
      await this
        .loadCurrentView(operationId);

      return;
    }

    this.currentView =
      (this.currentView +
        1) %
      hudViews.length;

    await this
      .loadCurrentView(operationId);
  }

  private async previousCard() {
    const operationId =
      ++this.navigationOperationId;

    if (
      !this.isCardVisible
    ) {
      await this
        .loadCurrentView(operationId);

      return;
    }

    this.currentView =
      (
        this.currentView -
        1 +
        hudViews.length
      ) %
      hudViews.length;

    await this
      .loadCurrentView(operationId);
  }

  // --------------------------------------------------
  // GLASSES INPUT
  // --------------------------------------------------

  private registerInput() {
    this.bridge
      .onEvenHubEvent(
        (event) => {
          const textEvent =
            event.textEvent;

          if (!textEvent) {
            return;
          }

          switch (
          textEvent.eventType
          ) {
            case OsEventTypeList.SCROLL_TOP_EVENT:
              void this
                .previousCard();

              break;

            case OsEventTypeList.SCROLL_BOTTOM_EVENT:
              void this
                .nextCard();

              break;

            case OsEventTypeList.DOUBLE_CLICK_EVENT:
              void this
                .dismissCard();

              break;
          }
        },
      );
  }
}
