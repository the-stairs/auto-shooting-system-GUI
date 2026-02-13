import { useEffect } from "react";
import { TopBar } from "../components/Topbar";
import { UnitPanel } from "../components/UnitPannel";
import { StatusPanel } from "../components/StatusPannel";
import { getState, initSerialListener, useActions } from "../lib/store";
import { Header } from "@/components/Header";

const UNIT_KEYS = [
  { key: "CAM_HEIGHT", index: 1 },
  { key: "CAM_LOWER", index: 2 },
  { key: "TABLE_HEIGHT", index: 3 },
];

export default function GUI() {
  const actions = useActions();

  useEffect(() => {
    const cleanup = initSerialListener();
    return cleanup;
  }, []);

  // 창 X 버튼 클릭 시 메인에서 오는 종료 요청 → quitApp() 실행 (QUIT_HOME 전송 후 QUIT 수신 시 앱 종료)
  // exitPending이면 이미 종료 처리 중이므로 중복 호출 방지(리스트너가 여러 개여도 로그 1회만)
  useEffect(() => {
    const ipc = (
      window as unknown as {
        ipcRenderer?: {
          on: (ch: string, fn: () => void) => void;
          off: (ch: string, fn: () => void) => void;
        };
      }
    ).ipcRenderer;
    if (!ipc?.on) return;
    const handler = () => {
      if (getState().exitPending) return;
      actions.quitApp();
    };
    ipc.on("window-close-requested", handler);
    return () => ipc.off?.("window-close-requested", handler);
  }, [actions.quitApp]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <Header />

      {/* Top Bar Controls */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-5">
        <div className="grid h-full grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Unit Panels */}
          {UNIT_KEYS.map(({ key, index }) => (
            <UnitPanel key={key} unitKey={key} index={index} />
          ))}

          {/* System Status */}
          <StatusPanel />
        </div>
      </main>
    </div>
  );
}
