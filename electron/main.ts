import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { autoUpdater } from "electron-updater";

import "./ipc/serial.ipc";

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;
let isQuitting = false;

function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
  });

  // 창 닫기(X) 클릭 시: 먼저 QUIT_HOME 전송 후 QUIT 수신 시에만 종료
  win.on("close", (e) => {
    if (isQuitting) return;
    e.preventDefault();
    win?.webContents.send("window-close-requested");
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();
});

function setupAutoUpdater() {
  // 개발 중이거나 패키징되지 않은 경우 업데이트 검사 생략
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    win?.webContents.send("update:available", info.version);
  });
  autoUpdater.on("update-not-available", () => {
    win?.webContents.send("update:not-available");
  });
  autoUpdater.on("update-downloaded", () => {
    win?.webContents.send("update:downloaded");
  });
  autoUpdater.on("error", (err) => {
    win?.webContents.send("update:error", err.message);
  });
}

ipcMain.on("app:quit", () => {
  isQuitting = true;
  app.quit();
});

ipcMain.handle("update:check", () => {
  if (!app.isPackaged) return Promise.resolve();
  return autoUpdater.checkForUpdates()
    .then((r) => r?.updateInfo?.version ?? null)
    .catch(() => null);
});

ipcMain.on("app:quit-and-install", () => {
  isQuitting = true;
  autoUpdater.quitAndInstall(false, true);
});
