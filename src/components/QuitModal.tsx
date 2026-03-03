import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

type QuitModalProps = {
  setShowQuitModal: (show: boolean) => void;
  handleQuitConfirm: () => void;
};

export default function QuitModal({
  setShowQuitModal,
  handleQuitConfirm,
}: QuitModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-destructive">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          프로그램 종료 안내
        </h3>
        <p className="my-5 text-balance text-sm text-muted-foreground">
          확인을 누르면 현재 위치를 저장 후 종료합니다.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowQuitModal(false)}>
            취소
          </Button>
          <Button onClick={handleQuitConfirm}>확인</Button>
        </div>
      </div>
    </div>
  );
}
