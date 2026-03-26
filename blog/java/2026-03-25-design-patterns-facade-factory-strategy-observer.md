---
title: "디자인 패턴 — 파사드, 팩토리, 전략, 옵저버"
date: 2026-03-25
authors: HyungJun
tags: [디자인패턴, Facade, Factory, Strategy, Observer]
---

`Facade` `Factory Method` `Strategy` `OCP` `Observer` `Publisher` `Subscriber`

복잡한 하위 시스템을 단일 창구로 묶는 파사드, 생성과 등록을 분리하는 팩토리 메서드, 알고리즘을 런타임에 교체하는 전략, 이벤트를 구독자에게 전파하는 옵저버 패턴을 정리합니다.

<!-- truncate -->

---

### **1. 파사드(Facade) — 단일 창구로 결합도 낮추기**

복잡한 하위 시스템의 호출 순서를 숨기고 외부에 단일 진입점만 제공하는 패턴입니다.

```java
class Amp       { void on() {...}  void setVolume(int v) {...} }
class DvdPlayer { void on() {...}  void play(String m) {...}  }
class Projector { void on() {...}  void wideScreenMode() {...} }

// 파사드 — 복잡한 내부 흐름을 한 메서드로 감쌈
class HomeTheaterFacade {
    private Amp amp;
    private DvdPlayer dvd;
    private Projector proj;

    HomeTheaterFacade(Amp a, DvdPlayer d, Projector p) {
        this.amp = a; this.dvd = d; this.proj = p;
    }

    void watchMovie(String movie) {
        proj.on();
        proj.wideScreenMode();
        amp.on();
        amp.setVolume(10);
        dvd.on();
        dvd.play(movie);
    }
}
```

```java
// 외부는 이 한 줄만 호출
facade.watchMovie("인터스텔라");
```

- 하위 시스템이 변경되어도 호출부 코드는 변경 없이 유지됩니다.
- `SqlSessionFactoryManager`가 복잡한 설정 초기화를 숨기고 `getFactory()`만 노출하는 것도 파사드 개념입니다.

---

### **2. 팩토리 메서드(Factory Method) — 생성과 등록 분리**

생성 로직과 등록/관리 로직을 분리해 새 제품 추가 시 기존 코드를 수정하지 않아도 됩니다.

```java
abstract class Product { abstract void use(); }

abstract class Factory {
    // final: 흐름을 고정 — 하위 클래스가 변경 불가
    public final Product create(String owner) {
        Product p = createProduct(owner); // 생성 → 하위에 위임
        registerProduct(p);               // 등록 → 팩토리가 관리
        return p;
    }
    protected abstract Product createProduct(String owner);
    protected abstract void registerProduct(Product p);
}

class IDCard extends Product {
    private String owner;
    IDCard(String owner) { this.owner = owner; }
    public void use() { System.out.println(owner + "의 카드 사용"); }
}

class IDCardFactory extends Factory {
    private List<Product> cards = new ArrayList<>();
    protected Product createProduct(String owner) { return new IDCard(owner); }
    protected void registerProduct(Product p)     { cards.add(p); }
}
```

```java
Factory factory = new IDCardFactory();
Product card1 = factory.create("형준");
Product card2 = factory.create("민수");
card1.use(); // 형준의 카드 사용
```

| 단계 | 역할 |
| :--- | :--- |
| `create()` (final) | 공통 흐름 고정 |
| `createProduct()` | 구체 제품 생성 — 하위 팩토리에 위임 |
| `registerProduct()` | 생성된 제품 등록/수집 |

새 카드(패스포트, 멤버십)를 추가할 때 `Factory`와 `Product`를 상속한 클래스만 추가하면 됩니다. 기존 코드 수정 없음 — **OCP**.

---

### **3. 전략(Strategy) — 런타임 알고리즘 교체**

교체 가능한 알고리즘을 인터페이스로 분리하고 런타임에 주입합니다.

```java
interface PaymentStrategy {
    void pay(int amount);
}

class CardPayment implements PaymentStrategy {
    public void pay(int amount) { System.out.println("카드 결제: " + amount); }
}
class CashPayment implements PaymentStrategy {
    public void pay(int amount) { System.out.println("현금 결제: " + amount); }
}

class Payment {
    private PaymentStrategy strategy;
    public void setStrategy(PaymentStrategy s) { this.strategy = s; }
    public void checkout(int amount) {
        if (strategy == null) throw new IllegalStateException("결제 수단 없음");
        strategy.pay(amount);
    }
}
```

```java
Payment p = new Payment();
p.setStrategy(new CardPayment());
p.checkout(10000); // 카드 결제: 10000

p.setStrategy(new CashPayment()); // 런타임에 교체
p.checkout(5000);  // 현금 결제: 5000
```

| 구성 요소 | 역할 |
| :--- | :--- |
| `Strategy` 인터페이스 | 공통 행위 정의 |
| `ConcreteStrategy` | 수단별 구현 (외부 API 연동 코드 위치) |
| `Context` | 전략 선택/호출, setter로 런타임 교체 가능 |

`if-else` 분기 대신 **객체 주입**으로 전환하면 새 결제 수단 추가 시 기존 코드 변경 없음 — **OCP**.

---

### **4. 옵저버(Observer) — 이벤트 구독/통지**

상태 변화 시 구독 중인 모든 객체에 자동 통지합니다. 유튜브 알림, 블로그 구독, 상품 재입고 알림 등에 적합합니다.

```java
interface Observer {
    void update(String message);
}

class YouTubeChannel {
    private List<Observer> subscribers = new ArrayList<>();

    public void subscribe(Observer o)   { subscribers.add(o); }
    public void unsubscribe(Observer o) { subscribers.remove(o); }

    private void notifySubscribers(String msg) {
        for (Observer o : subscribers) o.update(msg);
    }

    public void uploadVideo(String title) {
        notifySubscribers("새 영상 업로드: " + title);
    }
}

class User implements Observer {
    private String name;
    User(String name) { this.name = name; }
    public void update(String msg) { System.out.println(name + " 알림: " + msg); }
}
```

```java
YouTubeChannel ch = new YouTubeChannel();
User u1 = new User("형준"), u2 = new User("민수");
ch.subscribe(u1);
ch.subscribe(u2);
ch.uploadVideo("디자인 패턴 완전정복");
// 형준 알림: 새 영상 업로드: 디자인 패턴 완전정복
// 민수 알림: 새 영상 업로드: 디자인 패턴 완전정복
```

| 메서드 | 역할 |
| :--- | :--- |
| `subscribe(o)` | 구독자 등록 |
| `unsubscribe(o)` | 구독 취소 (`remove(Object)` 기반 — `equals/hashCode` 중요) |
| `notifySubscribers(msg)` | 모든 구독자에 `update()` 호출 |
| `uploadVideo(title)` | 상태 변화 발생 → notify 트리거 |

실무에서는 WebSocket·SSE·Kafka 등과 결합해 비동기 알림으로 발전합니다.

---

### **패턴 비교 요약**

| 패턴 | 핵심 목적 | OCP 적용 |
| :--- | :--- | :--- |
| Facade | 복잡한 시스템을 단일 창구로 | 하위 시스템 변경 시 외부 코드 불변 |
| Factory Method | 생성과 등록/관리 분리 | 새 제품 추가 시 기존 코드 불변 |
| Strategy | 알고리즘 런타임 교체 | 새 전략 추가 시 기존 코드 불변 |
| Observer | 이벤트 구독/전파 | 새 구독자 추가 시 퍼블리셔 코드 불변 |
