import { ipcMain } from "electron";
import { SerialPort } from "serialport";

type SerialPortInfo = {
  path: string;
  manufacturer: string;
  serialNumber: string;
};

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
