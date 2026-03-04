import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type UpdateStatus = "idle" | "checking" | "available" | "downloaded" | "error";

export function Header() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const ipc = window.ipcRenderer;
    if (!ipc?.on) return;
    const onAvailable = (_: unknown, version: string) => {
      setUpdateVersion(version);
      setUpdateStatus("available");
    };
    const onDownloaded = () => setUpdateStatus("downloaded");
    const onError = (_: unknown, message: string) => {
      setUpdateError(message);
      setUpdateStatus("error");
    };
    const onNotAvailable = () => setUpdateStatus("idle");
    ipc.on("update:available", onAvailable);
    ipc.on("update:not-available", onNotAvailable);
    ipc.on("update:downloaded", onDownloaded);
    ipc.on("update:error", onError);
    return () => {
      ipc.off?.("update:available", onAvailable);
      ipc.off?.("update:not-available", onNotAvailable);
      ipc.off?.("update:downloaded", onDownloaded);
      ipc.off?.("update:error", onError);
    };
  }, []);

  const handleCheckUpdate = async () => {
    if (!window.ipcRenderer?.invoke) return;
    setUpdateError(null);
    setUpdateStatus("checking");
    await window.ipcRenderer.invoke("update:check");
  };

  const handleQuitAndInstall = () => {
    window.ipcRenderer?.send("app:quit-and-install");
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="font-mono text-sm font-bold text-primary-foreground">
              V
            </span>
          </div>
          <h1 className="text-sm font-bold tracking-tight text-foreground">
            VisualVibe
          </h1>
        </div>
        <span className="text-xs text-muted-foreground">for POC</span>
      </div>

      <div className="flex items-center gap-2">
        {updateStatus === "downloaded" && (
          <div className="flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5">
            <span className="text-xs font-medium text-foreground">
              설치할 준비가 되었습니다.
            </span>
            <Button size="sm" variant="outline" onClick={handleQuitAndInstall}>
              재시작
            </Button>
          </div>
        )}
        {(updateStatus === "available" || updateStatus === "checking") && (
          <span className="text-xs text-muted-foreground">
            {updateStatus === "checking"
              ? "확인 중..."
              : `새 버전 ${updateVersion ?? ""} 다운로드 중...`}
          </span>
        )}
        {updateStatus === "error" && updateError && (
          <span className="text-xs text-destructive">{updateError}</span>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1 text-xs"
          onClick={handleCheckUpdate}
          disabled={updateStatus === "checking"}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${updateStatus === "checking" ? "animate-spin" : ""}`}
          />
          업데이트 확인
        </Button>
      </div>
    </header>
  );
}
