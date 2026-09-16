import AppShell, { requireMember } from "@/components/AppShell";
import MemberRow from "@/components/MemberRow";
import AddMemberForm from "@/components/AddMemberForm";
import { prisma } from "@/lib/db";
import { permissions } from "@/lib/permissions";

export default async function MembersSettingsPage() {
  const member = await requireMember();

  if (!permissions.canAccessSettings(member)) {
    return (
      <AppShell>
        <div className="card px-6 py-10 text-center">
          <p className="font-medium text-ink">You don't have permission to view this page.</p>
          <p className="mt-1 text-sm text-muted">Settings are only available to Admins.</p>
        </div>
      </AppShell>
    );
  }

  const members = await prisma.member.findMany({ orderBy: [{ team: "asc" }, { name: "asc" }] });

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">Settings</h1>
      <div className="mt-1 flex gap-4 text-sm text-muted">
        <span className="font-medium text-ink">Members</span>
        <span>Teams</span>
        <span>Roles</span>
        <span>System</span>
      </div>

      <div className="mt-6">
        <AddMemberForm />
      </div>

      <div className="mt-6 card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Team</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <MemberRow
                key={m.id}
                member={{ id: m.id, name: m.name, team: m.team, role: m.role, isActive: m.isActive }}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted">
        Leaving the team? Set status to Inactive rather than deleting — their past projects, versions, feedback
        and activity stay intact either way.
      </p>
    </AppShell>
  );
}
