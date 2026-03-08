---
title: "Java Generic 2"
date: 2026-01-27
authors: HyungJun
tags: [Java, 기본기, Generic]
---

제네릭의 심화 개념인 타입 제한(`extends`), 제네릭 메서드, 와일드카드(`?`), 타입 소거(Type Erasure)에 대해 코드 예시와 함께 상세히 설명합니다.

<!-- truncate -->

## 타입 제한 없는 제네릭의 한계

타입 파라미터 `T`에 아무 제한이 없으면 컴파일러는 `T`를 `Object`로만 간주합니다.

```java
public class AnimalHospitalV2<T> {
    private T animal;

    public void set(T animal) { this.animal = animal; }

    public void checkup() {
        // T는 Object로 취급되므로 Animal 메서드 사용 불가
        animal.getName();  // ❌ 컴파일 에러
        animal.getSize();  // ❌ 컴파일 에러
    }
}
```

`Animal` 전용으로 만들었는데도 `Animal`의 메서드를 쓸 수 없는 역설적인 상황입니다.

## 타입 파라미터 제한 (`extends`)

`<T extends Animal>`처럼 상위 타입을 지정하면 해당 타입과 그 하위 타입만 허용합니다.

```java
public class AnimalHospitalV3<T extends Animal> {
    private T animal;

    public void set(T animal) { this.animal = animal; }

    public void checkup() {
        // T가 Animal의 하위 타입임이 보장되므로 Animal 메서드 사용 가능
        System.out.println("이름: " + animal.getName());
        System.out.println("크기: " + animal.getSize());
    }
}
```

```java
AnimalHospitalV3<Dog> dogHospital = new AnimalHospitalV3<>(); // ✅
AnimalHospitalV3<Cat> catHospital = new AnimalHospitalV3<>(); // ✅
AnimalHospitalV3<Integer> intHospital = new AnimalHospitalV3<>(); // ❌ 컴파일 에러
```

## 제네릭 메서드

클래스 레벨이 아닌 **메서드 레벨에서** 독립적으로 타입 파라미터를 선언하는 방법입니다.

```java
public class GenericMethod {
    // 일반 메서드와 달리 반환 타입 앞에 <T> 선언
    public static <T> T genericMethod(T t) {
        System.out.println("input: " + t);
        return t;
    }

    // 타입 제한 적용 가능
    public static <T extends Comparable<T>> T max(T a, T b) {
        return a.compareTo(b) >= 0 ? a : b;
    }
}
```

호출 시 타입 추론이 가능하므로 명시적 타입 인수를 생략할 수 있습니다.

```java
Integer result = GenericMethod.<Integer>genericMethod(10); // 명시적 방법
Integer result = GenericMethod.genericMethod(10);          // 타입 추론으로 생략 가능
```

## 정적 메서드와 제네릭

제네릭 클래스의 타입 파라미터는 **정적(static) 메서드에서 사용 불가**합니다.

```java
public class Box<T> {
    private T value;

    // ❌ 컴파일 에러: 정적 메서드에서 클래스 타입 파라미터 T 사용 불가
    public static T staticMethod(T t) { return t; }

    // ✅ 올바른 방법: 메서드 자체에 타입 파라미터 선언
    public static <V> V staticMethod(V t) { return t; }
}
```

이유: 클래스의 타입 파라미터는 인스턴스 생성 시 결정되지만, 정적 메서드는 인스턴스 없이 호출할 수 있으므로 타입을 알 수 없습니다.

## 타입 파라미터 우선순위

제네릭 메서드와 클래스 타입 파라미터의 이름이 같으면 **메서드가 우선**합니다.

```java
public class Priority<T> {
    // 여기서 T는 클래스의 T가 아닌, 이 메서드의 독립적인 T
    public <T> T method(T t) {
        return t; // 클래스 타입 제한 무관, 모든 타입 허용
    }
}
```

혼동을 피하려면 메서드 타입 파라미터에는 다른 이름을 쓰는 것이 좋습니다.

## 와일드카드 (`?`)

와일드카드는 "어떤 타입이든"을 의미하며, 제네릭 타입을 파라미터로 받을 때 유용합니다.

```java
// 어떤 타입의 Box든 받을 수 있음
public static void printBox(Box<?> box) {
    System.out.println(box.get());
}
```

### 상한 제한 와일드카드 (`? extends T`)

`T`와 그 **하위 타입**만 허용합니다.

```java
// Animal이나 Animal의 자식 타입만 허용
public static void treat(Box<? extends Animal> box) {
    Animal animal = box.get(); // Animal 타입으로 꺼낼 수 있음
}
```

### 하한 제한 와일드카드 (`? super T`)

`T`와 그 **상위 타입**만 허용합니다.

```java
// Animal이나 Animal의 부모 타입만 허용
public static void addAnimal(Box<? super Animal> box) {
    box.set(new Dog()); // Animal 하위 타입은 넣을 수 있음
}
```

### 비한정 와일드카드 (`?`)

모든 타입을 허용합니다. `Box<Object>`와 다르게 `Box<Integer>`, `Box<String>` 등 모두 허용합니다.

## 타입 소거 (Type Erasure)

Java 제네릭의 중요한 특징입니다. **컴파일 시 제네릭 타입 정보가 제거**됩니다.

```java
// 컴파일 전
GenericBox<Integer> box = new GenericBox<>();
box.set(10);
Integer value = box.get();

// 컴파일 후 (바이트코드)
GenericBox box = new GenericBox();
box.set(10);
Integer value = (Integer) box.get(); // 형변환이 자동으로 삽입됨
```

### 타입 소거로 인한 제약

```java
public class TypeErasureLimit<T> {
    public void method(T t) {
        // ❌ 런타임에는 T 타입 정보가 없으므로 instanceof 불가
        if (t instanceof T) { }

        // ❌ 런타임에는 T 타입 정보가 없으므로 new T() 불가
        T obj = new T();
    }
}
```

타입 소거는 Java 5에서 제네릭을 도입할 때 하위 호환성을 위해 채택된 방식입니다. 덕분에 제네릭 도입 전 코드와 호환이 유지됩니다.

## 정리

| 개념 | 문법 | 설명 |
|------|------|------|
| 타입 제한 | `<T extends Animal>` | T를 Animal 계층으로 제한 |
| 제네릭 메서드 | `<T> T method(T t)` | 메서드 레벨 타입 파라미터 |
| 비한정 와일드카드 | `<?>` | 모든 타입 허용 |
| 상한 와일드카드 | `<? extends T>` | T와 그 하위 타입 |
| 하한 와일드카드 | `<? super T>` | T와 그 상위 타입 |
| 타입 소거 | - | 컴파일 후 제네릭 정보 제거 |
