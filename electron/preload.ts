import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
  listSerialPorts: () => ipcRenderer.invoke("serial:list-ports"),
  connectSerial: (path: string) =>
    ipcRenderer.invoke("serial:connect", path) as Promise<{
      ok: boolean;
      error?: string;
    }>,
  disconnectSerial: () =>
    ipcRenderer.invoke("serial:disconnect") as Promise<{ ok: boolean }>,
  writeSerial: (data: string) =>
    ipcRenderer.invoke("serial:write", data) as Promise<{
      ok: boolean;
      error?: string;
    }>,
});
