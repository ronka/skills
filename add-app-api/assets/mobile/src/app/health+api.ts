/**
 * Liveness check. On EAS Hosting the request URL carries the deployment's own
 * host, so `deployment` shows which deployment production is serving.
 * `npm run deploy:api` uses it to confirm a new deployment went live.
 */
export function GET(request: Request) {
  return Response.json({ ok: true, deployment: new URL(request.url).host });
}
