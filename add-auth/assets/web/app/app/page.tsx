import { requireUser } from "@/lib/session";

import { AccountActions } from "./account-actions";

export default async function AppHome() {
  const user = await requireUser();

  return (
    <main className="min-h-screen bg-[var(--paper)] px-5 py-16 text-[var(--ink)]">
      <section className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-black">שלום{user.name ? `, ${user.name}` : ""}</h1>
        <p className="mt-3 text-black/60">
          מחוברים בתור <bdi dir="ltr">{user.email}</bdi>
        </p>
        <AccountActions />
      </section>
    </main>
  );
}
