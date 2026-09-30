import { NextRequest, NextResponse } from "next/server";
import { bvFetch } from "@/lib/bvApi";
import { currentMemberCookieName, getCurrentMember } from "@/lib/session";

export async function GET() {
  const member = await getCurrentMember();
  return NextResponse.json({ member });
}

// Body: { memberId } to pick an existing member, or { team, name } to
// self-register. The tmt API validates it and returns the member, whose id
// this app then remembers in a cookie.
export async function POST(req: NextRequest) {
  const res = await bvFetch("/session", {
    method: "POST",
    rawBody: await req.text()
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.member) {
    return NextResponse.json(
      { error: data.error ?? "Something went wrong. Please try again." },
      { status: res.ok ? 500 : res.status }
    );
  }

  const response = NextResponse.json({ member: data.member });
  response.cookies.set(currentMemberCookieName(), data.member.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });
  return response;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(currentMemberCookieName());
  return res;
}
