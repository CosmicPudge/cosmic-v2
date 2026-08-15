"use client";

import { useEffect, useMemo, useState } from "react";

import type { CalendarEvent } from "@/core/contracts";
import CalendarCreateEventModal from "./CalendarCreateEventModal";
import CalendarEditEventModal from "./CalendarEditEventModal";

interface CalendarRangeResponse {
  events: Array<
    Omit<CalendarEvent, "start" | "end"> & {
      start: string;
      end: string;
    }
  >;
}

type CalendarFilter =
  | "all"
  | "personal"
  | "school"
  | "sports";

function hydrateEvent(
  event: CalendarRangeResponse["events"][number]
): CalendarEvent {
  return {
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  };
}

function formatTime(event: CalendarEvent): string {
  if (event.allDay) {
    return "All day";
  }

  return event.start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeRange(
  event: CalendarEvent
): string {
  if (event.allDay) {
    return "All day";
  }

  const start = event.start.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );

  const end = event.end.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );

  return `${start} – ${end}`;
}

function formatSelectedDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDescription(
  description: string
): string | null {
  const text = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !/^https?:\/\/\S+$/i.test(line)
    )
    .join("\n");

  if (!text) {
    return null;
  }

  return text.length > 800
    ? `${text.slice(0, 800).trimEnd()}…`
    : text;
}

function isSameDay(
  first: Date,
  second: Date
): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function getDayRange(date: Date) {
  const start = new Date(date);

  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
  };
}

function getEventCategory(
  event: CalendarEvent
): Exclude<CalendarFilter, "all"> {
  if (event.category) {
    return event.category;
  }

  const source =
    event.source?.toLowerCase() ?? "";

  const calendar =
    event.calendarName?.toLowerCase() ?? "";

  if (
    source === "subscription"
  ) {
    return "sports";
  }

  if (
    calendar.includes("school") ||
    calendar.includes("canvas")
  ) {
    return "school";
  }

  return "personal";
}

function getSourceLabel(
  event: CalendarEvent
): string {
  if (event.source === "subscription") {
    return "Subscription";
  }

  if (event.source === "apple") {
    return "Apple Calendar";
  }

  return "Calendar";
}

function getSourceStyle(
  event: CalendarEvent
): string {
  if (event.source === "subscription") {
    return "border-violet-300/15 bg-violet-300/6";
  }

  return "border-white/10 bg-white/5";
}

function EventCard({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        w-full
        rounded-2xl
        border
        p-4
        text-left
        transition
        hover:border-white/20
        hover:bg-white/10
        ${getSourceStyle(event)}
      `}
    >
      <div className="flex min-w-0 gap-4">
        <div className="w-24 shrink-0">
          <p className="text-sm font-medium text-white/75">
            {formatTime(event)}
          </p>

          {!event.allDay && (
            <p className="mt-1 text-[11px] text-white/30">
              {event.end.toLocaleTimeString(
                "en-US",
                {
                  hour: "numeric",
                  minute: "2-digit",
                }
              )}
            </p>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="min-w-0 truncate text-base font-semibold text-white">
              {event.title}
            </h3>

            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-white/40">
              {event.source === "subscription"
                ? "Sports"
                : "Personal"}
            </span>
          </div>

          {event.calendarName && (
            <p className="mt-1 text-xs text-white/40">
              {event.calendarName}
            </p>
          )}

          {event.location && (
            <p className="mt-2 truncate text-sm text-white/50">
              {event.location.replace(
                /\n/g,
                " · "
              )}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-white/30">
              {getSourceLabel(event)}
            </span>

            {event.isRecurring && (
              <span className="text-[11px] text-white/30">
                • Recurring
              </span>
            )}

            {event.allDay && (
              <span className="text-[11px] text-white/30">
                • All day
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function EventDetails({
  event,
  onClose,
  onChanged,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const description = event.description
    ? formatDescription(event.description)
    : null;

  async function deleteEvent() {
    if (!event.writeId) return;
    setDeleting(true);
    setWriteError(null);
    try {
      const response = await fetch(`/api/calendar/events/${event.writeId}`, { method: "DELETE" });
      if (!response.ok) {
        const data: { error?: string } = await response.json();
        throw new Error(data.error ?? "Unable to delete the event.");
      }
      onChanged();
      onClose();
    } catch (deleteError) {
      setWriteError(deleteError instanceof Error ? deleteError.message : "Unable to delete the event.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        p-6
        backdrop-blur-md
      "
      onMouseDown={onClose}
    >
      <div
        className="
          w-full
          max-w-xl
          rounded-3xl
          border
          border-white/10
          bg-[#111114]/95
          p-6
          shadow-2xl
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">
              {event.calendarName ?? "Calendar"}
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              {event.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-3
              py-2
              text-sm
              text-white/60
              transition
              hover:bg-white/10
              hover:text-white
            "
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/30">
              When
            </p>

            <p className="mt-1 text-sm text-white/75">
              {event.start.toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }
              )}
            </p>

            <p className="mt-1 text-sm text-white/50">
              {formatTimeRange(event)}
            </p>
          </div>

          {event.location && (
            <div>
              <p className="text-xs uppercase tracking-widest text-white/30">
                Location
              </p>

              <p className="mt-1 whitespace-pre-line text-sm text-white/60">
                {event.location}
              </p>
            </div>
          )}

          {description && (
            <div>
              <p className="text-xs uppercase tracking-widest text-white/30">
                Description
              </p>

              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-white/60">
                {description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {event.calendarName && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/45">
                {event.calendarName}
              </span>
            )}

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/45">
              {getSourceLabel(event)}
            </span>

            {event.priority && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs capitalize text-white/45">
                {event.priority} priority
              </span>
            )}

            {event.isRecurring && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/45">
                Recurring
              </span>
            )}

            {event.allDay && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/45">
                All day
              </span>
            )}
          </div>

          {event.writable && event.writeId && (
            <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
              <button type="button" onClick={() => setEditing(true)} className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15">Edit</button>
              <button type="button" onClick={() => setConfirmingDelete(true)} className="rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-300/15">Delete</button>
            </div>
          )}

          {writeError && <p className="text-sm text-red-200">{writeError}</p>}
        </div>
      </div>

      {confirmingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onMouseDown={() => setConfirmingDelete(false)}>
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#111114] p-6 shadow-2xl" onMouseDown={(item) => item.stopPropagation()} role="dialog" aria-modal="true" aria-label="Confirm calendar event deletion">
            <h3 className="text-xl font-semibold text-white">Delete Event?</h3>
            <p className="mt-3 text-sm text-white/60">{event.title}<br />{formatSelectedDate(event.start)} · {formatTimeRange(event)}</p>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setConfirmingDelete(false)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">Cancel</button><button type="button" onClick={() => void deleteEvent()} disabled={deleting} className="rounded-xl border border-red-300/20 bg-red-300/15 px-4 py-2 text-sm font-medium text-red-100 disabled:opacity-40">{deleting ? "Deleting…" : "Delete Event"}</button></div>
          </div>
        </div>
      )}

      {editing && <CalendarEditEventModal event={event} onClose={() => setEditing(false)} onSaved={onChanged} />}
    </div>
  );
}

export default function CalendarView() {
  const [selectedDate, setSelectedDate] =
    useState(() => new Date());

  const [events, setEvents] =
    useState<CalendarEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<CalendarFilter>("all");

  const [sourceFilter, setSourceFilter] =
    useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null);

  const [dateSearchOpen, setDateSearchOpen] =
    useState(false);

  const [dateSearchValue, setDateSearchValue] =
    useState(() => formatDateInput(new Date()));

  const [createEventOpen, setCreateEventOpen] =
    useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDay() {
      try {
        setLoading(true);
        setError(null);

        const { start, end } =
  getDayRange(selectedDate);

        const params = new URLSearchParams({
          start: start.toISOString(),
          end: end.toISOString(),
        });

        const response = await fetch(
          `/api/calendar?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Calendar is temporarily unavailable."
          );
        }

        const data: CalendarRangeResponse =
          await response.json();

        if (!cancelled) {
          setEvents(
            data.events.map(hydrateEvent)
          );
        }
      } catch (err) {
        if (!cancelled) {
          setEvents([]);

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load calendar."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDay();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, refreshKey]);

  function goPrevious() {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() - 1);
      return next;
    });
  }

  function goNext() {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }

  function goToday() {
    setSelectedDate(new Date());
  }

  function selectFilter(nextFilter: CalendarFilter) {
    setFilter(nextFilter);
    setSourceFilter((currentSource) => {
      if (
        !currentSource ||
        nextFilter === "all"
      ) {
        return currentSource;
      }

      return events.some(
        (event) =>
          getEventCategory(event) === nextFilter &&
          event.calendarName?.trim() === currentSource
      )
        ? currentSource
        : null;
    });
  }

  function openDateSearch() {
    setDateSearchValue(formatDateInput(selectedDate));
    setDateSearchOpen(true);
  }

  function jumpToDate() {
    if (!dateSearchValue) {
      return;
    }

    const [year, month, day] = dateSearchValue
      .split("-")
      .map(Number);

    setSelectedDate(new Date(year, month - 1, day));
    setDateSearchOpen(false);
  }

  const today = new Date();

  const viewingToday = isSameDay(
    selectedDate,
    today
  );

  const categoryEvents = useMemo(() => {
    if (filter === "all") {
      return events;
    }

    return events.filter(
      (event) =>
        getEventCategory(event) === filter
    );
  }, [events, filter]);

  const sourceOptions = useMemo(
    () =>
      Array.from(
        new Set(
          categoryEvents.flatMap((event) => {
            const calendarName = event.calendarName?.trim();

            return calendarName ? [calendarName] : [];
          })
        )
      ).sort((first, second) =>
        first.localeCompare(second)
      ),
    [categoryEvents]
  );

  const filteredEvents = useMemo(() => {
    if (!sourceFilter) {
      return categoryEvents;
    }

    return categoryEvents.filter(
      (event) =>
        event.calendarName?.trim() === sourceFilter
    );
  }, [categoryEvents, sourceFilter]);

  return (
    <>
      <div className="flex min-h-0 flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
              Calendar
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
              {formatSelectedDate(selectedDate)}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrevious}
              className="
                rounded-xl
                border
                border-white/10
                bg-white/5
                px-3
                py-2
                text-sm
                text-white/60
                transition
                hover:bg-white/10
                hover:text-white
              "
              aria-label="Previous day"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={goToday}
              disabled={viewingToday}
              className="
                rounded-xl
                border
                border-white/10
                bg-white/5
                px-4
                py-2
                text-sm
                text-white/60
                transition
                hover:bg-white/10
                hover:text-white
                disabled:cursor-default
                disabled:opacity-30
              "
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setCreateEventOpen(true)}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              + New Event
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={openDateSearch}
                className="
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  px-4
                  py-2
                  text-sm
                  text-white/60
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
                aria-expanded={dateSearchOpen}
                aria-haspopup="dialog"
              >
                Date Search
              </button>

              {dateSearchOpen && (
                <div
                  className="
                    absolute
                    right-0
                    top-full
                    z-20
                    mt-2
                    w-64
                    rounded-2xl
                    border
                    border-white/15
                    bg-[#111114]/80
                    p-4
                    shadow-2xl
                    backdrop-blur-xl
                  "
                  role="dialog"
                  aria-label="Date search"
                >
                  <label className="block text-xs font-medium text-white/50">
                    Jump to date
                    <input
                      type="date"
                      value={dateSearchValue}
                      onChange={(event) =>
                        setDateSearchValue(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark] outline-none transition focus:border-white/25"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={jumpToDate}
                    disabled={!dateSearchValue}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-default disabled:opacity-30"
                  >
                    Jump to Date
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={goNext}
              className="
                rounded-xl
                border
                border-white/10
                bg-white/5
                px-3
                py-2
                text-sm
                text-white/60
                transition
                hover:bg-white/10
                hover:text-white
              "
              aria-label="Next day"
            >
              ›
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["personal", "Personal"],
              ["school", "School"],
              ["sports", "Sports"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => selectFilter(value)}
              className={`
                rounded-full
                border
                px-4
                py-2
                text-xs
                font-medium
                transition
                ${
                  filter === value
                    ? "border-white/20 bg-white/12 text-white"
                    : "border-white/10 bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/70"
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {sourceOptions.length > 1 && (
          <div className="-mt-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
              Source
            </span>

            <button
              type="button"
              onClick={() => setSourceFilter(null)}
              className={`
                rounded-full
                border
                px-3
                py-1.5
                text-[11px]
                font-medium
                transition
                ${
                  sourceFilter === null
                    ? "border-white/15 bg-white/10 text-white/80"
                    : "border-white/8 bg-white/[0.03] text-white/35 hover:bg-white/8 hover:text-white/60"
                }
              `}
            >
              All
            </button>

            {sourceOptions.map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => setSourceFilter(source)}
                className={`
                  rounded-full
                  border
                  px-3
                  py-1.5
                  text-[11px]
                  font-medium
                  transition
                  ${
                    sourceFilter === source
                      ? "border-white/15 bg-white/10 text-white/80"
                      : "border-white/8 bg-white/[0.03] text-white/35 hover:bg-white/8 hover:text-white/60"
                  }
                `}
              >
                {source}
              </button>
            ))}
          </div>
        )}

        {/* Schedule */}
        <section className="min-h-0">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
              {viewingToday
                ? "Today's Schedule"
                : "Schedule"}
            </h3>

            {!loading && (
              <span className="text-xs text-white/30">
                {filteredEvents.length}{" "}
                {filteredEvents.length === 1
                  ? "event"
                  : "events"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-white/45">
                Loading calendar...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-300/10 bg-red-300/5 p-6">
              <p className="text-sm text-red-200">
                {error}
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <p className="text-white/45">
                {events.length === 0
                  ? "Nothing scheduled for this day."
                  : "No events match this filter."}
              </p>
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() =>
                    setSelectedEvent(event)
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() =>
            setSelectedEvent(null)
          }
          onChanged={() => {
            setRefreshKey((current) => current + 1);
            setSelectedEvent(null);
          }}
        />
      )}

      {createEventOpen && (
        <CalendarCreateEventModal
          selectedDate={selectedDate}
          onClose={() => setCreateEventOpen(false)}
          onCreated={() => setRefreshKey((current) => current + 1)}
        />
      )}
    </>
  );
}
