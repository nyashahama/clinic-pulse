"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  createInitialDemoState,
  createQueuedOfflineReport,
  submitFieldReportScenario,
  syncOfflineReportsScenario,
  triggerStaffingShortageScenario,
  triggerStockoutScenario,
} from "@/lib/demo/scenarios";
import {
  clearDemoStorage,
  loadStoredDemoLeads,
  loadStoredOfflineReports,
  saveStoredDemoLeads,
  saveStoredOfflineReports,
} from "@/lib/demo/storage";
import type {
  AddDemoLeadInput,
  DemoLead,
  DemoRole,
  DemoState,
  QueueOfflineReportInput,
  SubmitFieldReportInput,
} from "@/lib/demo/types";

type DemoLeadStatus = DemoLead["status"];

type DemoStoreValue = {
  state: DemoState;
  resetDemo: () => void;
  triggerStockout: (clinicId: string) => void;
  triggerStaffingShortage: (clinicId: string) => void;
  queueOfflineReport: (report: QueueOfflineReportInput) => void;
  submitFieldReport: (report: SubmitFieldReportInput) => void;
  syncOfflineReports: () => void;
  addDemoLead: (lead: DemoLeadInputWithId) => void;
  hydrateDemoLeads: (leads: DemoLead[]) => void;
  updateLeadStatus: (leadId: string, status: DemoLeadStatus) => void;
  setRole: (role: DemoRole) => void;
};

type DemoLeadInputWithId = AddDemoLeadInput & { id?: DemoLead["id"] };

type DemoAction =
  | { type: "reset"; state: DemoState }
  | { type: "refresh_backend_hydration"; state: DemoState }
  | { type: "trigger_stockout"; clinicId: string }
  | { type: "trigger_staffing_shortage"; clinicId: string }
  | { type: "queue_offline_report"; report: QueueOfflineReportInput }
  | { type: "submit_field_report"; report: SubmitFieldReportInput }
  | { type: "sync_offline_reports" }
  | { type: "add_demo_lead"; lead: DemoLeadInputWithId }
  | { type: "hydrate_demo_leads"; leads: DemoLead[] }
  | { type: "update_lead_status"; leadId: string; status: DemoLeadStatus }
  | { type: "set_role"; role: DemoRole }
  | { type: "hydrate"; leads: DemoLead[]; offlineQueue: DemoState["offlineQueue"] };

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

function buildLeadId() {
  return `lead-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneDemoState(state: DemoState): DemoState {
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

export function createDemoStoreInitialState(initialState?: DemoState): DemoState {
  return cloneDemoState(initialState ?? createInitialDemoState());
}

export function mergeDemoBackendHydrationState(
  currentState: DemoState,
  backendState: DemoState,
): DemoState {
  const nextBackendState = createDemoStoreInitialState(backendState);

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

function normalizeLeadId(lead: DemoLead) {
  return String(lead.id);
}

export function mergeDemoLeadHydrationState(
  currentState: DemoState,
  backendLeads: DemoLead[],
): DemoState {
  const backendIds = new Set(backendLeads.map(normalizeLeadId));
  return {
    ...currentState,
    leads: [
      ...backendLeads.map((lead) => ({ ...lead, id: normalizeLeadId(lead) })),
      ...currentState.leads.filter((lead) => !backendIds.has(normalizeLeadId(lead))),
    ],
  };
}

export function getDemoBackendHydrationSignature(state?: DemoState): string {
  const backendState = state ?? createInitialDemoState();

  return JSON.stringify({
    province: backendState.province,
    district: backendState.district,
    clinics: backendState.clinics,
    clinicStates: backendState.clinicStates,
    reports: backendState.reports,
    auditEvents: backendState.auditEvents,
  });
}

function createReducerState(initialState?: DemoState): DemoState {
  return createDemoStoreInitialState(initialState);
}

function demoReducer(state: DemoState, action: DemoAction): DemoState {
  const now = new Date().toISOString();

  switch (action.type) {
    case "reset":
      return createDemoStoreInitialState(action.state);
    case "refresh_backend_hydration":
      return mergeDemoBackendHydrationState(state, action.state);
    case "trigger_stockout":
      return triggerStockoutScenario(state, action.clinicId, now);
    case "trigger_staffing_shortage":
      return triggerStaffingShortageScenario(state, action.clinicId, now);
    case "queue_offline_report": {
      const queuedReport = createQueuedOfflineReport(action.report, now);

      // Phase 2 keeps offline field reports in a browser-local demo queue.
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
    case "submit_field_report":
      return submitFieldReportScenario(
        state,
        {
          ...action.report,
          offlineCreated: action.report.offlineCreated,
        },
        now,
      );
    case "add_demo_lead":
      const lead = {
        ...action.lead,
        id: action.lead.id ? String(action.lead.id) : buildLeadId(),
        createdAt: action.lead.createdAt ?? now,
        status: action.lead.status ?? "new",
      };

      return {
        ...state,
        leads: [
          lead,
          ...state.leads.filter((currentLead) => normalizeLeadId(currentLead) !== lead.id),
        ],
      };
    case "hydrate_demo_leads":
      return mergeDemoLeadHydrationState(state, action.leads);
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
        ...mergeDemoLeadHydrationState(state, action.leads),
        offlineQueue: [...action.offlineQueue],
      };
    default:
      return state;
  }
}

export function DemoStoreProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: DemoState;
}) {
  const hydrationSignature = getDemoBackendHydrationSignature(initialState);
  const [resetState, setResetState] = useState(() => createDemoStoreInitialState(initialState));
  const [state, dispatch] = useReducer(demoReducer, resetState, createReducerState);
  const hasHydrated = useRef(false);
  const lastHydrationSignature = useRef(hydrationSignature);

  useEffect(() => {
    if (lastHydrationSignature.current === hydrationSignature) {
      return;
    }

    lastHydrationSignature.current = hydrationSignature;
    const nextResetState = createDemoStoreInitialState(initialState);
    setResetState(nextResetState);
    dispatch({ type: "refresh_backend_hydration", state: nextResetState });
  }, [hydrationSignature, initialState]);

  useEffect(() => {
    if (hasHydrated.current) {
      return;
    }

    const storedLeads = loadStoredDemoLeads();
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
    saveStoredDemoLeads(state.leads);
  }, [state.leads]);

  useEffect(() => {
    saveStoredOfflineReports(state.offlineQueue);
  }, [state.offlineQueue]);

  const resetDemo = useCallback(() => {
    clearDemoStorage();
    dispatch({
      type: "reset",
      state: resetState,
    });
  }, [resetState]);
  const triggerStockout = useCallback(
    (clinicId: string) => dispatch({ type: "trigger_stockout", clinicId }),
    [],
  );
  const triggerStaffingShortage = useCallback(
    (clinicId: string) => dispatch({ type: "trigger_staffing_shortage", clinicId }),
    [],
  );
  const queueOfflineReport = useCallback(
    (report: QueueOfflineReportInput) => dispatch({ type: "queue_offline_report", report }),
    [],
  );
  const submitFieldReport = useCallback(
    (report: SubmitFieldReportInput) => dispatch({ type: "submit_field_report", report }),
    [],
  );
  const syncOfflineReports = useCallback(
    () => dispatch({ type: "sync_offline_reports" }),
    [],
  );
  const addDemoLead = useCallback(
    (lead: DemoLeadInputWithId) => dispatch({ type: "add_demo_lead", lead }),
    [],
  );
  const hydrateDemoLeads = useCallback(
    (leads: DemoLead[]) => dispatch({ type: "hydrate_demo_leads", leads }),
    [],
  );
  const updateLeadStatus = useCallback(
    (leadId: string, status: DemoLeadStatus) =>
      dispatch({ type: "update_lead_status", leadId, status }),
    [],
  );
  const setRole = useCallback(
    (role: DemoRole) => dispatch({ type: "set_role", role }),
    [],
  );

  const value = useMemo<DemoStoreValue>(
    () => ({
      state,
      resetDemo,
      triggerStockout,
      triggerStaffingShortage,
      queueOfflineReport,
      submitFieldReport,
      syncOfflineReports,
      addDemoLead,
      hydrateDemoLeads,
      updateLeadStatus,
      setRole,
    }),
    [
      addDemoLead,
      hydrateDemoLeads,
      queueOfflineReport,
      resetDemo,
      setRole,
      state,
      submitFieldReport,
      syncOfflineReports,
      triggerStaffingShortage,
      triggerStockout,
      updateLeadStatus,
    ],
  );

  return (
    <DemoStoreContext.Provider value={value}>
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore() {
  const context = useContext(DemoStoreContext);

  if (!context) {
    throw new Error("useDemoStore must be used within a DemoStoreProvider");
  }

  return context;
}
