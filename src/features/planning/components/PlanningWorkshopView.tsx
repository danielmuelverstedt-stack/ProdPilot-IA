"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState, ErrorBanner } from "@/components/ui/ModuleUi";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { useWorkshopOperations } from "@/features/planning/hooks/useWorkshopOperations";
import { useWorkshopViewPreferences } from "@/features/planning/hooks/useWorkshopViewPreferences";
import { buildDepartmentOperationIndex, buildUnassignedOperationsSection, buildWorkshopCategories, buildWorkshopDepartments, countDepartmentOperations, findMachinesWithMismatchedDepartmentLabel } from "@/features/planning/services/workshop-view-service";
import { WorkshopColumnSelector } from "@/features/planning/components/WorkshopColumnSelector";
import { WorkshopDepartmentSection } from "@/features/planning/components/WorkshopDepartmentSection";
import { WorkshopDepartmentTabs } from "@/features/planning/components/WorkshopDepartmentTabs";
import { WorkshopFilters } from "@/features/planning/components/WorkshopFilters";
import { WorkshopMachinePrintView } from "@/features/planning/components/WorkshopMachinePrintView";
import { DepartmentLinksDialog } from "@/features/planning/components/DepartmentLinksDialog";
import { departmentSettingsService } from "@/features/settings/services/department-settings-service";
import type { DepartmentLinksInput } from "@/features/settings/services/department-settings-service";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { MachineSettings } from "@/features/settings/types/settings";
import { setVisibleTaskCategoryCodes, useVisibleTaskCategoryCodes } from "@/lib/visible-task-categories-store";

export function PlanningWorkshopView() {
  const { settings, updateSettings } = useSettings();
  const machines = settings.production.machines;
  const activeDepartments = useMemo(() => [...settings.production.departments].filter((department) => department.active).sort((a, b) => a.order - b.order), [settings.production.departments]);
  const currentUser = useMemo(() => settings.users.find((entry) => entry.active && entry.roleId === settings.activeRoleId) ?? settings.users.find((entry) => entry.active) ?? settings.users[0], [settings.activeRoleId, settings.users]);
  const preferenceContext = useMemo(() => ({ companyId: "local-development-company", siteId: "default-site", userId: currentUser?.id ?? "local-development-user" }), [currentUser?.id]);

  // Réglage partagé « catégories visibles », dans son propre stockage rapide (pas dans les Réglages
  // partagés) : changer d'onglet ne doit toucher que ce champ, pas cloner/réécrire toute l'application.
  const visibleTaskCategoryCodes = useVisibleTaskCategoryCodes();
  const { rows, allRows, isLoading, isMutating, error, updatePriority, updateMachine, updateStatus, reorderOperations, renumberOperations } = useWorkshopOperations(machines, visibleTaskCategoryCodes);
  function updateVisibleTaskCategoryCodes(codes: string[]) {
    setVisibleTaskCategoryCodes(codes);
  }
  const preferences = useWorkshopViewPreferences(preferenceContext);
  const visibleColumnIds = useMemo(() => preferences.state.columns.filter((column) => column.visible).map((column) => column.id), [preferences.state.columns]);

  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const editingDepartment = editingDepartmentId ? activeDepartments.find((department) => department.id === editingDepartmentId) ?? null : null;
  const [printTarget, setPrintTarget] = useState<{ machine: MachineSettings | null; operations: OperationView[]; totalOperationCount: number } | null>(null);

  const selectedDepartmentId = preferences.state.selectedDepartmentId && activeDepartments.some((department) => department.id === preferences.state.selectedDepartmentId)
    ? preferences.state.selectedDepartmentId
    : (activeDepartments[0]?.id ?? null);
  const selectedDepartment = selectedDepartmentId ? activeDepartments.find((department) => department.id === selectedDepartmentId) ?? null : null;

  /**
   * Sélectionner un onglet applique automatiquement ses catégories liées au réglage partagé
   * « Catégories visibles » ; l'utilisateur peut ensuite l'ajuster librement, ça reste (pas de reset
   * au changement d'onglet). Sauf en mode `"physical"` (Tournage/Fraisage/Découpe fil) : le contenu
   * de l'onglet ne dépend plus des catégories, inutile — et potentiellement trompeur ailleurs dans
   * l'app (Cockpit ERP, Planning capacité) — d'écraser ce réglage partagé en cliquant dessus.
   */
  function handleSelectDepartment(departmentId: string) {
    preferences.selectDepartment(departmentId);
    const department = activeDepartments.find((entry) => entry.id === departmentId);
    if (department?.membershipMode !== "physical") updateVisibleTaskCategoryCodes(department?.linkedCategoryCodes ?? []);
  }

  // allRows (toutes catégories confondues), pas rows (filtrées sur la catégorie du département actif) : les compteurs
  // des autres onglets doivent rester exacts sans attendre qu'on clique dessus. Mêmes règles de rattachement que
  // buildWorkshopCategories (machine taguée, liée directement, ou juste porteuse d'une opération de la catégorie).
  const departmentOperationIndex = useMemo(() => buildDepartmentOperationIndex(allRows), [allRows]);
  const operationCountByDepartmentId = useMemo(
    () => new Map(activeDepartments.map((department) => [department.id, countDepartmentOperations(departmentOperationIndex, machines, department)])),
    [activeDepartments, machines, departmentOperationIndex],
  );

  const isPhysicalDepartment = selectedDepartment?.membershipMode === "physical";

  /**
   * Sans cet effet, un onglet en mode lié déjà sélectionné au chargement de la page (préférence
   * restaurée, sans clic) garde l'ancienne valeur du réglage partagé « Catégories visibles » —
   * venant par ex. du Cockpit ERP ou d'un autre département visité plus tôt — au lieu des
   * catégories réellement liées au département affiché. Les opérations de ces catégories restent
   * alors invisibles partout (`applyTaskCategoryVisibility` masque tout ce qui n'est pas
   * explicitement listé), sans aucun message d'erreur : la section du département apparaît quand
   * même (une machine/poste taguée sur cette catégorie suffit à créer la section), mais reste
   * vide. C'est exactement le symptôme signalé : un poste Peinture nouvellement créé affichait sa
   * section mais aucune opération catégorie 18. `handleSelectDepartment`/`handleCreateDepartment`/
   * `handleUpdateDepartment` couvrent déjà le changement d'onglet et l'édition explicites ; cet
   * effet couvre en plus le cas où l'onglet était déjà sélectionné avant même le premier rendu.
   */
  useEffect(() => {
    if (!selectedDepartment || isPhysicalDepartment) return;
    setVisibleTaskCategoryCodes(selectedDepartment.linkedCategoryCodes ?? []);
  }, [selectedDepartment, isPhysicalDepartment]);

  // Mode "physical" : les opérations viennent de allRows (toutes catégories confondues), pas de rows
  // (filtrées par le réglage partagé « Catégories visibles ») — le contenu de ces onglets ne dépend
  // plus des catégories pour les machines (une machine y apparaît pour toutes ses opérations, dès
  // lors que sa fiche indique ce département physique), mais les catégories liées (✎) restent
  // nécessaires pour retrouver les OF pas encore assignés à une machine (pas de departmentId à lire
  // sur un OF sans machine) : section « Opérations sans machine » toujours en premier, comme pour
  // les départements en mode lié.
  const categoryGroups = useMemo(() => {
    if (isPhysicalDepartment && selectedDepartment) {
      // `filters.departments` est l'ancien filtre à cases à cocher retiré de l'interface (redondant
      // avec les onglets) ; buildWorkshopDepartments le vérifie encore. Un utilisateur ayant coché
      // des départements avant ce retrait garde cette valeur dans ses préférences enregistrées, sans
      // aucun moyen de la modifier depuis l'interface — neutralisée ici pour ne jamais faire
      // disparaître silencieusement toutes les machines d'un département physique à cause d'une
      // valeur figée devenue invisible.
      const physicalFilters = { ...preferences.state.filters, departments: [] };
      const machineSections = buildWorkshopDepartments(allRows, machines, [selectedDepartment], physicalFilters, preferences.state.sort).filter((section) => section.id === selectedDepartment.id);
      const unassignedSection = buildUnassignedOperationsSection(allRows, machines, selectedDepartment, physicalFilters, preferences.state.sort);
      return unassignedSection ? [unassignedSection, ...machineSections] : machineSections;
    }
    return buildWorkshopCategories(rows, machines, preferences.state.filters, preferences.state.sort, visibleTaskCategoryCodes, selectedDepartment?.linkedMachineIds ?? []);
  }, [rows, allRows, machines, preferences.state.filters, preferences.state.sort, visibleTaskCategoryCodes, selectedDepartment, isPhysicalDepartment]);
  const resultCount = useMemo(() => categoryGroups.reduce((total, category) => total + category.machines.reduce((sum, group) => sum + group.operationCount, 0), 0), [categoryGroups]);
  const selectedDepartmentHasNoLinks = selectedDepartment && !isPhysicalDepartment ? !(selectedDepartment.linkedCategoryCodes?.length || selectedDepartment.linkedMachineIds?.length) : false;
  // Diagnostic : une machine dont la fiche affiche toujours le bon libellé (texte figé) peut avoir
  // un lien réel rompu, typiquement après une suppression/recréation du département (même nom,
  // nouvel identifiant) via l'éditeur générique de Réglages, qui ne vérifie pas les machines encore
  // rattachées. Calculé pour tout l'onglet (pas seulement quand il est totalement vide) : d'autres
  // machines du département peuvent s'afficher correctement pendant qu'une seule reste orpheline et
  // invisible sans ce diagnostic.
  const mismatchedDepartmentLabelMachines = useMemo(
    () => isPhysicalDepartment && selectedDepartment ? findMachinesWithMismatchedDepartmentLabel(machines, selectedDepartment) : [],
    [isPhysicalDepartment, selectedDepartment, machines],
  );

  function handleCreateDepartment(input: DepartmentLinksInput) {
    const outcome: { result: ReturnType<typeof departmentSettingsService.createDepartment> } = { result: { ok: false, error: "Impossible de créer le département." } };
    updateSettings((draft) => { outcome.result = departmentSettingsService.createDepartment(draft, input); }, "Département créé");
    if (outcome.result.ok) {
      // Ne pas passer par handleSelectDepartment/activeDepartments ici : `settings` n'est pas encore mis à jour dans cette
      // fermeture (le nouveau département n'y figure pas), la recherche échouerait silencieusement. `input` porte déjà
      // les catégories liées telles que soumises dans la modale, on les applique directement.
      preferences.selectDepartment(outcome.result.department.id);
      updateVisibleTaskCategoryCodes(input.linkedCategoryCodes);
      return { ok: true as const };
    }
    return { ok: false as const, error: outcome.result.error };
  }

  function handleUpdateDepartment(departmentId: string, input: DepartmentLinksInput) {
    let updated = false;
    updateSettings((draft) => { updated = departmentSettingsService.updateDepartmentLinks(draft, departmentId, input); }, "Département modifié");
    if (updated && departmentId === selectedDepartmentId) updateVisibleTaskCategoryCodes(input.linkedCategoryCodes);
    return updated ? { ok: true as const } : { ok: false as const, error: "Département introuvable." };
  }

  function handleDeleteDepartment(departmentId: string) {
    const outcome: { result: ReturnType<typeof departmentSettingsService.deleteDepartment> } = { result: { ok: false, error: "Suppression impossible." } };
    updateSettings((draft) => { outcome.result = departmentSettingsService.deleteDepartment(draft, departmentId); }, "Département supprimé");
    return outcome.result;
  }

  if (printTarget) return <WorkshopMachinePrintView machine={printTarget.machine} operations={printTarget.operations} totalOperationCount={printTarget.totalOperationCount} visibleColumnIds={visibleColumnIds} settings={settings} onBack={() => setPrintTarget(null)} />;

  return <div className="space-y-4">
    {error ? <ErrorBanner>{error}</ErrorBanner> : null}
    {activeDepartments.length ? <WorkshopDepartmentTabs departments={activeDepartments} selectedDepartmentId={selectedDepartmentId} operationCountByDepartmentId={operationCountByDepartmentId} onSelect={handleSelectDepartment} onCreate={() => setCreatingDepartment(true)} onEdit={setEditingDepartmentId} /> : null}
    <WorkshopFilters filters={preferences.state.filters} resultCount={resultCount} totalCount={(isPhysicalDepartment ? allRows : rows).length} onChange={preferences.updateFilters} />
    <WorkshopColumnSelector columns={preferences.state.columns} rowsPerMachine={preferences.state.rowsPerMachine} persistenceError={preferences.persistenceError} onToggleColumn={preferences.toggleColumn} onChangeRowsPerMachine={preferences.setRowsPerMachine} />
    <div className="space-y-5">
      {!activeDepartments.length ? <EmptyState title="Aucun département actif" description="Configurez au moins un département dans Réglages → Production pour utiliser l'Atelier." /> : null}
      {activeDepartments.length && !visibleColumnIds.length ? <EmptyState title="Aucune colonne visible" description="Ouvrez le menu Colonnes pour réactiver au moins une colonne." /> : null}
      {mismatchedDepartmentLabelMachines.length ? <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {mismatchedDepartmentLabelMachines.length} machine(s) affichent « {selectedDepartment?.label} » dans le Parc Machines mais ne sont plus reliées à ce département après un changement de configuration (ex. département supprimé puis recréé) : {mismatchedDepartmentLabelMachines.map((machine) => machine.id).join(", ")}. Ouvrez leur fiche (Parc Machines → la machine → Identité) et resélectionnez « {selectedDepartment?.label} » dans le champ Département pour les rattacher à nouveau.
      </p> : null}
      {activeDepartments.length && visibleColumnIds.length && !categoryGroups.length ? <EmptyState
        title={isLoading ? "Chargement…" : "Aucune machine dans ce département"}
        description={
          mismatchedDepartmentLabelMachines.length
            ? "Voir le message ci-dessus : toutes les machines de ce département semblent ne plus y être reliées."
            : isPhysicalDepartment
              ? "Aucune machine n’indique ce département dans sa fiche (Parc Machines → la machine → Département), et aucune catégorie liée ne remonte d’OF sans machine assignée — vérifiez les deux depuis le bouton ✎ de l’onglet."
              : selectedDepartmentHasNoLinks
                ? "Aucune machine dans ce département — reliez au moins une catégorie ou une machine via le bouton ✎ de l'onglet."
                : "Aucune opération ne correspond aux filtres actifs pour ce département."
        }
      /> : null}
      {visibleColumnIds.length ? categoryGroups.map((category) => <WorkshopDepartmentSection
        key={category.id}
        department={category}
        visibleColumnIds={visibleColumnIds}
        collapsedMachineIds={preferences.state.collapsedMachineIds}
        rowsPerMachine={preferences.state.rowsPerMachine}
        sort={preferences.state.sort}
        machines={machines}
        capacities={settings.production.capacities}
        defaultCapacityHours={settings.production.planning.defaultCapacityHours}
        columnWidths={preferences.state.columnWidths}
        busy={isMutating}
        onToggleMachineCollapsed={preferences.toggleMachineCollapsed}
        onUpdatePriority={updatePriority}
        onUpdateMachine={updateMachine}
        onUpdateStatus={updateStatus}
        onReorderOperations={reorderOperations}
        onRenumberOperations={renumberOperations}
        onMoveColumn={preferences.reorderColumns}
        onResizeColumn={preferences.resizeColumn}
        onCycleSort={preferences.cycleSort}
        onPrint={(machine, operations, totalOperationCount) => setPrintTarget({ machine, operations, totalOperationCount })}
      />) : null}
    </div>
    {creatingDepartment ? <DepartmentLinksDialog department={null} machines={machines} operationIndex={departmentOperationIndex} onClose={() => setCreatingDepartment(false)} onSubmit={handleCreateDepartment} /> : null}
    {editingDepartment ? <DepartmentLinksDialog department={editingDepartment} machines={machines} operationIndex={departmentOperationIndex} onClose={() => setEditingDepartmentId(null)} onSubmit={(input) => handleUpdateDepartment(editingDepartment.id, input)} onDelete={() => handleDeleteDepartment(editingDepartment.id)} /> : null}
  </div>;
}
