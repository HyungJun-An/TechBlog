---
title: "Java String 에 대하여 "
date: 2026-03-07
authors: HyungJun
tags: [Java, 기본기]
---

Java에서 문자열을 다루는 세 가지 클래스 `String`, `StringBuilder`, `StringBuffer`의 핵심 차이를 불변성과 동기화 개념을 중심으로 정리합니다.

<!-- truncate -->

### **1. 불변(Immutable)의 기초: `String` 클래스**

`String` 클래스의 가장 핵심적인 특징은 **'불변(Immutable)'** 입니다. 즉, 한번 생성되면 그 안에 담긴 값을 절대 변경할 수 없습니다.

만약 기존 문자열에 `+` 연산을 사용해 새로운 내용을 추가하면, 기존 객체의 값이 바뀌는 것이 아니라 **완전히 새로운 String 객체가 메모리에 생성**됩니다. 소스 컨텍스트에서도 `String`은 "데이터 불변"이라고 명확히 정의하고 있죠.

이러한 불변성의 장단점은 명확합니다.

- **장점**: 한 번 생성된 값은 변하지 않으므로, 여러 곳에서 참조하더라도 데이터가 오염될 걱정이 없습니다. 이는 데이터의 **신뢰성과 안정성**을 높여줍니다.
- **단점**: 문자열을 자주 변경(추가, 수정, 삭제)하는 작업을 할 경우, 매번 새로운 객체가 생성되면서 메모리를 비효율적으로 사용하게 되고 성능 저하의 원인이 될 수 있습니다.

따라서 `String`은 값이 변경될 일이 거의 없는 **단순 자료형**으로 사용할 때 가장 이상적입니다.

그렇다면 Java는 불변인 `String` 객체를 무작정 새로 만들기만 할까요? 사실 JVM 내부에는 메모리 낭비를 막기 위한 영리한 장치가 숨어 있습니다.

### **2. String Pool: 메모리 절약의 비밀**

JVM의 **Heap 메모리** 안에는 **'String Pool'** (또는 String Intern Pool)이라는 특별한 공간이 존재합니다. 동일한 문자열 리터럴이 중복 생성되는 것을 막아 **메모리를 절약**하기 위한 장치입니다.

**리터럴 방식 (`""`)으로 생성할 때**

```java
String a = "hello";
String b = "hello";
```

JVM은 `"hello"`를 처음 만들 때 String Pool에 저장합니다. 이후 같은 값인 `"hello"`를 다시 만들면, **새 객체를 생성하지 않고 Pool에 있는 기존 객체의 주소를 그대로 재사용**합니다. 즉 `a`와 `b`는 **같은 객체**를 가리킵니다.

```
Heap Memory
┌─────────────────────────────┐
│   String Pool               │
│   ┌─────────┐               │
│   │ "hello" │ ◄── a, b 모두 │
│   └─────────┘               │
└─────────────────────────────┘
```

**`new` 키워드로 생성할 때**

```java
String c = new String("hello");
String d = new String("hello");
```

`new`를 사용하면 String Pool을 **무시**하고, Heap의 일반 영역에 **매번 새로운 객체를 강제로 생성**합니다. `c`와 `d`는 값은 같지만 서로 다른 객체입니다.

```
Heap Memory
┌─────────────────────────────┐
│   String Pool               │
│   ┌─────────┐               │
│   │ "hello" │               │
│   └─────────┘               │
│                             │
│   일반 Heap 영역            │
│   ┌─────────┐ ┌─────────┐   │
│   │ "hello" │ │ "hello" │   │
│   └────▲────┘ └────▲────┘   │
│        c            d       │
└─────────────────────────────┘
```

이 차이가 바로 개발자들이 자주 혼란을 겪는 **문자열 비교 문제**의 원인이 됩니다.

### **3. `==` vs `equals()`: 주소 비교 vs 값 비교**

String Pool의 동작 방식을 이해하면, 왜 `==`와 `equals()`의 결과가 다른지 명확히 알 수 있습니다.

- `==` : 두 변수가 **같은 객체(주소)를 가리키는지** 비교합니다.
- `equals()` : 두 문자열의 **실제 값(내용)이 같은지** 비교합니다.

```java
String a = "hello";
String b = "hello";
String c = new String("hello");
String d = new String("hello");

// == 비교 (주소 비교)
System.out.println(a == b);      // true  → 같은 Pool 객체를 가리킴
System.out.println(a == c);      // false → Pool vs Heap, 다른 객체
System.out.println(c == d);      // false → Heap에 각각 생성된 다른 객체

// equals() 비교 (값 비교)
System.out.println(a.equals(b)); // true  → 값이 동일
System.out.println(a.equals(c)); // true  → 값이 동일
System.out.println(c.equals(d)); // true  → 값이 동일
```

**`hashCode()`로 같은 Pool 객체임을 확인하기**

`hashCode()`는 객체의 **메모리 주소를 기반으로 생성된 정수값**을 반환합니다. 같은 객체라면 반드시 같은 `hashCode`를 가집니다.

```java
String a = "hello";
String b = "hello";
String c = new String("hello");

System.out.println(a.hashCode()); // 99162322
System.out.println(b.hashCode()); // 99162322  ← a와 동일 (같은 Pool 객체)
System.out.println(c.hashCode()); // 99162322  ← 값 기반이라 동일하게 나옴

System.out.println(System.identityHashCode(a)); // 예: 460141958
System.out.println(System.identityHashCode(b)); // 예: 460141958 ← 동일!
System.out.println(System.identityHashCode(c)); // 예: 1163157884 ← 다름!
```

> 💡 `String`의 `hashCode()`는 **값 기반**으로 오버라이드되어 있어 `c`도 같은 값이 나옵니다.
> 진짜 객체 주소를 확인하려면 `System.identityHashCode()`를 사용해야 합니다.

**`equals()`와 `hashCode()` 오버라이드 규칙**

Java에서 `equals()`를 재정의할 때는 반드시 `hashCode()`도 함께 재정의해야 합니다. `String` 클래스가 좋은 예입니다.

```java
// String 클래스 내부 (개념적 표현)
@Override
public boolean equals(Object obj) {
    if (this == obj) return true;
    if (!(obj instanceof String)) return false;
    String other = (String) obj;
    return Arrays.equals(this.value, other.value); // 값(char 배열) 비교
}

@Override
public int hashCode() {
    int h = 0;
    for (char c : value) {
        h = 31 * h + c; // 값 기반 해시 계산
    }
    return h;
}
```

이처럼 `String`은 `equals()`와 `hashCode()` 모두 **값 기반**으로 오버라이드되어 있기 때문에, `HashMap`이나 `HashSet` 같은 컬렉션에서도 문자열 값을 기준으로 정상 동작할 수 있습니다.

이제 `String`의 메모리 구조까지 파악했으니, 문자열을 자주 변경해야 할 때의 해결책으로 넘어가 보겠습니다.

### **4. 가변(Mutable) 듀오: `StringBuilder`와 `StringBuffer`**

`String`과 달리, `StringBuilder`와 `StringBuffer`는 **'가변(Mutable)'** 이라는 특징을 가집니다. '가변'이란 객체가 생성된 후에도 그 값을 직접 변경할 수 있다는 의미입니다.

`append`와 같은 메소드를 사용하면, 새로운 객체를 만들지 않고 기존 객체의 메모리 공간 내에서 문자열을 추가하거나 수정할 수 있습니다. 이는 빈번한 문자열 변경 작업 시 **메모리 효율성을 크게 향상**시킵니다.

**메소드의 공통점**

두 클래스의 가장 중요한 공통점은 제공하는 기능(메소드)이 완전히 동일하다는 것입니다. 실제로 `StringBuilder`를 `StringBuffer`로 바꾸기만 하고 재실행하면 완전히 동일하게 동작합니다. 이처럼 두 클래스는 이름과 내부 안전장치만 다를 뿐, 개발자가 사용하는 '설명서(메소드)'는 똑같다고 생각하면 됩니다.

두 클래스의 사용법이 같다면, 우리는 무엇을 기준으로 선택해야 할까요? 바로 성능과 안전성을 결정짓는 '동기화'라는 결정적인 차이점이 그 답을 쥐고 있습니다.

### **5. 결정적 차이: 동기화(Synchronization)와 성능**

`StringBuilder`와 `StringBuffer`의 유일하고도 결정적인 차이는 **'동기화(Synchronization)' 지원 여부**입니다. 이는 성능과 직결됩니다.

| 특징 | `StringBuffer` | `StringBuilder` |
| --- | --- | --- |
| **동기화 (Synchronization)** | 지원 (Thread-Safe) | 미지원 (Not Thread-Safe) |
| **성능 (Performance)** | 상대적으로 느림 | 상대적으로 빠름 |
| **주요 사용 환경** | 멀티 스레드 환경 | 단일 스레드 환경 |

**'동기화' 개념 쉽게 풀기**

'동기화'란 여러 작업(스레드)이 동시에 하나의 데이터에 접근하여 값을 변경하려고 할 때 발생할 수 있는 데이터 충돌 및 손상 문제를 막아주는 **'안전장치'** 라고 비유할 수 있습니다. 하나의 스레드가 데이터를 사용하고 있을 때 다른 스레드가 접근하지 못하도록 순서를 지켜주는 역할이죠.

**성능 차이의 원인**

`StringBuffer`는 이 '동기화'라는 안전장치를 내장하고 있습니다. 여러 스레드가 동시에 접근해도 안전하지만, 매번 접근 권한을 확인하는 과정 때문에 약간의 성능 저하가 발생합니다. 반면, `StringBuilder`는 이러한 안전장치가 없기 때문에 검사 과정 없이 더 빠르게 동작할 수 있는 것입니다.

이제 각 클래스의 특징과 결정적인 차이점까지 모두 파악했으니, 가장 중요한 질문에 답을 할 차례입니다. "그래서, 실제 개발 현장에서는 언제 무엇을 써야 할까요?"

### **6. 선택 방법**

**값이 거의 바뀌지 않는다면: String**

- **시나리오:** 문자열이 자주 변경되지 않는 경우 (예: 단순 변수, 상수, 설정 값 등)
- **이유:** 불변성이 보장되어 데이터의 신뢰성이 중요할 때 유리합니다.

**성능이 최우선인 단일 스레드 환경이라면: StringBuilder**

- **시나리오:** **단일 스레드(Single-Thread)** 환경에서 문자열을 자주 추가, 삭제, 변경해야 하는 경우 (예: 웹사이트 개발 중 반복문 안에서 문자열을 조합할 때)
- **이유:** 동기화를 처리하지 않아 성능이 가장 빠릅니다.

**안전성이 중요한 멀티 스레드 환경이라면: StringBuffer**

- **시나리오:** **멀티 스레드(Multi-Thread)** 환경에서 여러 스레드가 하나의 문자열 데이터를 공유하고 안전하게 변경해야 하는 경우 (예: 여러 사용자가 동시에 메시지를 주고받는 채팅 프로그램)
- **이유:** 동기화를 지원하여 여러 스레드가 동시에 접근해도 데이터의 일관성을 안전하게 보장(Thread-Safe)합니다.

### **7. 정규표현식**
정규표현식(Regular Expression, 줄여서 Regex)은 특정한 규칙을 가진 문자열의 집합을 표현하기 위해 사용하는 형식 언어입니다. 
복잡한 문자열 속에서 **'특정 패턴'** 을 찾거나, 수정하거나, 유효성을 검사할 때 필수적인 도구입니다.
- 정규표현식 활용
```java
    // 정규표현식 패턴 설명
    // ^                 : 문자열의 시작
    // (?=.*[a-z])       : 최소 하나의 소문자 포함 (Lookahead)
    // (?=.*[A-Z])       : 최소 하나의 대문자 포함
    // (?=.*\d)          : 최소 하나의 숫자 포함
    // (?=.*[@$!%*?&])   : 최소 하나의 특수문자 포함
    // [A-Za-z\d@$!%*?&] : 허용되는 문자 집합
    // {8,20}            : 최소 8자 이상 20자 이하
    // $                 : 문자열의 끝
```

### **8. 최종 정리: 핵심 요약**

자바에서 문자열 클래스를 선택해야 할 때, 다음 세 가지 기준을 기억하세요.

- **String**: 문자열 값이 바뀔 일이 없다면, 고민 없이 `String`을 쓰세요. **불변성**이 데이터의 안정성을 지켜줍니다.
- **StringBuilder**: 단일 스레드 환경에서 문자열을 자주 변경해야 한다면, 무조건 `StringBuilder`입니다. **최고의 성능**을 보장하죠.
- **StringBuffer**: 여러 스레드가 데이터를 공유할 수 있는 환경이라면, 주저 없이 `StringBuffer`를 선택하세요. **동기화**가 데이터의 **안전성**을 책임져 줍니다.
