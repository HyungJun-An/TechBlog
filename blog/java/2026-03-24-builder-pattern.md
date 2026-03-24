---
title: "Builder 패턴 직접 구현하기"
date: 2026-03-24
authors: HyungJun
tags: [Java, 디자인패턴]
---

`@Builder` 어노테이션 한 줄로 끝나지만, 내부에서 어떤 일이 일어나는지 직접 만들어봐야 진짜 이해가 됩니다. 점층적 생성자 패턴의 한계에서 출발해 Builder를 손으로 구현하는 과정을 정리합니다.

<!-- truncate -->

---

### **왜 Builder가 필요한가 — 점층적 생성자의 한계**

필드가 많아질수록 생성자가 쌓입니다.

```java
public class Computer {
    private String cpu;
    private String ram;
    private String storage;
    private String gpu;
    private String os;

    // 필드마다 생성자를 추가하는 점층적 생성자 패턴
    public Computer(String cpu) { ... }
    public Computer(String cpu, String ram) { ... }
    public Computer(String cpu, String ram, String storage) { ... }
    // ... 조합이 늘어날수록 무한 증식
}
```

```java
// 사용 시 — 각 인자가 뭔지 알 수가 없음
Computer c = new Computer("i9", "32GB", "1TB", null, "Windows");
//                                               ^^^^ gpu 없음을 null로 표현
```

**문제 2가지:**
- 인자 순서를 외워야 하고, null로 빈 자리를 채워야 합니다.
- 컴파일러가 `String` 타입 인자 순서 오류를 잡아주지 못합니다.

---

### **Builder 패턴 직접 구현**

```java
public class Computer {
    // 1. 필드는 private final — 불변 객체
    private final String cpu;
    private final String ram;
    private final String storage;
    private final String gpu;
    private final String os;

    // 2. 외부에서 new 불가 — Builder만 통해 생성
    private Computer(Builder builder) {
        this.cpu     = builder.cpu;
        this.ram     = builder.ram;
        this.storage = builder.storage;
        this.gpu     = builder.gpu;
        this.os      = builder.os;
    }

    @Override
    public String toString() {
        return "Computer{cpu='" + cpu + "', ram='" + ram +
               "', storage='" + storage + "', gpu='" + gpu +
               "', os='" + os + "'}";
    }

    // 3. 정적 내부 클래스 Builder
    public static class Builder {
        // 필수값
        private final String cpu;
        private final String ram;

        // 선택값 — 기본값 세팅
        private String storage = "256GB SSD";
        private String gpu     = "내장 그래픽";
        private String os      = "Windows 11";

        // 필수값은 Builder 생성자에서 받음
        public Builder(String cpu, String ram) {
            this.cpu = cpu;
            this.ram = ram;
        }

        // 선택값은 메서드 체이닝으로 설정 — 자기 자신(Builder) 반환이 핵심
        public Builder storage(String storage) {
            this.storage = storage;
            return this;
        }
        public Builder gpu(String gpu) {
            this.gpu = gpu;
            return this;
        }
        public Builder os(String os) {
            this.os = os;
            return this;
        }

        // 최종적으로 Computer 객체 생성
        public Computer build() {
            return new Computer(this);
        }
    }
}
```

---

### **사용 방법**

```java
// 필수값만
Computer basic = new Computer.Builder("i5", "16GB")
        .build();

// 선택값 일부 지정
Computer gaming = new Computer.Builder("i9", "32GB")
        .storage("2TB NVMe")
        .gpu("RTX 4090")
        .build();

// 전체 지정
Computer workstation = new Computer.Builder("Xeon", "64GB")
        .storage("4TB SSD")
        .gpu("RTX 6000")
        .os("Ubuntu 24.04")
        .build();

System.out.println(gaming);
// Computer{cpu='i9', ram='32GB', storage='2TB NVMe', gpu='RTX 4090', os='Windows 11'}
```

인자 이름이 메서드명으로 드러나므로 **순서 실수가 없고, 어떤 값을 설정하는지 코드만 봐도 명확**합니다.

---

### **메서드 체이닝이란?**

메서드를 호출한 결과로 **같은 객체를 다시 돌려받아** 곧바로 다음 메서드를 이어 호출하는 방식입니다.

```java
// 메서드 체이닝 없이 — 매번 변수에 받아야 함
Builder b = new Computer.Builder("i9", "32GB");
b.storage("2TB");
b.gpu("RTX 4090");
Computer c = b.build();

// 메서드 체이닝 — 한 줄로 이어 쓸 수 있음
Computer c = new Computer.Builder("i9", "32GB")
        .storage("2TB")
        .gpu("RTX 4090")
        .build();
```

가능한 이유는 각 메서드가 `return this`로 **자기 자신(Builder 객체)을 반환**하기 때문입니다.

```java
// 이 구조 덕분에 체이닝이 가능
public Builder storage(String storage) {
    this.storage = storage;
    return this; // Builder 자신을 반환
}

// 호출 흐름을 풀어 쓰면
Builder b = new Computer.Builder("i9", "32GB"); // Builder 객체 생성
Builder b2 = b.storage("2TB");                  // storage 설정 후 같은 b 반환
Builder b3 = b2.gpu("RTX 4090");                // gpu 설정 후 같은 b 반환
Computer c = b3.build();                         // 최종 객체 생성
// b, b2, b3 는 모두 같은 객체 (return this 이므로)
```

메서드 체이닝은 Builder 패턴 외에도 Java의 `StringBuilder`, Stream API(`filter().map().collect()`) 등에서 동일한 원리로 사용됩니다.

---

### **구조 핵심 포인트 3가지**

**1. `Computer` 생성자는 `private`**

외부에서 `new Computer(...)`로 직접 생성할 수 없습니다. 반드시 `Builder`를 통해서만 만들 수 있습니다.

**2. 각 setter 메서드는 `Builder`를 반환**

```java
public Builder storage(String storage) {
    this.storage = storage;
    return this; // 자기 자신을 반환해야 메서드 체이닝 가능
}
```

`return this`가 없으면 `.storage(...).gpu(...)`처럼 이어서 호출할 수 없습니다.

**3. 필수값 vs 선택값 분리**

| 구분 | 처리 방법 |
| :--- | :--- |
| 필수값 | `Builder` 생성자 인자로 받음 → 누락 시 컴파일 에러 |
| 선택값 | 메서드 체이닝으로 받음, 기본값 세팅 → 호출 안 해도 됨 |

---

### **Lombok `@Builder`와 비교**

```java
// Lombok — 어노테이션 한 줄
@Builder
public class Computer { ... }

// 사용
Computer c = Computer.builder()
        .cpu("i9")
        .ram("32GB")
        .build();
```

Lombok은 위에서 직접 구현한 내용을 컴파일 타임에 자동 생성해줍니다. 내부 동작은 동일합니다.

#### **`new Computer.Builder()` vs `Computer.builder()` — 왜 호출 방식이 다를까?**

직접 구현과 Lombok의 진입 방식이 달라 보이는 이유는 **Builder 객체를 만드는 방법**이 다르기 때문입니다.

```java
// 직접 구현 — Builder 클래스를 new로 직접 인스턴스화
new Computer.Builder("i9", "32GB")
//  ^^^^^^^^ Builder 클래스 자체를 new로 생성

// Lombok — Computer 클래스에 생성된 정적 팩토리 메서드 호출
Computer.builder()
//       ^^^^^^^ Computer 클래스 안에 자동 생성된 static 메서드
```

직접 구현 시 `Builder`는 `public static class`로 선언되어 있어서 외부에서 `new Computer.Builder()`로 직접 만들 수 있습니다.

반면 Lombok `@Builder`는 `Builder` 클래스를 생성하는 것에 더해, `Computer` 클래스 안에 다음 메서드를 **추가로 자동 생성**합니다.

```java
// Lombok이 자동으로 추가하는 정적 팩토리 메서드
public static Computer.ComputerBuilder builder() {
    return new Computer.ComputerBuilder(); // 내부에서 new Builder()를 대신 호출
}
```

즉 `Computer.builder()`는 `new Computer.Builder()`를 메서드로 한 번 감싼 것입니다. `new` 없이 메서드 호출만으로 Builder를 시작할 수 있어 더 자연스러운 체이닝 표현이 됩니다.

| 구분 | 직접 구현 | Lombok `@Builder` |
| :--- | :--- | :--- |
| Builder 시작 | `new Computer.Builder(...)` | `Computer.builder()` |
| 진입 방식 | Builder 클래스를 직접 `new` | 정적 팩토리 메서드 경유 |
| 필수값 처리 | Builder 생성자 인자로 강제 | 기본적으로 모두 선택값 (별도 설정 필요) |

#### **`new Lombok().builder()` — 동작하지만 잘못된 코드**

`builder()`는 Lombok이 생성한 **`static` 메서드**입니다. Java는 인스턴스로 `static` 메서드를 호출하는 것을 허용하지만, 실제로는 인스턴스를 무시하고 클래스에 직접 호출한 것과 동일하게 처리합니다.

```java
new Member.builder()                           // ❌ 컴파일 에러
// → Java는 new 뒤에 클래스명을 기대함
//   "Member 안에 builder라는 클래스를 찾아라"로 해석
//   그런 클래스가 없으므로 "cannot be resolved to a type" 에러

new Member().builder().firstName("안").build(); // △ 동작하지만 나쁜 코드
// → new Member()로 만든 인스턴스는 즉시 버려짐
//   static 메서드를 인스턴스로 호출 — IDE 경고 발생

Member.builder().firstName("안").build();       // ✅ 올바른 호출
// → static 메서드를 클래스명으로 직접 호출
```

`new`는 **클래스**를 인스턴스화할 때만 쓸 수 있습니다. `builder()`는 클래스가 아니라 **메서드**이므로 `new`를 붙이면 Java가 `Member.builder`를 타입으로 해석하려다 에러를 냅니다.

직접 구현한 버전에서 `new Computer.Builder()`가 가능한 이유는 `Builder`가 `Computer` 안에 선언된 **`static` 내부 클래스**이기 때문입니다. Lombok은 `builder()`라는 정적 팩토리 메서드를 자동 생성해 `new` 없이 접근하도록 설계했습니다.

| 표현 | 결과 | 이유 |
| :--- | :--- | :--- |
| `new Computer.Builder()` | ✅ 정상 | `Builder`는 클래스 → `new` 가능 |
| `Member.builder()` | ✅ 정상 | static 메서드 → 클래스명으로 호출 |
| `new Member.builder()` | ❌ 컴파일 에러 | `builder`라는 클래스가 없음 |
| `new Member().builder()` | △ 경고 | 불필요한 인스턴스 생성 후 static 메서드 호출 |

| 비교 | 직접 구현 | Lombok `@Builder` |
| :--- | :--- | :--- |
| 코드량 | 많음 | 어노테이션 1개 |
| 커스터마이징 | 자유로움 | 제한적 |
| 동작 이해 | 명확 | 생략되어 있음 |
| 실무 | 드묾 | 표준 |

직접 구현해보면 Lombok이 뭘 해주는지 정확히 알 수 있습니다. 내부 원리를 모르면 에러가 났을 때 원인을 찾기 어렵습니다.

---

### **배운 점**

Builder 패턴의 본질은 **"생성 과정을 단계적으로 분리해 읽기 쉬운 객체 생성 코드를 만드는 것"** 입니다.

- 필수값은 생성자, 선택값은 메서드 체이닝
- `return this`가 체이닝의 핵심
- `build()`에서 완성된 객체를 딱 한 번 만들어 반환

Singleton처럼 Builder도 "외부 생성을 막고 내가 원하는 방식으로만 객체를 만들게 한다"는 제어의 철학을 갖고 있습니다.
