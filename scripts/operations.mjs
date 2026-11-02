import { parse } from 'yaml';

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const TOOL_NAME = /^[a-z0-9_]{1,64}$/;

export function toolName(operationId) {
  return operationId
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .toLowerCase();
}

export function buildOperations(specText) {
  const spec = parse(specText);
  const problems = [];

  const resolveRef = (ref) => {
    const schema = spec.components?.schemas?.[ref.replace('#/components/schemas/', '')];
    if (!schema) throw new Error(`Unresolvable $ref ${ref}`);
    return schema;
  };

  // Inlines $refs and turns the OpenAPI 3.0 dialect into plain JSON Schema. Spec examples
  // are dropped: Scribe invents them, and a model reads an example as a suggested value.
  const toJsonSchema = (schema) => {
    if (Array.isArray(schema)) return schema.map(toJsonSchema);
    if (schema === null || typeof schema !== 'object') return schema;
    if (schema.$ref) return toJsonSchema(resolveRef(schema.$ref));

    const out = {};
    for (const [key, value] of Object.entries(schema)) {
      if (key === 'example' || key === 'nullable') continue;
      if (key === 'description' && value === '') continue;
      out[key] = key === 'properties'
        ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJsonSchema(v)]))
        : toJsonSchema(value);
    }
    if (schema.nullable && typeof out.type === 'string') out.type = [out.type, 'null'];
    return out;
  };

  const operations = [];

  for (const [path, item] of Object.entries(spec.paths)) {
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      const where = `${method.toUpperCase()} ${path}`;

      if (!op.operationId) {
        problems.push(`${where}: no operationId`);
        continue;
      }
      const name = toolName(op.operationId);
      if (!TOOL_NAME.test(name)) problems.push(`${where}: tool name "${name}" is not 1-64 of [a-z0-9_]`);

      const properties = {};
      const required = [];
      const fields = { path: [], query: [], body: [] };

      const add = (field, location, schema, isRequired) => {
        if (properties[field]) {
          problems.push(`${where}: "${field}" appears in more than one place`);
          return;
        }
        properties[field] = schema;
        fields[location].push(field);
        if (isRequired) required.push(field);
      };

      for (const param of [...(item.parameters ?? []), ...(op.parameters ?? [])]) {
        if (param.in !== 'path' && param.in !== 'query') {
          problems.push(`${where}: unsupported parameter location "${param.in}" for ${param.name}`);
          continue;
        }
        const schema = toJsonSchema(param.schema ?? {});
        if (param.description) schema.description = param.description;
        else delete schema.description;
        add(param.name, param.in, schema, param.in === 'path' || param.required);
      }

      const body = op.requestBody?.content?.['application/json']?.schema;
      if (body && method === 'get') problems.push(`${where}: a GET with a request body`);
      if (body) {
        const schema = toJsonSchema(body);
        if (schema.type !== 'object') problems.push(`${where}: request body is not an object`);
        for (const [field, fieldSchema] of Object.entries(schema.properties ?? {})) {
          add(field, 'body', fieldSchema, (schema.required ?? []).includes(field));
        }
      }

      operations.push({
        name,
        title: op.summary ?? name,
        description: [op.summary, op.description].filter(Boolean).join('\n\n'),
        method: method.toUpperCase(),
        path,
        readOnly: method === 'get',
        fields,
        inputSchema: {
          type: 'object',
          properties,
          ...(required.length ? { required } : {}),
          additionalProperties: false,
        },
      });
    }
  }

  const seen = new Set();
  for (const { name } of operations) {
    if (seen.has(name)) problems.push(`duplicate tool name ${name}`);
    seen.add(name);
  }

  if (problems.length) {
    throw new Error(`The spec cannot be turned into tools:\n- ${problems.join('\n- ')}`);
  }
  return operations;
}

export function serialize(operations) {
  return `${JSON.stringify(operations, null, 2)}\n`;
}
