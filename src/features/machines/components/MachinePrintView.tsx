/* eslint-disable @next/next/no-img-element */
import { formatEuropeanDate, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import styles from "@/features/machines/components/Machines.module.css";
import type { Machine, MachineConsumable, MachineSavContact } from "@/features/demo/types/demo";
import type { CompanyIdentity, MachineSettings, PrintSettings } from "@/features/settings/types/settings";

function SpecGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-3">{children}</div>;
}

function Spec({ label, value }: { label: string; value: string }) {
  return <div className="bg-white p-2.5">
    <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
    <dd className={`mt-0.5 text-[13px] font-semibold ${value ? "text-slate-900" : "italic text-slate-400"}`}>{value || "À compléter"}</dd>
  </div>;
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return <h2 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--app-primary)] text-[10px] font-bold text-[var(--app-primary)]">{index}</span>
    {title}
  </h2>;
}

export function MachinePrintView({ machine, details, photoDataUrl, contacts, consumables, print, company, onBack }: {
  machine: MachineSettings;
  details: Machine | undefined;
  photoDataUrl: string | undefined;
  contacts: MachineSavContact[];
  consumables: MachineConsumable[];
  print: PrintSettings;
  company: CompanyIdentity;
  onBack: () => void;
}) {
  const status = details?.status ?? (machine.active ? "Active" : "Inactive");
  const now = new Date();
  return <div className="mx-auto max-w-[1000px]">
    <style>{`@page { size: ${print.paperSize} portrait; margin: 12mm; }`}</style>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
      <button type="button" className={secondaryButton} onClick={onBack}>‹ Retour à la fiche machine</button>
      <button type="button" className={primaryButton} onClick={() => window.print()}>Imprimer</button>
    </div>

    <section className={`${styles.printSheet} overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white print:rounded-none print:border-0`}>
      <div className="h-2 bg-[var(--app-primary)] print:h-1.5" />
      <div className="p-6 sm:p-8">

        <header className={`${styles.printSection} flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-800 pb-4`}>
          <div className="flex items-center gap-3">
            {company.logoDataUrl ? <img src={company.logoDataUrl} alt={company.name} className="h-10 w-14 object-contain" /> : null}
            <div>
              <p className="text-sm font-bold text-slate-900">{company.name || "ProdPilot IA"}</p>
              <p className="text-[10px] leading-snug text-slate-500">{[company.address, [company.phone, company.email].filter(Boolean).join(" · ")].filter(Boolean).join(" — ")}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-primary)]">Fiche technique machine</p>
            <p className="text-[10px] text-slate-500">Édité le {formatEuropeanDate(now.toISOString())} à {now.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </header>

        <section className={`${styles.printSection} mt-5 flex flex-wrap items-stretch gap-5`}>
          {photoDataUrl
            ? <img src={photoDataUrl} alt={machine.displayName} className="h-32 w-44 shrink-0 rounded-lg border border-slate-200 object-cover" />
            : <div className="flex h-32 w-44 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-center text-[10px] text-slate-400">Aucune photo</div>}
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{machine.displayName}</h1>
              <span className="inline-flex items-center rounded-full border border-slate-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">{status}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Code {machine.id} · {machine.department}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
              <div><dt className="inline text-slate-500">Marque / Modèle : </dt><dd className="inline font-semibold text-slate-800">{[details?.manufacturer, details?.model].filter(Boolean).join(" ") || "À compléter"}</dd></div>
              <div><dt className="inline text-slate-500">Année : </dt><dd className="inline font-semibold text-slate-800">{details?.year || "À compléter"}</dd></div>
              <div><dt className="inline text-slate-500">N° de série : </dt><dd className="inline font-semibold text-slate-800">{details?.serialNumber || "À compléter"}</dd></div>
            </dl>
          </div>
        </section>

        <section className={`${styles.printSection} mt-6`}>
          <SectionTitle index="01" title="Identification" />
          <SpecGrid>
            <Spec label="Code machine" value={machine.id} />
            <Spec label="N° de série" value={details?.serialNumber ?? ""} />
            <Spec label="Marque / Modèle" value={[details?.manufacturer, details?.model].filter(Boolean).join(" / ")} />
            <Spec label="Année" value={details?.year ? String(details.year) : ""} />
            <Spec label="Emplacement atelier" value={details?.workshopLocation ?? ""} />
            <Spec label="Mise en service" value={details?.commissioningDate ? formatEuropeanDate(details.commissioningDate) : ""} />
            <Spec label="Fin de garantie" value={details?.warrantyEndDate ? formatEuropeanDate(details.warrantyEndDate) : ""} />
          </SpecGrid>
        </section>

        <section className={`${styles.printSection} mt-5`}>
          <SectionTitle index="02" title="Caractéristiques techniques" />
          <SpecGrid>
            <Spec label="Type d'usinage" value={details?.machiningType ?? ""} />
            <Spec label="Commande numérique" value={details?.cncControl ?? ""} />
            <Spec label="Broche principale" value={[details?.spindleSpeedRpm ? `${details.spindleSpeedRpm} tr/min` : "", details?.spindlePowerKw ? `${details.spindlePowerKw} kW` : ""].filter(Boolean).join(" · ")} />
            <Spec label="Broche fraisage / Cône" value={details?.toolSpindleOrCone ?? ""} />
            <Spec label="Courses X/Y/Z (mm)" value={details?.travelXMm || details?.travelYMm || details?.travelZMm ? `${details?.travelXMm ?? "—"} / ${details?.travelYMm ?? "—"} / ${details?.travelZMm ?? "—"}` : ""} />
            <Spec label="Magasin outils" value={details?.toolMagazineCapacity ? `${details.toolMagazineCapacity} outils` : ""} />
            <Spec label="Passage de barre / Ø max" value={details?.barCapacityDiameterMm ? `Ø ${details.barCapacityDiameterMm} mm` : ""} />
            <Spec label="Arrosage centre broche" value={details?.throughSpindleCoolant === undefined ? "" : details.throughSpindleCoolant ? "Oui" : "Non"} />
            <Spec label="Robot" value={details?.robot ?? "Aucun"} />
          </SpecGrid>
        </section>

        <section className={`${styles.printSection} mt-5`}>
          <SectionTitle index="03" title="Raccordements" />
          <SpecGrid>
            <Spec label="Alimentation électrique" value={[details?.electricalVoltage ? `${details.electricalVoltage} V` : "", details?.electricalKva ? `${details.electricalKva} kVA` : "", details?.electricalCableSection ? `Câble ${details.electricalCableSection}` : ""].filter(Boolean).join(" · ")} />
            <Spec label="Air comprimé" value={[details?.compressedAirBar ? `${details.compressedAirBar} bar` : "", details?.compressedAirFlowNlMin ? `${details.compressedAirFlowNlMin} Nl/min` : ""].filter(Boolean).join(" · ")} />
          </SpecGrid>
        </section>

        <section className={`${styles.printSection} mt-5`}>
          <SectionTitle index="04" title="Contacts SAV" />
          {contacts.length ? <table className="w-full border-collapse overflow-hidden rounded-lg border border-slate-200 text-left text-xs">
            <thead><tr className="bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              <th className="border-b border-slate-200 p-2">Société</th>
              <th className="border-b border-slate-200 p-2">Contact</th>
              <th className="border-b border-slate-200 p-2">Téléphone</th>
              <th className="border-b border-slate-200 p-2">E-mail</th>
              <th className="border-b border-slate-200 p-2">Contrat</th>
              <th className="border-b border-slate-200 p-2">Échéance</th>
            </tr></thead>
            <tbody>{contacts.map((contact, index) => <tr key={contact.id} className={index % 2 ? "bg-slate-50/60" : undefined}>
              <td className="border-b border-slate-100 p-2 font-semibold text-slate-800">{contact.company}</td>
              <td className="border-b border-slate-100 p-2">{contact.contactName || "—"}</td>
              <td className="border-b border-slate-100 p-2">{contact.phone || "—"}</td>
              <td className="border-b border-slate-100 p-2">{contact.email || "—"}</td>
              <td className="border-b border-slate-100 p-2">{contact.contractReference || "—"}</td>
              <td className="border-b border-slate-100 p-2">{contact.contractExpiry ? formatEuropeanDate(contact.contractExpiry) : "—"}</td>
            </tr>)}</tbody>
          </table> : <p className="text-sm text-slate-500">Aucun contact SAV enregistré.</p>}
        </section>

        <section className={`${styles.printSection} mt-5`}>
          <SectionTitle index="05" title="Consommables" />
          {consumables.length ? <table className="w-full border-collapse overflow-hidden rounded-lg border border-slate-200 text-left text-xs">
            <thead><tr className="bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              <th className="border-b border-slate-200 p-2">Catégorie</th>
              <th className="border-b border-slate-200 p-2">Désignation</th>
              <th className="border-b border-slate-200 p-2">Référence</th>
              <th className="border-b border-slate-200 p-2">Fournisseur</th>
              <th className="border-b border-slate-200 p-2">Fréquence</th>
              <th className="border-b border-slate-200 p-2">Stockage</th>
            </tr></thead>
            <tbody>{consumables.map((consumable, index) => <tr key={consumable.id} className={index % 2 ? "bg-slate-50/60" : undefined}>
              <td className="border-b border-slate-100 p-2"><span className="inline-flex items-center rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold">{consumable.category}</span></td>
              <td className="border-b border-slate-100 p-2 font-semibold text-slate-800">{consumable.designation}</td>
              <td className="border-b border-slate-100 p-2">{consumable.manufacturerReference || "—"}</td>
              <td className="border-b border-slate-100 p-2">{consumable.supplier || "—"}</td>
              <td className="border-b border-slate-100 p-2">{consumable.replacementFrequency || "—"}</td>
              <td className="border-b border-slate-100 p-2">{consumable.storageLocation || "—"}</td>
            </tr>)}</tbody>
          </table> : <p className="text-sm text-slate-500">Aucun consommable enregistré.</p>}
        </section>

        <footer className={`${styles.printSection} mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-[10px] text-slate-500`}>
          <span>{company.footerText || "Document interne — non contractuel."}</span>
          <span>{[company.website, company.email].filter(Boolean).join(" · ")}</span>
        </footer>
      </div>
    </section>
  </div>;
}
