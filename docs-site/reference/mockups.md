# Frontend mockups

Read this before producing any frontend mockup in [`shape-work`](/skills/shape-work), and again in
[`deliver-work`](/skills/deliver-work) before writing the first line of UI code for a feature.

## Bootstrap: the design system is fetched, never invented

1. **Locate the design system.** Check, in order: the project policy's design-system pointer, token
   files (CSS variables, Tailwind config, theme files), the component library, and two or three
   existing views.
2. **Report what was found:** the token source, the component inventory relevant to this feature, and
   the existing patterns for the surface being changed.
3. **Use only what the report contains.** A gap is stated as a gap — "no empty-state pattern exists;
   minimal proposal below, clearly marked as new" — and new inventions stay visibly separated from
   existing facts.

## Fidelity scaling

A **wireframe** suits small features: boxes and labels, real component names from the inventory,
annotated states. Fast to produce, fast to reject.

An **HTML/CSS proposal** suits larger features: renderable markup using the project's actual tokens and
classes, viewable in a browser. It is not production code — it is a proposal to approve or redirect.

State which level was chosen, and why, in one sentence.

## Checklist

Every rule is mechanically checkable and carries its reason.

- Wide content — tables, diagrams, code — scrolls inside its own container, because the page body must
  never scroll horizontally.
- Layout uses relative units and flex or grid, because it has to survive mobile, tablet and desktop
  widths.
- If the project has themes, the mockup shows both light and dark, because theme styling must win in
  both directions.
- Interactive elements show hover and focus states, because keyboard users need to see where they are.
- Empty, loading and error states are drawn, not implied, because that is where designs usually break.
- Feedback on interaction appears under roughly 250 ms and never blocks the next action; perceived
  speed is a framework default that project policy may override.
- The design follows the project's own identity rather than imitating the look of a well-known app.

## Approval

The mockup is part of the feature checkpoint. The user approves or redirects it before implementation
starts, and an unapproved mockup blocks UI code for that feature.
