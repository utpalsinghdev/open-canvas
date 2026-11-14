# Paper reference investigation

## Target and method

The user authorized SSH access to inspect Paper on their Mac. Target was `/Applications/Paper.app/Contents/Resources/app.asar`, copied to a task-owned temporary directory for static analysis. Paper and its documents were not modified or executed by the investigation.

- Package: `@paper/desktop`, version `0.5.19`, proprietary.
- ASAR SHA-256: `007a64da558154c42e78c6699b6dd3bfb13573214bab2de8e004bb438ddafb5c`.
- Reference checkout: `/home/utpal/work/osc/rea`, version `6.4.0`.
- Local checkout had no compiled runtime. Used the matching published `rea-agents@6.4.0` CLI without changing REA or MCP configuration.
- Initial whole-ASAR analysis exceeded a 200-second foreground budget while parsing bundled dependencies. No result claimed for that attempt.
- Scoped input: package.json, dist/main.cjs, dist/preload.cjs, dist/app-bar/preload.cjs, extracted from that ASAR.
- Successful command: `rea analyze-javascript-application <scoped-directory> --json`.
- REA Evidence ID: `ev_41207467a8993dab2f733535ef94358e3385e404bafb6fc11b15a32d4061992e`.
- Scoped root digest: `78401bf48507519e69cf48592524f5ec12d39e8d8732300df71e3577a678b14b`.

## Observations

Package metadata and REA's static analysis establish an Electron desktop shell with main/preload boundaries. The package inventories desktop window and tab behavior. Supplemental inert string inspection found separate Paper API, asset, sync, and MCP service endpoints, and a local MCP listener constant of 29979. A read-only connection attempt to that Mac loopback port failed because no server was listening.

## Limits and design decisions

Static analysis does not establish runtime behavior. The scoped input did not contain the editor renderer. This investigation does not claim to recover Paper's canvas implementation, document schema, layout algorithm, exact UI, or export semantics. REA reports unresolved dynamic calls and incomplete graph coverage.

Open Cavas independently implements the requested visual-editor workflow. A versioned document model and DOM/SVG rendering are MVP choices, not reverse-engineered Paper internals. No original code, icons, fonts, screenshots, auth material, or private documents are redistributed. Raw analysis remains outside Git.
