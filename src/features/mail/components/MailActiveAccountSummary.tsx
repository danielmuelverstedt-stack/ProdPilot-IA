import { formatMailDate, getMailAccountStatus, mailProviderLabels } from "@/features/mail/components/mail-account-presentation";
import type { MailAccount } from "@/features/mail/types/mail";

const services = ["Mails", "Résumés IA", "Brouillons", "Recherche", "Future conversation IA"];

export function MailActiveAccountSummary({ account }: { account?: MailAccount }) {
  return (
    <section aria-labelledby="active-mail-account-title" className="rounded-2xl border border-[#bfd7cc] bg-[#f1f8f5] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#247052]">Compte actuellement utilisé</p>
      {!account ? <p className="mt-3 text-sm text-[#64736c]">Aucun compte actif. Ajoutez ou activez un compte pour utiliser la messagerie.</p> : <Summary account={account} />}
    </section>
  );
}

function Summary({ account }: { account: MailAccount }) {
  const status = getMailAccountStatus(account);
  return <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
    <div><div className="flex flex-wrap items-center gap-2"><h2 id="active-mail-account-title" className="text-xl font-semibold">{account.displayName}</h2><span className="rounded-full border border-[#9fcbb7] bg-white px-2.5 py-1 text-xs font-semibold text-[#1d694b]">Compte actif</span><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span></div><p className="mt-2 text-sm text-[#40554b]">{mailProviderLabels[account.provider]} · {account.emailAddress}</p><p className="mt-2 text-xs text-[#64736c]">Dernière synchronisation : {formatMailDate(account.lastSuccessfulSyncAt)}</p>{account.organizationId ? <p className="mt-1 text-xs text-[#64736c]">Organisation : {account.organizationId}</p> : null}</div>
    <div><p className="text-sm font-semibold">Services utilisant ce compte</p><ul className="mt-2 flex flex-wrap gap-2">{services.map((service) => <li key={service} className="rounded-lg border border-[#d1e2da] bg-white px-2.5 py-1.5 text-xs font-medium">{service}</li>)}</ul><p className="mt-3 text-xs text-[#64736c]">Préparé pour l’intégration IA</p></div>
  </div>;
}
