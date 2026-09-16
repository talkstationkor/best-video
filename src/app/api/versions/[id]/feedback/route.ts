import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions, ForbiddenError } from "@/lib/permissions";
import { requireNonEmpty, sanitizeText, ValidationError } from "@/lib/validation";
import { logActivity, notifyTeam } from "@/lib/activity";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please choose who you are." }, { status: 401 });
    // Enforced here regardless of whether the "+ Add Feedback" button is
    // visible in the UI — a Submitter calling this endpoint directly
    // still gets rejected.
    if (!permissions.canAddFeedback(member)) throw new ForbiddenError();

    const version = await prisma.projectVersion.findUnique({
      where: { id: params.id },
      include: { project: true }
    });
    if (!version) return NextResponse.json({ error: "Version not found." }, { status: 404 });

    const body = await req.json();
    const message = requireNonEmpty(body.message, "Feedback message");
    const timestamp = sanitizeText(body.timestamp, 20) || null;

    const feedback = await prisma.feedback.create({
      data: { versionId: version.id, authorId: member.id, message, timestamp, status: "OPEN" }
    });

    await logActivity({
      actor: member,
      action: "FEEDBACK_ADDED",
      projectId: version.projectId,
      versionId: version.id,
      detail: timestamp ? `at ${timestamp}` : undefined
    });

    await notifyTeam({
      team: version.project.team,
      type: "FEEDBACK_ADDED",
      message: `${member.name} added feedback on V${version.versionNumber} of "${version.project.projectName}"`,
      projectId: version.projectId,
      versionId: version.id
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
    if (err instanceof ValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
