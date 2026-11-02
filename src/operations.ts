import generated from './generated/operations.json' with { type: 'json' };

export type Operation = {
  name: string;
  title: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  readOnly: boolean;
  fields: { path: string[]; query: string[]; body: string[] };
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
};

export const operations = generated as Operation[];
