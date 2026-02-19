/// <reference types="vite/client" />

interface SerialPortInfo {
  path: string;
  manufacturer: string;
  serialNumber: string;
}

interface Window {
  ipcRenderer?: import("electron").IpcRenderer & {
    listSerialPorts: () => Promise<SerialPortInfo[]>;
    connectSerial: (path: string) => Promise<{ ok: boolean; error?: string }>;
    disconnectSerial: () => Promise<{ ok: boolean; error?: string }>;
    writeSerial: (data: string) => Promise<{ ok: boolean; error?: string }>;
  };
}
