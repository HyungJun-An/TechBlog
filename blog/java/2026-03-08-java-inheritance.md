---
title: "상속, 오버로딩, 오버라이딩, VMI"
date: 2026-03-08
authors: HyungJun
tags: [Java, 기본기, Inheritance]
---

상속으로 코드를 재사용하고, 오버로딩과 오버라이딩으로 메서드를 유연하게 다루며, JVM이 실행 시점에 어떤 메서드를 호출할지 결정하는 VMI 동작 원리까지 깊이 파헤칩니다.

<!-- truncate -->

### **1. 상속(Inheritance): 코드 재사용의 기반**

상속은 **기존 클래스(부모)의 필드와 메서드를 새 클래스(자식)가 물려받는** 메커니즘입니다. `extends` 키워드를 사용하며, **IS-A 관계**가 성립할 때 사용합니다.

```java
public class Animal {
    String name;
    int age;

    public void eat() {
        System.out.println(name + "이 먹는다.");
    }
}

public class Dog extends Animal { // Dog IS-A Animal
    public void bark() {
        System.out.println(name + "이 짖는다."); // 부모 필드 name 사용 가능
    }
}
```

**생성자 체이닝: `super()`**

자식 클래스의 생성자는 가장 먼저 **부모 생성자를 호출**해야 합니다. 명시적으로 쓰지 않으면 컴파일러가 자동으로 `super()`를 삽입합니다.

```java
public class Animal {
    String name;

    public Animal(String name) {
        this.name = name;
        System.out.println("Animal 생성자 실행");
    }
}

public class Dog extends Animal {
    String breed;

    public Dog(String name, String breed) {
        super(name); // 반드시 첫 줄! 부모 생성자 호출
        this.breed = breed;
        System.out.println("Dog 생성자 실행");
    }
}

new Dog("바둑이", "진돗개");
// Animal 생성자 실행
// Dog 생성자 실행
```

**단일 상속 제한**

Java는 **클래스 다중 상속을 허용하지 않습니다.** 두 부모에 같은 메서드가 있을 때 어느 쪽을 호출할지 모호하기 때문입니다(다이아몬드 문제). 이 한계는 나중에 `interface`로 해결합니다.

```java
class A { void hello() {} }
class B { void hello() {} }
class C extends A, B {} // ❌ 컴파일 에러 — Java는 단일 상속만 허용
```

코드를 재사용하는 기반은 갖췄습니다. 그렇다면 같은 이름의 메서드를 여러 형태로 만들고 싶을 땐 어떻게 할까요?

### **2. 오버로딩(Overloading): 같은 이름, 다른 시그니처**

오버로딩은 **같은 클래스 안에서 메서드 이름은 같지만 파라미터(수·타입·순서)가 다른** 메서드를 여러 개 정의하는 것입니다. **컴파일 타임에 어떤 메서드를 호출할지 결정**되는 **정적 바인딩(Static Binding)** 입니다.

```java
public class Calculator {
    public int add(int a, int b) { return a + b; }
    public double add(double a, double b) { return a + b; }
    public int add(int a, int b, int c) { return a + b + c; }
    public String add(String a, String b) { return a + b; }
}

Calculator calc = new Calculator();
calc.add(1, 2);          // → int add(int, int) 호출
calc.add(1.0, 2.0);      // → double add(double, double) 호출
calc.add(1, 2, 3);       // → int add(int, int, int) 호출
```

**오버로딩의 조건**

| 조건 | 오버로딩 성립 여부 |
|------|-----------------|
| 파라미터 **수**가 다름 | ✅ |
| 파라미터 **타입**이 다름 | ✅ |
| 파라미터 **순서**가 다름 | ✅ |
| **리턴 타입만** 다름 | ❌ 컴파일 에러 |
| **접근 제한자만** 다름 | ❌ 컴파일 에러 |

**생성자 오버로딩**

```java
public class Person {
    String name;
    int age;

    public Person() { this("이름없음", 0); }              // 기본 생성자
    public Person(String name) { this(name, 0); }          // 이름만
    public Person(String name, int age) {                   // 이름+나이
        this.name = name;
        this.age = age;
    }
}
```

`this()`로 같은 클래스의 다른 생성자를 호출할 수 있습니다. 중복 초기화 코드를 줄이는 데 유용합니다.

오버로딩이 같은 클래스 안에서의 메서드 확장이라면, 오버라이딩은 상속 관계에서 부모의 메서드를 자식이 덮어쓰는 것입니다.

### **3. 오버라이딩(Overriding): 부모 메서드를 자식이 재정의**

오버라이딩은 **부모 클래스의 메서드를 자식 클래스에서 같은 시그니처로 재정의**하는 것입니다. **런타임에 실제 객체 타입을 기준으로 메서드가 결정**되는 **동적 바인딩(Dynamic Binding)** 입니다.

```java
public class Animal {
    public void sound() {
        System.out.println("...");
    }
}

public class Dog extends Animal {
    @Override
    public void sound() { // 부모 메서드를 재정의
        System.out.println("멍멍!");
    }
}
```

**`@Override` 어노테이션의 역할**

단순 주석이 아니라 **컴파일러에게 "이 메서드는 부모의 것을 오버라이딩한다"고 알려주는 표식**입니다. 만약 부모에 해당 메서드가 없으면 컴파일 에러를 발생시켜, 오타로 인한 버그를 사전에 막아줍니다.

**오버라이딩 규칙**

| 항목 | 규칙 |
|------|------|
| 메서드 이름 | 동일해야 함 |
| 파라미터 | 동일해야 함 |
| 리턴 타입 | 동일하거나 하위 타입(Covariant) |
| 접근 제한자 | 부모보다 **좁게 바꿀 수 없음** |
| static 메서드 | 오버라이딩 불가 (메서드 하이딩) |
| final 메서드 | 오버라이딩 불가 |

**`super`로 부모 메서드 호출**

```java
public class Dog extends Animal {
    @Override
    public void sound() {
        super.sound();        // 부모의 sound() 먼저 호출
        System.out.println("멍멍!");
    }
}
```

---

**필드 하이딩(Field Hiding): 오버라이딩과의 결정적 차이**

오버라이딩은 **메서드**에만 적용됩니다. **필드는 오버라이딩되지 않고, 하이딩(Hiding)** 됩니다. 이것이 많은 혼란의 원인입니다.

```java
public class Parent {
    String name = "Parent";

    public void printName() {
        System.out.println("Parent 메서드: " + name);
    }
}

public class Child extends Parent {
    String name = "Child"; // 부모의 name을 오버라이딩이 아닌 '하이딩'

    @Override
    public void printName() {
        System.out.println("Child 메서드: " + name);
    }
}
```

```java
Parent p = new Child(); // 업캐스팅

// 메서드: 동적 바인딩 → 실제 객체(Child) 기준
p.printName();    // "Child 메서드: Child"

// 필드: 정적 바인딩 → 참조 타입(Parent) 기준
System.out.println(p.name); // "Parent" ← 필드는 참조 타입을 따름!
```

| 구분 | 메서드 | 필드 |
|------|--------|------|
| 자식에서 재정의 시 | 오버라이딩 (동적 바인딩) | 하이딩 (정적 바인딩) |
| 업캐스팅 후 접근 | 실제 객체 타입 기준 | 참조 변수 타입 기준 |
| `@Override` | 가능 | 불가 |

> 이 때문에 실무에서는 **필드를 직접 공개(public)하지 않고 getter/setter를 통해 접근**하는 것이 원칙입니다. 필드 하이딩으로 인한 혼란을 방지할 수 있습니다.

오버라이딩이 가능한 이유는 JVM이 런타임에 실제 객체 타입을 확인하기 때문입니다. 바로 VMI의 동작 원리입니다.

### **4. VMI(Virtual Method Invocation): JVM이 메서드를 고르는 방법**

VMI(가상 메서드 호출)는 **참조 변수의 타입이 아닌 실제 객체의 타입을 기준으로 메서드를 결정**하는 JVM의 런타임 메커니즘입니다.

**정적 바인딩 vs 동적 바인딩**

| 구분 | 정적 바인딩 (Static Binding) | 동적 바인딩 (Dynamic Binding) |
|------|---------------------------|---------------------------|
| 결정 시점 | 컴파일 타임 | 런타임 |
| 해당 대상 | 오버로딩, static 메서드, final 메서드, 필드 | 오버라이딩된 인스턴스 메서드 |
| 속도 | 빠름 | 약간 느림 (vtable 조회) |

**vtable(가상 메서드 테이블)**

JVM은 각 클래스마다 **vtable(Virtual Method Table)** 을 유지합니다. 객체가 생성될 때 자신의 클래스 vtable을 참조합니다.

```
Parent vtable:         Child vtable:
┌─────────────────┐    ┌─────────────────────────┐
│ sound → Parent  │    │ sound → Child (오버라이딩)│
│ eat   → Parent  │    │ eat   → Parent (그대로)  │
└─────────────────┘    └─────────────────────────┘
```

메서드 호출 시 JVM은 다음 순서로 동작합니다:

```
1. 참조 변수의 타입 확인 → 컴파일 시 해당 메서드 존재 여부 검사
2. 런타임 시 실제 객체의 vtable 조회
3. vtable에서 해당 메서드 주소 가져옴
4. 메서드 실행
```

**VMI 증명 코드**

```java
public class Animal {
    public void sound() { System.out.println("..."); }
    public static void staticMethod() { System.out.println("Animal static"); }
}

public class Dog extends Animal {
    @Override
    public void sound() { System.out.println("멍멍"); }

    public static void staticMethod() { System.out.println("Dog static"); }
}

Animal a = new Dog(); // 참조 타입: Animal, 실제 객체: Dog

// 인스턴스 메서드 → VMI → 실제 객체(Dog) 기준
a.sound();          // "멍멍" ← Dog의 sound() 호출

// static 메서드 → 정적 바인딩 → 참조 타입(Animal) 기준
a.staticMethod();   // "Animal static" ← Dog의 staticMethod()가 아님!
```

> `static` 메서드는 VMI 대상이 아닙니다. 클래스에 귀속되기 때문에 참조 타입을 기준으로 결정됩니다. 이를 **메서드 하이딩(Method Hiding)** 이라고 부릅니다.

### **5. 오버로딩 vs 오버라이딩 최종 비교**

| 구분 | 오버로딩 | 오버라이딩 |
|------|---------|----------|
| **정의** | 같은 이름, 다른 파라미터 | 부모 메서드를 자식이 재정의 |
| **위치** | 같은 클래스 내 | 상속 관계 |
| **바인딩** | 정적 (컴파일 타임) | 동적 (런타임, VMI) |
| **파라미터** | 달라야 함 | 동일해야 함 |
| **리턴 타입** | 무관 | 동일 or 하위 타입 |
| **접근 제한자** | 무관 | 좁게 변경 불가 |
| **`@Override`** | 사용 불가 | 사용 가능 (권장) |

### **6. 최종 정리: 핵심 요약**

- **상속**: `extends`로 IS-A 관계를 표현하고 코드를 재사용합니다. 생성자는 `super()`로 체이닝되며, Java는 단일 상속만 허용합니다.
- **오버로딩**: 같은 이름, 다른 파라미터. 컴파일 타임에 결정되는 정적 바인딩입니다. 리턴 타입만 달라서는 불가합니다.
- **오버라이딩**: 부모 메서드를 자식이 재정의. `@Override`를 꼭 쓰세요. 필드는 오버라이딩이 아닌 **하이딩**이 됩니다.
- **필드 하이딩**: 업캐스팅 후 필드는 참조 타입 기준, 메서드는 실제 객체 기준으로 동작합니다. 혼란 방지를 위해 필드는 getter/setter로만 접근하세요.
- **VMI**: JVM은 런타임에 vtable을 통해 실제 객체의 메서드를 동적으로 결정합니다. `static` 메서드는 VMI 대상이 아닙니다.
