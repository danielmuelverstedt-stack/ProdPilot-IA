import Link from "next/link";
import type { ReactNode } from "react";

export type ActiveSection =
  | "workspace"
  | "planning"
  | "work-orders"
  | "meetings"
  | "actions"
  | "machines"
  | "settings"
  | "mail";

interface AppShellProps {
  activeSection: ActiveSection;
  headerTitle: string;
  children: ReactNode;
}

const navigationItems = [
  { id: "workspace", label: "Mon Espace", href: "/", marker: "ME" },
  { id: "planning", label: "Planning", href: "/modules/planning", marker: "PL" },
  { id: "work-orders", label: "OF", href: "/modules/of", marker: "OF" },
  { id: "meetings", label: "Réunions", href: "/modules/reunions", marker: "RE" },
  { id: "actions", label: "Actions", href: "/modules/actions", marker: "AC" },
  { id: "machines", label: "Parc Machines", href: "/modules/parc-machines", marker: "PM" },
  {
    id: "settings",
    label: "Réglages",
    href: "/reglages/connexions/messagerie",
    marker: "RG",
  },
] as const;

export function AppShell({ activeSection, headerTitle, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f7f5] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-white/10 bg-[#123d30] text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-8">
          <Link href="/" className="flex w-fit items-center gap-3 rounded-xl">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-xl bg-white/12 text-lg font-bold ring-1 ring-white/20"
            >
              P
            </span>
            <span>
              <span className="block font-semibold tracking-[-0.02em]">ProdPilot IA</span>
              <span className="block text-xs text-emerald-100/70">Pilotage de production</span>
            </span>
          </Link>

          <nav aria-label="Navigation principale" className="hidden lg:mt-12 lg:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/55">
              Espace de travail
            </p>
            <NavigationList activeSection={activeSection} />
          </nav>

          <span className="hidden rounded-2xl border border-white/10 bg-white/6 p-4 text-xs leading-5 text-emerald-50/65 lg:mt-10 lg:block">
            Environnement de démonstration<br />
            Aucune donnée réelle
          </span>
        </div>

        <nav aria-label="Navigation mobile" className="overflow-x-auto border-t border-white/10 px-3 py-2 lg:hidden">
          <div className="min-w-max">
            <NavigationList activeSection={activeSection} isMobile />
          </div>
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-[#dfe6e2] bg-white/85 px-4 backdrop-blur sm:px-8 lg:px-10 xl:px-14">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a8982]">ProdPilot IA</p>
            <p className="mt-0.5 text-sm font-semibold text-[#263b32]">{headerTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold text-[#263b32]">Daniel</span>
              <span className="block text-xs text-[#7a8982]">Responsable de production</span>
            </span>
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-[#e2f1ea] text-sm font-bold text-[#195c45]">DM</span>
          </div>
        </header>
        <main className="min-w-0 px-4 py-7 sm:px-8 lg:px-10 lg:py-10 xl:px-14">{children}</main>
      </div>
    </div>
  );
}

interface NavigationListProps {
  activeSection: ActiveSection;
  isMobile?: boolean;
}

function NavigationList({ activeSection, isMobile = false }: NavigationListProps) {
  return (
    <ul className={isMobile ? "flex gap-1" : "space-y-1.5"}>
      {navigationItems.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/12 text-white ring-1 ring-white/10"
                  : "text-emerald-50/75 hover:bg-white/8 hover:text-white"
              } ${isMobile ? "whitespace-nowrap" : ""}`}
            >
              <span
                aria-hidden="true"
                className={`grid size-7 place-items-center rounded-lg text-[9px] font-bold ${
                  isActive ? "bg-[#69d3a7] text-[#123d30]" : "bg-white/8 text-emerald-50/70"
                }`}
              >
                {item.marker}
              </span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
