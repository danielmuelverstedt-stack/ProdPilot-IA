"use client";

import { useEffect, useState } from "react";
import { ErrorBanner, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { MailDraftReviewCard, type ReviewableDraft } from "@/features/mail-assistant/components/MailDraftReviewCard";
import type { MailAccount } from "@/features/mail/types/mail";

type ConnectionState = { status: "loading" } | { status: "available"; account: MailAccount } | { status: "unavailable"; message: string };

/**
 * Compose toujours un e-mail local relisible, même sans connecteur. Gmail OAuth est un canal
 * optionnel supplémentaire : sa panne ne doit jamais rendre le bouton principal sans effet.
 */
export function MailDraftSendPanel({ label, resolved, unresolved, subject, bodyText, bodyHtml, inlineImages = [], attachments = [], draftKey, onSent, className = "mt-6 border-t border-[var(--app-border)] pt-5" }: {
  label: string;
  resolved: { name: string; email: string }[];
  unresolved: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inlineImages?: { contentId: string; mimeType: "image/jpeg" | "image/png" | "image/webp"; base64: string; filename: string }[];
  attachments?: { mimeType: "application/pdf"; base64: string; filename: string }[];
  draftKey: string;
  onSent?: () => void;
  className?: string;
}) {
  const [connection, setConnection] = useState<ConnectionState>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReviewableDraft | null>(null);
  const [preparingRemote, setPreparingRemote] = useState(false);
  const [copied, setCopied] = useState(false);
  const recipientEmails = resolved.map((item) => item.email);
  const recipientNames = resolved.map((item) => item.name).join(", ") || "À compléter";
  const previewHtml = bodyHtml?.replace(/cid:([a-zA-Z0-9._-]+)/g, (_, cid: string) => {
    const image = inlineImages.find((item) => item.contentId === cid);
    return image ? `data:${image.mimeType};base64,${image.base64}` : "";
  });

  useEffect(() => {
    let active = true;
    void fetch("/api/mail/connection", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as { account?: MailAccount; message?: string } | null;
        if (!response.ok || !payload?.account) throw new Error(payload?.message ?? "Aucun compte de messagerie connecté.");
        if (active) setConnection({ status: "available", account: payload.account });
      })
      .catch((caught: unknown) => { if (active) setConnection({ status: "unavailable", message: caught instanceof Error ? caught.message : "Aucun compte de messagerie connecté." }); });
    return () => { active = false; };
  }, []);

  function generateLocalDraft() {
    setError(null);
    setDraft({ key: draftKey, draftId: null, recipient: recipientNames, subject, bodyText, bodyHtml: previewHtml, attachmentNames: attachments.map((item) => item.filename) });
  }

  async function prepareGmailDraft() {
    setPreparingRemote(true);
    setError(null);
    try {
      const response = await fetch("/api/mail/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true, to: recipientEmails, subject, bodyText, bodyHtml, inlineImages, attachments }) });
      const payload = await response.json() as { draft?: { id: string }; message?: string };
      if (!response.ok || !payload.draft) throw new Error(payload.message ?? "Le brouillon Gmail n’a pas pu être préparé.");
      setDraft({ key: draftKey, draftId: payload.draft.id, recipient: recipientNames, subject, bodyText, bodyHtml: previewHtml, attachmentNames: attachments.map((item) => item.filename) });
    } catch (caught) {
      generateLocalDraft();
      setError(caught instanceof Error ? `${caught.message} L’e-mail local reste disponible ci-dessous.` : "Le brouillon Gmail n’a pas pu être préparé. L’e-mail local reste disponible ci-dessous.");
    } finally {
      setPreparingRemote(false);
    }
  }

  async function copyEmail() {
    const content = `À : ${recipientEmails.join("; ")}\nObjet : ${subject}\n\n${bodyText}`;
    try { await navigator.clipboard.writeText(content); setCopied(true); }
    catch { setError("La copie automatique n’est pas disponible. Sélectionnez le contenu de l’aperçu."); }
  }

  const mailto = `mailto:${recipientEmails.join(",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  const canUseGmail = connection.status === "available" && connection.account.mode === "oauth";

  function downloadAttachment(attachment: (typeof attachments)[number]) {
    const binary = atob(attachment.base64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: attachment.mimeType }));
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadCompleteEmail() {
    const mixedBoundary = `prodpilot-mixed-${crypto.randomUUID()}`;
    const alternativeBoundary = `prodpilot-alternative-${crypto.randomUUID()}`;
    const encodedSubject = bytesToBase64(new TextEncoder().encode(subject));
    const lines = [
      "X-Unsent: 1",
      `To: ${recipientEmails.join(", ")}`,
      `Subject: =?UTF-8?B?${encodedSubject}?=`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
      "",
      `--${mixedBoundary}`,
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
      "",
      `--${alternativeBoundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      bodyText,
      `--${alternativeBoundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      bodyHtml ?? `<pre>${bodyText.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]!)}</pre>`,
      `--${alternativeBoundary}--`,
      ...inlineImages.flatMap((image) => [
        `--${mixedBoundary}`,
        `Content-Type: ${image.mimeType}; name="${image.filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-ID: <${image.contentId}>`,
        `Content-Disposition: inline; filename="${image.filename}"`,
        "",
        image.base64.replace(/\s/g, "").match(/.{1,76}/g)?.join("\r\n") ?? "",
      ]),
      ...attachments.flatMap((attachment) => [
        `--${mixedBoundary}`,
        `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        "",
        attachment.base64.match(/.{1,76}/g)?.join("\r\n") ?? "",
      ]),
      `--${mixedBoundary}--`,
      "",
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "message/rfc822" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "preparation-reunion.eml";
    link.click();
    URL.revokeObjectURL(url);
  }

  return <section className={className}>
    <h3 className="text-sm font-semibold">{label}</h3>
    <p className="mt-1 text-xs text-slate-600">Destinataires : {recipientNames}</p>
    {unresolved.length ? <p className="mt-1 text-xs text-amber-700">Adresse à compléter pour : {unresolved.join(", ")}</p> : null}
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className={primaryButton} onClick={generateLocalDraft}>Générer l’e-mail</button>
      {canUseGmail ? <button type="button" className={secondaryButton} disabled={preparingRemote || !recipientEmails.length} onClick={() => void prepareGmailDraft()}>{preparingRemote ? "Création…" : "Créer le brouillon Gmail"}</button> : null}
    </div>
    {connection.status === "loading" ? <p className="mt-2 text-xs text-slate-500">Recherche d’un connecteur d’envoi disponible…</p> : null}
    {connection.status === "unavailable" ? <p className="mt-2 text-xs text-slate-500">Aucun connecteur actif : l’e-mail reste disponible localement, prêt à copier ou à ouvrir dans votre messagerie.</p> : null}
    {error ? <ErrorBanner className="mt-3">{error}</ErrorBanner> : null}
    {draft?.draftId ? <MailDraftReviewCard draft={draft} sendingEnabled={connection.status === "available" && connection.account.settings.sendingEnabled} onSent={() => onSent?.()} /> : null}
    {draft && !draft.draftId ? <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-white p-4 shadow-[var(--app-shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-mail prêt · relisez avant toute transmission</p>
      <p className="mt-3 text-sm"><strong>À :</strong> {recipientEmails.join("; ") || "à compléter"}</p>
      <p className="mt-1 text-sm"><strong>Objet :</strong> {subject}</p>
      {previewHtml ? <iframe title="Aperçu de l’e-mail" sandbox="" srcDoc={previewHtml} className="mt-3 h-96 w-full rounded-xl border border-[var(--app-border)] bg-white" /> : <div className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{bodyText}</div>}
      {attachments.map((attachment) => <button key={attachment.filename} type="button" className={`${secondaryButton} mt-3`} onClick={() => downloadAttachment(attachment)}>Télécharger {attachment.filename}</button>)}
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={secondaryButton} onClick={() => void copyEmail()}>{copied ? "Copié" : "Copier l’e-mail"}</button>{attachments.length ? <button type="button" className={secondaryButton} onClick={downloadCompleteEmail}>Télécharger le mail complet (.eml)</button> : <a className={secondaryButton} href={mailto}>Ouvrir dans ma messagerie</a>}</div>
      {attachments.length ? <p className="mt-2 text-xs text-slate-500">Ouvrez le fichier .eml téléchargé dans Outlook ou votre messagerie : le PDF y est déjà joint.</p> : null}
      <p className="mt-2 text-xs text-slate-500">Aucun message n’a été envoyé automatiquement.</p>
    </div> : null}
  </section>;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}
