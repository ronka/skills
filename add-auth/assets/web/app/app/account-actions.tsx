"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function AccountActions() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function signOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  async function deleteAccount() {
    if (!window.confirm("למחוק את החשבון וכל המידע שלו? אי אפשר לבטל את זה.")) return;
    const { error } = await authClient.deleteUser({ callbackURL: "/" });
    if (!error) return router.replace("/");
    // Deleting needs a recent sign-in. Older sessions sign in again first.
    setMessage(
      error.code === "SESSION_EXPIRED"
        ? "מטעמי אבטחה, התחברו מחדש ונסו שוב."
        : "לא הצלחנו למחוק את החשבון. נסו שוב.",
    );
  }

  return (
    <div className="mt-10 flex flex-wrap gap-3">
      <button className="rounded-full bg-[var(--ink)] px-6 py-3 font-bold text-white" onClick={signOut} type="button">
        התנתקות
      </button>
      <button className="rounded-full border border-red-300 px-6 py-3 font-bold text-red-700" onClick={deleteAccount} type="button">
        מחיקת החשבון
      </button>
      {message ? (
        <p className="w-full text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
