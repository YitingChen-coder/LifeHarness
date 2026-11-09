'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  newFocus,
  parseFocus,
  remainingFocus,
  type FocusState,
} from '@/lib/focus';
const KEY = 'lifeharness-focus-v2';
export function useFocus() {
  const [state, setState] = useState<FocusState>(newFocus());
  const [now, setNow] = useState(0);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = parseFocus(saved);
        if (parsed) setState(parsed);
      }
    } catch {
      setStorageError(true);
    }
    setNow(Date.now());
  }, []);
  useEffect(() => {
    if (state.endsAt === null) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [state.endsAt]);
  const update = useCallback((next: FocusState) => {
    setState(next);
    setNow(Date.now());
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, []);
  return {
    state,
    remaining: remainingFocus(state, now || Date.now()),
    update,
    storageError,
  };
}
