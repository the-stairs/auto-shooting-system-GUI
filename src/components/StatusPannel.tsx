import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppState } from "@/lib/store";
import {
  Activity,
  Wifi,
  WifiOff,
  CircleCheck,
  CircleAlert,
  CirclePause,
  Loader2,
} from "lucide-react";

export function StatusPanel() {
  const state = useAppState();

  const statusConfig = {
    ready: {
      label: "System Ready",
      color: "text-success",
      bgColor: "bg-success/10",
      icon: CircleCheck,
    },
    running: {
      label: "Running...",
      color: "text-primary",
      bgColor: "bg-primary/10",
      icon: Loader2,
    },
    stopped: {
      label: "Emergency Stop",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      icon: CircleAlert,
    },
    error: {
      label: "Error",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      icon: CircleAlert,
    },
  };

  const config = statusConfig[state.systemStatus];
  const StatusIcon = config.icon;

  return (
    <Card className="flex h-full flex-col border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Activity className="h-4 w-4 text-primary" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Status Display */}
        <div
          className={`flex items-center justify-center gap-3 rounded-lg p-4 ${config.bgColor}`}
        >
          <StatusIcon
            className={`h-6 w-6 ${config.color} ${
              state.systemStatus === "running" ? "animate-spin" : ""
            }`}
          />
          <span className={`text-lg font-bold ${config.color}`}>
            {config.label}
          </span>
        </div>

        {/* Connection & Feature Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-md border border-border p-3">
            {state.connected ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-xs font-medium text-foreground">연결 상태</p>
              <p
                className={`text-xs ${
                  state.connected ? "text-success" : "text-muted-foreground"
                }`}
              >
                {state.connected ? state.selectedPort : "미연결"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border p-3">
            <CirclePause className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-foreground">
                턴테이블 회전
              </p>
              <p className="text-xs text-muted-foreground">Disabled</p>
            </div>
          </div>
        </div>

        {/* Log Area */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-border">
          <div className="border-b border-border bg-muted px-3 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Activity Log
            </span>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="flex flex-col gap-0.5">
              {state.logs.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  아직 활동 기록이 없습니다
                </p>
              ) : (
                state.logs.map((log, i) => (
                  <p
                    key={`${log}-${i}`}
                    className="font-mono text-[11px] leading-relaxed text-muted-foreground"
                  >
                    {log}
                  </p>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
