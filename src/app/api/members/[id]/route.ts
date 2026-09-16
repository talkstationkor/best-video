import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions, ForbiddenError } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";

// PATCH /api/members/:id — Admin only. Changes team, role, or active
// status. We never delete a Member row (section 31/40): leaving the team
// is modeled as isActive=false so historical Projects/Activity/Feedback
// authored by them keep displaying their name correctly.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await getCurrentMember();
    if (!actor) return NextResponse.json({ error: "Please choose who you are." }, { status: 401 });
    if (!permissions.canManageMembers(actor)) throw new ForbiddenError();

    const target = await prisma.member.findUnique({ where: { id: params.id } });
    if (!target) return NextResponse.json({ error: "Member not found." }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.team && ["BEST_VIDEO_TEAM", "TMT"].includes(body.team)) data.team = body.team;
    if (body.role && ["SUBMITTER", "REVIEWER", "ADMIN"].includes(body.role)) data.role = body.role;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    const updated = await prisma.member.update({ where: { id: params.id }, data });

    const changeSummary = Object.keys(data)
      .map((key) => `${key} → ${String(data[key])}`)
      .join(", ");
    await logActivity({
      actor,
      action: "MEMBER_UPDATED",
      detail: `${target.name}: ${changeSummary || "no changes"}`
    });

    return NextResponse.json({ member: updated });
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
