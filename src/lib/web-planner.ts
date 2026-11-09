import { randomUUID } from 'node:crypto';
import {
  realpath,
  readFile,
  lstat,
  writeFile,
  rename,
  rm,
} from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { planSchema, notesSchema, type Plan } from './schema';
import { validDate } from './dates';
import { validateGeneratedWrite } from './protection';
import { loadDashboard } from './store';

const draftSchema = z
  .object({
    summary: planSchema.shape.summary,
    priorities: planSchema.shape.priorities,
    blocks: z
      .array(
        planSchema.shape.blocks.element.extend({
          sourceId: planSchema.shape.blocks.element.shape.sourceId
            .unwrap()
            .nullable(),
        }),
      )
      .max(60),
    carryOver: notesSchema.shape.carryOver,
    reflections: notesSchema.shape.reflections,
  })
  .strict();
export const plannerReplySchema = z
  .object({
    message: z.string().min(1).max(8000),
    draft: draftSchema.nullable(),
  })
  .strict();
export type PlannerReply = z.infer<typeof plannerReplySchema>;
export type ChatMessage = { role: 'user' | 'assistant'; text: string };
export type DraftPreview = {
  id: string;
  plan: Plan;
  carryOver: string[];
  reflections: string[];
};
export type PlannerSnapshot = {
  date: string;
  busy: boolean;
  messages: ChatMessage[];
  draft: DraftPreview | null;
  saved: boolean;
  warning: string | null;
};
export type GenerateReply = (input: {
  root: string;
  date: string;
  messages: ChatMessage[];
  context: unknown;
}) => Promise<unknown>;

async function checkedWrite(root: string, path: string, value: unknown) {
  const bytes = JSON.stringify(value, null, 2) + '\n';
  const check = await validateGeneratedWrite(path, bytes, root);
  if (!check.allowed) throw new Error(check.reason);
  const temp = join(root, 'data/generated', `.web-${randomUUID()}.tmp`);
  try {
    await writeFile(temp, bytes, { flag: 'wx', mode: 0o600 });
    await rename(temp, path);
  } finally {
    await rm(temp, { force: true });
  }
}
async function memory(root: string) {
  const file = join(root, 'data/generated/notes.json');
  try {
    if (
      (await realpath(file)) !==
      join(await realpath(root), 'data/generated/notes.json')
    )
      throw new Error('Linked memory path');
    const stat = await lstat(file);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.nlink > 1 ||
      stat.size > 131072
    )
      throw new Error('Unsafe memory file');
    return notesSchema.parse(JSON.parse(await readFile(file, 'utf8')));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new Error('Saved notes are invalid. Restore them before planning.');
  }
}
export class PlannerSession {
  private messages: ChatMessage[] = [];
  private draft: DraftPreview | null = null;
  private busy = false;
  private saved = false;
  private warning: string | null = null;
  private savedId: string | null = null;
  constructor(
    private root: string,
    readonly date: string,
    private generate: GenerateReply,
  ) {
    if (!validDate(date)) throw new Error('Invalid planning date');
  }
  snapshot(): PlannerSnapshot {
    return {
      date: this.date,
      busy: this.busy,
      messages: this.messages.map((m) => ({ ...m })),
      draft: this.draft,
      saved: this.saved,
      warning: this.warning,
    };
  }
  reset() {
    this.lock();
    try {
      this.messages = [];
      this.draft = null;
      this.saved = false;
      this.savedId = null;
      this.warning = null;
      return { ...this.snapshot(), busy: false };
    } finally {
      this.busy = false;
    }
  }
  private lock() {
    if (this.busy) throw new Error('A planner request is already running.');
    this.busy = true;
  }
  async message(text: string) {
    this.lock();
    try {
      if (!text.trim() || text.length > 4000)
        throw new Error('Message must be 1–4000 characters');
      if (this.messages.length >= 40)
        throw new Error('Conversation is full. Start a new check-in.');
      this.draft = null;
      this.saved = false;
      this.warning = null;
      const data = await loadDashboard(this.root, this.date);
      if (!data.academic || !data.jobs)
        throw new Error('Both source files must be valid before planning.');
      const notes = await memory(this.root);
      const conversation = [
        ...this.messages,
        { role: 'user' as const, text: text.trim() },
      ];
      const reply = plannerReplySchema.parse(
        await this.generate({
          root: this.root,
          date: this.date,
          messages: conversation,
          context: { ...data, notes, actualNow: new Date().toISOString() },
        }),
      );
      let next: DraftPreview | null = null;
      if (reply.draft) {
        const { carryOver, reflections, ...work } = reply.draft;
        const plan = planSchema.parse({
          ...work,
          blocks: work.blocks.map(({ sourceId, ...block }) =>
            sourceId === null ? block : { ...block, sourceId },
          ),
          date: this.date,
          timezone: 'America/Chicago',
          confirmed: true,
          confirmedAt: new Date().toISOString(),
        });
        const check = await validateGeneratedWrite(
          join(this.root, `data/generated/${this.date}.json`),
          JSON.stringify(plan),
          this.root,
        );
        if (!check.allowed) throw new Error(`Draft rejected: ${check.reason}`);
        const noteCheck = await validateGeneratedWrite(
          join(this.root, 'data/generated/notes.json'),
          JSON.stringify({
            updatedAt: plan.confirmedAt,
            carryOver,
            reflections,
          }),
          this.root,
        );
        if (!noteCheck.allowed)
          throw new Error(`Draft memory rejected: ${noteCheck.reason}`);
        next = { id: randomUUID(), plan, carryOver, reflections };
      }
      this.messages = [
        ...conversation,
        { role: 'assistant', text: reply.message },
      ];
      this.draft = next;
      return { ...this.snapshot(), busy: false };
    } finally {
      this.busy = false;
    }
  }
  async discard(id: string) {
    this.lock();
    try {
      if (!this.draft || this.draft.id !== id)
        throw new Error('This draft is stale. Review the current proposal.');
      this.draft = null;
      this.messages.push(
        { role: 'user', text: 'Do not save this proposal.' },
        {
          role: 'assistant',
          text: 'Proposal discarded. Your saved plan and notes are unchanged.',
        },
      );
      return { ...this.snapshot(), busy: false };
    } finally {
      this.busy = false;
    }
  }
  async confirm(id: string) {
    this.lock();
    try {
      if (this.savedId === id) return { ...this.snapshot(), busy: false };
      if (!this.draft || this.draft.id !== id)
        throw new Error('This draft is stale. Review the current proposal.');
      const now = new Date().toISOString();
      const plan = { ...this.draft.plan, confirmedAt: now };
      // This is the only browser flow that writes a plan, using the server-held draft.
      await checkedWrite(
        this.root,
        join(this.root, `data/generated/${this.date}.json`),
        plan,
      );
      try {
        await checkedWrite(
          this.root,
          join(this.root, 'data/generated/notes.json'),
          {
            updatedAt: now,
            carryOver: this.draft.carryOver,
            reflections: this.draft.reflections,
          },
        );
      } catch {
        this.warning =
          'Plan saved, but cross-day notes could not be saved. Your previous notes were retained.';
      }
      this.savedId = id;
      this.saved = true;
      this.draft = null;
      this.messages.push(
        { role: 'user', text: 'I confirm this displayed plan. Save it.' },
        {
          role: 'assistant',
          text:
            this.warning ??
            'Your plan and notes are saved. The board will update automatically.',
        },
      );
      return { ...this.snapshot(), busy: false };
    } finally {
      this.busy = false;
    }
  }
}
