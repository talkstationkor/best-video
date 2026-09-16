import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions, ForbiddenError } from "@/lib/permissions";
import { sanitizeText } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

// PATCH — edit message, or change status (resolve/reopen).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please choose who you are." }, { status: 401 });

    const feedback = await prisma.feedback.findUnique({
      where: { id: params.id },
      include: { version: true }
    });
    if (!feedback) return NextResponse.json({ error: "Feedback not found." }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.message === "string") {
      if (!permissions.canEditOrDeleteFeedback(member, feedback.authorId)) throw new ForbiddenError();
      data.message = sanitizeText(body.message, 4000);
    }

    if (typeof body.status === "string") {
      if (!permissions.canResolveFeedback(member)) throw new ForbiddenError();
      if (!["OPEN", "RESOLVED"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      data.status = body.status;
      data.resolvedAt = body.status === "RESOLVED" ? new Date() : null;
      data.resolvedById = body.status === "RESOLVED" ? member.id : null;
    }

    const updated = await prisma.feedback.update({ where: { id: params.id }, data });

    await logActivity({
      actor: member,
      action: data.status === "RESOLVED" ? "FEEDBACK_RESOLVED" : "FEEDBACK_EDITED",
      projectId: feedback.version.projectId,
      versionId: feedback.versionId
    });

    return NextResponse.json({ feedback: updated });
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// DELETE — Reviewer (own feedback) or Admin (any feedback).
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please choose who you are." }, { status: 401 });

    const feedback = await prisma.feedback.findUnique({ where: { id: params.id } });
    if (!feedback) return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
    if (!permissions.canEditOrDeleteFeedback(member, feedback.authorId)) throw new ForbiddenError();

    await prisma.feedback.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
