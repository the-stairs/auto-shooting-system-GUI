import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState, useActions, updateUnit } from "@/lib/store";
import { RotateCcw, Send, Loader2 } from "lucide-react";

type UnitPanelProps = {
  unitKey: string;
  index: number;
};

const SAFETY_VALUE = 1;

export function UnitPanel({ unitKey, index }: UnitPanelProps) {
  const state = useAppState();
  const actions = useActions();
  const unit = state.units[unitKey];

  if (!unit) return null;

  const isRunning = state.systemStatus === "running";
  const isAxisMoving = unit.status === "moving";
  const maxValue = unit.max - SAFETY_VALUE;

  const onChangeSetValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/^0+/, "") || "0";
    const num = parseInt(raw, 10);
    if (!Number.isNaN(num) && num >= unit.min && num <= maxValue) {
      updateUnit(unitKey, { setValue: num });
    }
  };

  return (
    <Card className="relative flex h-full min-h-0 flex-col border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
            {index}
          </span>
          {unit.label}
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            ({unit.min}-{unit.max}mm)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isAxisMoving && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>이동 중...</span>
            </div>
          </div>
        )}
        {/* Current Value Row */}
        <div className="flex items-center gap-3">
          <label className="w-16 shrink-0 text-xs text-muted-foreground">
            현재 값
          </label>
          <div className="relative flex-1">
            <Input
              readOnly
              value={unit.currentValue}
              className="border-border bg-muted font-mono text-center text-sm text-foreground"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              mm
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => actions.initUnit(unitKey)}
            disabled={!state.connected || isRunning || isAxisMoving}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            초기화
          </Button>
        </div>

        {/* Set Value Row */}
        <div className="flex items-center gap-3">
          <label className="w-16 shrink-0 text-xs text-muted-foreground">
            설정 값
          </label>
          <div className="relative flex-1">
            <Input
              value={unit.setValue.toString()}
              type="number"
              min={unit.min}
              max={maxValue}
              onChange={onChangeSetValue}
              className="border-border bg-secondary font-mono text-center text-sm text-foreground"
              placeholder={"0"}
              disabled={isAxisMoving}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              mm
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => actions.sendUnitValue(unitKey)}
            disabled={!state.connected || isRunning || isAxisMoving}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        </div>

        {/* Visual indicator bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">0</span>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70 transition-all duration-500"
              style={{
                width: `${Math.min(
                  (unit.currentValue / (unitKey === "CAM_LOWER" ? 1800 : 400)) *
                    100,
                  100
                )}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {unitKey === "CAM_LOWER" ? "1800" : "400"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
