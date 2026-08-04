import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { contactFullName, createDefaultContactFilters, filterContacts, sortContactsByName } from "../src/features/contacts/services/contact-directory.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function contact(overrides) {
  return { id: "CT-900", type: "Interne", firstName: "Jean", lastName: "Dupont", company: null, role: null, categoryIds: [], phone: null, mobile: null, email: null, address: null, website: null, notes: null, ...overrides };
}

const contacts = [
  contact({ id: "CT-1", type: "Interne", firstName: "Marc", lastName: "Lambert", categoryIds: ["cat-maintenance"] }),
  contact({ id: "CT-2", type: "Externe", firstName: "Anke", lastName: "Verhoeven", company: "Mazak Europe", categoryIds: ["cat-fournisseur", "cat-maintenance"] }),
  contact({ id: "CT-3", type: "Externe", firstName: "Bruno", lastName: "Fontaine", company: "Thermitech SA", categoryIds: ["cat-sous-traitance"] }),
];

test("createDefaultContactFilters retombe sur aucune recherche, toutes catégories, tous types", () => {
  assert.deepEqual(createDefaultContactFilters(), { search: "", categoryId: "Toutes", type: "Tous" });
});

test("contactFullName concatène prénom et nom", () => {
  assert.equal(contactFullName(contact({ firstName: "Marc", lastName: "Lambert" })), "Marc Lambert");
});

test("contactFullName gère une fiche de service sans prénom (ex. boîte partagée, salle de réunion) sans espace résiduel", () => {
  assert.equal(contactFullName(contact({ firstName: "", lastName: "Comptabilité TKMI" })), "Comptabilité TKMI");
});

test("filterContacts : la recherche par nom couvre aussi la société, insensible à la casse et aux accents de casse", () => {
  const filters = { ...createDefaultContactFilters(), search: "mazak" };
  assert.deepEqual(filterContacts(contacts, filters).map((item) => item.id), ["CT-2"]);
});

test("filterContacts : filtre par type", () => {
  const filters = { ...createDefaultContactFilters(), type: "Externe" };
  assert.deepEqual(filterContacts(contacts, filters).map((item) => item.id), ["CT-2", "CT-3"]);
});

test("filterContacts : filtre par catégorie, un contact peut appartenir à plusieurs catégories", () => {
  const filters = { ...createDefaultContactFilters(), categoryId: "cat-maintenance" };
  assert.deepEqual(filterContacts(contacts, filters).map((item) => item.id), ["CT-1", "CT-2"]);
});

test("filterContacts : recherche, type et catégorie se combinent (ET logique)", () => {
  const filters = { search: "verhoeven", categoryId: "cat-fournisseur", type: "Externe" };
  assert.deepEqual(filterContacts(contacts, filters).map((item) => item.id), ["CT-2"]);
  assert.deepEqual(filterContacts(contacts, { ...filters, type: "Interne" }), []);
});

test("sortContactsByName trie par prénom puis nom, ordre alphabétique français", () => {
  const sorted = sortContactsByName(contacts);
  assert.deepEqual(sorted.map((item) => item.id), ["CT-2", "CT-3", "CT-1"], "Anke Verhoeven, Bruno Fontaine, Marc Lambert");
});

// contact-service.ts importe demo-repository.ts, qui importe via l'alias @/... (résolu par
// Next.js/tsconfig, pas par node:test) — même limitation que action-service.ts : garde de texte
// source sur le comportement (voir tests/action-backlog.test.mjs).
test("createContact/updateContact/deleteContact suivent la même convention que action-service.ts (id généré, booléen trouvé/non trouvé)", async () => {
  const source = await read("src/features/contacts/services/contact-service.ts");
  assert.match(source, /export function createContact\(input: ContactInput\): string \{/);
  assert.match(source, /export function updateContact\(id: string, input: ContactInput\): boolean \{/);
  assert.match(source, /export function deleteContact\(id: string\): boolean \{/);
  assert.match(source, /const match = \/\^CT-\(\\d\+\)\$\/\.exec\(item\.id\);/, "identifiants CT-xxx, comme ACT-xxx pour les actions");
});

test("le formulaire contact sert à la fois la création et la modification, avec les mêmes champs", async () => {
  const dialog = await read("src/features/contacts/components/ContactFormDialog.tsx");
  assert.match(dialog, /contact = null,/, "contact optionnel : présent en modification, absent en création");
  assert.match(dialog, /isEditing \? "Modifier le contact" : "Nouveau contact"/);
  assert.match(dialog, /form\.type === "Externe" \? <label className="text-sm font-medium">Société/, "la société n'est proposée que pour un contact externe");
});

test("la fiche contact affiche téléphone/mobile/e-mail/site comme des liens cliquables (tel:/mailto:/lien externe)", async () => {
  const detail = await read("src/features/contacts/components/ContactDetail.tsx");
  assert.match(detail, /href={`tel:\$\{contact\.phone\}`}/);
  assert.match(detail, /href={`tel:\$\{contact\.mobile\}`}/);
  assert.match(detail, /href={`mailto:\$\{contact\.email\}`}/);
  assert.match(detail, /href={contact\.website} target="_blank" rel="noreferrer"/);
});

test("les photos de contact utilisent leur propre stockage IndexedDB, séparé de celui des machines", async () => {
  const adapter = await read("src/features/contacts/repositories/contact-photo-indexeddb-adapter.ts");
  assert.match(adapter, /const DATABASE_NAME = "prodpilot-contact-photos";/);
  const machineAdapter = await read("src/features/machines/repositories/machine-photo-indexeddb-adapter.ts");
  assert.match(machineAdapter, /const DATABASE_NAME = "prodpilot-machine-photos";/, "référence : bases distinctes, jamais partagées entre domaines");
});

test("le module Contacts a sa propre entrée de navigation et son propre onglet Réglages", async () => {
  const defaults = await read("src/features/settings/config/default-settings.ts");
  assert.match(defaults, /\{ id: "contacts", label: "Contacts", icon: "contacts", href: "\/contacts", visible: true, order: 10 \}/);
  const settingsCenter = await read("src/features/settings/components/SettingsCenter.tsx");
  assert.match(settingsCenter, /if \(category === "Contacts"\) return <ContactsSettingsPanel \/>;/);
});

test("les catégories de contacts sont configurables (Réglages → Contacts), mêmes 16 catégories que la demande initiale, réutilisant OrderedStandardSettings", async () => {
  const defaults = await read("src/features/settings/config/default-settings.ts");
  ["Direction", "Production", "Méthodes", "Qualité", "Maintenance", "Achats", "RH", "Informatique", "Fournisseur", "Sous-traitance usinage", "Sous-traitance traitement thermique", "Sous-traitance peinture", "Transport", "Commercial", "Client", "Autre"].forEach((label) => {
    assert.match(defaults, new RegExp(`standard\\("contact-category-[a-z-]+", "${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `catégorie manquante : ${label}`);
  });
  const settings = await read("src/features/settings/types/settings.ts");
  assert.match(settings, /export type ContactCategorySettings = OrderedStandardSettings;/);
});

test("les Réglages migrent contacts.categories avec le même mécanisme générique que les autres listes configurables (migrateStandards)", async () => {
  const repository = await read("src/features/settings/services/settings-repository.ts");
  assert.match(repository, /contacts: migrateContactsSettings\(saved\.contacts, defaults\.contacts\),/);
  assert.match(repository, /categories: migrateStandards\(saved\.categories, defaults\.categories\) \};/);
});

test("les données de démonstration migrent le tableau contacts comme savContacts/consumables/people (repli sur [] pour les installations existantes), avec un repli par champ pour le N° interne ajouté depuis", async () => {
  const migration = await read("src/features/demo/services/demo-data-migration.ts");
  assert.match(migration, /contacts: Array\.isArray\(value\.contacts\) \? value\.contacts\.map\(withContactDefaults\) : \[\],/);
  assert.match(migration, /internalNumber: contact\.internalNumber \?\? null/);
  const repository = await read("src/features/demo/services/demo-repository.ts");
  assert.match(repository, /item\.savContacts, item\.consumables, item\.people, item\.contacts\]/);
});

test("le sélecteur machine de l'Atelier et la revue de réunion réutilisent PhotoThumbnail (partagé), le registre Contacts aussi", async () => {
  const contactsModule = await read("src/features/contacts/components/ContactsModule.tsx");
  assert.match(contactsModule, /import \{ PhotoThumbnail \} from "@\/components\/ui\/PhotoThumbnail";/);
  const machineDetail = await read("src/features/machines/components/MachineDetail.tsx");
  assert.match(machineDetail, /import \{ PhotoUploader \} from "@\/components\/ui\/PhotoUploader";/, "la fiche machine réutilise aussi le nouvel emplacement partagé, plus sa copie locale d'origine");
});

test("le N° interne (poste du standard téléphonique) est un champ à part entière, câblé dans le service, le formulaire et la fiche", async () => {
  const type = await read("src/features/demo/types/demo.ts");
  assert.match(type, /internalNumber: string \| null;/);
  const service = await read("src/features/contacts/services/contact-service.ts");
  assert.match(service, /internalNumber\?: string \| null;/);
  assert.match(service, /internalNumber: input\.internalNumber\?\.trim\(\) \|\| null,/);
  const dialog = await read("src/features/contacts/components/ContactFormDialog.tsx");
  assert.match(dialog, /N° interne<input className={`\$\{fieldClass\} mt-1 w-full`} value={form\.internalNumber \?\? ""}/);
  const detail = await read("src/features/contacts/components/ContactDetail.tsx");
  assert.match(detail, /<Info label="N° interne" value={contact\.internalNumber \|\| "—"} \/>/);
});

test("l'annuaire interne TKMI fourni par l'utilisateur (photo du standard téléphonique) est saisi dans les données de démonstration, avec les entrées incertaines de la transcription explicitement signalées", async () => {
  const seed = await read("src/features/demo/mock/demo-data.ts");
  const contactEntries = seed.match(/\{ id: "CT-\d+",/g) ?? [];
  assert.equal(contactEntries.length, 29, "2 contacts externes d'exemple + 27 personnes/services de l'annuaire TKMI");
  ["Alain", "Hamacher", "daniel.mulverstedt@tkmi.be", "Yves", "Peizer", "Comptabilité TKMI", "Salle Aquarium", "Transport TKMI"].forEach((needle) => {
    assert.ok(seed.includes(needle), `entrée manquante dans l'annuaire TKMI : ${needle}`);
  });
  assert.match(seed, /notes: "Numéro fixe à vérifier \(longueur inhabituelle sur l'image source\)\."/, "les numéros à la longueur inhabituelle sur l'image source doivent rester signalés, pas silencieusement acceptés");
});
