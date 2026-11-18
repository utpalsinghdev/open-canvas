# App versioning with Changesets

Changesets plans semantic versions and writes release notes. Git commits still identify the exact frozen runtime snapshot. A version number does not replace a commit ID or automatically deploy the app.

## Record a change

On the feature branch/worktree, after implementing a meaningful user-visible change:

```sh
pnpm run changeset
```

Select `@open-cavas/web`, choose patch/minor/major, and write a short user-facing summary. Commit the generated `.changeset/*.md` entry with the feature. Multiple entries can accumulate before one release. Documentation-only changes do not need an entry unless they materially affect the shipped product.

```sh
pnpm run changeset:status
```

This reports pending changes without consuming them or bumping versions.

## Apply a version release

After approved features are merged, and when a version bump is authorized:

```sh
pnpm run version:apply
```

Changesets consumes pending entries, updates `apps/web/package.json`, and generates or extends `apps/web/CHANGELOG.md`. The script also refreshes pnpm-lock.yaml in lockfile-only mode with install scripts disabled. Review the diff and commit the affected package manifests, pnpm-lock.yaml, apps/web/CHANGELOG.md, and consumed Changeset deletions as one version change.

Then use the existing deployment workflow:

```sh
pnpm run release:main
```

This requires clean committed main and prepares its frozen snapshot. Deliberately restart the main frontend and MCP clients at the agreed release window. See [runtime.md](runtime.md). Neither Changesets nor version:apply restarts services.

## Policy

- The app version and changelog belong to `@open-cavas/web`. Use the new changelog entry as the basis for the GitHub Release notes; mention any upgrade and compatibility caveats. Editor Help shows the current version's bundled notes, and installed `open-cavas changelog` prints the full bundled history. `open-cavas changelog --latest` reads the GitHub Release body. The root is a private, unversioned command workspace. Internal packages remain private source dependencies. All workspace packages are private. `privatePackages.version` is true so Changesets includes it.
- `privatePackages.tag` is false. No automatic Git tags or npm publishing are configured.
- `commit` is false. Review and create the version commit deliberately.
- Base branch is main. Access is restricted; every package remains `private: true`.
- Semantic version guidance: patch for compatible fixes; minor for features; major for breaking consumer-facing interfaces. While the app is 0.x, use a minor release to communicate intentional breaking changes and explain them in the notes. Changesets applies the explicitly selected bump; it does not infer API compatibility.
- The manually dispatched local archive workflow builds downloadable CI artifacts. It does not tag, attach assets to a GitHub Release, publish to npm, or restart a service. Attach all matching archives and checksums to the draft before marking it latest, and only publish as part of an authorized release; see [local installation](install.md#prepare-release-assets).
- Installing this tooling does not retroactively invent a changelog for earlier work. The first pending patch entry covers this setup; package version stays unchanged until version:apply is requested.
