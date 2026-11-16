# Set up contributor skills

The repository shares contribution skills across coding agents:

| Agent | Project skill location |
| --- | --- |
| Codex | `.agents/skills/` holds canonical skill directories. |
| Pi | `.pi/skills/` links each skill to its canonical directory. |
| Claude Code | `.claude/skills/` links each skill to its canonical directory. |

Use [oss-pr-writing](../.agents/skills/oss-pr-writing/SKILL.md) to draft issues and PRs using the project templates. Use [attach-screenshot-to-pr](../.agents/skills/attach-screenshot-to-pr/SKILL.md) for before-and-after visual evidence. Only the screenshot upload helper needs credentials.

Reload your agent's skills or start a new session after checkout. Invoke either skill using your agent's skill syntax, or ask it to read the repository skill explicitly. The files are shared; each host supplies its own tools and retains its permission rules. Automatic discovery and precedence over a same-named global skill depend on the installed host version.

Checkouts must preserve directory symlinks for automatic discovery at the Pi and Claude Code locations. If your platform cannot use symlinks, ask the agent to read the canonical `SKILL.md` directly. That fallback loads the skill manually and still uses the canonical helper and credential location.

## Configure screenshot uploads

Read the [screenshot skill](../.agents/skills/attach-screenshot-to-pr/SKILL.md). Copy its blank `.env.example` to `.env` and privately provide your own Cloudinary cloud name, API key, and API secret. Both repository and skill ignore rules exclude populated `.env` files. Never force-add them. On Unix, use `chmod 600`; on Windows, restrict the file with ACLs.

Alternatively, supply all three `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` environment variables through your secret manager or CI secret store. Environment configuration is exclusive; partial environment settings fail rather than borrowing values from `.env`.

Run from the repository root:

```sh
node .agents/skills/attach-screenshot-to-pr/scripts/upload.mjs --check
```

Node.js 22.6 or later is required. This command validates local configuration without making a network request. It does not prove the credentials work. No personal credentials are provided by the repository, and no global agent configuration is changed by checkout.

Uploads use the contributor's account. Cloudinary URLs are public, so inspect screenshots and obtain the task's upload authorization first. Capture evidence outside Git and keep Before/After states comparable. Follow the skill's PR read-back and image verification steps.
