# GPX MCP server

Connect Claude, Cursor or any [MCP](https://modelcontextprotocol.io) client to your GPX account. The server runs on your machine and calls the [GPX Public API v1](https://api-docs.gpx.co) with your API token, so your assistant can look up devices and their positions, shipments, geofences, users, groups and the events feed.

It is read-only unless you turn writes on.

## What you need

- Node.js 20 or newer (`node --version`).
- A GPX API token (`gpx_live_…`). An account admin can create one in the GPX app under **Settings › API Access**. If your account has no API Access page, ask GPX support to turn on API access.

## Setup

### Claude Desktop

Open **Settings › Developer › Edit Config** and add:

```json
{
  "mcpServers": {
    "gpx": {
      "command": "npx",
      "args": ["-y", "@gpxco/mcp"],
      "env": { "GPX_API_TOKEN": "gpx_live_..." }
    }
  }
}
```

Restart Claude Desktop. The GPX tools appear under the tools menu in a new chat.

### Claude Code

```bash
claude mcp add gpx --env GPX_API_TOKEN=gpx_live_... -- npx -y @gpxco/mcp
```

### Cursor

Add the same `mcpServers` block as for Claude Desktop to `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project).

## Configuration

| Variable | Required | What it does |
|---|---|---|
| `GPX_API_TOKEN` | yes | Your API token. Sent as `Authorization: Bearer`. |
| `GPX_MCP_ALLOW_WRITES` | no | Set to `1` to add the tools that create, change, archive or delete data. Off by default. |
| `GPX_API_BASE_URL` | no | Defaults to `https://api.gpx.co`. Use `https://api.staging.gpx.co` for staging. |

**About writes.** An API token can do anything in your account; there are no read-only tokens yet. `GPX_MCP_ALLOW_WRITES` is the only thing that keeps the assistant from changing data, so leave it off unless you need it, and review what the assistant proposes before you approve a write tool.

## Tools

There is one tool per API endpoint, generated from the published [API reference](https://api-docs.gpx.co): 22 read tools and 30 write tools. Tool names, descriptions and inputs come straight from that reference, so the server always matches the API version it was built for.

List endpoints take `page` and `per_page`, so the assistant can page through large accounts instead of pulling everything at once.

## Errors

API errors come back to the assistant as plain sentences rather than crashes:

- A wrong, expired or deleted token is reported as such.
- A missing id, or one that belongs to another account, is "not found".
- After 120 requests in a minute the API rate-limits the token, and the assistant is told how long to wait.

## Development

```bash
npm install
npm test
npm run build
GPX_API_TOKEN=... GPX_API_BASE_URL=https://api.staging.gpx.co npx @modelcontextprotocol/inspector node dist/index.js
```

The tools are generated, never written by hand:

- `openapi/public-api-v1.yaml` is a snapshot of the published spec. `npm run spec:update` refreshes it.
- `npm run generate` turns it into `src/generated/operations.json`. CI fails if that file is stale.
- `npm run spec:check` compares the snapshot with the live spec. It runs weekly in CI.

To improve a tool's name, description or inputs, fix the API reference in gpx-engine, then refresh the snapshot here. Don't patch the generated file.

See [RELEASING.md](RELEASING.md) for publishing to npm.

## License

MIT
