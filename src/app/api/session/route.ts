import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentMemberCookieName, getCurrentMember } from "@/lib/session";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ member: null });
  return NextResponse.json({ member });
}

// Body: { memberId } OR { team, name } to self-register a new member as
// a Submitter/Reviewer on the fly (per spec section 2: a free-text name
// entry is allowed in addition to picking from the Admin-managed list).
// New self-entered members default to the base role for their team and
// can be adjusted afterwards by an Admin in Settings > Members.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { memberId, team, name } = body as {
    memberId?: string;
    team?: "BEST_VIDEO_TEAM" | "TMT";
    name?: string;
  };

  let member;

  if (memberId) {
    member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || !member.isActive) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }
  } else if (team && name && name.trim()) {
    const cleanName = name.trim().slice(0, 80);
    const defaultRole = team === "BEST_VIDEO_TEAM" ? "SUBMITTER" : "REVIEWER";
    member = await prisma.member.upsert({
      where: { name_team: { name: cleanName, team } },
      update: { isActive: true },
      create: { name: cleanName, team, role: defaultRole }
    });
  } else {
    return NextResponse.json({ error: "team and name are required." }, { status: 400 });
  }

  const res = NextResponse.json({ member });
  res.cookies.set(currentMemberCookieName(), member.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(currentMemberCookieName());
  return res;
}
