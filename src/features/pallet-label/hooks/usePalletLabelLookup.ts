"use client";

import { useEffect, useState } from "react";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useErpImportActive } from "@/features/planning/hooks/useErpImportActive";
import { buildLabelFieldsFromDemoWorkOrder, buildLabelFieldsFromErpWorkOrder, emptyLabelFields } from "@/features/pallet-label/services/pallet-label-lookup";
import type { ErpPlanningQueryResult, ErpWorkOrder } from "@/features/erp-import/types/erp-import";
import type { PalletLabelFields } from "@/features/pallet-label/types/pallet-label";

/**
 * Recherche automatique des informations d'un OF (client, quantité, article, description) pour
 * préremplir l'affiche palette, dans les données de démonstration ou la projection ERP active —
 * même exclusivité que `WorkOrderDetail`. Ne renseigne jamais le n° de plan, absent des deux sources.
 */
export function usePalletLabelLookup(ofNumber: string): { fields: PalletLabelFields; isLoading: boolean; found: boolean } {
  const data = useDemoData();
  const { hasActiveImport, isLoading: isImportStatusLoading } = useErpImportActive();
  const trimmedId = ofNumber.trim();
  // Résultat gardé avec l'id qu'il couvre : le chargement est déduit de la comparaison avec
  // `trimmedId` plutôt que suivi par un état séparé, pour éviter tout setState synchrone dans l'effet.
  const [erpResult, setErpResult] = useState<{ id: string; fields: PalletLabelFields; found: boolean } | null>(null);

  useEffect(() => {
    // Tant qu'on ne sait pas encore si un import ERP est actif, ne pas basculer prématurément sur
    // la recherche en démonstration : `hasActiveImport` démarre à `false` avant sa propre requête.
    if (isImportStatusLoading || !hasActiveImport || !trimmedId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void fetch(`/api/erp/planning?search=${encodeURIComponent(trimmedId)}&sort=work-order&pageSize=200&include=work-order-details`, { cache: "no-store" })
        .then((response) => response.ok ? response.json() as Promise<ErpPlanningQueryResult> : null)
        .then((payload) => {
          if (!active) return;
          const rows = payload?.rows.filter((row) => row.workOrderId === trimmedId) ?? [];
          const workOrderReference = rows[0]?.workOrder;
          const workOrder: ErpWorkOrder | null = workOrderReference && "orderLines" in workOrderReference ? workOrderReference : null;
          setErpResult({ id: trimmedId, fields: buildLabelFieldsFromErpWorkOrder(workOrder, rows[0], trimmedId), found: rows.length > 0 });
        })
        .catch(() => { if (active) setErpResult({ id: trimmedId, fields: emptyLabelFields(trimmedId), found: false }); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [isImportStatusLoading, hasActiveImport, trimmedId]);

  if (!trimmedId) return { fields: emptyLabelFields(""), isLoading: false, found: false };
  if (isImportStatusLoading) return { fields: emptyLabelFields(trimmedId), isLoading: true, found: false };
  if (!hasActiveImport) {
    const order = data.workOrders.find((item) => item.id.toLocaleLowerCase("fr") === trimmedId.toLocaleLowerCase("fr"));
    return { fields: buildLabelFieldsFromDemoWorkOrder(order, trimmedId), isLoading: false, found: order !== undefined };
  }
  if (erpResult && erpResult.id === trimmedId) return { fields: erpResult.fields, isLoading: false, found: erpResult.found };
  return { fields: emptyLabelFields(trimmedId), isLoading: true, found: false };
}
