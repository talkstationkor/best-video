import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions, ForbiddenError } from "@/lib/permissions";
import { logActivity, notifyTeam } from "@/lib/activity";

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

    const now = new Date();

    const isBestVideoReview =
      version.project.workflowStatus === "BEST_VIDEO_REVIEW";

    const isOurTeamReview =
      version.project.workflowStatus === "OUR_TEAM_REVIEW";

    if (!isBestVideoReview && !isOurTeamReview) {
      return NextResponse.json(
        {
          error: "This project is not currently waiting for an approval."
        },
        { status: 409 }
      );
    }

    const nextWorkflowStatus = isBestVideoReview
      ? "OUR_TEAM_REVIEW"
      : "FINAL_APPROVED";

    const isFinalApproval = nextWorkflowStatus === "FINAL_APPROVED";

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
          status: isFinalApproval ? "APPROVED" : "REVIEW_REQUIRED",
          workflowStatus: nextWorkflowStatus,
          approvedAt: isFinalApproval ? now : null,
          approvedById: isFinalApproval ? member.id : null,
          finalVersionId: isFinalApproval ? version.id : null
        }
      })
    ]);

    await logActivity({
      actor: member,
      action: isFinalApproval
        ? "FINAL_APPROVED"
        : "BEST_VIDEO_APPROVED",
      projectId: version.projectId,
      versionId: version.id,
      detail: `V${version.versionNumber}`
    });

    await notifyTeam({
      team: version.project.team,
      type: isFinalApproval
        ? "FINAL_APPROVED"
        : "VIDEO_APPROVED",
      message: isFinalApproval
        ? `${member.name} gave final approval to V${version.versionNumber} of "${version.project.projectName}"`
        : `${member.name} approved V${version.versionNumber}. The project is now waiting for team review.`,
      projectId: version.projectId,
      versionId: version.id
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