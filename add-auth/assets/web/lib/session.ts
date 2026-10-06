import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

/** The signed-in user, or null. Server-only. */
export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** The signed-in user; redirects to /login when signed out. Use in protected pages and actions. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
