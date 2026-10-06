import { trustedOrigins } from '@/server/auth';

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

/**
 * The https page a sign-in email links to. It forwards the token to the app's
 * own deep link, and only to the app's scheme, so a link can't send a token
 * to another app.
 */
export function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const to = url.searchParams.get('to') ?? '';
  if (!token || !trustedOrigins().some((origin) => to.startsWith(origin))) {
    return new Response('הקישור לא תקין.', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const target = new URL(to);
  target.searchParams.set('token', token);
  const href = escapeHtml(target.toString());

  return new Response(
    `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0;url=${href}">
<title>כניסה לאפליקציה</title>
</head>
<body style="font-family:-apple-system,Arial,sans-serif;text-align:center;padding:64px 24px">
<h1 style="font-size:22px">פותחים את האפליקציה…</h1>
<p><a href="${href}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#111;color:#fff;text-decoration:none;font-weight:700">כניסה לאפליקציה</a></p>
<p style="color:#666;font-size:14px">פתחו את הקישור בטלפון שבו מותקנת האפליקציה.</p>
</body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    },
  );
}
