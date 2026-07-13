import Link from "next/link";

interface WorkspaceCardProps {
  title: string;
  status: string;
  description: string;
  href: string;
  actionLabel: string;
  marker: string;
  tone?: "brand" | "warning" | "neutral";
}

const toneClasses = {
  brand: "bg-[#e5f3ec] text-[#195c45]",
  warning: "bg-[#fff2df] text-[#95631b]",
  neutral: "bg-[#eef2f0] text-[#52655b]",
} as const;

export function WorkspaceCard({
  title,
  status,
  description,
  href,
  actionLabel,
  marker,
  tone = "neutral",
}: WorkspaceCardProps) {
  return (
    <article className="flex min-h-[255px] flex-col rounded-3xl border border-[#dce5e0] bg-white p-5 shadow-[0_12px_38px_rgba(29,64,50,0.06)] transition-transform hover:-translate-y-0.5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span aria-hidden="true" className={`grid size-11 place-items-center rounded-2xl text-xs font-bold ${toneClasses[tone]}`}>{marker}</span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses[tone]}`}>{status}</span>
      </div>
      <h2 className="mt-5 text-xl font-semibold tracking-[-0.025em] text-[#17211d]">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-[#64736c]">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#cad7d1] bg-white px-4 text-sm font-semibold text-[#324a3f] transition-colors hover:border-[#195c45] hover:bg-[#f2f8f5] hover:text-[#195c45]"
      >
        {actionLabel}
        <span aria-hidden="true" className="ml-2">→</span>
      </Link>
    </article>
  );
}
