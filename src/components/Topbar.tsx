"use client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  RotateCcw,
  RefreshCw,
  //   Plug,
  //   Unplug,
  Download,
  Upload,
  FileText,
  OctagonX,
} from "lucide-react";

const AUTO_ORDER_KEYS = ["CAM_HEIGHT", "CAM_LOWER", "TABLE_HEIGHT"] as const;
const DISPLAY_NAMES: Record<string, string> = {
  CAM_HEIGHT: "카메라 높이",
  CAM_LOWER: "카메라 하부",
  TABLE_HEIGHT: "턴테이블 높이",
};

export function TopBar() {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3">
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => {}}
          disabled={false}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Play className="mr-1.5 h-3.5 w-3.5" />
          자동운전
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {}}
          disabled={false}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          전체초기화
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {}}
          disabled={false}
        >
          <OctagonX className="mr-1.5 h-3.5 w-3.5" />
          긴급 정지
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
            value={""}
            onValueChange={(val: string) => {
              console.log(val);
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
          value={""}
          onValueChange={(val: string) => {
            console.log(val);
          }}
          disabled={false}
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="포트 선택" />
          </SelectTrigger>
          <SelectContent>
            {["COM1", "COM2", "COM3"].map((p) => (
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
          onClick={() => {}}
          disabled={false}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="sr-only">포트 갱신</span>
        </Button>
        {/* {false ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {}}
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
          >
            <Unplug className="mr-1.5 h-3.5 w-3.5" />
            해제
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              console.log("connect");
            }}
            disabled={false}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            <Plug className="mr-1.5 h-3.5 w-3.5" />
            연결
          </Button>
        )} */}
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-border" />

      {/* File Operations */}
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => {}}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          불러오기
        </Button>
        <input
          type="file"
          accept=".json,.txt"
          className="hidden"
          onChange={() => {}}
        />
        <Button size="sm" variant="ghost" onClick={() => {}}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          저장
        </Button>
        {false && (
          <span className="flex items-center gap-1 text-xs text-primary">
            <FileText className="h-3 w-3" />
            {"fileName"}
          </span>
        )}
      </div>
    </div>
  );
}
