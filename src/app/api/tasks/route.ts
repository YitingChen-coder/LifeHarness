import { z } from 'zod';
import { writeTaskStatus, taskStatusSchema } from '@/lib/task-state';
export const runtime = 'nodejs';
const updateSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
    status: taskStatusSchema,
  })
  .strict();
export async function POST(request: Request) {
  const url = new URL(request.url);
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    request.headers.get('origin') !== url.origin
  )
    return Response.json(
      { error: 'Task changes must come from this local workspace.' },
      { status: 403 },
    );
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return Response.json(
      { error: 'Expected JSON task update.' },
      { status: 415 },
    );
  if (Number(request.headers.get('content-length') ?? 0) > 1024)
    return Response.json({ error: 'Task update too large.' }, { status: 413 });
  let update: z.infer<typeof updateSchema>;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text) > 1024) throw new Error();
    update = updateSchema.parse(JSON.parse(text));
  } catch {
    return Response.json(
      {
        error: 'Provide a known task ID and todo, in_progress or done status.',
      },
      { status: 400 },
    );
  }
  try {
    return Response.json(
      await writeTaskStatus(process.cwd(), update.id, update.status),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error && error.message === 'Unknown task ID'
            ? 'Unknown task ID.'
            : 'Could not save progress. Check local state and retry.',
      },
      {
        status:
          error instanceof Error && error.message === 'Unknown task ID'
            ? 400
            : 500,
      },
    );
  }
}
