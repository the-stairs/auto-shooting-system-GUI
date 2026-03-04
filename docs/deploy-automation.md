# 배포 자동화 가이드

Electron 앱(Windows NSIS 인스톨러) 빌드·배포를 자동화하는 방법입니다.

---

## 1. 로컬에서 수동 빌드 (현재 방식)

```bash
npm run build
```

- 결과물: `release/{version}/` (예: `release/1.1.0/`)
  - `auto-shooting-system-gui-Windows-{version}-Setup.exe` (설치용)
  - `win-unpacked/` (포터블 실행 파일)

버전은 `package.json`의 `version` 필드에서 변경합니다.

---

## 2. GitHub Actions로 자동 빌드

저장소에 `.github/workflows/build.yml`을 두면 **푸시/태그 시 자동으로 빌드**할 수 있습니다.

### 동작 요약

| 트리거 | 동작 |
|--------|------|
| `main` 브랜치에 push | Windows 인스톨러 빌드 → Artifacts에 업로드 (다운로드 가능) |
| 태그 푸시 (예: `v1.1.0`) | 위와 동일 + **GitHub Releases**에 자동 업로드 (선택) |

### 사용 절차

1. 이 문서와 함께 추가된 `.github/workflows/build.yml`이 있는지 확인.
2. GitHub 저장소에 push하면 `main` 브랜치 push 시 워크플로우가 실행됨.
3. **Actions** 탭 → 해당 워크플로우 → Run → 완료 후 **Artifacts**에서 `win-Setup` 등 다운로드.

### 태그로 릴리즈까지 자동화하려면

- `git tag v1.1.0` 후 `git push origin v1.1.0` 하면, 워크플로우에서 **Releases**에 exe를 올리도록 설정할 수 있음 (아래 워크플로우에 `release` job 추가 가능).

---

## 3. 빌드 스크립트로 버전·빌드 한 번에

배포 전에 버전 올리고 빌드까지 한 번에 하고 싶다면:

```bash
# package.json version을 1.2.0으로 올리고 빌드 (PowerShell)
npm version patch --no-git-tag-version
npm run build
```

또는 `package.json`에 스크립트 추가:

```json
"scripts": {
  "release:patch": "npm version patch --no-git-tag-version && npm run build",
  "release:minor": "npm version minor --no-git-tag-version && npm run build",
  "release:major": "npm version major --no-git-tag-version && npm run build"
}
```

- `npm run release:patch` → 1.1.0 → 1.1.1 후 빌드
- 그다음 필요 시 `git add package.json package-lock.json release/` 후 커밋·푸시

---

## 4. 주의사항

- **serialport** 등 네이티브 모듈은 빌드 OS와 맞아야 합니다. Windows exe는 **Windows runner**(GitHub: `windows-latest`)에서 빌드하는 것이 안전합니다.
- **electron-builder**가 빌드 시 네이티브 의존성을 같이 처리합니다. `postinstall`의 `electron-rebuild`는 로컬 개발/빌드용으로 두면 됩니다.
- CI에서 캐시를 쓰면 빌드 시간을 줄일 수 있습니다 (아래 워크플로우 예시에 포함).

---

## 5. 사용자 자동 업데이트 (electron-updater)

설치된 앱이 **새 버전을 찾아 다운로드·설치**하려면, 빌드 결과가 **GitHub Releases**에 올라가 있어야 합니다.

### 동작 방식

1. **앱** (패키징된 exe)은 실행 시 또는 사용자가 **"업데이트 확인"** 클릭 시 `electron-updater`로 GitHub Releases를 조회합니다.
2. **Releases**에 현재 버전보다 높은 버전의 `latest.yml` + Setup.exe가 있으면 **업데이트 있음**으로 판단하고 자동 다운로드를 시작합니다.
3. 다운로드가 끝나면 헤더에 **"설치할 준비가 되었습니다. [재시작]"**이 뜹니다. 재시작하면 인스톨러가 실행되어 새 버전으로 갱신됩니다.

### 필수 설정

**1. `electron-builder.json5`의 `publish`**

실제 GitHub 저장소 정보로 바꿔야 합니다.

```json5
publish: {
  provider: "github",
  owner: "YOUR_GITHUB_USERNAME",   // 본인 GitHub 사용자명 또는 조직
  repo: "auto-shooting-system-GUI", // 저장소 이름 (대소문자 맞출 것)
},
```

- `owner` / `repo`가 맞아야 앱이 해당 저장소의 Releases를 조회합니다.
- 로컬에서 `npm run build`만 하면 **Releases에는 올라가지 않고** `release/` 폴더에만 생성됩니다. 자동 업데이트를 쓰려면 **빌드 결과를 GitHub Releases에 올리는 단계**가 필요합니다.

**2. GitHub Releases에 빌드 올리기**

- **수동**: 저장소 **Releases** → 새 Release 생성 → 태그(예: `v1.1.0`) 지정 → `release/1.1.0/` 안의 **Setup.exe**와 **latest.yml**(같은 폴더에 생성됨)을 업로드.
- **자동**: 이 프로젝트의 `.github/workflows/build.yml`은 **태그가 `v*` 형태로 push될 때** `npm run build:publish`를 실행해 GitHub Releases에 자동 배포합니다.  
  - 예: `package.json`의 version을 `1.2.0`으로 올린 뒤 `git tag v1.2.0` → `git push origin v1.2.0`  
  - 태그 이름과 `package.json` version을 맞춰 두는 것이 좋습니다.

### 개발 중 동작

- `npm run dev`처럼 **패키징되지 않은** 상태에서는 업데이트 검사를 하지 않습니다 (`app.isPackaged === false`).
- **실제로 설치한 exe**에서만 "업데이트 확인" 및 자동 업데이트가 동작합니다.

### 요약

| 항목 | 내용 |
|------|------|
| 업데이트 소스 | GitHub Releases (같은 repo의 `owner`/`repo`) |
| 앱 동작 | "업데이트 확인" 클릭 또는 (원하면) 앱 시작 시 검사 → 있으면 자동 다운로드 → "재시작" 시 설치 |
| 배포 측 | 새 버전 빌드 후 **Releases에 exe + latest.yml** 올려야 사용자 앱이 업데이트를 인식함 |

---

## 6. 정리

| 목적 | 방법 |
|------|------|
| 로컬에서만 빌드 | `npm run build` |
| 푸시할 때마다 자동 빌드·다운로드 | GitHub Actions (`.github/workflows/build.yml`) |
| 버전 올리기 + 빌드 한 번에 | `npm run release:patch` 등 스크립트 추가 |
| 사용자에게 배포 | GitHub Releases에 exe 업로드 (태그 푸시 시 자동화 가능) |
| **사용자 자동 업데이트** | `publish`에 GitHub owner/repo 설정 + 빌드 결과를 Releases에 올리기 |
