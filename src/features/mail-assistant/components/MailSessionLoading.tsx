export function MailSessionLoading({ status }: { status: string }) {
  return <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col items-center justify-center px-6 text-center" aria-live="polite" aria-busy="true">
    <div className="flex h-16 items-center gap-2" aria-hidden="true">
      {[0, 160, 320].map((delay) => <span key={delay} className="mail-session-pulse size-2.5 rounded-full bg-[#1f5f49]" style={{ animationDelay: `${delay}ms` }}/>) }
    </div>
    <p className="mt-8 text-lg font-medium text-[#27352f]">{status}</p>
    <p className="mt-2 text-sm text-slate-400">L’assistant prépare seulement ce qui mérite votre attention.</p>
  </section>;
}
