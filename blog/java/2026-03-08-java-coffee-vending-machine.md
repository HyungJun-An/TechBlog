---
title: "커피 자판기로 배우는 OOP"
date: 2026-03-08
authors: HyungJun
tags: [Java, 기본기, 디자인패턴]
---
`OCP`, `DIP`, `다형성`,`추상클래스`,`인터페이스`

추상 클래스, 인터페이스, 다형성, 전략 패턴 — 이론으로만 배우면 언제 어떻게 써야 하는지 막막합니다. 커피 자판기를 직접 설계하고 구현하면서, 이 개념들이 **실제 코드에서 어떻게 맞물리는지** 손으로 익혀보겠습니다.

<!-- truncate -->

### **1. 프로젝트 개요**

커피 자판기를 콘솔로 구현한 프로젝트입니다. 요구사항은 크게 두 가지 역할로 나뉩니다.

| 역할 | 주요 기능 |
|------|---------|
| **일반 사용자** | 음료 목록 확인 → 음료 선택 → 결제 수단 선택 (현금/카드) → 음료 수령 |
| **관리자** | 비밀번호 인증 → 재고 보충 / 재고·매출 조회 |

음료는 에스프레소(2,000원), 아메리카노(2,500원), 카페라떼(3,000원), 핫초코(3,000원) 네 가지이며 각 10개씩 초기 재고를 가집니다.

여기서 핵심 설계 결정이 등장합니다.

> - 음료마다 **제조 방법(make)** 이 다르다 → 추상 클래스
> - 결제 수단은 **언제든 교체** 가능해야 한다 → 인터페이스 + 전략 패턴
> - 자판기는 **모든 음료를 하나의 배열**로 관리한다 → 다형성

패키지 구조는 다음과 같습니다.

```
src/
├── Main.java
├── beverage/
│   ├── Beverage.java       ← 추상 클래스
│   ├── Espresso.java
│   ├── Americano.java
│   ├── CafeLatte.java
│   └── HotChoco.java
├── payment/
│   ├── PaymentStrategy.java ← 인터페이스
│   ├── CashPayment.java
│   └── CardPayment.java
└── machine/
    ├── VendingMachine.java  ← 컨텍스트
    └── Admin.java
```

### **2. 추상 클래스: Beverage**

음료마다 이름과 가격은 공통이지만, **제조 방법은 제각각**입니다. 에스프레소와 아메리카노의 `make()` 과정은 다릅니다. 이 구조를 추상 클래스로 표현했습니다.

```java
// beverage/Beverage.java
public abstract class Beverage {
    protected String name;
    protected int price;

    public Beverage(String name, int price) {
        this.name = name;
        this.price = price;
    }

    public String getName()  { return name; }
    public int    getPrice() { return price; }

    public abstract void make(); // 자식이 반드시 구현
}
```

`name`과 `price`는 모든 음료가 공유하는 **상태(필드)** 이므로 추상 클래스에 넣습니다. `make()`는 선언만 있고 구현이 없는 **추상 메서드** — 자식 클래스가 반드시 오버라이딩해야 합니다.

구체적인 음료 클래스는 `make()`만 채우면 됩니다.

```java
// beverage/Espresso.java
public class Espresso extends Beverage {
    public Espresso() {
        super("에스프레소", 2000); // 부모 생성자로 name, price 전달
    }

    @Override
    public void make() {
        System.out.println("  → 에스프레소 샷을 추출합니다...");
        System.out.println("  ☕ 에스프레소 완성!");
    }
}

// beverage/Americano.java
public class Americano extends Beverage {
    public Americano() {
        super("아메리카노", 2500);
    }

    @Override
    public void make() {
        System.out.println("  → 에스프레소 샷을 추출합니다...");
        System.out.println("  → 물을 붓습니다...");
        System.out.println("  ☕ 아메리카노 완성!");
    }
}
```

**왜 인터페이스가 아닌 추상 클래스인가?**

`name`과 `price` 같은 **인스턴스 필드(공유 상태)** 를 자식 클래스와 함께 써야 하기 때문입니다. 인터페이스는 `public static final` 상수만 가질 수 있어서, 음료마다 다른 이름과 가격을 가지는 구조를 표현할 수 없습니다.

| | 추상 클래스 | 인터페이스 |
|---|---|---|
| 인스턴스 필드 | ✅ 가능 | ❌ 불가 (상수만) |
| 생성자 | ✅ 가능 | ❌ 불가 |
| 공통 메서드 | ✅ 가능 | ✅ `default`로 가능 |
| 다중 상속 | ❌ 단일 | ✅ 다중 구현 |

> **판단 기준**: 공통 **상태(데이터)** 를 공유해야 한다면 추상 클래스, 공통 **행위(기능) 계약**만 필요하다면 인터페이스.

### **3. 인터페이스 + 전략 패턴: PaymentStrategy**

현금과 카드는 결제 흐름이 전혀 다릅니다. 현금은 금액을 누적 투입하고 잔액을 계산해야 하고, 카드는 카드 번호로 승인 요청을 보냅니다. 그러나 자판기 입장에서는 **"결제가 성공했는가?"** 라는 질문에만 관심이 있습니다. 이 계약을 인터페이스로 정의합니다.

```java
// payment/PaymentStrategy.java
public interface PaymentStrategy {
    boolean pay(int amount); // 결제 성공 여부 반환
    String getType();
}
```

각 결제 수단은 이 계약을 자신의 방식으로 구현합니다.

```java
// payment/CashPayment.java
public class CashPayment implements PaymentStrategy {
    private int balance;

    public void insert(int amount) {
        balance += amount;
        System.out.printf("  %,d원 투입 (현재 잔액: %,d원)%n", amount, balance);
    }

    @Override
    public boolean pay(int amount) {
        if (balance < amount) {
            System.out.printf("  잔액 부족 (현재: %,d원 / 필요: %,d원)%n", balance, amount);
            return false;
        }
        balance -= amount;
        return true;
    }

    public int refund() {
        int change = balance;
        balance = 0;
        return change;
    }

    public int getBalance() { return balance; }

    @Override
    public String getType() { return "현금"; }
}
```

```java
// payment/CardPayment.java
public class CardPayment implements PaymentStrategy {
    private String cardNumber;

    public CardPayment(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    @Override
    public boolean pay(int amount) {
        System.out.println("  카드(" + cardNumber + ") 승인 요청 중...");
        System.out.printf("  %,d원 승인 완료!%n", amount);
        return true;
    }

    @Override
    public String getType() { return "카드"; }
}
```

이제 자판기(`VendingMachine`)는 `PaymentStrategy` **인터페이스 타입**으로 결제 수단을 보유합니다. 런타임에 현금인지 카드인지 주입받아 사용합니다. 이것이 **전략 패턴(Strategy Pattern)** 입니다.

```java
// machine/VendingMachine.java (핵심 부분)
public class VendingMachine {
    private PaymentStrategy paymentStrategy; // 인터페이스 타입으로 보유

    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.paymentStrategy = strategy; // 런타임에 전략 교체
    }

    public boolean purchase(Beverage beverage) {
        if (paymentStrategy == null) {
            System.out.println("결제 수단을 선택해주세요.");
            return false;
        }

        if (paymentStrategy.pay(beverage.getPrice())) { // VMI — 실제 구현체 호출
            // ... 재고 감소, 매출 누적
            beverage.make(); // 음료 제조
            return true;
        }
        return false;
    }
}
```

`VendingMachine`은 현금인지 카드인지 **알 필요가 없습니다**. `pay(amount)`를 호출하면 실제 구현체(CashPayment 또는 CardPayment)가 알아서 처리합니다. 나중에 카카오페이나 네이버페이를 추가해도 `VendingMachine` 코드는 단 한 줄도 바꿀 필요가 없습니다.

```java
// Main.java — 런타임에 전략을 주입
machine.setPaymentStrategy(new CashPayment()); // 현금 결제
// 또는
machine.setPaymentStrategy(new CardPayment("1234-5678")); // 카드 결제
```

### **4. 다형성: Beverage[]**

자판기는 네 가지 음료를 하나의 배열로 관리합니다.

```java
// machine/VendingMachine.java
public class VendingMachine {
    private Beverage[] beverages; // 다형성 — 부모 타입 배열
    private int[] stock;

    public VendingMachine() {
        beverages = new Beverage[]{
            new Espresso(),
            new Americano(),
            new CafeLatte(),
            new HotChoco()
        };
        stock = new int[]{10, 10, 10, 10};
    }

    public void showMenu() {
        for (int i = 0; i < beverages.length; i++) {
            String status = (stock[i] > 0) ? "" : " [품절]";
            System.out.printf("  %d. %-10s %,5d원%s%n",
                i + 1, beverages[i].getName(), beverages[i].getPrice(), status);
        }
    }

    public boolean purchase(Beverage beverage) {
        // ...
        beverage.make(); // Espresso면 에스프레소 제조, Americano면 아메리카노 제조
        return true;
    }
}
```

`beverages[i].getName()`, `beverages[i].getPrice()`, `beverage.make()` — 배열의 각 원소가 실제로 어떤 음료인지 몰라도, 부모 타입(`Beverage`)에 정의된 메서드를 통해 일괄 처리합니다. 새 음료를 추가하더라도 `showMenu()`나 `purchase()` 로직은 수정할 필요가 없습니다.

### **5. 전체 흐름 한눈에 보기**

사용자가 "아메리카노를 카드로 구매"하는 흐름을 추적해봅니다.

```
Main.processPurchase(1)               // 사용자가 2번(아메리카노) 선택
  → machine.selectBeverage(1)         // Beverage 반환 (Americano 인스턴스)
  → machine.setPaymentStrategy(       // 전략 주입
        new CardPayment("1234-5678"))
  → machine.purchase(beverage)
      → paymentStrategy.pay(2500)     // VMI → CardPayment.pay() 호출
          → "카드(1234-5678) 승인 완료"
      → stock[1]--                    // 재고 감소
      → totalSales += 2500            // 매출 누적
      → beverage.make()               // VMI → Americano.make() 호출
          → "에스프레소 샷 추출..."
          → "물을 붓습니다..."
          → "☕ 아메리카노 완성!"
```

두 번의 **가상 메서드 호출(VMI)** 이 등장합니다. `paymentStrategy.pay()`에서 CardPayment의 구현이, `beverage.make()`에서 Americano의 구현이 런타임에 선택됩니다.

### **6. 설계 원칙 정리**

| 개념 | 적용 위치 | 이유 |
|------|---------|------|
| **추상 클래스** | `Beverage` | `name`, `price` 공통 상태를 자식과 공유하면서 `make()` 구현을 강제 |
| **인터페이스** | `PaymentStrategy` | 결제 수단의 교체 가능성 보장. 상태 없이 행위 계약만 필요 |
| **전략 패턴** | `VendingMachine` ← `PaymentStrategy` | 결제 수단을 런타임에 교체, 자판기 코드 수정 없이 확장 |
| **다형성** | `Beverage[]` | 음료 종류에 상관없이 배열로 일괄 처리 |
| **캡슐화** | `Admin` ← `VendingMachine` | 재고·매출 데이터는 `VendingMachine`이 소유, `Admin`은 메서드를 통해서만 접근 |

### **7. 배운 점**

이론에서는 "추상 클래스는 공통 상태가 있을 때 쓴다"는 문장이 간단해 보이지만, 실제로 `Beverage`를 설계할 때 "왜 인터페이스가 아닌 추상 클래스여야 하는가?"를 고민하면서 그 의미를 체감했습니다.

인터페이스로 `PaymentStrategy`를 분리했을 때의 장점도 마찬가지입니다. `VendingMachine`이 `CashPayment`나 `CardPayment`의 내부 구조를 전혀 모르는 상태에서도 결제가 작동하는 경험이, 의존성 역전(DIP)과 개방-폐쇄 원칙(OCP)이 왜 중요한지를 직접 보여줬습니다.

작은 프로젝트지만 **추상 클래스 → 인터페이스 → 전략 패턴 → 다형성** 이 네 개념이 어떻게 서로를 보완하며 맞물리는지, 그 구조가 손에 익었습니다.

설계를 마치고 SOLID 원칙과 다시 연결해보니, 각 개념이 어떤 원칙을 구현하는지도 정리됐습니다.

**OCP(개방-폐쇄 원칙)** 는 `PaymentStrategy`에서 가장 잘 드러납니다. 카카오페이나 네이버페이를 추가할 때 `VendingMachine` 코드는 한 줄도 건드리지 않고, `PaymentStrategy`를 구현하는 클래스만 하나 더 추가하면 됩니다. "확장에 열려 있고, 수정에 닫혀 있다"가 코드에서 실제로 무슨 의미인지 체감할 수 있었습니다.

**DIP(의존 역전 원칙)** 는 처음에 `Beverage[]` 배열이라고 생각했지만, 실제로는 `PaymentStrategy`가 더 정확한 예시입니다. `VendingMachine`(고수준 모듈)이 `CashPayment`나 `CardPayment` 같은 구체 클래스를 직접 알지 않고, `PaymentStrategy` 인터페이스(추상화)에만 의존하는 구조가 DIP입니다.

```java
// ✅ DIP 적용 — 추상화에 의존
private PaymentStrategy paymentStrategy;

// ❌ DIP 위반 — 구체 클래스에 직접 의존
private CashPayment cashPayment;
private CardPayment cardPayment;
```

`Beverage[]`는 DIP보다 **다형성**에 가깝습니다. 구체 타입이 아닌 추상 타입(`Beverage`)에 의존한다는 점에서 겹치지만, 핵심 의도는 여러 음료를 하나의 타입으로 일괄 처리하는 것입니다.

| 원칙 | 실제 적용 위치 |
|------|-------------|
| OCP | `PaymentStrategy` — 새 결제 수단 추가 시 기존 코드 수정 없음 |
| DIP | `VendingMachine`이 `CashPayment`/`CardPayment` 대신 `PaymentStrategy`에 의존 |
| 다형성 | `Beverage[]` — 음료 종류 무관하게 일괄 처리 |
