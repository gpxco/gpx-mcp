import type { Operation } from './operations.js';

export type Config = {
  token: string | undefined;
  baseUrl: string;
  allowWrites: boolean;
  userAgent: string;
};

export type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

const TIMEOUT_MS = 30_000;
const LOOPBACK = ['localhost', '127.0.0.1', '[::1]'];

const text = (value: string, isError = false): ToolResult => ({
  content: [{ type: 'text', text: value }],
  ...(isError ? { isError: true } : {}),
});

export function baseUrlProblem(baseUrl: string): string | undefined {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return `GPX_API_BASE_URL is not a valid URL: ${baseUrl}`;
  }
  if (url.protocol === 'https:' || (url.protocol === 'http:' && LOOPBACK.includes(url.hostname))) return undefined;
  return `GPX_API_BASE_URL must use https, so the token is never sent in clear text (http is allowed only for localhost): ${baseUrl}`;
}

export function buildRequest(op: Operation, args: Record<string, unknown>, baseUrl: string) {
  const path = op.path.replace(/\{(\w+)\}/g, (_, field: string) => {
    if (args[field] === undefined || args[field] === null || args[field] === '') {
      throw new Error(`${field} is required`);
    }
    return encodeURIComponent(String(args[field]));
  });

  const url = new URL(baseUrl.replace(/\/+$/, '') + path);
  for (const field of op.fields.query) {
    const value = args[field];
    if (value === undefined || value === null) continue;
    // PHP keeps only the last of a repeated plain key; k[] is read as a list by every rule.
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(`${field}[]`, String(item)));
    else url.searchParams.append(field, String(value));
  }

  const bodyFields = op.fields.body.filter((field) => args[field] !== undefined);
  const body = bodyFields.length ? JSON.stringify(Object.fromEntries(bodyFields.map((f) => [f, args[f]]))) : undefined;

  return { url, body };
}

async function readMessage(response: Response): Promise<{ message: string; errors?: unknown }> {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw);
    return { message: typeof parsed.message === 'string' ? parsed.message : raw, errors: parsed.errors };
  } catch {
    return { message: raw.trim().slice(0, 300) || response.statusText };
  }
}

export async function describeError(response: Response): Promise<string> {
  const { message: raw, errors } = await readMessage(response);
  const message = raw.replace(/[.\s]+$/, '');
  const requestId = response.headers.get('x-request-id');
  const quote = requestId ? ` (request id ${requestId})` : '';

  switch (response.status) {
    case 401:
      return `The GPX API rejected the token (401): ${message}. Check GPX_API_TOKEN; the token may be wrong, expired or deleted.`;
    case 404:
      return `Not found (404): ${message}. It does not exist, or it belongs to another account.`;
    case 422:
      return `The GPX API rejected the input (422): ${message}.${errors ? `\n${JSON.stringify(errors)}` : ''}`;
    case 429: {
      const retryAfter = response.headers.get('retry-after');
      return `Rate limited (429): the token has used its 120 requests a minute. ${retryAfter ? `Try again in ${retryAfter} seconds` : 'Try again in a minute'}; do not retry before then.`;
    }
    default:
      return `The GPX API returned ${response.status}: ${message}${quote}.`;
  }
}

export async function callOperation(op: Operation, args: Record<string, unknown>, config: Config): Promise<ToolResult> {
  if (!config.token) {
    return text('GPX_API_TOKEN is not set. Add your GPX API token to the MCP server configuration.', true);
  }
  if (!op.readOnly && !config.allowWrites) {
    return text(`${op.name} changes data, and write tools are off. Set GPX_MCP_ALLOW_WRITES=1 to enable them.`, true);
  }
  const urlProblem = baseUrlProblem(config.baseUrl);
  if (urlProblem) return text(urlProblem, true);

  let request;
  try {
    request = buildRequest(op, args, config.baseUrl);
  } catch (error) {
    return text((error as Error).message, true);
  }

  let response: Response;
  try {
    response = await fetch(request.url, {
      method: op.method,
      // A redirect could carry the bearer token to another host.
      redirect: 'error',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
        'User-Agent': config.userAgent,
        ...(request.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: request.body,
    });
  } catch (error) {
    if ((error as Error).name === 'TimeoutError') {
      return text(`The GPX API did not answer within ${TIMEOUT_MS / 1000} seconds. Try again, or narrow the request.`, true);
    }
    return text(`Could not reach the GPX API at ${config.baseUrl}: ${(error as Error).message}`, true);
  }

  if (!response.ok) return text(await describeError(response), true);
  if (response.status === 204) return text(`Done (${op.method} ${request.url.pathname}).`);
  return text(await response.text());
}
