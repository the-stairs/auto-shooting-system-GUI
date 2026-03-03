import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

type AlertModalProps = {
  title: string;
  message: string;
  setIsOpen: (show: boolean) => void;
  handleConfirm: () => void;
};

export default function AlertModal({
  title,
  message,
  setIsOpen,
  handleConfirm,
}: AlertModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-destructive">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          {title}
        </h3>
        <p className="my-5 text-balance text-sm text-muted-foreground">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            취소
          </Button>
          <Button onClick={handleConfirm}>확인</Button>
        </div>
      </div>
    </div>
  );
}
