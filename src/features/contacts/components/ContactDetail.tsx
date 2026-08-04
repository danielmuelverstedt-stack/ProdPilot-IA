"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState, ModuleHeader, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { PhotoUploader } from "@/components/ui/PhotoUploader";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { ContactFormDialog } from "@/features/contacts/components/ContactFormDialog";
import { deleteContact } from "@/features/contacts/services/contact-service";
import { setContactPhoto, useContactPhotos } from "@/features/contacts/services/contact-photo-store";
import { contactFullName } from "@/features/contacts/services/contact-directory";

export function ContactDetail({ id }: { id: string }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const photos = useContactPhotos();
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const found = data.contacts.find((item) => item.id === id);
  if (!found) return <EmptyState title="Contact introuvable" description="Ce contact n’existe plus dans l’annuaire." />;
  const contact = found;

  const categories = settings.contacts.categories.filter((category) => contact.categoryIds.includes(category.id));

  async function changePhoto(dataUrl: string) {
    await setContactPhoto(id, dataUrl);
  }

  function remove() {
    if (!window.confirm(`Supprimer le contact « ${contactFullName(contact)} » ? Cette opération est définitive dans la démonstration.`)) return;
    deleteContact(contact.id);
    router.push("/contacts");
  }

  return <div className="mx-auto max-w-5xl">
    <ModuleHeader
      eyebrow={contact.type === "Interne" ? "Contact interne" : "Contact externe"}
      title={contactFullName(contact)}
      description={[contact.role, contact.company].filter(Boolean).join(" · ") || "Fiche contact"}
      actions={<><Link href="/contacts" className={secondaryButton}>Retour</Link><button className={primaryButton} onClick={() => setEditing(true)}>Modifier</button></>}
    />
    {editing ? <ContactFormDialog contact={contact} onClose={() => setEditing(false)} /> : null}

    <div className="mt-6 grid gap-5 lg:grid-cols-3">
      <section className="rounded-2xl border border-[var(--app-border)] bg-white p-5 lg:col-span-2">
        <h2 className="font-semibold">Photo</h2>
        <div className="mt-3"><PhotoUploader photoDataUrl={photos[id] ?? ""} alt={contactFullName(contact)} onChange={changePhoto} /></div>

        <h2 className="mt-6 font-semibold">Coordonnées</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <Info label="Téléphone" value={contact.phone ? <a className="text-[var(--app-primary)] underline" href={`tel:${contact.phone}`}>{contact.phone}</a> : "—"} />
          <Info label="Mobile" value={contact.mobile ? <a className="text-[var(--app-primary)] underline" href={`tel:${contact.mobile}`}>{contact.mobile}</a> : "—"} />
          <Info label="E-mail" value={contact.email ? <a className="text-[var(--app-primary)] underline" href={`mailto:${contact.email}`}>{contact.email}</a> : "—"} />
          <Info label="Site internet" value={contact.website ? <a className="text-[var(--app-primary)] underline" href={contact.website} target="_blank" rel="noreferrer">{contact.website}</a> : "—"} />
          <Info label="Adresse" value={contact.address || "—"} />
        </dl>
        {contact.notes ? <><h3 className="mt-6 text-sm font-semibold">Notes</h3><p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{contact.notes}</p></> : null}
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-white p-5">
        <h2 className="font-semibold">Fiche</h2>
        <dl className="mt-4 grid gap-4 text-sm">
          <Info label="Type" value={<StatusPill tone={contact.type === "Interne" ? "info" : "neutral"}>{contact.type}</StatusPill>} />
          {contact.company ? <Info label="Société" value={contact.company} /> : null}
          {contact.role ? <Info label="Fonction" value={contact.role} /> : null}
          <Info label="Catégories" value={categories.length ? <div className="flex flex-wrap gap-1">{categories.map((category) => <StatusPill key={category.id} tone="neutral">{category.label}</StatusPill>)}</div> : "—"} />
        </dl>
        <button className={`${secondaryButton} mt-6 w-full text-red-700`} onClick={remove}>Supprimer</button>
      </section>
    </div>
  </div>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1">{value}</dd></div>; }
