# Accessibility

**Standard: WCAG 2.2 AA** for all components. Everything that can be automated is built into the components and
checked on every test run. Docs for consumers: Storybook › Getting started › Accessibility.

## Automated checks

- Token contrasts ([packages/tokens/test/contrast.test.ts](../packages/tokens/test/contrast.test.ts)): text ≥ 4.5:1,
  borders of input fields, icons and the focus ring ≥ 3:1, in light and dark, including hover and all themes
- axe in jsdom for every parity case, in Vue **and** React, with a counter-test that axe really finds violations
- axe in a real browser against every story of all Storybooks, in all modes and themes, including rendered contrasts
  ([storybook-a11y.ts](../packages/parity/scripts/storybook-a11y.ts), CI job `a11y`)
- Keyboard tests in a real browser with Playwright: every test runs against Vue **and** React
  ([packages/parity/e2e](../packages/parity/e2e), CI job `e2e`)
- Nothing has been checked manually with screen readers yet (see [roadmap.md](roadmap.md))

## Colors adjusted from the original design

| Token         | Light            | Dark                             | Reason                                          |
| ------------- | ---------------- | -------------------------------- | ----------------------------------------------- |
| `success`     | L 0.55 → 0.47    | –                                | Text on tint and button hover ≥ 4.5:1           |
| `info`        | L 0.55 → 0.50    | –                                | Text on tint (badges) ≥ 4.5:1, also on bg-2     |
| `warn`        | L 0.62 → 0.505   | –                                | Text on white and on tint ≥ 4.5:1, also on bg-2 |
| `danger`      | L 0.55 → 0.515   | –                                | Text on tint ≥ 4.5:1, also on bg-2              |
| `on-success`  | White (new)      | #050505                          | Text on the success button                      |
| `on-danger`   | White            | #050505 (previously white 2.9:1) | Text on the danger button                       |
| `on-info`     | White (new)      | #050505 (new)                    | Text on the info button                         |
| `on-warn`     | White (new)      | #050505 (new)                    | Text on the warn button                         |
| `line-strong` | Black 43 % (new) | White 35 % (new)                 | Borders of input fields ≥ 3:1 (1.4.11)          |

## Rules for every component

These rules are part of the [Definition of Done](../CONTRIBUTING.md#definition-of-done).

- Role, name and state via ARIA: derived automatically from props (`aria-invalid`, `aria-describedby`, `aria-busy`,
  `aria-disabled`, `aria-label` …), using Ark UI's headless logic
- Decorative icons are always `aria-hidden`, icon-only controls require a `label`
- Focus is visible (`focus-visible`) and never lost (loading via `aria-disabled` instead of `disabled`)
- Visible text is always part of the accessible name (2.5.3), e.g. counters in icon buttons
- Color is never the only indicator (1.4.1) – a status always comes with text
- Selected states are also visible in Windows high contrast mode (`forced-colors` with `Highlight`)
- Keyboard interaction according to the ARIA Authoring Practices, with a browser test in `packages/parity/e2e`
- Status changes via live regions (`role="status"` / `role="alert"`)
- Contrast only via tokens; new color pairs are added to the contrast test
- Targets ≥ 24 × 24 px, `motion-reduce` for animations, an outline in `forced-colors`
- Default texts (English) can be translated via props and `LocaleProvider`
