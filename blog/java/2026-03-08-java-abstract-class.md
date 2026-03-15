---
title: "abstract vs interface"
date: 2026-03-08
authors: HyungJun
tags: [Java, 기본기, 상속]
---

추상 클래스(Abstract Class)는 인터페이스와 일반 클래스의 중간 어딘가에 위치합니다. "언제 `abstract`를 쓰고, 언제 `interface`를 써야 하는가?"라는 질문에 명확히 답하기 위해, 추상 클래스의 개념부터 실무 선택 기준, 그리고 둘을 함께 쓰는 템플릿 메서드 패턴까지 파헤칩니다.

<!-- truncate -->

### **1. 추상 클래스(Abstract Class)란?**

**추상 클래스**는 `abstract` 키워드로 선언된 클래스로, **직접 인스턴스화할 수 없고** 반드시 자식 클래스를 통해 사용해야 합니다. 일반 클래스와 인터페이스의 중간 형태로, **공통 구현(일반 메서드)과 구현 강제(추상 메서드)를 동시에 제공**합니다.

```java
public abstract class Shape {
    String color; // 일반 필드

    // 추상 메서드 — 구현 없음, 자식이 반드시 구현해야 함
    public abstract double area();

    // 일반 메서드 — 공통 구현 제공
    public void printInfo() {
        System.out.println("색상: " + color + ", 넓이: " + area());
    }
}
```

`Shape` 자체는 "도형"이라는 개념이므로 인스턴스를 만들 수 없지만, `Circle`이나 `Rectangle` 같은 구체적인 자식은 만들 수 있습니다.

```java
// Shape shape = new Shape(); // ❌ 인스턴스화 불가 — 컴파일 에러
Shape circle = new Circle(5.0); // ✅ 자식 클래스는 가능
```

이처럼 추상 클래스는 **"이 클래스는 직접 쓰는 게 아니라, 상속을 위해 존재한다"** 는 의도를 코드로 표현하는 수단입니다.

그렇다면 추상 클래스만의 핵심 기능인 추상 메서드는 어떻게 동작할까요?

### **2. 추상 메서드와 강제 구현**

**추상 메서드(abstract method)** 는 선언만 있고 구현이 없는 메서드입니다. 자식 클래스는 반드시 이를 오버라이딩해야 합니다. 구현하지 않으면 자식 클래스도 `abstract`로 선언해야 합니다.

```java
public abstract class Shape {
    public abstract double area(); // 선언만, 구현 없음
}

public class Circle extends Shape {
    double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double area() { // ✅ 반드시 구현
        return Math.PI * radius * radius;
    }
}

public class Rectangle extends Shape {
    double width, height;

    @Override
    public double area() {
        return width * height;
    }
}

// 구현하지 않으면?
public abstract class HalfShape extends Shape {
    // area()를 구현하지 않음 → 이 클래스도 abstract여야 함
}
```

**추상 메서드의 강점**은 "자식 클래스가 반드시 이 메서드를 구현해야 한다"는 **계약을 컴파일 타임에 강제**한다는 것입니다. 인터페이스와 동일한 역할이지만, 추상 클래스는 여기에 공통 구현까지 얹을 수 있습니다.

그렇다면 추상 클래스가 가질 수 있는 것과 없는 것은 무엇인지 정리해봅시다.

### **3. 추상 클래스의 핵심 특징**

추상 클래스는 일반 클래스와 거의 동일하지만, 몇 가지 제약과 추가 기능이 있습니다.

| 항목 | 가능 여부 | 설명 |
|------|----------|------|
| 인스턴스화 (`new`) | ❌ | 직접 객체 생성 불가 |
| 생성자 | ✅ | 자식이 `super()`로 호출 |
| 일반 필드 | ✅ | `private`, `protected` 등 자유롭게 |
| 일반 메서드 | ✅ | 공통 구현을 자식과 공유 |
| 추상 메서드 | ✅ | 자식에게 구현 강제 |
| `static` / `final` 메서드 | ✅ | 가능 |
| 다중 상속 | ❌ | 단일 상속만 허용 |

```java
public abstract class Animal {
    private String name;   // private 필드
    protected int age;     // protected 필드

    // 생성자 — 자식이 super()로 호출
    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // 추상 메서드
    public abstract void sound();

    // 일반 메서드 — 공통 구현
    public String getName() { return name; }

    public void breathe() {
        System.out.println(name + "이 숨을 쉰다.");
    }
}

public class Dog extends Animal {
    public Dog(String name, int age) {
        super(name, age); // 부모 생성자 호출 필수
    }

    @Override
    public void sound() { System.out.println("멍멍!"); }
}
```

이처럼 추상 클래스는 **상태(필드)와 공통 로직을 물려줄 수 있다**는 점에서 인터페이스와 결정적으로 다릅니다. 그렇다면 둘의 차이를 직접 비교해봅시다.

### **4. 추상 클래스 vs 인터페이스: 결정적 차이**

| 항목 | 추상 클래스 | 인터페이스 |
|------|------------|----------|
| 키워드 | `abstract class` | `interface` |
| 인스턴스화 | ❌ | ❌ |
| 필드 | 모든 종류 가능 | `public static final`만 (상수) |
| 메서드 | 추상 + 일반 | 추상 + `default` + `static` |
| 생성자 | ✅ 있음 | ❌ 없음 |
| **상속/구현 수** | **단일 상속** | **다중 구현 가능** |
| 접근제한자 | 자유 (`private`, `protected` 등) | `public` (암묵적) |
| **상태(state) 보유** | **✅ 가능** | **❌ 불가** |
| 관계 표현 | IS-A ("~는 ~이다") | CAN-DO ("~할 수 있다") |

가장 핵심적인 차이는 두 가지입니다.

1. **상태(필드) 보유 여부**: 추상 클래스는 필드를 가질 수 있어 공통 데이터를 자식과 공유합니다. 인터페이스는 상수(`public static final`)만 가능합니다.
2. **상속 수**: 추상 클래스는 단일 상속, 인터페이스는 다중 구현.

그런데 여기서 한 가지 의문이 생깁니다. 인터페이스도 Java 8부터 `default` 키워드로 공통 메서드를 제공할 수 있지 않나요?

**`default` 메서드가 있어도 추상 클래스가 필요한 이유**

`default` 메서드는 인터페이스 안에 공통 구현을 넣을 수 있지만, **인스턴스 필드에 접근할 수 없습니다.** 인터페이스에 필드 자체가 존재하지 않기 때문입니다.

```java
// 인터페이스 — default 메서드의 한계
interface Animal {
    String getName(); // 이름을 얻으려면 메서드를 통해서만 가능

    default void breathe() {
        // System.out.println(name + " 호흡"); // ❌ name 필드 자체가 없음!
        System.out.println(getName() + " 호흡"); // ✅ 다른 메서드를 조합해야만 함
    }
}

// 추상 클래스 — 필드를 직접 활용 가능
abstract class Animal {
    protected String name; // ✅ 공유 상태 보유

    public void breathe() {
        System.out.println(name + " 호흡"); // ✅ 필드에 직접 접근
    }
}
```

`default` 메서드는 공유 데이터 없이 **다른 인터페이스 메서드를 조합하거나 파라미터만 다루는 로직**으로 제한됩니다. 공통 로직이 공유 상태에 의존해야 한다면 반드시 추상 클래스가 필요합니다.

또한 `default` 메서드가 Java 8에 도입된 원래 목적은 공통 구현 제공이 아니라, **기존 인터페이스에 메서드를 추가할 때 모든 구현 클래스를 수정하지 않아도 되도록 하는 하위 호환성** 때문이었습니다.

`default`까지 고려한 최종 비교표는 다음과 같습니다.

| 항목 | 추상 클래스 | 인터페이스 (`default` 포함) |
|------|------------|--------------------------|
| 인스턴스 필드 | ✅ 가능 | ❌ 불가 (상수만) |
| 생성자 | ✅ 가능 | ❌ 불가 |
| 공통 메서드 | ✅ 가능 | ✅ `default`로 가능 |
| **상태 기반 공통 로직** | **✅ 가능** | **❌ 불가** |
| `protected` 메서드 | ✅ 가능 | ❌ 항상 `public` |
| 다중 상속 | ❌ 단일 | ✅ 다중 구현 |
| `default`의 원래 목적 | — | 하위 호환성 |

이 차이를 이해하면 "언제 무엇을 써야 하는가?"에 대한 답이 보입니다.

### **5. 언제 추상 클래스? 언제 인터페이스?**

**추상 클래스를 선택해야 할 때**

```
✅ 공통된 상태(필드)를 자식과 공유해야 할 때
   → name, age 같은 필드를 여러 자식이 공유해야 한다면 추상 클래스

✅ IS-A 관계가 명확하고 코드 재사용이 중요할 때
   → Dog는 Animal이다 → Animal을 abstract class로

✅ 자식 클래스 간에 공통 로직이 많을 때
   → 공통 처리 흐름을 부모가 정하고, 일부만 자식이 채워야 한다면

✅ protected 멤버나 생성자 체이닝이 필요할 때
   → 자식에게 내부 데이터를 안전하게 전달해야 할 때
```

**인터페이스를 선택해야 할 때**

```
✅ 행위(기능)의 계약만 정의할 때
   → "이 클래스는 fly()를 반드시 구현한다"는 약속만 필요하다면

✅ 다중 타입이 필요할 때
   → Duck이 Animal이면서 Flyable이고 Swimmable이어야 할 때

✅ 구현체를 나중에 자유롭게 교체하고 싶을 때
   → 전략 패턴, DI, Mock 테스트 등

✅ 관련 없는 클래스들에 공통 기능을 부여할 때
   → Bird와 Airplane 모두 fly()가 필요하지만 상속 관계는 없는 경우
```

**판단 기준 한 줄 요약**

> 공통 **상태(데이터)** 를 공유하고 싶다면 → **추상 클래스**
> 공통 **행위(기능)** 의 계약만 필요하다면 → **인터페이스**

실무에서는 이 둘을 **함께 사용**하는 패턴이 가장 강력합니다.

### **6. 실무 패턴: 템플릿 메서드 패턴과 인터페이스 조합**

**템플릿 메서드 패턴(Template Method Pattern)** 은 추상 클래스를 가장 잘 활용하는 디자인 패턴입니다. **알고리즘의 뼈대(순서)는 부모가 정하고, 세부 구현만 자식이 채우는** 방식입니다.

```java
public abstract class DataProcessor {
    // 템플릿 메서드 — 알고리즘 순서를 고정 (final로 변경 불가)
    public final void process() {
        readData();     // 1단계: 공통
        processData();  // 2단계: 자식마다 다름 (추상 메서드)
        writeData();    // 3단계: 공통
    }

    private void readData()  { System.out.println("데이터 읽기"); }
    private void writeData() { System.out.println("데이터 저장"); }

    // 자식이 반드시 구현해야 하는 단계
    protected abstract void processData();
}

public class CSVProcessor extends DataProcessor {
    @Override
    protected void processData() {
        System.out.println("CSV 파싱 처리 중...");
    }
}

public class JSONProcessor extends DataProcessor {
    @Override
    protected void processData() {
        System.out.println("JSON 파싱 처리 중...");
    }
}
```

```java
DataProcessor csv  = new CSVProcessor();
DataProcessor json = new JSONProcessor();

csv.process();
// 데이터 읽기 → CSV 파싱 처리 중... → 데이터 저장

json.process();
// 데이터 읽기 → JSON 파싱 처리 중... → 데이터 저장
```

**인터페이스 + 추상 클래스 조합 패턴**

실무에서는 인터페이스로 계약을 정의하고, 추상 클래스로 공통 구현을 제공하고, 구체 클래스가 나머지를 완성하는 3계층 구조를 자주 사용합니다.

```java
// 1. 인터페이스: 계약 정의 (CAN-DO)
public interface Payable {
    void pay(int amount);
    void refund(int amount);
}

// 2. 추상 클래스: 공통 구현 제공 (공통 상태 + 로직)
public abstract class AbstractPayment implements Payable {
    protected String merchantId;
    protected List<String> transactionLog = new ArrayList<>();

    public AbstractPayment(String merchantId) {
        this.merchantId = merchantId;
    }

    // 공통 로직 — 모든 결제 수단에서 동일
    protected void log(String message) {
        transactionLog.add(message);
        System.out.println("[LOG] " + merchantId + " - " + message);
    }

    @Override
    public void refund(int amount) { // 환불은 공통 구현
        log("환불 처리: " + amount + "원");
    }
    // pay()는 결제 수단마다 다르므로 추상 메서드로 남김
}

// 3. 구체 클래스: 차이점만 구현
public class KakaoPayment extends AbstractPayment {
    public KakaoPayment(String merchantId) {
        super(merchantId);
    }

    @Override
    public void pay(int amount) {
        log("카카오페이 결제: " + amount + "원");
    }
}

public class NaverPayment extends AbstractPayment {
    public NaverPayment(String merchantId) {
        super(merchantId);
    }

    @Override
    public void pay(int amount) {
        log("네이버페이 결제: " + amount + "원");
    }
}
```

```java
Payable kakao = new KakaoPayment("MERCHANT-001");
Payable naver = new NaverPayment("MERCHANT-001");

kakao.pay(50000);   // [LOG] MERCHANT-001 - 카카오페이 결제: 50000원
kakao.refund(10000); // [LOG] MERCHANT-001 - 환불 처리: 10000원 (공통 구현)
```

각 계층의 역할이 명확히 분리되어 있습니다.

| 계층 | 역할 |
|------|------|
| `Payable` (인터페이스) | "결제와 환불을 반드시 구현하라"는 계약 |
| `AbstractPayment` (추상 클래스) | 공통 상태(`merchantId`, `log`)와 공통 구현(`refund`) 제공 |
| `KakaoPayment` (구체 클래스) | 결제 수단별 차이점(`pay`)만 구현 |

새로운 결제 수단을 추가할 때 `AbstractPayment`만 상속하면 공통 기능은 자동으로 따라옵니다.

### **7. 최종 정리: 핵심 요약**

- **추상 클래스**: `abstract class`로 선언. 인스턴스화 불가. 추상 메서드 + 일반 메서드 혼합. **상태(필드)와 공통 구현을 자식과 공유**할 때 사용.
- **추상 메서드**: 선언만 있고 구현 없음. 자식 클래스가 반드시 오버라이딩해야 함. 안 하면 자식도 `abstract`여야 함.
- **추상 클래스 vs 인터페이스**: 공통 **상태(필드)** 공유 필요 → 추상 클래스. 공통 **행위 계약**만 필요 → 인터페이스. 다중 타입 필요 → 인터페이스.
- **`default` 메서드의 한계**: 인터페이스의 `default` 메서드도 공통 구현을 제공하지만 인스턴스 필드가 없어 상태 기반 로직은 불가. `default`의 원래 목적은 공통 구현이 아닌 **하위 호환성**.
- **템플릿 메서드 패턴**: 추상 클래스의 핵심 활용. 알고리즘 순서는 부모가 `final`로 고정하고, 가변적인 단계만 자식이 구현.
- **3계층 조합 패턴**: 인터페이스(계약) → 추상 클래스(공통 구현) → 구체 클래스(차이점) 구조가 실무에서 가장 강력하고 확장성이 높습니다.
