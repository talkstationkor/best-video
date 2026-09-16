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
