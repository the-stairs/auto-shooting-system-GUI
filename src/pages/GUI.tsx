import { useEffect, useState } from "react";
import { TopBar } from "../components/Topbar";
import { UnitPanel } from "../components/UnitPanel";
import { StatusPanel } from "../components/StatusPanel";
import { getState, initSerialListener, useActions } from "../lib/store";
import { Header } from "@/components/Header";
import AlertModal from "@/components/AlertModal";

const UNIT_KEYS = [
  { key: "CAM_HEIGHT", index: 1 },
  { key: "CAM_LOWER", index: 2 },
  { key: "TABLE_HEIGHT", index: 3 },
];

export default function GUI() {
  const actions = useActions();
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);

  useEffect(() => {
    const cleanup = initSerialListener();
    return cleanup;
  }, []);

  // 창 X 버튼 클릭 시: 종료 안내 모달 표시, 확인 시 quitApp() 진행
  useEffect(() => {
    const ipc = window?.ipcRenderer;
    if (!ipc?.on) return;
    const handler = () => {
      if (getState().exitPending) return;
      if (!getState().connected) {
        actions.quitApp();
        return;
      }
      setShowAlertModal(true);
    };
    ipc.on("window-close-requested", handler);
    return () => void ipc.off?.("window-close-requested", handler);
  }, [actions.quitApp]);

  const handleSaveAndQuitConfirm = () => {
    setShowAlertModal(false);
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

      {/* Footer 안내문구 */}
      <footer className="border-t border-border bg-card px-5 py-2">
        <p className="text-center text-md text-muted-foreground font-bold">
          * 포트 연결 해제 시 현재 위치가 저장되지 않습니다.
        </p>
      </footer>

      {/* 창 닫기 시: 영점 이동 후 종료 안내 모달 */}
      {showAlertModal && (
        <AlertModal
          title="프로그램 종료 안내"
          message={
            "프로그램을 종료하시겠습니까?\n확인을 누르면 현재 위치를 저장 후 종료합니다."
          }
          setIsOpen={setShowAlertModal}
          handleConfirm={handleSaveAndQuitConfirm}
        />
      )}
    </div>
  );
}
