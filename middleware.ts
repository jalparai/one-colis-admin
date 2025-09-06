// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import acceptLanguage from 'accept-language';

acceptLanguage.languages(['en', 'fr', 'ar']);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip Next.js internals and public files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Redirect non-locale routes to default (/en)
  if (!/^\/(en|fr|ar)(\/|$)/.test(pathname)) {
    const lang = acceptLanguage.get(req.headers.get('accept-language')) || 'en';
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|.*\\..*).*)'],
};
