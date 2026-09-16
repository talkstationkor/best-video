import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import { prisma } from "@/lib/db";
import Header from "./Header";

export async function requireMember() {
  const member = await getCurrentMember();

  if (!member) {
    redirect("/");
  }

  return member;
}

type AppShellProps = {
  children: React.ReactNode;
  wide?: boolean;
};

export default async function AppShell({
  children,
  wide = false
}: AppShellProps) {
  const member = await requireMember();

  const unreadCount = await prisma.notification.count({
    where: {
      recipientId: member.id,
      isRead: false
    }
  });

  return (
    <div className="min-h-screen">
      <Header
        member={{
          name: member.name,
          team: member.team,
          role: member.role
        }}
        unreadCount={unreadCount}
      />

      <main
        className={`mx-auto px-6 py-8 ${
          wide
            ? "max-w-[1600px] 2xl:max-w-[1800px]"
            : "max-w-6xl"
        }`}
      >
        {children}
      </main>
    </div>
  );
}