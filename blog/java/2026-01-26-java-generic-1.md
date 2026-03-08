---
title: "Java Generic 1"
date: 2026-01-26
authors: HyungJun
tags: [Java, 기본기, Generic]
---

Java 제네릭(Generic)의 기초 개념과 도입 배경, 기본적인 사용법에 대해 다룹니다. 다형성의 한계를 극복하고 타입 안전성을 확보하는 방법을 코드 예시와 함께 설명합니다.

<!-- truncate -->

## 다형성과 그 한계

객체지향에서 다형성은 "하나의 인터페이스나 이름으로 여러 다른 타입의 동작을 구현"하는 것으로, 코드의 유연성과 재사용성을 높여줍니다.

그런데 타입마다 클래스를 별도로 만들면 어떻게 될까요?

```java
// Integer 전용 박스
public class IntegerBox {
    private Integer value;
    public void set(Integer value) { this.value = value; }
    public Integer get() { return this.value; }
}

// String 전용 박스
public class StringBox {
    private String value;
    public void set(String value) { this.value = value; }
    public String get() { return this.value; }
}
```

타입이 늘어날수록 클래스가 계속 늘어납니다. 이를 해결하려고 `Object` 타입을 쓰면 어떻게 될까요?

```java
public class ObjectBox {
    private Object value;
    public void set(Object value) { this.value = value; }
    public Object get() { return this.value; }
}
```

코드 중복은 없어졌지만 **타입 안전성**이 사라집니다.

```java
ObjectBox box = new ObjectBox();
box.set("hello");

// 컴파일 에러 없음! 런타임에 ClassCastException 발생
Integer value = (Integer) box.get(); // 💥
```

잘못된 타입을 넣어도 컴파일 시점에서 잡아주지 못하고, 형변환도 매번 수동으로 해야 합니다.

## 제네릭으로 해결

제네릭은 **타입을 나중에 지정**할 수 있도록 타입 파라미터(`<T>`)를 사용합니다.

```java
public class GenericBox<T> {
    private T value;
    public void set(T value) { this.value = value; }
    public T get() { return this.value; }
}
```

사용할 때 타입을 지정하면 됩니다.

```java
// Integer 박스
GenericBox<Integer> intBox = new GenericBox<>();
intBox.set(10);
Integer num = intBox.get(); // 형변환 불필요!

// String 박스
GenericBox<String> strBox = new GenericBox<>();
strBox.set("hello");
String str = strBox.get(); // 형변환 불필요!

// 잘못된 타입은 컴파일 에러로 바로 잡힘
intBox.set("문자열"); // ❌ 컴파일 에러
```

## 핵심 용어 정리

| 용어 | 설명 | 예시 |
|------|------|------|
| **제네릭 타입** | 타입 파라미터를 사용하는 클래스/인터페이스 | `GenericBox<T>` |
| **타입 파라미터** | 타입의 자리를 나타내는 변수 | `T`, `K`, `V`, `E` |
| **타입 인수** | 실제로 지정하는 타입 | `Integer`, `String` |

타입 파라미터 이름은 관례적으로 다음과 같이 씁니다.
- `T` - Type (일반적인 타입)
- `E` - Element (컬렉션의 요소)
- `K` / `V` - Key / Value (Map)
- `N` - Number

## 제네릭의 장점 요약

### 1. 코드 중복 제거
타입마다 클래스를 만들 필요 없이 하나의 제네릭 클래스로 모든 타입을 처리할 수 있습니다.

### 2. 컴파일 타임 타입 체크
잘못된 타입을 사용하면 **런타임 이전에 컴파일 에러**로 잡아줍니다. 버그를 조기에 발견할 수 있습니다.

### 3. 형변환 제거
`Object`를 쓸 때 필요했던 `(Integer)` 같은 명시적 형변환이 불필요합니다. 코드가 더 깔끔하고 가독성이 높아집니다.

### 4. 런타임 성능 향상
불필요한 형변환이 없어지고, ClassCastException 같은 런타임 에러가 줄어들어 전반적인 안정성이 향상됩니다.

## 주의사항: 기본형은 사용 불가

제네릭의 타입 인수로는 **참조 타입만** 사용 가능합니다. 기본형(primitive type)은 래퍼 클래스를 사용해야 합니다.

```java
GenericBox<int> box = new GenericBox<>();    // ❌ 컴파일 에러
GenericBox<Integer> box = new GenericBox<>(); // ✅ 올바른 사용
```

| 기본형 | 래퍼 클래스 |
|--------|-----------|
| `int` | `Integer` |
| `long` | `Long` |
| `double` | `Double` |
| `boolean` | `Boolean` |

Java 5 이상에서는 오토박싱/언박싱 덕분에 `intBox.set(10)`처럼 자동으로 변환되어 편하게 사용할 수 있습니다.

---

다음 포스트에서는 제네릭의 심화 개념인 **타입 제한, 제네릭 메서드, 와일드카드, 타입 소거**에 대해 다룹니다.
