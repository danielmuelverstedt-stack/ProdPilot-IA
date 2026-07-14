"use client";

export function MailProviderChooser({ onAddDemo, onMicrosoftInfo }: {
  onAddDemo: () => void;
  onMicrosoftInfo: () => void;
}) {
  const base = "rounded-2xl border border-[#dfe6e2] bg-white p-5 shadow-sm";
  const button = "mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#cbd7d1] px-4 text-sm font-semibold text-[#40554b]";
  return (
    <section aria-labelledby="add-mail-account-title">
      <h2 id="add-mail-account-title" className="text-lg font-semibold">Ajouter un compte</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <article className={base}>
          <ProviderHeading letter="G" name="Google Workspace" detail="Connexion sécurisée par OAuth" />
          <a href="/api/auth/google" className={`${button} border-[#195c45] bg-[#195c45] text-white hover:bg-[#104432]`}>Connecter Google Workspace</a>
        </article>
        <article className={base}>
          <ProviderHeading letter="M" name="Microsoft 365" detail="Connexion Outlook à venir" />
          <span className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Bientôt disponible</span>
          <button type="button" onClick={onMicrosoftInfo} className={button}>Plus d’informations</button>
        </article>
        <article className={base}>
          <ProviderHeading letter="D" name="Démonstration" detail="Données locales, sans service externe" />
          <button type="button" onClick={onAddDemo} className={button}>Ajouter une démonstration</button>
        </article>
      </div>
    </section>
  );
}

function ProviderHeading({ letter, name, detail }: { letter: string; name: string; detail: string }) {
  return <div className="flex items-center gap-3"><span aria-hidden="true" className="grid size-11 place-items-center rounded-xl bg-[#edf6f2] font-bold text-[#195c45]">{letter}</span><div><h3 className="font-semibold">{name}</h3><p className="mt-0.5 text-sm text-[#64736c]">{detail}</p></div></div>;
}
