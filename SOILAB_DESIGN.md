# SOILAB_DESIGN.md
> 협동조합 소이랩 공식 디자인 시스템
> AI 에이전트 및 바이브코딩 도구용 브랜드 가이드
> 버전 1.1 — 2026년 6월 (v1.0 2026.04 / 가독성·접근성 보강)

---

## 0. 사용법

이 파일은 Claude Code, V0, Cursor, Codex 등 AI 코딩 도구의 **프로젝트 루트**에 두고 참조한다.
웹사이트·카드뉴스·보고서·사업계획서 표지·문서 자동 생성 등 모든 소이랩 시각 산출물의 단일 기준점이다.

지시 예: `"SOILAB_DESIGN.md 따라서 만들어줘"` → 색·폰트·여백·톤이 일관 유지된다.

---

## 1. 브랜드 정체성

협동조합 소이랩(Soilab Cooperative)은 대구를 기반으로 한 사회혁신 협동조합이다.
ESG 경영 컨설팅, 리빙랩 코디네이션, 청년정책, 인지건강 디자인, 도시재생을 다룬다.
핵심 키워드: **사람 중심 · 협력 · 따뜻함 · 현장성 · 신뢰**

디자인 원칙:
- 차갑거나 기업적인 느낌(순백, 파랑 강조)은 피한다
- 따뜻한 중성 배경 위에 자연에서 온 색을 얹는다
- 공공기관과 시민 모두가 읽기 편안한 가독성을 우선한다
- 과도한 장식보다 여백과 타이포그래피 위계로 품격을 만든다

---

## 2. 컬러 팔레트

### Primary — Forest Green (소이랩 대표색)
```
--green-900: #1B4332   /* 가장 진한 포인트, 표지 배경 */
--green-800: #2D6A4F   /* Primary 브랜드 컬러, 헤딩·CTA */
--green-600: #40916C   /* 서브 텍스트, 아이콘 */
--green-400: #52B788   /* 밝은 강조, 체크마크 */
--green-100: #D8F3DC   /* 배지·칩 배경 */
--green-50:  #F0FAF3   /* 섹션 배경, 인포박스 */
```

### Secondary — Terracotta (보조 강조색)
```
--terra-800: #B85030   /* 강한 강조, 경고, 핵심 수치 */
--terra-600: #C75B3A   /* 일반 강조, 불릿 */
--terra-400: #E07A5F   /* 부드러운 강조 */
--terra-100: #FAECE7   /* 배지·칩 배경 */
--terra-50:  #FDF5F2   /* 섹션 틴트 */
```

### Neutral — Warm Canvas (배경·텍스트)
```
--canvas:    #F2F1ED   /* 페이지 기본 배경 (Cursor 스타일 크림) */
--surface:   #EBEAE5   /* 카드·섹션 배경 (Notion 웜화이트) */
--surface-2: #E3E2DC   /* 중첩 카드, 인풋 배경 */
--ink:       #26251E   /* 본문 텍스트 (순흑 아닌 웜블랙) */
--ink-mid:   #5A5850   /* 부제, 메타 텍스트 */
--ink-faint: #9A9890   /* 날짜, 캡션, 힌트 */
--border:    rgba(38,37,30,0.10)  /* 기본 보더 (속삭임) */
--border-md: rgba(38,37,30,0.18)  /* 강조 보더 */
```

### 사용 규칙
- 배경은 반드시 캔버스 계열(--canvas, --surface)을 쓴다. 순백(#ffffff) 단독 배경은 지양.
- 헤딩 강조색은 --green-800 또는 --terra-600 중 하나만 선택 (혼용 금지).
- 다크 배경이 필요할 때는 --green-900 또는 --ink를 사용한다.
- 파랑 계열, 보라 계열은 소이랩 디자인에 사용하지 않는다.

---

## 3. 타이포그래피

### 폰트 스택
```css
/* 디스플레이 헤딩 — 임팩트 있는 제목 */
font-family: 'Noto Serif KR', 'DM Serif Display', Georgia, serif;

/* 본문·UI — 가독성 우선 */
font-family: 'Noto Sans KR', -apple-system, system-ui, sans-serif;

/* 숫자·코드·날짜 — 모노스페이스 */
font-family: 'Space Mono', 'Courier New', monospace;
```

### 타이포 스케일 (Notion 압축 원칙 적용)
```
Display:  52px / weight 700 / letter-spacing -2px   / line-height 1.05
H1:       40px / weight 700 / letter-spacing -1.5px / line-height 1.10
H2:       32px / weight 700 / letter-spacing -1.2px / line-height 1.15
H3:       24px / weight 600 / letter-spacing -0.6px / line-height 1.25
H4:       18px / weight 600 / letter-spacing -0.2px / line-height 1.35
Body:     16px / weight 400 / letter-spacing -0.15px / line-height 1.75
Small:    13px / weight 400 / letter-spacing  0px    / line-height 1.60
Caption:  11px / weight 500 / letter-spacing  0.08em / line-height 1.50
```

### 규칙
- 헤딩은 Noto Serif KR, 본문은 Noto Sans KR로 역할을 분리한다.
- 숫자·날짜·코드는 Space Mono로 표기한다 (예: 03.23, 47건).
- 헤딩 사이즈가 클수록 letter-spacing을 음수로 압축한다.
- 볼드는 weight 700까지만. 800 이상은 과하다.

### 폰트 로딩 (웹)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```
- 반드시 `display=swap`을 써서 폰트 로딩 중 텍스트가 사라지지 않게 한다.
- 본문은 400·500·700 세 굵기만 로드 (불필요한 굵기 로딩 금지 → 속도).
- 문서/PDF 생성 시 한글 폰트는 NanumGothic TTF(`apt install fonts-nanum`)가 ReportLab에서 안정적이다.

---

## 4. 레이아웃 & 간격

### 보더 철학 (Notion 스타일)
```css
border: 1px solid rgba(38,37,30,0.10);  /* 기본 — 거의 보이지 않는 선 */
border: 1px solid rgba(38,37,30,0.18);  /* 강조 — 살짝 진한 선 */
/* 두껍고 뚜렷한 보더는 소이랩 스타일이 아니다 */
```

### Border Radius
```
카드·모달:   border-radius: 8px
버튼·배지:   border-radius: 6px
태그·필:     border-radius: 9999px (완전한 필)
입력 필드:   border-radius: 6px
```

### 간격 단위
```
섹션 패딩:  48px ~ 64px (상하), 52px (좌우)
카드 패딩:  24px ~ 32px
요소 간격:  8px / 12px / 16px / 24px / 32px
```

### 그리드
```
최대 너비:  1200px (대형), 980px (표준), 720px (콘텐츠)
컬럼:       2열 / 3열 그리드 (모바일은 1열)
```

### 그림자 (Cursor 멀티레이어)
```css
--shadow-sm: 0 1px 2px rgba(38,37,30,0.04),
             0 4px 16px rgba(38,37,30,0.05);
--shadow-md: 0 2px 8px rgba(38,37,30,0.06),
             0 8px 24px rgba(38,37,30,0.04),
             0 20px 48px rgba(38,37,30,0.03);
/* opacity 합산이 0.15를 넘지 않도록 */
```

---

## 5. 컴포넌트 패턴

### 태그/배지
```html
<span class="pill pill-green">홍보 · 자원연계</span>
<span class="pill pill-terra">청년 사전인터뷰</span>
<span class="pill pill-white">2026년 3월</span>
```
```css
.pill {
  display: inline-block;
  font-family: 'Space Mono', monospace;
  font-size: 10px; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase;
  padding: 5px 14px; border-radius: 9999px;
}
.pill-green { background: #D8F3DC; color: #2D6A4F; }
.pill-terra { background: #FAECE7; color: #C75B3A; }
.pill-white { background: rgba(255,255,255,.14); color: rgba(255,255,255,.8); }
```

### 메트릭 카드
```css
.metric-box {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 20px 18px;
}
.metric-num {
  font-family: 'Noto Serif KR', serif;
  font-size: 44px; font-weight: 700;
  letter-spacing: -2px; line-height: 1;
  color: var(--green-800);
}
.metric-box.hero { background: var(--ink); border-color: var(--ink); }
.metric-box.hero .metric-num { color: #ffffff; font-size: 56px; }
```

### 리스트 아이템
```css
.item-row {
  display: flex; gap: 14px; align-items: flex-start;
  padding: 13px 0;
  border-bottom: 1px solid var(--border);
}
.item-row:last-child { border-bottom: none; }
.dot { width: 4px; height: 4px; border-radius: 50%; background: var(--terra-600); }
.dot-green { background: var(--green-400); }
```

### 바 차트
```css
.bar-track {
  flex: 1; height: 8px;
  background: var(--surface-2);
  border-radius: 2px; overflow: hidden;
}
.bar-fill { height: 100%; background: var(--terra-600); border-radius: 2px; }
```

### CTA 버튼
```css
.btn-primary {
  background: var(--green-800);
  color: #ffffff;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 15px; font-weight: 600;
  padding: 12px 28px; border-radius: 6px; border: none;
  cursor: pointer;
}
.btn-secondary {
  background: transparent;
  color: var(--green-800);
  border: 1.5px solid var(--green-800);
  font-size: 15px; font-weight: 500;
  padding: 11px 28px; border-radius: 6px;
}
```

---

## 6. 섹션 패턴 (교대 배경)

Notion의 핵심 리듬: 밝은 배경 ↔ 약간 어두운 배경을 교대한다.

```
섹션 A (홀수):  background: var(--canvas)   #F2F1ED
섹션 B (짝수):  background: var(--surface)  #EBEAE5
강조 섹션:      background: var(--green-800) 다크그린  /* 표지, 마무리 */
다크 섹션:      background: var(--ink)       웜블랙    /* 4월계획 등 */
```

---

## 7. 가독성 & 접근성 (v1.1 신설)

> 기준: WCAG 2.1 — 본문 텍스트 명도 대비 **4.5:1 이상**, 큰 텍스트(18px Bold·24px 이상) **3:1 이상**.

### 7-1. 색 조합별 대비 검증 (소이랩 팔레트 기준)

| 전경(텍스트) | 배경 | 대비비 | 판정 | 용도 |
|---|---|---|---|---|
| `--ink` #26251E | `--canvas` #F2F1ED | 약 13.9:1 | AAA | 기본 본문 ✅ |
| `--ink` #26251E | `--surface` #EBEAE5 | 약 12.8:1 | AAA | 카드 본문 ✅ |
| `--ink-mid` #5A5850 | `--canvas` #F2F1ED | 약 6.3:1 | AA | 부제·메타 ✅ |
| `--ink-faint` #9A9890 | `--canvas` #F2F1ED | 약 2.6:1 | ✕ | **본문 금지** — 캡션·힌트(대형)만 |
| `#FFFFFF` | `--green-800` #2D6A4F | 약 6.0:1 | AA | 버튼·다크섹션 텍스트 ✅ |
| `--green-800` #2D6A4F | `--canvas` #F2F1ED | 약 5.0:1 | AA | 헤딩·링크 ✅ |
| `--green-600` #40916C | `--canvas` #F2F1ED | 약 3.1:1 | 큰텍스트만 | 24px+ 헤딩 한정, 본문 ✕ |
| `--terra-600` #C75B3A | `--canvas` #F2F1ED | 약 3.9:1 | 큰텍스트만 | 강조 헤딩·아이콘, **본문 ✕** |
| `--terra-800` #B85030 | `--canvas` #F2F1ED | 약 4.7:1 | AA | 본문 강조 가능 ✅ |

### 7-2. 규칙
- **본문(16px 이하) 강조색은 `--terra-800` / `--green-800`을 쓴다.** `--terra-600`·`--green-600`은 헤딩(24px+)·아이콘에만.
- `--ink-faint`(#9A9890)는 절대 본문에 쓰지 않는다. 11~13px 캡션·플레이스홀더 한정.
- 다크 배경(green-900·ink) 위 본문은 `#FFFFFF` 또는 `rgba(255,255,255,.88)` 이상 밝기로.
- **색만으로 정보를 전달하지 않는다.** 상태·필수표시·차트 범례는 텍스트/아이콘/패턴을 병기한다.
- 본문 최소 크기는 16px(웹)/10.5pt(문서). 모바일·당사자 대상 사이트는 17~18px 권장.

### 7-3. 가독성을 위한 본문 조판
- 본문 `line-height`는 1.7~1.8 (한글은 영문보다 행간을 넉넉히).
- 한 줄 길이는 한글 기준 **35~45자**(`max-width: 38em` 내외)를 넘기지 않는다.
- 양쪽 정렬(justify) 금지 → 한글에서 어절 간격이 들쭉날쭉해진다. 왼쪽 정렬 고정.
- 자간(letter-spacing)은 본문에 음수를 과하게 주지 않는다(-0.15px 수준). 압축은 헤딩에만.

### 7-4. 포커스·인터랙션 가시성
```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--canvas), 0 0 0 4px var(--green-800);
}
```
- 모든 클릭·입력 요소에 `:focus-visible` 링을 둔다(키보드 사용자 가시성).
- 터치 타깃은 최소 44×44px. 당사자·시니어 대상 화면은 버튼 높이 56px(h-14) 이상.
- 링크는 색 변화만이 아니라 밑줄 또는 굵기 변화를 병행한다.

---

## 8. 사이트별 톤 가이드

소이랩 산하 사이트·프로젝트는 같은 디자인 시스템을 쓰되, 톤을 조정한다.

### 8-1. soilabcoop.kr (본사 홈페이지)
- 대상: 파트너 기관, 사업 발주처, 언론
- 톤: 신뢰 · 전문성 · 사회혁신
- 헤딩색: --green-800 주도 / 표지: --green-900
- 특징: 사업 실적 수치 강조, 공신력 있는 레이아웃

### 8-2. 고립은둔청년지원 사이트 (soilab-youth.kr)
- 대상: 고립·은둔 청년 당사자, 가족, 동네 이웃
- 톤: 따뜻함 · 안전함 · 환영 · 낙인 없음
- 헤딩색: --green-600 (조금 더 밝고 부드럽게) / 표지: --green-800
- 특징: 딱딱한 관공서 느낌 금지 / 큰 폰트(17~18px) / 여백 충분히
- 주의: "고립", "은둔"을 제목 최상단에 쓰지 않는다
  → "다시 연결되는 공간", "천천히 나아가는 당신을 응원합니다" 류 선호

### 8-3. 청년다다름 대구제작소 (카드뉴스·보고서)
- 대상: 청년재단, 내부 보고
- 톤: 성실함 · 투명성 · 활동력
- 헤딩색: --green-800 + --terra-600 교대 / 표지: --green-800

### 8-4. ESG 컨설팅 자료
- 대상: 기업 담당자
- 톤: 전문성 · 데이터 · 설득
- 헤딩색: --green-800 / 특징: 수치·표 중심, 간결한 레이아웃

---

## 9. 이미지·아이콘 스타일

- 사진: 현장 사진 우선 (실제 활동, 사람 중심). AI 생성 이미지 지양.
- 아이콘: 선(outline) 스타일, 굵기 1.5px, 색상 --green-600 또는 --terra-600
- 일러스트: 따뜻한 색조의 flat 일러스트 가능. 차가운 블루 계열 금지.
- 그래프·차트: 배경 --surface-2, 바/선 색은 --terra-600(강조) 또는 --green-600
- 사진 위 텍스트는 어두운 오버레이(rgba(38,37,30,.45) 이상)를 깔아 대비를 확보한다.

---

## 10. 보이스 & 톤 (텍스트 작성 원칙)

- 존댓말(해요체)을 기본으로 한다.
- 어렵고 딱딱한 행정 용어는 쉬운 말로 풀어 쓴다.
- 통계·수치는 반드시 출처와 날짜를 병기한다.
- 청년을 "취약계층"이라고 표현하지 않는다 → "함께하는 청년"
- 문장은 짧게, 단락은 3~4문장 이내로.
- 참여자명은 모든 산출물에서 **성 OO** 형식으로 익명화한다.

---

## 11. AI 에이전트 사용 지침

이 DESIGN.md를 참조하여 UI·문서를 생성할 때:

1. **배경**: 반드시 `#F2F1ED`(canvas) 또는 `#EBEAE5`(surface)로 시작한다.
2. **헤딩**: `Noto Serif KR` + letter-spacing 음수 압축을 적용한다.
3. **강조색**: `#2D6A4F`(green) 또는 `#C75B3A`(terra) 중 하나를 주색으로 선택한다.
4. **본문 강조색**: 16px 이하 본문에는 `--terra-800` / `--green-800`만(§7 대비 규칙).
5. **보더**: `1px solid rgba(38,37,30,0.10)` 이상 두껍게 쓰지 않는다.
6. **태그**: `font-family: Space Mono`, `border-radius: 9999px` 필수.
7. **숫자**: `Noto Serif KR` + `letter-spacing: -2px`(대형 지표 숫자).
8. **본문 조판**: line-height 1.75, 왼쪽 정렬, 한 줄 35~45자(§7-3).
9. **접근성**: 모든 인터랙티브 요소에 `:focus-visible` 링, 색 단독 정보전달 금지.
10. **절대 금지**: 파란색 계열(#0071e3, #2997ff 등), 보라색 계열, 순백 단독 배경, 과도한 그라디언트, justify 정렬.
11. **사이트 목적** 확인 후 §8 톤 가이드를 따른다.

---

## 부록 A. CSS 변수 일괄 선언

```css
:root {
  /* Green */
  --green-900:#1B4332; --green-800:#2D6A4F; --green-600:#40916C;
  --green-400:#52B788; --green-100:#D8F3DC; --green-50:#F0FAF3;
  /* Terracotta */
  --terra-800:#B85030; --terra-600:#C75B3A; --terra-400:#E07A5F;
  --terra-100:#FAECE7; --terra-50:#FDF5F2;
  /* Neutral */
  --canvas:#F2F1ED; --surface:#EBEAE5; --surface-2:#E3E2DC;
  --ink:#26251E; --ink-mid:#5A5850; --ink-faint:#9A9890;
  --border:rgba(38,37,30,0.10); --border-md:rgba(38,37,30,0.18);
  /* Shadow */
  --shadow-sm:0 1px 2px rgba(38,37,30,.04),0 4px 16px rgba(38,37,30,.05);
  --shadow-md:0 2px 8px rgba(38,37,30,.06),0 8px 24px rgba(38,37,30,.04),0 20px 48px rgba(38,37,30,.03);
}
body {
  background: var(--canvas);
  color: var(--ink);
  font-family: 'Noto Sans KR', system-ui, sans-serif;
  font-size: 16px; line-height: 1.75; letter-spacing: -0.15px;
  text-align: left;
}
h1,h2,h3 { font-family:'Noto Serif KR', serif; color: var(--green-800); }
```

## 부록 B. Tailwind 토큰 매핑

```ts
// tailwind.config.ts → theme.extend.colors
colors: {
  forest: { 50:'#F0FAF3',100:'#D8F3DC',400:'#52B788',600:'#40916C',800:'#2D6A4F',900:'#1B4332' },
  terra:  { 50:'#FDF5F2',100:'#FAECE7',400:'#E07A5F',600:'#C75B3A',800:'#B85030' },
  canvas:'#F2F1ED', surface:'#EBEAE5','surface-2':'#E3E2DC',
  ink:'#26251E','ink-mid':'#5A5850','ink-faint':'#9A9890',
}
```

---

## 참고: 현재 운영 중인 소이랩 자산

- 본사: soilabcoop.kr (Next.js + Notion API + Vercel)
- 청년 필드허브: soilab-youth.kr
- 채용 포털: recruit.soilabcoop.kr (Next.js 15 + Supabase)
- 고립은둔 사업: 대구 남구 고립은둔청년지원센터
- 청년다다름사업: 대구제작소 (2026 운영)
- 주요 발행물: "다시, 봄" 성과 사례집

---

*이 파일은 Claude Code, V0, Cursor, Codex 등 AI 코딩·문서 도구의 프로젝트 루트에 위치시켜 사용합니다.*
*v1.0: 2026.04.12 / v1.1: 2026.06.05 (§3 폰트 로딩 · §7 가독성·접근성 신설 · 부록 A·B 추가)*
