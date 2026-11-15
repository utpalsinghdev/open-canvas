---
"open-cavas": minor
---

Allow installed font family names in text layers, font tokens, JSON imports, and restricted HTML import. Add inspector family entry, explicit browser detection and fallback status, and optional family queries through get_fonts. Preserve case-insensitive bundled font loading and export embedding.

MCP font availability now uses available, unavailable, loading, or unverified instead of system. Screenshot font metadata changes from a keyed object to an array of family/availability entries. System fonts are not embedded in exports, and headless availability remains unverified. Reload browser tabs and reconnect MCP clients after upgrading.
