export function WorkspaceWelcomeBanner({ firstName, date }: { firstName: string; date: string }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl p-6 text-white shadow-[var(--app-shadow-md)]" style={{ background: "linear-gradient(135deg, var(--app-primary), color-mix(in srgb, var(--app-primary) 55%, var(--app-secondary)))" }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/70">Votre journée</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Bonjour {firstName} !</h1>
        <p className="mt-2 text-sm leading-6 text-white/80">Bienvenue sur votre tableau de bord Production.</p>
      </div>
      <time className="w-fit rounded-full bg-white/15 px-4 py-2 text-xs font-semibold capitalize">{date}</time>
    </div>
  );
}
