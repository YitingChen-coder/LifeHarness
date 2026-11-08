# Output contract — load before saving

Files must be complete JSON objects; use Write for each whole file (Edit is blocked
for generated files to avoid partially validated updates). No Markdown fences.

Daily path: data/generated/YYYY-MM-DD.json. Fields:
- date: the selected real calendar date; timezone: "America/Chicago";
  confirmed: true; confirmedAt: current actual ISO timestamp with offset.
- summary: a short plain-English daily intention.
- priorities: [{id, sourceId, title, reason, status: "pending" | "completed"}].
- blocks: [{id, sourceId?, title, start, end, kind, status}].
  kind is "task", "class", "interview" or "break". Times are ISO timestamps with
  offsets, on date in Chicago; end follows start. IDs are unique alphanumeric/hyphen
  strings. Task blocks fit 09–18, never overlap lunch (12–13) or any other block.
  Fixed events keep exact source timestamps and IDs; don't omit a fixed event to
  hide a conflict. Use source task IDs for tasks/priorities. Breaks have no sourceId.
- confirmedAt records when agreement happened, not a future demo clock time.

Memory path: data/generated/notes.json.
{ "updatedAt": "actual ISO timestamp with offset", "carryOver": ["task-id"],
  "reflections": ["Short factual note from the confirmed conversation"] }
Keep at most 100 carryover IDs, 30 reflections and 500 characters per text field.
Write the plan first; only update notes if the plan write succeeds. If notes fail,
explain that the plan saved but memory did not. Never report success before tools
succeed. A plan is not a source update and does not send follow-ups or applications.
