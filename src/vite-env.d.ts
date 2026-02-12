/// <reference types="vite/client" />

interface SerialPortInfo {
  path: string;
  manufacturer: string;
  serialNumber: string;
}

interface Window {
  ipcRenderer: import("electron").IpcRenderer & {
    listSerialPorts: () => Promise<SerialPortInfo[]>;
  };
}
