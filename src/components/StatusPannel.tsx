import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  //   Wifi,
  //   WifiOff,
  CircleCheck,
  //   CircleAlert,
  //   CirclePause,
  //   Loader2,
} from "lucide-react";

export function StatusPanel() {
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
          className={`flex items-center justify-center gap-3 rounded-lg p-4 bg-success/10`}
        >
          <CircleCheck className="h-6 w-6 text-success" />
          <span className="text-lg font-bold text-success">System Ready</span>
        </div>

        {/* Connection & Feature Status */}
        <div className="grid grid-cols-2 gap-3">
          {/* <div className="flex items-center gap-2 rounded-md border border-border p-3">
            {false ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-xs font-medium text-foreground">연결 상태</p>
              <p
                className={`text-xs ${
                  false ? "text-success" : "text-muted-foreground"
                }`}
              >
                {false ? "미연결" : "미연결"}
              </p>
            </div>
          </div> */}
        </div>

        {/* Log Area */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-border">
          <div className="border-b border-border bg-muted px-3 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Activity Log
            </span>
          </div>
          {/* <ScrollArea className="flex-1 p-2">
            <div className="flex flex-col gap-0.5">
              {false ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  아직 활동 기록이 없습니다
                </p>
              ) : (
                false.map((log, i) => (
                  <p
                    key={`${log}-${i}`}
                    className="font-mono text-[11px] leading-relaxed text-muted-foreground"
                  >
                    {log}
                  </p>
                ))
              )}
            </div>
          </ScrollArea> */}
        </div>
      </CardContent>
    </Card>
  );
}
