import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppState, useActions, setState } from "@/lib/store";
import {
  Play,
  RotateCcw,
  RefreshCw,
  Plug,
  Unplug,
  Download,
  Upload,
  FileText,
  LogOut,
} from "lucide-react";
import AlertModal from "./AlertModal";

const AUTO_ORDER_KEYS = ["CAM_HEIGHT", "CAM_LOWER", "TABLE_HEIGHT"] as const;

const DISPLAY_NAMES: Record<string, string> = {
  CAM_HEIGHT: "카메라 높이",
  CAM_LOWER: "카메라 하부",
  TABLE_HEIGHT: "턴테이블 높이",
};

export function TopBar() {
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const state = useAppState();
  const actions = useActions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAutoOrderClick = () => {
    const [k1, k2, k3] = state.autoOrder;
    if (k1 === k2 || k2 === k3 || k1 === k3) {
      alert("자동운전 순서에서 축을 중복 선택할 수 없습니다");
      return;
    }
    actions.runAutoSequence();
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      actions.loadSettings(file);
    }
    e.target.value = "";
  };

  const handleFullInitConfirm = () => {
    setShowAlertModal(false);
    actions.initAll();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3">
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleAutoOrderClick}
            disabled={!state.connected || state.systemStatus === "running"}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            자동운전
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowAlertModal(true)}
            disabled={!state.connected}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            전체초기화
          </Button>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Auto Order */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">자동순서:</span>
          {[0, 1, 2].map((i) => (
            <Select
              key={i}
              value={state.autoOrder[i]}
              onValueChange={(val) => {
                const newOrder = [...state.autoOrder] as [
                  string,
                  string,
                  string
                ];
                newOrder[i] = val;
                actions.setAutoOrder(newOrder);
              }}
            >
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTO_ORDER_KEYS.map((k) => (
                  <SelectItem key={k} value={k} className="text-xs">
                    {DISPLAY_NAMES[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Port Connection */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Port:</span>
          <Select
            value={state.selectedPort}
            onValueChange={(val) => setState({ selectedPort: val })}
            disabled={state.connected}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="포트 선택" />
            </SelectTrigger>
            <SelectContent>
              {state.ports.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={actions.refreshPorts}
            disabled={state.connected}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="sr-only">포트 갱신</span>
          </Button>
          {state.connected ? (
            <Button
              size="sm"
              variant="outline"
              onClick={actions.disconnect}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
            >
              <Unplug className="mr-1.5 h-3.5 w-3.5" />
              해제
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                if (state.selectedPort) {
                  actions.connect(state.selectedPort);
                }
              }}
              disabled={!state.selectedPort}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <Plug className="mr-1.5 h-3.5 w-3.5" />
              연결
            </Button>
          )}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* File Operations */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">프리셋:</span>
          <Button size="sm" variant="ghost" onClick={handleLoadClick}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            불러오기
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button size="sm" variant="ghost" onClick={actions.saveSettings}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            내보내기
          </Button>
          {state.fileName && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <FileText className="h-3 w-3" />
              {state.fileName}
            </span>
          )}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        <Button
          className="ml-auto"
          size="sm"
          variant="destructive"
          onClick={actions.quitApp}
          disabled={
            state.exitPending ||
            !state.connected ||
            state.systemStatus === "running"
          }
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />현 위치 저장 후 종료
        </Button>
      </div>
      {showAlertModal && (
        <AlertModal
          title="전체 초기화 안내"
          message="확인을 누르면 모든 축이 동시에 영점으로 이동합니다.\n주변 장애물이 없는지 확인하셨나요?"
          setIsOpen={setShowAlertModal}
          handleConfirm={handleFullInitConfirm}
        />
      )}
    </>
  );
}
