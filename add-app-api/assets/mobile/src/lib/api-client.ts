/**
 * Calls this app's own API routes by relative path. In development Expo sends
 * them to the dev server; in release builds to the `origin` set on the
 * `expo-router` plugin in app.json.
 */

// Shown to the user, so write them in the product's primary locale.
const messages = {
  network: 'Could not reach the server. Check your connection and try again.',
  failed: 'Something went wrong. Please try again.',
  shape: 'The server sent an unexpected response. Please try again.',
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/**
 * Extra headers for every call. `add-auth` replaces the body with:
 * `const cookie = await authClient.getCookie(); return cookie ? { cookie } : {};`
 */
async function authHeaders(): Promise<Record<string, string>> {
  return {};
}

/**
 * POSTs `body` as JSON (or GETs when `body` is undefined) and returns the
 * parsed response. `parse` checks the shape and returns the typed value, or
 * null when the shape is wrong.
 */
export async function callApi<T>(
  path: `/${string}`,
  body: unknown,
  parse: (value: unknown) => T | null,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(await authHeaders()),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'omit',
    });
  } catch {
    throw new ApiError(messages.network);
  }

  const value: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (value as { error?: unknown } | null)?.error;
    throw new ApiError(typeof error === 'string' ? error : messages.failed, response.status);
  }

  const parsed = parse(value);
  if (parsed === null) throw new ApiError(messages.shape, response.status);
  return parsed;
}
