import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/accept-invite'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the user has a token in cookies (for SSR auth check)
  const tokenCookie = request.cookies.get('joino_token');

  // Fix: Use exact match for '/' to avoid matching ALL paths (as all start with '/')
  const isPublicPath = PUBLIC_PATHS.some((p) => 
    p === '/' ? pathname === '/' : pathname.startsWith(p)
  );

  if (!tokenCookie && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (tokenCookie && isPublicPath) {
    // Do not redirect /accept-invite or the landing page itself if we want members to see it?
    // Actually, usually we redirect logged-in users to dashboard.
    if (pathname.startsWith('/accept-invite')) {
      return NextResponse.next();
    }
    // Only redirect if they are on a public login/register/landing page
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
};
