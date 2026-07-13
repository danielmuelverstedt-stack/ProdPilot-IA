import type { SVGProps } from "react";

const paths: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3V10.5Z",
  dashboard: "M4 4h6v6H4V4Zm10 0h6v10h-6V4ZM4 14h6v6H4v-6Zm10 4h6v2h-6v-2Z",
  calendar: "M5 3v3m14-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  meeting: "M7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 2a3 3 0 1 0 0-6m-15 14v-3a5 5 0 0 1 10 0v3m2 0v-2a4 4 0 0 1 8 0v2",
  check: "m4 12 5 5L20 6",
  quality: "m12 3 2.8 5.7L21 10l-4.5 4.4 1.1 6.2L12 17.7l-5.6 2.9 1.1-6.2L3 10l6.2-1.3L12 3Z",
  factory: "M3 21V10l6-4v4l6-4v4l6-3v14H3Zm4-6h2m4 0h2m4 0h2",
  tracking: "M4 19h16M6 16l4-5 4 3 4-7",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.5-6-1.4 1.4M7.4 16.6 6 18m12 0-1.4-1.4M7.4 7.4 6 6",
  mail: "M3 5h18v14H3V5Zm1 1 8 7 8-7",
  inbox: "M4 4h16v16H4V4Zm0 11h5l2 3h2l2-3h5",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4",
  search: "m21 21-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  chevron: "m9 18 6-6-6-6",
  arrow: "M5 12h14m-5-5 5 5-5 5",
};

export const iconOptions = Object.keys(paths);
export const iconLabels: Record<string, string> = {
  home: "Accueil", dashboard: "Tableau de bord", calendar: "Calendrier", list: "Liste",
  meeting: "Réunion", check: "Validation", quality: "Qualité", factory: "Usine",
  tracking: "Suivi", chart: "Graphique", settings: "Réglages", mail: "Mail",
  inbox: "Boîte de réception", bell: "Cloche", search: "Recherche", menu: "Menu",
  close: "Fermer", chevron: "Chevron", arrow: "Flèche",
};

export function AppIcon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={paths[name] ?? paths.dashboard} />
    </svg>
  );
}
