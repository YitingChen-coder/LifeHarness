export type FocusState = {
  taskId: string | null;
  remainingMs: number;
  endsAt: number | null;
};
export const FOCUS_DURATION = 25 * 60 * 1000;
export function newFocus(taskId: string | null = null): FocusState {
  return { taskId, remainingMs: FOCUS_DURATION, endsAt: null };
}
export function remainingFocus(state: FocusState, now: number): number {
  return Math.max(
    0,
    state.endsAt === null ? state.remainingMs : state.endsAt - now,
  );
}
export function startFocus(state: FocusState, now: number): FocusState {
  if (state.endsAt !== null && remainingFocus(state, now) > 0) return state;
  const remaining =
    state.endsAt !== null
      ? FOCUS_DURATION
      : state.remainingMs > 0
        ? state.remainingMs
        : FOCUS_DURATION;
  return { ...state, remainingMs: remaining, endsAt: now + remaining };
}
export function pauseFocus(state: FocusState, now: number): FocusState {
  return { ...state, remainingMs: remainingFocus(state, now), endsAt: null };
}
export function parseFocus(raw: string): FocusState | null {
  try {
    const value = JSON.parse(raw);
    if (
      !value ||
      !(
        value.taskId === null ||
        (typeof value.taskId === 'string' &&
          /^[\w-]{1,100}$/.test(value.taskId))
      ) ||
      !Number.isFinite(value.remainingMs) ||
      value.remainingMs < 0 ||
      value.remainingMs > FOCUS_DURATION ||
      !(
        value.endsAt === null ||
        (Number.isFinite(value.endsAt) && value.endsAt >= 0)
      )
    )
      return null;
    return {
      taskId: value.taskId,
      remainingMs: value.remainingMs,
      endsAt: value.endsAt,
    };
  } catch {
    return null;
  }
}

export function focusLabel(remainingMs: number): string {
  const seconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
