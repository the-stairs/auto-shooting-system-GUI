import { useSyncExternalStore, useCallback } from "react";

// --- Types ---
export interface UnitState {
  label: string;
  key: string;
  currentValue: string;
  setValue: string;
  range: string;
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
      currentValue: "0000",
      setValue: "0000",
      range: "0~400mm",
    },
    CAM_LOWER: {
      label: "카메라 하부 위치",
      key: "CAM_LOWER",
      currentValue: "0000",
      setValue: "0000",
      range: "0~1800mm",
    },
    TABLE_HEIGHT: {
      label: "턴테이블 높이",
      key: "TABLE_HEIGHT",
      currentValue: "0000",
      setValue: "0000",
      range: "0~400mm",
    },
  },
  autoOrder: ["CAM_HEIGHT", "CAM_LOWER", "TABLE_HEIGHT"],
  fileName: null,
  systemStatus: "ready",
  logs: [],
};

// --- Store ---
let state = { ...initialState };
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

// --- Hooks ---
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useUnit(key: string) {
  const appState = useAppState();
  return appState.units[key];
}

export function useActions() {
  const connect = useCallback((port: string) => {
    setState({ connected: true, selectedPort: port, systemStatus: "ready" });
    addLog(`포트 ${port} 연결됨`);
  }, []);

  const disconnect = useCallback(() => {
    setState({ connected: false, selectedPort: "", systemStatus: "ready" });
    addLog("연결 해제됨");
  }, []);

  const refreshPorts = useCallback(async () => {
    try {
      const listSerialPorts = (
        window as unknown as {
          ipcRenderer: { listSerialPorts: () => Promise<{ path: string }[]> };
        }
      ).ipcRenderer?.listSerialPorts;
      if (!listSerialPorts) {
        addLog("포트 목록 API를 사용할 수 없습니다 (Electron 환경이 아님)");
        return;
      }
      const list = await listSerialPorts();
      const paths = list.map((p: { path: string }) => p.path);
      setState({ ports: paths });
      const current = getState();
      const stillExists =
        current.selectedPort && paths.includes(current.selectedPort);
      if (paths.length > 0 && !stillExists) {
        setState({ selectedPort: paths[0] });
      }
      addLog(`포트 목록 갱신됨 (${paths.length}개)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`포트 목록 조회 실패: ${msg}`);
      setState({ ports: [] });
    }
  }, []);

  const sendCommand = useCallback((cmd: string) => {
    const s = getState();
    if (!s.connected) {
      addLog("연결되지 않음 - 명령 무시됨");
      return;
    }
    addLog(`송신: ${cmd}`);
  }, []);

  const initUnit = useCallback((key: string) => {
    updateUnit(key, { currentValue: "0000" });
    const s = getState();
    const label = s.units[key]?.label ?? key;
    addLog(`${label} 초기화`);
    const s2 = getState();
    if (s2.connected) {
      addLog(`송신: INIT_${key}`);
    }
  }, []);

  const initAll = useCallback(() => {
    for (const key of Object.keys(getState().units)) {
      updateUnit(key, { currentValue: "0000" });
    }
    addLog("전체 초기화");
    const s = getState();
    if (s.connected) {
      addLog("송신: FULL_INIT");
    }
  }, []);

  const sendUnitValue = useCallback((key: string) => {
    const s = getState();
    const unit = s.units[key];
    if (!unit) return;
    if (!unit.setValue || unit.setValue.trim() === "") {
      addLog(`${unit.label} 값을 입력하세요`);
      return;
    }
    addLog(`송신: ${key}=${unit.setValue}`);
  }, []);

  const runAutoSequence = useCallback(() => {
    const s = getState();
    const [k1, k2, k3] = s.autoOrder;
    if (k1 === k2 || k2 === k3 || k1 === k3) {
      addLog("자동운전 순서에서 축을 중복 선택할 수 없습니다");
      return;
    }
    const v1 = s.units[k1]?.setValue ?? "0";
    const v2 = s.units[k2]?.setValue ?? "0";
    const v3 = s.units[k3]?.setValue ?? "0";
    const cmd = `AUTO=${k1}:${v1}/${k2}:${v2}/${k3}:${v3}`;
    setState({ systemStatus: "running" });
    addLog(`자동운전 시작: ${cmd}`);

    // Simulate running
    setTimeout(() => {
      const current = getState();
      if (current.systemStatus === "running") {
        updateUnit(k1, { currentValue: v1 });
        updateUnit(k2, { currentValue: v2 });
        updateUnit(k3, { currentValue: v3 });
        setState({ systemStatus: "ready" });
        addLog("자동운전 완료");
      }
    }, 3000);
  }, []);

  const emergencyStop = useCallback(() => {
    setState({ systemStatus: "stopped" });
    addLog("긴급 정지!");
  }, []);

  const setAutoOrder = useCallback((order: [string, string, string]) => {
    setState({ autoOrder: order });
  }, []);

  const saveSettings = useCallback(() => {
    const s = getState();
    const data: Record<string, string> = {};
    for (const [key, unit] of Object.entries(s.units)) {
      data[key] = unit.setValue;
    }
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visualvibe-settings.json";
    a.click();
    URL.revokeObjectURL(url);
    setState({ fileName: "visualvibe-settings.json" });
    addLog("설정 저장됨");
  }, []);

  const loadSettings = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Record<
          string,
          string
        >;
        for (const [key, value] of Object.entries(data)) {
          if (getState().units[key]) {
            updateUnit(key, { setValue: value });
          }
        }
        setState({ fileName: file.name });
        addLog(`설정 불러오기 완료: ${file.name}`);
      } catch {
        addLog("설정 파일 읽기 실패");
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    connect,
    disconnect,
    refreshPorts,
    sendCommand,
    initUnit,
    initAll,
    sendUnitValue,
    runAutoSequence,
    emergencyStop,
    setAutoOrder,
    saveSettings,
    loadSettings,
  };
}
