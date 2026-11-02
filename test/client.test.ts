import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRequest, callOperation, type Config } from '../src/client.js';
import { operations } from '../src/operations.js';

const op = (name: string) => {
  const found = operations.find((o) => o.name === name);
  if (!found) throw new Error(`no operation ${name}`);
  return found;
};

const config: Config = { token: 'gpx_live_test', baseUrl: 'https://api.example.test/', allowWrites: false, userAgent: 'gpx-mcp/test' };

const respond = (status: number, body: string, headers: Record<string, string> = {}) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(status === 204 ? null : body, { status, headers }));

afterEach(() => vi.restoreAllMocks());

describe('buildRequest', () => {
  it('sends a list as k[] and a boolean as true/false', () => {
    const { url, body } = buildRequest(op('list_devices'), { status: ['active', 'hidden'], per_page: 10 }, config.baseUrl);
    expect(url.toString()).toBe('https://api.example.test/v1/devices?status%5B%5D=active&status%5B%5D=hidden&per_page=10');
    expect(body).toBeUndefined();
  });

  it('fills and encodes path parameters', () => {
    const { url } = buildRequest(op('get_place_type'), { placeTypeSlug: 'a b' }, config.baseUrl);
    expect(url.pathname).toBe('/v1/place-types/a%20b');
  });

  it('refuses a missing path parameter', () => {
    expect(() => buildRequest(op('get_device'), {}, config.baseUrl)).toThrow('deviceId is required');
  });

  it('puts only body fields in the body', () => {
    const { url, body } = buildRequest(op('create_shipment'), { name: 'Test', device_ids: [1] }, config.baseUrl);
    expect(url.search).toBe('');
    expect(JSON.parse(body!)).toEqual({ name: 'Test', device_ids: [1] });
  });
});

describe('callOperation', () => {
  it('sends the token as a bearer header', async () => {
    const fetch = respond(200, '{"data":[]}');
    const result = await callOperation(op('list_devices'), {}, config);
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toBe('{"data":[]}');
    const init = fetch.mock.calls[0][1]!;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer gpx_live_test');
  });

  it('explains a missing token without calling the API', async () => {
    const fetch = respond(200, '{}');
    const result = await callOperation(op('list_devices'), {}, { ...config, token: undefined });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('GPX_API_TOKEN is not set');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses a write tool when writes are off', async () => {
    const fetch = respond(200, '{}');
    const result = await callOperation(op('create_shipment'), { name: 'x' }, config);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('GPX_MCP_ALLOW_WRITES');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [401, '{"message":"Unauthenticated."}', {}, 'rejected the token (401): Unauthenticated.'],
    [404, '{"message":"Not found."}', {}, 'Not found (404): Not found. It does not exist'],
    [422, '{"message":"The name field is required.","errors":{"name":["required"]}}', {}, 'rejected the input (422): The name field is required.\n{"name":["required"]}'],
    [429, '{"message":"Too Many Attempts."}', { 'Retry-After': '17' }, 'Try again in 17 seconds'],
    [502, '<html>Bad gateway</html>', { 'X-Request-Id': '01JREQ' }, 'returned 502: <html>Bad gateway</html> (request id 01JREQ).'],
  ])('turns a %i into a readable error', async (status, body, headers, expected) => {
    respond(status, body, headers);
    const result = await callOperation(op('get_device'), { deviceId: 1 }, config);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(expected);
  });

  it('reports a network failure instead of throwing', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    const result = await callOperation(op('list_devices'), {}, config);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Could not reach the GPX API');
  });

  it('refuses to send the token over plain http', async () => {
    const fetch = respond(200, '{}');
    const result = await callOperation(op('list_devices'), {}, { ...config, baseUrl: 'http://api.gpx.co' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('must use https');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('allows plain http to localhost', async () => {
    respond(200, '{"data":[]}');
    const result = await callOperation(op('list_devices'), {}, { ...config, baseUrl: 'http://localhost:8000' });
    expect(result.isError).toBeUndefined();
  });

  it('never follows a redirect and gives up after a timeout', async () => {
    const fetch = respond(200, '{}');
    await callOperation(op('list_devices'), {}, config);
    expect(fetch.mock.calls[0][1]).toMatchObject({ redirect: 'error', signal: expect.any(AbortSignal) });
  });

  it('reports a timeout in plain words', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('aborted', 'TimeoutError'));
    const result = await callOperation(op('list_devices'), {}, config);
    expect(result.content[0].text).toContain('did not answer within 30 seconds');
  });

  it('confirms a 204', async () => {
    respond(204, '');
    const result = await callOperation(op('delete_geofence'), { geofenceId: 3 }, { ...config, allowWrites: true });
    expect(result).toEqual({ content: [{ type: 'text', text: 'Done (DELETE /v1/geofences/3).' }] });
  });
});
