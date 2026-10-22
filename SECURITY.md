# Security

## Reporting a vulnerability

Please do **not** report security vulnerabilities as a public issue. Report them confidentially via
[GitHub Security Advisories](https://github.com/WireCore/WireLayer/security/advisories/new) (“Report a vulnerability”).
Helpful details: the affected package and version, a description, steps or an example to reproduce it, and the
possible impact.

We acknowledge the report within a week, agree on a timeline for the fix and credit the reporter in the advisory if
they wish.

## Supported versions

Before 1.0.0, only the latest minor version receives security fixes.

## Notes for users

- Components never render content as HTML (`v-html`/`dangerouslySetInnerHTML`); `Markdown` only allows http(s),
  mailto, tel and relative links.
- `Editor` returns HTML from Tiptap – sanitize it on the server before storing it or displaying it in other contexts.
- `PdfViewer` does not set up pdf.js scripting (JavaScript in PDFs does not run); keep `pdfjs-dist` up to date.
