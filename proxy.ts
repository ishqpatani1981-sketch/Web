import { NextResponse, type NextRequest } from 'next/server';

/**
 * Fast gate for the admin area: visitors without a session cookie are sent to the admin
 * sign-in page. This is only a first line of defence — every admin page, layout and
 * server action independently verifies the session and role against the database.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !req.cookies.get('po_session')) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
