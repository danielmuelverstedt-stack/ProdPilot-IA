import { updateDemoData } from "@/features/demo/services/demo-repository";
import type { MaintenanceProblem, MaintenanceProblemStatus } from "@/features/demo/types/demo";

export interface CreateMaintenanceProblemInput {
  machineId: string;
  title: string;
  description: string;
  occurredOn: string;
  status: MaintenanceProblemStatus;
  problemType: string | null;
  machineStopped: boolean;
  productionImpact: string;
  dueDate: string | null;
  author: string;
  meetingId?: string | null;
}

function id(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createMaintenanceProblem(input: CreateMaintenanceProblemInput): string {
  const problemId = id("MAINT");
  const now = new Date().toISOString();
  updateDemoData((draft) => {
    draft.maintenanceProblems.push({
      id: problemId, machineId: input.machineId, title: input.title.trim(), description: input.description.trim(), occurredOn: input.occurredOn,
      status: input.status, problemType: input.problemType, machineStopped: input.machineStopped, productionImpact: input.productionImpact.trim(), dueDate: input.dueDate,
      createdAt: now, updatedAt: now, resolvedAt: null, sourceMeetingId: input.meetingId ?? null, actionIds: [], comments: [],
      history: [{ id: id("HIST"), author: input.author, createdAt: now, text: "Problème signalé" }],
    });
    if (input.meetingId) {
      const meeting = draft.meetings.find((item) => item.id === input.meetingId);
      if (meeting && !meeting.maintenanceProblemIds.includes(problemId)) meeting.maintenanceProblemIds.push(problemId);
    }
  });
  return problemId;
}

export function updateMaintenanceProblem(problemId: string, patch: Partial<Pick<MaintenanceProblem, "title" | "description" | "occurredOn" | "status" | "problemType" | "machineStopped" | "productionImpact" | "dueDate">>, author: string): void {
  updateDemoData((draft) => {
    const problem = draft.maintenanceProblems.find((item) => item.id === problemId);
    if (!problem) return;
    const previousStatus = problem.status;
    Object.assign(problem, patch, { updatedAt: new Date().toISOString() });
    if (patch.status && patch.status !== previousStatus) problem.history.push({ id: id("HIST"), author, createdAt: problem.updatedAt, text: `Statut : ${previousStatus} → ${patch.status}` });
  });
}

export function addMaintenanceProblemComment(problemId: string, text: string, author: string): void {
  if (!text.trim()) return;
  updateDemoData((draft) => {
    const problem = draft.maintenanceProblems.find((item) => item.id === problemId);
    if (!problem) return;
    const now = new Date().toISOString();
    problem.comments.push({ id: id("COM"), author, createdAt: now, text: text.trim() });
    problem.history.push({ id: id("HIST"), author, createdAt: now, text: "Mise à jour ajoutée" });
    problem.updatedAt = now;
  });
}

export function resolveMaintenanceProblem(problemId: string, resolutionComment: string, author: string): void {
  updateDemoData((draft) => {
    const problem = draft.maintenanceProblems.find((item) => item.id === problemId);
    if (!problem) return;
    const now = new Date().toISOString();
    if (resolutionComment.trim()) problem.comments.push({ id: id("COM"), author, createdAt: now, text: resolutionComment.trim() });
    problem.status = "Résolu";
    problem.resolvedAt = now;
    problem.updatedAt = now;
    problem.history.push({ id: id("HIST"), author, createdAt: now, text: "Problème résolu" });
  });
}

export function linkActionToMaintenanceProblem(problemId: string, actionId: string): void {
  updateDemoData((draft) => {
    const problem = draft.maintenanceProblems.find((item) => item.id === problemId);
    if (problem && !problem.actionIds.includes(actionId)) problem.actionIds.push(actionId);
  });
}

export function setProblemIncludedInMeeting(meetingId: string, problemId: string, included: boolean): void {
  updateDemoData((draft) => {
    const meeting = draft.meetings.find((item) => item.id === meetingId);
    if (!meeting) return;
    meeting.maintenanceProblemIds = included ? [...new Set([...meeting.maintenanceProblemIds, problemId])] : meeting.maintenanceProblemIds.filter((id) => id !== problemId);
  });
}
