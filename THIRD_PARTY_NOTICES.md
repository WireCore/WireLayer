# Third-party notices

WireLayer (the `@wirecore/wirelayer-*` packages) is released under the [MIT License](LICENSE). The JavaScript packages do not bundle
third-party code: every dependency and peer dependency is installed from npm and ships its own licence. This file
lists what is redistributed inside our packages and the licences that are not MIT/ISC/BSD. `pnpm licenses:check`
checks the dependency licences against an allowlist ([scripts/check-licenses.ts](scripts/check-licenses.ts)).

## Bundled in `@wirecore/wirelayer-css`

`@wirecore/wirelayer-css` is the only package that redistributes third-party material (details and licence texts in
[packages/css/THIRD_PARTY_NOTICES.md](packages/css/THIRD_PARTY_NOTICES.md)):

| Material                                                                         | Licence                   | Where                                                      |
| -------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------- |
| Tailwind CSS preflight and theme layer (Tailwind Labs, Inc.)                     | MIT                       | compiled into `dist/wirecore.css` (licence banner kept)    |
| Schibsted Grotesk (© 2023 The Schibsted-Grotesk Project Authors), via Fontsource | SIL Open Font License 1.1 | `dist/fonts/*.woff2`, licence text in `dist/fonts/OFL.txt` |
| JetBrains Mono (© 2020 The JetBrains Mono Project Authors), via Fontsource       | SIL Open Font License 1.1 | `dist/fonts/*.woff2`, licence text in `dist/fonts/OFL.txt` |

The fonts stay under the OFL – the MIT License of WireLayer does not cover them. Neither font declares a Reserved Font
Name; the files are Fontsource's unmodified subsets.

`@wirecore/wirelayer-tokens` and `@wirecore/wirelayer-native` only reference the font packages (`@fontsource-variable/*`,
`@expo-google-fonts/*`) as dependencies; those packages ship their own OFL text.

## Not bundled

- **Lucide icons** (`@lucide/vue`, `lucide-react`, `lucide-react-native`; ISC, some icons MIT from Feather): imported
  as components, no icon paths are copied into our sources or CSS.
- **Shiki** (`/code`, optional peer, MIT): only `shiki/core` and the grammars listed in `codeLanguages`
  (`packages/recipes/src/code.ts`) are loaded – MIT or the permissive TextMate bundle licence. Grammars passed via the
  `languages` prop are the user's responsibility (some of Shiki's grammars are GPL-3.0, MPL-2.0 or unlicensed).
- **Tiptap** (`/editor`, optional peer): only MIT packages from the public `@tiptap/*` scope, no `@tiptap-pro/*`.
- **Uniwind** (peer of `@wirecore/wirelayer-native`): the free MIT package `uniwind`, not the commercial `uniwind-pro`.

## Apache-2.0 packages

Compatible with the MIT License; they are installed by the user from npm (licence text included there) and have no
`NOTICE` file to pass on:

- `pdfjs-dist` – optional peer of the `/pdf` subpaths of `@wirecore/wirelayer-vue` and `@wirecore/wirelayer-react` (Mozilla). Apps that
  serve the pdf.js worker or other pdf.js files themselves keep its licence text with them; `standard_fonts/` and
  `cmaps/` carry their own licence files (Foxit, Liberation, Adobe CMaps) – copy them along.
- `@internationalized/date` (Adobe) – dependency of `@wirecore/wirelayer-vue`, `@wirecore/wirelayer-react` and Ark UI;
  `@internationalized/number` (Adobe) – dependency of Ark UI.
- `@swc/helpers` – dependency of Ark UI.
- `@modelcontextprotocol/sdk` (dependency of `@wirecore/wirelayer-mcp`) is MIT in the installed version; upstream moves new
  contributions to Apache-2.0 – recheck the licence field when upgrading.

## Build tools

`lightningcss` (MPL-2.0) comes with Tailwind CSS and Uniwind as an unmodified build tool; nothing of it is
redistributed. Development-only tools (Storybook, Vite, Vitest, Playwright, axe-core, the demo apps) are not part of
the published packages.
