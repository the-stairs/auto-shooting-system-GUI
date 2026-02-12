import { addLog, getState, setState, updateUnit } from "./state";

// --- IPC Helpers ---

type IpcLike = {
  connectSerial?: (path: string) => Promise<{ ok: boolean; error?: string }>;
  disconnectSerial?: () => Promise<{ ok: boolean; error?: string }>;
  listSerialPorts?: () => Promise<{ path: string }[]>;
  writeSerial?: (data: string) => Promise<{ ok: boolean; error?: string }>;
  on?: (channel: string, listener: (event: unknown, data: string) => void) => void;
  off?: (channel: string, listener: (event: unknown, data: string) => void) => void;
};

function getIpc(): IpcLike | undefined {
  return (window as unknown as { ipcRenderer?: IpcLike }).ipcRenderer;
}

export async function ipcConnectSerial(path: string) {
  const ipc = getIpc();
  if (!ipc?.connectSerial) {
    throw new Error("시리얼 연결 API를 사용할 수 없습니다 (Electron 환경이 아님)");
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
    throw new Error("포트 목록 API를 사용할 수 없습니다 (Electron 환경이 아님)");
  }
  const list = await ipc.listSerialPorts();
  return list;
}

export async function ipcWriteSerial(data: string) {
  const ipc = getIpc();
  if (!ipc?.writeSerial) {
    throw new Error("시리얼 전송 API를 사용할 수 없습니다 (Electron 환경이 아님)");
  }
  const res = await ipc.writeSerial(data);
  if (!res.ok) {
    throw new Error(res.error ?? "알 수 없음");
  }
}

// --- Serial line parsing ---

const SERIAL_VALUE_REG = /^(CAM_HEIGHT|CAM_LOWER|TABLE_HEIGHT)=([\d.-]+)/;
const SERIAL_DONE_REG = /^DONE\s+(CAM_HEIGHT|CAM_LOWER|TABLE_HEIGHT)=([\d.-]+)/;
const SERIAL_AUTO_DONE_REG = /^AUTO_DONE\b(.*)?$/;

function handleSerialLine(line: string) {
  const trimmed = line.trim();

  // 단일 축 완료: DONE CAM_HEIGHT=123.4
  const doneMatch = trimmed.match(SERIAL_DONE_REG);
  if (doneMatch) {
    const [, key, value] = doneMatch;
    const num = parseFloat(value);
    if (!Number.isNaN(num) && getState().units[key]) {
      updateUnit(key, { currentValue: num });
    }
    setState({ systemStatus: "ready" });
    addLog(`축 완료: ${trimmed}`);
    return;
  }

  // 자동 운전 전체 완료: AUTO_DONE ...
  if (SERIAL_AUTO_DONE_REG.test(trimmed)) {
    setState({ systemStatus: "ready" });
    addLog(`자동운전 완료: ${trimmed}`);
    return;
  }

  // 실시간 위치 값: CAM_HEIGHT=..., CAM_LOWER=..., TABLE_HEIGHT=...
  const valueMatch = trimmed.match(SERIAL_VALUE_REG);
  if (!valueMatch) return;
  const [, key, value] = valueMatch;
  const num = parseFloat(value);
  if (Number.isNaN(num)) return;
  if (getState().units[key]) {
    updateUnit(key, { currentValue: num });
  }
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

