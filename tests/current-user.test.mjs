import assert from "node:assert/strict";
import test from "node:test";
import { currentDemoUserId } from "../src/features/settings/services/current-user.ts";

function settings(overrides) {
  return {
    roles: [{ id: "role-admin", name: "Administrateur", permissions: {} }, { id: "role-prod", name: "Responsable de production", permissions: {} }],
    users: [
      { id: "user-1", active: true, firstName: "Daniel", lastName: "Mülverstedt", email: "daniel@exemple.fr", roleId: "role-admin" },
      { id: "user-2", active: true, firstName: "Sophie", lastName: "Planification", email: "sophie@exemple.fr", roleId: "role-prod" },
    ],
    activeRoleId: "role-admin",
    ...overrides,
  };
}

test("currentDemoUserId retrouve le premier utilisateur actif dont le rôle correspond au rôle de démonstration actif", () => {
  assert.equal(currentDemoUserId(settings()), "user-1");
  assert.equal(currentDemoUserId(settings({ activeRoleId: "role-prod" })), "user-2");
});

test("currentDemoUserId se replie sur le premier utilisateur du tableau si aucun utilisateur actif ne correspond au rôle sélectionné", () => {
  const withInactiveMatch = settings({ users: [{ id: "user-1", active: false, firstName: "Daniel", lastName: "Mülverstedt", email: "daniel@exemple.fr", roleId: "role-admin" }, { id: "user-2", active: true, firstName: "Sophie", lastName: "Planification", email: "sophie@exemple.fr", roleId: "role-prod" }] });
  assert.equal(currentDemoUserId(withInactiveMatch), "user-1");
});

test("currentDemoUserId renvoie null sans aucun utilisateur configuré", () => {
  assert.equal(currentDemoUserId(settings({ users: [] })), null);
});
