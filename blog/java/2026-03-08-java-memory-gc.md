---
title: "Java의 메모리 구조와 GC의 관하여"
date: 2026-03-08
authors: HyungJun
tags: [Java, 기본기]
---

Java에서 데이터가 어떻게 저장되고 움직이는지, Array의 참조 타입 특성과 Call by Value/Reference 차이, JVM 메모리 구조(Method Area·Stack·Heap), static 키워드의 의미, 그리고 GC의 동작 원리까지 한 번에 정리합니다.

<!-- truncate -->

### **1. Array는 참조 타입: 주소로 움직이는 데이터**

Java의 데이터 타입은 크게 두 가지로 나뉩니다.

| 구분 | 종류 | 저장 위치 | 변수에 담기는 것 |
| --- | --- | --- | --- |
| **기본형 (Primitive)** | int, long, double, boolean 등 | Stack | 값 자체 |
| **참조형 (Reference)** | 배열, 객체, String 등 | Heap | 객체의 주소(참조) |

`Array`는 **참조 타입**입니다. 변수에는 배열 자체가 담기는 것이 아니라 **Heap에 생성된 배열 객체의 주소**가 담깁니다.

```java
int[] arr1 = {1, 2, 3}; // Heap에 배열 생성, arr1은 그 주소를 가짐
int[] arr2 = arr1;       // arr2도 같은 주소를 가짐

arr2[0] = 99;

System.out.println(arr1[0]); // 99 → arr1과 arr2가 같은 객체를 가리키기 때문!
```

```
Stack          Heap
┌────────┐     ┌─────────────┐
│ arr1 ──┼────►│ [99, 2, 3]  │
├────────┤     └─────────────┘
│ arr2 ──┼────►    (동일 주소)
└────────┘
```

이처럼 참조 타입은 **주소를 공유**하기 때문에, 한쪽을 수정하면 다른 쪽에도 영향을 미칩니다. 이 특성이 바로 **Call by Reference**의 핵심입니다.

그렇다면 배열을 독립적으로 복사하려면 어떻게 해야 할까요?

### **2. 객체 복사: Cloneable과 깊은 복사**

단순히 `arr2 = arr1`처럼 대입하면 주소만 복사되는 **얕은 복사(Shallow Copy)** 가 됩니다. 진짜 독립적인 복사본이 필요하다면 **깊은 복사(Deep Copy)** 가 필요합니다.

**배열의 깊은 복사 방법**

```java
int[] original = {1, 2, 3};

// 방법 1: Arrays.copyOf()
int[] copy1 = Arrays.copyOf(original, original.length);

// 방법 2: clone()
int[] copy2 = original.clone();

// 방법 3: System.arraycopy()
int[] copy3 = new int[original.length];
System.arraycopy(original, 0, copy3, 0, original.length);

copy1[0] = 99;
System.out.println(original[0]); // 1 → 원본 유지!
```

**객체의 깊은 복사: `Cloneable`**

일반 객체를 복사하려면 `Cloneable` 인터페이스를 구현하고 `clone()` 메서드를 오버라이드해야 합니다.

```java
public class Person implements Cloneable {
    String name;
    int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    @Override
    protected Object clone() throws CloneNotSupportedException {
        return super.clone(); // Object의 clone() 호출
    }
}

// 사용
Person p1 = new Person("형준", 25);
Person p2 = (Person) p1.clone();

p2.name = "철수";
System.out.println(p1.name); // 형준 → 독립적으로 복사됨
```

> ⚠️ `Cloneable`을 구현하지 않고 `clone()`을 호출하면 `CloneNotSupportedException`이 발생합니다.
> 또한 객체 안에 다른 참조 타입 필드가 있으면, 그 필드까지 직접 복사해 주어야 진정한 깊은 복사가 됩니다.

### **3. Call by Value vs Call by Reference**

Java는 엄밀히 말하면 **항상 Call by Value**입니다. 다만 참조 타입의 경우 "주소값 자체"를 복사해서 넘기기 때문에 Call by Reference처럼 동작하는 것처럼 보입니다.

**기본형: 완전한 Call by Value**

```java
public static void change(int x) {
    x = 100;
}

int num = 10;
change(num);
System.out.println(num); // 10 → 원본 불변! 값의 복사본이 전달됨
```

**참조형: 주소값의 Call by Value**

```java
public static void change(int[] arr) {
    arr[0] = 100; // 같은 Heap 객체를 수정
}

int[] array = {1, 2, 3};
change(array);
System.out.println(array[0]); // 100 → 원본이 바뀜!
```

```java
public static void reassign(int[] arr) {
    arr = new int[]{99, 99}; // 새 객체를 가리키도록 변경 (로컬 변수만 변경)
}

int[] array = {1, 2, 3};
reassign(array);
System.out.println(array[0]); // 1 → 원본 불변! 메서드 안에서 재할당은 영향 없음
```

| 상황 | 결과 |
| --- | --- |
| 기본형 파라미터 수정 | 원본 불변 |
| 참조형 파라미터의 **내부 값** 수정 | 원본 변경 |
| 참조형 파라미터를 **새 객체로 재할당** | 원본 불변 |

이제 이 데이터들이 실제로 어디에 저장되는지 JVM 메모리 구조를 들여다볼 차례입니다.

### **4. JVM 메모리 구조: Method Area, Stack, Heap**

JVM은 메모리를 크게 세 영역으로 나누어 관리합니다.

```
┌─────────────────────────────────────────────────────┐
│                     JVM Memory                      │
│                                                     │
│  ┌──────────────────┐  ┌──────────┐  ┌───────────┐  │
│  │   Method Area    │  │  Stack   │  │   Heap    │  │
│  │ (Static 영역)    │  │          │  │           │  │
│  │                  │  │ frame 3  │  │  Object   │  │
│  │ - 클래스 정보    │  │ frame 2  │  │  Array    │  │
│  │ - static 변수    │  │ frame 1  │  │  String   │  │
│  │ - 상수 풀        │  │          │  │  Pool     │  │
│  └──────────────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────────────┘
```

**Method Area (메서드 영역)**

클래스가 JVM에 로드될 때 저장되는 영역입니다.

- 클래스의 구조 정보 (필드, 메서드 시그니처)
- **static 변수** 및 **static 메서드**
- 상수 풀 (Constant Pool) — 문자열 리터럴, 숫자 상수
- JVM이 종료될 때까지 유지됩니다.

**Stack (스택 영역)**

메서드가 호출될 때마다 **스택 프레임(Stack Frame)** 이 쌓이는 영역입니다.

- **지역 변수**, 매개변수, 연산 결과 등을 저장
- 기본형 변수는 값을 직접 저장
- 참조형 변수는 Heap의 주소를 저장
- 메서드가 종료되면 해당 프레임은 **자동으로 제거**됩니다.
- 재귀 호출이 너무 깊으면 `StackOverflowError` 발생

```java
public int add(int a, int b) { // a, b는 Stack에 저장
    int result = a + b;        // result도 Stack에 저장
    return result;
}                              // 메서드 종료 시 a, b, result 모두 제거
```

**Heap (힙 영역)**

`new` 키워드로 생성된 **모든 객체와 배열**이 저장되는 영역입니다.

- 크기가 동적으로 변하며, 가장 큰 메모리 공간
- String Pool도 Heap 내부에 위치
- 명시적으로 삭제할 수 없으며 **GC(Garbage Collector)** 가 관리
- 참조가 없는 객체는 GC의 대상이 됩니다.

```java
Person p = new Person("형준"); // Person 객체는 Heap에 생성
                               // p(참조 변수)는 Stack에 저장
```

Stack은 메서드 종료 시 자동 정리되는 반면, Heap은 그렇지 않습니다. 그렇다면 Heap의 쓸모없어진 객체들은 누가, 언제, 어떻게 정리할까요?

### **5. static 키워드: 클래스 레벨의 공유 자원**

`static`은 **인스턴스가 아닌 클래스에 소속**된다는 의미입니다. Method Area에 저장되어 모든 인스턴스가 공유합니다.

**static 변수**

```java
public class Counter {
    static int count = 0; // 모든 인스턴스가 공유

    public Counter() {
        count++;
    }
}

Counter c1 = new Counter();
Counter c2 = new Counter();
Counter c3 = new Counter();

System.out.println(Counter.count); // 3 → 모두 같은 count를 증가시킴
```

**static 메서드**

```java
public class MathUtil {
    // static 메서드는 인스턴스 없이 클래스명으로 직접 호출
    public static int square(int n) {
        return n * n;
    }
}

int result = MathUtil.square(5); // 인스턴스 생성 없이 호출
```

> ⚠️ static 메서드 안에서는 **인스턴스 변수(this)를 사용할 수 없습니다.** 인스턴스가 없어도 호출 가능하기 때문에, this가 무엇을 가리킬지 알 수 없기 때문입니다.

**static 초기화 블록**

```java
public class Config {
    static String dbUrl;

    static {
        // 클래스 로딩 시 딱 한 번 실행
        dbUrl = "jdbc:mysql://localhost:3306/mydb";
        System.out.println("Config 초기화 완료");
    }
}
```

| 구분 | 소속 | 메모리 위치 | 생성 시점 |
| --- | --- | --- | --- |
| 인스턴스 변수 | 인스턴스 | Heap | `new` 호출 시 |
| **static 변수** | 클래스 | Method Area | 클래스 로딩 시 |
| 지역 변수 | 메서드 | Stack | 메서드 호출 시 |

### **6. GC(Garbage Collector): 동작 원리와 방식**

GC는 Heap에서 **더 이상 참조되지 않는 객체를 자동으로 제거**해 메모리를 회수하는 JVM의 자동 메모리 관리 시스템입니다.

**GC 대상 판별: 도달 가능성(Reachability)**

GC는 GC Root(Stack의 지역 변수, static 변수 등)에서 시작해 참조를 따라가며 도달할 수 있는 객체는 살리고, **도달할 수 없는 객체**를 수거합니다.

```java
Person p = new Person("형준"); // 참조 있음 → GC 대상 아님
p = null;                      // 참조 제거 → GC 대상이 됨
```

**Generational GC: 세대별 힙 구조**

JVM의 Heap은 객체의 생존 기간에 따라 세대(Generation)로 나뉩니다.

```
Heap
┌──────────────────────────────────────────────────┐
│   Young Generation              │  Old Generation│
│  ┌──────────┬────────┬────────┐ │                │
│  │   Eden   │  S0    │  S1    │ │   Tenured      │
│  │ (새 객체)│(생존자)│(생존자)│ │  (오래된 객체) │
│  └──────────┴────────┴────────┘ │                │
└──────────────────────────────────────────────────┘
```

- **Eden**: 새로 생성된 객체가 위치
- **Survivor 0 / 1**: Minor GC에서 살아남은 객체들이 이동
- **Old(Tenured)**: 여러 번의 GC에서 살아남아 오래된 객체

**GC 동작 방식**

| 종류 | 대상 | 빈도 | 속도 |
| --- | --- | --- | --- |
| **Minor GC** | Young Generation | 자주 | 빠름 |
| **Major GC** | Old Generation | 가끔 | 느림 |
| **Full GC** | 전체 Heap | 드물게 | 매우 느림 |

1. 새 객체가 **Eden**에 생성됩니다.
2. Eden이 가득 차면 **Minor GC** 실행 → 살아남은 객체는 Survivor로 이동, age 증가
3. age가 임계값(기본 15)을 넘으면 **Old 영역으로 승격(Promotion)**
4. Old 영역이 가득 차면 **Major GC(Full GC)** 실행

**Stop-the-World**

GC가 실행되는 동안 JVM은 **모든 애플리케이션 스레드를 일시 정지**합니다. 이를 **Stop-the-World** 현상이라 합니다. Full GC는 시간이 오래 걸리기 때문에, 실시간성이 중요한 서버에서는 GC 튜닝이 필수입니다.

**GC 발생 시점**

- Heap 메모리가 부족할 때 (주로 Eden, Old 영역이 꽉 찼을 때)
- `System.gc()` 호출 시 (강제 요청, 실제 실행 보장은 없음)
- JVM이 적절하다고 판단할 때

### **7. GC 증명 코드**

직접 코드로 GC 동작을 확인해 봅시다.

**`System.gc()`와 `finalize()`로 GC 확인**

```java
public class GcDemo {

    String name;

    public GcDemo(String name) {
        this.name = name;
    }

    // GC가 이 객체를 수거하기 직전에 호출 (Java 9+ deprecated, 개념 이해용)
    @Override
    protected void finalize() throws Throwable {
        System.out.println(name + " 객체가 GC에 의해 수거됩니다.");
    }

    public static void main(String[] args) throws InterruptedException {
        GcDemo obj1 = new GcDemo("객체1");
        GcDemo obj2 = new GcDemo("객체2");

        obj1 = null; // 참조 제거 → GC 대상
        obj2 = null; // 참조 제거 → GC 대상

        System.gc(); // GC 실행 요청 (즉시 실행 보장 없음)
        Thread.sleep(1000); // GC가 실행될 시간을 줌

        System.out.println("메인 종료");
    }
}
```

```
// 실행 결과 (순서는 다를 수 있음)
객체2 객체가 GC에 의해 수거됩니다.
객체1 객체가 GC에 의해 수거됩니다.
메인 종료
```

**WeakReference로 GC 민감도 확인**

`WeakReference`로 감싼 객체는 **강한 참조(Strong Reference)가 없으면 GC 대상**이 됩니다.

```java
import java.lang.ref.WeakReference;

public class WeakRefDemo {
    public static void main(String[] args) {
        String strong = new String("강한 참조");
        WeakReference<String> weak = new WeakReference<>(new String("약한 참조"));

        System.out.println("GC 전: " + weak.get()); // 약한 참조

        System.gc();
        try { Thread.sleep(100); } catch (InterruptedException e) {}

        System.out.println("GC 후: " + weak.get()); // null (수거됨)
        System.out.println("강한 참조: " + strong);   // 강한 참조 (유지됨)
    }
}
```

```
GC 전: 약한 참조
GC 후: null       ← WeakReference 객체는 GC가 수거
강한 참조: 강한 참조 ← strong이 참조하는 동안 수거되지 않음
```

**JVM GC 로그 확인**

실행 시 아래 옵션을 추가하면 GC 발생 시점과 시간을 콘솔에서 직접 확인할 수 있습니다.

```bash
java -verbose:gc -Xmx64m MyApp
```

```
[GC (Allocation Failure)  16384K->2048K(62976K), 0.0023 secs]
[Full GC (System.gc())  2048K->1024K(62976K), 0.0120 secs]
```

### **8. 최종 정리: 핵심 요약**

오늘 다룬 내용을 한 줄씩 기억에 새겨두세요.

- **Array는 참조 타입**: 변수에는 주소가 담기며, 대입 시 주소를 공유합니다. 독립 복사는 `clone()` 또는 `Arrays.copyOf()`를 사용하세요.
- **Call by Value**: Java는 항상 값을 복사해 전달합니다. 참조 타입은 주소값이 복사되어 내부 수정이 원본에 영향을 줍니다.
- **JVM 메모리**:
  - `Method Area` — 클래스 정보, static 변수 (클래스 로딩 시 생성, JVM 종료 시 제거)
  - `Stack` — 지역 변수, 메서드 호출 프레임 (메서드 종료 시 자동 제거)
  - `Heap` — 객체, 배열 (GC가 관리)
- **static**: 인스턴스 없이 클래스 레벨에서 공유되는 자원. Method Area에 저장됩니다.
- **GC**: 도달 불가능한 객체를 세대별 전략(Minor/Major/Full GC)으로 자동 수거합니다. Full GC는 Stop-the-World를 유발하므로 주의가 필요합니다.
