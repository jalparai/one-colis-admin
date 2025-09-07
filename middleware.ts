import { NextRequest, NextResponse } from 'next/server';
import acceptLanguage from 'accept-language';

acceptLanguage.languages(['en', 'fr', 'ar']);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore special files and already localized routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') ||
    /^\/(en|fr|ar)(\/|$)/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // ✅ If at root '/', redirect to preferred language or 'en'
  if (pathname === '/') {
    const lang = acceptLanguage.get(req.headers.get('accept-language')) || 'en';
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}`;
    return NextResponse.redirect(url); // <<== redirect to /en
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|.*\\..*).*)'],
};
