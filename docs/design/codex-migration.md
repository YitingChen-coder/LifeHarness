# Codex-only planner migration

User explicitly chose complete replacement of Claude Code, accepting that the
original assignment specifies Claude Code. Keep that distinction in the audit.

## Checkpoints

1. Native Codex CLI launcher, .agents skill, .codex hooks, constrained file helper,
   generated-directory OS sandbox and test-first policy coverage. Upload.
2. Replace active UI/docs/commands, remove Claude runtime configuration and update
   current screenshots/instructions. Keep truthful historical evidence archived. Upload.
3. Real Codex morning/confirmation and protection verification, regression suite,
   independent review, evidence report and final upload.

## Safety and interfaces

Codex starts in data/generated with workspace-write, approvals never, command
network disabled, no additional writable roots, and user MCP servers
explicitly disabled for the session. Plugin defaults are disabled; plugin tool
calls are denied by the reviewed hook. Before launch an OS-sandbox probe must reject
write-open of a protected source. Native skill discovery uses .agents/skills.
Project hooks are reviewed/trusted through Codex /hooks; no hook-trust bypass in
normal planner launches. An untrusted/missing hook must not grant source writes:
OS sandbox still protects the repository outside generated output.

Only explicit, narrowly parsed cat/helper reads and a quoted JSON heredoc into the
validated file helper are permitted by PreToolUse. apply_patch/other code tools,
MCP, subagents and arbitrary shell commands are denied. The helper validates schema,
source IDs, fixed events and safe paths itself before atomic generated writes.
Notes/plan save remains contingent on conversational agreement. The helper and
sandbox do not independently prove that a human agreed.

Retain npm run planner and planner:demo. No API key or model gateway is added;
use the installed Codex CLI's existing ChatGPT login. Keep user's model choice.
