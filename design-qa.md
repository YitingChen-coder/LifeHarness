# Task board visual QA

**final result: passed**

## Target, capture and state

- Selected visual truth: `docs/design/task-board-target.png` (third displayed concept).
- Implementation: `docs/design/task-board-implemented.png`.
- Equal-size full comparison: `docs/design/task-board-comparison.png`.
- Card/column detail comparison: `docs/design/task-board-detail-comparison.png`.
- Phone capture: `docs/design/task-board-phone.png`.
- Desktop: 1487x1058 CSS pixels, deviceScaleFactor 1. Source and implementation both
  1487x1058; comparison canvas 2974x1058. No density/crop normalization needed.
- Phone: 390x844 viewport, full-page capture. No mobile source was supplied, so it
  is checked for readability and behavior rather than claimed as pixel matching.
- The visual fixture filters to four real source tasks and supplies one in progress
  and one done in a browser-only intercepted read response. It never edits source
  files, user progress or AI plans. First-run product data still has all 12 pending.
- Mock progress/counts are inconsistent (3/12, All(3), four visible cards). The
  implementation deliberately uses correct derived counts (1/4 for this fixture).

## Comparison history

1. Initial evidence: `artifacts/board-comparison.png` and
   `artifacts/board-detail-comparison.png`. P1: desktop task/context/filter typography
   too small relative to target. P2: supplementary state row pushed focus/board down.
2. Increased desktop card title/context/metadata to 20/15/14px and focus labels;
   moved supplemental controls into desktop header space. Desktop columns scroll
   independently and next-event strip stays adjacent. Added a bordered Mark done
   action so completion reads as an action, not another metadata link.
3. Recaptured both full view and focused card regions after these changes; opened
   the combined source/implementation images for direct comparison. No actionable
   P0/P1/P2 drift remains. Latest evidence is saved under docs/design as above.

## Required fidelity surfaces

- **Typography:** bold sans-serif hierarchy, large Task board title, readable task
  titles and distinct supporting metadata. Arial/system fallback is used for local
  reliability; reference's raster font has no supplied font metadata. Full source
  task titles are kept, so some wrap where the mock's shortened labels do not.
- **Layout:** graphite icon rail, header, violet focus strip, search/filter row,
  three semantic lanes and next-event strip match the chosen composition. Extra
  status selectors, timer reset and save/plan indicators are functional additions.
- **Colors:** charcoal rail, white workspace, violet actions, pale violet active
  lane, sage done lane and amber deadlines. Flat tokens preserve the design intent.
- **Assets/icons:** the target is UI with stroke icons, not photography/illustration.
  Existing Lucide stroke icons represent the shown controls and pulse brand mark;
  no fake raster art, custom inline SVG or decorative asset placeholders were added.
- **Copy/content:** source course/company names and deadlines remain authoritative;
  no fabricated progress, shortened deadlines or invented completion dates. Jobs
  and schedule live in drawers rather than adding a second dashboard to the board.

## Functional and responsive checks

- Seven browser tests against a production server cover task filtering/search,
  persistent status menus and drag/drop, timer pause/reset/reload, confirmed plan
  refresh, malformed/offline data retention, modal focus, job tracker and save errors.
- No page errors observed in the desktop interaction test; no page overflow at
  1487, 1024, 768, 390 and 320px. Phone lanes stack with full task titles and controls.
- Keyboard/touch status controls complement pointer dragging. Dialogs wrap focus,
  support Escape and restore focus. Reduced-motion preference is respected.
- Screenshots do not prove complete accessibility conformance; screen reader and
  browser/OS combinations beyond the exercised Chromium setup were not audited.

## Follow-up polish

- P3: reference uses slightly larger display icons and some raster typography
  differs from the local fallback. Current body/task sizes remain readable.
- The reference omits date shortcuts, error states, timer reset and selectors;
  those useful controls are retained with restrained hierarchy.

## Homepage addition

The requested title homepage uses the existing violet/charcoal brand language, a
large LifeHarness heading, explanatory copy, real-board screenshot and clear
workspace/sample-day links. Desktop capture: docs/images/home.png. Phone capture
was inspected after image decoding at 390x844; no duplicate DOM, clipping or page
overflow. Homepage navigation and 320/390/768/1487px layouts pass browser coverage.
Task board is now /board; old root date links redirect without losing the date.
