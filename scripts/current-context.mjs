#!/usr/bin/env node
const now = new Date();
const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Chicago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(now);
console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `LifeHarness clock. Current actual time: ${now.toISOString()}\nActual Chicago date: ${date}. Use this fresh timestamp for confirmedAt and updatedAt if the user confirms in this turn. Keep the selected planning date unchanged, including explicit demo mode.`,
    },
  }),
);
