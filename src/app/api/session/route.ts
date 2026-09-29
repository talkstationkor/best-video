import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentMemberCookieName, getCurrentMember } from "@/lib/session";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ member: null });
  return NextResponse.json({ member });
}

// Base role for a self-registered member of each team. Editors must never
// default to a reviewing role — that would let anyone who types a new name
// on the Editor Team screen approve videos.
const DEFAULT_ROLE_BY_TEAM: Record<string, string> = {
  BEST_VIDEO_TEAM: "SUBMITTER",
  EDITOR_TEAM: "EDITOR",
  TMT: "REVIEWER"
};

// Body: { memberId } OR { team, name } to self-register a new member on
// the fly (per spec section 2: a free-text name entry is allowed in
// addition to picking from the Admin-managed list). New self-entered
// members get the base role for their team and can be adjusted
// afterwards by an Admin in Settings > Members.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { memberId, team, name } = body as {
    memberId?: string;
    team?: string;
    name?: string;
  };

  let member;

  if (memberId) {
    member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || !member.isActive) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }
  } else if (team && name && name.trim()) {
    const defaultRole = DEFAULT_ROLE_BY_TEAM[team];
    if (!defaultRole) {
      return NextResponse.json({ error: "A valid team is required." }, { status: 400 });
    }

    const cleanName = name.trim().slice(0, 80);
    const existing = await prisma.member.findUnique({
      where: { name_team: { name: cleanName, team } }
    });

    // A deactivated member was removed by an Admin; typing the same name
    // again must not silently bring them back.
    if (existing && !existing.isActive) {
      return NextResponse.json(
        { error: "This member has been deactivated. Please contact an Admin." },
        { status: 403 }
      );
    }

    member = existing ?? await prisma.member.create({
      data: { name: cleanName, team, role: defaultRole }
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
