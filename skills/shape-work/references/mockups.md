# Frontend mockups

Read this before producing any frontend mockup, and again in `deliver-work` before writing the first line of UI code for a feature.

## Bootstrap: the design system is fetched, never invented

1. Locate the design system. Check, in order: the project policy's design-system pointer, token files (CSS variables, Tailwind config, theme files), the component library, and two or three existing views.
2. Report what was found: token source, component inventory relevant to this feature, existing patterns for the surface being changed.
3. The mockup may only use tokens and components from that report. A gap is stated as a gap ("no empty-state pattern exists; minimal proposal below, clearly marked as new") — new inventions stay visibly separated from existing facts.

## Fidelity scaling

- **Wireframe** (small features): boxes and labels, real component names from the inventory, annotated states. Fast to produce, fast to reject.
- **HTML/CSS proposal** (larger features): renderable markup using the project's actual tokens/classes, viewable in a browser. Not production code — a proposal to approve or redirect.

State which level was chosen and why in one sentence.

## Checklist — every rule is mechanically checkable and carries its why

- Wide content (tables, diagrams, code) scrolls inside its own container — the page body never scrolls horizontally.
- Layout uses relative units and flex/grid — it must survive mobile, tablet, and desktop widths.
- If the project has themes, the mockup shows both light and dark — theme styling must win in both directions.
- Interactive elements show hover and focus states — keyboard users see where they are.
- Empty, loading, and error states are drawn, not implied — these are where designs usually break.
- Feedback on interaction appears under ~250 ms and never blocks the next action — perceived speed is a framework default that project policy may override.
- The design follows the project's own identity — it does not imitate the look of well-known apps.

## Approval

The mockup is part of the feature checkpoint: the user approves or redirects it before implementation starts. An unapproved mockup blocks UI code for that feature.
