# Multiple MCP sessions

Multiple `open-cavas` stdio processes can share one automatically connected browser broker when they use the same checkout, `CAVAS_MCP_PORT`, and exact `CAVAS_APP_ORIGIN`.

The first process that binds the configured loopback port owns the WebSocket listener and internal credential. Later processes do not create a second listener or rotate the selected profile's `.cavas/runtime/<profile>/<app-port>-<broker-port>/broker.json`; they read its owner-only metadata and authenticate to the existing listener over loopback before forwarding canvas listing and requests. A port collision without matching private metadata and an authenticated broker identity is rejected. This is not an unauthenticated HTTP MCP endpoint.

`.cavas` must be a non-symlink directory with mode `0700`; broker metadata must be a regular file with mode `0600`. Metadata records the broker PID and random instance ID alongside the private internal secret, port, and exact origin. A process only removes metadata for its own instance during shutdown. A stale metadata file is removed only when its recorded PID is no longer alive, its authenticated broker identity does not prove that listener still owns the file, and the file has not changed since it was read. Reclamation happens only after acquiring the exclusive loopback listener, so attaching clients cannot remove a new owner's metadata during publication. Invalid or mismatched live ownership is an error, not grounds to overwrite pairing data.

The owner remains the single writer for browser sockets and pending requests. Each request remains bound to its selected browser socket; cancellation and timeout can still leave a dispatched mutation's outcome unknown. Clients must read state before deciding whether to repeat a mutation. The shared transport does not add mutation retries, merge edits, or provide cross-browser synchronization.

Existing legacy brokers that lack PID/instance metadata are not automatically adopted or overwritten. Deliberately restart the owner under the new code, then reload dependent MCP clients. Existing sessions may also need their normal agent reload to discover newly registered tools.

Main and development use separate internal metadata and generated MCP entries. An attached session verifies identity before dispatch and can recover a missing owner through the same exclusive listener/publication path. Browser tabs register automatically without a code and retry after owner restart. No manual Pair action is required. Use the same checkout/profile/port/Origin for shared clients; mismatched configuration is refused. See runtime.md for release boundaries and mcp.md for the automatic one-use browser ticket protocol.

## Broker loss and coordinated recovery

`get_capabilities` describes the local stdio process, not broker health. Use `list_canvases` to check broker access, then read an explicit canvas to establish document access. A successful empty list means no browser is registered; it is different from a transport error.

An attached client can remain running after its owner exits. Transport failures now identify unavailability, a response deadline, or caller cancellation instead of only `fetch failed`. A replacement owner creates new credentials. Before the next dispatch, attached clients verify identity and attach using the replacement's validated private metadata, or acquire ownership if the old owner is gone. Transport errors after dispatch still report an unknown outcome and do not replay the request. Workspace calls use the same bounded transport/error handling as canvas calls. A valid broker-returned canvas or revision error remains unchanged. None of these diagnostics establishes why the original owner stopped.

For recovery:

1. Keep the existing browser workspace open at the same origin and in the same browser profile. Do not clear storage or reload the page as a broker repair. Broker recovery does not itself save pending browser edits; preserve JSON backups when needed.
2. Coordinate with other attached sessions before restoring the intended owner through the configured MCP launcher. Do not stop an unidentified process, replace live-owner metadata, or change global settings to bypass ownership errors. Main owner restarts still require the coordinated release boundary in runtime.md.
3. Use the same checkout, profile, ports and exact Origin. Updated attached clients recover before their next dispatch; the frontend's service checks every two seconds. Older clients still need a coordinated reconnect. Invalid metadata, a live PID with no matching service, or an unverified listener stops recovery rather than replacing ownership.
4. Call `list_canvases`, select the intended canvas explicitly, and read current document/context/revision and persistence status. A successful read is not proof of durable storage; check `saved`, `pending`, or `failed` separately.
5. A dispatched mutation may have completed before its response was lost. Inspect actual state before deciding whether to issue another mutation. No design request is retried automatically. Ownership recovery happens before dispatch and never changes saved workspace revisions or clears browser state.

Issue #37's controlled reproduction intentionally terminated an isolated owner with SIGTERM while another client stayed attached. It reproduced the missing listener and raw fetch errors, with the frontend still available. It does not explain the original incident's shutdown cause or prove recovery from every crash scenario.
