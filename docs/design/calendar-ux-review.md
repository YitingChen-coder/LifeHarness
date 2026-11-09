# Calendar workspace UX review

The owner identified hidden scheduling and a blocking chat as the main friction.
Browser plugin discovery returned no browser sessions, so captures and interaction
checks used the project's installed testing Chromium/Playwright without a personal
profile. No saved Product Design context was present.

1. **Previous workspace — needs change.** Fresh capture calendar-before/01-board.png
   shows task columns dominating the page, with actual schedule behind a button.
   Make the time grid the default; keep task execution under a named Tasks tab.
2. **Previous conversation — needs change.** calendar-before/02-chat.png shows a
   backdrop covering the workspace. It prevents comparing the plan with commitments.
   Replace it with a persistent desktop right panel and keep calendar controls usable.
3. **Current calendar — verified.** calendar-workspace.png shows fixed commitments
   directly, classes/interviews in separate colors, deadlines outside timed blocks,
   and overlap lanes. Day/Week, Today, date and week navigation work. Confirmed
   plans across the entire week are loaded, rather than only the selected day.
4. **Current assistant — verified.** calendar-assistant.png shows the panel beside
   the calendar. Validated proposals have dashed calendar previews; refusal does
   not save; explicit confirmation refreshes solid scheduled task blocks. The
   composer remains reachable while the conversation/proposal scrolls.
5. **Phone — verified with limits.** calendar-mobile.png uses Day by default; no
   document horizontal overflow at 320/390px. The assistant is stacked below and
   reached from its action. Timetable and transcript can scroll independently.

Accessibility: use named controls, native buttons/date input, visible times, kind
legend and explicit Draft text rather than color alone. Darkened event/axis text
for legibility. Keyboard flow remains untrapped outside actual task/career dialogs.
Screenshots alone cannot establish WCAG compliance or screen-reader quality.
