// --- Types ---
export type AxisStatus = "idle" | "moving" | "done" | "error";

export interface UnitState {
  label: string;
  key: string;
  currentValue: number;
  setValue: number;
  min: number;
  max: number;
  status: AxisStatus;
}

export interface AppState {
  connected: boolean;
  selectedPort: string;
  ports: string[];
  units: Record<string, UnitState>;
  autoOrder: [string, string, string];
  fileName: string | null;
  systemStatus: "ready" | "running" | "stopped" | "error";
  logs: string[];
  exitPending?: boolean;
}

// --- Initial state ---
const initialState: AppState = {
  connected: false,
  selectedPort: "",
  ports: [],
  units: {
    CAM_HEIGHT: {
      label: "카메라 높이",
      key: "CAM_HEIGHT",
      currentValue: 0,
      setValue: 0,
      min: 0,
      max: 400,
      status: "idle",
    },
    CAM_LOWER: {
      label: "카메라 하부 위치",
      key: "CAM_LOWER",
      currentValue: 0,
      setValue: 0,
      min: 0,
      max: 1800,
      status: "idle",
    },
    TABLE_HEIGHT: {
      label: "턴테이블 높이",
      key: "TABLE_HEIGHT",
      currentValue: 0,
      setValue: 0,
      min: 0,
      max: 400,
      status: "idle",
    },
  },
  autoOrder: ["CAM_HEIGHT", "CAM_LOWER", "TABLE_HEIGHT"],
  fileName: null,
  systemStatus: "ready",
  logs: [],
  exitPending: false,
};

// --- Store core ---
let state: AppState = { ...initialState };
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function getState(): AppState {
  return state;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setState(partial: Partial<AppState>) {
  state = { ...state, ...partial };
  emitChange();
}

export function updateUnit(key: string, updates: Partial<UnitState>) {
  state = {
    ...state,
    units: {
      ...state.units,
      [key]: { ...state.units[key], ...updates },
    },
  };
  emitChange();
}

export function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  state = {
    ...state,
    logs: [`[${timestamp}] ${message}`, ...state.logs].slice(0, 100),
  };
  emitChange();
}

export function setAxisStatus(key: string, status: AxisStatus) {
  const unit = state.units[key];
  if (!unit) return;
  state = {
    ...state,
    units: {
      ...state.units,
      [key]: { ...unit, status },
    },
  };
  emitChange();
}

export function resetAllAxisStatus(status: AxisStatus = "idle") {
  const nextUnits: Record<string, UnitState> = {};
  for (const [key, unit] of Object.entries(state.units)) {
    nextUnits[key] = { ...unit, status };
  }
  state = {
    ...state,
    units: nextUnits,
  };
  emitChange();
}


