import { callApi } from '@/lib/api-client';

/** Typed client for `src/app/example+api.ts`. Screens call this, never `fetch`. */
export type ExampleResult = { text: string };

export function runExample(text: string): Promise<ExampleResult> {
  return callApi('/example', { text }, (value) => {
    const result = value as Partial<ExampleResult> | null;
    return result && typeof result.text === 'string' ? { text: result.text } : null;
  });
}
