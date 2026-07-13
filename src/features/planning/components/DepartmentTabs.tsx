import { secondaryButton } from "@/components/ui/ModuleUi";

export function DepartmentTabs({ departments, value, onChange }: {
  departments: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return <div className="flex flex-wrap gap-2" aria-label="Département">
    {["Tous", ...departments].map((department) => <button
      key={department}
      type="button"
      onClick={() => onChange(department)}
      aria-pressed={value === department}
      className={`${secondaryButton} min-h-8 px-3 text-xs ${value === department ? "border-[var(--app-primary)] bg-blue-50 text-[var(--app-primary)]" : ""}`}
    >{department}</button>)}
  </div>;
}
