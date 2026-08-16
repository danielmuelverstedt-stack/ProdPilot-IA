import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ActionQuickEditPanel est une fenêtre (PlanningDialogShell), pas une nouvelle page, pour rester dans la réunion", async () => {
  const source = await read("src/features/actions/components/ActionQuickEditPanel.tsx");
  assert.match(source, /import \{ PlanningDialogShell \} from "@\/features\/planning\/components\/PlanningDialogShell"/);
  assert.match(source, /<PlanningDialogShell/);
  assert.match(source, /maxWidthClassName="max-w-2xl"/);
});

test("chaque action rapide appelle exactement la même fonction du service Actions que la fiche complète, jamais une logique dupliquée", async () => {
  const source = await read("src/features/actions/components/ActionQuickEditPanel.tsx");
  assert.match(source, /import \{ addActionComment, addActionContextLink, completeAction, postponeAction, reassignAction, reassignActionToContact, removeActionContextLink, reopenAction, updateActionEcheance \} from "@\/features\/actions\/services\/action-service"/);
  assert.match(source, /onClick={\(\) => completeAction\(action\.id, author\)}/);
  assert.match(source, /onClick={\(\) => reopenAction\(action\.id, author\)}/);
});

test("le responsable propose un contact du module Contacts (avec sa photo) et un repli en texte libre, jamais de duplication des données Contacts", async () => {
  const source = await read("src/features/actions/components/ActionQuickEditPanel.tsx");
  assert.match(source, /import \{ PhotoThumbnail \} from "@\/components\/ui\/PhotoThumbnail"/);
  assert.match(source, /import \{ contactFullName, sortContactsByName \} from "@\/features\/contacts\/services\/contact-directory"/);
  assert.match(source, /reassignActionToContact\(action!\.id, contact\.id, contactFullName\(contact\), author\)/);
});

test("les liens réutilisent ActionLinkPickers (partagé avec ActionFormDialog) au lieu d'un sélecteur ad hoc", async () => {
  const source = await read("src/features/actions/components/ActionQuickEditPanel.tsx");
  assert.match(source, /import \{ ActionLinkPickers \} from "@\/features\/actions\/components\/ActionLinkPickers"/);
  assert.match(source, /<ActionLinkPickers onAdd={\(link\) => addActionContextLink\(action\.id, link, author\)} \/>/);
});

test("les commentaires/historique réutilisent ActionActivity (partagé avec la fiche action)", async () => {
  const source = await read("src/features/actions/components/ActionQuickEditPanel.tsx");
  assert.match(source, /import \{ ActionActivity \} from "@\/features\/actions\/components\/ActionActivity"/);
  assert.match(source, /<ActionActivity action={action} onAddComment={\(text\) => addActionComment\(action\.id, author, text\)} \/>/);
});
