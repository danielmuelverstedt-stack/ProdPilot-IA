"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, EmptyState, FilterBar, ModuleHeader, SearchInput, Select, StatusPill } from "@/components/ui/ModuleUi";
import { AppIcon } from "@/components/ui/AppIcon";
import { PhotoThumbnail } from "@/components/ui/PhotoThumbnail";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { ContactFormDialog } from "@/features/contacts/components/ContactFormDialog";
import { useContactPhotos } from "@/features/contacts/services/contact-photo-store";
import { contactFullName, createDefaultContactFilters, filterContacts, sortContactsByName, type ContactFilters } from "@/features/contacts/services/contact-directory";
import type { ContactType } from "@/features/demo/types/demo";

export function ContactsModule() {
  const data = useDemoData();
  const { settings } = useSettings();
  const photos = useContactPhotos();
  const [filters, setFilters] = useState<ContactFilters>(createDefaultContactFilters());
  const [creating, setCreating] = useState(false);
  const categories = [...settings.contacts.categories].sort((a, b) => a.order - b.order);

  const contacts = useMemo(() => sortContactsByName(filterContacts(data.contacts, filters)), [data.contacts, filters]);

  return <div className="mx-auto max-w-7xl">
    <ModuleHeader
      eyebrow="Annuaire d'entreprise"
      title="Contacts"
      description="Collaborateurs, fournisseurs, sous-traitants et tout autre contact professionnel, au même endroit."
      actions={<Button onClick={() => setCreating(true)}>+ Nouveau contact</Button>}
    />
    {creating ? <ContactFormDialog onClose={() => setCreating(false)} /> : null}

    <FilterBar className="mt-6 grid gap-2 sm:grid-cols-3">
      <SearchInput value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} onClear={() => setFilters({ ...filters, search: "" })} placeholder="Rechercher par nom, société…" />
      <Select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value as ContactType | "Tous" })}>
        <option value="Tous">Tous les types</option>
        <option value="Interne">Contact interne</option>
        <option value="Externe">Contact externe</option>
      </Select>
      <Select value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
        <option value="Toutes">Toutes les catégories</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
      </Select>
    </FilterBar>

    <p className="mt-4 text-xs text-slate-500">{contacts.length.toLocaleString("fr-BE")} contact{contacts.length > 1 ? "s" : ""}</p>

    {contacts.length ? <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{contacts.map((contact) => {
      const contactCategories = categories.filter((category) => contact.categoryIds.includes(category.id));
      return <Link key={contact.id} href={`/contacts/${contact.id}`} className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-white p-4 shadow-sm transition hover:border-[var(--app-primary)] hover:shadow-md">
        <PhotoThumbnail photoDataUrl={photos[contact.id]} alt={contactFullName(contact)} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--app-text)]">{contactFullName(contact)}</p>
          <p className="truncate text-sm text-slate-500">{[contact.role, contact.company].filter(Boolean).join(" · ") || (contact.type === "Interne" ? "Contact interne" : "Contact externe")}</p>
          <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-slate-500">
            {contact.email ? <span className="flex items-center gap-1 truncate"><AppIcon name="mail" className="size-3.5 shrink-0" />{contact.email}</span> : null}
            {contact.phone || contact.mobile ? <span className="flex items-center gap-1 truncate"><AppIcon name="phone" className="size-3.5 shrink-0" />{contact.phone || contact.mobile}</span> : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <StatusPill tone={contact.type === "Interne" ? "info" : "neutral"}>{contact.type}</StatusPill>
            {contactCategories.slice(0, 2).map((category) => <StatusPill key={category.id} tone="neutral">{category.label}</StatusPill>)}
            {contactCategories.length > 2 ? <StatusPill tone="neutral">+{contactCategories.length - 2}</StatusPill> : null}
          </div>
        </div>
      </Link>;
    })}</div> : <div className="mt-4"><EmptyState icon="contacts" title="Aucun contact" description="Aucun contact ne correspond aux filtres sélectionnés." action={<Button variant="secondary" onClick={() => setFilters(createDefaultContactFilters())}>Réinitialiser les filtres</Button>} /></div>}
  </div>;
}
