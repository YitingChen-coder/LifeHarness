# Codex migration verification — November 9, 2026

The owner chose a Codex-only adaptation. Historical Claude records in archive are
not Codex evidence. No confirmed plan is shipped or fabricated as a real check-in.

## Passed locally

- Installed Codex CLI 0.160.0; `codex login status` reports ChatGPT login.
- Normal `npm run planner:demo` enters the real Codex TUI, with working directory
  data/generated and the existing GPT-6.1-Sol selection preserved.
- Native project trust and the two authored hooks were reviewed/trusted in that TUI.
- `/skills` → List skills → searching `morning` displays the project's
  `morning-check-in` skill and its planning description. This establishes discovery,
  not automatic selection during a model response.
- Launcher enumerates configured MCP servers, disables each with a valid native
  configuration, then re-enumerates and refuses to launch if any remain enabled.
- Native `codex sandbox -P :workspace -C data/generated` refuses opening the
  academic source for writing. The launcher repeats this probe before starting.
- 26 unit tests pass: date/DST, schemas, references, completion precedence, APIs,
  stale reads, links/traversal, native command policy and atomic helper writes.
  Invalid memory leaves the prior saved bytes unchanged and no temporary file.
- `npm run typecheck`, production build, formatting check and deterministic
  `npm run test:safety` pass. The latter runs the actual hook process with a
  simulated malicious Bash payload; it is not a model-tool integration run.
- 8 Playwright tests pass: landing navigation, responsive board from 320–1487px,
  filters, task persistence/drag, focus timer, schedule/career, error recovery,
  focus trapping, and automatic plan refresh. Refresh measured **3408 ms**.
- Homepage and board screenshots refreshed with current Codex labels.
- Independent read-only review completed; the stale Claude live-test command and
  native MCP override compatibility were corrected and reviewed again.

## Attempted, not passed

Actual Codex `exec` morning and isolated hook-test sessions were attempted. CLI
connections to `wss://chatgpt.com/backend-api/codex/responses` failed with
`Connection refused (os error 61)`, followed by unsuccessful HTTPS fallback/retries.
The final live test timed out after 120 seconds (ETIMEDOUT) without a model
response or tool invocation. Direct curl connectivity
alone does not establish that the authenticated Codex model route works.

Consequently **automatic skill selection, questions, proposal/refusal leaving files
unchanged, explicit agreement saving a plan and notes, and an actual Codex tool call
being rejected by PreToolUse remain unverified**. Do not present the local schema,
simulated-hook or browser checks as a substitute. `npm run test:hook:live` now invokes
Codex in a disposable fixture and requires the actual hook denial; failure cannot
be reported as a pass. It uses reviewed fixture hooks with the automation-only hook
trust flag; normal launches never bypass hook trust or sandbox approvals.

Once the local Codex connection works, run the live test and the conversation in
[demo.md](demo.md), then record actual outputs here. The implementation migration is
complete; full model integration acceptance remains pending this connection issue.

## Protected source hashes

- academic.json: `2705c5366bf93c6b2c1665846eed64dade7ccc65984e2e6f692aaf45efc39463`
- jobs.json: `ddac94ecf6b2da0fdfed1d1336f5a03f6b0d888e8be6e40eaeb8735a55f21bbe`

Both match the pre-migration sources.
