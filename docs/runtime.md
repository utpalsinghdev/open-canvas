# Main releases and feature development

Main is the stable application used by other threads. Feature work runs in separate worktrees and does not replace the live main release.

## Reserved profiles

| Profile | Browser app | Private MCP broker | MCP config name |
| --- | --- | --- | --- |
| Main | http://localmachine:5182 | 127.0.0.1:4781 | open-cavas |
| Development | http://localmachine:5188 | 127.0.0.1:4785 | open-cavas-dev-5188 |

These profiles have separate private service workspace directories. Existing browser IndexedDB data remains origin-specific until explicitly copied. Import JSON backups to transfer work. Never use the development app to access main's saved browser data directly. Both app listeners bind 0.0.0.0; brokers remain loopback-only and require automatic browser tickets and exact Origin/Host. Keep app listeners on a trusted network, without public ingress.

Main ports and Origin cannot be overridden. Development refuses either main port. An additional simultaneous feature worktree needs a different explicitly assigned development port pair. Set `CAVAS_APP_PORT` and `CAVAS_MCP_PORT` identically when launching that app, generating its config. Development Origin defaults to `http://localmachine:<app-port>`; any explicit Origin must match that port.

## Use main

In the primary main checkout:

```sh
npm ci
npm run release:main
npm run service:install  # Install/start persistent main frontend on Linux
```

`release:main` requires clean committed main. It archives exactly HEAD into a private `.cavas/releases/<commit>/` directory, installs that snapshot's locked dependencies, builds and typechecks it, and atomically updates `.cavas/main-release.json` only after success. An existing release for the same commit is reused. Failed builds do not change the release pointer. Dependencies and built assets belong to that snapshot, not the development checkout's node_modules or dist.

`npm start` resolves the pointer once and serves that snapshot on 5182. It refuses to switch to another port. `npm run preview` is an alias for the same main runtime. A normal `npm run build` is a source check/build, not publication of main. Subsequent builds and feature changes do not change the main snapshot that a running process serves.

The release script does not stop processes, restart services, push Git commits, or alter global MCP settings. On Linux, npm run service:install installs an explicitly named systemd user service for the main frontend. It restarts on failure and survives agent-session termination. User-manager availability after logout/reboot depends on the host's existing linger/login policy; the installer does not change that policy. npm start remains available for manual foreground use. The currently selected and running release can differ while preparing the next release; complete the coordinated restart before asking new clients to use it.

Main MCP configuration:

```sh
npm run --silent mcp:config
```

The generated configuration invokes the stable primary-checkout launcher, which resolves the selected release for each new stdio client. It does not point at a feature worktree's source files. Configure all main MCP clients with that entry. `get_capabilities` reports the profile, Origin, and release commit. HTML includes `cavas-profile` and `cavas-release` meta tags for read-only runtime identification.

## Develop a feature

Use a feature branch in a separate worktree, install its dependencies, then:

```sh
npm run dev
npm run --silent mcp:config:dev
```

`npm run dev:agent` is an alias for the same development frontend. The launcher rejects main branches, detached checkouts, and the primary checkout. Development uses source/HMR and port 5188, broker 4785, and a distinct MCP entry. Its configured stdio client runs `runtime.mjs dev mcp`; `npm run mcp:dev` runs that transport directly, not a daemon to start beside every MCP client.

Each profile/port pair has its own private internal broker metadata:

```text
.cavas/runtime/main/5182-4781/broker.json
.cavas/runtime/dev/5188-4785/broker.json
```

Main metadata stays in the primary checkout even when the server code runs from a release snapshot. Dev metadata stays in its feature worktree. The launchers set the appropriate private state directory; internal credentials are never returned to the browser or embedded in frontend variables. All `.cavas` contents are ignored by Git and denied by Vite's development filesystem guard.

Do not invoke `server/index.ts` or Vite directly to work around profiles. Bare server/Vite defaults are development, not main. Generated configs and npm scripts are the supported launch paths.

## Roll out a feature

1. Verify the feature in its own development app and broker.
2. Merge locally into main when authorized. Do not point main agents at the feature worktree.
3. Review pending Changesets with `npm run changeset:status`. When a version release is authorized, run `npm run version:apply`, inspect package/lockfile/changelog changes, and commit them. Then run `npm run release:main` from clean main. Versioning and runtime publication are separate steps; see versioning.md.
4. Schedule the restart. Have active users wait for Saved locally and keep JSON backups. Stop only the known main frontend and main broker owner, not unrelated services or attached client processes by broad name.
5. Run `npm run service:restart` for an installed main frontend service, or `npm start` for manual use, and restart/reconnect main MCP clients against the generated main config. One client owns the broker; other clients attach. Open application tabs reconnect automatically after the broker restarts. Reload old pre-upgrade tabs once to load the new connector.
6. Verify HTTP through localmachine, matching frontend/MCP release IDs, and document read-back before resuming experiments.

An existing main frontend can keep serving the previous release while the new release is built. Restart is the controlled update boundary, not a side effect of development. MCP owner restart disconnects browser sockets; live migration without disconnect is not implemented.

## First migration from old launch commands

Earlier versions served root dist or worktree dist and launched MCP directly from source with `.cavas/broker.json`. Those running processes are not killed automatically. Prepare the first main snapshot, then switch the frontend to `npm start`. Replace legacy client config with generated main config and restart its broker owner during a coordinated window. Legacy broker metadata is never automatically adopted or overwritten. If the old owner still occupies 4781, new main clients fail safely rather than stealing it.

Do not delete old worktrees or broker metadata while active clients depend on them. Until legacy MCP clients are reconfigured/restarted, their process remains on the old launcher even though frontend main is isolated. Runtime scripts do not claim otherwise.


## No manual pairing

Browser workspaces register automatically after the app opens and retry when the broker becomes available. Main and dev ticket issuance remain bound to their own exact browser Origin/Host. Internal credential sharing between stdio clients remains private. The old mcp:pair commands and pairing-code UI were removed; do not ask users to paste secrets or generate codes. A real workspace tab is required only for browser rendering. Durable workspace data operations need no tab. Pause agent access persists for that workspace until explicitly resumed.

Older running brokers and pages do not gain this behavior without a release restart/page reload. Restart only the explicitly identified main owner at the coordinated release boundary. Old pairing.json files are unused by the new broker; do not delete them while a legacy process still depends on them.


## Automatic frontend updates

Main release builds include `/runtime.json` with profile and commit identity. Main browser tabs check it at startup, on focus/visibility changes, and every 30 seconds. A different valid main commit becomes a pending update. The tab reloads automatically only when the selected service workspace reports saved, persistence is not blocked, no manual interaction/form draft/dialog is active, no MCP request is running, and five seconds have passed since document/selection/save/agent activity. The updater revalidates the served manifest before reloading. Offline or restarting servers do not justify discarding work.

Development/HMR tabs do not use this main-release updater. Browser timer throttling can delay checks in background tabs; focus triggers a fresh check. A failed save or focused form intentionally delays updates until resolved. The updater preserves saved workspace data, but a full page reload clears session-only selection/undo history and produces a new canvas ID. Agents must rediscover the canvas/context, not replay a mutation.

This removes routine requests to manually refresh a saved, idle workspace after future main releases. A page from before the updater was introduced needs one page load to install it; this cannot be retroactively executed by old frontend code. MCP stdio processes still follow the coordinated server restart/reconnect workflow. Automatic browser update is not transparent live migration of an old MCP server.


## Persistent main frontend service

`npm run service:install` installs `open-cavas-main.service` under the current user's systemd configuration and enables/starts it. It requires the primary main checkout and a prepared release. It rejects an occupied main port unless that exact service is already active, and refuses to replace a unit owned by another tool. It does not stop unrelated services, change user linger policy, or restart an already active main service. Existing managed unit changes receive a private backup.

The unit invokes the stable main launcher, selects its frozen release at startup, and uses Restart=on-failure. Children remain in its control group, so a crash cannot leave an orphan frontend occupying the port. The service is independent of T3 tool/shell lifetime.

```sh
npm run service:status
npm run service:restart  # At an authorized release boundary only
journalctl --user -u open-cavas-main.service -n 50 --no-pager
```

The frontend service does not own the MCP stdio sessions or their broker. Starting/restarting it never terminates those client processes. Existing automatically connected browser tabs retry transport registration once the frontend returns; a reload is not required merely because the frontend had temporarily stopped. Older pages without automatic-connection code are not modified by this service.

## Local workspace service lifecycle

Frontend launch now starts or attaches to the profile's private workspace broker before serving the app. Standalone stdio MCP can own the same broker without a frontend or browser. Attachment does not steal live ownership. If an owner disappears, updated attached clients verify identity before dispatch and may acquire the exclusive listener or attach to a verified replacement. The frontend checks every two seconds, and its launcher restarts only its own failed workspace child with capped backoff while retaining the frontend. No design command is replayed. Live-owner/invalid metadata and unverified listeners stop recovery. Main release changes still require the coordinated restart boundary; recovery runs the current process's release, not an automatic upgrade. Graceful owner shutdown drains accepted storage writes before releasing ownership. Workspace records live beside broker metadata in `workspaces/`, not inside release snapshots; never delete runtime directories as credential cleanup. See [local workspaces](local-workspaces.md).
