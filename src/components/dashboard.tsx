'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Columns3,
  GraduationCap,
  ListTodo,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  Timer,
  TriangleAlert,
  X,
} from 'lucide-react';
import { chicagoDate, dateLabel, timeLabel, validDate } from '@/lib/dates';
import { boardTasks, filterTasks, type BoardTask } from '@/lib/board';
import type { TaskState, TaskStatus } from '@/lib/task-state';
import { dailyView } from '@/lib/view';
import { newFocus, startFocus, pauseFocus, focusLabel } from '@/lib/focus';
import { useDashboard } from './use-dashboard';
import { useFocus } from './use-focus';
import { Overlay } from './overlay';
import { PlannerChat } from './planner-chat';
import { CalendarView } from './calendar-view';
import type { DraftPreview } from '@/lib/web-planner';
import { TaskCard } from './task-card';
const DEMO_DATE = '2026-11-10';
const columns = [
  { status: 'todo', label: 'To do', icon: ListTodo },
  { status: 'in_progress', label: 'In progress', icon: Play },
  { status: 'done', label: 'Done', icon: CheckCircle2 },
] as const;
export default function Dashboard() {
  const [date, setDate] = useState(chicagoDate());
  const [workspaceView, setWorkspaceView] = useState<'calendar' | 'tasks'>(
    'calendar',
  );
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [preview, setPreview] = useState<DraftPreview | null>(null);
  const [calendarVersion, setCalendarVersion] = useState(0);
  const assistant = useRef<HTMLElement>(null);
  const savedPlan = useCallback(() => setCalendarVersion((v) => v + 1), []);
  function openAssistant() {
    setAssistantOpen(true);
    requestAnimationFrame(() => {
      assistant.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
      assistant.current
        ?.querySelector<HTMLTextAreaElement>('textarea')
        ?.focus();
    });
  }
  useEffect(() => setPreview(null), [date]);
  const [domain, setDomain] = useState<'all' | 'academic' | 'career'>('all');
  const [query, setQuery] = useState('');
  const [due, setDue] = useState<'all' | 'today' | 'urgent'>('all');
  const [panel, setPanel] = useState<'career' | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<string | null>(null);
  const { data, error, loading, applyTaskState } = useDashboard(date);
  const timer = useFocus();
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('date');
    if (value && validDate(value)) setDate(value);
  }, []);
  const tasks = useMemo(() => (data ? boardTasks(data) : []), [data]);
  const view = data ? dailyView(data) : null;
  const visible = filterTasks(tasks, { query, domain, due, date });
  const completed = tasks.filter((t) => t.status === 'done').length;
  const focusTask =
    tasks.find((t) => t.id === timer.state.taskId && t.status !== 'done') ??
    tasks.find((t) => t.status === 'in_progress') ??
    tasks.find((t) => t.status === 'todo' && t.priority) ??
    tasks.find((t) => t.status === 'todo');
  const currentDetail = tasks.find((t) => t.id === detailId);
  const timerMatches = focusTask?.id === timer.state.taskId;
  const remaining = timerMatches ? timer.remaining : 1500000;
  const running = timerMatches && timer.state.endsAt !== null && remaining > 0;
  const clock = focusLabel(remaining);
  const demo = date !== chicagoDate();
  function changeDate(value: string) {
    if (!validDate(value)) return;
    setDate(value);
    const url = new URL(window.location.href);
    if (value === chicagoDate()) url.searchParams.delete('date');
    else url.searchParams.set('date', value);
    window.history.replaceState({}, '', url);
  }
  async function move(id: string, status: TaskStatus) {
    if (saving) return false;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? 'Progress could not be saved.');
      applyTaskState(body as TaskState);
      setNotice(
        `${tasks.find((t) => t.id === id)?.title ?? 'Task'} moved to ${columns.find((c) => c.status === status)?.label}.`,
      );
      if (status === 'done' && timer.state.taskId === id)
        timer.update(newFocus());
      return true;
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : 'Could not save task progress.',
      );
      return false;
    } finally {
      setSaving(false);
    }
  }
  async function beginFocus(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === 'todo' && !(await move(id, 'in_progress'))) return;
    const state = timer.state.taskId === id ? timer.state : newFocus(id);
    timer.update(startFocus(state, Date.now()));
  }
  function toggleTimer() {
    if (!focusTask) return;
    if (running) timer.update(pauseFocus(timer.state, Date.now()));
    else void beginFocus(focusTask.id);
  }
  const fixed = [
    ...(data?.academic?.events ?? []),
    ...(data?.jobs?.interviews ?? []),
  ]
    .filter((e) => chicagoDate(new Date(e.start)) >= date)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const nextEvent = fixed[0];
  return (
    <div
      className={`app-shell calendar-layout ${workspaceView === 'calendar' ? 'calendar-mode' : ''} ${assistantOpen ? 'with-assistant' : ''}`}
    >
      <a href="#main" className="skip-link">
        Skip to task board
      </a>
      <aside className="icon-rail">
        <a href="/" className="app-logo" aria-label="LifeHarness home">
          <Activity size={30} />
        </a>
        <nav aria-label="Workspace">
          <button
            className={domain === 'all' ? 'rail-button active' : 'rail-button'}
            aria-label="All tasks board"
            onClick={() => {
              setWorkspaceView('tasks');
              setDomain('all');
            }}
          >
            <Columns3 size={25} />
          </button>
          <button
            className="rail-button"
            aria-label="Open schedule"
            onClick={() => setWorkspaceView('calendar')}
          >
            <CalendarDays size={25} />
          </button>
          <button
            className={
              domain === 'academic' ? 'rail-button active' : 'rail-button'
            }
            aria-label="Coursework board"
            onClick={() => setDomain('academic')}
          >
            <GraduationCap size={26} />
          </button>
          <button
            className={
              domain === 'career' ? 'rail-button active' : 'rail-button'
            }
            aria-label="Open job tracker"
            onClick={() => {
              setDomain('career');
              setPanel('career');
            }}
          >
            <BriefcaseBusiness size={25} />
          </button>
        </nav>
        <button
          className="rail-button rail-bottom"
          aria-label="Open planning assistant"
          onClick={openAssistant}
        >
          <Sparkles size={23} />
        </button>
      </aside>
      <div className="board-workspace">
        <header className="workspace-header">
          <a className="wordmark" href="/">
            LifeHarness<span>.</span>
          </a>
          <nav className="workspace-tabs" aria-label="Workspace views">
            <button
              aria-pressed={workspaceView === 'calendar'}
              onClick={() => setWorkspaceView('calendar')}
            >
              <CalendarDays size={16} />
              Calendar
            </button>
            <button
              aria-pressed={workspaceView === 'tasks'}
              onClick={() => setWorkspaceView('tasks')}
            >
              <Columns3 size={16} />
              Tasks
            </button>
          </nav>
          <button
            className="workspace-career"
            onClick={() => setPanel('career')}
          >
            <BriefcaseBusiness size={16} />
            Career
          </button>
        </header>
        <main id="main" className="board-main">
          <section className="board-heading">
            <div>
              <p className="section-kicker">
                {workspaceView === 'calendar'
                  ? 'MAKE ROOM FOR WHAT MATTERS'
                  : 'ONE STEP AT A TIME'}
              </p>
              <div className="title-row">
                <h1>
                  {workspaceView === 'calendar'
                    ? 'Your calendar'
                    : 'Task board'}
                </h1>
                <label className="board-date">
                  <CalendarDays size={22} />
                  <input
                    aria-label="Planning date"
                    type="date"
                    value={date}
                    onChange={(e) => changeDate(e.target.value)}
                  />
                </label>
                {demo && <span className="demo-label">Demo</span>}
              </div>
              <div className="heading-subline">
                <strong>
                  {workspaceView === 'calendar'
                    ? 'A clearer picture of your time.'
                    : 'One task at a time.'}
                </strong>
                <span>
                  {completed} / {tasks.length} completed
                </span>
              </div>
            </div>
            <button
              className="primary-btn plan-button"
              onClick={() => {
                openAssistant();
              }}
            >
              <Sparkles size={21} />
              Plan with Codex
            </button>
          </section>
          <div className="board-meta-line">
            <div className="date-shortcuts">
              <button
                onClick={() => changeDate(chicagoDate())}
                aria-pressed={!demo}
              >
                Today
              </button>
              <button
                onClick={() => changeDate(DEMO_DATE)}
                aria-pressed={date === DEMO_DATE}
              >
                Sample day
              </button>
            </div>
            <span className={`plan-state ${data?.plan ? 'confirmed' : ''}`}>
              {data?.plan ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Plan confirmed</span>
                  <span className="checkin-time">
                    {timeLabel(data.plan.confirmedAt)}
                  </span>
                </>
              ) : (
                <>
                  <Clock3 size={14} />
                  <span>No confirmed plan</span>
                </>
              )}
            </span>
            <span className="save-state">
              <ShieldCheck size={14} />
              {saving ? 'Saving…' : 'Saved locally'}
            </span>
          </div>
          {error && (
            <div className="notice warning" role="status">
              <TriangleAlert size={18} />
              {error}
            </div>
          )}
          {saveError && (
            <div className="notice warning" role="alert">
              <TriangleAlert size={18} />
              {saveError}
            </div>
          )}
          {data?.warnings.map((w) => (
            <div key={w} className="notice warning" role="status">
              <TriangleAlert size={18} />
              {w}
            </div>
          ))}
          <div className="sr-only" aria-live="polite">
            {notice}
          </div>
          {workspaceView === 'calendar' ? (
            <CalendarView
              date={date}
              onDate={changeDate}
              preview={preview}
              refreshVersion={calendarVersion}
              onPlan={openAssistant}
              onTask={setDetailId}
            />
          ) : (
            <>
              <section
                className={`focus-strip ${!focusTask ? 'empty-focus' : ''}`}
                aria-label="Focus timer"
              >
                <div className="focus-copy">
                  <Target size={25} />
                  <span className="focus-label">FOCUS NOW</span>
                  <span className="focus-dash">—</span>
                  <div className="focus-task">
                    <strong>
                      {focusTask?.title ??
                        (loading
                          ? 'Loading your tasks…'
                          : 'You’re all caught up.')}
                    </strong>
                    {focusTask && (
                      <span>
                        {focusTask.durationMinutes} min <span>·</span>{' '}
                        {chicagoDate(new Date(focusTask.due)) <= date
                          ? 'Due ' +
                            (chicagoDate(new Date(focusTask.due)) === date
                              ? 'today · ' + timeLabel(focusTask.due)
                              : 'earlier')
                          : new Intl.DateTimeFormat('en-US', {
                              timeZone: 'America/Chicago',
                              month: 'short',
                              day: 'numeric',
                            }).format(new Date(focusTask.due))}
                      </span>
                    )}
                  </div>
                </div>
                <div className="timer-controls">
                  <div className="timer-display">
                    <Timer size={21} />
                    <span data-testid="focus-clock">{clock}</span>
                  </div>
                  <button
                    className="primary-btn focus-start"
                    disabled={!focusTask || saving}
                    onClick={toggleTimer}
                  >
                    {running ? <Pause size={17} /> : <Play size={17} />}
                    <span>
                      {running
                        ? 'Pause focus'
                        : remaining === 0
                          ? 'Start focus'
                          : 'Start focus'}
                    </span>
                  </button>
                  <button
                    className="icon-btn timer-reset"
                    disabled={!focusTask}
                    aria-label="Reset timer"
                    onClick={() =>
                      timer.update(newFocus(focusTask?.id ?? null))
                    }
                  >
                    <RotateCcw size={17} />
                  </button>
                </div>
              </section>
              {timerMatches && remaining === 0 && (
                <p className="timer-message" role="status">
                  Focus session complete. Take a break, then mark the task done
                  when you’re ready.
                </p>
              )}
              {timer.storageError && (
                <p className="timer-message" role="status">
                  Browser storage is unavailable. Your timer will reset if you
                  reload.
                </p>
              )}
              <section className="board-toolbar" aria-label="Task filters">
                <label className="task-search">
                  <Search size={21} />
                  <input
                    aria-label="Search tasks"
                    placeholder="Search tasks"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      aria-label="Clear search"
                      onClick={() => setQuery('')}
                    >
                      Clear
                    </button>
                  )}
                </label>
                <div className="filter-tabs">
                  <button
                    className={domain === 'all' ? 'selected' : ''}
                    onClick={() => setDomain('all')}
                  >
                    All tasks <span>({tasks.length})</span>
                  </button>
                  <button
                    className={domain === 'academic' ? 'selected' : ''}
                    onClick={() => setDomain('academic')}
                  >
                    Coursework{' '}
                    <span>
                      ({tasks.filter((t) => t.domain === 'academic').length})
                    </span>
                  </button>
                  <button
                    className={domain === 'career' ? 'selected' : ''}
                    onClick={() => setDomain('career')}
                  >
                    Job search{' '}
                    <span>
                      ({tasks.filter((t) => t.domain === 'career').length})
                    </span>
                  </button>
                </div>
                <label className="due-filter">
                  <span className="sr-only">Deadline filter</span>
                  <select
                    aria-label="Deadline filter"
                    value={due}
                    onChange={(e) => setDue(e.target.value as typeof due)}
                  >
                    <option value="all">All deadlines</option>
                    <option value="today">Due today</option>
                    <option value="urgent">Due or overdue</option>
                  </select>
                </label>
              </section>
              {loading && !data ? (
                <div className="loading-board" role="status">
                  <Loader2 size={25} />
                  <h2>Loading your task board</h2>
                  <p>Bringing coursework and your job search together.</p>
                </div>
              ) : !data ? (
                <div className="loading-board">
                  <h2>Couldn’t load your workspace</h2>
                  <p>
                    Keep the local server running. We’ll retry automatically.
                  </p>
                </div>
              ) : (
                <div className={`kanban-board ${dragId ? 'is-dragging' : ''}`}>
                  {columns.map((column) => {
                    const cards = visible.filter(
                      (t) => t.status === column.status,
                    );
                    const Icon = column.icon;
                    return (
                      <section
                        key={column.status}
                        role="region"
                        aria-label={`${column.label} column`}
                        className={`kanban-column ${column.status} ${dropStatus === column.status ? 'drop-active' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDropStatus(column.status);
                        }}
                        onDragLeave={(e) => {
                          if (
                            !(e.relatedTarget instanceof Node) ||
                            !e.currentTarget.contains(e.relatedTarget)
                          )
                            setDropStatus(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const id = e.dataTransfer.getData('text/plain');
                          setDropStatus(null);
                          setDragId(null);
                          if (tasks.some((t) => t.id === id))
                            void move(id, column.status);
                        }}
                      >
                        <header className="column-heading">
                          <h2>
                            <Icon size={23} />
                            {column.label}
                          </h2>
                          <span>
                            {cards.length}{' '}
                            {cards.length === 1 ? 'task' : 'tasks'}
                          </span>
                        </header>
                        <div className="column-tasks">
                          {cards.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              date={date}
                              busy={saving}
                              move={(id, status) => void move(id, status)}
                              focus={(id) => void beginFocus(id)}
                              details={setDetailId}
                              drag={setDragId}
                            />
                          ))}
                          {!cards.length && (
                            <div className="empty-column">
                              {column.status === 'done' ? (
                                <CheckCircle2 size={29} />
                              ) : column.status === 'in_progress' ? (
                                <Play size={29} />
                              ) : (
                                <ListTodo size={29} />
                              )}
                              <strong>
                                {query || domain !== 'all' || due !== 'all'
                                  ? 'No matching tasks'
                                  : column.status === 'done'
                                    ? 'Good work goes here.'
                                    : column.status === 'in_progress'
                                      ? 'Make one thing your focus.'
                                      : 'Nothing left to start.'}
                              </strong>
                              <p>
                                {query || domain !== 'all' || due !== 'all'
                                  ? 'Try another search or filter.'
                                  : column.status === 'done'
                                    ? 'Mark a task done to see your progress.'
                                    : column.status === 'in_progress'
                                      ? 'Start a task or drag one here.'
                                      : 'Enjoy a little breathing room.'}
                              </p>
                            </div>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
              <button
                className="next-event-bar"
                onClick={() => setWorkspaceView('calendar')}
              >
                <GraduationCap size={24} />
                <strong>
                  {nextEvent
                    ? nextEvent.kind === 'class'
                      ? 'Next class:'
                      : 'Next interview:'
                    : 'Your schedule'}
                </strong>
                <span>
                  {nextEvent
                    ? `${nextEvent.title} · ${chicagoDate(new Date(nextEvent.start)) === date ? '' : new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric' }).format(new Date(nextEvent.start)) + ' · '}${timeLabel(nextEvent.start)}`
                    : 'No upcoming fixed events. View your confirmed plan.'}
                </span>
                <ChevronRight size={22} />
              </button>
              <footer className="board-footer">
                <span>Move tasks by dragging or use the status menu.</span>
                <span>
                  <ShieldCheck size={13} />
                  Your original calendar and tracker stay protected.
                </span>
              </footer>
            </>
          )}
        </main>
      </div>
      {assistantOpen && (
        <aside
          ref={assistant}
          className="assistant-panel"
          aria-label="Planning assistant"
        >
          <header className="assistant-panel-heading">
            <span className="assistant-mark">
              <Sparkles size={20} />
            </span>
            <div>
              <h2>Your assistant</h2>
              <p>A plan that works for you.</p>
            </div>
            <button
              className="icon-btn"
              aria-label="Close planning assistant"
              onClick={() => setAssistantOpen(false)}
            >
              <X size={18} />
            </button>
          </header>
          <PlannerChat
            key={date}
            date={date}
            onDraftChange={setPreview}
            onSaved={savedPlan}
          />
        </aside>
      )}
      {panel === 'career' && (
        <Overlay drawer title="Job search" close={() => setPanel(null)}>
          <p className="drawer-subtitle">
            Applications, interviews and your next steps.
          </p>
          <div className="career-summary">
            <div>
              <strong>{view?.applications.active ?? 0}</strong>
              <span>active applications</span>
            </div>
            <div>
              <strong>{view?.applications.interviewing ?? 0}</strong>
              <span>interviewing</span>
            </div>
          </div>
          <h3 className="drawer-section-label">Upcoming interviews</h3>
          <div className="upcoming-list">
            {(data?.jobs?.interviews ?? [])
              .filter((e) => chicagoDate(new Date(e.start)) >= date)
              .map((e) => (
                <div key={e.id}>
                  <CalendarDays size={18} />
                  <div>
                    <strong>{e.title}</strong>
                    <p>
                      {dateLabel(chicagoDate(new Date(e.start)))} ·{' '}
                      {timeLabel(e.start)}
                    </p>
                  </div>
                </div>
              ))}
            {!(data?.jobs?.interviews ?? []).some(
              (e) => chicagoDate(new Date(e.start)) >= date,
            ) && (
              <p className="drawer-empty">
                No upcoming interviews in your tracker.
              </p>
            )}
          </div>
          <h3 className="drawer-section-label">All applications</h3>
          <div className="application-list">
            {(data?.jobs?.applications ?? []).map((app) => (
              <div key={app.id}>
                <section>
                  <strong>{app.company}</strong>
                  <p>{app.role}</p>
                  <small>Applied {app.appliedOn}</small>
                </section>
                <span className={`application-badge ${app.status}`}>
                  {app.status}
                </span>
              </div>
            ))}
            {!data?.jobs && (
              <p className="drawer-empty">
                Your job tracker is unavailable. Check the source warning on the
                board.
              </p>
            )}
          </div>
          <p className="modal-note">
            Application statuses come from your protected tracker. Task progress
            is managed on the board.
          </p>
        </Overlay>
      )}
      {currentDetail && (
        <Overlay title="Task details" close={() => setDetailId(null)}>
          <div className="task-detail">
            <span className="detail-domain">
              {currentDetail.domain === 'academic' ? (
                <BookOpen size={16} />
              ) : (
                <BriefcaseBusiness size={16} />
              )}{' '}
              {currentDetail.label}
            </span>
            <h3>{currentDetail.title}</h3>
            <p>{currentDetail.context}</p>
            <dl>
              <div>
                <dt>Deadline</dt>
                <dd>
                  {dateLabel(chicagoDate(new Date(currentDetail.due)))} ·{' '}
                  {timeLabel(currentDetail.due)}
                </dd>
              </div>
              <div>
                <dt>Estimated effort</dt>
                <dd>{currentDetail.durationMinutes} minutes</dd>
              </div>
            </dl>
            <label className="detail-status">
              Task status
              <select
                aria-label="Task status"
                value={currentDetail.status}
                disabled={saving}
                onChange={(e) =>
                  void move(currentDetail.id, e.target.value as TaskStatus)
                }
              >
                {columns.map((c) => (
                  <option key={c.status} value={c.status}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            {currentDetail.status !== 'done' && (
              <button
                className="primary-btn modal-done"
                disabled={saving}
                onClick={() => {
                  void beginFocus(currentDetail.id);
                  setDetailId(null);
                }}
              >
                <Target size={18} />
                Focus on this task
              </button>
            )}
          </div>
        </Overlay>
      )}
    </div>
  );
}
