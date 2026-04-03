---
title: "자바스크립트 기초와 DOM 제어"
date: 2026-04-01
authors: HyungJun
tags: [Web]
---

`DOM` `이벤트` `스코프` `클로저` `이벤트전파`

HTML/CSS가 만든 정적 문서를 동적으로 바꾸는 자바스크립트의 핵심 개념 — 스크립트 적용 방식, 실행 순서 제어, DOM 탐색/변경, 변수 함정, 함수 일급 객체, 이벤트 전파 제어까지 실습 중심으로 정리합니다.

<!-- truncate -->

---

## 1. 자바스크립트란 & 적용 방식

**정적 문서(HTML/CSS)를 이벤트 기반으로 동적으로 변경하는 언어.** DOM(Node Tree)에서 엘리먼트를 탐색하고, 이벤트 발생 시 상태를 바꾸는 흐름이 전부다.

| 방식 | 형태 | 특징 |
|---|---|---|
| 인라인 | `onclick="fn()"` | 빠르지만 유지보수 불리. 따옴표 중첩 주의 |
| 임베드 | `<script>...</script>` | 문서 어디든 가능, 작성 순서가 실행 순서 |
| 링크드 | `<script src="app.js">` | 코드 분리/재사용. 실무 기본 형태 (`href` 아니라 `src`) |

---

## 2. 실행 순서 제어

**DOM이 그려지기 전에 탐색하면 `null`이 반환된다.** 스크립트 위치와 4가지 제어 수단으로 실행 시점을 명확히 고정해야 한다.

| 수단 | 의미 | 선택 기준 |
|---|---|---|
| 스크립트 위치(Body 끝) | 렌더링 완료 후 실행 보장 | 단순한 경우 가장 직관적 |
| `defer` | 파싱 완료 후 실행, 다운로드는 병렬 | Head에 두고 실행만 미룰 때 |
| `window.onload` | HTML + 리소스 전부 로드 후 실행 | 이미지 등 리소스 의존 초기화 |
| `DOMContentLoaded` | DOM 파싱 완료 즉시 실행 | DOM만 필요한 초기화에 권장 |

```javascript
// window.onload는 중복 정의 시 덮어써진다
// 협업 환경에서는 addEventListener 패턴을 권장
document.addEventListener('DOMContentLoaded', () => {
  // 안전한 DOM 초기화
})
```

> **함정:** 같은 이름 함수를 재선언하면 아래쪽이 덮어쓴다. 프레임워크 코드와 혼용 시 내 스크립트는 항상 하단에 배치.

---

## 3. DOM 탐색 API

| API | 반환 형태 | 특징 |
|---|---|---|
| `getElementById` | 단일 엘리먼트 | id 유일성 전제. 탐색 실패 시 `null` |
| `getElementsByTagName` | HTMLCollection | 복수 결과, 인덱스 접근 |
| `getElementsByName` | NodeList | 폼 전송 name 기반 탐색에 적합 |
| `querySelector` | 단일 노드 | CSS 선택자(`#id`, `.class`) 그대로 사용 |
| `querySelectorAll` | NodeList | 항상 리스트 반환, 인덱싱 필요 |

- `HTMLCollection` / `NodeList`는 배열이 아님 → `forEach` 쓰려면 변환 필요

```javascript
// 컬렉션 → 배열 변환 후 고차 함수 적용
Array.from(document.getElementsByTagName('fieldset'))
  .forEach(el => el.style.backgroundColor = 'yellow')
```

---

## 4. 콘텐츠·스타일·속성 변경

**DOM 탐색 결과는 객체다.** `alert(el)` 하면 의미 없는 객체 표현이 나온다. 값은 속성으로 꺼내야 한다.

| 목적 | 속성 | 대상 |
|---|---|---|
| 폼 입력값 읽기/쓰기 | `.value` | `input`, `select`, `textarea` |
| HTML 포함 콘텐츠 | `.innerHTML` | 마크업 삽입 허용 |
| 순수 텍스트 | `.textContent` | 태그 없이 텍스트만 |
| 스타일 변경 | `.style.fontWeight` | CSS 하이픈 → 카멜케이스 |
| HTML 속성 변경 | `el.title = '...'` | 객체 프로퍼티로 직접 대입 |

---

## 5. 이벤트 연결 패턴

```javascript
// 인라인 - 학습용, 소규모
<button onclick="fn(this.value)">클릭</button>

// addEventListener - 실무 기본
document.getElementById('btn')
  .addEventListener('click', function(e) {
    // e.target으로 이벤트 발생 요소 접근
  })
```

> 실서비스 HTML 소스에는 인라인 이벤트가 거의 없다. id 탐색 후 리스너 부착 패턴이 압도적으로 많다.

---

## 6. 변수·스코프·동적 타입 함정

**전역 변수와 같은 이름을 함수 내부에서 `var`로 재선언하면 전역이 아닌 내부 스코프로 처리된다.** 초기화 전 접근 → `undefined` → 산술 연산 → `NaN`.

```javascript
var score = 100

function check() {
  console.log(score)  // undefined (전역이 아님!)
  var score = 50      // 내부 재선언 → 호이스팅으로 선언만 올라감
}
```

| 구분 | 선언 전 접근 | 결과 |
|---|---|---|
| `var` | 가능 | `undefined` |
| `let` / `const` | 불가 (TDZ) | `ReferenceError` |

- `undefined + 99` → `NaN` (Not a Number, `typeof`는 여전히 `number`)
- `null`은 의도적 빈 값 (`typeof` → `object`), `undefined`는 미정 (`typeof` → `undefined`)
- DOM 탐색 실패 결과는 `null`, 탐색 성공 후 값 미존재는 `undefined`

---

## 7. 함수: 익명함수·콜백·클로저

**함수는 값이다.** 변수에 담기고, 인자로 전달되고, 반환될 수 있다.

```javascript
// 명시적 함수
function greet(name) { return `Hello ${name}` }

// 익명함수 (변수에 담기)
const greet = function(name) { return `Hello ${name}` }

// 함수 리터럴 (인자로 전달 = 콜백)
setTimeout(function() { console.log('1초 후') }, 1000)
```

**클로저:** 내부 함수가 외부 함수의 변수를 기억하고, 반환 후에도 그 값을 유지하는 구조.

```javascript
function makeCounter(start) {
  var count = start          // 외부 변수
  return function() {        // 내부 함수 반환
    return ++count           // 반환 후에도 count 기억
  }
}
const counter = makeCounter(0)
counter()  // 1
counter()  // 2
```

> Ajax, Promise, async/await, React Hook의 기반 사고방식. "함수가 들어가서 함수가 나온다" 흐름을 읽을 수 있어야 한다.

---

## 8. setInterval/clearInterval — 시계 실습

```javascript
var handle  // 전역 저장 필수 (clearInterval에서 참조)

function startClock() {
  handle = setInterval(function() {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')
    document.getElementById('clock').textContent = `${hh}:${mm}:${ss}`
  }, 1000)
}

function stopClock() {
  clearInterval(handle)  // handle을 전역에 두지 않으면 중지 불가
}
```

- `padStart(2, '0')` → 한 자리 수를 `'05'` 형태로 포맷
- 인터벌 핸들을 지역 변수로 선언하면 외부에서 `clearInterval` 불가 → 반드시 전역 또는 상위 스코프에 보관

---

## 9. 이벤트 전파(Propagation) 제어

**자식 요소 클릭 → 부모 이벤트까지 연쇄 실행.** 3가지 차단 수단 역할이 다르다.

| 목적 | 방법 | 대표 예 |
|---|---|---|
| 전파만 차단 | `event.stopPropagation()` | 자식 클릭 시 부모 클릭 차단 |
| 기본 동작 차단 | `event.preventDefault()` | `<a>` 이동, submit, 드래그 차단 |
| 둘 다 차단 | `return false` | 인라인 이벤트에서 빠른 처리 |

```javascript
// 폼 유효성 검사 패턴
form.addEventListener('submit', function(e) {
  if (document.getElementById('email').value === '') {
    e.preventDefault()    // 전송 차단
    alert('이메일을 입력하세요')
  }
})
```

---

## 10. 체크박스 전체선택

```javascript
window.onload = function() {
  const allCheck = document.getElementById('allCheck')
  const items = document.getElementsByName('chk')

  // 전체 체크/해제
  allCheck.addEventListener('change', function() {
    Array.from(items).forEach(el => el.checked = this.checked)
  })

  // 개별 해제 시 전체 체크 자동 해제
  Array.from(items).forEach(el => {
    el.addEventListener('change', function() {
      allCheck.checked = Array.from(items).every(c => c.checked)
    })
  })
}
```

- 체크박스 상태는 `.value`(항상 `"on"`)가 아니라 `.checked`(boolean)로 읽어야 한다
- 서버로 전달하는 다중 값은 `name` 속성 기준으로 키-밸류 구성 → `getElementsByName` 탐색이 정석

---

## 선택 기준 요약

| 상황 | 선택 |
|---|---|
| DOM 초기화 코드 위치 | `DOMContentLoaded` (리소스 대기 불필요) |
| 이미지 포함 초기화 | `window.onload` |
| 이벤트 연결 방식 | `addEventListener` (협업 시 인라인 지양) |
| 컬렉션 반복 | `Array.from().forEach()` |
| 값 vs 타입 비교 | `===` 우선 |
