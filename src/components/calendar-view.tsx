'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import {
  calendarWeek,
  calendarEntries,
  layoutDay,
  shiftCalendarDate,
  type WeekData,
  type PositionedEntry,
} from '@/lib/calendar';
import { chicagoDate, dateLabel, timeLabel } from '@/lib/dates';
import { mergeLastGood } from '@/lib/live-data';
import type { DraftPreview } from '@/lib/web-planner';
const hourHeight = 64;
const shortDate = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    ...options,
  }).format(new Date(date + 'T12:00:00Z'));
export function CalendarView({
  date,
  onDate,
  preview,
  refreshVersion,
  onPlan,
  onTask,
}: {
  date: string;
  onDate: (date: string) => void;
  preview: DraftPreview | null;
  refreshVersion: number;
  onPlan: () => void;
  onTask: (id: string) => void;
}) {
  const [mode, setMode] = useState<'day' | 'week'>('week');
  useEffect(() => {
    const media = window.matchMedia('(max-width:760px)');
    const apply = () => {
      if (media.matches) setMode('day');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);
  const [week, setWeek] = useState<WeekData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PositionedEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(
    () => setSelected((old) => (old?.date === date ? old : null)),
    [date],
  );
  const dates = calendarWeek(date);
  const start = dates[0];
  useEffect(() => {
    let active = true;
    let inFlight = false;
    let hasSnapshot = week?.start === start;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSelected(null);
    setWeek((old) => (old?.start === start ? old : null));
    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      try {
        const response = await fetch(`/api/calendar?date=${start}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            'Calendar could not refresh. Showing the last available schedule.',
          );
        const data: WeekData = await response.json();
        if (data.start !== start || data.days.length !== 7)
          throw new Error('Invalid calendar response.');
        if (active) {
          hasSnapshot = true;
          setWeek((old) => ({
            start,
            days: data.days.map((day) =>
              mergeLastGood(
                old?.start === start
                  ? (old.days.find((d) => d.date === day.date) ?? null)
                  : null,
                day,
              ),
            ),
          }));
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (active) {
          setError(
            hasSnapshot
              ? 'Calendar could not refresh. Showing the last available schedule; retrying automatically.'
              : 'Calendar could not load. Check your local connection; retrying automatically.',
          );
          setLoading(false);
        }
      } finally {
        inFlight = false;
      }
    }
    void refresh();
    const timer = setInterval(refresh, 3000);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [start, refreshVersion]);
  const activePreview = preview?.plan.date === date ? preview : null;
  const entries = useMemo(
    () => calendarEntries(week?.days ?? [], activePreview?.plan),
    [week, activePreview],
  );
  const shown = mode === 'day' ? [date] : dates;
  const positioned = shown.map((day) => ({
    date: day,
    events: layoutDay(entries.filter((e) => e.date === day)),
  }));
  const allEvents = positioned.flatMap((d) => d.events);
  const startHour = Math.max(
    0,
    Math.min(8, ...allEvents.map((e) => Math.floor(e.startMinute / 60))),
  );
  const endHour = Math.min(
    24,
    Math.max(20, ...allEvents.map((e) => Math.ceil(e.endMinute / 60))),
  );
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );
  const warnings = Array.from(
    new Set((week?.days ?? []).flatMap((d) => d.warnings)),
  ).filter((w) => !w.includes('No confirmed'));
  const today = chicagoDate();
  const hasConflicts = allEvents.some((e) => e.conflict);
  const selectedDay = week?.days.find((d) => d.date === date);
  const deadlines = [
    ...(selectedDay?.academic?.tasks ?? []),
    ...(selectedDay?.jobs?.tasks ?? []),
  ].filter((task) => chicagoDate(new Date(task.due)) === date);
  useEffect(() => {
    if (scroll.current) {
      scroll.current.scrollTop = Math.max(
        0,
        (((mode === 'day' && allEvents.length
          ? Math.max(
              9 * 60,
              Math.min(...allEvents.map((e) => e.startMinute)) - 60,
            )
          : 9 * 60) -
          startHour * 60) /
          60) *
          hourHeight -
          20,
      );
    }
  }, [start, mode, startHour, week?.start, date, activePreview?.id]);
  return (
    <section className="calendar-workbench" aria-label="Schedule calendar">
      <div className="calendar-toolbar">
        <div className="calendar-navigation">
          <button className="cal-today" onClick={() => onDate(today)}>
            Today
          </button>
          <button
            className="icon-btn"
            aria-label={mode === 'week' ? 'Previous week' : 'Previous day'}
            onClick={() =>
              onDate(shiftCalendarDate(date, mode === 'week' ? -7 : -1))
            }
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-btn"
            aria-label={mode === 'week' ? 'Next week' : 'Next day'}
            onClick={() =>
              onDate(shiftCalendarDate(date, mode === 'week' ? 7 : 1))
            }
          >
            <ChevronRight size={18} />
          </button>
          <h2>
            {mode === 'day'
              ? shortDate(date, { month: 'short', day: 'numeric' })
              : `${shortDate(dates[0], { month: 'short', day: 'numeric' })} – ${shortDate(dates[6], { month: 'short', day: 'numeric' })}`}
          </h2>
        </div>
        <div className="calendar-view-switch" aria-label="Calendar view">
          {(['day', 'week'] as const).map((value) => (
            <button
              key={value}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {value === 'day' ? 'Day' : 'Week'}
            </button>
          ))}
        </div>
      </div>
      <div className="calendar-key">
        <span className="cal-key class">Classes</span>
        <span className="cal-key interview">Interviews</span>
        <span className="cal-key task">Focus time</span>
        <span className="cal-timezone">Chicago time</span>
      </div>
      {error && (
        <p className="calendar-notice" role="status">
          <TriangleAlert size={15} />
          {error}
        </p>
      )}
      {warnings.length > 0 && (
        <details className="calendar-data-warning">
          <summary>
            {warnings.length} data warning{warnings.length > 1 ? 's' : ''}
          </summary>
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </details>
      )}
      {!activePreview && selectedDay?.plan && (
        <div className="calendar-confirmed-note">
          <span>Confirmed plan</span>
          <strong>{selectedDay.plan.summary}</strong>
        </div>
      )}
      {activePreview && (
        <div className="calendar-draft-note" role="status">
          <Sparkles size={15} />
          <span>
            <strong>Previewing your proposed day.</strong> Dashed focus blocks
            aren’t saved yet.
          </span>
        </div>
      )}
      {hasConflicts && (
        <p className="calendar-conflict-note" role="status">
          <TriangleAlert size={14} />
          Overlapping commitments are shown side by side.
        </p>
      )}
      {deadlines.length > 0 && (
        <div className="calendar-deadlines">
          <span>Due {shortDate(date, { weekday: 'short' })}</span>
          {deadlines.map((task) => (
            <button key={task.id} onClick={() => onTask(task.id)}>
              {task.title}
              <span>{timeLabel(task.due)}</span>
            </button>
          ))}
        </div>
      )}
      {loading && !week ? (
        <div className="calendar-loading" role="status">
          <Loader2 size={20} className="spin" />
          Loading your week…
        </div>
      ) : (
        <div
          className={`calendar-scroll ${mode}`}
          ref={scroll}
          tabIndex={0}
          aria-label="Scrollable calendar timetable"
        >
          <div
            className="calendar-grid"
            style={{
              gridTemplateColumns: `48px repeat(${shown.length},minmax(${mode === 'week' ? '84' : '180'}px,1fr))`,
            }}
          >
            <div className="calendar-corner" />
            <div
              className="calendar-day-headers"
              style={{ gridColumn: `2 / span ${shown.length}` }}
            >
              {shown.map((day) => (
                <button
                  key={day}
                  className={`calendar-day-heading ${day === date ? 'selected' : ''} ${day === today ? 'is-today' : ''}`}
                  onClick={() => onDate(day)}
                  aria-label={dateLabel(day)}
                  aria-pressed={day === date}
                >
                  <span>{shortDate(day, { weekday: 'short' })}</span>
                  <strong>{Number(day.slice(-2))}</strong>
                </button>
              ))}
            </div>
            <div
              className="calendar-hours"
              style={{ height: (endHour - startHour) * hourHeight }}
            >
              {hours.map((hour) => (
                <span
                  key={hour}
                  style={{ top: (hour - startHour) * hourHeight }}
                >
                  {hour === 0
                    ? '12 AM'
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? '12 PM'
                        : `${hour - 12} PM`}
                </span>
              ))}
            </div>
            {positioned.map((day) => (
              <div
                key={day.date}
                className={`calendar-day-track ${day.date === date ? 'active-day' : ''}`}
                aria-label={`Events on ${dateLabel(day.date)}`}
                style={{
                  height: (endHour - startHour) * hourHeight,
                  backgroundSize: `100% ${hourHeight}px`,
                }}
              >
                <div
                  className="calendar-lunch"
                  style={{
                    top: (12 - startHour) * hourHeight,
                    height: hourHeight,
                  }}
                >
                  <span>Lunch</span>
                </div>
                {day.events.map((event) => (
                  <button
                    key={event.id}
                    title={`${event.title} · ${timeLabel(event.start)}–${timeLabel(event.end)}`}
                    className={`calendar-event ${event.endMinute - event.startMinute <= 30 ? 'short' : ''} ${event.endMinute - event.startMinute < 25 ? 'tiny' : ''} ${event.lanes > 1 ? 'narrow' : ''} ${event.kind} ${event.draft ? 'draft' : ''} ${event.conflict ? 'conflict' : ''} ${event.status === 'completed' ? 'completed' : ''}`}
                    style={{
                      top:
                        ((event.startMinute - startHour * 60) / 60) *
                          hourHeight +
                        2,
                      height: Math.max(
                        24,
                        ((event.endMinute - event.startMinute) / 60) *
                          hourHeight -
                          4,
                      ),
                      left: `calc(${(event.lane / event.lanes) * 100}% + 3px)`,
                      width: `calc(${100 / event.lanes}% - 6px)`,
                    }}
                    aria-label={`${event.draft ? 'Draft: ' : ''}${event.title}, ${timeLabel(event.start)} to ${timeLabel(event.end)}${event.conflict ? ', overlapping commitment' : ''}`}
                    onClick={() => {
                      onDate(day.date);
                      setSelected(event);
                    }}
                  >
                    <strong>{event.title}</strong>
                    <span>
                      {timeLabel(event.start)}–{timeLabel(event.end)}
                    </span>
                    {event.location && <small>{event.location}</small>}
                    {event.draft && <small>Draft · not saved</small>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {selected && (
        <div className="calendar-event-detail" role="status">
          <div>
            <span>
              {selected.kind === 'task'
                ? 'Focus time'
                : selected.kind === 'class'
                  ? 'Class'
                  : selected.kind === 'interview'
                    ? 'Interview'
                    : 'Break'}
              {selected.draft ? ' · Draft, not saved' : ''}
            </span>
            <strong>{selected.title}</strong>
            <p>
              {dateLabel(selected.date)} · {timeLabel(selected.start)}–
              {timeLabel(selected.end)}
              {selected.location ? ' · ' + selected.location : ''}
            </p>
            {selected.conflict && (
              <p>
                Overlaps another commitment. Fixed events have not been moved.
              </p>
            )}
          </div>
          {selected.kind === 'task' && selected.sourceId && (
            <button
              className="cal-today"
              onClick={() => onTask(selected.sourceId!)}
            >
              Task details
            </button>
          )}
          <button
            className="icon-btn"
            aria-label="Dismiss event details"
            onClick={() => setSelected(null)}
          >
            ×
          </button>
        </div>
      )}
      {!loading && !activePreview && !selectedDay?.plan && (
        <div className="calendar-empty-plan">
          <Clock3 size={16} />
          <span>
            Fixed commitments are shown. Plan the time around them with Codex.
          </span>
          <button onClick={onPlan}>
            Plan my day <Sparkles size={14} />
          </button>
        </div>
      )}
    </section>
  );
}
