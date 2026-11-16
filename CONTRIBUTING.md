# Contribute to Open Cavas

Read [AGENTS.md](AGENTS.md), [product scope](PRODUCT.md), and the [design rules](DESIGN.md) before changing behavior. Use [feature delivery](docs/feature-delivery.md) to define a complete user outcome. Keep external reference projects read-only and write original implementation code.

## Report a problem or request a feature

Search open and closed issues first. Use the bug report form for observed failures and the feature request form for a proposed workflow. Blank issues remain available for other topics.

Use a specific title with a bracketed type, such as `[Bug] Preserve text edits when switching pages` or `[Feature Request] Add nested frame reparenting`.

For bugs, provide a minimal reproduction, actual and expected behavior, release or source version when known, and browser/runtime details. For save failures, distinguish an edit appearing on screen from surviving reload or native backup restore. Use disposable content and never risk valuable work to reproduce a failure.

For features, describe the problem, requested workflow, acceptance criteria, and alternatives. Separate essentials from later ideas. A new design capability needs its affected UI, MCP, persistence, history, and import/export paths considered together.

Public reports and images must omit credentials, browser tickets, broker metadata, private artwork, and private planning documents.

## Develop and verify

Use a feature branch in a separate worktree and follow [runtime isolation](docs/runtime.md). Keep main's ports, service data, and committed snapshot separate from development. Do not restart another contributor's services.

Inspect current CI before editing. For behavior changes, run `pnpm run check` and `pnpm run build`, then exercise relevant browser and MCP journeys. For documentation-only changes, check the diff and links unless CI requires more. Do not add test files or disguised suites unless explicitly requested. Report automated-coverage gaps honestly.

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
