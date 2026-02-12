import { useCallback, useSyncExternalStore } from "react";
import {
  AppState,
  getState,
  subscribe,
  setState,
  updateUnit,
  addLog,
  setAxisStatus,
  resetAllAxisStatus,
} from "./state";
import {
  ipcConnectSerial,
  ipcDisconnectSerial,
  ipcListSerialPorts,
  ipcWriteSerial,
} from "./serial";

// --- Hooks ---

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useUnit(key: string) {
  const appState = useAppState();
  return appState.units[key];
}

export function useActions() {
  const connect = useCallback(async (port: string) => {
    try {
      await ipcConnectSerial(port);
      setState({ connected: true, selectedPort: port, systemStatus: "ready" });
      addLog(`포트 ${port} 연결됨`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`연결 실패: ${msg}`);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await ipcDisconnectSerial();
      setState({ connected: false, selectedPort: "", systemStatus: "ready" });
      addLog("연결 해제됨");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`연결 해제 실패: ${msg}`);
    }
  }, []);

  const refreshPorts = useCallback(async () => {
    try {
      const list = await ipcListSerialPorts();
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

  const sendCommand = useCallback(async (cmd: string) => {
    const s = getState();
    if (!s.connected) {
      addLog("연결되지 않음 - 명령 무시됨");
      return;
    }
    addLog(`송신: ${cmd}`);
    try {
      await ipcWriteSerial(cmd);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`전송 실패: ${msg}`);
    }
  }, []);

  const initUnit = useCallback(async (key: string) => {
    setAxisStatus(key, "moving");
    const s = getState();
    const label = s.units[key]?.label ?? key;
    addLog(`${label} 초기화`);
    if (s.connected) {
      const cmd = `INIT_${key}`;
      addLog(`송신: ${cmd}`);
      try {
        await ipcWriteSerial(cmd);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        addLog(`전송 실패: ${msg}`);
      }
    }
  }, []);

  const initAll = useCallback(async () => {
    resetAllAxisStatus("moving");
    addLog("전체 초기화");
    const s = getState();
    if (s.connected) {
      const cmd = "FULL_INIT";
      addLog(`송신: ${cmd}`);
      try {
        await ipcWriteSerial(cmd);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        addLog(`전송 실패: ${msg}`);
      }
    }
  }, []);

  const sendUnitValue = useCallback(async (key: string) => {
    const s = getState();
    const unit = s.units[key];
    if (!unit) return;
    if (!unit.setValue && unit.setValue !== 0) {
      addLog(`${unit.label} 값을 입력하세요`);
      return;
    }
    const cmd = `${key}=${unit.setValue}`;
    setAxisStatus(key, "moving");
    setState({ systemStatus: "running" });
    addLog(`송신: ${cmd}`);
    try {
      await ipcWriteSerial(cmd);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`전송 실패: ${msg}`);
    }
  }, []);

  const runAutoSequence = useCallback(async () => {
    const s = getState();
    const [k1, k2, k3] = s.autoOrder;
    if (k1 === k2 || k2 === k3 || k1 === k3) {
      addLog("자동운전 순서에서 축을 중복 선택할 수 없습니다");
      return;
    }
    const v1 = s.units[k1]?.setValue ?? 0;
    const v2 = s.units[k2]?.setValue ?? 0;
    const v3 = s.units[k3]?.setValue ?? 0;
    const cmd = `AUTO=${k1}:${v1}/${k2}:${v2}/${k3}:${v3}`;

    resetAllAxisStatus("idle");
    setAxisStatus(k1, "moving");
    setAxisStatus(k2, "moving");
    setAxisStatus(k3, "moving");

    setState({ systemStatus: "running" });
    addLog(`자동운전 시작: ${cmd}`);

    try {
      await ipcWriteSerial(cmd);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`전송 실패: ${msg}`);
    }
  }, []);

  const emergencyStop = useCallback(async () => {
    try {
      await ipcWriteSerial("STOP");
      resetAllAxisStatus("idle");
      setState({ systemStatus: "stopped" });
      addLog("긴급 정지!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`STOP 전송 실패: ${msg}`);
    }
  }, []);

  const quitApp = useCallback(async () => {
    const s = getState();
    // 연결 안 되어 있으면 바로 창 닫기
    if (!s.connected) {
      window.close();
      return;
    }
    // 이미 종료 대기 중이면 중복 요청 방지
    if (s.exitPending) {
      addLog("종료 대기 중입니다. 잠시만 기다려 주세요.");
      return;
    }
    try {
      setState({ exitPending: true });
      addLog("종료 요청: QUIT_HOME 전송");
      await ipcWriteSerial("QUIT_HOME");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`QUIT_HOME 전송 실패: ${msg}`);
      setState({ exitPending: false });
    }
  }, []);

  const resetBoard = useCallback(async () => {
    const s = getState();
    if (!s.connected) {
      addLog("연결되지 않음 - RESET 명령 무시됨");
      return;
    }
    try {
      await ipcWriteSerial("RESET");
      resetAllAxisStatus("idle");
      setState({ systemStatus: "ready" });
      addLog("보드 리셋 명령 전송");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`RESET 전송 실패: ${msg}`);
    }
  }, []);

  const setAutoOrder = useCallback((order: [string, string, string]) => {
    setState({ autoOrder: order });
  }, []);

  const saveSettings = useCallback(() => {
    const s = getState();
    const data: Record<string, string> = {};
    for (const [key, unit] of Object.entries(s.units)) {
      data[key] = unit.setValue.toString();
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
            updateUnit(key, { setValue: Number(value) });
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
    quitApp,
    resetBoard,
    setAutoOrder,
    saveSettings,
    loadSettings,
  };
}
