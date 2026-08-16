/* Les logos locaux en data URL ne passent pas par l’optimiseur d’images. */
/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { useDemoData } from "@/features/demo/services/demo-repository";

export type ActiveSection = string;

interface AppShellProps { activeSection: ActiveSection; headerTitle: string; children: ReactNode }

export function AppShell({ activeSection, headerTitle, children }: AppShellProps) {
  const { settings, updateSettings } = useSettings();
  const demo = useDemoData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const role = settings.roles.find((item) => item.id === settings.activeRoleId) ?? settings.roles[0];
  const user = settings.users.find((item) => item.roleId === role?.id && item.active) ?? settings.users[0];
  const items = [...settings.navigation]
    .filter((item) => item.visible && (role?.permissions[item.id]?.visible ?? true))
    .sort((a, b) => a.order - b.order);
  const canView = activeSection === "workspace" || (role?.permissions[activeSection]?.view ?? true);

  const navigation = (
    <nav aria-label="Navigation principale">
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = activeSection === item.id;
          return <li key={item.id}><Link href={item.href} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined} title={collapsed ? item.label : undefined} className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium ${active ? "bg-[color-mix(in_srgb,var(--app-primary)_28%,transparent)] text-white shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--app-primary)_45%,transparent)]" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}><AppIcon name={item.icon} className={`size-5 shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`} />{!collapsed && <span>{item.label}</span>}</Link></li>;
        })}
      </ul>
    </nav>
  );

  return (
    <div className={`min-h-screen bg-[var(--app-background)] lg:grid ${collapsed ? "lg:grid-cols-[76px_minmax(0,1fr)]" : "lg:grid-cols-[252px_minmax(0,1fr)]"}`}>
      <aside className="hidden bg-[linear-gradient(180deg,var(--app-secondary),color-mix(in_srgb,var(--app-secondary)_82%,#1e293b))] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-white/10">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-4">
          <CompanyMark compact={collapsed} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">{navigation}</div>
        <div className="border-t border-white/10 p-3">
          {!collapsed && <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Rôle de démonstration</label>}
          {!collapsed && <select value={settings.activeRoleId} onChange={(event) => updateSettings((draft) => { draft.activeRoleId = event.target.value; }, "Rôle de démonstration modifié")} className="mb-3 w-full rounded-lg border border-white/15 bg-white/8 p-2 text-xs text-white">{settings.roles.map((item) => <option className="text-slate-900" value={item.id} key={item.id}>{item.name}</option>)}</select>}
          <button type="button" onClick={() => setCollapsed((value) => !value)} className="flex min-h-10 w-full items-center justify-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white" aria-label={collapsed ? "Déployer le menu" : "Réduire le menu"}><AppIcon name="chevron" className={`size-5 transition-transform ${collapsed ? "-rotate-90" : "rotate-90"}`} /></button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[linear-gradient(180deg,var(--app-secondary),color-mix(in_srgb,var(--app-secondary)_82%,#1e293b))] p-4 text-white shadow-[var(--app-shadow-lg)] transition-transform lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex h-12 items-center justify-between"><CompanyMark /><button onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" className="grid size-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"><AppIcon name="close" className="size-5" /></button></div>{navigation}<label className="mt-6 block text-xs font-semibold text-slate-300">Rôle de démonstration<select value={settings.activeRoleId} onChange={(event) => updateSettings((draft) => { draft.activeRoleId = event.target.value; }, "Rôle de démonstration modifié")} className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 p-2 text-sm text-white">{settings.roles.map((item) => <option className="text-slate-900" value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-[var(--app-border)] bg-white/85 px-4 shadow-[var(--app-shadow-sm)] backdrop-blur-md sm:px-6 lg:px-8">
          <button type="button" onClick={() => setMobileOpen(true)} className="grid size-10 place-items-center rounded-lg border border-[var(--app-border)] hover:bg-slate-50 lg:hidden" aria-label="Ouvrir le menu"><AppIcon name="menu" className="size-5" /></button>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--app-text)]">{headerTitle}</p><p className="hidden text-xs text-slate-500 sm:block">Pilotage de production</p></div>
          <label className="relative ml-auto hidden max-w-xs flex-1 md:block"><span className="sr-only">Rechercher</span><AppIcon name="search" className="absolute left-3 top-2.5 size-4 text-slate-400" /><input placeholder="Rechercher…" className="h-9 w-full rounded-lg border border-[var(--app-border)] bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-[var(--app-primary)] focus:bg-white focus:ring-4 focus:ring-[color-mix(in_srgb,var(--app-primary)_12%,transparent)]" /></label>
          <div className="relative"><button type="button" onClick={() => setNotificationsOpen((value) => !value)} className="relative grid size-10 place-items-center rounded-lg border border-[var(--app-border)] hover:bg-slate-50" aria-label="Notifications"><AppIcon name="bell" className="size-5" />{demo.notifications.some((item) => !item.read) && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[var(--app-danger)] ring-2 ring-white" />}</button>{notificationsOpen && <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--app-border)] bg-white p-4 text-sm shadow-[var(--app-shadow-lg)]"><p className="font-semibold">Notifications</p><ul className="mt-2 space-y-1">{demo.notifications.map((item) => <li key={item.id}><Link href={item.href} onClick={() => setNotificationsOpen(false)} className="block rounded-lg p-2 hover:bg-slate-50"><strong className="block text-xs">{item.title}</strong><span className="text-xs text-slate-500">{item.description}</span></Link></li>)}</ul></div>}</div>
          <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-[color-mix(in_srgb,var(--app-primary)_14%,white)] text-xs font-bold text-[var(--app-primary)] ring-1 ring-[color-mix(in_srgb,var(--app-primary)_20%,transparent)]">{user ? `${user.firstName[0]}${user.lastName[0]}` : "PP"}</span><span className="hidden text-sm xl:block"><strong className="block font-semibold">{user ? `${user.firstName} ${user.lastName}` : "Utilisateur"}</strong><span className="text-xs text-slate-500">{role?.name}</span></span></div>
        </header>
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{canView ? children : <section className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center"><h1 className="text-xl font-semibold">Accès non autorisé</h1><p className="mt-2 text-sm text-amber-900">Le rôle de démonstration « {role?.name} » ne peut pas consulter ce module. Changez de rôle dans le menu.</p></section>}</main>
      </div>
    </div>
  );
}

function CompanyMark({ compact = false }: { compact?: boolean }) {
  const { settings } = useSettings();
  return <Link href="/" className="flex min-w-0 items-center gap-3">{settings.company.logoDataUrl ? <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white p-1"><img src={settings.company.logoDataUrl} alt={`Logo ${settings.company.name}`} className="h-full w-full object-contain" /></span> : <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--app-primary)] text-lg font-bold">P</span>}{!compact && <span className="min-w-0"><strong className="block truncate text-sm">{settings.company.name}</strong><span className="block text-[11px] text-slate-400">Production augmentée</span></span>}</Link>;
}
