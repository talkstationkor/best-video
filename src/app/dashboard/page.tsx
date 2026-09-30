import AppShell, { requireMember } from "@/components/AppShell";
import { bvGet } from "@/lib/bvApi";
import DashboardContent from "./DashboardContent";

type MonthlyStat = {
  key: string;
  label: string;
  total: number;
  reviewRequired: number;
  revisionRequested: number;
  approved: number;
};

type DashboardProject = {
  id: string;
  projectName: string;
  currentVersion: number;
  status: string;
  updatedAt: string;
  assignedEditor: {
    name: string;
  } | null;
};

type DashboardData = {
  canSeeAll: boolean;
  isEditor: boolean;
  stats: { label: string; value: number; href: string }[];
  monthlyStats: MonthlyStat[];
  monthlyProjects: Record<string, DashboardProject[]>;
  actionProjects: any[];
  recentProjects: any[];
  recentActivity: any[];
};

// The tmt Best Video API computes everything on this page (status totals,
// the last 12 months by creation month, my tasks, recent projects and
// activity), scoped to what this member may see.
export default async function DashboardPage() {
  const member = await requireMember();
  const data = await bvGet<DashboardData>("/dashboard", member.id);

  return (
    <AppShell>
      <DashboardContent
        memberName={member.name}
        canSeeAll={data.canSeeAll}
        isEditor={data.isEditor}
        stats={data.stats}
        monthlyStats={data.monthlyStats}
        monthlyProjects={data.monthlyProjects}
        actionProjects={data.actionProjects}
        recentProjects={data.recentProjects}
        recentActivity={data.recentActivity}
      />
    </AppShell>
  );
}
