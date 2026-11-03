#!/usr/bin/env node
import { createRequire } from 'node:module';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

const allowWrites = ['1', 'true', 'yes'].includes((process.env.GPX_MCP_ALLOW_WRITES ?? '').toLowerCase());

const server = createServer(
  {
    token: process.env.GPX_API_TOKEN?.trim() || undefined,
    baseUrl: process.env.GPX_API_BASE_URL?.trim() || 'https://api.gpx.co',
    allowWrites,
    userAgent: `gpx-mcp/${version}`,
  },
  version,
);

await server.connect(new StdioServerTransport());
