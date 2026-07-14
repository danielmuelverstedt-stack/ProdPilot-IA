import { secondaryButton } from "@/components/ui/ModuleUi";
import type { DepartmentSettings } from "@/features/settings/types/settings";

export function DepartmentTabs({ departments, allLabel, value, onChange }: {
  departments: DepartmentSettings[];
  allLabel: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return <div className="flex flex-wrap gap-2" aria-label="Département">
    {[{ id: "all", label: allLabel, color: "" }, ...departments].map((department) => <button
      key={department.id}
      type="button"
      onClick={() => onChange(department.id)}
      aria-pressed={value === department.id}
      className={`${secondaryButton} min-h-8 px-3 text-xs`}
      style={value === department.id ? { borderColor: department.color || "var(--app-primary)", color: department.color || "var(--app-primary)", background: `color-mix(in srgb, ${department.color || "var(--app-primary)"} 10%, var(--app-card))` } : undefined}
    >{department.label}</button>)}
  </div>;
}
