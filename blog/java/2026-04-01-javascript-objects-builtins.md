---
title: "자바스크립트 객체, 내장 객체 완전 정리"
date: 2026-04-01
authors: HyungJun
tags: [Web]
---

`객체` `프로토타입` `Number` `String` `Array` `Date`

생성자 함수와 `this`를 통한 캡슐화, 프로토타입 기반 확장, Number/String/Array/Date 내장 객체의 핵심 특징과 실무 함정 — 개미수열 실습과 디데이 계산까지 정리합니다.

<!-- truncate -->

---

## 1. 객체 생성: 명시적(생성자) vs 익명(리터럴)

**`this`로 선언한 속성만 외부 접근 가능. 내부 `var`는 은닉된다.**

```javascript
function Member(name) {
  this.name = name         // public — 외부 접근 가능
  var secret = 'hidden'   // private — 외부 접근 불가

  this.getSecret = function() {  // getter로만 노출
    return secret
  }
}

const m = new Member('lion')
m.name         // 'lion'
m.secret       // undefined
m.getSecret()  // 'hidden'
```

- 생성자 함수 이름은 관례적으로 **PascalCase**
- 자바처럼 생성자 오버로딩은 기본 지원되지 않음 → 인자 유무로 분기해야 함

**리터럴(익명) 방식** — `new` 없이 즉시 생성, JSON과 동일 구조:

```javascript
const user = {
  name: 'tiger',
  greet() { return `Hi, ${this.name}` }
}
user.greet()  // 'Hi, tiger'
```

> 리터럴 객체의 모든 속성은 기본적으로 외부에 노출된 상태다. 민감한 상태 은닉이 필요하면 생성자 함수 패턴을 써야 한다.

---

## 2. 프로토타입 기반 확장

**생성자 `prototype`에 메서드를 추가하면 해당 생성자로 만든 모든 인스턴스가 공유한다.** 원본 코드를 건드리지 않고 기능을 덧붙이는 핵심 메커니즘.

```javascript
function Animal(name) {
  this.name = name
}

// 프로토타입에 메서드 추가 → 모든 인스턴스 공유
Animal.prototype.speak = function() {
  return `${this.name}이(가) 소리를 냅니다`
}

const lion = new Animal('사자')
lion.speak()  // '사자이(가) 소리를 냅니다'
```

- 콘솔에서 객체를 `+` 연산으로 출력하면 `[object Object]`로 보임 → 디버깅 시 콘솔 단독 출력(`console.log(obj)`)으로 확인할 것
- 실무에서는 직접 정의보다 이미 만들어진 프로토타입 기반 기능(내장 객체 메서드)을 활용하는 빈도가 높음

---

## 3. Number: 리터럴 vs 래퍼 객체

**DOM `.value`나 산술 결과는 항상 타입을 의심해야 한다.**

| 항목 | `typeof` | 특징 |
|---|---|---|
| `7` | `number` | 기본 숫자 리터럴 |
| `new Number(7)` | `object` | 래퍼 객체 — 비교 시 주의 |
| `NaN` | `number` | 숫자 변환 실패. `isNaN()`으로 판별 |
| `Infinity` | `number` | 0 나누기 결과 등 |

```javascript
7 == new Number(7)   // true  (타입 변환 후 비교)
7 === new Number(7)  // false (타입 포함 비교) ← 권장
```

- `/` 연산은 자바와 달리 실수 나눗셈 → 몫이 필요하면 `Math.floor()`
- 숫자 변환: `Number('3px')` → `NaN`, `parseInt('3px')` → `3`

---

## 4. DOM 입력 값 숫자 판별

**폼 `.value`는 항상 문자열.** 산술 연산 전에 반드시 형변환.

```javascript
const a = document.getElementById('num').value  // 문자열 '11'
a + 10   // '1110' (문자열 결합!)
Number(a) + 10  // 21 (숫자 연산)
```

숫자 판별 2가지 패턴:

```javascript
// 방법 1 — isNaN + parseInt
if (!isNaN(parseInt(input))) { ... }

// 방법 2 — 정규표현식 (엄격한 입력 제어)
if (/^\d+$/.test(input)) { ... }
// test() → true/false
// match() → 매칭 객체 반환 (if 판별 가능)
```

---

## 5. String: 검색·추출·분해

```javascript
const s = '자바스크립트'

s.indexOf('스크')          // 3 (앞에서 첫 번째 위치)
s.lastIndexOf('스')        // 4 (뒤에서 검색)
s.substring(2, 5)          // '스크립' (end 미포함)
s.split('')                // ['자','바','스','크','립','트']
s.charAt(0)                // '자'
s.length                   // 6
```

> `split(구분자)` 시 구분자가 연속되면 빈 문자열이 결과에 포함돼 배열 길이가 예상보다 커진다. `'a__b'.split('_')` → `['a','','b']`

---

## 6. 실습: 개미수열

**현재 문자열을 순회하며 연속된 같은 문자의 개수를 세고, `개수+문자` 형태로 다음 단계 문자열을 생성.**

```javascript
// 한 단계 생성 함수
function nextStage(str) {
  let result = ''
  let i = 0
  while (i < str.length) {
    const ch = str.charAt(i)
    let count = 0
    while (i < str.length && str.charAt(i) === ch) {
      count++
      i++
    }
    result += count + ch
  }
  return result
}

// 화면 출력
function antQuiz() {
  const steps = parseInt(document.getElementById('steps').value)
  let current = '1'
  let output = current + '<br>'
  for (let i = 1; i < steps; i++) {
    current = nextStage(current)
    output += current + '<br>'
  }
  document.getElementById('result').innerHTML = output  // 태그 포함 → innerHTML
}
```

- 마크업(`<br>`)이 포함되므로 `textContent`가 아니라 `innerHTML` 사용
- 입력 단계는 문자열이므로 `parseInt()` 명시 권장

---

## 7. 형변환 요약 & eval 주의

| 함수 | 입력 `'3.14'` | 입력 `'3px'` | 특징 |
|---|---|---|---|
| `Number()` | `3.14` | `NaN` | 전체가 숫자여야 변환 |
| `parseInt()` | `3` | `3` | 앞부분 정수만 파싱 |
| `parseFloat()` | `3.14` | `3` | 앞부분 실수까지 파싱 |

```javascript
// eval — 문자열 수식 계산 가능하지만 임의 코드 실행 위험
eval('1 + 10 + 5/5')  // 12
// 실무에서는 수식 파서 라이브러리 대체 권장
```

---

## 8. Array: 정렬·반복·스택/큐

```javascript
const arr = [3, 1, 10, 2]

arr.sort()              // ['1','10','2','3'] — 문자열 정렬!
arr.sort((a, b) => a - b)  // [1, 2, 3, 10] — 숫자 오름차순
arr.sort((a, b) => b - a)  // [10, 3, 2, 1] — 숫자 내림차순
```

반복 4가지:

```javascript
// 인덱스 for — 범용
for (let i = 0; i < arr.length; i++) { ... }

// for...of — 값 중심 순회
for (const v of arr) { ... }

// forEach — 콜백 기반
arr.forEach((v, i) => { ... })

// for...in — 키(인덱스) 열거, 배열엔 주의
for (const key in arr) { ... }
```

스택/큐 패턴:

```javascript
arr.push(v)    // 뒤에 추가
arr.pop()      // 뒤에서 제거 (스택 pop)
arr.shift()    // 앞에서 제거 (큐 dequeue)
arr.unshift(v) // 앞에 추가

arr.slice(1, 3)  // 원본 불변, 부분 복제
```

- `typeof 배열` → `object` — 배열 판별은 `Array.isArray()` 사용
- 존재하지 않는 인덱스 → 예외 아닌 `undefined` 반환

---

## 9. Date: 포맷·날짜 더하기·디데이

```javascript
const now = new Date()
now.getFullYear()   // 2026
now.getMonth() + 1  // 4  ← getMonth()는 0부터 시작!
now.getDate()       // 1
now.getDay()        // 요일 (0=일, 6=토)
```

**input[type=date] 자동 세팅:**

```javascript
window.onload = function() {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  document.getElementById('datePicker').value = `${yyyy}-${mm}-${dd}`
}
```

**날짜 더하기:**

```javascript
const d = new Date('2026-04-01')
d.setDate(d.getDate() + 7)  // 7일 후
```

**디데이 / 경과일 계산:**

```javascript
const target = new Date('2026-12-31')
const today = new Date()
const diff = target.getTime() - today.getTime()
const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
// getTime() → 밀리초 단위 절대값
```

> `NaN` 발생 원인 1순위 — id 중복 또는 탐색 실패로 `.value`를 못 읽는 경우. `getElementById` 결과를 콘솔에서 먼저 확인할 것.

---

## 선택 기준 요약

| 상황 | 선택 |
|---|---|
| 상태 은닉 필요 | 생성자 함수 + `var` (private) |
| 단순 데이터 묶음 | 리터럴 객체 `{}` |
| 기능 공유 (메모리 효율) | 프로토타입에 메서드 추가 |
| 배열 숫자 정렬 | `sort((a,b) => a-b)` 반드시 명시 |
| 날짜 월 출력 | `getMonth() + 1` 잊지 말 것 |
| 수식 계산 | `eval` 대신 파서 라이브러리 고려 |
