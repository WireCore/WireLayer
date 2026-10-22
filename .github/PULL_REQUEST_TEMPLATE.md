## What and why

<!-- In short: what changes, which issue does it solve -->

## Checklist

- [ ] Vue and React with an identical API and identical DOM (parity case in `packages/parity/src/cases.ts`)
- [ ] Accessibility according to WCAG 2.2 AA – keyboard, focus, names, states (rules in docs/accessibility.md, workflow in CONTRIBUTING.md)
- [ ] Stories in both Storybooks, texts in English
- [ ] Tests: `pnpm lint`, `pnpm typecheck`, `pnpm test` (targeted E2E specs for interaction)
- [ ] AI docs updated (`pnpm --filter @wirecore/wirelayer-mcp collect`), changeset added (`pnpm changeset`)
- [ ] New dependencies: license on the allowlist (`pnpm licenses:check`), optional as a peerDependency
- [ ] All commits with `Signed-off-by` (`git commit -s`, [DCO](https://developercertificate.org))
