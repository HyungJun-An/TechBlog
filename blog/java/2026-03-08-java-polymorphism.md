---
title: "Java 다형성 깊게 파기 "
date: 2026-03-08
authors: HyungJun
tags: [Java, 기본기,상속]
---
`필드 하이딩`,`멤버 노출`,` extends vs implements`, `다이아몬드 문제`, `전략 패턴`

다형성(Polymorphism)은 단순히 "하나의 타입으로 여러 객체를"이라는 개념을 넘어, 업캐스팅 시 멤버 노출 규칙, 필드 하이딩, extends와 implements의 차이, 인터페이스 다중 상속에서의 다이아몬드 문제, 그리고 전략 패턴까지 깊이 연결됩니다.

<!-- truncate -->

### **1. 다형성(Polymorphism)이란?**

다형성은 **하나의 참조 타입으로 여러 종류의 객체를 다룰 수 있는 능력**입니다. '하나의 인터페이스나 타입이 여러 형태로 동작한다'는 의미에서 Polymorphism(poly = 여러, morph = 형태)이라고 합니다.

**고전 예시: 동물**

```java
Animal dog = new Dog();
Animal cat = new Cat();
Animal bird = new Bird();

Animal[] animals = {dog, cat, bird};

for (Animal animal : animals) {
    animal.sound(); // Dog면 멍멍, Cat이면 야옹, Bird면 짹짹
}
```

`Animal` 타입 하나로 모든 동물을 다루면서, 실제 동작은 각 객체에 맞게 달라집니다. 배열이나 리스트로 묶어 일괄 처리할 수 있는 것이 다형성의 가장 큰 강점입니다.

**실무 예시: List 인터페이스**

```java
List<String> arrayList  = new ArrayList<>();   // 빠른 조회
List<String> linkedList = new LinkedList<>();   // 빠른 삽입/삭제

// 어느 구현체든 List 타입으로 동일하게 사용
processData(arrayList);
processData(linkedList);

public void processData(List<String> list) {
    list.add("data");
    list.get(0);
}
```

이처럼 구현체가 바뀌어도 사용하는 코드는 변경할 필요가 없습니다. 그 핵심이 다형성입니다.

다형성을 이해하려면 먼저 업캐스팅 시 어떤 멤버에 접근 가능한지 명확히 알아야 합니다.

### **2. 업캐스팅과 멤버 노출 규칙**

**업캐스팅(Upcasting)** 은 자식 객체를 부모 타입의 참조 변수에 대입하는 것입니다.

```java
Dog dog = new Dog("바둑이");
Animal animal = dog; // 업캐스팅 (자동, 형변환 생략 가능)
```

업캐스팅 후에는 **참조 변수의 타입(Animal)** 을 기준으로 접근 가능한 멤버가 결정됩니다.

```java
public class Animal {
    String name = "Animal";
    public void sound() { System.out.println("..."); }
    public void breathe() { System.out.println("호흡"); }
}

public class Dog extends Animal {
    String name = "Dog";      // 필드 하이딩
    String breed;             // 자식 전용 필드

    @Override
    public void sound() { System.out.println("멍멍"); }
    public void fetch() { System.out.println("공 가져옴"); } // 자식 전용 메서드
}
```

```java
Animal a = new Dog("바둑이", "진돗개"); // 업캐스팅

a.sound();   // ✅ "멍멍" → 오버라이딩 메서드, VMI로 Dog 기준
a.breathe(); // ✅ "호흡" → Animal 메서드 그대로 사용
a.fetch();   // ❌ 컴파일 에러! Animal 타입에는 fetch()가 없음
a.breed;     // ❌ 컴파일 에러! Animal 타입에는 breed가 없음
```

**멤버 노출 규칙 정리**

| 접근 대상 | 기준 | 이유 |
|---------|------|------|
| **인스턴스 메서드** | 실제 객체 타입 (Dog) | VMI — 동적 바인딩 |
| **필드** | 참조 변수 타입 (Animal) | 필드 하이딩 — 정적 바인딩 |
| **자식 전용 메서드/필드** | 접근 불가 | 참조 타입에 존재하지 않음 |
| **static 메서드** | 참조 변수 타입 (Animal) | 정적 바인딩 |

**필드 하이딩 재확인**

```java
System.out.println(a.name); // "Animal" ← 참조 타입(Animal)의 name 필드
                             // Dog의 name은 가려짐(하이딩)

Dog d = (Dog) a;             // 다운캐스팅
System.out.println(d.name);  // "Dog" ← Dog 타입으로 접근하면 Dog의 name
```

> 이 혼란을 피하는 방법: **필드는 항상 `private`으로 선언하고 getter로만 접근하세요.**
> 그러면 getter는 오버라이딩 대상이므로 VMI가 적용되어 예측 가능한 동작을 보장합니다.

```java
// 안전한 설계
public class Animal {
    private String name = "Animal";
    public String getName() { return name; } // getter → 오버라이딩 가능
}

public class Dog extends Animal {
    private String name = "Dog";
    @Override
    public String getName() { return name; } // VMI로 올바른 값 반환
}

Animal a = new Dog();
System.out.println(a.getName()); // "Dog" ← 안전하고 명확!
```

> **핵심 규칙**: 외부에서 필드에 직접 접근할 때는 항상 **참조 변수의 타입**만 기준입니다.
> 실제 객체가 `Dog`라도 참조 타입이 `Animal`이면 `Animal`의 필드만 보입니다.
> 메서드는 VMI(실제 객체 기준), 필드는 참조 타입 기준 — 이 차이를 기억하세요.

자식 전용 메서드에 접근하려면 어떻게 할까요? 바로 다운캐스팅이 필요합니다.

### **3. 다운캐스팅과 instanceof**

**다운캐스팅(Downcasting)** 은 부모 타입의 참조 변수를 자식 타입으로 명시적으로 변환하는 것입니다.

```java
Animal a = new Dog("바둑이", "진돗개");

Dog dog = (Dog) a; // 다운캐스팅 — 명시적 형변환 필요
dog.fetch();        // ✅ 이제 Dog 전용 메서드 접근 가능
```

**`ClassCastException` 위험**

실제 객체가 변환하려는 타입이 아닐 경우 런타임 에러가 발생합니다.

```java
Animal a = new Cat("나비");
Dog dog = (Dog) a; // ❌ ClassCastException! Cat은 Dog로 변환 불가
```

**`instanceof`로 안전하게 확인**

```java
Animal a = new Dog("바둑이", "진돗개");

if (a instanceof Dog) {
    Dog dog = (Dog) a;
    dog.fetch(); // 안전하게 다운캐스팅
}
```

**Java 16+ 패턴 매칭 `instanceof`**

```java
// 기존 방식
if (a instanceof Dog) {
    Dog dog = (Dog) a;
    dog.fetch();
}

// Java 16+ 패턴 매칭 — 한 줄로 간결하게
if (a instanceof Dog dog) {
    dog.fetch(); // dog 변수가 자동으로 바인딩됨
}
```

이제 다형성의 두 축인 `extends`와 `implements`의 차이를 명확히 짚고 넘어가겠습니다.

### **4. extends vs implements: 헷갈리는 두 가지**

Java에서 다형성을 구현하는 방법은 두 가지입니다.

**`extends` — 상속 (IS-A 관계)**

```java
public class Dog extends Animal { }
// "Dog는 Animal이다" → IS-A 관계
```

| 특징 | 내용 |
|------|------|
| 관계 | IS-A ("~는 ~이다") |
| 상속 수 | **단일** (하나의 부모만) |
| 목적 | 코드 재사용 + 타입 계층 형성 |
| 구현 | 부모의 메서드를 그대로 쓰거나 오버라이딩 |

**`implements` — 인터페이스 구현 (CAN-DO 관계)**

```java
public interface Flyable {
    void fly(); // 구현 강제 (추상 메서드)
}

public class Bird extends Animal implements Flyable {
    @Override
    public void fly() { System.out.println("날아오름!"); }
}
// "Bird는 날 수 있다" → CAN-DO 관계
```

| 특징 | 내용 |
|------|------|
| 관계 | CAN-DO ("~할 수 있다") |
| 구현 수 | **다중** 가능 (`implements A, B, C`) |
| 목적 | 행위(기능)의 표준화, 다중 타입 지원 |
| 구현 | 인터페이스의 모든 메서드를 반드시 구현 |

**다중 구현으로 다이아몬드 문제 해결**

```java
public interface Swimmable { void swim(); }
public interface Flyable { void fly(); }

public class Duck extends Animal implements Swimmable, Flyable {
    @Override public void swim() { System.out.println("수영!"); }
    @Override public void fly()  { System.out.println("날기!"); }
}

// 다양한 타입으로 참조 가능
Animal   a = new Duck(); // Duck은 Animal이다
Swimmable s = new Duck(); // Duck은 수영할 수 있다
Flyable   f = new Duck(); // Duck은 날 수 있다
```

**언제 `extends`? 언제 `interface`?**

```
✅ extends를 쓸 때:
- 명확한 IS-A 관계 (Dog는 Animal이다)
- 부모 코드를 재사용하고 싶을 때
- 계층 구조가 자연스러울 때

✅ interface를 쓸 때:
- 기능(행위)의 계약을 정의할 때
- 다중 타입이 필요할 때
- 구현체를 나중에 자유롭게 교체하고 싶을 때 ← 매우 중요!
- 테스트 시 Mock 객체로 교체해야 할 때
```

인터페이스가 "구현체를 자유롭게 교체한다"는 특성은 실무에서 강력한 설계 패턴을 만들어냅니다. 그런데 인터페이스 다중 상속이 허용된다면, 여기서 발생할 수 있는 문제는 없을까요?

### **5. 인터페이스 다중 상속과 순환참조 문제**

인터페이스는 클래스와 달리 여러 개를 `extends`로 동시에 상속받을 수 있습니다.

```java
interface Flyable  { void fly();  }
interface Swimmable { void swim(); }

// 인터페이스는 여러 인터페이스를 동시에 extends 가능
interface Duckable extends Flyable, Swimmable {
    void quack();
}

// 클래스도 여러 인터페이스를 implements 가능
class Duck implements Flyable, Swimmable {
    @Override public void fly()  { System.out.println("날기!"); }
    @Override public void swim() { System.out.println("수영!"); }
}
```

이 유연함에는 두 가지 주의해야 할 함정이 있습니다.

**순환 상속 — 컴파일 타임에 차단**

인터페이스끼리 서로를 `extends`하려 하면 컴파일러가 즉시 에러를 발생시킵니다.

```java
interface A extends B { }
interface B extends A { } // ❌ Compile Error: cyclic inheritance involving A
```

Java는 **타입 계층 그래프에 사이클이 없어야 한다**는 원칙을 컴파일 타임에 검사합니다. 순환참조는 실행 전에 완전히 차단되므로 런타임 문제로 이어지지 않습니다.

**다이아몬드 문제 — Java 8 `default` 메서드의 함정**

Java 8에서 인터페이스에 `default` 메서드가 추가되면서 새로운 충돌 가능성이 생겼습니다.

```java
interface A {
    default void hello() { System.out.println("A"); }
}

interface B extends A {
    @Override
    default void hello() { System.out.println("B"); }
}

interface C extends A {
    @Override
    default void hello() { System.out.println("C"); }
}

class D implements B, C {
    // ❌ Compile Error: D inherits unrelated defaults for hello() from B and C
}
```

`B`와 `C` 둘 다 `hello()`의 구현을 가지고 있어, 컴파일러는 어느 쪽을 써야 할지 결정하지 못합니다. 이것이 **다이아몬드 문제(Diamond Problem)** 입니다.

**해결 방법: 구현 클래스에서 직접 오버라이드**

```java
class D implements B, C {
    @Override
    public void hello() {
        B.super.hello(); // 명시적으로 B의 구현 선택 → "B" 출력
        // C.super.hello();         // C의 구현을 선택하고 싶다면
        // System.out.println("D"); // 완전히 새로운 구현도 가능
    }
}
```

`인터페이스명.super.메서드명()` 문법으로 원하는 인터페이스의 `default` 구현을 명시적으로 선택할 수 있습니다.

**`default` 메서드 우선순위 규칙**

충돌이 없는 경우에도 Java는 다음 순서로 어떤 구현을 사용할지 결정합니다.

| 우선순위 | 기준 | 설명 |
|---------|------|------|
| **1위** | 클래스의 메서드 | 구현 클래스나 부모 클래스가 직접 정의한 메서드 |
| **2위** | 더 구체적인 인터페이스의 `default` | 하위 인터페이스가 부모 인터페이스보다 우선 |
| **3위** | 나머지 충돌 | 컴파일 에러 — 직접 오버라이드 필수 |

```java
interface A {
    default void hello() { System.out.println("A"); }
}

interface B extends A {
    @Override
    default void hello() { System.out.println("B"); }
}

class C implements A, B { }

new C().hello(); // "B" ← B가 A보다 구체적(하위)이므로 자동 선택, 충돌 없음
```

이처럼 인터페이스 다중 상속에서 발생하는 문제는 **컴파일 타임에 강제로 해결**되도록 설계되어 있습니다. Java가 런타임 모호성 대신 컴파일 에러를 선택한 이유입니다.

### **6. 다형성이 실무에서 쓰이는 방식: 전략 패턴**

**전략 패턴(Strategy Pattern)** 은 다형성을 가장 잘 활용하는 디자인 패턴 중 하나입니다. **알고리즘(전략)을 인터페이스로 추상화하고, 런타임에 원하는 구현체로 교체**할 수 있습니다.

**예시: 결제 시스템**

```java
// 1. 전략 인터페이스 정의
public interface PaymentStrategy {
    void pay(int amount);
}

// 2. 구체적인 전략 구현
public class CreditCardPayment implements PaymentStrategy {
    private String cardNumber;

    public CreditCardPayment(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    @Override
    public void pay(int amount) {
        System.out.println("신용카드(" + cardNumber + ")로 " + amount + "원 결제");
    }
}

public class KakaoPayment implements PaymentStrategy {
    @Override
    public void pay(int amount) {
        System.out.println("카카오페이로 " + amount + "원 결제");
    }
}

public class NaverPayment implements PaymentStrategy {
    @Override
    public void pay(int amount) {
        System.out.println("네이버페이로 " + amount + "원 결제");
    }
}

// 3. 전략을 사용하는 컨텍스트
public class ShoppingCart {
    private PaymentStrategy paymentStrategy; // 인터페이스 타입으로 보유

    // 전략 주입 (의존성 주입 — DI)
    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.paymentStrategy = strategy;
    }

    public void checkout(int amount) {
        paymentStrategy.pay(amount); // VMI로 실제 구현체 메서드 호출
    }
}
```

```java
// 사용 — 런타임에 전략을 자유롭게 교체
ShoppingCart cart = new ShoppingCart();

cart.setPaymentStrategy(new CreditCardPayment("1234-5678"));
cart.checkout(50000); // 신용카드(1234-5678)로 50000원 결제

cart.setPaymentStrategy(new KakaoPayment());
cart.checkout(30000); // 카카오페이로 30000원 결제

cart.setPaymentStrategy(new NaverPayment());
cart.checkout(20000); // 네이버페이로 20000원 결제
```

**새로운 결제 수단을 추가할 때**

`PaymentStrategy` 인터페이스를 구현하는 클래스만 하나 더 추가하면 됩니다. `ShoppingCart` 코드는 **단 한 줄도 수정하지 않아도** 됩니다.

```java
// 새로운 결제 수단 추가
public class TossPayment implements PaymentStrategy {
    @Override
    public void pay(int amount) {
        System.out.println("토스로 " + amount + "원 결제");
    }
}

cart.setPaymentStrategy(new TossPayment()); // 기존 코드 변경 없이 바로 사용 가능
```

이것이 바로 **개방-폐쇄 원칙(OCP)** — 확장에는 열려 있고(Open), 수정에는 닫혀 있다(Closed) — 가 다형성과 결합했을 때의 위력입니다.

### **7. 최종 정리: 핵심 요약**

- **업캐스팅 후 멤버 노출**: 참조 타입 기준으로 접근 가능한 멤버가 결정됩니다. 단, 인스턴스 메서드는 VMI로 실제 객체 기준으로 실행됩니다.
- **필드 하이딩**: 외부에서 필드에 접근할 때는 항상 **참조 변수의 타입**만 봅니다. 실제 객체가 무엇이든 무관합니다. `private` + getter로 방지하세요.
- **다운캐스팅**: 자식 전용 멤버 접근 시 필요. 반드시 `instanceof`로 타입 확인 후 수행하세요.
- **extends**: IS-A 관계, 단일 상속, 코드 재사용 목적.
- **implements**: CAN-DO 관계, 다중 구현 가능, 행위 표준화 목적. 구현체를 교체 가능하게 만들 때 사용.
- **인터페이스 다중 상속**: 순환 상속은 컴파일 타임에 차단. `default` 메서드 충돌(다이아몬드 문제)은 `인터페이스명.super.메서드명()`으로 해결.
- **전략 패턴**: 인터페이스로 알고리즘을 추상화하고, 런타임에 원하는 구현체로 교체. 새 전략 추가 시 기존 코드 수정 불필요.
