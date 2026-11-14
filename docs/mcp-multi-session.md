# Multiple MCP sessions

Multiple `open-cavas` stdio processes can share one paired-browser broker when they use the same checkout, `CAVAS_MCP_PORT`, and exact `CAVAS_APP_ORIGIN`.

The first process that binds the configured loopback port owns the WebSocket listener and pairing credential. Later processes do not create a second listener or rotate `.cavas/pairing.json`; they read its owner-only metadata and authenticate to the existing listener over loopback before forwarding canvas listing and requests. A port collision without matching private metadata and an authenticated broker identity is rejected. This is not an unauthenticated HTTP MCP endpoint.

`.cavas` must be a non-symlink directory with mode `0700`; pairing metadata must be a regular file with mode `0600`. Metadata records the broker PID and random instance ID alongside the private pairing code, port, and exact origin. A process only removes metadata for its own instance during shutdown. A stale metadata file is removed only when its recorded PID is no longer alive, its authenticated broker identity does not prove that listener still owns the file, and the file has not changed since it was read. Invalid or mismatched live ownership is an error, not grounds to overwrite pairing data.

The owner remains the single writer for browser sockets and pending requests. Each request remains bound to its selected browser socket; cancellation and timeout can still leave a dispatched mutation's outcome unknown. Clients must read state before deciding whether to repeat a mutation. The shared transport does not add mutation retries, merge edits, or provide cross-browser synchronization.

Existing legacy brokers that lack PID/instance metadata are not automatically adopted or overwritten. Deliberately restart the owner under the new code, then reload dependent MCP clients. Existing sessions may also need their normal agent reload to discover newly registered tools.

Pair once with `npm run mcp:pair`. Keep the owner MCP process running while other sessions use its broker. Restarting the owner ends its browser connections; after a restart, inspect current state and pair again if the browser disconnected. Use the same configuration for each session. Different ports or origins represent a different broker configuration and are refused when they conflict with the existing owner.
