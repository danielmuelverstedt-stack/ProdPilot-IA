import type { ReactNode } from "react";

export function MailLoadingState() {
  return <MailWorkspaceState title="Chargement des messages…" description="Lecture du compte de messagerie actif en cours." loading />;
}

export function MailEmptyState({ accountName, onRefresh }: { accountName: string; onRefresh: () => void }) {
  return <MailWorkspaceState title="Aucun message récent" description={`Aucun message n’est disponible pour « ${accountName} ».`} actions={<button type="button" onClick={onRefresh} className={secondaryButton}>Actualiser</button>} />;
}

export function MailErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <MailWorkspaceState title="Impossible de charger les messages" description={message} actions={<><button type="button" onClick={onRetry} className={primaryButton}>Réessayer</button><a href="/reglages/connexions/messagerie" className={secondaryButton}>Gérer les comptes</a></>} />;
}

export function MailConnectionRequiredState({ accountName, error }: { accountName: string; error: string | null }) {
  return <MailWorkspaceState title="Le compte actif n’est pas connecté" description={`${error ?? "Activez ou reconnectez un compte dans Réglages."} Compte actuel : ${accountName}.`} actions={<a href="/reglages/connexions/messagerie" className={primaryButton}>Ouvrir les réglages</a>} />;
}

function MailWorkspaceState({ title, description, actions, loading = false }: { title: string; description: string; actions?: ReactNode; loading?: boolean }) {
  return <section aria-busy={loading} className="mt-8 rounded-3xl border border-dashed border-[var(--app-border)] bg-white px-6 py-14 text-center"><div aria-hidden="true" className={`mx-auto mb-4 size-10 rounded-full border-4 border-slate-200 ${loading ? "animate-spin border-t-[var(--app-primary)] motion-reduce:animate-none" : "bg-slate-100"}`} /><h2 className="text-xl font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>{actions ? <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div> : null}</section>;
}

const primaryButton = "inline-flex min-h-11 items-center rounded-xl bg-[var(--app-primary)] px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45]";
const secondaryButton = "inline-flex min-h-11 items-center rounded-xl border border-[var(--app-border)] bg-white px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45]";
