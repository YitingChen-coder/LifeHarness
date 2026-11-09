import { loadDashboard } from '@/lib/store';
import { chicagoDate, validDate } from '@/lib/dates';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date') ?? chicagoDate();
  if (!validDate(date))
    return Response.json(
      { error: 'Invalid date. Use a real YYYY-MM-DD calendar date.' },
      { status: 400 },
    );
  try {
    return Response.json(await loadDashboard(process.cwd(), date), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch {
    return Response.json(
      { error: 'Unable to read the local planning workspace.' },
      { status: 500 },
    );
  }
}
