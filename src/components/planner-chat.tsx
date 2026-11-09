'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { PlannerSnapshot } from '@/lib/web-planner';
import { dateLabel, timeLabel } from '@/lib/dates';
type Connection = { ready: boolean; provider: string; message: string };
export function PlannerChat({ date }: { date: string }) {
  const [state, setState] = useState<PlannerSnapshot | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const history = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const busy = sending || !!state?.busy;
  useEffect(() => {
    let active = true;
    let inFlight = false;
    const abort = new AbortController();
    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      const version = generation.current;
      try {
        const response = await fetch(
          `/api/planner?date=${encodeURIComponent(date)}`,
          { cache: 'no-store', signal: abort.signal },
        );
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? 'Could not load planner.');
        if (active && version === generation.current) {
          setState(body);
          setConnection(body.connection);
          setLoading(false);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Planner unavailable.');
          setLoading(false);
        }
      } finally {
        inFlight = false;
      }
    }
    setLoading(true);
    setError(null);
    void refresh();
    const timer = setInterval(() => {
      if (active) void refresh();
    }, 2500);
    return () => {
      active = false;
      abort.abort();
      clearInterval(timer);
    };
  }, [date, retry]);
  useEffect(() => {
    if (history.current)
      history.current.scrollTop = history.current.scrollHeight;
  }, [state?.messages.length, busy]);
  async function act(
    action: 'message' | 'confirm' | 'discard' | 'reset',
    message?: string,
  ) {
    if (busy) return;
    setSending(true);
    generation.current++;
    setError(null);
    try {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          date,
          ...(action === 'message'
            ? { message }
            : action === 'confirm' || action === 'discard'
              ? { draftId: state?.draft?.id }
              : {}),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        if (body.snapshot) setState(body.snapshot);
        throw new Error(body.error ?? 'Planner request failed.');
      }
      setState(body);
      if (action === 'message') setText('');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Connection interrupted. Reopen the planner to check its state before retrying.',
      );
    } finally {
      generation.current++;
      setSending(false);
    }
  }
  const ready = connection?.ready && !loading;
  return (
    <div className="planner-chat">
      <div className="planner-context">
        <div>
          <span className="eyebrow">YOUR DAILY CHECK-IN</span>
          <h3>{dateLabel(date)}</h3>
          <p>America/Chicago · Coursework & career</p>
        </div>
        <button
          className="icon-btn"
          title="Start new check-in"
          aria-label="Start new check-in"
          disabled={busy || loading}
          onClick={() => void act('reset')}
        >
          <RotateCcw size={18} />
        </button>
      </div>
      <div
        className={`planner-connection ${connection?.ready ? 'connected' : ''}`}
      >
        <span className="connection-dot" />
        <span>
          {loading
            ? 'Checking local Codex…'
            : connection?.ready
              ? 'Codex account connected'
              : 'Codex connection needs attention'}
        </span>
        <ShieldCheck size={15} />
      </div>
      <p className="planner-account-note">
        {connection?.message ??
          'Uses your local Codex ChatGPT login. No API key required.'}{' '}
        This is a separate planning conversation.
      </p>
      {loading && (
        <p className="planner-working" role="status">
          <Loader2 size={16} className="spin" />
          Loading your check-in…
        </p>
      )}
      {!loading && !connection?.ready && (
        <div className="planner-offline">
          <TriangleAlert size={22} />
          <div>
            <strong>Connect your Codex account</strong>
            <p>
              {connection?.message ??
                'The local Codex service could not be reached.'}
            </p>
            <button
              className="quiet-btn"
              onClick={() => setRetry((v) => v + 1)}
            >
              Check connection again
            </button>
          </div>
        </div>
      )}
      <div
        ref={history}
        className="planner-history"
        role="log"
        aria-label="Planning conversation"
        aria-live="polite"
      >
        {!state?.messages.length && !loading && (
          <div className="planner-welcome">
            <span className="modal-symbol">
              <Sparkles size={25} />
            </span>
            <h3>A clearer day starts here.</h3>
            <p>
              Tell me how you’re feeling. I’ll help shape a day around your
              deadlines and fixed commitments.
            </p>
            <div className="planner-prompts">
              {['Good morning', 'Plan my day'].map((prompt) => (
                <button
                  className="quiet-btn"
                  key={prompt}
                  disabled={!ready || busy}
                  onClick={() => void act('message', prompt)}
                >
                  {prompt}
                  <Sparkles size={14} />
                </button>
              ))}
            </div>
          </div>
        )}
        {state?.messages.map((message, i) => (
          <div key={i} className={`chat-message ${message.role}`}>
            <span className="chat-speaker">
              {message.role === 'user' ? 'You' : 'Codex'}
            </span>
            <p>{message.text}</p>
          </div>
        ))}
        {busy && (
          <p className="planner-working" role="status">
            <Loader2 size={17} className="spin" />
            Codex is planning with your tasks and schedule…
          </p>
        )}
      </div>
      {error && (
        <div className="planner-error" role="alert">
          <TriangleAlert size={17} />
          <p>{error}</p>
        </div>
      )}
      {state?.warning && (
        <p className="planner-error" role="status">
          {state.warning}
        </p>
      )}
      {state?.saved && (
        <p className="planner-saved" role="status">
          <Check size={17} />
          Confirmed plan saved. Your board updates automatically.
        </p>
      )}
      {state?.draft && (
        <section className="planner-proposal" aria-label="Proposed plan">
          <div className="proposal-heading">
            <span className="eyebrow">PROPOSED · NOT SAVED</span>
            <ShieldCheck size={17} />
          </div>
          <h3>{state.draft.plan.summary}</h3>
          <ol className="proposal-priorities">
            {state.draft.plan.priorities.map((p) => (
              <li key={p.id}>
                <strong>{p.title}</strong>
                <span>{p.reason}</span>
              </li>
            ))}
          </ol>
          <div className="proposal-blocks">
            {state.draft.plan.blocks.map((block) => (
              <div key={block.id}>
                <time>
                  {timeLabel(block.start)}–{timeLabel(block.end)}
                </time>
                <span>
                  {block.title}
                  <small>{block.kind}</small>
                </span>
              </div>
            ))}
          </div>
          <details className="proposal-memory">
            <summary>Cross-day notes to save</summary>
            <ul>
              {state.draft.reflections.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
            <p>{state.draft.carryOver.length} carry-over tasks</p>
          </details>
          <div className="proposal-actions">
            <button
              className="quiet-btn"
              disabled={busy}
              onClick={() => void act('discard')}
            >
              <X size={16} />
              Don’t save
            </button>
            <button
              className="primary-btn"
              disabled={busy}
              onClick={() => void act('confirm')}
            >
              <Check size={17} />
              Confirm & save
            </button>
          </div>
          <p className="planner-account-note">
            Only this button saves the displayed plan and notes. To revise, send
            a message below.
          </p>
        </section>
      )}
      <form
        className="planner-composer"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) void act('message', text.trim());
        }}
      >
        <label className="sr-only" htmlFor="planner-message">
          Message Codex
        </label>
        <textarea
          id="planner-message"
          rows={2}
          maxLength={4000}
          value={text}
          disabled={!ready || busy}
          placeholder={
            state?.draft
              ? 'Ask for a change to this plan…'
              : 'How would you like to plan today?'
          }
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              if (text.trim()) void act('message', text.trim());
            }
          }}
        />
        <button
          className="planner-send"
          type="submit"
          aria-label="Send message"
          disabled={!ready || busy || !text.trim()}
        >
          {busy ? (
            <Loader2 size={20} className="spin" />
          ) : (
            <ArrowUp size={20} />
          )}
        </button>
      </form>
      <p className="planner-footer-note">
        Sources stay protected. Proposals stay unsaved until you confirm.
      </p>
    </div>
  );
}
