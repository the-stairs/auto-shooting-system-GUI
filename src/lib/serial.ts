import {
  addLog,
  getState,
  setState,
  updateUnit,
  setAxisStatus,
  resetAllAxisStatus,
} from "./state";

function getIpc(): Window["ipcRenderer"] {
  return window.ipcRenderer;
}

export async function ipcConnectSerial(path: string) {
  const ipc = getIpc();
  if (!ipc?.connectSerial) {
    throw new Error(
      "시리얼 연결 API를 사용할 수 없습니다 (Electron 환경이 아님)"
    );
  }
  const result = await ipc.connectSerial(path);
  if (!result.ok) {
    throw new Error(result.error ?? "알 수 없음");
  }
}

export async function ipcDisconnectSerial() {
  const ipc = getIpc();
  if (!ipc?.disconnectSerial) {
    // 이미 끊어진 상태이거나 Electron 환경이 아님
    return;
  }
  const result = await ipc.disconnectSerial();
  if (!result.ok) {
    throw new Error(result.error ?? "알 수 없음");
  }
}

export async function ipcListSerialPorts(): Promise<{ path: string }[]> {
  const ipc = getIpc();
  if (!ipc?.listSerialPorts) {
    throw new Error(
      "포트 목록 API를 사용할 수 없습니다 (Electron 환경이 아님)"
    );
  }
  const list = await ipc.listSerialPorts();
  return list;
}

export async function ipcWriteSerial(data: string) {
  const ipc = getIpc();
  if (!ipc?.writeSerial) {
    throw new Error(
      "시리얼 전송 API를 사용할 수 없습니다 (Electron 환경이 아님)"
    );
  }
  const res = await ipc.writeSerial(data);
  if (!res.ok) {
    throw new Error(res.error ?? "알 수 없음");
  }
}

// --- Serial line parsing ---

const SERIAL_VALUE_REG = /^(CAM_HEIGHT|CAM_LOWER|TABLE_HEIGHT)=([\d.-]+)/;
const SERIAL_DONE_REG = /^DONE\s+(CAM_HEIGHT|CAM_LOWER|TABLE_HEIGHT)=([\d.-]+)/;
const SERIAL_DONE_ALL_REG = /^DONE_ALL\b(.*)?$/;
const SERIAL_DONE_STOP = /^DONE_STOP\b(.*)?$/;
const SERIAL_QUIT_REG = /^QUIT\b(.*)?$/;

function handleDoneStopLine(trimmed: string): boolean {
  if (!SERIAL_DONE_STOP.test(trimmed)) {
    return false;
  }
  resetAllAxisStatus("idle");
  setState({ systemStatus: "ready" });
  addLog(`긴급 정지 완료: ${trimmed}`);
  return true;
}

/** 종료 신호: QUIT */
function handleQuitLine(trimmed: string): boolean {
  if (!SERIAL_QUIT_REG.test(trimmed)) {
    return false;
  }
  const state = getState();
  if (state.exitPending) {
    addLog(`종료 신호 수신: ${trimmed}`);
    getIpc()?.send?.("app:quit");
  } else {
    addLog(`QUIT 수신됐지만 exitPending 아님: ${trimmed}`);
  }
  return true;
}

/** 단일 축 완료: DONE CAM_HEIGHT=123.4 */
function handleDoneLine(trimmed: string): boolean {
  const doneMatch = trimmed.match(SERIAL_DONE_REG);
  if (!doneMatch) {
    return false;
  }
  const [, key, value] = doneMatch;
  const num = parseFloat(value);
  if (!Number.isNaN(num) && getState().units[key]) {
    updateUnit(key, { currentValue: num });
  }
  setAxisStatus(key, "done");
  const units = getState().units;
  const anyMoving = Object.values(units).some((u) => u.status === "moving");
  if (!anyMoving) {
    const current = getState();
    if (current.systemStatus !== "stopped") {
      setState({ systemStatus: "ready" });
    }
    addLog("모든 축 완료");
  } else {
    addLog(`축 이동 완료: ${trimmed}`);
  }
  return true;
}

/** 자동 운전 전체 완료: DONE_ALL ... */
function handleDoneAllLine(trimmed: string): boolean {
  if (!SERIAL_DONE_ALL_REG.test(trimmed)) {
    return false;
  }
  resetAllAxisStatus("done");
  const current = getState();
  if (current.systemStatus !== "stopped") {
    setState({ systemStatus: "ready" });
  }
  addLog(`전체 이동 완료: ${trimmed}`);
  return true;
}

/** 실시간 위치 값: CAM_HEIGHT=..., CAM_LOWER=..., TABLE_HEIGHT=... */
function handleValueLine(trimmed: string): boolean {
  const valueMatch = trimmed.match(SERIAL_VALUE_REG);
  if (!valueMatch) {
    return false;
  }
  const [, key, value] = valueMatch;
  const num = parseFloat(value);
  if (Number.isNaN(num)) {
    return false;
  }
  if (getState().units[key]) {
    updateUnit(key, { currentValue: num });
  }
  return true;
}

function handleSerialLine(line: string) {
  const trimmed = line.trim();
  if (handleQuitLine(trimmed)) return;
  if (handleDoneStopLine(trimmed)) return; // DONE_STOP을 DONE보다 먼저 처리
  if (handleDoneLine(trimmed)) return;
  if (handleDoneAllLine(trimmed)) return;
  handleValueLine(trimmed);
}

/**
 * 시리얼 수신 라인 구독. 앱 마운트 시 한 번 호출하고 반환된 cleanup을 unmount 시 호출.
 */
export function initSerialListener(): () => void {
  const ipc = getIpc();
  if (!ipc?.on) return () => {};
  const handler = (_: unknown, line: string) => handleSerialLine(line.trim());
  ipc.on("serial:data", handler);
  return () => {
    ipc?.off?.("serial:data", handler);
  };
}
