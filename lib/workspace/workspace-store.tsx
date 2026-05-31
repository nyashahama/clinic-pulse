"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  createInitialWorkspaceState,
  createQueuedOfflineReport,
  submitFieldReportScenario,
  syncOfflineReportsScenario,
  triggerStaffingShortageScenario,
  triggerStockoutScenario,
} from "@/lib/workspace/scenarios";
import {
  applyIncidentReplayStep,
  type IncidentReplayStepId,
} from "@/lib/workspace/incident-replay";
import {
  clearWorkspaceStorage,
  loadStoredWalkthroughLeads,
  loadStoredOfflineReports,
  saveStoredWalkthroughLeads,
  saveStoredOfflineReports,
} from "@/lib/workspace/storage";
import type {
  AddWalkthroughLeadInput,
  WalkthroughLead,
  WorkspaceRole,
  WorkspaceState,
  QueueOfflineReportInput,
  SubmitFieldReportInput,
} from "@/lib/workspace/types";

type WalkthroughLeadStatus = WalkthroughLead["status"];

type WorkspaceStoreValue = {
  state: WorkspaceState;
  resetWorkspace: () => void;
  triggerStockout: (clinicId: string) => void;
  triggerStaffingShortage: (clinicId: string) => void;
  queueOfflineReport: (report: QueueOfflineReportInput) => void;
  submitFieldReport: (report: SubmitFieldReportInput) => void;
  syncOfflineReports: () => void;
  applyIncidentReplayStep: (stepId: IncidentReplayStepId, now?: string) => void;
  addWalkthroughLead: (lead: AddWalkthroughLeadInput) => void;
  updateLeadStatus: (leadId: string, status: WalkthroughLeadStatus) => void;
  setRole: (role: WorkspaceRole) => void;
};

type WorkspaceAction =
  | { type: "reset"; state: WorkspaceState }
  | { type: "refresh_backend_hydration"; state: WorkspaceState }
  | { type: "trigger_stockout"; clinicId: string }
  | { type: "trigger_staffing_shortage"; clinicId: string }
  | { type: "queue_offline_report"; report: QueueOfflineReportInput }
  | { type: "submit_field_report"; report: SubmitFieldReportInput }
  | { type: "sync_offline_reports" }
  | { type: "apply_incident_replay_step"; stepId: IncidentReplayStepId; now: string }
  | { type: "add_walkthrough_lead"; lead: AddWalkthroughLeadInput }
  | { type: "update_lead_status"; leadId: string; status: WalkthroughLeadStatus }
  | { type: "set_role"; role: WorkspaceRole }
  | { type: "hydrate"; leads: WalkthroughLead[]; offlineQueue: WorkspaceState["offlineQueue"] };

const WorkspaceStoreContext = createContext<WorkspaceStoreValue | null>(null);

function buildLeadId() {
  return `lead-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneWorkspaceState(state: WorkspaceState): WorkspaceState {
  return {
    ...state,
    clinics: state.clinics.map((clinic) => ({ ...clinic, services: [...clinic.services] })),
    clinicStates: state.clinicStates.map((clinicState) => ({ ...clinicState })),
    reports: state.reports.map((report) => ({ ...report })),
    alerts: state.alerts.map((alert) => ({ ...alert })),
    auditEvents: state.auditEvents.map((event) => ({ ...event })),
    leads: state.leads.map((lead) => ({ ...lead })),
    offlineQueue: state.offlineQueue.map((report) => ({ ...report })),
  };
}

export function createWorkspaceStoreInitialState(initialState?: WorkspaceState): WorkspaceState {
  return cloneWorkspaceState(initialState ?? createInitialWorkspaceState());
}

export function mergeWorkspaceBackendHydrationState(
  currentState: WorkspaceState,
  backendState: WorkspaceState,
): WorkspaceState {
  const nextBackendState = createWorkspaceStoreInitialState(backendState);

  return {
    ...currentState,
    province: nextBackendState.province,
    district: nextBackendState.district,
    clinics: nextBackendState.clinics,
    clinicStates: nextBackendState.clinicStates,
    reports: nextBackendState.reports,
    auditEvents: nextBackendState.auditEvents,
  };
}

export function getWorkspaceBackendHydrationSignature(state?: WorkspaceState): string {
  const backendState = state ?? createInitialWorkspaceState();

  return JSON.stringify({
    province: backendState.province,
    district: backendState.district,
    clinics: backendState.clinics,
    clinicStates: backendState.clinicStates,
    reports: backendState.reports,
    auditEvents: backendState.auditEvents,
  });
}

function createReducerState(initialState?: WorkspaceState): WorkspaceState {
  return createWorkspaceStoreInitialState(initialState);
}

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  const now = new Date().toISOString();

  switch (action.type) {
    case "reset":
      return createWorkspaceStoreInitialState(action.state);
    case "refresh_backend_hydration":
      return mergeWorkspaceBackendHydrationState(state, action.state);
    case "trigger_stockout":
      return triggerStockoutScenario(state, action.clinicId, now);
    case "trigger_staffing_shortage":
      return triggerStaffingShortageScenario(state, action.clinicId, now);
    case "queue_offline_report": {
      const queuedReport = createQueuedOfflineReport(action.report, now);

      // Phase 2 keeps offline field reports in a browser-local workspace queue.
      // Durable offline sync semantics move to Phase 4.
      return {
        ...state,
        offlineQueue: [queuedReport, ...state.offlineQueue],
        alerts: [
          {
            id: `alert-${Math.random().toString(36).slice(2, 10)}`,
            clinicId: queuedReport.clinicId,
            type: "offline_queue_delay",
            severity: "medium",
            status: "open",
            recommendedAction:
              "Sync queued field reports when connectivity returns so district status can refresh.",
            createdAt: now,
          },
          ...state.alerts.filter(
            (alert) =>
              !(
                alert.clinicId === queuedReport.clinicId &&
                alert.type === "offline_queue_delay" &&
                alert.status !== "resolved"
              ),
          ),
        ],
        auditEvents: [
          {
            id: `audit-${Math.random().toString(36).slice(2, 10)}`,
            clinicId: queuedReport.clinicId,
            actorName: queuedReport.reporterName,
            eventType: "report.received_offline",
            summary: "Offline report queued locally until connectivity is restored.",
            createdAt: now,
          },
          ...state.auditEvents,
        ],
      };
    }
    case "sync_offline_reports":
      return syncOfflineReportsScenario(state, now);
    case "apply_incident_replay_step":
      return applyIncidentReplayStep(state, action.stepId, action.now);
    case "submit_field_report":
      return submitFieldReportScenario(
        state,
        {
          ...action.report,
          offlineCreated: action.report.offlineCreated,
        },
        now,
      );
    case "add_walkthrough_lead":
      return {
        ...state,
        leads: [
          {
            id: buildLeadId(),
            createdAt: action.lead.createdAt ?? now,
            status: action.lead.status ?? "new",
            ...action.lead,
          },
          ...state.leads,
        ],
      };
    case "update_lead_status":
      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === action.leadId ? { ...lead, status: action.status } : lead,
        ),
      };
    case "set_role":
      return {
        ...state,
        role: action.role,
      };
    case "hydrate":
      return {
        ...state,
        leads: [...action.leads, ...state.leads],
        offlineQueue: [...action.offlineQueue],
      };
    default:
      return state;
  }
}

export function WorkspaceStoreProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: WorkspaceState;
}) {
  const hydrationSignature = getWorkspaceBackendHydrationSignature(initialState);
  const [resetState, setResetState] = useState(() => createWorkspaceStoreInitialState(initialState));
  const [state, dispatch] = useReducer(workspaceReducer, resetState, createReducerState);
  const hasHydrated = useRef(false);
  const lastHydrationSignature = useRef(hydrationSignature);

  useEffect(() => {
    if (lastHydrationSignature.current === hydrationSignature) {
      return;
    }

    lastHydrationSignature.current = hydrationSignature;
    const nextResetState = createWorkspaceStoreInitialState(initialState);
    setResetState(nextResetState);
    dispatch({ type: "refresh_backend_hydration", state: nextResetState });
  }, [hydrationSignature, initialState]);

  useEffect(() => {
    if (hasHydrated.current) {
      return;
    }

    const storedLeads = loadStoredWalkthroughLeads();
    const storedOfflineReports = loadStoredOfflineReports();
    hasHydrated.current = true;

    if (storedLeads.length === 0 && storedOfflineReports.length === 0) {
      return;
    }

    dispatch({
      type: "hydrate",
      leads: storedLeads.filter(
        (storedLead) => !state.leads.some((lead) => lead.id === storedLead.id),
      ),
      offlineQueue: storedOfflineReports,
    });
  }, [state.leads]);

  useEffect(() => {
    saveStoredWalkthroughLeads(state.leads);
  }, [state.leads]);

  useEffect(() => {
    saveStoredOfflineReports(state.offlineQueue);
  }, [state.offlineQueue]);

  const value = useMemo<WorkspaceStoreValue>(
    () => ({
      state,
      resetWorkspace: () => {
        clearWorkspaceStorage();
        dispatch({
          type: "reset",
          state: resetState,
        });
      },
      triggerStockout: (clinicId: string) =>
        dispatch({ type: "trigger_stockout", clinicId }),
      triggerStaffingShortage: (clinicId: string) =>
        dispatch({ type: "trigger_staffing_shortage", clinicId }),
      queueOfflineReport: (report: QueueOfflineReportInput) =>
        dispatch({ type: "queue_offline_report", report }),
      submitFieldReport: (report: SubmitFieldReportInput) =>
        dispatch({ type: "submit_field_report", report }),
      syncOfflineReports: () => dispatch({ type: "sync_offline_reports" }),
      applyIncidentReplayStep: (stepId, stepNow?) =>
        dispatch({
          type: "apply_incident_replay_step",
          stepId,
          now: stepNow ?? new Date().toISOString(),
        }),
      addWalkthroughLead: (lead: AddWalkthroughLeadInput) =>
        dispatch({ type: "add_walkthrough_lead", lead }),
      updateLeadStatus: (leadId: string, status: WalkthroughLeadStatus) =>
        dispatch({ type: "update_lead_status", leadId, status }),
      setRole: (role: WorkspaceRole) => dispatch({ type: "set_role", role }),
    }),
    [resetState, state],
  );

  return (
    <WorkspaceStoreContext.Provider value={value}>
      {children}
    </WorkspaceStoreContext.Provider>
  );
}

export function useWorkspaceStore() {
  const context = useContext(WorkspaceStoreContext);

  if (!context) {
    throw new Error("useWorkspaceStore must be used within a WorkspaceStoreProvider");
  }

  return context;
}
