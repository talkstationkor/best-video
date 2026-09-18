"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type Member = {
  id: string;
  name: string;
  team: string;
  role: string;
  isActive: boolean;
};

export default function MemberRow({ member }: { member: Member }) {
  const router = useRouter();
  const { language } = useLanguage();
  const [busy, setBusy] = useState(false);

  async function update(patch: Partial<Member>) {
    setBusy(true);
    try {
      await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-5 py-3 font-medium text-ink">{member.name}</td>

      <td className="px-5 py-3">
        <select
          className="input w-auto"
          value={member.team}
          disabled={busy}
          onChange={(e) => update({ team: e.target.value as Member["team"] })}
        >
          <option value="BEST_VIDEO_TEAM">Best Video Team</option>
          <option value="TMT">TMT</option>
        </select>
      </td>

      <td className="px-5 py-3">
        <select
          className="input w-auto"
          value={member.role}
          disabled={busy}
          onChange={(e) => update({ role: e.target.value as Member["role"] })}
        >
          <option value="SUBMITTER">
            {language === "English" ? "Submitter" : "제출자"}
          </option>
          <option value="REVIEWER">
            {language === "English" ? "Reviewer" : "검토자"}
          </option>
          <option value="ADMIN">
            {language === "English" ? "Admin" : "관리자"}
          </option>
        </select>
      </td>

      <td className="px-5 py-3">
        <button
          className={member.isActive ? "btn-secondary" : "btn-primary"}
          disabled={busy}
          onClick={() => update({ isActive: !member.isActive })}
        >
          {member.isActive
            ? language === "English"
              ? "Active"
              : "활성"
            : language === "English"
              ? "Inactive"
              : "비활성"}
        </button>
      </td>
    </tr>
  );
}
