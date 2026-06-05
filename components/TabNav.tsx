"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Coffee, FileText, Landmark, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { useState } from "react";

const tabs = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/budgets", label: "예산관리", icon: Landmark },
  { href: "/proposals", label: "지출품의서", icon: ClipboardList },
  { href: "/expenditures", label: "지출결의서", icon: FileText },
  { href: "/study-cafe", label: "스터디카페", icon: Coffee },
];

export default function TabNav() {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  if (
    pathname === "/login" ||
    pathname.startsWith("/auth/") ||
    pathname === "/study-cafe/checkin" ||
    pathname === "/study-cafe/my" ||
    pathname.startsWith("/study-cafe/counselor")
  ) {
    return null;
  }

  async function handleSignOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <header
      style={{ background: "var(--green-900)" }}
      className="sticky top-0 z-50 border-b border-white/10 text-white shadow-md"
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-4">
        <div>
          <div className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight md:text-xl">
            협동조합 소이랩 2026년 청년 다다름 사업 관리 시스템
          </div>
          <div className="mt-1 text-[11px] leading-tight text-white/60">지출품의·지출결의·정산 대시보드</div>
        </div>

        <nav className="flex items-center gap-2 rounded-lg bg-white/10 p-1">
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname === tab.href ||
                  pathname.startsWith(`${tab.href}/`) ||
                  (tab.href === "/expenditures" &&
                    (pathname.startsWith("/preview") || pathname.startsWith("/batch-preview")));
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-h-11 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
                  active ? "bg-white text-[var(--green-900)] shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/settings" className="flex items-center gap-2 text-sm text-white/75 hover:text-white">
            <Settings className="h-4 w-4" />
            설정
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 text-sm text-white/75 hover:text-white disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
