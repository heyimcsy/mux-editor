<div align="center">

# Mux Editor

**터미널 색을, 보면서 고르세요.**

[cmux](https://github.com/manaflow-ai/cmux)용 시각 테마 편집기입니다. 살아 있는 터미널 위에서 색을 고르고, 그대로 붙여넣을 설정 파일을 받아갑니다. 설정 문법은 몰라도 됩니다.

[**→ 편집기 열기**](https://heyimcsy.github.io/mux-editor/)

[![Live](https://img.shields.io/badge/demo-live-2ea043?style=flat-square)](https://heyimcsy.github.io/mux-editor/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

[English](README.md) · **한국어**

</div>

---

## 문제

cmux 테마를 바꾸려면 `~/.config/ghostty/config`를 직접 열어야 합니다. 색상값을 찍어 넣고, 저장하고, 리로드하고, 눈으로 확인하고, 다시 찍어 넣습니다. `palette = 4=#61afef`가 어떤 색인지는 화면에 나오기 전까지 알 수 없고, 애초에 그 키 이름이 `palette`라는 것부터 알고 있어야 합니다.

Mux Editor는 이 왕복을 없앱니다. 색을 건드릴 때마다 가상 터미널이 즉시 다시 칠해지고, 마지막 화면에서 붙여넣기만 하면 되는 테마 파일·설정 파일·리로드 명령을 건네줍니다.

## 무엇을 하나요

| | |
|---|---|
| **실시간 미리보기** | 가상 cmux 창이 모든 변경에 즉시 반응합니다. 일반 셸, 분할 화면, 에이전트 세션 세 가지 시나리오를 제공하고, 드래그로 옮기고 스크롤로 확대합니다. |
| **cmux가 읽는 모든 색** | 배경, 글자, 커서, 커서 위 글자, 선택 영역 배경/글자, 그리고 ANSI 16색 전부. 지어낸 항목은 없고 전부 실제로 존재하는 키에 대응합니다. |
| **이미지에서 테마 뽑기** | 사진을 끌어다 놓으면 팔레트가 됩니다. 주요 색을 버킷으로 모으고, ANSI 색상환 기준점에 맞춰 배치하고, 배경 밝기에 맞게 보정합니다. 이미지를 클릭하면 그 지점 색만 뽑을 수도 있습니다. |
| **대비 경고** | WCAG 2.1 대비율을 실시간 계산합니다. 본문 글자는 4.5:1, 색상 출력은 3:1 기준. 초록색이 안 읽힌다는 사실을 *적용하기 전에* 알게 됩니다. |
| **폰트·창·분할 설정** | 폰트 종류·크기·굵기, 합성 스타일, 두껍게, 알파 블렌딩, 배경 투명도와 블러, 창 여백, 분할선 색, 비활성 분할 패널 투명도와 채움색. |
| **설치된 폰트 인식** | 브라우저가 허용하면(`queryLocalFonts`) 설치된 폰트를 읽어, 글리프 폭을 실제로 재서 고정폭 폰트만 골라냅니다. 목록을 하드코딩하지 않습니다. |
| **실패할 수 없는 내보내기** | 각 단계가 터미널에 붙여넣는 명령 한 줄입니다. 직접 저장하는 방식도 제공하지만, 그쪽은 macOS가 `.txt`를 몰래 붙여서 Ghostty가 테마를 못 찾는 함정이 있어 그 자리에서 경고합니다. 기존 설정 파일은 덮어쓰기 전에 백업합니다. |

기본 프리셋 다섯 개가 들어 있습니다. **Ocean Night**(기본), Dracula, Catppuccin Mocha, Catppuccin Latte, Solarized Dark.

## 쓰는 법

1. **만들기** — [편집기](https://heyimcsy.github.io/mux-editor/)를 열고 색을 고릅니다.
2. **내보내기** — 3단계가 나오고, 각 단계는 붙여넣을 명령 하나입니다.

   ```bash
   mkdir -p ~/.config/ghostty/themes
   cat > ~/.config/ghostty/themes/ocean-night << 'MUX_EOF'
   background = #1d262a
   foreground = #e7ebed
   palette = 0=#435b67
   ...
   MUX_EOF
   ```

   ```bash
   mkdir -p ~/.config/ghostty
   [ -f ~/.config/ghostty/config ] && cp ~/.config/ghostty/config ~/.config/ghostty/config.bak.$(date +%Y%m%d-%H%M%S)
   cat > ~/.config/ghostty/config << 'MUX_EOF'
   font-family = JetBrains Mono
   theme = ocean-night
   ...
   MUX_EOF
   ```

3. **적용** — `cmux reload-config`를 실행하거나, cmux 안에서 <kbd>⌘</kbd><kbd>⇧</kbd><kbd>,</kbd>를 누릅니다.

파일을 직접 쓰고 싶다면 각 단계에서 **직접 저장**으로 전환하면 파일 본문과 저장 경로가 나옵니다. 다만 테마 파일 이름에는 **확장자가 없어야 합니다** — 편집기가 `ocean-night.txt`로 저장하면 Ghostty가 무시하고 아무 일도 일어나지 않습니다.

작업 내용은 `localStorage`에 저장되므로 탭을 닫아도 테마가 날아가지 않습니다.

## 개인정보

서버가 없습니다. 계정도, 분석 도구도, 업로드도 없습니다. 끌어다 놓은 이미지는 `<canvas>`에서 디코딩되어 **브라우저 안에서** 픽셀 단위로 읽힐 뿐, 어디로도 전송되지 않습니다. 페이지가 보내는 네트워크 요청은 자신의 정적 파일과 웹폰트 두 개(jsDelivr의 Pretendard, Google Fonts의 JetBrains Mono)뿐입니다.

## 솔직한 한계

두 가지 설정은 미리보기에서 **일부러** 재현하지 않습니다. 흉내 내면 거짓말이 되기 때문입니다. `alpha-blending`(GPU 블렌딩 색공간)과 `font-thicken-strength`(네이티브 래스터라이저 값)입니다. `font-thicken`은 폰트 스무딩으로, `font-variation = wght`는 일반 CSS 굵기로 근사합니다.

그리고 자주 요청되지만 cmux나 Ghostty에 키 자체가 없는 것이 네 가지 있습니다. 동작하지 않을 컨트롤을 넣는 대신, 편집기 안에서 그 이유를 밝혀 둡니다.

- **활성 / 비활성 탭 배경색** — Ghostty에 탭 색 키가 없고, cmux의 워크스페이스 탭 강조색은 아직 커스텀할 수 없습니다 ([cmux#1753](https://github.com/manaflow-ai/cmux/issues/1753)이 요청 중).
- **상태 표시줄 색** — cmux에는 상태 표시줄 UI 자체가 없고, Ghostty에도 관련 키가 없습니다.
- **검색 결과 강조색** — Ghostty는 선택 영역 색만 지정할 수 있습니다.

Mux Editor는 **macOS의 cmux**를 대상으로 합니다. cmux가 Ghostty로 렌더링하므로, 내보낸 파일은 순수 Ghostty에서도 그대로 동작합니다.

## 개발

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 정적 내보내기 → out/
npm run typecheck  # tsc --noEmit
```

`output: "export"`를 쓰는 Next.js 15입니다. 앱 전체가 클라이언트에서 동작하므로 빌드 결과는 서버가 필요 없는 정적 파일 묶음입니다. 런타임 의존성은 `next`, `react`, `react-dom` 셋뿐이고 CSS 프레임워크, 상태 관리 라이브러리, 컴포넌트 키트를 쓰지 않습니다.

```
app/
  page.tsx           프리셋이 순환하는 랜딩
  editor/page.tsx    이동·확대 캔버스와 편집 패널
  export/page.tsx    생성된 파일과 적용 안내
components/
  TerminalPreview    가상 터미널 (테마 + 설정 → CSS 변수)
  ThemePanel         색 / 폰트 / 창 탭, 대비 경고
  ExtractModal       이미지 → 팔레트
lib/
  theme.ts           Theme 타입, ANSI 슬롯, 프리셋
  config.ts          Ghostty 외형 키와 기본값
  extract.ts         주요 색 추출과 ANSI 색상 배치
  contrast.ts        WCAG 2.1 휘도와 대비율
  export.ts          Theme + 설정 → Ghostty 파일 본문
  store.tsx          React context + localStorage 저장
config/              참고용 실제 설정 파일 예시
```

`main`에 푸시할 때마다 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)이 GitHub Pages로 자동 배포합니다. 프로덕션 빌드는 `basePath: "/mux-editor"`를 설정하고, Pages가 `_next/` 디렉터리를 걷어내지 않도록 결과물에 `.nojekyll`을 넣습니다.

## 기여

이슈와 PR 모두 환영합니다. 특히 이런 것들:

- 존재하지만 편집기에 아직 노출하지 않은 Ghostty 키
- 넣을 만한 프리셋
- 이미지에서 ANSI 슬롯을 더 잘 배치하는 방법 (`lib/extract.ts`는 단순한 탐욕적 색상 매칭이라 개선 여지가 큽니다)
- UI 영어 지원 (현재 전부 한국어입니다)

## 라이선스

[MIT](LICENSE) © seoyoonchoi

Mux Editor는 독립적인 프로젝트입니다. cmux나 Ghostty의 코드를 포함하지 않으며, 그 프로그램들이 읽는 설정 파일을 만들어 줄 뿐입니다.
