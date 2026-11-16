# Deliver a complete feature

Use this checklist for a requested behavior change. For copy or documentation changes, verify the affected text and links. Match planning effort to the task size.

## Define the outcome

Before implementation, record a short brief in the task plan or PR draft:

- State the user journey, starting state, and observable result.
- Turn the user's request and supplied issue or roadmap into acceptance criteria. Separate current behavior, requested behavior, and later work.
- Identify affected modules, dependencies, and compatibility requirements. For a migration or runtime change, specify recovery and rollback before changing data or ownership.
- State material assumptions and unresolved product decisions. Continue independent authorized work while resolving decisions that affect the outcome.

Small commits can build a large feature. Each increment must end in a verifiable state, and the complete task must satisfy the requested journey. Do not silently replace it with a demo, stub, or reduced implementation. If the requested outcome needs more work than expected, update the plan and continue within authorization. Ask only when a material decision or authorization boundary blocks the next step.

## Implement across the affected paths

For each applicable path, record what changes and how you will verify it. Explain omissions so an affected integration cannot disappear from scope.

| Path | Completion evidence |
| --- | --- |
| Document model | Validate new data and invariants. Preserve existing documents, IDs, and references through versioned migrations when needed. Refuse unsupported writes safely. |
| Commands and history | Exercise the operation, undo, redo, and rejected input. UI and MCP use the same validated behavior. |
| Rendering and editing | Native content stays editable after creation, manual correction, and an agent refinement. Verify layout and font behavior where affected. |
| UI | Exercise the complete journey with keyboard focus, labeled controls, and relevant empty, pending, and error states at desktop and narrow widths. |
| MCP | Verify explicit targets, expected revisions, affected state, unsupported operations, and relevant manual-edit conflicts. Preserve uncertain outcomes without automatic write retries. |
| Storage and recovery | Verify acknowledged saves, reload/reopen, backup scope, and relevant failure/conflict paths with isolated data. Distinguish applied state from durable persistence and unsent drafts. |
| Import and export | Verify native round trips, assets, and editability separately from rendered SVG, PNG, or PDF fidelity. State the formats and limits actually supported. |

For example, raster PDF pages can satisfy an explicitly raster export task. They do not satisfy a requirement for selectable text or vector paths. Recording the raster limitation does not close that unmet requirement.

## Verify against the criteria

Inspect current CI and repository instructions before choosing checks. For TypeScript or behavior changes, run `pnpm run check` and `pnpm run build` in the feature worktree. Exercise the relevant browser and MCP journeys using isolated dev ports and data. Preserve the stable main runtime.

Use realistic content for the requested job. Include affected failure cases and regressions rather than relying only on a happy-path screenshot. For document changes, verify old-document migration, malformed input, asset/ID preservation, native round trips, and history. For storage changes, verify backup restoration and interrupted or rejected writes before claiming recovery.

Do not add test files or disguised suites without an explicit request. Existing checks and manual verification do not provide continuous regression coverage for untested paths. State that gap when it affects confidence.

Keep a brief acceptance record in the PR. Give each criterion its observed result and evidence, or mark it unmet or unverified. A successful build proves neither workflow completeness nor save durability.

## Attach visual evidence for UI changes

For visible UI changes, include labeled Before and After images in the PR description. Capture the affected workflow at comparable viewport sizes, with the same synthetic content and interaction state where possible. Include desktop and narrow views when the change affects both. Capture the baseline before editing, or use an isolated base revision. Identify a different baseline if the states cannot match.

Use the repository's [attach-screenshot-to-pr skill](../.agents/skills/attach-screenshot-to-pr/SKILL.md), shared by Pi, Codex, and Claude Code. Follow [contributor setup](contributor-skills.md) to configure your own upload credentials. Read the skill before capturing or uploading. Inspect every image for correctness and sensitive data. Keep screenshots in a task-specific temporary directory outside the checkout and follow the skill's approved upload process. Never commit PR evidence images to obtain public image URLs.

Embed the actual returned image URLs with descriptive alt text. Read the PR back and verify that the image URLs return image content. Confirm inline rendering when browser tooling is available, and report which checks ran. If the skill or upload service is unavailable, report the blocker and missing evidence. Do not silently substitute committed images or claim attachment success. Documentation-only changes need no UI screenshots.

## Close the increment honestly

- Complete the authorized acceptance criteria before calling the feature done. Report a partial increment as partial and name the remaining work.
- Document a scope reduction only when the user has accepted it. Listing a requested capability under known limits does not remove the requirement.
- Update applicable product, controls, architecture, format, runtime, and verification docs to describe actual behavior.
- Keep planned, implemented, verified, and released states distinct. Roadmap review checkboxes prove none of these states by themselves.
- Keep private plans, audit notes, raw captures, and local paths out of public PRs. Publish only the necessary product criteria and relevant verification evidence.

Feature work, PR publication, merge, and release follow their existing authorization and runtime boundaries in [AGENTS.md](../AGENTS.md) and [runtime.md](runtime.md).
