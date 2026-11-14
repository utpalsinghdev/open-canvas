# Open Cavas

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, TypeScript, Vite, Tailwind, npm. Delegated implementation choice follows the user's standing stack preferences. Zustand owns editor state; Zod validates documents.

## Purpose

A local-first, visual editor. Create artboards and compose text, shapes, and images, then save an editable file or export SVG. No account or cloud service is required.

## Users

Assumption for this MVP: designers and developers working on desktop browsers. Touch layouts provide panel access but do not promise a full mobile design workflow.

## Capabilities and constraints

Artboards, layers, selection, move/resize, property editing, undo/redo, zoom/pan, local saves, JSON import/export, and SVG export. No new test files. Maintain documentation and make atomic local commits without asking.

Cloud sync, multiplayer, AI generation, arbitrary HTML execution, vector path editing, auto layout, and third-party editable design document compatibility are outside this MVP. An optional paired-browser MCP server supports current editor operations, restricted inert HTML import, SVG-based code output, artwork screenshots, and explicit design token assignment. Multi-page management remains outside the implemented editor. The implementation is original, not a copy of proprietary source.

## Brand commitments

User-specified name: Open Cavas. Black editor background, white text, dense layout, minimal decoration, no perpetual animation.

## Evidence

Starter composition is synthetic, editable demonstration content.
