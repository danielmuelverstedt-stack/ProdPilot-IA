import { AppShell } from "@/components/layout/AppShell";
import { ContactsModule } from "@/features/contacts/components/ContactsModule";

export default function ContactsPage() { return <AppShell activeSection="contacts" headerTitle="Contacts"><ContactsModule /></AppShell>; }
