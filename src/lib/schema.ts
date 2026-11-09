import { z } from 'zod';
import { chicagoDate, chicagoMinutes, validDate } from './dates';
const text = z.string().min(1).max(500);
const id = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/)
  .max(100);
const date = z
  .string()
  .refine(validDate, 'Expected a real YYYY-MM-DD calendar date');
const timestamp = z.iso
  .datetime({ offset: true })
  .refine((v) => Number.isFinite(Date.parse(v)), 'Invalid timestamp');
const status = z.enum(['pending', 'completed']);
const sourceBase = {
  label: text,
  synthetic: z.literal(true),
  timezone: z.literal('America/Chicago'),
};
const taskBase = {
  id,
  title: text,
  due: timestamp,
  durationMinutes: z.number().int().min(5).max(480),
  status,
};
const eventBase = {
  id,
  title: text,
  start: timestamp,
  end: timestamp,
  location: text,
};
function unique(records: { id: string }[]) {
  return new Set(records.map((r) => r.id)).size === records.length;
}
const eventOrdered = (e: { start: string; end: string }) =>
  Date.parse(e.end) > Date.parse(e.start);
export const academicSchema = z
  .object({
    ...sourceBase,
    weekOf: date,
    courses: z
      .array(
        z.object({
          id,
          code: text,
          name: text,
          color: z.enum(['blue', 'purple', 'teal']),
        }),
      )
      .max(50),
    events: z
      .array(
        z
          .object({ ...eventBase, courseId: id, kind: z.literal('class') })
          .refine(eventOrdered, 'Event end must follow start'),
      )
      .max(500),
    tasks: z
      .array(
        z.object({
          ...taskBase,
          courseId: id,
          kind: z.enum(['assignment', 'study', 'practice']),
        }),
      )
      .max(500),
  })
  .refine(
    (a) => unique([...a.courses, ...a.events, ...a.tasks]),
    'Duplicate source ID',
  )
  .refine(
    (a) =>
      [...a.events, ...a.tasks].every((r) =>
        a.courses.some((c) => c.id === r.courseId),
      ),
    'Unknown course ID',
  );
export const jobsSchema = z
  .object({
    ...sourceBase,
    applications: z
      .array(
        z.object({
          id,
          company: text,
          role: text,
          status: z.enum([
            'applied',
            'screening',
            'interviewing',
            'offer',
            'rejected',
          ]),
          appliedOn: date,
        }),
      )
      .max(500),
    interviews: z
      .array(
        z
          .object({
            ...eventBase,
            applicationId: id,
            kind: z.literal('interview'),
          })
          .refine(eventOrdered, 'Interview end must follow start'),
      )
      .max(500),
    tasks: z
      .array(
        z.object({
          ...taskBase,
          applicationId: id,
          kind: z.enum(['prep', 'follow-up', 'application']),
        }),
      )
      .max(500),
  })
  .refine(
    (j) => unique([...j.applications, ...j.interviews, ...j.tasks]),
    'Duplicate source ID',
  )
  .refine(
    (j) =>
      [...j.interviews, ...j.tasks].every((r) =>
        j.applications.some((a) => a.id === r.applicationId),
      ),
    'Unknown application ID',
  );
const blockSchema = z
  .object({
    id,
    sourceId: id.optional(),
    title: text,
    start: timestamp,
    end: timestamp,
    kind: z.enum(['task', 'class', 'interview', 'break']),
    status,
  })
  .strict();
export const planSchema = z
  .object({
    date,
    timezone: z.literal('America/Chicago'),
    confirmed: z.literal(true),
    confirmedAt: timestamp,
    summary: text,
    priorities: z
      .array(
        z
          .object({ id, sourceId: id, title: text, reason: text, status })
          .strict(),
      )
      .max(20),
    blocks: z.array(blockSchema).max(60),
  })
  .strict()
  .superRefine((p, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: 'custom', message });
    if (!unique(p.priorities) || !unique(p.blocks)) issue('Duplicate plan ID');
    for (const b of p.blocks) {
      if (!eventOrdered(b)) issue('Block end must follow start');
      if (
        chicagoDate(new Date(b.start)) !== p.date ||
        chicagoDate(new Date(b.end)) !== p.date
      )
        issue('Block must be on the plan date in Chicago');
      if (
        (b.kind === 'task' || b.kind === 'class' || b.kind === 'interview') &&
        !b.sourceId
      )
        issue('Scheduled work needs a source ID');
      if (b.kind === 'task') {
        const start = chicagoMinutes(b.start),
          end = chicagoMinutes(b.end);
        if (start < 540 || end > 1080 || (start < 780 && end > 720))
          issue('Tasks must fit 09–18 with 12–13 lunch free');
        if (
          p.blocks.some(
            (other) =>
              other.id !== b.id &&
              Date.parse(b.start) < Date.parse(other.end) &&
              Date.parse(b.end) > Date.parse(other.start),
          )
        )
          issue('Task overlaps another block');
      }
    }
  });
export const notesSchema = z
  .object({
    updatedAt: timestamp,
    carryOver: z.array(id).max(100),
    reflections: z.array(text).max(30),
  })
  .strict();
export type Academic = z.infer<typeof academicSchema>;
export type Jobs = z.infer<typeof jobsSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Notes = z.infer<typeof notesSchema>;
export function validateReferences(
  plan: Plan,
  academic: Academic,
  jobs: Jobs,
): boolean {
  const taskIds = new Set([...academic.tasks, ...jobs.tasks].map((t) => t.id));
  return (
    plan.priorities.every((p) => taskIds.has(p.sourceId)) &&
    plan.blocks.every((b) => {
      if (b.kind === 'break') return !b.sourceId;
      if (b.kind === 'task') return !!b.sourceId && taskIds.has(b.sourceId);
      const fixed = [...academic.events, ...jobs.interviews].find(
        (e) => e.id === b.sourceId,
      );
      return (
        !!fixed &&
        fixed.kind === b.kind &&
        fixed.start === b.start &&
        fixed.end === b.end
      );
    })
  );
}
