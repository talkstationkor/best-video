import { NextRequest, NextResponse } from "next/server";

// This only checks whether the "who am I" cookie is present, so an
// unselected browser is bounced back to the entry screen. It is NOT the
// authorization layer — that lives in lib/permissions.ts and runs inside
// every API route against the real Member row in the database. A missing
// or forged cookie value simply fails getCurrentMember() there and the
// request is rejected with 401/403 regardless of what this file does.
const PROTECTED_PREFIXES = ["/dashboard", "/projects", "/notifications", "/activity", "/settings"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasMember = req.cookies.has("bv_member_id");
  if (!hasMember) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/notifications/:path*", "/activity/:path*", "/settings/:path*"]
};
