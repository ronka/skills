import { expo } from '@better-auth/expo';
import { Pool } from '@neondatabase/serverless';
import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';

import { sendEmail } from '@/server/email';

// The app's URI scheme from app.json `scheme`.
const APP_SCHEME = 'appscheme';
const MAGIC_LINK_EXPIRES_IN_SECONDS = 15 * 60;

/** Deep links the server may send a sign-in token to. Expo Go only in development. */
export function trustedOrigins() {
  return [`${APP_SCHEME}://`, ...(process.env.NODE_ENV === 'development' ? ['exp://'] : [])];
}

/**
 * One auth instance per request: API routes run on Cloudflare Workers, which
 * can't share a database connection between requests.
 */
function createAuth(pool: Pool) {
  return betterAuth({
    // Set in EAS production. EAS Hosting rewrites Origin to the production URL,
    // so without it every sign-in fails. Leave it empty in .env.local: development
    // then uses the dev server's own address, which a phone on the same Wi-Fi can open.
    baseURL: process.env.BETTER_AUTH_URL || undefined,
    secret: process.env.BETTER_AUTH_SECRET,
    database: pool,
    trustedOrigins: trustedOrigins(),
    // EAS Hosting sets x-real-ip and overwrites any value the client sends.
    advanced: { ipAddress: { ipAddressHeaders: ['x-real-ip'] } },
    rateLimit: { storage: 'database' },
    user: { deleteUser: { enabled: true } },
    plugins: [
      expo(),
      magicLink({
        expiresIn: MAGIC_LINK_EXPIRES_IN_SECONDS,
        storeToken: 'hashed',
        rateLimit: { window: 60, max: 5 },
        // The email links to an https page on this API, which hands the token to the
        // app. Email clients keep https links clickable, and no session cookie is
        // ever set in the browser.
        async sendMagicLink({ email, url, token }) {
          const verifyUrl = new URL(url);
          const link = new URL('/auth/open', verifyUrl.origin);
          link.searchParams.set('token', token);
          link.searchParams.set('to', verifyUrl.searchParams.get('callbackURL') ?? '');
          const minutes = MAGIC_LINK_EXPIRES_IN_SECONDS / 60;
          await sendEmail({
            to: email,
            subject: 'קישור הכניסה שלכם',
            content: {
              preview: 'לחצו כדי להתחבר באפליקציה',
              heading: 'קישור הכניסה שלכם מוכן',
              paragraphs: ['פתחו את המייל הזה בטלפון שבו מותקנת האפליקציה ולחצו על הכפתור.'],
              action: { label: 'כניסה לאפליקציה', url: link.toString() },
              footer: `הקישור תקף ל־${minutes} דקות וניתן לשימוש פעם אחת. אם לא ביקשתם אותו, אפשר להתעלם מהמייל.`,
            },
          });
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** Runs `work` with a fresh auth instance and closes its pool afterwards. */
export async function withAuth<T>(work: (auth: Auth) => Promise<T>) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    return await work(createAuth(pool));
  } finally {
    await pool.end();
  }
}

/** The signed-in user for an API route, or null. Return 401 when it is null. */
export async function requireUser(request: Request) {
  const session = await withAuth((auth) => auth.api.getSession({ headers: request.headers }));
  return session?.user ?? null;
}

/** Only for src/server/auth-cli.ts. Routes use withAuth or requireUser. */
export { createAuth as createAuthForCli };
