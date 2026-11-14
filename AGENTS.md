# Open Cavas engineering rules

## Product and scope
- Build Open Cavas, a web-based, Paper-inspired design editor.
- Work in this repository. `/home/utpal/work/osc/rea` is a read-only analysis reference, not the application workspace.
- Keep proprietary app bundles, extracted code, private documents, credentials, and raw analysis outside this repository. Write original implementation code.
- Read PRODUCT.md, DESIGN.md, README.md, and relevant docs before changing behavior. Keep docs accurate during implementation.

## Implementation
- Use React, TypeScript, Vite, Tailwind, and npm. No Next.js or Python application code.
- Prefer inferred types and discriminated unions. Validate external documents at import/storage boundaries. Do not use `any` or unchecked casts.
- Keep changes small and focused. Prefer files around 200 to 400 lines. Avoid deep nesting and speculative abstractions.
- Keep comments useful and current. No unrelated refactors or cleanup.
- Follow relevant JStack workflows, but match ceremony to task size. Do not delegate ordinary one-pass work.

## Design
- Dark mode with true black (#000) application background and white primary text.
- Dense editor layout, minimal copy, no decorative cards or pills, no gray subtitle lines above sections, no em dashes.
- No continuously repainting animations, shimmer, pulse, or spinners.
- Provide visible keyboard focus, labeled controls, useful empty/error states, and responsive access to editor panels.
- Artwork colors are user content and may differ from editor chrome.

## Verification and documentation
- Do not write new test files or disguised test suites unless explicitly requested.
- Verify with TypeScript checks, production builds, and real browser interactions. Report unverified behavior honestly.
- Maintain docs for architecture, controls, file format, known limits, and actual verification results.
- Inspect CI requirements before changes when CI exists. Never claim an unrun check passed.

## Git
- User authorizes atomic local commits during this implementation without further confirmation. Keep each commit coherent and verify staged files.
- Do not add Co-authored-by, agent Signed-off-by, or other agent attribution. Do not change author identity.
- Do not publish, push, force-push, rewrite published history, or open a PR without explicit authorization for that action.
- Preserve unrelated user work. Never stop another project's services.

## Running
- Check port availability first. Development server binds 0.0.0.0 unless sensitive data requires a loopback or tailnet-only listener.
- Report the browser URL as http://localmachine:<port>, not a wildcard or loopback address.
- Verify through localmachine before claiming reachability. Keep private helpers and browser debugging listeners on loopback.


## MCP boundaries
- Read docs/mcp.md and docs/mcp-capabilities.md before changing agent control.
- Keep the broker loopback-only with exact-Origin and pairing-code checks. Keep `.cavas` ignored by Git and denied by Vite, including filesystem aliases. Never expose pairing codes through public files or VITE-prefixed environment values.
- Require explicit canvas IDs and expected revisions for mutations. Do not retry uncertain writes automatically. Read-back and persistence status are separate evidence.
- Do not expose shell execution, arbitrary filesystem access, remote asset fetching, or executable HTML through design tools. Do not claim complete Paper parity for unsupported editor features.
