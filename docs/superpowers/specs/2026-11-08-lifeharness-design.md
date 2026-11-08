# Approved LifeHarness design

Implement the user-approved local-first Claude Code + Next.js dashboard plan.
Use TypeScript, Tailwind and JSON; English UI/docs, Chinese progress updates.
Two synthetic source files are immutable to the planner. Only confirmed plans
and memory go into data/generated. Skills are discoverable from natural prompts.
Do not deploy, record a demo, post to Slack, or submit to Classroom automatically.

## Approaches

Selected: terminal Claude Code plus read-only local dashboard. This directly
shows context, skill selection and hooks, with no API-key web chat service.
Rejected: browser chat adds an unnecessary model gateway; a static HTML page
would require more manual refresh and file plumbing.

## Approved execution

Ten verified commits/uploads: bootstrap; architecture; sources; context and
validation; skill/launcher; security hook; read API/polling; dashboard; end-to-end
verification; setup/demo documentation. Upload after each, report the commit,
then continue. Preserve remote history and never force push. Default daily
schedule is Chicago 09–18 with lunch free. UI and documentation are English.
