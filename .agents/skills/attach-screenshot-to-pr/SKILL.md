---
name: attach-screenshot-to-pr
description: Capture and attach before-and-after screenshots to GitHub pull requests using contributor-owned Cloudinary credentials, without committing evidence images.
---

# Attach screenshots to a PR

Use this skill for PR visual evidence. Keep screenshots in a task-specific temporary directory outside the checkout. Never commit evidence images or use a screenshot-only branch to obtain URLs.

## Configure your own account

Use the repository's pinned Node.js 24.22.1. The standalone helper requires at least Node.js 22.6 and uses built-in APIs without a dependency install. This repository contains no shared Cloudinary account or credentials.

Use the canonical skill directory `.agents/skills/attach-screenshot-to-pr`. Codex discovers it there. Pi and Claude Code discover the same skill through relative directory symlinks under `.pi/skills` and `.claude/skills`. Run commands from the repository root, or resolve paths against the checkout. If directory symlinks are unavailable, follow [contributor setup](../../../docs/contributor-skills.md).

The contributor configures credentials themselves. Never read, print, source, copy into chat, or commit a populated credential file.

```sh
cp .agents/skills/attach-screenshot-to-pr/.env.example .agents/skills/attach-screenshot-to-pr/.env
chmod 600 .agents/skills/attach-screenshot-to-pr/.env
```

Fill in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` privately in that ignored `.env`. On Windows, restrict access using file ACLs instead of `chmod`. Use your own account and review its storage/bandwidth terms before uploading.

### Share credentials across this repository's worktrees

Ignored `.env` files are not copied into new worktrees. To configure one private credential source for all worktrees, run this once from the repository root after configuring the local `.env`:

```sh
shared_dir="$(git rev-parse --path-format=absolute --git-common-dir)/open-cavas"
mkdir -p "$shared_dir"
chmod 700 "$shared_dir"
# Do not overwrite an existing shared file without reviewing which account it uses.
[ ! -e "$shared_dir/screenshot-upload.env" ] &&
  install -m 600 .agents/skills/attach-screenshot-to-pr/.env "$shared_dir/screenshot-upload.env"
```

The shared file lives inside Git's common directory, outside tracked files. Linked worktrees of this repository find it automatically; separate clones need their own configuration. Protect it with file ACLs on Windows. Do not commit it, print it, or copy it into chat. Credential changes in the local `.env` do not automatically update the shared copy.

Lookup order is exclusive: environment variables, then the worktree's skill `.env`, then `open-cavas/screenshot-upload.env` under the common Git directory. File lookup uses the helper's repository, not the shell's current directory. Only a missing local file permits shared fallback; incomplete, unreadable, or insecure local files fail rather than switching accounts. A copied helper outside Git can still use its local `.env` or environment variables.

CI or a secret manager may supply all three environment variables instead. If any of these variables is set, the helper uses environment variables exclusively and requires all three. It does not merge accounts or fall back to either credential file. Do not put secrets in shell command arguments or logs.

```sh
node .agents/skills/attach-screenshot-to-pr/scripts/upload.mjs --check
```

This checks configuration and Unix file permissions without network access. It does not authenticate credentials or upload anything. Missing credentials block uploads; do not search other projects or another contributor's home directory for keys.

## Capture, upload, and attach

1. Capture labeled Before and After states using approved browser/app tooling. Use comparable content, interaction state, and viewport sizes. Include desktop and narrow views where affected. Inspect every image for correctness and sensitive information. Use synthetic or explicitly authorized content.
2. Confirm task authorization before an external upload or PR write. Cloudinary image URLs are public, even for a private PR. Do not upload confidential images, private documents, or credentials.
3. Upload each approved screenshot using the helper:

   ```sh
   node .agents/skills/attach-screenshot-to-pr/scripts/upload.mjs /tmp/task-id/editor-before.png
   node .agents/skills/attach-screenshot-to-pr/scripts/upload.mjs /tmp/task-id/editor-after.png
   ```

   PNG, JPEG, and WebP files must be nonempty and at most 10 MiB. The helper uploads under unique `pr-screenshots/` IDs without overwriting assets and prints only the HTTPS image URL on success. Do not retry failed or timed-out uploads automatically; a lost response can hide a completed upload.
4. Embed the actual returned URLs in the PR body with descriptive alt text and Before/After labels. Do not invent URLs or use local filesystem paths as image links. Preserve the current PR body when editing it. Use a body file with `gh pr create` or `gh pr edit` and follow repository publication rules.
5. Read the PR back and check that each image URL returns image content. Confirm inline rendering when browser tooling is available. Report URL retrieval and visible rendering separately. Keep hosted assets available while the PR needs its evidence.

If configuration or hosting is unavailable, report the blocker and missing evidence. Never fall back to committing screenshots. With explicit approval, GitHub CLI attachment support may be used after checking the installed command's help. Do not silently install tools or use undocumented upload APIs.
