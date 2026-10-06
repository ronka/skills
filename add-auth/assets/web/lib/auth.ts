import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";

import { database } from "./database";
import { sendEmail } from "./email";

export const MAGIC_LINK_EXPIRES_IN_SECONDS = 15 * 60;

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }
    : null;

/** True when Google sign-in is configured; the login page shows its button only then. */
export const googleSignInEnabled = Boolean(google);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: database(),
  socialProviders: google ? { google } : {},
  account: {
    // Google and a magic link for the same verified email are one account.
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  user: {
    // Lets users delete their account from /app. Needs a session newer than a day.
    deleteUser: { enabled: true },
  },
  rateLimit: {
    // Shared across serverless instances, so limits hold in production.
    storage: "database",
  },
  plugins: [
    magicLink({
      expiresIn: MAGIC_LINK_EXPIRES_IN_SECONDS,
      // Stored hashed, so a database leak doesn't expose usable links.
      storeToken: "hashed",
      rateLimit: { window: 60, max: 5 },
      // The one sender for every sign-in link. Other skills extend it rather than adding a second.
      async sendMagicLink({ email, url }) {
        const minutes = MAGIC_LINK_EXPIRES_IN_SECONDS / 60;
        await sendEmail({
          to: email,
          subject: "קישור הכניסה שלכם",
          content: {
            preview: "לחצו כדי להתחבר",
            heading: "קישור הכניסה שלכם מוכן",
            paragraphs: ["לחצו על הכפתור כדי להתחבר. אם לא ביקשתם את הקישור, אפשר להתעלם מהמייל."],
            action: { label: "כניסה", url },
            footer: `הקישור תקף ל־${minutes} דקות וניתן לשימוש פעם אחת.`,
          },
        });
      },
    }),
    // Keep last: lets server actions set the session cookie.
    nextCookies(),
  ],
});
