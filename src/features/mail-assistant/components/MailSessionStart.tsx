export function MailSessionStart({ firstName, account, isDemo, isBusy, error, onStart }: { firstName: string; account?: string; isDemo?: boolean; isBusy: boolean; error: string | null; onStart: () => void }) {
  return <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-5 py-16 text-center" aria-labelledby="mail-session-welcome">
    {isDemo ? <span className="mb-7 rounded-full border border-[#d9e7df] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f5f49]">Mode démonstration</span> : null}
    <p className="text-lg text-slate-500">Bonjour {firstName}</p>
    <h1 id="mail-session-welcome" className="mt-3 max-w-2xl text-balance text-4xl font-semibold tracking-[-0.045em] text-[#18231f] sm:text-6xl">Prêt à traiter vos nouveaux messages&nbsp;?</h1>
    <p className="mt-6 max-w-xl text-base leading-7 text-slate-500">Je vais synchroniser le compte actif, écarter le bruit et préparer uniquement les décisions qui ont besoin de vous.</p>
    <button type="button" disabled={isBusy} onClick={onStart} className="mt-10 min-h-14 rounded-2xl bg-[#1f5f49] px-8 text-base font-semibold text-white shadow-[0_12px_30px_rgba(31,95,73,0.18)] transition hover:-translate-y-0.5 hover:bg-[#184d3b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1f5f49] disabled:opacity-60">Démarrer la session</button>
    <div className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-400">{account ? <span>Compte actif · {account}</span> : null}<span>Synchronisation au démarrage</span><span>Aucun envoi automatique</span></div>
    {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
  </section>;
}
