import { ipcMain } from "electron";
import { SerialPort } from "serialport";

const DEFAULT_BAUD = 9600;

let activePort: SerialPort | null = null;

type SerialPortInfo = {
  path: string;
  manufacturer: string;
  serialNumber: string;
};

/**
 * @description 시리얼 포트 목록 조회
 */
ipcMain.handle("serial:list-ports", async () => {
  const ports = await SerialPort.list();

  return ports.map(
    (p): SerialPortInfo => ({
      path: p.path,
      manufacturer: p.manufacturer ?? "",
      serialNumber: p.serialNumber ?? "",
    })
  );
});

/**
 * @description 시리얼 포트 연결
 * @param path 연결할 시리얼 포트 경로
 */
ipcMain.handle("serial:connect", async (_event, path: string) => {
  if (activePort?.isOpen) {
    return { ok: false, error: "이미 연결되어 있습니다." };
  }
  try {
    activePort = new SerialPort({
      path,
      baudRate: DEFAULT_BAUD,
      autoOpen: false, // 생성 시 자동 open 비활성화
    });
    await new Promise<void>((resolve, reject) => {
      activePort!.open((err) => (err ? reject(err) : resolve()));
    });
    return { ok: true };
  } catch (err) {
    activePort = null;
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
});

/**
 * @description 시리얼 포트 연결 해제
 */
ipcMain.handle("serial:disconnect", async () => {
  if (!activePort) return { ok: true };
  try {
    await new Promise<void>((resolve, reject) => {
      activePort!.close((err) => (err ? reject(err) : resolve()));
    });
    activePort = null;
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
});

/**
 * @description 시리얼 포트 쓰기
 * @param data 쓸 데이터
 */
ipcMain.handle("serial:write", async (_event, data: string) => {
  if (!activePort?.isOpen) {
    return { ok: false, error: "연결되지 않음" };
  }
  return new Promise<{ ok: boolean; error?: string }>((resolve) => {
    const line = data.includes("\n") ? data : `${data}\r\n`;
    activePort!.write(line, (err) => {
      if (err) {
        resolve({ ok: false, error: err.message });
      } else {
        resolve({ ok: true });
      }
    });
  });
});
