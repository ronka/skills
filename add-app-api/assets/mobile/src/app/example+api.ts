import { z } from 'zod';

import { HttpError, fail, json, readJson } from '@/server/http';

// Cap every input. Until the route checks who is calling, anyone with the URL
// can call it, so the cap bounds what one request can cost.
const MAX_TEXT_LENGTH = 500;

const requestSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new HttpError(400, `Write between 1 and ${MAX_TEXT_LENGTH} characters.`);
    }

    // Call the provider here, with keys read from process.env (never EXPO_PUBLIC_).
    const result = parsed.data.text.toUpperCase();

    return json({ text: result });
  } catch (error) {
    return fail(error, 'example');
  }
}
