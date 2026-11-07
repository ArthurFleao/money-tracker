# Design system

> Direction and rules: [PLAN.md §7](../PLAN.md#7-visual-design--motion).
> Tokens live in [`src/styles/index.css`](../src/styles/index.css) (Tailwind v4
> `@theme`); components live in [`src/shared/ui/`](../src/shared/ui/).

**Direction:** premium fintech, calm and confident — deep neutral surfaces,
one vivid violet → cyan accent gradient, generous whitespace, crisp tabular
numbers. Dark mode is the hero; light mode is equally polished.

## Tokens

All colors are defined in OKLCH. Light values are declared in `@theme`; the
`.dark` class overrides the same variables, so every utility switches theme
automatically.

### Semantic colors

| Token                                  | Utility examples                       | Use                              |
| -------------------------------------- | -------------------------------------- | -------------------------------- |
| `--color-bg`                           | `bg-bg`                                | page background                  |
| `--color-surface`                      | `bg-surface`                           | cards, sidebar                   |
| `--color-surface-elevated`             | `bg-surface-elevated`                  | dialogs, inputs, active tab      |
| `--color-border`                       | `border-border`                        | hairlines                        |
| `--color-text` / `--color-text-muted`  | `text-text`, `text-text-muted`         | body / secondary text            |
| `--color-accent` / `--color-accent-2`  | `bg-accent`, `from-accent to-accent-2` | primary actions, gradient        |
| `--color-accent-fg`                    | `text-accent-fg`                       | text on accent                   |
| `--color-income` / `--color-expense`   | `text-income`, `text-expense`          | earnings / debts                 |
| `--color-warning`                      | `text-warning`                         | approaching the floor            |
| `--color-danger` / `--color-danger-fg` | `bg-danger text-danger-fg`             | destructive actions, below floor |

**Color is never the only signal**: income/expense also get icons or ± signs.

### Wallet palette

`--color-wallet-{violet,indigo,sky,cyan,teal,emerald,lime,amber,orange,rose}`
(600 shades in light, 400 in dark). Wallets store the hue name (`'violet'`),
never a hex value.

### Radius, elevation, type

- Radius: `rounded-sm` 8 px · `rounded-md` 12 px · `rounded-lg` 16 px · `rounded-xl` 24 px · `rounded-full`.
- Elevation: `shadow-elevation-1|2|3` plus `shadow-glow` (accent glow for hover/focus on primary elements).
- Type scale (Inter Variable, self-hosted): `text-xs` 12 · `sm` 14 · `base` 16 · `lg` 20 · `xl` 24 · `2xl` 32 · `3xl` 48 · `4xl` 64.
- Figures are always `tabular-nums` (set on `body`).
- Breakpoints: Tailwind defaults; the sidebar appears at `md`, two-column dashboards at `lg`.

## Motion

- Durations (`src/shared/motion/transitions.ts`): micro 150 ms, standard 240 ms,
  expressive 500 ms. Nothing on a critical path exceeds 600 ms.
- Entrances ease out (`EASE_OUT`, expo-out bezier); springs for layout.
- Page transition: fade + 8 px rise (`pageVariants`).
- Dialogs, sheets, tooltips and skeleton shimmer use CSS keyframes
  (`--animate-*` tokens) so Radix can run exit animations before unmounting.
- **Reduced motion:** `MotionConfig reducedMotion="user"` covers Motion
  components; a global CSS rule neutralizes CSS animations/transitions;
  imperative tweens check `usePrefersReducedMotion()`.

## Components (v1)

| Component                                                                            | Notes                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                                             | `variant`: primary · secondary · ghost · danger; `size`: sm · md · lg · icon; `loading` (spinner + `aria-busy`); `asChild` to style a `Link`. Defaults to `type="button"`.                                            |
| `Card` (+ `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) | `elevation` 1–3, `interactive` adds lift + glow.                                                                                                                                                                      |
| `Input`                                                                              | Always labelled (`label`, optional `hideLabel`); `description` and `error` are wired to `aria-describedby` / `aria-invalid`.                                                                                          |
| `Select`                                                                             | Styled **native** `<select>` (best mobile pickers and a11y); `options`, optional `placeholder`.                                                                                                                       |
| `Switch`                                                                             | Radix switch with visible label and optional description.                                                                                                                                                             |
| `Dialog` / `DialogContent` / `SheetContent`                                          | Radix dialog. `title` is required (accessible name); `description`, `hideTitle`, `footer`. Sheets slide from the `bottom` (mobile) or `right`. Focus is trapped, <kbd>Esc</kbd> closes, focus returns to the trigger. |
| `Tabs` (+ `TabsList`, `TabsTrigger`, `TabsContent`)                                  | Radix tabs, arrow-key navigation.                                                                                                                                                                                     |
| `Tooltip`                                                                            | Hover **and** focus; supplementary hints only (touch users cannot hover). `TooltipProvider` is mounted in `AppProviders`.                                                                                             |
| `Skeleton`                                                                           | `aria-hidden` shimmer block; size it like the final content.                                                                                                                                                          |
| `EmptyState`                                                                         | Icon, title, description, primary action — every list needs one.                                                                                                                                                      |
| `AnimatedNumber`                                                                     | Tweens integer values (e.g. minor units) with a `format` function; flashes income/expense color on increase/decrease; `animateOnMount` for hero numbers; screen readers only get the final value.                     |
| `ThemeToggle`                                                                        | Light / Dark / System segmented control built on native radios.                                                                                                                                                       |

Utilities: `cn()` merges class names and resolves Tailwind conflicts.

## Do / don't

- **Do** use semantic tokens (`bg-surface`, `text-text-muted`) — never raw palette colors in features.
- **Do** keep touch targets ≥ 44 px on mobile.
- **Do** put every user-facing string in `src/shared/i18n/strings.ts`.
- **Don't** animate anything that blocks input, or loops forever.
- **Don't** rely on color alone; pair it with an icon, sign or label.
- **Don't** put essential information only in a tooltip.
