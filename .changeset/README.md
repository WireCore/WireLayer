# Changesets

Every change to a published package gets a changeset:

```sh
docker compose run --rm workspace pnpm changeset
```

On release, `pnpm changeset version` bumps the versions and writes the changelogs (see CONTRIBUTING.md › Release).
