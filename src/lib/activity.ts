import { prisma } from "./db";
import type { Member } from "@prisma/client";

// Every business-significant action funnels through logActivity so the
// Activity page is a complete, append-only audit trail. Nothing in this
// app deletes rows from ActivityLog.
export async function logActivity(params: {
  actor: Member;
  action: string;
  projectId?: string;
  versionId?: string;
  detail?: string;
}) {
  return prisma.activityLog.create({
    data: {
      actorId: params.actor.id,
      team: params.actor.team,
      action: params.action,
      projectId: params.projectId,
      versionId: params.versionId,
      detail: params.detail
    }
  });
}

// Notifies every active Member of a given team (or every reviewer/admin
// when notifying "TMT" broadly). Kept simple and explicit rather than a
// generic pub/sub system per the "don't over-engineer" principle.
export async function notifyTeam(params: {
  team: string;
  type: string;
  message: string;
  projectId: string;
  versionId?: string;
  excludeMemberId?: string;
}) {
  const recipients = await prisma.member.findMany({
    where: { team: params.team, isActive: true, id: { not: params.excludeMemberId } }
  });

  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      recipientId: r.id,
      type: params.type,
      message: params.message,
      projectId: params.projectId,
      versionId: params.versionId
    }))
  });
}

const REVIEW_TEAMS = ["BEST_VIDEO_TEAM", "TMT"];

// Notifies the people involved in one project:
// - "reviewers": everyone on Best Video and TMT (both review at any time)
// - "editor":    the assigned editor only
// - "all":       both of the above
export async function notifyProjectParticipants(params: {
  project: { id: string; assignedEditorId: string | null };
  type: string;
  message: string;
  versionId?: string;
  excludeMemberId?: string;
  audience?: "reviewers" | "editor" | "all";
}) {
  const audience = params.audience ?? "all";

  const or: object[] = [];
  if (audience !== "editor") or.push({ team: { in: REVIEW_TEAMS } });
  if (audience !== "reviewers" && params.project.assignedEditorId) {
    or.push({ id: params.project.assignedEditorId });
  }
  if (or.length === 0) return;

  const recipients = await prisma.member.findMany({
    where: {
      isActive: true,
      id: { not: params.excludeMemberId },
      OR: or
    },
    select: { id: true }
  });

  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      recipientId: r.id,
      type: params.type,
      message: params.message,
      projectId: params.project.id,
      versionId: params.versionId
    }))
  });
}
