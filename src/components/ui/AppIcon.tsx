import type { SVGProps } from "react";
import {
  ArrowRight,
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookUser,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Factory,
  Gauge,
  Home,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Mail,
  Menu,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  home: Home,
  dashboard: LayoutDashboard,
  calendar: Calendar,
  list: ListChecks,
  meeting: Users,
  check: CheckCircle2,
  quality: ShieldCheck,
  factory: Factory,
  tracking: Activity,
  chart: BarChart3,
  settings: Settings,
  mail: Mail,
  inbox: Inbox,
  bell: Bell,
  search: Search,
  menu: Menu,
  phone: Phone,
  close: X,
  chevron: ChevronRight,
  arrow: ArrowRight,
  wrench: Wrench,
  alert: AlertTriangle,
  trend: TrendingUp,
  gauge: Gauge,
  clipboard: ClipboardList,
  contacts: BookUser,
};

export const iconOptions = Object.keys(icons);
export const iconLabels: Record<string, string> = {
  home: "Accueil", dashboard: "Tableau de bord", calendar: "Calendrier", list: "Liste",
  meeting: "Réunion", check: "Validation", quality: "Qualité", factory: "Usine",
  tracking: "Suivi", chart: "Graphique", settings: "Réglages", mail: "Mail",
  inbox: "Boîte de réception", bell: "Cloche", search: "Recherche", menu: "Menu", phone: "Téléphone",
  close: "Fermer", chevron: "Chevron", arrow: "Flèche", wrench: "Clé", alert: "Alerte",
  trend: "Tendance", gauge: "Jauge", clipboard: "Presse-papiers", contacts: "Contacts",
};

export function AppIcon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  const Icon = icons[name] ?? icons.dashboard;
  return <Icon strokeWidth={1.8} aria-hidden="true" {...props} />;
}
