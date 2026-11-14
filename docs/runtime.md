# Main releases and feature development

Main is the stable application used by other threads. Feature work runs in separate worktrees and does not replace the live main release.

## Reserved profiles

| Profile | Browser app | Private MCP broker | MCP config name |
| --- | --- | --- | --- |
| Main | http://localmachine:5182 | 127.0.0.1:4781 | open-cavas |
| Development | http://localmachine:5188 | 127.0.0.1:4785 | open-cavas-dev-5188 |

These are different browser origins and have independent IndexedDB workspaces. Import JSON backups to transfer work. Never use the development app to access main's saved browser data directly. Both app listeners bind 0.0.0.0; brokers remain loopback-only and require pairing and exact Origin. Keep app listeners on a trusted network, without public ingress.

Main ports and Origin cannot be overridden. Development refuses either main port. An additional simultaneous feature worktree needs a different explicitly assigned development port pair. Set `CAVAS_APP_PORT` and `CAVAS_MCP_PORT` identically when launching that app, generating its config, and reading its pairing code. Development Origin defaults to `http://localmachine:<app-port>`; any explicit Origin must match that port.

## Use main

In the primary main checkout:

```sh
npm ci
npm run release:main
npm start
```

`release:main` requires clean committed main. It archives exactly HEAD into a private `.cavas/releases/<commit>/` directory, installs that snapshot's locked dependencies, builds and typechecks it, and atomically updates `.cavas/main-release.json` only after success. An existing release for the same commit is reused. Failed builds do not change the release pointer. Dependencies and built assets belong to that snapshot, not the development checkout's node_modules or dist.

`npm start` resolves the pointer once and serves that snapshot on 5182. It refuses to switch to another port. `npm run preview` is an alias for the same main runtime. A normal `npm run build` is a source check/build, not publication of main. Subsequent builds and feature changes do not change the main snapshot that a running process serves.

The release script does not stop processes, restart services, push Git commits, or alter global MCP settings. No reboot persistence or system service is configured. The currently selected and running release can differ while preparing the next release; complete the coordinated restart before asking new clients to use it.

Main MCP configuration:

```sh
npm run --silent mcp:config
npm run mcp:pair
```

The generated configuration invokes the stable primary-checkout launcher, which resolves the selected release for each new stdio client. It does not point at a feature worktree's source files. Configure all main MCP clients with that entry. `get_capabilities` reports the profile, Origin, and release commit. HTML includes `cavas-profile` and `cavas-release` meta tags for read-only runtime identification.

## Develop a feature

Use a feature branch in a separate worktree, install its dependencies, then:

```sh
npm run dev
npm run --silent mcp:config:dev
npm run mcp:pair:dev
```

`npm run dev:agent` is an alias for the same development frontend. The launcher rejects main branches, detached checkouts, and the primary checkout. Development uses source/HMR and port 5188, broker 4785, and a distinct MCP entry. Its configured stdio client runs `runtime.mjs dev mcp`; `npm run mcp:dev` runs that transport directly, not a daemon to start beside every MCP client.

Each profile/port pair has its own private pairing metadata:

```text
.cavas/runtime/main/5182-4781/pairing.json
.cavas/runtime/dev/5188-4785/pairing.json
```

Main metadata stays in the primary checkout even when the server code runs from a release snapshot. Dev metadata stays in its feature worktree. The launchers set the appropriate private state directory; codes are never build-time frontend variables. All `.cavas` contents are ignored by Git and denied by Vite's development filesystem guard.

Do not invoke `server/index.ts` or Vite directly to work around profiles. Bare server/Vite defaults are development, not main. Generated configs and npm scripts are the supported launch paths.

## Roll out a feature

1. Verify the feature in its own development app and broker.
2. Merge locally into main when authorized. Do not point main agents at the feature worktree.
3. Commit any release-related changes, then run `npm run release:main` from clean main.
4. Schedule the restart. Have active users wait for Saved locally and keep JSON backups. Stop only the known main frontend and main broker owner, not unrelated services or attached client processes by broad name.
5. Run `npm start` and restart/reconnect main MCP clients against the generated main config. One client owns the broker; other clients attach. Pair the browser again after the owner restarts.
6. Verify HTTP through localmachine, matching frontend/MCP release IDs, and document read-back before resuming experiments.

An existing main frontend can keep serving the previous release while the new release is built. Restart is the controlled update boundary, not a side effect of development. MCP owner restart disconnects paired browsers; live migration without disconnect is not implemented.

## First migration from old launch commands

Earlier versions served root dist or worktree dist and launched MCP directly from source with `.cavas/pairing.json`. Those running processes are not killed automatically. Prepare the first main snapshot, then switch the frontend to `npm start`. Replace legacy client config with generated main config and restart its broker owner during a coordinated window. Legacy broker metadata is never automatically adopted or overwritten. If the old owner still occupies 4781, new main clients fail safely rather than stealing it.

Do not delete old worktrees or pairing files while active clients depend on them. Until legacy MCP clients are reconfigured/restarted, their process remains on the old launcher even though frontend main is isolated. Runtime scripts do not claim otherwise.
