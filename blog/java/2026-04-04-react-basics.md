---
title: "리액트 기초: 생성, 렌더링, 훅"
date: 2026-04-04
authors: HyungJun
tags: [Web, React]
---

`Vite` `JSX` `Props` `useState` `useEffect` `useRef` `Bootstrap`

Vite 기반 리액트 앱 생성부터 SPA 렌더링 흐름, Props·상태 훅·사이드 이펙트 훅·DOM 참조 훅·배열 렌더링·폼 제어까지 — 리액트 입문에서 실무 기초까지 한 편에 압축한다.

<!-- truncate -->

---

## 1. 작업환경과 패키지 도구

**Node.js가 없으면 리액트 프로젝트를 실행할 수 없다.** 자바스크립트를 브라우저 밖에서 실행할 런타임이 필요하고, 의존성 관리는 NPM이 담당한다.

```bash
node -v
npm -v
npx -v
```

| 구분 | 핵심 목적 | 대표 사용 맥락 |
|---|---|---|
| Node.js | 자바스크립트 런타임 | 로컬 개발 서버, 빌드 도구 실행 |
| NPM | 패키지 설치·의존성 관리 | `npm i`, 프로젝트 라이브러리 관리 |
| NPX | 패키지 일회성 실행 | `npx create-...`, 스캐폴딩 도구 |

VS Code에서는 스니펫 확장으로 컴포넌트 코드를 자동 생성한다.

| 스니펫 | 생성 형태 |
|---|---|
| `rfc` | 함수형 컴포넌트 |
| `rafc` | 화살표 함수형 컴포넌트 |
| `rcc` | 클래스형 컴포넌트 |

---

## 2. Vite로 리액트 생성과 실행

**`package.json`은 Maven의 `pom.xml`에 해당한다.** 의존성 선언 파일이므로 `npm i`로 `node_modules`를 구성해야 실행이 가능하다.

```bash
npm create vite@latest CH01_props -- --template react
cd CH01_props
npm i          # package.json 기반 의존성 설치
npm run dev    # http://localhost:5173
```

> **주의:** 명령은 반드시 프로젝트 루트(모듈 폴더)에서 실행해야 한다. 워크스페이스 상위 폴더에서 실행하면 의도한 프로젝트가 아닌 위치를 참조한다.

---

## 3. App.jsx, 컴포넌트, Fragment

**리액트 반환 JSX는 반드시 단일 루트로 감싸야 한다.** `div`로 래핑하면 DOM 노드가 추가되므로, 레이아웃 부작용을 피하려면 Fragment를 쓴다.

| 방식 | 예시 | 특징 |
|---|---|---|
| `div` 래핑 | `<div>...</div>` | DOM 노드 추가, 스타일 영향 가능 |
| Fragment | `<>...</>` | DOM 노드 없이 묶음만 제공 |

```jsx
import Hello from "./Hello.jsx";

function App() {
  return (
    <>
      <Hello />   {/* JSX 주석은 {/* */} 형태로 작성 */}
    </>
  );
}

export default App;
```

`.jsx` 확장자는 JSX 의도를 명시하고 스니펫 자동 완성을 보장한다.

---

## 4. 렌더링 구조와 SPA 흐름

**SPA는 서버에서 HTML을 다시 받는 "리플래시" 없이, 상태 변화에 의한 "렌더링"으로 화면을 갱신한다.**

```
index.html (div#root)
  └── main.jsx : createRoot().render(<App />)
        └── App.jsx : 하위 컴포넌트 조립
              ├── 컴포넌트
              └── axios 서비스 호출 → 백엔드 API → DB
```

| 역할 | 핵심 책임 | 기술 키워드 |
|---|---|---|
| 프론트엔드 | 컴포넌트 구성, 상태·이벤트 처리 | React, axios, 라우팅 |
| 백엔드 | 요청 처리, JSON 응답 | Spring Boot, `@GetMapping` |
| 데이터 계층 | DB CRUD, 매핑 | Oracle/MySQL, MyBatis/JPA |

- **리플래시** = 서버에서 HTML을 다시 요청하는 동작
- **렌더링** = 로드된 앱에서 상태 변화로 화면 일부를 다시 그리는 동작

---

## 5. JSX 주석과 CSS 적용

**JSX 반환 영역에서는 HTML 주석(`<!-- -->`)이 아닌 JSX 전용 주석을 사용해야 한다.**

| 위치 | 주석 문법 |
|---|---|
| 컴포넌트 함수 내부(일반 JS) | `//`, `/* */` |
| JSX 반환 영역 | `{/* 주석 */}` |

CSS 적용은 두 가지 방식을 상황에 맞게 선택한다.

```jsx
// 1. 인라인 스타일 (우선순위 높음, 재사용 불리)
const cssStyle = { backgroundColor: "black", color: "white" };
return <div style={cssStyle}>내용</div>;

// 2. CSS 파일 + className (HTML의 class 대신 className)
return <div className="circle"></div>;
```

> 프로젝트에 `index.css`, `App.css` 등 여러 CSS가 중첩 적용될 수 있다. 어떤 파일이 import되어 있는지 항상 추적해야 한다.

---

## 6. Props 값 전달과 비구조 할당

**Props는 부모→자식 단방향 데이터 전달 객체다.**

```jsx
// 부모: 속성으로 값 전달
<Hello name="형준" />

// 자식: props 객체로 수신
function Hello(props) {
  return <div>{props.name}</div>;
}

// 비구조 할당으로 간결하게
function Hello({ name }) {
  return <div>{name}</div>;
}
```

- 같은 컴포넌트를 여러 번 렌더링해 서로 다른 Props를 전달할 수 있다
- 전달하지 않은 값에는 기본값(defaultProps 패턴)을 설정해 안전하게 처리한다

---

## 7. useState: 상태 선언과 객체 갱신

**`useState`는 값이 변경될 때 렌더링을 트리거하는 상태다.** 일반 변수는 렌더링마다 초기화되지만, state는 값이 보존된다.

```jsx
const [firstName, setFirstName] = useState("초기값");
```

입력 필드가 많으면 개별 state보다 객체로 묶어 관리하는 게 유리하다.

```jsx
const [info, setInfo] = useState({ name: "", phone: "", address: "" });

// 스프레드로 기존 값 유지 + 특정 키만 덮어쓰기
setInfo({
  ...info,
  phone: "010-0000-0000",
});
```

> **함정:** `onClick={alert("...")}` — 렌더링 시 즉시 실행된다. 반드시 `onClick={() => alert("...")}` 처럼 콜백으로 전달해야 한다.

---

## 8. 상태 업데이트 비동기와 함수형 업데이트

**상태 업데이트는 비동기 처리될 수 있다.** 현재 값에 의존하는 업데이트는 이전 값을 인자로 받는 함수형 패턴을 써야 클릭 연타·배치 처리 환경에서 누락이 없다.

```jsx
// 단순 업데이트 (배치 환경에서 누락 가능)
setCount(count + 1);

// 함수형 업데이트 (이전 값 보장)
setCount((prev) => prev + 1);
```

코드가 복잡해지면 인라인 onClick보다 별도 함수를 분리해 가독성을 높인다.

---

## 9. useEffect: 사이드 이펙트와 dependency 배열

**`useEffect`는 렌더링 완료 후 실행되는 콜백이다.** dependency 배열로 실행 조건을 제어한다.

| dependency | 실행 타이밍 | 대표 사용 예 |
|---|---|---|
| 생략 | 매 렌더링마다 | 디버깅 로그 |
| `[]` | 최초 1회 | 초기 데이터 로딩, 로그인 체크 |
| `[count]` | `count` 변화 시 | 특정 상태 감지 후 처리 |

```jsx
useEffect(() => {
  console.log("마운트 시 1회 실행");

  return () => {
    console.log("cleanup: 언마운트 또는 다음 effect 실행 전");
  };
}, []);
```

> **개발 환경 함정:** React StrictMode로 인해 로그가 2회 찍힐 수 있다. 배포 환경에서는 정상 1회 실행이다.

---

## 10. useRef: DOM 접근과 값 유지

**`useRef`는 렌더링을 유발하지 않으면서 값을 보존한다.** DOM 노드 참조나 렌더링과 무관한 값 저장에 쓴다.

```jsx
const inputRef = useRef(null);

// DOM API 직접 호출
inputRef.current.focus();
inputRef.current.value;

return <input ref={inputRef} />;
```

---

## 11. State, Ref, 일반 변수 비교

| 구분 | 값 유지 | 렌더링 유발 | 특징 |
|---|---|---|---|
| `useState` | 유지 | 유발 | UI 동기화 목적 |
| `useRef` | 유지 | 유발 안 함 | DOM 참조·비렌더링 값 저장 |
| 일반 변수 | 초기화 | 해당 없음 | 렌더링마다 재선언 |

---

## 12. 배열 렌더링(map)과 key

**JSX 표현식 내부에서 `array.map()`으로 리스트를 생성하고, 각 항목에 `key`를 부여한다.** JSX 표현식 내부에는 세미콜론을 쓰지 않는다.

```jsx
const arr = [1, 2, 3, 4];

return (
  <ul>
    {arr.map((num, idx) => (
      <li key={idx}>{num}</li>
    ))}
  </ul>
);
```

- `key`는 항목 식별과 렌더링 최적화를 위한 권고사항
- 실무에서는 인덱스보다 **고유 ID**를 사용한다 — 필터·삭제로 항목이 빠질 때 인덱스는 불안정하다

---

## 13. 테이블 렌더링

**서버 DTO 리스트를 받는 상황을 가정하고, 객체 배열을 `map`으로 순회해 `tr/td`를 생성한다.**

```jsx
{passport.map((item, idx) => (
  <tr key={idx}>
    <td>{item.id}</td>
    <td>{item.name}</td>
    <td>{item.address}</td>
  </tr>
))}
```

---

## 14. 이벤트 처리와 preventDefault

**폼 submit의 기본 동작(페이지 전환)은 SPA에서 반드시 막아야 한다.** `return false`는 리액트 이벤트 흐름에서 동작하지 않는다.

```jsx
const handleSubmit = (event) => {
  event.preventDefault();   // 페이지 전환 차단
  // 처리 로직
};

return (
  <form onSubmit={handleSubmit}>
    <input type="submit" value="전송" />
  </form>
);
```

| 메서드 | 역할 |
|---|---|
| `preventDefault()` | 기본 동작(전송·이동) 차단 |
| `stopPropagation()` | 이벤트 버블링 차단 |

---

## 15. Bootstrap 설치와 제어 컴포넌트 폼

**NPM으로 설치해 프로젝트 의존성으로 관리하고, `min.css`를 import한다.**

```bash
npm i bootstrap
```

```jsx
import "bootstrap/dist/css/bootstrap.min.css";
```

`value`만 걸고 `onChange`를 빠뜨리면 입력이 막힌다. **상태가 바뀌지 않으면 렌더링이 갱신되지 않기 때문**이다.

```jsx
const [user, setUser] = useState({ firstName: "", lastName: "", email: "" });

// name 속성 + 대괄호 표기로 하나의 핸들러가 여러 입력을 처리
const inputChange = (event) => {
  setUser({
    ...user,
    [event.target.name]: event.target.value,
  });
};

return (
  <input name="firstName" value={user.firstName} onChange={inputChange} />
);
```

---

## 선택 기준 요약

| 상황 | 선택 |
|---|---|
| 값 변경 → 화면 갱신 필요 | `useState` |
| DOM 직접 접근 / 렌더링 없이 값 보존 | `useRef` |
| 초기 데이터 로딩, 외부 구독 | `useEffect(fn, [])` |
| 특정 상태 변화 감지 | `useEffect(fn, [state])` |
| 현재 값 의존 업데이트 | 함수형 `setState((prev) => ...)` |
| 폼 입력 동기화 | 제어 컴포넌트 (`value` + `onChange`) |
| 다중 입력 단일 핸들러 | `[event.target.name]` + 스프레드 갱신 |
