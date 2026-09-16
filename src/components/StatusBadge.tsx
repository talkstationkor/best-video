const STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  DRAFT: { bg: "#EEEEEA", fg: "#5B5D64", label: "Draft" },
  REVIEW_REQUIRED: { bg: "#F6EBD4", fg: "#8A6414", label: "Review Required" },
  REVISION_REQUESTED: { bg: "#F5E1DA", fg: "#93381F", label: "Revision Requested" },
  APPROVED: { bg: "#DFEFE5", fg: "#1F6644", label: "Approved" },
  OPEN: { bg: "#F5E1DA", fg: "#93381F", label: "Open" },
  RESOLVED: { bg: "#DFEFE5", fg: "#1F6644", label: "Resolved" }
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.DRAFT;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.fg }} />
      {style.label}
    </span>
  );
}
