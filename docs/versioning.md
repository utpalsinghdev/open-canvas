# App versioning with Changesets

Changesets plans semantic versions and writes release notes. Git commits still identify the exact frozen runtime snapshot. A version number does not replace a commit ID or automatically deploy the app.

## Record a change

On the feature branch/worktree, after implementing a meaningful user-visible change:

```sh
npm run changeset
```

Select `open-cavas`, choose patch/minor/major, and write a short user-facing summary. Commit the generated `.changeset/*.md` entry with the feature. Multiple entries can accumulate before one release. Documentation-only changes do not need an entry unless they materially affect the shipped product.

```sh
npm run changeset:status
```

This reports pending changes without consuming them or bumping versions.

## Apply a version release

After approved features are merged, and when a version bump is authorized:

```sh
npm run version:apply
```

Changesets consumes pending entries, updates package.json, and generates or extends CHANGELOG.md. The script also refreshes package-lock.json with npm's package-lock-only mode and install scripts disabled. Review the diff and commit package.json, package-lock.json, CHANGELOG.md, and consumed Changeset deletions as one version change.

Then use the existing deployment workflow:

```sh
npm run release:main
```

This requires clean committed main and prepares its frozen snapshot. Deliberately restart the main frontend and MCP clients at the agreed release window. See [runtime.md](runtime.md). Neither Changesets nor version:apply restarts services.

## Policy

- Current package is private. `privatePackages.version` is true so Changesets includes it.
- `privatePackages.tag` is false. No automatic Git tags or npm publishing are configured.
- `commit` is false. Review and create the version commit deliberately.
- Base branch is main. Access is restricted; package.json remains `private: true`.
- Semantic version guidance: patch for compatible fixes; minor for features; major for breaking consumer-facing interfaces. While the app is 0.x, use a minor release to communicate intentional breaking changes and explain them in the notes. Changesets applies the explicitly selected bump; it does not infer API compatibility.
- No GitHub Actions release bot, publication token, or public release automation was added.
- Installing this tooling does not retroactively invent a changelog for earlier work. The first pending patch entry covers this setup; package version stays unchanged until version:apply is requested.
