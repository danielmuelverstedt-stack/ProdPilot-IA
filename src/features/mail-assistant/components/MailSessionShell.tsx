"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";

export function MailSessionShell({ accountLabel, progress, children }: { accountLabel?: string; progress?: string; children: ReactNode }) {
  const { settings } = useSettings();
  return <div className="min-h-screen bg-[#f7f8f6] text-[#17211d]">
    <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[#f7f8f6]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg font-semibold"><span className="grid size-8 place-items-center rounded-xl bg-[#1f5f49] text-sm font-bold text-white">P</span><span className="hidden sm:inline">{settings.company.name}</span></Link>
        {progress ? <span className="mx-auto text-xs font-medium text-slate-500" role="status">{progress}</span> : <span className="flex-1" />}
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">{accountLabel ? <span className="hidden max-w-52 truncate sm:block">{accountLabel}</span> : null}<Link href="/mails" className="rounded-lg px-2 py-2 font-semibold text-slate-700 hover:bg-black/[0.04]">Quitter</Link></div>
      </div>
    </header>
    <main>{children}</main>
  </div>;
}
