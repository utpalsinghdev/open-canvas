# Open Cavas

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, TypeScript, Vite, Tailwind, npm. Delegated implementation choice follows the user's standing stack preferences. Zustand owns editor state; Zod validates documents.

## Purpose

A local-first, Paper-inspired visual editor. Create artboards and compose text, shapes, and images, then save an editable file or export SVG/PDF. No account or cloud service is required.

## Users

Assumption for this MVP: designers and developers working on desktop browsers. Touch layouts provide panel access but do not promise a full mobile design workflow.

## Capabilities and constraints

Artboards, layers, selection, move/resize, property editing, undo/redo, zoom/pan, local saves, JSON import/export, SVG export, paginated raster PDF export, and local page/layer/position-anchored review threads. No new test files. Maintain documentation and make atomic local commits without asking.

Cloud sync, multiplayer, AI generation, arbitrary HTML execution, vector path editing, auto layout, and Paper file compatibility are outside this MVP. An optional automatically connected browser MCP server supports current editor operations, restricted inert HTML import, SVG-based code output, artwork screenshots, and explicit design token assignment. Projects contain multiple files, and files contain multiple pages. Project/file management, page lifecycle, per-file session history, local service persistence, and project/workspace backups are implemented in the local workspace service, browser UI, and MCP. Full Paper parity remains outside the implemented editor. The implementation is original, not a copy of proprietary source.

Stable main frontend/MCP use fixed ports 5182/4781; feature work uses separate worktrees and dev ports 5188/4785. Committed main snapshots roll out only through deliberate release/restart, keeping other agents' experiments stable during development.

## Brand commitments

User-specified name: Open Cavas. Black editor background, white text, dense layout, minimal decoration, no perpetual animation.

## Evidence

Paper 0.5.19 desktop ASAR inspected read-only over SSH with REA. See docs/paper-research.md. No Paper assets or private user documents ship with this app. Starter composition is synthetic, editable demonstration content.


## Agent access

User explicitly requested removal of human pairing-code intervention. Open browser workspaces register automatically with the local MCP broker. No code entry, Pair action, or pair CLI is required. Internal broker authentication, exact browser Origin/Host validation, one-use short-lived browser tickets, and explicit canvas/context/revision checks remain. Explicitly selected local service workspaces support MCP data operations without a browser tab. Existing browser data moves only through an explicit identity-preserving copy. Browser rendering still needs an open tab. See docs/local-workspaces.md.
