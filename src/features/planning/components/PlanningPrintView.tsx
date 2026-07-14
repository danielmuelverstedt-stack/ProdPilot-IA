/* Les logos locaux enregistrés en data URL ne passent pas par l’optimiseur d’images. */
/* eslint-disable @next/next/no-img-element */
import { formatEuropeanDate } from "@/components/ui/ModuleUi";
import styles from "@/features/planning/components/Planning.module.css";
import { PlanningPrintActions } from "@/features/planning/components/PlanningPrintActions";
import { getPlanningPrintConfiguration, getPlanningPrintValue } from "@/features/planning/services/planning-print";
import type { PlanningBlock, PlanningMachine } from "@/features/planning/types/planning";
import type { AppSettings } from "@/features/settings/types/settings";

export function PlanningPrintView({ target, machines, blocks, settings, onBack }: {
  target: "all" | string;
  machines: PlanningMachine[];
  blocks: PlanningBlock[];
  settings: AppSettings;
  onBack: () => void;
}) {
  const selectedMachines = machines.filter((machine) => target === "all" || machine.id === target);
  const printConfiguration = getPlanningPrintConfiguration(settings.print);
  return <div className="mx-auto max-w-[1500px]">
    <style>{`@page { size: ${settings.print.paperSize} ${settings.print.orientation}; margin: 12mm; }`}</style>
    <PlanningPrintActions onBack={onBack} />
    {selectedMachines.length ? selectedMachines.map((machine) => <section key={machine.id} className={`${styles.printSheet} rounded-2xl border border-[var(--app-border)] bg-white p-6 print:rounded-none print:border-0`}>
      <header className="flex items-center gap-4 border-b border-[var(--app-border)] pb-4">
        {printConfiguration.showLogo && settings.company.logoDataUrl ? <img src={settings.company.logoDataUrl} alt={`Logo ${settings.company.name}`} className="h-12 w-16 object-contain" /> : null}
        <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Planning machine · {settings.print.paperSize}</p><h1 className="text-xl font-bold">{machine.id} — {machine.displayName}</h1><p className="text-xs text-slate-500">{machine.department}{printConfiguration.showDateTime ? ` · Édité le ${formatEuropeanDate(new Date().toISOString())}` : ""}{printConfiguration.showCompany ? ` · ${settings.company.name}` : ""}</p></div>
        <p className="ml-auto text-right text-xs text-slate-500">Document de travail<br />non contractuel</p>
      </header>
      {groupByWeek(blocks.filter((block) => block.machineId === machine.id)).map((group) => <section key={group.week} className="mt-5"><h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Semaine {group.week}</h2><div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left text-xs"><thead><tr>{printConfiguration.tableColumns.map((column) => <th key={column.id} className="border-b border-slate-300 p-2">{column.label}</th>)}</tr></thead><tbody>{group.blocks.map((block) => <tr key={block.id}>{printConfiguration.tableColumns.map((column) => <td key={column.id} className="border-b border-slate-200 p-2 align-top">{getPlanningPrintValue(column.id, block, machine)}</td>)}</tr>)}</tbody></table></div></section>)}
      {blocks.some((block) => block.machineId === machine.id) ? null : <p className="mt-6 text-sm text-slate-500">Aucune opération planifiée sur cette période.</p>}
      <footer className="mt-6 border-t border-slate-200 pt-3 text-xs text-slate-500">{settings.company.footerText}</footer>
    </section>) : <p className="rounded-xl bg-white p-6 text-sm text-slate-500">Aucune opération planifiée sur cette période.</p>}
  </div>;
}

function groupByWeek(blocks: PlanningBlock[]): { week: number; blocks: PlanningBlock[] }[] {
  const groups = new Map<number, PlanningBlock[]>();
  blocks.sort((a, b) => a.date.localeCompare(b.date)).forEach((block) => {
    const date = new Date(`${block.date}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
    groups.set(week, [...(groups.get(week) ?? []), block]);
  });
  return [...groups].map(([week, weekBlocks]) => ({ week, blocks: weekBlocks }));
}
