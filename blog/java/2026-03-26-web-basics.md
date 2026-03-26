---
title: "웹 기초 — HTML / CSS 핵심 정리"
date: 2026-03-26
authors: HyungJun
tags: [Web]
---

`meta` `viewport` `DOM` `CSS 선택자` `box model` `Bootstrap` `개발자도구`

VS Code + Live Server 환경 구성부터 HTML 메타·폼·DOM·이벤트, CSS 선택자 우선순위·박스 모델·테이블 병합·Bootstrap 적용까지 웹 기초 전체를 정리합니다.

<!-- truncate -->

---

### **1. VS Code + Live Server 환경 구성**

| 항목 | 설정 위치 | 목적 |
| :--- | :--- | :--- |
| Workspace Trust | 폴더 오픈 시 | 보안 차단 해제, 확장 동작 허용 |
| Live Server 설치 | Extensions | 저장 시 브라우저 자동 갱신 |
| Custom Browser | Live Server Settings | Chrome으로 실행 브라우저 지정 |
| Use Local IP | Live Server Settings | 로컬 IP로 서버 실행 |

HTML 파일 생성 후 `html` 입력 → Emmet 자동 템플릿, "Open with Live Server"로 실행합니다.

---

### **2. HTML 기본 구조와 메타 태그**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="5; url=https://naver.com"> <!-- 5초 후 이동 -->
    <title>페이지 제목</title>
    <link rel="shortcut icon" href="favicon.ico">
</head>
<body>
    <!-- 화면 출력 콘텐츠 -->
</body>
</html>
```

| 요소 | 역할 |
| :--- | :--- |
| `meta charset` | 문자 인코딩 지정 |
| `meta viewport` | 반응형 렌더링 기준 (`width=device-width, initial-scale=1`) |
| `meta refresh` | 시간 기반 리디렉션 |
| `title` | 브라우저 탭 제목 |
| `link shortcut icon` | 파비콘 (탭 아이콘) |

---

### **3. 폼 + DOM + 이벤트**

```html
<fieldset>
    <legend>네이버 검색</legend>
    <input type="text" id="keyword" placeholder="검색어 입력">
    <button onclick="search()">검색</button>
</fieldset>

<script>
    function search() {
        const kw = document.getElementById("keyword").value;
        console.log("검색어:", kw);
        location.href = "https://search.naver.com/search.naver?query=" + kw;
    }
</script>
```

| API | 역할 |
| :--- | :--- |
| `document.getElementById()` | ID 기반 DOM 요소 탐색 |
| `.value` | input 입력값 읽기 |
| `console.log()` | 브라우저 콘솔 출력 |
| `location.href` | URL 이동 |
| `alert()` | 팝업 메시지 |

---

### **4. CSS 연결 방식 3가지**

| 방식 | 위치 | 특징 |
| :--- | :--- | :--- |
| 인라인 | 태그 `style` 속성 | 우선순위 최강, 재사용 불가 |
| 임베디드 | `<head>` 안 `<style>` 블록 | 해당 페이지만 적용 |
| 링크드 | `<link rel="stylesheet" href="...">` | 외부 파일, 여러 페이지 공유 |

---

### **5. 선택자 우선순위 — 점수 모델**

| 선택자 | 표기 | 점수 |
| :--- | :--- | :--- |
| 태그 | `h1` | 1점 |
| 클래스 | `.a1` | 10점 |
| ID | `#a` | 100점 |
| 복합 | `h1#a` | 101점 (1+100) |

- 점수가 같으면 **나중에 작성된 규칙이 앞선 규칙을 덮어씁니다**.
- Bootstrap 위에 내 스타일을 적용하려면 **Bootstrap `<link>` 아래에** 내 CSS `<link>`를 배치합니다.
- 클래스는 여러 개 부여 가능 → 역할별 분리 재사용에 적합
- ID는 문서 내 유일해야 합니다.

---

### **6. 박스 모델 — margin / padding / border**

```
┌──────────────────────────────┐  ← margin (외부 여백)
│  ┌──────────────────────┐    │
│  │  border (테두리)      │    │
│  │  ┌────────────────┐  │    │
│  │  │  padding       │  │    │
│  │  │  (내부 여백)    │  │    │
│  │  │  [콘텐츠]      │  │    │
│  │  └────────────────┘  │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

**margin/padding 단축 규칙:**

| 값 개수 | 적용 방향 | 예시 |
| :--- | :--- | :--- |
| 1개 | 4방향 동일 | `margin: 10px` |
| 2개 | 위아래 / 좌우 | `margin: 10px 0` |
| 4개 | 위 / 오른쪽 / 아래 / 왼쪽 | `margin: 10px 5px 10px 5px` |

```css
/* border 단축 표기 후 특정 방향만 오버라이드 */
border: 1px solid #ccc;
border-bottom: 2px solid #000;
```

---

### **7. 테이블 — 병합과 표준 구조**

```html
<table>
    <thead>
        <tr>
            <th colspan="2">병합된 헤더</th>  <!-- 가로 2칸 병합, 다음 th 제거 필요 -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan="2">세로 2칸 병합</td>  <!-- 다음 tr의 해당 td 제거 필요 -->
            <td>내용1</td>
        </tr>
        <tr>
            <td>내용2</td>
        </tr>
    </tbody>
</table>
```

병합된 만큼 상대 셀을 **반드시 제거**해야 컬럼 수가 맞습니다. `thead/tbody/tfoot`은 기능이 강제되지는 않지만 구조 명확성을 위해 표준으로 사용합니다.

**Bootstrap 테이블:**
```html
<table class="table table-striped table-bordered table-hover">
```

---

### **8. 개발자도구로 UI 복사**

```
F12 → 요소 선택 → Copy element → HTML 조각 확보
   → 소스에서 CSS link 확인 → CSS 파일 저장
   → 로컬 프로젝트 배치 → link로 연결 → 내 CSS로 오버라이드
```

- CSS가 적용 안 될 때는 개발자도구 Network 탭에서 CSS 요청이 200인지 확인합니다.
- 태그를 암기하는 것보다 **노드 트리 구조와 CSS 적용 관계를 읽는 능력**이 핵심입니다.
