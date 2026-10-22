# Contributing to WireLayer

## Setup – Docker only

Node and pnpm run in the container; locally you only need Docker.

```sh
docker compose up                                    # installs everything, starts the Storybooks (:6006–6010) and Expo (:8081)
docker compose run --rm workspace pnpm <command>     # any package action (add, build, test …)
docker compose run --rm workspace                    # shell in the container
```

If another project uses port 8081, set `EXPO_PORT` in `.env` (see `.env.example`).

| Command                                                                             | Purpose                                                     |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `docker compose up`                                                                 | Install dependencies, start all Storybooks                  |
| `docker compose run --rm workspace pnpm add <pkg> --filter @wirecore/wirelayer-vue` | Add a package                                               |
| `docker compose run --rm workspace pnpm build` / `test` / `lint`                    | Build, tests, lint                                          |
| `docker compose run --rm workspace pnpm licenses:check`                             | Check the dependencies' licenses against the allowlist      |
| `docker compose run --rm workspace pnpm changeset`                                  | Add a changeset                                             |
| `docker compose run --rm workspace`                                                 | Shell in the container                                      |
| `docker compose run --rm e2e`                                                       | Keyboard/interaction tests in the browser (all Storybooks)  |
| `docker compose run --rm a11y`                                                      | axe in the browser against all stories (Storybooks running) |

| URL                   | Service                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| http://localhost:6006 | Storybook (getting started, foundations, Vue, React, React Native, HTML) |
| http://localhost:6007 | Storybook Vue                                                            |
| http://localhost:6008 | Storybook React                                                          |
| http://localhost:6009 | Storybook React Native (react-native-web)                                |
| http://localhost:6010 | Storybook HTML / CSS (`@wirecore/wirelayer-css`)                         |
| http://localhost:8081 | Expo demo app (web), host port via `EXPO_PORT`                           |
| http://localhost:3000 | Nuxt demo app (`docker compose --profile apps up`)                       |
| http://localhost:3001 | Next.js demo app (`docker compose --profile apps up`)                    |

Files: [docker-compose.yml](docker-compose.yml), [docker/node.Dockerfile](docker/node.Dockerfile),
[.env.example](.env.example).

## A new component

This order keeps Vue, React, React Native and HTML in sync:

1. **Recipe** in `packages/recipes/src` (`tv()`) with all variants. Tailwind classes only live here – as complete,
   literal strings (Tailwind does not find class names that are put together).
2. **Vue** (`packages/vue/src/components/<Name>`) and **React** (`packages/react/src/components/<Name>`) with an
   identical prop API: the same names and defaults, `v-model` ↔ `value`/`onValueChange`, `class` ↔ `className`.
   Interactive components build on Ark UI.
3. **Parity**: a case in `packages/parity/src/cases.ts` – checks the same DOM, axe and server rendering for both.
   Behavior (keyboard, events) in the behavior tests, browser tests in `packages/parity/e2e`.
4. **Stories** in both Storybooks with the same title and the same examples.
5. **React Native** (`packages/native`) if the component is needed on mobile: recipe in `packages/recipes/src/native`
   (same variant names), component, story, `e2e/native` if needed.
6. **HTML** comes automatically: `@wirecore/wirelayer-css` generates the `.wc-*` classes from the recipe. For components
   that work statically, add an example in `packages/css/src/stories` and a case in `e2e/css/parity.spec.ts`.
7. Update the **AI docs**: `docker compose run --rm workspace pnpm --filter @wirecore/wirelayer-mcp collect` (props and
   doc comments end up in `llms.txt` and the MCP server; the test fails otherwise).
8. Add a **changeset**: `docker compose run --rm workspace pnpm changeset`.

Background on the architecture and the pitfalls we already ran into: [docs/architecture.md](docs/architecture.md),
[docs/implementation-notes.md](docs/implementation-notes.md).

## Definition of Done

- [ ] Recipe in `@wirecore/wirelayer-recipes` with all variants; light/dark, all themes, sizes sm/md/lg (where useful)
- [ ] Vue **and** React implementation in TypeScript with an identical prop API (names, defaults, events ↔ callbacks)
      and identical DOM (parity test)
- [ ] Props types exported and derived from the recipe variants
- [ ] `v-model` (Vue) or controlled/uncontrolled (React)
- [ ] Keyboard interaction and visible focus (`focus-visible:outline-2 outline-offset-2`)
- [ ] Accessibility according to WCAG 2.2 AA ([rules](docs/accessibility.md#rules-for-every-component)): roles, names,
      states, keyboard, visible focus, contrast – axe without violations in jsdom **and** in the browser (all modes and
      themes)
- [ ] Animations only with `motion-safe:`
- [ ] `class`/`className` passed through and merged via `tailwind-merge`
- [ ] Server rendering without DOM access (SSR test via the parity cases)
- [ ] Stories for all variants and states, texts in English
- [ ] Unit and interaction tests, shared parity specs
- [ ] React Native (`@wirecore/wirelayer-native`) if needed on mobile; HTML example if usable without JavaScript
- [ ] Changeset

## Checks

```sh
docker compose run --rm workspace pnpm format       # Prettier
docker compose run --rm workspace pnpm lint
docker compose run --rm workspace pnpm typecheck
docker compose run --rm workspace pnpm test         # contrasts, parity, behavior, SSR, CSS generator
docker compose run --rm workspace pnpm licenses:check  # licenses of the dependencies and peers
docker compose run --rm a11y                        # axe in the browser: every story × mode × theme
docker compose run --rm e2e                         # keyboard/interaction in the browser, HTML ↔ React, screenshots
```

The CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs the same steps, plus the E2E tests with animations.

**Screenshots** (`e2e/visual`): every story of the React, HTML and React Native Storybooks is compared with a reference
image in `packages/parity/e2e/visual/__screenshots__` (light, plus a selection in dark and right-to-left). If the look
changes on purpose, regenerate the images in the container – other systems render fonts differently:

```sh
docker compose run --rm e2e npx playwright test --project visual --update-snapshots
```

New stories get a reference image automatically this way; commit the changed PNGs.

**Demo apps** (`apps/nuxt`, `apps/next`): after `pnpm build`, browser tests (`e2e/apps`) check server rendering,
hydration and interaction against the production servers – always in CI, locally with
`docker compose run --rm -e E2E_APPS=1 e2e npx playwright test --project nuxt --project next`.

## Conventions

- Commits follow [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:` …), in English
- Every commit carries a `Signed-off-by` (`git commit -s`): with it you confirm the
  [Developer Certificate of Origin](https://developercertificate.org) – you have the right to contribute the change under
  the project's MIT license. If it is missing: `git commit --amend -s` or `git rebase --signoff <base>`
- TypeScript strict; relative imports with a `.js` extension, `.vue` for SFCs
- Component names without a prefix (`Button`, not `WcButton`)
- Dependencies: pnpm only installs versions that are older than one day (`minimumReleaseAge`). This lock is not
  circumvented – if pnpm adds `minimumReleaseAgeExclude` to `pnpm-workspace.yaml` itself, remove the entry and choose an
  older version.
- Do not commit tokens or credentials (`.env` is ignored)
- Licenses: the code is [MIT](LICENSE) licensed. New dependencies need an MIT-compatible license (MIT, ISC, BSD,
  Apache-2.0, OFL for fonts; no pro/commercial packages) – `pnpm licenses:check` checks the allowlist in
  `scripts/check-licenses.ts`. What a package ships as third-party content is listed in
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
- How we treat each other: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md); report security issues confidentially
  ([SECURITY.md](SECURITY.md))

## Release

Automated via [Changesets](https://github.com/changesets/changesets) and `.github/workflows/release.yml`:

1. Every change to a package comes with a changeset (`pnpm changeset`)
2. After the merge into `main`, the workflow opens or updates the PR “chore: version packages” (versions and changelogs
   from the changesets)
3. Merging this PR publishes every package whose version is not on npm yet – with provenance, git tags and GitHub
   releases

npm authentication uses [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC, no token): every
package trusts the workflow `release.yml` of `WireCore/WireLayer`. A new package has to be published once with a
short-lived token (repository secret `NPM_TOKEN`) before it can be added as a trusted publisher; remove the secret
afterwards.

The version PR is created with the workflow's `GITHUB_TOKEN`, so it does not trigger the CI. With required status
checks on `main` it needs an admin to merge it – or pass a GitHub App token to the action (`github-token`).
