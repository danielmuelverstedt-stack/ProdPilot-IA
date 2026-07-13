import { AppShell } from "@/components/layout/AppShell";
import { ErpQualityDetail } from "@/features/erp-quality/components/ErpQualityDetail";
export default async function ErpIssuePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AppShell activeSection="erp-quality" headerTitle="Anomalie ERP"><ErpQualityDetail id={id} /></AppShell>; }
