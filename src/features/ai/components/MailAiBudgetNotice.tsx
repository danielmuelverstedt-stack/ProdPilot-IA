"use client";

import { useEffect, useState } from "react";
import type { AiBudgetAlert, AiUsageSummary } from "@/features/ai/types/ai-usage";
import { useSettings } from "@/features/settings/components/SettingsProvider";

export function MailAiBudgetNotice() {
  const { settings } = useSettings();
  const [alerts, setAlerts] = useState<AiBudgetAlert[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/ai/usage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: { period: "current_month", operation: "all" }, budgetPolicy: settings.ai.budgetPolicy, pricingRegistry: settings.ai.pricingRegistry }) })
      .then(async (response) => response.ok ? response.json() as Promise<AiUsageSummary> : null)
      .then((summary) => { if (active && summary) setAlerts(summary.alerts.filter((alert) => alert.level !== "information")); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [settings.ai.budgetPolicy, settings.ai.pricingRegistry]);
  if (!alerts.length) return null;
  return <div className="mt-3 space-y-2">{alerts.map((alert) => <p key={alert.id} className={`rounded-xl border p-3 text-xs ${alert.level === "critical" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{alert.message}</p>)}</div>;
}
