import { expoClient } from '@better-auth/expo/client';
import { magicLinkClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

// The app's URI scheme from app.json `scheme`.
const APP_SCHEME = 'appscheme';

// The same origin relative fetch uses: the dev server in development, the
// expo-router `origin` in release builds. The Expo plugin needs it absolute.
const origin = globalThis.location?.origin ?? '';

/** The session lives in SecureStore and survives app restarts. */
export const authClient = createAuthClient({
  baseURL: `${origin}/api/auth`,
  plugins: [
    expoClient({ scheme: APP_SCHEME, storagePrefix: APP_SCHEME, storage: SecureStore }),
    magicLinkClient(),
  ],
});
