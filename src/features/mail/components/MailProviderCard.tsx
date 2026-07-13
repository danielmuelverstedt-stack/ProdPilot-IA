import type { MailConnectionSummary } from "@/features/mail/types/mail";

interface MailProviderCardProps {
  connection: MailConnectionSummary;
  isPending: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const statusPresentation = {
  connected: {
    label: "Connecté",
    dotClassName: "bg-[#278a63]",
    badgeClassName: "border-[#b9dccc] bg-[#edf8f3] text-[#1d694b]",
  },
  disconnected: {
    label: "Non connecté",
    dotClassName: "bg-[#9aa8a1]",
    badgeClassName: "border-[#d9dfdc] bg-[#f6f8f7] text-[#5f6f67]",
  },
  unavailable: {
    label: "Bientôt disponible",
    dotClassName: "bg-[#d69b32]",
    badgeClassName: "border-[#ead7ae] bg-[#fff8e8] text-[#805d1f]",
  },
} as const;

export function MailProviderCard({
  connection,
  isPending,
  onConnect,
  onDisconnect,
}: MailProviderCardProps) {
  const status = statusPresentation[connection.state];
  const canConnect = connection.state === "disconnected" && !isPending;
  const canDisconnect = connection.state === "connected" && !isPending;

  return (
    <article className="flex min-h-[310px] flex-col rounded-3xl border border-[#dfe6e2] bg-white p-6 shadow-[0_18px_55px_rgba(29,64,50,0.07)] transition-shadow hover:shadow-[0_20px_60px_rgba(29,64,50,0.11)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div
          aria-hidden="true"
          className="grid size-12 place-items-center rounded-2xl bg-[#edf5f1] text-lg font-bold text-[#195c45] ring-1 ring-[#d4e5dc]"
        >
          {connection.providerName.charAt(0)}
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.badgeClassName}`}
        >
          <span aria-hidden="true" className={`size-2 rounded-full ${status.dotClassName}`} />
          {status.label}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold tracking-[-0.025em] text-[#17211d]">
            {connection.providerName}
          </h3>
          {connection.isMock ? (
            <span className="rounded-md bg-[#eef1ff] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#575d9b]">
              Démonstration
            </span>
          ) : null}
        </div>
        <p className="mt-2 min-h-12 text-sm leading-6 text-[#64736c]">
          {connection.description}
        </p>
      </div>

      <dl className="mt-6 border-t border-[#edf0ee] pt-5">
        <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#89968f]">
          Adresse connectée
        </dt>
        <dd className="mt-2 min-h-6 break-all text-sm font-medium text-[#263b32]">
          {connection.emailAddress ?? "Aucune adresse connectée"}
        </dd>
      </dl>

      <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
        <button
          type="button"
          onClick={onConnect}
          disabled={!canConnect}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#195c45] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#104432] disabled:cursor-not-allowed disabled:bg-[#dce3df] disabled:text-[#829088]"
        >
          {isPending && connection.state === "disconnected"
            ? "Connexion…"
            : "Connecter"}
        </button>
        <button
          type="button"
          onClick={onDisconnect}
          disabled={!canDisconnect}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#cfd9d4] bg-white px-4 text-sm font-semibold text-[#43564d] transition-colors hover:border-[#aebdb6] hover:bg-[#f7f9f8] disabled:cursor-not-allowed disabled:border-[#e4e8e6] disabled:text-[#a9b3ae]"
        >
          {isPending && connection.state === "connected"
            ? "Déconnexion…"
            : "Déconnecter"}
        </button>
      </div>
    </article>
  );
}
