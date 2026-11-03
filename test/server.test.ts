import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { createServer } from '../src/server.js';
import { operations } from '../src/operations.js';

async function listTools(allowWrites: boolean) {
  const server = createServer({ token: 't', baseUrl: 'https://api.example.test', allowWrites, userAgent: 'test' }, '0.0.0');
  const client = new Client({ name: 'test', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const { tools } = await client.listTools();
  await client.close();
  return tools;
}

describe('tool listing', () => {
  it('lists only read-only tools by default', async () => {
    const tools = await listTools(false);
    expect(tools.length).toBe(operations.filter((op) => op.readOnly).length);
    expect(tools.every((tool) => tool.annotations?.readOnlyHint)).toBe(true);
    expect(tools.map((tool) => tool.name)).toContain('list_devices');
  });

  it('lists every tool when writes are on', async () => {
    const tools = await listTools(true);
    expect(tools.length).toBe(operations.length);
    expect(tools.find((tool) => tool.name === 'delete_geofence')?.annotations?.destructiveHint).toBe(true);
  });
});

describe('generated operations', () => {
  it('have valid, unique tool names', () => {
    const names = operations.map((op) => op.name);
    expect(new Set(names).size).toBe(names.length);
    names.forEach((name) => expect(name).toMatch(/^[a-z0-9_]{1,64}$/));
  });

  it('never put a body on a read', () => {
    operations.filter((op) => op.readOnly).forEach((op) => expect(op.fields.body).toEqual([]));
  });

  it('cover the v1 surface the ticket names', () => {
    const paths = new Set(operations.map((op) => op.path.split('/')[2]));
    ['account', 'devices', 'geofences', 'shipments', 'users', 'groups', 'container-types', 'place-types', 'events'].forEach((p) =>
      expect(paths).toContain(p),
    );
  });
});
