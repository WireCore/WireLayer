---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

Forms: `useUnsavedChanges(isDirty, { message? })` in `@wirecore/wirelayer-vue/form` and `@wirecore/wirelayer-react/form`
asks before the page is left with unsaved input. All registered forms share one list – leaving asks once with
`confirm()` however many forms changed; `beforeunload` only while one is changed; unmounting unregisters. Router
independent: `unsavedChangesGuard(to, from)` goes into the router (Vue Router: `router.beforeEach(unsavedChangesGuard)`),
only the query or hash changing does not ask; `confirmLeave()` for own links. New text `unsavedChanges.leave` in every
language.
