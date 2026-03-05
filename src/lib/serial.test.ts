import { initSerialListener } from "./serial";

jest.mock("./state", () => {
  const baseUnits = {
    CAM_HEIGHT: { status: "idle" },
    CAM_LOWER: { status: "idle" },
    TABLE_HEIGHT: { status: "idle" },
  };

  const state = {
    units: baseUnits,
    systemStatus: "ready" as "ready" | "running" | "stopped",
    exitPending: false,
  };

  return {
    getState: jest.fn(() => state),
    setState: jest.fn((partial: Partial<typeof state>) => {
      Object.assign(state, partial);
    }),
    updateUnit: jest.fn(),
    setAxisStatus: jest.fn(),
    resetAllAxisStatus: jest.fn(),
    addLog: jest.fn(),
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMockWindow(): any {
  const handlers: Record<string, (event: unknown, line: string) => void> = {};

  const on = (
    channel: string,
    listener: (event: unknown, line: string) => void
  ) => {
    handlers[channel] = listener;
  };

  const off = (channel: string) => {
    delete handlers[channel];
  };

  const emit = (channel: string, line: string) => {
    const handler = handlers[channel];
    if (!handler) {
      return;
    }
    handler({}, line);
  };

  return {
    ipcRenderer: {
      on,
      off,
      emit,
    },
  };
}

describe("serial line parsing", () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = createMockWindow();
    jest.clearAllMocks();
  });

  it("handles START line and updates all units", () => {
    initSerialListener();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockWin = window as any;
    const line = "START=CAM_HEIGHT:1.0/CAM_LOWER:2.5/TABLE_HEIGHT:3.75";

    mockWin.ipcRenderer.emit("serial:data", line);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mockedState = require("./state");

    expect(mockedState.updateUnit).toHaveBeenCalledWith("CAM_HEIGHT", {
      currentValue: 1.0,
      setValue: 1.0,
    });
    expect(mockedState.updateUnit).toHaveBeenCalledWith("CAM_LOWER", {
      currentValue: 2.5,
      setValue: 2.5,
    });
    expect(mockedState.updateUnit).toHaveBeenCalledWith("TABLE_HEIGHT", {
      currentValue: 3.75,
      setValue: 3.75,
    });
    expect(mockedState.setState).toHaveBeenCalledWith({
      systemStatus: "ready",
    });
  });

  it("ignores lines that do not match any known pattern", () => {
    initSerialListener();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockWin = window as any;

    mockWin.ipcRenderer.emit("serial:data", "UNKNOWN LINE");

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mockedState = require("./state");

    expect(mockedState.updateUnit).not.toHaveBeenCalled();
    expect(mockedState.setState).not.toHaveBeenCalledWith({
      systemStatus: "ready",
    });
  });
});
