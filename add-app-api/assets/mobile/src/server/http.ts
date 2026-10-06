/**
 * Response helpers for API routes (`src/app/**\/*+api.ts`). Server-only:
 * code under `src/server/` never ships in the app bundle.
 */

export function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/** A failed request with a message that is safe to show the user. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly userMessage: string,
  ) {
    super(userMessage);
  }
}

/** Parses the JSON body, or throws a 400 the route turns into a response. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'The request body must be JSON.');
  }
}

/**
 * Turns any error into a response. Known `HttpError`s keep their status and
 * message. Anything else is logged in full and returned as a generic 502, so
 * provider errors and keys never reach the app.
 */
export function fail(error: unknown, route: string) {
  if (error instanceof HttpError) return json({ error: error.userMessage }, error.status);
  console.error(`${route} failed`, error);
  return json({ error: 'Something went wrong. Please try again.' }, 502);
}
