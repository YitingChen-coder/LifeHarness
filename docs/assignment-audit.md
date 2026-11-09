# Assignment alignment — Codex adaptation

The owner explicitly requested complete replacement of Claude Code with Codex,
accepting divergence from the assignment's named product. This is an intentional
adaptation, not a claim of full original-assignment compliance.

| Area                             | Implementation                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| Two personal domains             | Synthetic coursework and career JSON, stable IDs and dates.                                         |
| Context and reusable workflow    | AGENTS.md, native .agents morning skill, on-demand references.                                      |
| Real agent                       | Native Codex app-server with ChatGPT login; real browser replies, no API key.                       |
| Conversation                     | Questions, proposal, refusal/revision, explicit confirmation, cross-day notes.                      |
| Protection                       | Read-only browser AI, guarded confirmation endpoint and schema validation; optional terminal hooks. |
| Dashboard                        | Title homepage, task board, deadlines, schedule, jobs, priorities and check-in.                     |
| Original Claude Code requirement | Intentionally not met; replaced with Codex at owner's request.                                      |
| Live evidence                    | See current verification report; untested behavior must remain unverified.                          |

Historical audits and Claude runs live in docs/archive. They do not verify Codex.

The primary flow now runs in the browser: questions, proposal, revision/refusal,
explicit confirmation and automatic dashboard refresh. Actual Codex flow passed in
a disposable fixture; screenshots also show a real browser/model reply. See current
verification.md for precise evidence and test boundaries.
