import {
  CreateStartUpPageContainer,
  OsEventTypeList,
  RebuildPageContainer,
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

export class CosmicHudService {
  private bridge:
    Awaited<
      ReturnType<
        typeof waitForEvenAppBridge
      >
    >;

    private statusText = "--°";

private lastCardContent = "";

  private currentView = 0;

  private isCardVisible = false;

  private activePriority:
    HudPriority = "passive";

  private dismissTimer:
    | ReturnType<typeof setTimeout>
    | null = null;

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
        isEventCapture: 1,
      });

    await this.bridge
      .createStartUpPageContainer(
        new CreateStartUpPageContainer(
          {
            containerTotalNum: 3,

            textObject: [
              timeContainer,
              statusContainer,
              cardContainer,
            ],
          },
        ),
      );

    this.registerInput();

    await this.updateClock();
    await this.updateCosmicStatus();

    setInterval(() => {
      void this.updateClock();
    }, 1000);

    setInterval(() => {
      void this.updateCosmicStatus();
    }, 60_000);

    // Start live card refreshes.
    setInterval(() => {
  void this.runLiveRefresh();
}, 2000);

    console.log(
      "Cosmic HUD service initialized",
    );
  }

  // --------------------------------------------------
  // WEATHER
  // --------------------------------------------------

  private async updateCosmicStatus() {
    try {
      const status =
        await getCosmicStatus();

      this.statusText =
  `${Math.round(
    status.weather.temperature,
  )}°\n${status.weather.condition}`;

await this.updateText(
  HUD.statusId,
  "cosmic-status",
  this.statusText,
);
    } catch (error) {
      console.error(
        "Failed to fetch Cosmic status:",
        error,
      );
this.statusText = "--°";
      await this.updateText(
        HUD.statusId,
        "cosmic-status",
        "--°",
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

  // --------------------------------------------------
  // SPORTS
  // --------------------------------------------------

  private async getSportsCard():
    Promise<HudView> {
    try {
      const sports =
        await getCosmicSports();

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
        const awayScore =
          game.awayScore ?? 0;

        const homeScore =
          game.homeScore ?? 0;

        const live =
          game.live;

        const inningText =
          live?.inning &&
          live?.inningHalf
            ? `${live.inningHalf.toUpperCase()} ${live.inning}`
            : "LIVE";

        const outsText =
          live
            ? `${live.outs} OUT${
                live.outs === 1
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
            `${game.awayAbbr} ${awayScore}   ${game.homeAbbr} ${homeScore}`,
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
    const feet =
      meters * 3.28084;

    if (feet <= 80) {
      return "NOW";
    }

    if (feet < 1000) {
      return `${Math.round(
        feet / 10,
      ) * 10} ft`;
    }

    const miles =
      meters / 1609.344;

    if (miles < 0.5) {
      return `${Math.round(
        feet / 50,
      ) * 50} ft`;
    }

    return `${miles.toFixed(
      1,
    )} mi`;
  }

  private getNavigationTitle(
    navigation:
      CosmicNavigationState,
  ) {
    const modifier =
      navigation
        .nextManeuver
        ?.modifier;

    switch (modifier) {
      case "left":
      case "slight left":
      case "sharp left":
        return "TURN LEFT";

      case "right":
      case "slight right":
      case "sharp right":
        return "TURN RIGHT";

      case "straight":
        return "CONTINUE";

      case "uturn":
        return "U-TURN";

      default:
        return "NAVIGATION";
    }
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

    const street =
      maneuver.streetName ||
      maneuver.instruction;

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

    return {
      id: "navigation",

      title:
        this.getNavigationTitle(
          navigation,
        ),

      body: [
        street,
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
  console.log(
    "LIVE TICK:",
    {
      visible:
        this.isCardVisible,
      view:
        hudViews[
          this.currentView
        ]?.id,
    },
  );

  if (!this.isCardVisible) {
    return;
  }

  const current =
    hudViews[this.currentView];

  try {
    switch (current.id) {
      case "music": {
        const view =
          await this.getMusicCard();

        await this.refreshVisibleView(
          view,
        );

        break;
      }

      case "sports": {
        const view =
          await this.getSportsCard();

        await this.refreshVisibleView(
          view,
        );

        break;
      }

      case "calendar": {
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
  }
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

  /*
   * Do nothing if the actual displayed
   * information hasn't changed.
   *
   * This prevents rebuilding the HUD
   * every two seconds for the same song,
   * score, etc.
   */
  if (
    content ===
    this.lastCardContent
  ) {
    return;
  }

  console.log(
    "LIVE CONTENT CHANGED:",
    JSON.stringify(content),
  );

  this.lastCardContent =
    content;

  await this.forceCardRepaint(
    content,
  );

  console.log(
    `LIVE HUD: ${view.id}`,
  );
}

// --------------------------------------------------
// FORCE HUD REPAINT
// --------------------------------------------------

private async forceCardRepaint(
  content: string,
) {
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
      content: this.getTime(),
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
      content:
        this.statusText,
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
      content,
      isEventCapture: 1,
    });

  const rebuilt =
    await this.bridge
      .rebuildPageContainer(
        new RebuildPageContainer({
          containerTotalNum: 3,

          textObject: [
            timeContainer,
            statusContainer,
            cardContainer,
          ],
        }),
      );

  console.log(
    "HUD REBUILD:",
    rebuilt,
  );
}
  // --------------------------------------------------
  // TEXT UPDATE
  // --------------------------------------------------

  private async updateText(
    id: number,
    name: string,
    content: string,
  ) {
    await this.bridge
      .textContainerUpgrade(
        new TextContainerUpgrade(
          {
            containerID: id,
            containerName: name,
            contentOffset: 0,
            contentLength:
              2000,
            content,
          },
        ),
      );
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

  private async updateClock() {
    await this.updateText(
      HUD.timeId,
      "cosmic-time",
      this.getTime(),
    );
  }

  // --------------------------------------------------
  // NORMAL 8 SECOND DISMISS
  // --------------------------------------------------

  private resetDismissTimer() {
  if (this.dismissTimer) {
    clearTimeout(
      this.dismissTimer,
    );

    this.dismissTimer = null;
  }
}

  async dismissCard() {
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

    this.lastCardContent = "";

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

  this.lastCardContent =
    content;

  await this.updateText(
    HUD.cardId,
    "cosmic-card",
    content,
  );

  this.resetDismissTimer();
}

// --------------------------------------------------
// DYNAMIC VIEW
// --------------------------------------------------

private async renderView(
  view: HudView,
) {
  this.isCardVisible = true;

  this.activePriority =
    view.priority;

  const content =
    `${view.title}\n\n${view.body}`;

  this.lastCardContent =
    content;

  await this.updateText(
    HUD.cardId,
    "cosmic-card",
    content,
  );

  this.resetDismissTimer();
}
  // --------------------------------------------------
  // CONTEXT PRIORITY
  // --------------------------------------------------

  async showContext(
    view: HudView,
    force = false,
  ) {
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
    );
  }

  // --------------------------------------------------
  // LOAD CURRENT VIEW
  // --------------------------------------------------

  private async loadCurrentView() {
    const view =
      hudViews[
        this.currentView
      ];

    if (
      view.id === "calendar"
    ) {
      await this.showContext(
        await this
          .getCalendarCard(),
        true,
      );

      return;
    }

    if (
      view.id === "sports"
    ) {
      await this.showContext(
        await this
          .getSportsCard(),
        true,
      );

      return;
    }

    if (
      view.id === "music"
    ) {
      await this.showContext(
        await this
          .getMusicCard(),
        true,
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
      );

      return;
    }

    await this
      .renderCurrentCard();
  }

  // --------------------------------------------------
  // MANUAL NAVIGATION
  // --------------------------------------------------

  private async nextCard() {
    if (
      !this.isCardVisible
    ) {
      await this
        .loadCurrentView();

      return;
    }

    this.currentView =
      (this.currentView +
        1) %
      hudViews.length;

    await this
      .loadCurrentView();
  }

  private async previousCard() {
    if (
      !this.isCardVisible
    ) {
      await this
        .loadCurrentView();

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
      .loadCurrentView();
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