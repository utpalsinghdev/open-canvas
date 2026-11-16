# Contribute to Open Cavas

Thanks for helping improve Open Cavas. Bug reports, design feedback, documentation, accessibility improvements, and code contributions help make the editor more useful.

Visit [open-canvas.xyz](https://open-canvas.xyz) for the project website. Use this repository's documentation and issues for setup, questions, and contributions.

Read [AGENTS.md](AGENTS.md), [product scope](PRODUCT.md), and the [design rules](DESIGN.md) before changing behavior. Use [feature delivery](docs/feature-delivery.md) to define a complete user outcome. Keep external reference projects read-only and write original implementation code.

## Choose a contribution

| Contribution | Where to start |
| --- | --- |
| Editor behavior, controls, or accessibility | [Web editor](apps/web/src), [shared engine](packages/engine/src), and [design rules](DESIGN.md) |
| Documents, project navigation, or saving | [Workspace schemas](packages/document/src/workspace.ts) and [browser persistence](apps/web/src/workspace), [workspace contracts](docs/workspace.md), and [document format](docs/document-format.md) |
| MCP tools or service behavior | [MCP code](packages/mcp/src), [local service](apps/local-service/src), and [capabilities](docs/mcp-capabilities.md) |
| Setup, versioning, or runtime tooling | [Scripts](scripts) and [runtime guide](docs/runtime.md) |
| Shared contribution skills | [Project skills](.agents/skills) and [skill setup](docs/contributor-skills.md) |
| Docs, examples, or reproduction details | [README](README.md), [project docs](docs), and existing issues |

You can propose a small correction directly. For a larger feature, migration, dependency, or runtime change, describe the intended outcome in an issue before investing in implementation. This helps agree scope and compatibility. If you are unsure where to start, open an issue with your question.

## Report a problem or request a feature

Search open and closed issues first. Use the bug report form for observed failures and the feature request form for a proposed workflow. Blank issues remain available for other topics.

Use a specific title with a bracketed type, such as `[Bug] Preserve text edits when switching pages` or `[Feature Request] Add nested frame reparenting`.

For bugs, provide a minimal reproduction, actual and expected behavior, release or source version when known, and browser/runtime details. For save failures, distinguish an edit appearing on screen from surviving reload or native backup restore. Use disposable content and never risk valuable work to reproduce a failure.

For features, describe the problem, requested workflow, acceptance criteria, and alternatives. Separate essentials from later ideas. A new design capability needs its affected UI, MCP, persistence, history, and import/export paths considered together.

Public reports and images must omit credentials, browser tickets, broker metadata, private artwork, and private planning documents.

## Set up locally

Use Node.js **24.22.1** and pnpm **12.21.0**. The repository pins both versions. Select Node with your existing version manager; Corepack must be on PATH for the commands below. You do not need Cloudinary credentials unless you use the screenshot upload helper, and local editing needs no cloud account.

Fork the repository if you need your own push destination, then clone your fork. From your primary checkout, create a feature worktree:

```sh
git worktree add ../open-cavas-my-change -b feat/my-change
cd ../open-cavas-my-change
corepack pnpm install --frozen-lockfile
corepack pnpm run dev
```

The development frontend uses `http://localmachine:5188`; its private broker uses loopback port 4785. Check both ports before starting. If another worktree uses them, choose an available app/broker pair as described in [runtime isolation](docs/runtime.md). Never reuse main's ports or service data. A standalone fork does not need a main release to run development.

## Implement and verify

Use a feature branch in a separate worktree and follow [runtime isolation](docs/runtime.md). Keep main's ports, service data, and committed snapshot separate from development. Do not restart another contributor's services.

Use React, TypeScript, Vite, Tailwind, Zustand, and Zod as established in the project. Keep changes focused, validate external documents at boundaries, and preserve IDs, history, and saved data. Match existing code style and add comments only when they explain useful intent. Explain why a new dependency is needed. Update affected product, controls, format, architecture, and runtime docs.

Inspect current CI before editing. For behavior changes, run:

```sh
corepack pnpm run check
corepack pnpm run build
```

Exercise relevant browser and MCP journeys as well. For documentation-only changes, check the diff and links unless CI requires more. Do not add test files or disguised suites unless explicitly requested. Report automated-coverage gaps honestly.

For features or fixes that affect the shipped product, add a Changeset with `corepack pnpm run changeset`. Describe the user-visible result. A Changeset records a future version change; it does not authorize deployment. See [versioning](docs/versioning.md).

## Write a pull request

Use `type(scope): description` for the title, with a lowercase type, meaningful scope, imperative description, and no trailing period. For example, `fix(text): preserve edits when switching pages`.

The [PR template](.github/pull_request_template.md) prompts for the problem, visible result, affected areas, acceptance criteria, reproduction, screenshots, verification, and docs. Keep applicable sections and scale the explanation to the change. Do not publish unused placeholders.

- Lead with the concrete problem and resulting behavior. Describe where users discover a new action and identify changed defaults.
- Link related issues. Use `Closes #N` only when the PR resolves that issue on merge.
- Explain the implementation mechanism, preserved behavior, and relevant compatibility or recovery implications.
- Record each requested outcome as verified, unmet, or unverified. Listing a limitation does not remove an acceptance criterion.
- Give exact relevant commands and observed outcomes. Include real workflow evidence and material verification gaps. Keep the complete local validation ledger and incidental machine details private.
- Link updated docs, or explain why documentation changes are unnecessary.

Write direct, specific English. Do not invent personal experience, measurements, or results. Avoid em dashes, exaggerated praise, and generic filler. Read the published title, body, issue links, and image links back against the final draft.

For visible UI changes, attach labeled Before/After screenshots through the [shared screenshot skill](.agents/skills/attach-screenshot-to-pr/SKILL.md). Include the entry point, comparable states and viewport sizes, and narrow views where affected. Use your own credentials as described in [contributor skill setup](docs/contributor-skills.md). Keep evidence images outside Git.

The [project PR-writing skill](.agents/skills/oss-pr-writing/SKILL.md) provides the same drafting workflow for supported coding agents. It adds no publication, merge, or release authorization. Follow the existing boundaries in AGENTS.md.

## Review and collaboration

Use Conventional Commits for commit subjects and keep each commit coherent. Keep the PR focused on the agreed outcome. Push review fixes as normal commits and describe relevant changes without rewriting shared history. Follow the existing authorization rules for publishing and releases.

Explain what you verified and where you need help. A reproducible bug report or a clear design example is useful even when you cannot supply a fix. Treat contributors respectfully and discuss the behavior or code rather than making assumptions about the person.

## Project boundaries

Discuss broad stack changes, storage migrations, and runtime changes before implementing them. Preserve the local-first workflow, explicit MCP targets/revisions, and recovery guarantees. Do not add executable HTML, shell access through design tools, arbitrary remote asset fetching, or public exposure of the private broker. Do not include proprietary source, confidential documents, credentials, or unlicensed assets.

## License

Open Cavas is licensed under the [Apache License 2.0](LICENSE). Contributions intentionally submitted for inclusion are offered under the same license unless explicitly stated otherwise, as described in Section 5 of the license. Submit work you have the right to contribute and preserve applicable third-party copyright and license notices. Third-party dependencies and assets retain their own licenses.
