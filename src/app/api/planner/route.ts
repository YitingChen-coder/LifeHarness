import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { chicagoDate, validDate } from '@/lib/dates';
import { localRequest } from '@/lib/local-request';
import { PlannerSession } from '@/lib/web-planner';
import { codexStatus, generateWithCodex } from '@/lib/codex-bridge';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
const date = z.string().refine(validDate);
const inputSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('message'),
      date,
      message: z.string().trim().min(1).max(4000),
    })
    .strict(),
  z
    .object({ action: z.enum(['confirm', 'discard']), date, draftId: z.uuid() })
    .strict(),
  z.object({ action: z.literal('reset'), date }).strict(),
]);
type Entry = { session: PlannerSession; touched: number };
const globalState = globalThis as typeof globalThis & {
  lifeHarnessPlannerSessions?: Map<string, Entry>;
};
const sessions = (globalState.lifeHarnessPlannerSessions ??= new Map());
const ttl = 90 * 60 * 1000;
function browserId(request: Request) {
  const value = request.headers
    .get('cookie')
    ?.match(/(?:^|;\s*)lifeharness_planner=([a-f0-9-]{36})(?:;|$)/)?.[1];
  return value && z.uuid().safeParse(value).success ? value : randomUUID();
}
function session(id: string, date: string) {
  const now = Date.now();
  for (const [key, item] of sessions)
    if (now - item.touched > ttl && !item.session.snapshot().busy)
      sessions.delete(key);
  const key = `${id}:${date}`;
  let entry = sessions.get(key);
  if (!entry) {
    if (sessions.size >= 64)
      throw new Error('Local planner is busy. Try again later.');
    entry = {
      session: new PlannerSession(process.cwd(), date, generateWithCodex),
      touched: now,
    };
    sessions.set(key, entry);
  }
  entry.touched = now;
  return entry.session;
}
function respond(id: string, body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Set-Cookie': `lifeharness_planner=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=5400`,
    },
  });
}
export async function GET(request: Request) {
  if (!localRequest(request))
    return Response.json(
      { error: 'Open this planner on localhost.' },
      { status: 403 },
    );
  const selected =
    new URL(request.url).searchParams.get('date') ?? chicagoDate();
  if (!validDate(selected))
    return Response.json({ error: 'Invalid planning date.' }, { status: 400 });
  const id = browserId(request);
  try {
    return respond(id, {
      ...session(id, selected).snapshot(),
      connection: await codexStatus(),
    });
  } catch {
    return respond(
      id,
      { error: 'Local planner unavailable. Retry shortly.' },
      503,
    );
  }
}
export async function POST(request: Request) {
  if (!localRequest(request, true))
    return Response.json(
      { error: 'Planner actions must come from this local page.' },
      { status: 403 },
    );
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return Response.json({ error: 'Expected JSON.' }, { status: 415 });
  if (Number(request.headers.get('content-length') ?? 0) > 20000)
    return Response.json({ error: 'Message too large.' }, { status: 413 });
  let input: z.infer<typeof inputSchema>;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body) > 20000) throw new Error();
    input = inputSchema.parse(JSON.parse(body));
  } catch {
    return Response.json(
      { error: 'Invalid planner action, date or message.' },
      { status: 400 },
    );
  }
  const id = browserId(request);
  try {
    const s = session(id, input.date);
    const result =
      input.action === 'message'
        ? await s.message(input.message)
        : input.action === 'confirm'
          ? await s.confirm(input.draftId)
          : input.action === 'discard'
            ? await s.discard(input.draftId)
            : s.reset();
    return respond(id, result);
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : 'Planner request failed.';
    const conflict = /stale|already running|full|busy/i.test(reason);
    return respond(
      id,
      { error: reason, snapshot: session(id, input.date).snapshot() },
      conflict ? 409 : 502,
    );
  }
}
