"use client";

import Link from "next/link";
import { useState } from "react";
import { NavigationDesigner, WorkspaceDesigner } from "@/features/settings/components/InterfaceDesigners";
import { CompanyIdentitySettings, TemplateSettings, ThemeSettingsPanel } from "@/features/settings/components/IdentityThemeSettings";
import { ProductionSettingsPanel } from "@/features/settings/components/ProductionSettings";
import { PrintSettingsPanel, UsersPermissionsSettings } from "@/features/settings/components/AccessPrintSettings";
import { BackupSettings, JournalSettings } from "@/features/settings/components/BackupJournalSettings";
import { EmptySettings, SettingsPanel, buttonClass } from "@/features/settings/components/SettingsUi";

const categories = ["Général", "Personnalisation", "ERP", "Production", "Réunions", "IA", "Notifications", "Utilisateurs", "Sauvegardes", "Journal"] as const;
const personalization = ["Interface", "Mon Espace", "Menu principal", "Identité société", "Couleurs", "Templates mails", "Templates QRQC", "Templates Réunion", "Comptes rendus", "Impression", "IA"] as const;
type Category = typeof categories[number];

export function SettingsCenter() {
  const [category, setCategory] = useState<Category>("Général");
  const [personalizationTab, setPersonalizationTab] = useState<(typeof personalization)[number]>("Interface");
  return <div className="mx-auto max-w-[1500px]"><header className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-[var(--app-primary)]">Administration locale</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Centre de réglages</h1><p className="mt-2 max-w-3xl text-slate-600">Personnalisez l’interface, préparez les référentiels et gérez les connexions disponibles sans modifier l’ERP.</p></header><div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]"><nav aria-label="Catégories de réglages" className="h-fit rounded-2xl border border-[var(--app-border)] bg-white p-2 shadow-sm"><ul>{categories.map((item) => <li key={item}><button className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${category === item ? "bg-[var(--app-primary)] text-white" : "hover:bg-slate-50"}`} onClick={() => setCategory(item)}>{item}</button></li>)}</ul></nav><div className="min-w-0">{category === "Personnalisation" && <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{personalization.map((item) => <button key={item} onClick={() => setPersonalizationTab(item)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${personalizationTab === item ? "border-[var(--app-primary)] bg-blue-50 text-[var(--app-primary)]" : "border-[var(--app-border)] bg-white"}`}>{item}</button>)}</div>}<SettingsContent category={category} personalizationTab={personalizationTab} /></div></div></div>;
}

function SettingsContent({ category, personalizationTab }: { category: Category; personalizationTab: (typeof personalization)[number] }) {
  if (category === "Général") return <SettingsPanel title="Général" description="Accès rapides aux connexions et aux principaux réglages."><div className="flex flex-wrap gap-2"><Link className={buttonClass} href="/reglages/connexions/messagerie">Connexions messagerie</Link><span className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Réglages locaux · messagerie connectable séparément</span></div></SettingsPanel>;
  if (category === "Production") return <ProductionSettingsPanel />;
  if (category === "Utilisateurs") return <UsersPermissionsSettings />;
  if (category === "Sauvegardes") return <BackupSettings />;
  if (category === "Journal") return <JournalSettings />;
  if (category === "Réunions") return <TemplateSettings templateKey="meeting" title="Template Réunion" />;
  if (category === "IA") return <TemplateSettings templateKey="ai" title="Consignes IA" />;
  if (category !== "Personnalisation") return <EmptySettings title={category} />;
  if (personalizationTab === "Interface" || personalizationTab === "Menu principal") return <NavigationDesigner />;
  if (personalizationTab === "Mon Espace") return <WorkspaceDesigner />;
  if (personalizationTab === "Identité société") return <CompanyIdentitySettings />;
  if (personalizationTab === "Couleurs") return <ThemeSettingsPanel />;
  if (personalizationTab === "Templates mails") return <TemplateSettings templateKey="mail" title="Template mails" />;
  if (personalizationTab === "Templates QRQC") return <TemplateSettings templateKey="qrqc" title="Template QRQC" />;
  if (personalizationTab === "Templates Réunion") return <TemplateSettings templateKey="meeting" title="Template Réunion" />;
  if (personalizationTab === "Comptes rendus") return <TemplateSettings templateKey="report" title="Comptes rendus" />;
  if (personalizationTab === "Impression") return <PrintSettingsPanel />;
  return <TemplateSettings templateKey="ai" title="Consignes IA" />;
}
