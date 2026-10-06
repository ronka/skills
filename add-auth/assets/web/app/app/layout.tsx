import { requireUser } from "@/lib/session";

/** Everything under /app needs a signed-in user. Each page and server action still checks for itself. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
