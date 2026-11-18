# Install Open Cavas locally

## Requirements

- macOS or glibc-based Linux on x64 or ARM64.
- Bash, curl, tar, and SHA-256 verification tools (`sha256sum` or `shasum`).
- A browser on the same machine. Node.js and the editor runtime come in the archive.

Windows, Alpine Linux, and native desktop installers are not included. The bundled Node.js and native graphics libraries must support your OS version. Use the archive matching your machine.

## Install and open

Use a [GitHub release](https://github.com/utpalsinghdev/open-canvas/releases) that provides an archive and its SHA-256 file for your platform. Older releases without these files cannot be installed this way. The latest-release download is available only after those assets are attached to the latest release.

Once the latest release includes the archive and checksum, install with:

```sh
curl -fsSL https://raw.githubusercontent.com/utpalsinghdev/open-canvas/main/scripts/install.sh | bash
```

To inspect the installer before running it:

```sh
curl -fsSL https://raw.githubusercontent.com/utpalsinghdev/open-canvas/main/scripts/install.sh -o open-cavas-install.sh
less open-cavas-install.sh
bash open-cavas-install.sh
```

The installer accepts `--version vX.Y.Z` for a specific release, or `--archive /path/to/open-cavas-linux-x64.tar.gz` for a trusted local archive with its adjacent `.sha256` file. Checksums detect corruption and mismatched downloads; they are not signatures. Use assets from the official release or archives you built yourself.

Then run:

```sh
open-cavas
```

If the command is not on PATH, run `~/.local/bin/open-cavas`. It opens your browser at `http://127.0.0.1:5190`. Use `open-cavas --no-open` to launch without opening a tab. Choose **Start with introductory canvas** or create an empty workspace. Keep the terminal running while editing; press Ctrl+C to stop the editor.

The app binds only to loopback because it serves private local workspaces. The separate private broker also binds only to loopback, on port 4790. If those ports conflict, set `CAVAS_APP_PORT` and `CAVAS_MCP_PORT` to an unused pair. A different pair selects a separate data directory and browser origin. Do not use source main or default development ports.

## Connect a local agent

Run `open-cavas mcp-config`, using the same port overrides as the editor, if any. Copy the generated `open-cavas` entry into your agent configuration. A client can access durable workspaces without an open editor. An open workspace connects automatically for browser rendering. See [MCP setup and controls](mcp.md). The installer does not edit any agent settings.

## Update, roll back, or remove

The installer puts the command in `~/.local/bin` and the verified package in `~/.open-cavas/install/releases`. Projects and private broker state live separately in `~/.open-cavas/data/<app-port>-<broker-port>/`. The installer does not read or migrate existing source or browser workspaces.

Save a workspace backup, stop the editor and its installed MCP clients, then run the installer again to update. Use `--version` to reinstall a specific release, or keep an archive and checksum for offline rollback. An older release may not open documents saved in a newer format; keep a backup from before the upgrade. There is no automatic update or deletion of old packages.

To uninstall, stop the editor and its installed MCP clients, then remove the `~/.local/bin/open-cavas` symlink and `~/.open-cavas/install`. Leave `~/.open-cavas/data` intact to keep your projects.

## Prepare release assets

To build an archive on the current platform, use the official Node.js distribution at the pinned version (the packager bundles its executable and license) and pinned pnpm:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm run package:local
bash scripts/install.sh --archive .cavas/packages/open-cavas-linux-x64.tar.gz
```

Replace the example archive name on other platforms. Use an isolated home directory when testing installation. The packager writes an archive and checksum to `.cavas/packages` unless given another output directory. It does not modify a running source or installed app. Build from a clean checkout of the intended release commit for traceable runtime metadata.

The **Build local app archives** workflow runs only when dispatched. For an authorized release, dispatch it at the release tag, download the four workflow artifacts, and attach each enclosed `.tar.gz` and `.sha256` to the matching GitHub release. Verify a fresh download and install before sharing its link. No npm package or publishing token is needed. Serving the same installer at `https://open-canvas.xyz/install.sh` requires a separate website deployment; that URL is not an installation endpoint provided by this workflow.
