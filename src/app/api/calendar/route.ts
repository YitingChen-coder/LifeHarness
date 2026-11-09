import { chicagoDate, validDate } from '@/lib/dates';
import { calendarWeek } from '@/lib/calendar';
import { loadDashboard } from '@/lib/store';
import { localRequest } from '@/lib/local-request';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!localRequest(request))
    return Response.json(
      { error: 'Open the calendar on localhost.' },
      { status: 403 },
    );
  const date = new URL(request.url).searchParams.get('date') ?? chicagoDate();
  if (!validDate(date))
    return Response.json({ error: 'Invalid calendar date.' }, { status: 400 });
  try {
    const dates = calendarWeek(date);
    const days = await Promise.all(
      dates.map((day) => loadDashboard(process.cwd(), day)),
    );
    return Response.json(
      { start: dates[0], days },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch {
    return Response.json(
      { error: 'Could not load this calendar week.' },
      { status: 500 },
    );
  }
}
