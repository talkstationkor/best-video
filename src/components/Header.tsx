"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const TEAM_LABEL: Record<string, string> = {
  BEST_VIDEO_TEAM: "Best Video Team",
  TMT: "TMT"
};

export default function Header({
  member,
  unreadCount
}: {
  member: { name: string; team: string; role: string };
  unreadCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState("한국어");

  const isAdmin = member.role === "ADMIN";

  const navItems =
  language === "English"
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/projects", label: "Projects" },
        { href: "/notifications", label: "Notifications" },
        { href: "/activity", label: "Activity" }
      ]
    : [
        { href: "/dashboard", label: "대시보드" },
        { href: "/projects", label: "프로젝트" },
        { href: "/notifications", label: "알림" },
        { href: "/activity", label: "활동" }
      ];

  async function changeUser() {
    await fetch("/api/session", { method: "DELETE" });
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-tight text-brand"
          >
            BEST VIDEO
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  pathname?.startsWith(item.href)
                    ? "font-medium text-ink"
                    : "text-muted hover:text-ink"
                }
              >
                {item.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                href="/settings/members"
                className={
                  pathname?.startsWith("/settings")
                    ? "font-medium text-ink"
                    : "text-muted hover:text-ink"
                }
              >
                {language === "English" ? "Settings" : "설정"}
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-line bg-white px-2 py-1 text-sm text-ink"
            aria-label="Language"
          >
            <option value="한국어">한국어</option>
            <option value="English">English</option>
          </select>

          <Link
            href="/notifications"
            className="relative text-sm text-muted hover:text-ink"
          >
            🔔

            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-status-revision text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-ink"
            >
              <span className="font-medium">{member.name}</span>
              <span className="text-muted">
                · {TEAM_LABEL[member.team]}
              </span>
              <span className="text-muted">▾</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border border-line bg-white py-1 shadow-sm">
                <button
                  onClick={changeUser}
                  className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-paper"
                >
                  {language === "English" ? "Change User" : "사용자 변경"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-4 overflow-x-auto border-t border-line px-6 py-2 text-sm md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              pathname?.startsWith(item.href)
                ? "font-medium text-ink"
                : "text-muted"
            }
          >
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <Link href="/settings/members" className="text-muted">
            {language === "English" ? "Settings" : "설정"}
          </Link>
        )}
      </nav>
    </header>
  );
}