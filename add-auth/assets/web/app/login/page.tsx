import { redirect } from "next/navigation";

import { googleSignInEnabled } from "@/lib/auth";
import { getUser } from "@/lib/session";

import { SignInForm } from "./sign-in-form";

const errors: Record<string, string> = {
  INVALID_TOKEN: "הקישור פג או שכבר השתמשתם בו. בקשו קישור חדש.",
  EXPIRED_TOKEN: "הקישור פג. בקשו קישור חדש.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getUser()) redirect("/app");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-5 py-16 text-[var(--ink)]">
      <section className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-black">התחברות</h1>
        <p className="mt-3 leading-7 text-black/60">הזינו אימייל ונשלח לכם קישור כניסה. אין צורך בסיסמה.</p>
        {error ? (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">
            {errors[error] ?? "לא הצלחנו להתחבר. נסו שוב."}
          </p>
        ) : null}
        <SignInForm googleEnabled={googleSignInEnabled} />
      </section>
    </main>
  );
}
