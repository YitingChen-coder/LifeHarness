'use client';
import { useState } from 'react';
import {
  Check,
  Clipboard,
  Terminal,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { chicagoDate, dateLabel } from '@/lib/dates';
export function TerminalGuide({ date }: { date: string }) {
  const [copied, setCopied] = useState(false);
  const command =
    date === chicagoDate()
      ? 'npm run planner'
      : `npm run planner -- --date ${date}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <section className="terminal-guide" aria-label="Terminal check-in guide">
      <div className="terminal-guide-intro">
        <span className="assistant-mark">
          <Terminal size={23} />
        </span>
        <h3>
          Plan in Codex.
          <br />
          See your day here.
        </h3>
        <p>
          Keep this calendar on the left and your Codex terminal on the right.
        </p>
      </div>
      <p className="terminal-guide-date">{dateLabel(date)} · America/Chicago</p>
      <ol>
        <li>
          <strong>Start the native planner</strong>
          <p>In a terminal opened in this project, run:</p>
          <div className="terminal-launch-command">
            <code>{command}</code>
            <button
              className="icon-btn"
              onClick={() => void copy()}
              aria-label="Copy planner command"
            >
              {copied ? <Check size={16} /> : <Clipboard size={16} />}
            </button>
          </div>
          <span role="status">{copied ? 'Command copied.' : ''}</span>
        </li>
        <li>
          <strong>Say “Good morning”</strong>
          <p>
            Codex selects the morning skill, reads your sources and notes, then
            asks a question or two.
          </p>
        </li>
        <li>
          <strong>Review, then agree</strong>
          <p>
            Revise or decline without saving. When you explicitly agree, Codex
            saves the plan and memory. This calendar updates automatically.
          </p>
        </li>
      </ol>
      <details>
        <summary>What to show in the assignment demo</summary>
        <ul>
          <li>Standing context: AGENTS.md, loaded each session.</li>
          <li>
            On-demand context: morning skill, references and personal data.
          </li>
          <li>Decisions: questions, priorities and time blocks.</li>
          <li>Enforcement: native Hook and sandbox block protected changes.</li>
        </ul>
        <p>
          Use /status, /skills and /hooks in Codex. Context diagnostics are
          provided by <code>npm run planner:context</code>; Claude’s /context is
          not assumed to exist in Codex.
        </p>
      </details>
      <p className="terminal-guide-safety">
        <ShieldCheck size={16} />
        The default webpage never calls a model or saves AI plans. It displays
        the native planner’s confirmed output.
      </p>
      <a
        href="https://github.com/YitingChen-coder/LifeHarness/blob/main/docs/demo.md"
        target="_blank"
        rel="noreferrer"
      >
        Read the demo script <ArrowRight size={14} />
      </a>
    </section>
  );
}
