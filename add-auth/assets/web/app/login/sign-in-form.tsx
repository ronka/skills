"use client";

import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/app",
      errorCallbackURL: "/login",
    });
    setState(error ? "error" : "sent");
  }

  async function signInWithGoogle() {
    await authClient.signIn.social({ provider: "google", callbackURL: "/app", errorCallbackURL: "/login" });
  }

  return (
    <div className="mt-8 space-y-4">
      <form className="space-y-4" onSubmit={sendLink}>
        <label className="block font-bold" htmlFor="email">
          אימייל
        </label>
        <input
          className="min-h-12 w-full rounded-xl border border-black/20 px-4 text-start outline-none focus:border-[var(--indigo)]"
          dir="ltr"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <button
          className="min-h-12 w-full rounded-full bg-[var(--ink)] px-6 font-bold text-white disabled:opacity-60"
          disabled={state === "sending" || state === "sent"}
          type="submit"
        >
          {state === "sending" ? "שולחים…" : state === "sent" ? "בדקו את תיבת הדואר" : "שלחו לי קישור כניסה"}
        </button>
      </form>
      {state === "sent" ? (
        <p className="text-sm leading-6 text-black/60" role="status">
          שלחנו קישור כניסה. הוא תקף ל־15 דקות. בדקו גם את תיקיית הספאם.
        </p>
      ) : null}
      {state === "error" ? (
        <p className="text-sm leading-6 text-red-700" role="alert">
          לא הצלחנו לשלוח את הקישור. נסו שוב בעוד דקה.
        </p>
      ) : null}
      {googleEnabled ? (
        <button
          className="min-h-12 w-full rounded-full border border-black/20 px-6 font-bold"
          onClick={signInWithGoogle}
          type="button"
        >
          המשך עם <bdi>Google</bdi>
        </button>
      ) : null}
    </div>
  );
}
