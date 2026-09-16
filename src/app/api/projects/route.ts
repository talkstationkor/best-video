import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions, ForbiddenError } from "@/lib/permissions";
import { requireNonEmpty, sanitizeText, validateGoogleDriveUrl, ValidationError } from "@/lib/validation";
import { logActivity, notifyTeam } from "@/lib/activity";

// GET /api/projects?status=&team=&month=&q=
// Submitters see only their own team's projects; Reviewers/Admins see all
// projects across both teams. This scoping happens here, server-side —
// the same rule the UI uses to decide what to render, but enforced again
// independently so a crafted request can't widen the result set.
export async function GET(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Please choose who you are." }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const team = searchParams.get("team");
  const month = searchParams.get("month"); // "YYYY-MM"
  const q = searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (!permissions.canViewAllProjects(member)) {
    where.team = member.team;
  } else if (team) {
    where.team = team;
  }
  if (status) where.status = status;
  if (q) where.projectName = { contains: q };
  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    where.createdAt = { gte: start, lt: end };
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      versions: { orderBy: { versionNumber: "desc" }, take: 1, include: { submittedBy: { select: { name: true } } } }
    }
  });

  return NextResponse.json({ projects });
}

// POST /api/projects — creates a Project AND its V1 in one transaction so
// there is never a Project without at least one Version.
export async function POST(req: NextRequest) {
  try {
    const member = await getCurrentMember();
    if (!member) return NextResponse.json({ error: "Please choose who you are." }, { status: 401 });
    if (!permissions.canCreateProject(member)) throw new ForbiddenError();

    const body = await req.json();
    const projectName = requireNonEmpty(body.projectName, "Project name");
    const details = sanitizeText(body.details, 2000);
    const videoUrl = validateGoogleDriveUrl(body.videoUrl);

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          projectName,
          details,
          team: member.team,
          status: "REVIEW_REQUIRED",
          currentVersion: 1,
          createdById: member.id
        }
      });
      const version = await tx.projectVersion.create({
        data: {
          projectId: project.id,
          versionNumber: 1,
          videoUrl,
          submittedById: member.id,
          status: "REVIEW_REQUIRED"
        }
      });
      return { project, version };
    });

    await logActivity({
      actor: member,
      action: "PROJECT_CREATED",
      projectId: result.project.id,
      versionId: result.version.id,
      detail: `${projectName} · V1 submitted`
    });

    await notifyTeam({
      team: "TMT",
      type: "PROJECT_CREATED",
      message: `${member.name} created "${projectName}" (V1) — review required`,
      projectId: result.project.id,
      versionId: result.version.id
    });

    return NextResponse.json({ project: result.project }, { status: 201 });
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
    if (err instanceof ValidationError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
