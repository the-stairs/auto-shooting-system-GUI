// --- Types ---
export interface UnitState {
  label: string;
  key: string;
  currentValue: number;
  setValue: number;
  min: number;
  max: number;
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
    },
    CAM_LOWER: {
      label: "카메라 하부 위치",
      key: "CAM_LOWER",
      currentValue: 0,
      setValue: 0,
      min: 0,
      max: 1800,
    },
    TABLE_HEIGHT: {
      label: "턴테이블 높이",
      key: "TABLE_HEIGHT",
      currentValue: 0,
      setValue: 0,
      min: 0,
      max: 400,
    },
  },
  autoOrder: ["CAM_HEIGHT", "CAM_LOWER", "TABLE_HEIGHT"],
  fileName: null,
  systemStatus: "ready",
  logs: [],
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

