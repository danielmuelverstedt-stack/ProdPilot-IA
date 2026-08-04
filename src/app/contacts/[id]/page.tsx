import { AppShell } from "@/components/layout/AppShell";
import { ContactDetail } from "@/features/contacts/components/ContactDetail";

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AppShell activeSection="contacts" headerTitle="Fiche contact"><ContactDetail id={id} /></AppShell>; }
