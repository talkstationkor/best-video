import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions, ForbiddenError } from "@/lib/permissions";
import { logActivity, notifyTeam } from "@/lib/activity";

// POST /api/versions/:id/request-revision
// This is the "critical action" the spec calls out by name: even if a
// Submitter finds and calls this URL directly from devtools, the server
// re-derives their role from the database and rejects it (403) before
// touching any data.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please choose who you are." }, { status: 401 });
    if (!permissions.canRequestRevision(member)) throw new ForbiddenError();

    const version = await prisma.projectVersion.findUnique({
      where: { id: params.id },
      include: { project: true, feedback: true }
    });
    if (!version) return NextResponse.json({ error: "Version not found." }, { status: 404 });

    if (version.versionNumber !== version.project.currentVersion) {
      return NextResponse.json(
        { error: "Only the current version can be sent back for revision." },
        { status: 409 }
      );
    }
    if (version.feedback.length === 0) {
      return NextResponse.json(
        { error: "Add at least one feedback item before requesting a revision." },
        { status: 400 }
      );
    }

    const [updatedVersion, updatedProject] = await prisma.$transaction([
      prisma.projectVersion.update({ where: { id: version.id }, data: { status: "REVISION_REQUESTED" } }),
      prisma.project.update({ where: { id: version.projectId }, data: { status: "REVISION_REQUESTED" } })
    ]);

    await logActivity({
      actor: member,
      action: "REVISION_REQUESTED",
      projectId: version.projectId,
      versionId: version.id,
      detail: `V${version.versionNumber}`
    });

    await notifyTeam({
      team: version.project.team,
      type: "REVISION_REQUESTED",
      message: `${member.name} requested a revision on V${version.versionNumber} of "${version.project.projectName}"`,
      projectId: version.projectId,
      versionId: version.id
    });

    return NextResponse.json({ version: updatedVersion, project: updatedProject });
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
