import { useEffect, useState } from "react";
import { TopBar } from "../components/Topbar";
import { UnitPanel } from "../components/UnitPanel";
import { StatusPanel } from "../components/StatusPanel";
import { getState, initSerialListener, useActions } from "../lib/store";
import { Header } from "@/components/Header";
import QuitModal from "@/components/QuitModal";

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
    const ipc = window?.ipcRenderer;
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
    return () => void ipc.off?.("window-close-requested", handler);
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
        <QuitModal
          setShowQuitModal={setShowQuitModal}
          handleQuitConfirm={handleQuitConfirm}
        />
      )}
    </div>
  );
}
