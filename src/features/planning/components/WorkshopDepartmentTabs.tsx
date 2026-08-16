import Link from "next/link";
import { HallAssignmentBoard } from "@/features/planning/components/HallAssignmentBoard";
import type { DepartmentSettings, HallSettings } from "@/features/settings/types/settings";

export function WorkshopDepartmentTabs({ halls, departments, selectedDepartmentId, operationCountByDepartmentId, onSelect, onCreate, onEdit, onMove }: {
  halls: HallSettings[];
  departments: DepartmentSettings[];
  selectedDepartmentId: string | null;
  operationCountByDepartmentId: Map<string, number>;
  onSelect: (departmentId: string) => void;
  onCreate: () => void;
  onEdit: (departmentId: string) => void;
  onMove: (draggedId: string, hallId: string | null, targetId: string | null) => void;
}) {
  const items = departments.map((department) => ({ id: department.id, label: department.label, hallId: department.hallId ?? null, hallOrder: department.hallOrder ?? department.order, selected: department.id === selectedDepartmentId, meta: <span className="text-[10px] tabular-nums text-slate-400">{(operationCountByDepartmentId.get(department.id) ?? 0).toLocaleString("fr-BE")}</span> }));
  return <HallAssignmentBoard title="Catégories par hall" description="Glissez les catégories verticalement ou d’un hall vers un autre." itemLabel="catégorie" halls={halls} items={items} onSelect={onSelect} onEdit={onEdit} onMove={onMove} actions={<><button type="button" onClick={onCreate} className="rounded-lg border border-dashed border-[var(--app-border)] bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-[var(--app-primary)] hover:text-[var(--app-primary)]">+ Catégorie</button><Link href="/reglages" className="rounded-lg border border-[var(--app-border)] bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Gérer les halls</Link></>} />;
}
