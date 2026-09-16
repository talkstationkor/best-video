import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions } from "@/lib/permissions";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Please choose who you are." }, { status: 401 });

  const logs = await prisma.activityLog.findMany({
    where: permissions.canViewAllProjects(member)
      ? {}
      : { OR: [{ actorId: member.id }, { project: { team: member.team } }] },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      actor: { select: { name: true, team: true } },
      project: { select: { projectName: true } },
      version: { select: { versionNumber: true } }
    }
  });

  return NextResponse.json({ logs });
}
