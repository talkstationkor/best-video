import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions, ForbiddenError } from "@/lib/permissions";
import { ValidationError } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const member = await getCurrentMember();

  if (!member) {
    return NextResponse.json(
      { error: "Please choose who you are." },
      { status: 401 }
    );
  }

  const project = await prisma.project.findUnique({
    where: {
      id: params.id
    },
    include: {
      createdBy: {
        select: {
          name: true
        }
      },
      assignedEditor: {
        select: {
          id: true,
          name: true,
          team: true,
          role: true,
          isActive: true
        }
      },
      versions: {
        orderBy: {
          versionNumber: "desc"
        },
        include: {
          submittedBy: {
            select: {
              name: true
            }
          },
          approvedBy: {
            select: {
              name: true
            }
          },
          feedback: {
            orderBy: {
              createdAt: "asc"
            },
            include: {
              author: {
                select: {
                  name: true
                }
              },
              resolvedBy: {
                select: {
                  name: true
                }
              }
            }
          }
        }
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

  return NextResponse.json({
    project,
    viewerRole: member.role
  });
}

// PATCH /api/projects/[id]
//
// Currently supports:
// {
//   assignedEditorId: string | null
// }
//
// Only reviewers/admins/Best Video members with review permission
// can assign or change an Editor.
export async function PATCH(
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
      throw new ForbiddenError(
        "You don't have permission to assign an Editor."
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: params.id
      },
      include: {
        assignedEditor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const body = await req.json();

    const assignedEditorId =
      body.assignedEditorId === null ||
      body.assignedEditorId === ""
        ? null
        : typeof body.assignedEditorId === "string"
          ? body.assignedEditorId.trim()
          : undefined;

    if (assignedEditorId === undefined) {
      throw new ValidationError(
        "A valid Editor selection is required."
      );
    }

    let assignedEditor = null;

    if (assignedEditorId) {
      assignedEditor = await prisma.member.findUnique({
        where: {
          id: assignedEditorId
        },
        select: {
          id: true,
          name: true,
          team: true,
          role: true,
          isActive: true
        }
      });

      if (!assignedEditor) {
        throw new ValidationError(
          "The selected Editor does not exist."
        );
      }

      if (!assignedEditor.isActive) {
        throw new ValidationError(
          "The selected Editor is inactive."
        );
      }

      if (assignedEditor.team !== "EDITOR_TEAM") {
        throw new ValidationError(
          "The selected member is not part of the Editor Team."
        );
      }

      if (assignedEditor.role !== "EDITOR") {
        throw new ValidationError(
          "The selected member does not have the Editor role."
        );
      }
    }

    const updated = await prisma.project.update({
      where: {
        id: project.id
      },
      data: {
        assignedEditorId
      },
      include: {
        assignedEditor: {
          select: {
            id: true,
            name: true,
            team: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    const previousEditorName =
      project.assignedEditor?.name ?? "Unassigned";

    const newEditorName =
      assignedEditor?.name ?? "Unassigned";

    await logActivity({
      actor: member,
      action: "EDITOR_ASSIGNED",
      projectId: project.id,
      detail: `${previousEditorName} → ${newEditorName}`
    });

    return NextResponse.json({
      project: updated
    });
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
      {
        error: "Something went wrong. Please try again."
      },
      {
        status: 500
      }
    );
  }
}