"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Send, Crosshair } from "lucide-react";

interface UnitPanelProps {
  unitKey: string;
  index: number;
}

export function UnitPanel({ unitKey, index }: UnitPanelProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
            {index}
          </span>
          {"label"}
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            ("range")
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Current Value Row */}
        <div className="flex items-center gap-3">
          <label className="w-16 shrink-0 text-xs text-muted-foreground">
            현재 값
          </label>
          <div className="relative flex-1">
            <Input
              readOnly
              value={"currentValue"}
              className="border-border bg-muted font-mono text-center text-sm text-foreground"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              mm
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {}}
            disabled={false}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            초기화
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {}}
            disabled={false}
            className="gap-1.5"
          >
            <Crosshair className="h-3.5 w-3.5" />
            자동 위치
          </Button>
        </div>

        {/* Set Value Row */}
        <div className="flex items-center gap-3">
          <label className="w-16 shrink-0 text-xs text-muted-foreground">
            설정 값
          </label>
          <div className="relative flex-1">
            <Input
              value={"setValue"}
              onChange={(e) => {
                console.log(e.target.value);
              }}
              className="border-border bg-secondary font-mono text-center text-sm text-foreground"
              placeholder="0000"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              mm
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => {}}
            disabled={false}
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
                  (Number.parseInt("currentValue") /
                    (unitKey === "CAM_LOWER" ? 1800 : 400)) *
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
