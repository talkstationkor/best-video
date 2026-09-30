import Link from "next/link";
import AppShell, { requireMember } from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import { bvGet } from "@/lib/bvApi";
import { formatDate, ACTION_LABEL } from "@/lib/format";

export default async function ActivityPage() {
  const member = await requireMember();

  // The API applies visibility (reviewers see everything, others their team).
  const { logs } = await bvGet<{
    logs: {
      id: string;
      action: string;
      detail: string | null;
      createdAt: string;
      actor: { name: string };
      project: { id: string; projectName: string } | null;
      version: { versionNumber: number } | null;
    }[];
  }>("/activity", member.id);

  const groups = new Map<string, typeof logs>();
  for (const log of logs) {
    const key = formatDate(new Date(log.createdAt));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">Activity</h1>

      <div className="mt-6">
        {logs.length === 0 ? (
          <EmptyState title="No activity yet." />
        ) : (
          <div className="space-y-8">
            {[...groups.entries()].map(([day, dayLogs]) => (
              <div key={day}>
                <p className="label-eyebrow mb-3">{day}</p>
                <div className="card divide-y divide-line">
                  {dayLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="text-sm text-ink">
                          <span className="font-medium">{log.actor.name}</span>{" "}
                          {ACTION_LABEL[log.action] ?? log.action.toLowerCase()}
                          {log.version ? ` (V${log.version.versionNumber})` : ""}
                        </p>
                        {log.project ? (
                          <Link href={`/projects/${log.project.id}`} className="mt-0.5 block text-sm text-muted hover:underline">
                            {log.project.projectName}
                          </Link>
                        ) : (
                          log.detail && <p className="mt-0.5 text-sm text-muted">{log.detail}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-xs text-muted">
                        {new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
