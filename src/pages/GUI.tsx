import { useEffect } from "react";
import { TopBar } from "../components/Topbar";
import { UnitPanel } from "../components/UnitPannel";
import { StatusPanel } from "../components/StatusPannel";
import { initSerialListener } from "../lib/store";
import { Header } from "@/components/Header";

const UNIT_KEYS = [
  { key: "CAM_HEIGHT", index: 1 },
  { key: "CAM_LOWER", index: 2 },
  { key: "TABLE_HEIGHT", index: 3 },
];

export default function GUI() {
  useEffect(() => {
    const cleanup = initSerialListener();
    return cleanup;
  }, []);

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
    </div>
  );
}
