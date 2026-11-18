---
name: oss-pr-writing
description: Draft Open Canvas issues and pull requests with complete workflow criteria, project templates, verified results, and relevant before-and-after evidence.
---

# Write an Open Canvas contribution

Read [contribution guidance](../../../CONTRIBUTING.md) and the relevant [PR template](../../../.github/pull_request_template.md) or [issue forms](../../../.github/ISSUE_TEMPLATE). Follow the repository's current rules and the user's scope. This skill does not authorize publication or alter global agent settings.

1. Establish the concrete problem, requested outcome, affected paths, and available verification evidence. Use the actual issue or user brief. Do not invent personal experience, measurements, or reproduction results.
2. Use a scoped Conventional Commit PR title, `type(scope): description`. Issue titles use a bracketed type such as `[Bug]` or `[Feature Request]`. Keep descriptions imperative and omit trailing periods in PR titles.
3. Explain the problem and resulting behavior first. Describe where users discover a UI action, any changed defaults, the implementation mechanism, and preserved behavior. Scale the template to the change and remove inapplicable sections.
4. Link real related issues. Use `Closes #N` only when the PR resolves the issue. Never publish unresolved issue placeholders.
5. Map acceptance criteria to observed results or mark them unmet/unverified. Give exact relevant successful commands and disclose failures or missing checks that affect confidence. Keep raw machine logs and the complete private validation ledger out of public prose. Never tick an unrun check.
6. For visible UI changes, use [attach-screenshot-to-pr](../attach-screenshot-to-pr/SKILL.md) for labeled Before/After evidence, including the entry point and affected viewport sizes. Use contributor-owned credentials and keep screenshots outside Git. Report missing evidence and upload blockers.
7. Link updated docs and state remaining limits, compatibility, or recovery implications. Distinguish partial work from a completed feature and a merged PR from a released feature.
8. Revise for direct, specific English. Avoid em dashes, exaggerated praise, generic filler, invented usage history, and unrequested tool attribution. Preserve required repository disclosures honestly.
9. Follow current publication approval rules. When draft review is required, show the complete title and body and wait for approval. An already authorized PR workflow follows its existing scope. Use a body file for multiline GitHub text, then read back the published title, body, targets, issue links, and image links.

Keep private plans, credentials, broker metadata, and confidential designs out of drafts and attachments. Do not copy another project's commands, platform promises, or approval policy into Open Canvas.
