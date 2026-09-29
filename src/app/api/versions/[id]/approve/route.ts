import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions, ForbiddenError } from "@/lib/permissions";
import { logActivity, notifyProjectParticipants } from "@/lib/activity";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const member = await getCurrentMember();

    if (!member) {
      return NextResponse.json(
        { error: "Please choose who you are." },
        { status: 401 }
      );
    }

    if (!permissions.canApprove(member)) {
      throw new ForbiddenError();
    }

    const version = await prisma.projectVersion.findUnique({
      where: { id: params.id },
      include: { project: true }
    });

    if (!version) {
      return NextResponse.json(
        { error: "Version not found." },
        { status: 404 }
      );
    }

    if (version.project.workflowStatus === "FINAL_APPROVED") {
      return NextResponse.json(
        { error: "This project has already received final approval." },
        { status: 409 }
      );
    }

    if (version.project.finalVersionId) {
      return NextResponse.json(
        { error: "This project already has a final version." },
        { status: 409 }
      );
    }

    if (version.versionNumber !== version.project.currentVersion) {
      return NextResponse.json(
        { error: "Only the current version can be approved." },
        { status: 409 }
      );
    }

    // Either Best Video or TMT may review at any time and in any order.
    // One approval is final. A version that was sent back for revision
    // cannot be approved — the editor has to submit a new one first.
    if (version.status !== "REVIEW_REQUIRED") {
      return NextResponse.json(
        {
          error: "This version is not currently waiting for review."
        },
        { status: 409 }
      );
    }

    const now = new Date();

    const [updatedVersion, updatedProject] = await prisma.$transaction([
      prisma.projectVersion.update({
        where: { id: version.id },
        data: {
          status: "APPROVED",
          approvedAt: now,
          approvedById: member.id
        }
      }),

      prisma.project.update({
        where: { id: version.projectId },
        data: {
          status: "APPROVED",
          workflowStatus: "FINAL_APPROVED",
          approvedAt: now,
          approvedById: member.id,
          finalVersionId: version.id
        }
      })
    ]);

    await logActivity({
      actor: member,
      action: "FINAL_APPROVED",
      projectId: version.projectId,
      versionId: version.id,
      detail: `V${version.versionNumber}`
    });

    await notifyProjectParticipants({
      project: version.project,
      type: "FINAL_APPROVED",
      message: `${member.name} gave final approval to V${version.versionNumber} of "${version.project.projectName}"`,
      versionId: version.id,
      excludeMemberId: member.id
    });

    return NextResponse.json({
      version: updatedVersion,
      project: updatedProject
    });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json(
        { error: err.message },
        { status: 403 }
      );
    }

    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}