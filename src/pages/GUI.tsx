import { useEffect, useState } from "react";
import { TopBar } from "../components/Topbar";
import { UnitPanel } from "../components/UnitPannel";
import { StatusPanel } from "../components/StatusPannel";
import { getState, initSerialListener, useActions } from "../lib/store";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";

const UNIT_KEYS = [
  { key: "CAM_HEIGHT", index: 1 },
  { key: "CAM_LOWER", index: 2 },
  { key: "TABLE_HEIGHT", index: 3 },
];

export default function GUI() {
  const actions = useActions();
  const [showQuitModal, setShowQuitModal] = useState(false);

  useEffect(() => {
    const cleanup = initSerialListener();
    return cleanup;
  }, []);

  // 창 X 버튼 클릭 시: 연결됐으면 영점 이동 후 종료 안내 모달 표시, 확인 시 quitApp() 진행
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
      if (!getState().connected) {
        actions.quitApp();
        return;
      }
      setShowQuitModal(true);
    };
    ipc.on("window-close-requested", handler);
    return () => ipc.off?.("window-close-requested", handler);
  }, [actions.quitApp]);

  const handleQuitConfirm = () => {
    setShowQuitModal(false);
    actions.quitApp();
  };

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

      {/* 창 닫기 시: 영점 이동 후 종료 안내 모달 */}
      {showQuitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg">
            <p className="mb-5 text-sm text-foreground">
              영점으로 이동한 후 앱이 종료됩니다.
              <br />
              확인을 누르면 종료 절차를 진행합니다. 주변의 방해물이 없는지
              확인해주세요.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowQuitModal(false)}>
                취소
              </Button>
              <Button onClick={handleQuitConfirm}>확인</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
