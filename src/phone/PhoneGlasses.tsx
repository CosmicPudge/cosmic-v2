import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  CosmicCalendarEvent,
} from "../glasses/data/calendarClient";
import {
  getNextCalendarEvent,
} from "../glasses/data/calendarClient";
import type {
  CosmicCallStatus,
} from "../glasses/data/callClient";
import {
  getCosmicCallStatus,
} from "../glasses/data/callClient";
import {
  getCosmicNavigation,
} from "../glasses/data/navigationClient";
import type {
  CosmicNavigationResponse,
} from "../glasses/data/navigationClient";
import {
  getCosmicSports,
} from "../glasses/data/sportsClient";
import type {
  CosmicSportsResponse,
} from "../glasses/data/sportsClient";
import {
  getCosmicStatus,
} from "../glasses/data/cosmicClient";
import {
  resolveContext,
} from "../glasses/context/contextResolver";
import {
  formatCalendarContext,
} from "../glasses/hud/calendarContext";
import {
  formatNavigationDistance,
  formatUrgentNavigationContext,
  getNavigationArrow,
  getNavigationManeuverLabel,
  shouldUseLargeNavigationArrow,
} from "../glasses/hud/navigationContext";
import {
  formatSportsContext,
} from "../glasses/hud/sportsContext";
import { HUD } from "../glasses/hud/constants";
import { hudViews } from "../glasses/hud/views";
import {
  logicalStageScale,
  nextFixtureStep,
} from "./phoneModel";
import {
  classifyBackendResults,
  shouldResumePhoneRefresh,
  type PhoneBackendStatus,
} from "./phoneRuntime";
import "./PhoneGlasses.css";

type PreviewMode = "camera" | "black" | "scene";
type DataMode = "real" | "fixture";
type DrawerSection =
  | "display"
  | "data"
  | "navigation"
  | "calendar"
  | "sensors"
  | "input"
  | "diagnostics";

type Calibration = {
  opacity: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  contrast: number;
  darkBacking: boolean;
};

const CALIBRATION_KEY = "cosmic-phone-glasses-calibration";
const NAVIGATION_FIXTURE_STEPS = [
  { label: "0.6 mi", meters: 965.606, modifier: "right" },
  { label: "0.3 mi", meters: 482.803, modifier: "right" },
  { label: "800 ft", meters: 243.84, modifier: "right" },
  { label: "400 ft", meters: 121.92, modifier: "right" },
  { label: "200 ft", meters: 60.96, modifier: "right" },
  { label: "90 ft", meters: 27.432, modifier: "right" },
  { label: "30 ft", meters: 9.144, modifier: "right" },
  { label: "passed", meters: -1, modifier: "right" },
] as const;

const CALENDAR_PRESETS = [
  { label: "20 MIN", minutes: 20 },
  { label: "15 MIN", minutes: 15 },
  { label: "8 MIN", minutes: 8 },
  { label: "5 MIN", minutes: 5 },
  { label: "1 MIN", minutes: 1 },
  { label: "NOW", minutes: 0 },
  { label: "NOW + 3 MIN", minutes: -3 },
  { label: "EXPIRED", minutes: -6 },
] as const;

const DEFAULT_CALIBRATION: Calibration = {
  opacity: 1,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  contrast: 1,
  darkBacking: false,
};

function readCalibration(): Calibration {
  try {
    const saved = localStorage.getItem(CALIBRATION_KEY);
    return saved
      ? { ...DEFAULT_CALIBRATION, ...JSON.parse(saved) }
      : DEFAULT_CALIBRATION;
  } catch {
    return DEFAULT_CALIBRATION;
  }
}

function fixtureNavigation(
  step: number,
  modifier: string,
  streetName: string,
): CosmicNavigationResponse {
  const preset = NAVIGATION_FIXTURE_STEPS[step];
  if (!preset || preset.meters < 0) {
    return { navigation: null };
  }

  return {
    navigation: {
      destination: "Fixture destination",
      etaMinutes: 4,
      distanceMiles: preset.meters / 1609.344,
      traffic: "light",
      arrivalTime: null,
      nextManeuver: {
        instruction: `Turn ${modifier}`,
        type: "turn",
        modifier,
        streetName: streetName.trim() || null,
        distanceMeters: preset.meters,
      },
    },
  };
}

function fixtureCalendar(
  minutes: number,
  title: string,
  location: string,
  allDay: boolean,
  cancelled: boolean,
  baseNow = Date.now(),
): CosmicCalendarEvent {
  const start = new Date(
    baseNow + minutes * 60_000,
  ).toISOString();
  return {
    title,
    start,
    end: new Date(
      Date.parse(start) + 50 * 60_000,
    ).toISOString(),
    location: location || null,
    calendarName: "Phone fixture",
    minutesUntil: minutes,
    allDay,
    cancelled,
  };
}

function fixtureSports(): CosmicSportsResponse {
  return { game: {
    state: "live",
    opponent: "Boston Red Sox",
    gameDate: "2026-09-07T17:35:00.000Z",
    isHome: false,
    awayAbbr: "LAA",
    homeAbbr: "BOS",
    awayScore: 2,
    homeScore: 5,
    status: "In Progress",
    live: {
      inning: 7,
      inningHalf: "top",
      period: null,
      outs: 2,
      balls: 1,
      strikes: 2,
      firstBase: true,
      secondBase: false,
      thirdBase: true,
      batter: null,
      pitcher: null,
      playDescription: null,
    },
  } };
}

function formatCall(call: CosmicCallStatus | null) {
  if (!call || call.state === "idle" || call.state === "ended") {
    return "";
  }

  if (call.state === "ringing") {
    return call.outgoing === false ? "Incoming Call" : "Calling";
  }

  if (call.state === "dialing") {
    return "Calling";
  }

  const connectedAt = call.connectedAt
    ? Date.parse(call.connectedAt)
    : Date.now();
  const elapsed = Math.max(
    0,
    Math.floor((Date.now() - connectedAt) / 1000),
  );
  return `${call.state === "held" ? "Call Held" : "Active Call"} • ${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
}

function fixtureCallStatus(now: number): CosmicCallStatus {
  return {
    state: "connected",
    callId: "phone-fixture",
    outgoing: false,
    connectedAt: new Date(now - 42_000).toISOString(),
    observedAt: new Date(now).toISOString(),
    sequence: 1,
    deviceId: "phone-fixture",
    sessionId: "phone-fixture",
    expiresAt: new Date(now + 60_000).toISOString(),
  };
}

function cardForNavigation(
  response: CosmicNavigationResponse | null,
) {
  const maneuver = response?.navigation?.nextManeuver;
  if (!maneuver) return null;

  const arrow = getNavigationArrow(
    maneuver.type,
    maneuver.modifier,
  );
  const distance = formatNavigationDistance(
    maneuver.distanceMeters,
  );
  const street = maneuver.streetName?.trim();

  if (arrow && shouldUseLargeNavigationArrow(
    maneuver.distanceMeters,
    maneuver.type,
    maneuver.modifier,
  )) {
    return {
      title: arrow,
      body: [
        maneuver.type.toLowerCase().includes("arriv")
          ? "ARRIVE"
          : distance,
        street,
      ].filter(Boolean).join("\n"),
    };
  }

  return {
    title: getNavigationManeuverLabel(
      maneuver.type,
      maneuver.modifier,
    ),
    body: [street || maneuver.instruction, distance]
      .filter(Boolean)
      .join("\n"),
  };
}

export function PhoneGlasses() {
  const [mode, setMode] = useState<PreviewMode>("black");
  const [dataMode, setDataMode] = useState<DataMode>("real");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [section, setSection] = useState<DrawerSection>("display");
  const [calibration, setCalibration] = useState(readCalibration);
  const [now, setNow] = useState(() => Date.now());
  const [navigation, setNavigation] = useState<CosmicNavigationResponse | null>(null);
  const [calendar, setCalendar] = useState<CosmicCalendarEvent | null>(null);
  const [sports, setSports] = useState<CosmicSportsResponse | null>(null);
  const [call, setCall] = useState<CosmicCallStatus | null>(null);
  const [weather, setWeather] = useState("--°");
  const [fixtureStep, setFixtureStep] = useState(2);
  const [fixtureModifier, setFixtureModifier] = useState("right");
  const [fixtureStreet, setFixtureStreet] = useState("400 N");
  const [fixtureCalendarMinutes, setFixtureCalendarMinutes] = useState(8);
  const [fixtureCalendarAnchor, setFixtureCalendarAnchor] = useState(() => Date.now());
  const [fixtureTitle, setFixtureTitle] = useState("ENGR 1010");
  const [fixtureLocation, setFixtureLocation] = useState("ENGR BLDG 105");
  const [fixtureAllDay, setFixtureAllDay] = useState(false);
  const [fixtureCancelled, setFixtureCancelled] = useState(false);
  const [fixtureCall, setFixtureCall] = useState(false);
  const [autoApproach, setAutoApproach] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("off");
  const [locationStatus, setLocationStatus] = useState("off");
  const [headingStatus, setHeadingStatus] = useState("unavailable");
  const [heading, setHeading] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState("never");
  const [renderCount, setRenderCount] = useState(0);
  const [timerCadence, setTimerCadence] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("ready");
  const [inputCardIndex, setInputCardIndex] = useState(0);
  const [inputCardVisible, setInputCardVisible] = useState(false);
  const [backendStatus, setBackendStatus] = useState<PhoneBackendStatus>("unknown");
  const [showBounds, setShowBounds] = useState(false);
  const [showContainers, setShowContainers] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const [stageScale, setStageScale] = useState(1);
  const streamRef = useRef<MediaStream | null>(null);
  const locationWatchRef = useRef<number | null>(null);
  const headingListenerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const updateCalibration = useCallback((patch: Partial<Calibration>) => {
    setCalibration((current) => {
      const next = { ...current, ...patch };
      localStorage.setItem(CALIBRATION_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const tick = performance.now();
      setNow(Date.now());
      setRenderCount((count) => count + 1);
      setLastUpdate(new Date().toLocaleTimeString());
      setTimerCadence((previous) => {
        const prior = lastTickRef.current;
        lastTickRef.current = tick;
        return prior === null ? previous : Math.round(tick - prior);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const node = stageShellRef.current;
    if (!node) return;
    const resize = () => {
      setStageScale(Math.min(
        logicalStageScale(
          node.clientWidth,
          node.clientHeight,
        ),
      ));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dataMode !== "real") return;
    let stopped = false;
    let timeout: number | undefined;
    let refreshInFlight = false;
    let nextCalendarRefresh = 0;
    let nextStatusRefresh = 0;

    const refresh = async () => {
      if (stopped || document.visibilityState !== "visible" || refreshInFlight) return;
      refreshInFlight = true;
      const nowMs = Date.now();
      const calendarDue = nowMs >= nextCalendarRefresh;
      const statusDue = nowMs >= nextStatusRefresh;
      const results = await Promise.allSettled([
        getCosmicNavigation(),
        getCosmicSports(),
        getCosmicCallStatus(),
        calendarDue ? getNextCalendarEvent() : Promise.resolve(null),
        statusDue ? getCosmicStatus() : Promise.resolve(null),
      ]);
      refreshInFlight = false;
      if (stopped) return;
      setBackendStatus(classifyBackendResults(results));
      const [navigationResult, sportsResult, callResult, calendarResult, statusResult] = results;
      if (navigationResult.status === "fulfilled") {
        setNavigation(navigationResult.value);
      }
      if (sportsResult.status === "fulfilled") {
        setSports(sportsResult.value);
      }
      if (callResult.status === "fulfilled") {
        setCall(callResult.value);
      }
      if (calendarDue) {
        nextCalendarRefresh = Date.now() + 30_000;
        if (calendarResult.status === "fulfilled") {
          setCalendar(calendarResult.value?.nextEvent ?? null);
        }
      }
      if (statusDue) {
        nextStatusRefresh = Date.now() + 60_000;
        if (statusResult.status === "fulfilled" && statusResult.value) {
          setWeather(`${statusResult.value.weather.temperature}°\n${statusResult.value.weather.condition}`);
        }
      }
      setLastUpdate(new Date().toLocaleTimeString());
      timeout = window.setTimeout(() => void refresh(), 2000);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timeout !== undefined) window.clearTimeout(timeout);
        timeout = undefined;
        return;
      }
      if (shouldResumePhoneRefresh(document.visibilityState, refreshInFlight)) {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    void refresh();
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [dataMode]);

  useEffect(() => {
    if (!autoApproach || dataMode !== "fixture") return;
    const timer = window.setInterval(() => {
      setFixtureStep((step) => nextFixtureStep(
        step,
        1,
        NAVIGATION_FIXTURE_STEPS.length,
      ));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [autoApproach, dataMode]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
    }
    if (headingListenerRef.current) {
      window.removeEventListener("deviceorientation", headingListenerRef.current);
    }
  }, []);

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setVideoReady(true);
      setCameraStatus("active");
    } catch (error) {
      setCameraStatus("denied/unavailable");
      setCameraError(error instanceof Error ? error.message : "Camera permission failed");
    }
  };

  const changeMode = (nextMode: PreviewMode) => {
    if (nextMode !== "camera") {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setVideoReady(false);
      setCameraStatus("off");
    } else if (!streamRef.current) {
      setCameraStatus("waiting for Start camera");
    }
    setMode(nextMode);
  };

  const startLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    setLocationStatus("requesting");
    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
    }
    locationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => setLocationStatus(`active ±${Math.round(position.coords.accuracy)}m`),
      () => setLocationStatus("denied/unavailable"),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  };

  const stopLocation = () => {
    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
    setLocationStatus("off");
  };

  const startHeading = async () => {
    const OrientationEvent = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (OrientationEvent?.requestPermission) {
      const permission = await OrientationEvent.requestPermission();
      if (permission !== "granted") {
        setHeadingStatus("denied");
        return;
      }
    }
    const listener = (event: DeviceOrientationEvent) => {
      if (typeof event.alpha === "number") setHeading(event.alpha);
    };
    if (headingListenerRef.current) {
      window.removeEventListener("deviceorientation", headingListenerRef.current);
    }
    headingListenerRef.current = listener;
    window.addEventListener("deviceorientation", listener);
    setHeadingStatus("active");
  };

  const stopHeading = () => {
    if (headingListenerRef.current) {
      window.removeEventListener("deviceorientation", headingListenerRef.current);
      headingListenerRef.current = null;
    }
    setHeadingStatus("off");
    setHeading(null);
  };

  const fixtureNavigationResponse = dataMode === "fixture"
    ? fixtureNavigation(fixtureStep, fixtureModifier, fixtureStreet)
    : navigation;
  const fixtureCalendarEvent = dataMode === "fixture"
    ? fixtureCalendar(
      fixtureCalendarMinutes,
      fixtureTitle,
      fixtureLocation,
      fixtureAllDay,
      fixtureCancelled,
      fixtureCalendarAnchor,
    )
    : calendar;
  const calendarText = formatCalendarContext(fixtureCalendarEvent, now);
  const navigationText = formatUrgentNavigationContext(
    fixtureNavigationResponse ?? { navigation: null },
  );
  const callText = dataMode === "fixture"
    ? formatCall(fixtureCall ? fixtureCallStatus(now) : null)
    : formatCall(call);
  const sportsText = dataMode === "fixture"
    ? formatSportsContext(fixtureSports())
    : formatSportsContext(sports ?? { game: null });
  const resolved = resolveContext({
    navigation: navigationText,
    call: callText,
    calendar: calendarText,
    sports: sportsText,
  });
  const cardNavigation = cardForNavigation(fixtureNavigationResponse);
  const card = resolved.source === "navigation"
    ? cardNavigation
      : resolved.source === "calendar"
        ? { title: "CALENDAR", body: calendarText }
        : null;
  const inputCard = inputCardVisible
    ? hudViews[inputCardIndex]
    : null;
  const renderedCard = inputCard ?? card;
  const timeText = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
  const visibleContainers = [
    { id: HUD.timeId, name: "cosmic-time", x: 10, y: 8, width: 200, height: 40, content: timeText },
    { id: HUD.statusId, name: "cosmic-status", x: 410, y: 8, width: 156, height: 60, content: weather },
    { id: HUD.contextId, name: "cosmic-context", x: 188, y: 8, width: 200, height: 60, content: resolved.content },
    { id: HUD.cardId, name: "cosmic-card", x: 120, y: 95, width: 336, height: 150, content: renderedCard ? `${renderedCard.title}\n\n${renderedCard.body}` : "" },
  ];

  const backendMessage = dataMode !== "real"
    ? ""
    : backendStatus === "unauthenticated"
      ? "NOT AUTHENTICATED — sign in to use REAL mode"
      : backendStatus === "unavailable"
        ? "BACKEND UNAVAILABLE — use FIXTURE mode"
        : backendStatus === "unknown"
          ? "CONNECTING TO COSMIC…"
          : "";

  const openSection = (next: DrawerSection) => {
    setSection((current) => current === next ? current : next);
  };

  return (
    <main className={`phone-app mode-${mode}`}>
      <video ref={videoRef} className={`camera-video ${videoReady ? "visible" : ""}`} playsInline muted />
      <div className="scene-backdrop" aria-hidden="true">
        <div className="scene-sky" />
        <div className="scene-road" />
        <div className="scene-lane scene-lane-left" />
        <div className="scene-lane scene-lane-right" />
      </div>
      <div className="phone-toolbar">
        <span>Cosmic Glasses · {dataMode.toUpperCase()}</span>
        <button className="settings-button" type="button" onClick={() => setDrawerOpen(true)} aria-label="Open phone preview settings">⚙</button>
      </div>
      {backendMessage && <div className="backend-banner" role="status">{backendMessage}</div>}
      <div className="phone-preview-area">
        <div ref={stageShellRef} className={`stage-shell ${showBounds ? "show-stage-bounds" : ""}`}>
          <div
            className={`hud-stage ${calibration.darkBacking ? "dark-backing" : ""} ${showContainers ? "show-container-bounds" : ""}`}
            style={{
              opacity: calibration.opacity,
              filter: `contrast(${calibration.contrast})`,
              transform: `translate(${calibration.offsetX}px, ${calibration.offsetY}px) scale(${stageScale * calibration.scale})`,
            }}
          >
            {visibleContainers.map((container) => (
              <div
                key={container.name}
                className={`hud-container hud-${container.name}`}
                style={{ left: container.x, top: container.y, width: container.width, height: container.height }}
                data-container-id={container.id}
              >
                {container.content.split("\n").map((line, index) => <div key={`${container.name}-${index}`}>{line || "\u00a0"}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="phone-statusline">
        <span>Context: {resolved.source}</span>
        <span>{cameraStatus === "active" ? "CAMERA" : mode.toUpperCase()}</span>
      </div>
      {drawerOpen && (
        <aside className="developer-drawer">
          <div className="drawer-header"><strong>PHONE GLASSES LAB</strong><button type="button" onClick={() => setDrawerOpen(false)}>Close</button></div>
          <nav className="drawer-tabs" aria-label="Developer sections">
            {(["display", "data", "navigation", "calendar", "sensors", "input", "diagnostics"] as DrawerSection[]).map((item) => (
              <button key={item} type="button" className={section === item ? "selected" : ""} onClick={() => openSection(item)}>{item}</button>
            ))}
          </nav>
          <div className="drawer-content">
            {section === "display" && <>
              <h2>Display</h2>
              <div className="mode-buttons">{(["camera", "black", "scene"] as PreviewMode[]).map((item) => <button key={item} type="button" className={mode === item ? "selected" : ""} onClick={() => changeMode(item)}>{item.toUpperCase()}</button>)}</div>
              {mode === "camera" && <button type="button" onClick={() => void startCamera()}>Start camera</button>}
              {cameraError && <p className="error-text">{cameraError}</p>}
              <label>HUD opacity <input type="range" min="0.3" max="1" step="0.05" value={calibration.opacity} onChange={(event) => updateCalibration({ opacity: Number(event.target.value) })} /></label>
              <label>HUD scale <input type="range" min="0.75" max="1.4" step="0.01" value={calibration.scale} onChange={(event) => updateCalibration({ scale: Number(event.target.value) })} /></label>
              <label>Horizontal offset <input type="range" min="-80" max="80" value={calibration.offsetX} onChange={(event) => updateCalibration({ offsetX: Number(event.target.value) })} /></label>
              <label>Vertical offset <input type="range" min="-80" max="80" value={calibration.offsetY} onChange={(event) => updateCalibration({ offsetY: Number(event.target.value) })} /></label>
              <label>Contrast <input type="range" min="0.6" max="1.5" step="0.05" value={calibration.contrast} onChange={(event) => updateCalibration({ contrast: Number(event.target.value) })} /></label>
              <label className="check-row"><input type="checkbox" checked={calibration.darkBacking} onChange={(event) => updateCalibration({ darkBacking: event.target.checked })} /> Dark text backing</label>
              <label className="check-row"><input type="checkbox" checked={showBounds} onChange={(event) => setShowBounds(event.target.checked)} /> Show 576×288 bounds</label>
              <label className="check-row"><input type="checkbox" checked={showContainers} onChange={(event) => setShowContainers(event.target.checked)} /> Show container bounds</label>
              <button type="button" onClick={() => updateCalibration(DEFAULT_CALIBRATION)}>Reset Calibration</button>
            </>}
            {section === "data" && <>
              <h2>Data</h2>
              <div className="mode-buttons"><button type="button" className={dataMode === "real" ? "selected" : ""} onClick={() => setDataMode("real")}>REAL</button><button type="button" className={dataMode === "fixture" ? "selected" : ""} onClick={() => setDataMode("fixture")}>FIXTURE</button></div>
              <p className="hint">Fixture values are local test data and never reach production APIs.</p>
              {dataMode === "fixture" && <button type="button" onClick={() => setFixtureCall((value) => !value)}>{fixtureCall ? "Disable" : "Enable"} call fixture</button>}
              <p>Backend: {dataMode === "real" ? "existing Cosmic clients" : "not used"}</p>
            </>}
            {section === "navigation" && <>
              <h2>Navigation fixture lab</h2>
              <p className="hint">Fixture-only. Current step: {NAVIGATION_FIXTURE_STEPS[fixtureStep]?.label}</p>
              <label>Maneuver <select value={fixtureModifier} onChange={(event) => setFixtureModifier(event.target.value)}>{["straight", "slight left", "left", "sharp left", "slight right", "right", "sharp right", "uturn"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Road name <input value={fixtureStreet} onChange={(event) => setFixtureStreet(event.target.value)} placeholder="Optional real-looking fixture" /></label>
              <div className="step-buttons"><button type="button" onClick={() => setFixtureStep((step) => nextFixtureStep(step, -1, NAVIGATION_FIXTURE_STEPS.length))}>Previous step</button><button type="button" onClick={() => setFixtureStep((step) => nextFixtureStep(step, 1, NAVIGATION_FIXTURE_STEPS.length))}>Next step</button></div>
              <div className="step-buttons"><button type="button" onClick={() => setAutoApproach((value) => !value)}>{autoApproach ? "Stop approach" : "Auto approach"}</button><button type="button" onClick={() => { setAutoApproach(false); setFixtureStep(NAVIGATION_FIXTURE_STEPS.length - 1); }}>Pass maneuver</button></div>
              <p>Arrow: {getNavigationArrow("turn", fixtureModifier) ?? "text fallback"}</p>
            </>}
            {section === "calendar" && <>
              <h2>Calendar fixture lab</h2>
              <p className="hint">Countdown is recalculated from Date.now().</p>
              <div className="preset-grid">{CALENDAR_PRESETS.map((preset) => <button key={preset.label} type="button" onClick={() => { setFixtureCalendarMinutes(preset.minutes); setFixtureCalendarAnchor(Date.now()); }}>{preset.label}</button>)}</div>
              <label>Title <input value={fixtureTitle} onChange={(event) => setFixtureTitle(event.target.value)} /></label>
              <label>Location <input value={fixtureLocation} onChange={(event) => setFixtureLocation(event.target.value)} /></label>
              <label className="check-row"><input type="checkbox" checked={fixtureAllDay} onChange={(event) => setFixtureAllDay(event.target.checked)} /> All-day</label>
              <label className="check-row"><input type="checkbox" checked={fixtureCancelled} onChange={(event) => setFixtureCancelled(event.target.checked)} /> Cancelled</label>
            </>}
            {section === "sensors" && <>
              <h2>Sensors</h2>
              <div className="step-buttons"><button type="button" onClick={startLocation}>Start real location</button><button type="button" onClick={stopLocation}>Stop location</button></div><p>Location: {locationStatus}</p>
              <div className="step-buttons"><button type="button" onClick={() => void startHeading()}>Start heading diagnostics</button><button type="button" onClick={stopHeading}>Stop heading</button></div><p>Heading: {heading === null ? "—" : `${Math.round(heading)}°`} · {headingStatus}</p>
              <p className="hint">Heading never rotates arrows because the navigation API provides no maneuver bearing.</p>
            </>}
            {section === "input" && <>
              <h2>Input emulation</h2>
              <div className="step-buttons"><button type="button" onClick={() => { setInputCardVisible(true); setInputCardIndex((index) => (index - 1 + hudViews.length) % hudViews.length); setInputMessage("previous"); }}>Previous</button><button type="button" onClick={() => { setInputCardVisible(true); setInputCardIndex((index) => (index + 1) % hudViews.length); setInputMessage("next"); }}>Next</button><button type="button" onClick={() => { setInputCardVisible(true); setInputMessage("select"); }}>Select</button><button type="button" onClick={() => { setInputCardVisible(false); setInputMessage("dismiss"); }}>Back / dismiss</button></div>
              <p>Last input: {inputMessage}</p>
            </>}
            {section === "diagnostics" && <>
              <h2>Diagnostics</h2>
              <dl><dt>Current time</dt><dd>{new Date(now).toLocaleTimeString()}</dd><dt>Visibility</dt><dd>{document.visibilityState}</dd><dt>Timer cadence</dt><dd>{timerCadence === null ? "—" : `${timerCadence} ms`}</dd><dt>Backend</dt><dd>{backendStatus}</dd><dt>Context source</dt><dd>{resolved.source}</dd><dt>Last HUD update</dt><dd>{lastUpdate}</dd><dt>Phone render count</dt><dd>{renderCount}</dd><dt>Camera</dt><dd>{cameraStatus}</dd><dt>Location</dt><dd>{locationStatus}</dd><dt>Heading</dt><dd>{headingStatus}</dd></dl>
            </>}
          </div>
        </aside>
      )}
    </main>
  );
}
