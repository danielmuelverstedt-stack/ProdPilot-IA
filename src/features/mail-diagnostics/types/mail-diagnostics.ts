export type MailDiagnosticStatus = "ok" | "warning" | "error";

export interface MailDiagnosticItem {
  id: string;
  label: string;
  status: MailDiagnosticStatus;
  value: string;
  explanation: string;
}

export interface MailServerDiagnostics {
  generatedAt: string;
  items: MailDiagnosticItem[];
}
