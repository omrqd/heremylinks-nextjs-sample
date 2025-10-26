import { auth } from '@/lib/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  
  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!req.auth) {
      const loginUrl = new URL('/login', req.url);
      return Response.redirect(loginUrl);
    }
  }
});

export const config = {
  matcher: ['/dashboard/:path*'],
};

