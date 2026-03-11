---
title: "Java Collection Framework (JCF)"
date: 2026-03-11
authors: HyungJun
tags: [Java, 기본기, JCF, DataStructure]
---
`Collection`,  `자료구조`, `List`, `Set`, `Map`

자바에서 데이터를 효율적으로 다루기 위해 설계된 **Collection Framework(JCF)** 는 단순한 자료구조의 모음을 넘어, 객체지향적 설계의 정수를 보여줍니다. 각 인터페이스의 역할과 구현체의 내부 동작 원리, 그리고 **실무에서는 어떤 시나리오에 활용되는지** 상세히 정리해 보겠습니다.

<!-- truncate -->

### **1. Java Collection Framework (JCF) 전체 계층도**

JCF는 크게 데이터를 단일로 저장하는 `Collection` 계열과 Key-Value 쌍으로 저장하는 `Map` 계열로 나뉩니다.

![JCF Hierarchy - Collection](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FbpLFzO%2FbtriFs0CkHA%2FAAAAAAAAAAAAAAAAAAAAAN3IYcZbZPfnWEP79Efi9DsXdOEtPTxO49nVWRKhe5Cm%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1774969199%26allow_ip%3D%26allow_referer%3D%26signature%3DC%252FOE9xE02z9BCdjTmjJxAexzMDc%253D)

---

### **2. Collection 인터페이스**

#### **① List: 순서가 있는 데이터 (인덱스 접근)**
- **ArrayList**: `조회 성능($O(1)$)` 이 압도적, `삽입 삭제` 시 데이터 이동이 필요함
	- 주로 DB에서 조회한 게시글 목록, 상품 리스트 등을 담아 화면에 뿌려줄 때 가장 기본으로 사용합니다.
- **LinkedList**: `삽입/삭제` 가 빈번한 작업에 유리
	- 현대 자바에서는 요소가 아주 많지 않다면 메모리 연속성이 좋은 `ArrayList`가 더 빠를 때가 많아 신중히 선택해야 합니다.

#### **② Set: 중복 없는 집합 (유일성 보장)**
- **HashSet**: `equals` , `hashCode` 를 사용하여 중복 방지
	- 특정 게시글에 '좋아요'를 누른 사용자 ID 목록을 관리할 때 유용합니다. 동일 사용자가 여러 번 눌러도 중복을 자동으로 막아주며, 존재 여부 확인($O(1)$)이 매우 빠릅니다.
- **TreeSet**: 점수별 랭킹 시스템처럼, 데이터가 들어올 때마다 실시간으로 `정렬`된 상태를 유지해야 할 때 사용합니다.

#### **③ Queue & Deque: 데이터 흐름 제어**
- **ArrayDeque**: `ArrayList`와 비슷한 특징들을 가지고 있음, null을 저장할 수 없으며 `비동기` 방식, `원형큐` 방식으로 구현되어 있다.
	- 최근 방문한 페이지 이력(뒤로가기/앞으로가기)이나, 알고리즘의 BFS 탐색 시 `Queue` 대용으로 사용합니다. `Stack` 클래스보다 성능이 훨씬 뛰어납니다.
- **PriorityQueue**: `FIFO`의 순서가 아니라 `우선순위`에 따라 요소가 먼저 나가는 방식
	- `우선순위`가 높은 작업(예: VIP 고객 상담 요청)을 먼저 처리해야 하는 작업 스케줄러를 구현할 때 핵심적으로 쓰입니다.

---

### **3. Map 인터페이스**

![JCF Hierarchy - Map](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FbpG8Ub%2FbtriTh3LzvZ%2FAAAAAAAAAAAAAAAAAAAAAOIcJm2qRiSZ4IiKLRmwmkQfxImnzhPfeelXDnIgPdfd%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1774969199%26allow_ip%3D%26allow_referer%3D%26signature%3DWVAIJ7%252Bg92TXgp8RUzob5t1URe0%253D)

#### **① HashMap**
-  가장 대중적인 Key-Value 저장소입니다. 설정값 저장, 캐싱 등 단일 스레드 환경에서 키를 통해 빠르게 값을 찾아야 할 때 사용합니다.

#### **② ConcurrentHashMap**
- **실시간 채팅 서버의 세션 관리**가 대표적인 사례입니다. 수천 명의 사용자가 동시에 접속(put)하거나 접속을 해제(remove)할 때, 일반 `HashMap`은 데이터가 깨질 수 있습니다. `ConcurrentHashMap`은 부분 락(Segment Lock)을 사용하여 멀티 스레드 환경에서도 안전하고 높은 성능을 보장합니다.

#### **③ TreeMap**
- 시간대별 로그 통계처럼 키값(예: 타임스탬프)에 따라 범위 검색이 필요하거나 자동 정렬이 필요한 리포트 생성 시 유리합니다.

---

### **4. 핵심 구현체 상세 비교 (Cheat Sheet)**

| 구분 | 구현체 | 특징 | 실무 핵심 포인트 |
| :--- | :--- | :--- | :--- |
| **List** | ArrayList | 빠른 조회 ($O(1)$) | **가장 대중적인 List 구현체** |
| **Set** | HashSet | 중복 불가 ($O(1)$) | **유일성 검사, 권한 체크** |
| **Map** | HashMap | 빠른 검색 ($O(1)$) | **단일 스레드 캐싱, 데이터 매핑** |
| | ConcurrentHashMap | **Thread-Safe** | **채팅 세션, 동시성 제어** |
| **Queue** | ArrayDeque | 양방향 처리 | **Stack/Queue의 현대적 대체제** |

---

### **5. 최종 정리: 핵심요약**

1. **"일단 담자"** 싶으면? → **`ArrayList`**
2. **"중복은 싫어"** 싶으면? → **`HashSet`**
3. **"멀티 스레드에서 공유해"** 싶으면? → **`ConcurrentHashMap`**
4. **"알고리즘(BFS/Stack) 풀 거야"** 싶으면? → **`ArrayDeque`**
5. **"정렬이 계속 필요해"** 싶으면? → **`Tree` 시리즈**

어떤 자료구조를 선택하느냐는 코드의 `가독성`뿐만 아니라 시스템의 `안정성`과 `성능`을 결정짓는 중요한 설계 포인트다. 특히 멀티 스레드 환경에서는 `ConcurrentHashMap`과 같은 `Thread-safe`한 컬렉션 선택이 필수인 것 같다.
