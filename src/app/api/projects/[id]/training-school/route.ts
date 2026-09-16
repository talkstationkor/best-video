import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions, ForbiddenError } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";

export async function POST(
  req: NextRequest,
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

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        finalVersion: true,
        versions: {
          where: {
            status: "APPROVED"
          },
          orderBy: {
            versionNumber: "desc"
          },
          take: 1
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    if (
      !permissions.canViewAllProjects(member) &&
      project.team !== member.team
    ) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const isFinalApproved =
      project.workflowStatus === "FINAL_APPROVED" ||
      project.status === "APPROVED" ||
      Boolean(project.finalVersionId);

    if (!isFinalApproved) {
      return NextResponse.json(
        {
          error:
            "Training School upload is only available after final approval."
        },
        { status: 409 }
      );
    }

    /*
     * New projects already have finalVersionId.
     *
     * Older test projects may have been approved before
     * finalVersionId was introduced. In that case, use the
     * latest APPROVED version as the legacy final version
     * and record it permanently.
     */
    let finalVersion = project.finalVersion;

    if (!finalVersion) {
      const legacyFinalVersion = project.versions[0];

      if (!legacyFinalVersion) {
        return NextResponse.json(
          {
            error:
              "No approved version was found for this project."
          },
          { status: 409 }
        );
      }

      await prisma.project.update({
        where: {
          id: project.id
        },
        data: {
          finalVersionId: legacyFinalVersion.id,
          workflowStatus: "FINAL_APPROVED",
          approvedAt: project.approvedAt ?? new Date()
        }
      });

      finalVersion = legacyFinalVersion;
    }

    const body = await req.json();

    const trainingSchoolUrl =
      typeof body.trainingSchoolUrl === "string"
        ? body.trainingSchoolUrl.trim()
        : "";

    if (!trainingSchoolUrl) {
      return NextResponse.json(
        {
          error: "Training School URL is required."
        },
        { status: 400 }
      );
    }

    try {
      const parsedUrl = new URL(trainingSchoolUrl);

      if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
      ) {
        return NextResponse.json(
          {
            error: "Please enter a valid Training School URL."
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          error: "Please enter a valid Training School URL."
        },
        { status: 400 }
      );
    }

    const completedAt = new Date();

    const upload = await prisma.trainingSchoolUpload.upsert({
      where: {
        projectId_versionId: {
          projectId: project.id,
          versionId: finalVersion.id
        }
      },
      create: {
        projectId: project.id,
        versionId: finalVersion.id,
        status: "UPLOAD_COMPLETED",
        trainingSchoolUrl,
        uploadedById: member.id,
        completedAt
      },
      update: {
        status: "UPLOAD_COMPLETED",
        trainingSchoolUrl,
        uploadedById: member.id,
        completedAt
      }
    });

    await logActivity({
      actor: member,
      action: "TRAINING_SCHOOL_UPLOAD_COMPLETED",
      projectId: project.id,
      versionId: finalVersion.id,
      detail: `V${finalVersion.versionNumber} uploaded to Training School`
    });

    return NextResponse.json({
      upload
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
      {
        error: "Something went wrong. Please try again."
      },
      { status: 500 }
    );
  }
}