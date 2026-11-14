# Multiple MCP sessions

Multiple `open-cavas` stdio processes can share one automatically connected browser broker when they use the same checkout, `CAVAS_MCP_PORT`, and exact `CAVAS_APP_ORIGIN`.

The first process that binds the configured loopback port owns the WebSocket listener and internal credential. Later processes do not create a second listener or rotate the selected profile's `.cavas/runtime/<profile>/<app-port>-<broker-port>/broker.json`; they read its owner-only metadata and authenticate to the existing listener over loopback before forwarding canvas listing and requests. A port collision without matching private metadata and an authenticated broker identity is rejected. This is not an unauthenticated HTTP MCP endpoint.

`.cavas` must be a non-symlink directory with mode `0700`; broker metadata must be a regular file with mode `0600`. Metadata records the broker PID and random instance ID alongside the private internal secret, port, and exact origin. A process only removes metadata for its own instance during shutdown. A stale metadata file is removed only when its recorded PID is no longer alive, its authenticated broker identity does not prove that listener still owns the file, and the file has not changed since it was read. Invalid or mismatched live ownership is an error, not grounds to overwrite pairing data.

The owner remains the single writer for browser sockets and pending requests. Each request remains bound to its selected browser socket; cancellation and timeout can still leave a dispatched mutation's outcome unknown. Clients must read state before deciding whether to repeat a mutation. The shared transport does not add mutation retries, merge edits, or provide cross-browser synchronization.

Existing legacy brokers that lack PID/instance metadata are not automatically adopted or overwritten. Deliberately restart the owner under the new code, then reload dependent MCP clients. Existing sessions may also need their normal agent reload to discover newly registered tools.

Main and development use separate internal metadata and generated MCP entries. Keep the owner alive while attached sessions use it. Browser tabs register automatically without a code and retry after owner restart. No manual Pair action is required. Use the same checkout/profile/port/Origin for shared clients; mismatched configuration is refused. See runtime.md for release boundaries and mcp.md for the automatic one-use browser ticket protocol.
