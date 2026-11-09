import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Columns3,
  LockKeyhole,
  Sparkles,
  Target,
} from 'lucide-react';
import { validDate } from '@/lib/dates';
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  if (date && validDate(date)) redirect(`/board?date=${date}`);
  return (
    <div className="home-page">
      <header className="home-header">
        <Link href="/" className="home-brand">
          <span>
            <Activity size={24} />
          </span>
          LifeHarness<span className="home-brand-period">.</span>
        </Link>
        <nav aria-label="Home navigation">
          <a href="#how-it-works">How it works</a>
          <Link href="/board" className="home-nav-cta">
            Your workspace
            <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <main>
        <section className="home-hero">
          <div className="home-hero-copy">
            <p className="home-eyebrow">
              <Sparkles size={15} />A LITTLE STRUCTURE. A CLEARER DAY.
            </p>
            <h1>
              LifeHarness<span>.</span>
            </h1>
            <h2>
              Less juggling.
              <br />
              More moving forward.
            </h2>
            <p className="home-intro">
              Coursework, interviews, and everything in between. Turn a busy
              week into a clear plan—and give your next task a place to start.
            </p>
            <div className="home-actions">
              <Link href="/board" className="home-primary">
                Open task board
                <ArrowRight size={20} />
              </Link>
              <Link href="/board?date=2026-11-10" className="home-secondary">
                Try sample day
                <ArrowUpRight size={17} />
              </Link>
            </div>
            <p className="home-privacy">
              <LockKeyhole size={14} />
              Local-first. Your space, your pace.
            </p>
          </div>
          <div className="home-preview">
            <div className="home-preview-label">
              <Columns3 size={15} />
              <span>YOUR DAY, WITH A LITTLE MORE DIRECTION</span>
            </div>
            <Link
              href="/board"
              className="home-preview-link"
              aria-label="Explore the task board"
            >
              <Image
                src="/codex-board-preview.png"
                alt="LifeHarness task board with To do, In progress and Done columns, a focus timer and task filters"
                width={1487}
                height={1058}
                priority
                sizes="(max-width: 900px) 90vw, 54vw"
              />
            </Link>
            <div className="home-preview-caption">
              <span>One task at a time.</span>
              <span>
                Powered by Codex
                <ArrowUpRight size={12} />
              </span>
            </div>
          </div>
        </section>
        <section
          id="how-it-works"
          className="home-features"
          aria-label="How LifeHarness works"
        >
          <article>
            <span className="home-feature-icon">
              <Sparkles size={21} />
            </span>
            <div>
              <h3>Plan with context.</h3>
              <p>
                Check in with Codex. Shape a day around your deadlines, classes
                and goals.
              </p>
            </div>
          </article>
          <article>
            <span className="home-feature-icon">
              <Target size={21} />
            </span>
            <div>
              <h3>Find your focus.</h3>
              <p>
                Choose one task, start a 25-minute timer and make room for real
                progress.
              </p>
            </div>
          </article>
          <article>
            <span className="home-feature-icon">
              <CheckCircle2 size={21} />
            </span>
            <div>
              <h3>See yourself move forward.</h3>
              <p>
                Move work from to do to done. Keep the next step clear and the
                small wins visible.
              </p>
            </div>
          </article>
        </section>
      </main>
      <footer className="home-footer">
        <span>LifeHarness · A home for your next step.</span>
        <span>
          <LockKeyhole size={13} />
          Your original calendar and tracker stay protected.
        </span>
      </footer>
    </div>
  );
}
