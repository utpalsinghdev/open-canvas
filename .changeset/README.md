# Changesets

Run `pnpm run changeset` on a feature branch to record a user-visible change for `open-cavas`. Choose patch for fixes, minor for features, or major for breaking changes. Commit the generated Markdown file with the feature.

Run `pnpm run changeset:status` to inspect pending releases. Before an authorized app release, run `pnpm run version:apply` to consume pending entries, bump package.json/pnpm-lock.yaml, and generate CHANGELOG.md. Inspect and commit those changes before preparing the main runtime snapshot.

The package remains private. Private package versioning is enabled; tagging and automatic commits are disabled. No npm publication workflow is installed. A version bump does not build, deploy, restart services, or reconnect agents. Follow docs/runtime.md for those separate release steps.
