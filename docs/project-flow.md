# 프로젝트 흐름 (auto-shooting-system-GUI)

## 1. 아키텍처 개요

```
[React GUI] ←→ [Electron Main] ←→ [SerialPort] ←→ [아두이노 보드]
     │                │                  │
     └─ state/store   └─ IPC (invoke/on) └─ 9600 baud, \r\n 줄 단위
```

- **렌더러**: React + 외부 스토어(useSyncExternalStore). 시리얼 수신은 `serial:data` IPC로 줄 단위 수신.
- **메인**: 시리얼 열기/닫기/쓰기, 수신 시 `win.webContents.send("serial:data", line)`.
- **통신**: 한 줄 단위 UTF-8, 줄 끝은 `\r\n` (전송 시 메인에서 자동 추가).

---

## 2. 상태(State) 흐름

### 2.1 연결 상태

| 상태           | 설명                     |
| -------------- | ------------------------ |
| `connected`    | 시리얼 포트 연결 여부    |
| `selectedPort` | 현재 선택된 포트 경로    |
| `ports`        | 포트 목록 (갱신 시 갱신) |

- **연결**: 포트 선택 후 연결 → `connected: true`, `systemStatus: "ready"`.
- **해제**: 연결 해제 → `connected: false`, `exitPending: false` 초기화.

### 2.2 시스템 상태 (systemStatus)

| 값        | 의미                     | 전환 조건                                            |
| --------- | ------------------------ | ---------------------------------------------------- |
| `ready`   | 대기/사용 가능           | 연결 직후, DONE/DONE_ALL/DONE_STOP 수신, 리셋 후     |
| `running` | 자동운전 또는 축 이동 중 | 자동운전 시작, 단축 이동 클릭 시                     |
| `stopped` | 긴급 정지                | 정지 버튼 클릭 시 (DONE_STOP 수신 시 → ready로 전환) |
| `error`   | 에러 (현재 미사용)       | -                                                    |

- **긴급 정지 중**에는 DONE/DONE_ALL이 와도 `stopped` 유지(덮어쓰지 않음).

### 2.3 축 상태 (units[key].status)

| 값       | 의미                                     |
| -------- | ---------------------------------------- |
| `idle`   | 대기                                     |
| `moving` | 이동 중 (초기화/이동/자동운전 명령 직후) |
| `done`   | 해당 축 이동 완료 (DONE 수신 시)         |
| `error`  | 에러                                     |

- 단일 축 완료: `DONE CAM_HEIGHT=123.4` → 해당 축 `done`, 모두 완료 시 `systemStatus: "ready"`.
- 자동운전 전체 완료: `DONE_ALL` → 모든 축 `done`, `systemStatus: "ready"`.
- 긴급 정지 완료: `DONE_STOP` → 모든 축 `idle`, `systemStatus: "ready"`.

### 2.4 종료 대기 (exitPending)

- 창 닫기(X) 클릭 → `quitApp()` → `: true`, `QUIT_HOME` 전송.
- 보드가 홈으로 복귀 후 `QUIT` 전송 → 앱이 `app:quit` IPC로 종료.
- 연결 해제 시 `exitPending: false`로 초기화.

---

## 3. GUI → 보드 명령 프로토콜

| 액션        | 전송 문자열                                                | 비고                                |
| ----------- | ---------------------------------------------------------- | ----------------------------------- |
| 단축 초기화 | `INIT_CAM_HEIGHT` / `INIT_CAM_LOWER` / `INIT_TABLE_HEIGHT` | 줄 끝 \r\n 자동                     |
| 전체 초기화 | `FULL_INIT`                                                |                                     |
| 단축 이동   | `CAM_HEIGHT=값` / `CAM_LOWER=값` / `TABLE_HEIGHT=값`       | 숫자                                |
| 자동운전    | `AUTO=CAM_HEIGHT:v1/CAM_LOWER:v2/TABLE_HEIGHT:v3`          | 순서/값은 설정 기준                 |
| 긴급 정지   | `STOP`                                                     |                                     |
| 종료 요청   | `QUIT_HOME`                                                | 이후 보드가 `QUIT` 보낼 때까지 대기 |
| 보드 리셋   | `RESET`                                                    |                                     |

---

## 4. 보드 → GUI 수신 프로토콜 (기대 형식)

| 형식           | 예시                               | GUI 동작                                              |
| -------------- | ---------------------------------- | ----------------------------------------------------- |
| 실시간 위치    | `CAM_HEIGHT=123.4`                 | 해당 축 `currentValue` 갱신                           |
| 단일 축 완료   | `DONE CAM_HEIGHT=123.4`            | 해당 축 `done`, currentValue 반영, 모두 완료 시 ready |
| 자동운전 완료  | `DONE_ALL` (뒤에 옵션 텍스트 가능) | 모든 축 done, systemStatus ready                      |
| 긴급 정지 완료 | `DONE_STOP`                        | 모든 축 idle, systemStatus ready                      |
| 종료 신호      | `QUIT`                             | exitPending이 true일 때만 앱 종료 IPC 전송            |

- 줄은 공백 trim 후 빈 줄은 무시. 위 순서대로 매칭(QUIT → DONE_STOP → DONE → DONE_ALL → 위치 값).

---

## 5. 화면별 동작 요약

- **Topbar**: 포트 선택/연결/해제, 자동운전/전체초기화/보드리셋, 자동순서 선택, 설정 저장/불러오기. 연결 시에만 운전/초기화/리셋 가능.
- **UnitPanel (x3)**: 축별 현재값/설정값, 초기화 버튼, 이동 버튼. 연결됐을 때만 활성, running 또는 해당 축 moving 시 비활성.
- **StatusPanel**: systemStatus 표시(Ready/Running/Emergency Stop), 연결 상태, 긴급 정지 버튼(running일 때만 활성), Activity Log.
- **창 닫기**: X 클릭 → QUIT_HOME 전송 → QUIT 수신 시 앱 종료. 연결 없으면 즉시 닫기.

---

## 6. 축/범위 (state 기준)

| 키           | 라벨             | 범위 (min ~ max) |
| ------------ | ---------------- | ---------------- |
| CAM_HEIGHT   | 카메라 높이      | 0 ~ 400          |
| CAM_LOWER    | 카메라 하부 위치 | 0 ~ 1800         |
| TABLE_HEIGHT | 턴테이블 높이    | 0 ~ 400          |

- 설정 불러오기 시 위 범위 검증은 현재 없음 (보드/요구에 따라 추가 가능).
