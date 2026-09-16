import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Please choose who you are." }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { recipientId: member.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { project: { select: { projectName: true } } }
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH { id } marks one notification read; PATCH { all: true } marks all
// of the current member's notifications read.
export async function PATCH(req: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Please choose who you are." }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (body.all) {
    await prisma.notification.updateMany({
      where: { recipientId: member.id, isRead: false },
      data: { isRead: true }
    });
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    const notification = await prisma.notification.findUnique({ where: { id: body.id } });
    if (!notification || notification.recipientId !== member.id) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }
    const updated = await prisma.notification.update({ where: { id: body.id }, data: { isRead: true } });
    return NextResponse.json({ notification: updated });
  }

  return NextResponse.json({ error: "id or all is required." }, { status: 400 });
}
