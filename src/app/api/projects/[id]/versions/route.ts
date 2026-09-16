import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions, ForbiddenError } from "@/lib/permissions";
import {
  sanitizeText,
  validateGoogleDriveUrl,
  ValidationError
} from "@/lib/validation";
import { logActivity, notifyTeam } from "@/lib/activity";

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

    if (!permissions.canSubmitVersion(member)) {
      throw new ForbiddenError();
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    if (!permissions.canViewAllProjects(member) && project.team !== member.team) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    if (project.workflowStatus === "FINAL_APPROVED" || project.finalVersionId) {
      return NextResponse.json(
        {
          error:
            "This project has been finalized. No new versions can be created."
        },
        { status: 409 }
      );
    }

    const body = await req.json();
    const videoUrl = validateGoogleDriveUrl(body.videoUrl);
    const notes = sanitizeText(body.notes, 2000);

    const MAX_ATTEMPTS = 5;
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const current = await tx.project.findUniqueOrThrow({
            where: { id: params.id }
          });

          if (current.workflowStatus === "FINAL_APPROVED" || current.finalVersionId) {
            throw new Error("PROJECT_ALREADY_FINALIZED");
          }

          const nextVersionNumber = current.currentVersion + 1;

          const version = await tx.projectVersion.create({
            data: {
              projectId: project.id,
              versionNumber: nextVersionNumber,
              videoUrl,
              notes,
              submittedById: member.id,
              status: "REVIEW_REQUIRED"
            }
          });

          const updatedProject = await tx.project.update({
            where: { id: project.id },
            data: {
              currentVersion: nextVersionNumber,
              status: "REVIEW_REQUIRED",
              workflowStatus: "BEST_VIDEO_REVIEW"
            }
          });

          return { version, updatedProject };
        });

        await logActivity({
          actor: member,
          action: "VERSION_SUBMITTED",
          projectId: project.id,
          versionId: result.version.id,
          detail: `V${result.version.versionNumber} submitted`
        });

        await notifyTeam({
          team: "TMT",
          type: "VERSION_SUBMITTED",
          message: `${member.name} submitted V${result.version.versionNumber} for "${project.projectName}"`,
          projectId: project.id,
          versionId: result.version.id
        });

        return NextResponse.json(
          {
            version: result.version,
            project: result.updatedProject
          },
          { status: 201 }
        );
      } catch (err) {
        if (err instanceof Error && err.message === "PROJECT_ALREADY_FINALIZED") {
          return NextResponse.json(
            {
              error:
                "This project has been finalized. No new versions can be created."
            },
            { status: 409 }
          );
        }

        lastError = err;

        const isUniqueViolation =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002";

        if (!isUniqueViolation) {
          throw err;
        }
      }
    }

    throw lastError;
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json(
        { error: err.message },
        { status: 403 }
      );
    }

    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }

    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}