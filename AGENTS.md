# Open Cavas engineering rules

## Product and scope
- Build Open Cavas, a web-based design editor.
- Work in this repository. Keep external reference projects read-only.
- Keep names and links for external reference products, along with comparison notes, out of tracked files and public commit, issue, and PR prose. Preserve required third-party notices.
- Keep proprietary app bundles, extracted code, private documents, credentials, and raw analysis outside this repository. Write original implementation code.
- Read PRODUCT.md, DESIGN.md, README.md, and relevant docs before changing behavior. Keep docs accurate during implementation.

## Feature completeness
- Follow [feature delivery](docs/feature-delivery.md) before implementing behavior. Define the requested user journey and observable acceptance criteria first. Reuse criteria from the user's issue, brief, or supplied roadmap.
- Small changes describe delivery size, not reduced functionality. Split large work into complete, verifiable increments that preserve the requested outcome.
- Current capability limits describe today's product. Do not use the original MVP scope to silently narrow a later user request. Make necessary scope decisions explicit before implementing a substitute.
- Cover schema, commands, rendering, UI, MCP, persistence, history, and import/export wherever the feature affects them. Explain any inapplicable part. A UI control alone does not complete a document capability.
- Complete authorized work against the acceptance criteria. A build, screenshot, documented limitation, or checked roadmap box alone is not completion. Report unmet criteria and unverified behavior explicitly.
- Private planning files remain local. Carry only the needed delivery criteria into tracked docs or PRs; never publish private roadmaps, screenshots, or audit notes.

## Implementation
- Use React, TypeScript, Vite, Tailwind, and pnpm. Use the pinned Node and pnpm versions in package.json. No Next.js or Python application code.
- Prefer inferred types and discriminated unions. Validate external documents at import/storage boundaries. Do not use `any` or unchecked casts.
- Keep changes small and focused. Prefer files around 200 to 400 lines. Avoid deep nesting and speculative abstractions.
- Keep comments useful and current. No unrelated refactors or cleanup.
- Follow relevant JStack workflows, but match ceremony to task size. Do not delegate ordinary one-pass work.

## Design
- Dark mode with true black (#000) application background and white primary text.
- Dense editor layout, minimal copy, no decorative cards or pills, no gray subtitle lines above sections, no em dashes.
- No continuously repainting animations, shimmer, pulse, or spinners.
- Provide visible keyboard focus, labeled controls, useful empty/error states, and responsive access to editor panels.
- Artwork colors are user content and may differ from editor chrome.

## Verification and documentation
- Do not write new test files or disguised test suites unless explicitly requested.
- For behavior changes, run `pnpm run check` and `pnpm run build` plus the relevant real browser/MCP journeys. Report unverified behavior honestly.
- Maintain docs for architecture, controls, file format, known limits, and actual verification results.
- Inspect CI requirements before changes when CI exists. Never claim an unrun check passed.
- For documentation-only changes, verify the diff and links; no app build or browser run is required unless CI requires it.
- For visible UI changes, attach labeled before-and-after screenshots to the PR using the repository's [attach-screenshot-to-pr skill](.agents/skills/attach-screenshot-to-pr/SKILL.md). Contributors configure their own credentials through [skill setup](docs/contributor-skills.md). Capture comparable states and viewport sizes, inspect for sensitive data, keep evidence images outside Git, and verify published image links. Follow the skill's upload rules and report missing evidence or upload blockers explicitly. Documentation-only PRs need no UI screenshots.

## Git
- Use Conventional Commits for commit titles: `type: description` or `type(scope): description`. Use a lowercase type such as `feat`, `fix`, `docs`, `refactor`, `test`, or `chore`, an imperative description, and no trailing period.
- User authorizes atomic local commits during this implementation without further confirmation. Keep each commit coherent and verify staged files.
- Do not add Co-authored-by, agent Signed-off-by, or other agent attribution. Do not change author identity.
- Do not publish, push, force-push, rewrite published history, or open a PR without explicit authorization for that action.
- Preserve unrelated user work. Never stop another project's services.

## GitHub issues and pull requests
- Follow [contribution guidance](CONTRIBUTING.md) and the repository PR/issue templates. Use the project [oss-pr-writing skill](.agents/skills/oss-pr-writing/SKILL.md) for public drafts; keep sections relevant to the change.
- Prefix issue titles with a bracketed type, such as `[Bug]` or `[Feature Request]`, followed by a specific description.
- Use Conventional Commits for PR titles with a required scope: `type(scope): description`. Use a lowercase type, a meaningful scope, and a concise imperative description without a trailing period.
- Write PR descriptions in direct, specific, conversational English. Scale the structure to the change; use Summary, Linked issue, Reproduction, Verification, and Docs sections when useful. Explain the problem, the change, preserved behavior, and relevant limitations. Use `Closes #N` only when the PR resolves that issue.
- Report exact relevant verification commands and observed outcomes. Never claim unrun or failed checks passed. Keep incidental local environment details and the complete validation ledger private; disclose limitations that affect confidence or required checks.
- Do not invent experience, results, or measurements. Avoid em dashes, inflated praise, generic chatbot phrases, and unrequested tool attribution. Follow repository disclosure requirements honestly.
- Read the published PR back against its draft. Follow applicable approval gates before publishing or editing issues and PRs.

## Running
- Check port availability first. Development server binds 0.0.0.0 unless sensitive data requires a loopback or tailnet-only listener.
- Report the browser URL as http://localmachine:<port>, not a wildcard or loopback address.
- Verify through localmachine before claiming reachability. Keep private helpers and browser debugging listeners on loopback.


## MCP boundaries
- Read docs/mcp.md and docs/mcp-capabilities.md before changing agent control.
- Keep the broker loopback-only with exact-Origin/Host checks and short-lived one-use automatic browser tickets. Keep `.cavas` ignored by Git and denied by Vite, including filesystem aliases. Keep shared-broker credentials private. No manual pairing UI or pairing-code commands; automatic registration must not expose the internal broker secret.
- Require explicit canvas IDs and expected revisions for mutations. Do not retry uncertain writes automatically. Read-back and persistence status are separate evidence.
- Do not expose shell execution, arbitrary filesystem access, remote asset fetching, or executable HTML through design tools. Do not claim unsupported editor features.


## Stable main and isolated development
- Read docs/runtime.md before starting, building, releasing, or changing runtime configuration.
- Main frontend is 5182 and private MCP is 4781. Dev frontend is 5188 and private MCP is 4785. Additional simultaneous worktrees need distinct assigned dev port pairs. Never point development at main broker or metadata.
- Run feature development in a separate worktree on a feature branch with pnpm run dev and dev-specific MCP config scripts. Do not edit or rebuild files served by main as a side effect of development.
- Main runs a committed snapshot via pnpm run release:main and pnpm start. Source pnpm run build is verification, not publication. Merge verified features, prepare a release, then deliberately restart main and reconnect agents at the agreed release boundary.
- Do not kill active main broker/client processes, delete their metadata/worktrees, or modify global agent settings silently. Legacy launcher migration and owner restarts can disconnect other threads; coordinate them explicitly.
