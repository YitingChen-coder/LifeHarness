# Task board visual QA

Source: docs/design/task-board-target.png (third displayed concept).
Viewport: 1487x1058 CSS pixels, density 1; source and implementation both 1487x1058.
Initial comparison: artifacts/board-comparison.png; focused card comparison:
artifacts/board-detail-comparison.png. Phone: artifacts/board-phone.png.

The comparison uses a browser-only four-task subset of real source records, with
one in progress and one done. No source files or persisted human state are changed.
Source mock counts are inconsistent; implementation uses correct derived counts.

## Initial findings

- P1 Typography: card names/context and toolbar/focus labels remain noticeably
  smaller than the selected image. Increase desktop titles to 20px, context 15px,
  metadata 14px and focus label 18px; retain readable phone sizing.
- P2 Layout rhythm: extra persistence/date status row pushes focus/board below the
  reference. Move supplemental controls into the available desktop header space;
  preserve column scrolling and keep next-event strip in the viewport.

final result: blocked
