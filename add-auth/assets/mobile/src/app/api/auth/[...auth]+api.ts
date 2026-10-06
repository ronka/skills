import { withAuth } from '@/server/auth';

const handler = (request: Request) => withAuth((auth) => auth.handler(request));

export { handler as GET, handler as POST };
