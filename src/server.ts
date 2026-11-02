import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { callOperation, type Config } from './client.js';
import { operations } from './operations.js';

export function createServer(config: Config, version: string): Server {
  const available = operations.filter((op) => op.readOnly || config.allowWrites);
  const byName = new Map(available.map((op) => [op.name, op]));

  const server = new Server({ name: 'gpx', version }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: available.map((op) => ({
      name: op.name,
      title: op.title,
      description: op.description,
      inputSchema: op.inputSchema,
      annotations: {
        title: op.title,
        readOnlyHint: op.readOnly,
        destructiveHint: op.method === 'DELETE',
        idempotentHint: op.method !== 'POST',
        openWorldHint: false,
      },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const op = byName.get(request.params.name);
    if (!op) {
      return { content: [{ type: 'text', text: `Unknown tool ${request.params.name}.` }], isError: true };
    }
    return callOperation(op, request.params.arguments ?? {}, config);
  });

  return server;
}
