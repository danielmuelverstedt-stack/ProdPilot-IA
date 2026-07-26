import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDepartmentLoad,
  buildMachineDowntimeEntries,
  buildUpcomingWorkOrders,
  buildWeeklyMachineOccupancy,
  buildWorkOrderTrackingTotals,
} from "../src/features/workspace/services/workspace-dashboard-metrics.ts";

function demoFixture(overrides = {}) {
  return {
    machines: [
      { id: "TOU-01", displayName: "Integrex 300", department: "Tournage", status: "En production" },
      { id: "FRA-01", displayName: "VTC-200C-II", department: "Fraisage", status: "Disponible" },
      { id: "FRA-10", displayName: "Acura 65", department: "Fraisage", status: "Maintenance prévue" },
      { id: "FIL-01", displayName: "FA30S", department: "Découpe fil", status: "En panne" },
    ],
    maintenance: [
      { id: "MAINT-01", machineId: "FRA-10", type: "Préventive", date: "2026-07-14T04:00:00.000Z", durationHours: 2, responsible: "Marc", status: "Prévue", comment: "" },
      { id: "MAINT-02", machineId: "FIL-01", type: "Intervention", date: "2026-07-13T08:00:00.000Z", durationHours: 4, responsible: "Marc", status: "En cours", comment: "" },
    ],
    planning: [
      { id: "plan-1", machineId: "TOU-01", startAt: "2026-07-13T06:00:00.000Z" }, // lundi
      { id: "plan-2", machineId: "FRA-10", startAt: "2026-07-13T05:00:00.000Z" }, // lundi
      { id: "plan-3", machineId: "FIL-01", startAt: "2026-07-14T06:00:00.000Z" }, // mardi
    ],
    workOrders: [
      { id: "OF-1", article: "AXE-TI", quantity: 24, progress: 50, status: "En production", dueDate: "2026-07-15", priority: "Urgente" },
      { id: "OF-2", article: "BRIDE", quantity: 18, progress: 0, status: "Bloqué", dueDate: "2026-07-17", priority: "Haute" },
      { id: "OF-3", article: "OUT", quantity: 2, progress: 0, status: "À lancer", dueDate: "2026-07-14", priority: "Normale" },
      { id: "OF-4", article: "SUP", quantity: 40, progress: 100, status: "Terminé", dueDate: "2026-07-10", priority: "Normale" },
    ],
    ...overrides,
  };
}

test("buildMachineDowntimeEntries ne garde que les machines en panne ou en maintenance prévue, associées à leur événement le plus proche", () => {
  const entries = buildMachineDowntimeEntries(demoFixture());
  assert.deepEqual(entries.map((entry) => entry.machine.id), ["FIL-01", "FRA-10"], "triées par date d'événement la plus proche");
  assert.equal(entries[0].event?.type, "Intervention");
  assert.equal(entries.some((entry) => entry.machine.id === "TOU-01" || entry.machine.id === "FRA-01"), false, "les machines disponibles/en production ne sont pas des indisponibilités");
});

test("buildMachineDowntimeEntries respecte la limite demandée", () => {
  const entries = buildMachineDowntimeEntries(demoFixture(), 1);
  assert.equal(entries.length, 1);
});

test("buildWeeklyMachineOccupancy calcule le pourcentage de machines occupées par jour (Lundi en premier)", () => {
  const points = buildWeeklyMachineOccupancy(demoFixture());
  assert.deepEqual(points.map((point) => point.label), ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]);
  assert.equal(points[0].value, 50, "2 des 4 machines occupées le lundi (TOU-01 et FRA-10)");
  assert.equal(points[1].value, 25, "1 des 4 machines occupées le mardi (FIL-01)");
  assert.equal(points[2].value, 0, "aucune opération planifiée le mercredi");
});

test("buildDepartmentLoad calcule le taux d'occupation par département", () => {
  const bars = buildDepartmentLoad(demoFixture());
  const fraisage = bars.find((bar) => bar.label === "Fraisage");
  assert.equal(fraisage.value, 50, "1 machine occupée sur 2 en Fraisage (FRA-10, pas FRA-01)");
  const tournage = bars.find((bar) => bar.label === "Tournage");
  assert.equal(tournage.value, 100, "la seule machine Tournage a une opération planifiée");
});

test("buildWorkOrderTrackingTotals additionne la quantité prévue et la quantité réalisée au prorata de l'avancement", () => {
  const totals = buildWorkOrderTrackingTotals(demoFixture());
  assert.equal(totals.planned, 24 + 18 + 2 + 40);
  assert.equal(totals.realized, 12 + 0 + 0 + 40, "50 % de 24, 0 % de 18 et 2, 100 % de 40");
});

test("buildUpcomingWorkOrders ne garde que les OF à lancer ou bloqués, triés par échéance et limités", () => {
  const upcoming = buildUpcomingWorkOrders(demoFixture(), 2);
  assert.deepEqual(upcoming.map((order) => order.id), ["OF-3", "OF-2"], "OF-3 (14/07) avant OF-2 (17/07), OF-4 terminé exclu, OF-1 en production exclu");
});
