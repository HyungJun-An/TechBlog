---
title: "SQL 핵심 심화"
date: 2026-03-16
authors: HyungJun
tags: [Java, 데이터베이스, JDBC, DB]
---

`Oracle`, `SubQuery`, `JOIN`, `VIEW`, `INDEX`, `Window Function`, `TCL`

단순 `SELECT`를 넘어 Oracle SQL을 제대로 다루려면 **옵티마이저가 어떻게 쿼리를 해석하는지**, 그리고 **내가 작성한 쿼리가 어떤 실행 경로를 타는지** 이해해야 합니다. 이 글은 SubQuery부터 TCL까지, 각 개념의 내부 동작 원리와 실무 선택 기준을 정리합니다.

<!-- truncate -->

---

### **1. SubQuery — 쿼리 안의 쿼리, 실행 위치가 전부다**

서브쿼리는 **위치**에 따라 옵티마이저의 처리 방식이 완전히 달라집니다.

#### **① 스칼라 서브쿼리 (SELECT 절)**
- **정의:** `SELECT` 절에 위치하며 **행마다 한 번** 실행되어 단일 값을 반환
- 내부적으로 **캐싱(Query Result Cache)** 을 활용 — 같은 입력값이면 재실행 없이 캐시 히트
- 남용하면 `HASH JOIN`보다 느릴 수 있어, 대용량 테이블에는 주의 필요

```sql
-- 각 직원의 부서명을 스칼라 서브쿼리로 조회
SELECT emp_id,
       emp_name,
       (SELECT dept_name FROM dept d WHERE d.dept_id = e.dept_id) AS 부서명
FROM emp e;
```

#### **② 인라인 뷰 (FROM 절)**
- **정의:** `FROM` 절에 위치하는 임시 파생 테이블, 실제 테이블처럼 Alias 부여 가능
- 옵티마이저가 **머지(Merge)** 하거나 **독립 실행** 후 결과를 활용 — `NO_MERGE` 힌트로 강제 분리 가능
- 페이징 쿼리의 핵심 패턴

```sql
-- 급여 상위 10명 추출 (Oracle 페이징 패턴)
SELECT *
FROM (
    SELECT emp_name, salary, ROWNUM AS rn
    FROM (SELECT emp_name, salary FROM emp ORDER BY salary DESC)
    WHERE ROWNUM <= 10
)
WHERE rn >= 1;
```

#### **③ 중첩 서브쿼리 (WHERE 절) — EXISTS vs IN**
- **`IN`**: 서브쿼리 결과를 **리스트화** 후 비교 → 결과 집합이 작을 때 유리
- **`EXISTS`**: 서브쿼리에서 **첫 번째 매칭 발견 즉시 중단(Short-Circuit)** → 대용량 외부 테이블에 유리
- `NULL` 포함 컬럼에 `NOT IN` 사용 시 **결과 전체가 공집합** — `NOT EXISTS`로 대체 필수

```sql
-- 주문이 1건 이상 있는 고객 조회 (EXISTS가 일반적으로 더 빠름)
SELECT cust_name
FROM customer c
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.cust_id = c.cust_id
);
```

---

### **2. JOIN — 데이터 결합의 물리적 메커니즘**

Oracle 옵티마이저는 `NESTED LOOP`, `HASH JOIN`, `SORT MERGE JOIN` 세 가지 물리적 조인 방식 중 비용이 가장 낮은 것을 선택합니다.

#### **① INNER JOIN**
- 양쪽 테이블에 **매칭되는 행만** 반환
- `ON` 절 조건이 인덱스를 타는지가 성능의 핵심

```sql
SELECT e.emp_name, d.dept_name
FROM emp e
INNER JOIN dept d ON e.dept_id = d.dept_id;
```

#### **② OUTER JOIN**
- **LEFT OUTER JOIN**: 왼쪽 기준, 오른쪽 매칭 없으면 `NULL` 채움
- **FULL OUTER JOIN**: 양쪽 모두 포함 — 데이터 정합성 검증 시 활용

```sql
-- 부서 배정 없는 직원도 포함
SELECT e.emp_name, d.dept_name
FROM emp e
LEFT OUTER JOIN dept d ON e.dept_id = d.dept_id;
```

> Oracle 전통 문법 `(+)` 은 `LEFT/RIGHT OUTER JOIN`만 표현 가능 — `FULL OUTER JOIN`은 표준 ANSI 문법 필수

#### **③ SELF JOIN**
- 동일 테이블을 두 번 참조 — 계층 구조(상하 관계) 표현에 사용

```sql
-- 직원과 해당 직원의 관리자를 함께 조회
SELECT e.emp_name AS 직원, m.emp_name AS 관리자
FROM emp e
LEFT JOIN emp m ON e.mgr_id = m.emp_id;
```

#### **④ 물리적 조인 방식 비교**

| 방식 | 동작 원리 | 적합한 상황 |
| :--- | :--- | :--- |
| **Nested Loop** | 외부 테이블 행마다 내부 테이블을 반복 탐색 | **인덱스 있는 소량 데이터** |
| **Hash Join** | 작은 테이블을 해시 테이블로 빌드 후 탐색 | **대용량, 인덱스 없는 동등 조인** |
| **Sort Merge Join** | 양쪽을 정렬 후 병합 | **이미 정렬된 데이터, 범위 조인** |

---

### **3. VIEW — 논리적 테이블, 보안과 재사용의 핵심**

#### **개념 및 내부 동작**
- **VIEW는 저장된 SELECT문**이다 — 데이터를 물리적으로 저장하지 않음
- 쿼리 시 옵티마이저가 VIEW 정의를 **인라인 뷰처럼 전개(View Merging)** 하여 최적화
- `FORCE` 옵션으로 기반 테이블 없이도 VIEW 생성 가능 (나중에 테이블 생성 대비)

```sql
-- 고연봉 직원 뷰 생성
CREATE OR REPLACE VIEW vw_high_salary AS
SELECT emp_id, emp_name, dept_id, salary
FROM emp
WHERE salary >= 5000;

-- 사용 (일반 테이블처럼 조회)
SELECT * FROM vw_high_salary WHERE dept_id = 10;
```

#### **DML 제약과 INSTEAD OF TRIGGER**
- 단일 테이블 기반 VIEW는 `INSERT/UPDATE/DELETE` 가능
- `JOIN`, `GROUP BY`, `DISTINCT` 포함 VIEW는 DML 불가 → `INSTEAD OF TRIGGER`로 우회

```sql
-- 읽기 전용 보장
CREATE VIEW vw_emp_readonly AS
SELECT emp_id, emp_name FROM emp
WITH READ ONLY;
```

#### **Materialized View (구체화 뷰)**
- 일반 VIEW와 달리 **결과를 물리적으로 저장** — 대용량 집계 쿼리 성능 획기적 개선
- `REFRESH COMPLETE / FAST / ON COMMIT / ON DEMAND` 옵션으로 갱신 전략 설정

---

### **4. INDEX — 탐색 비용을 결정하는 물리 구조**

#### **① B-Tree 인덱스 (기본값)**
- Oracle 인덱스의 기본 타입, **균형 트리(Balanced Tree)** 구조로 $O(\log n)$ 탐색
- `WHERE`, `ORDER BY`, `JOIN` 조건의 컬럼에 적용
- **Null 값은 인덱스에 저장되지 않음** → `IS NULL` 조건은 인덱스 미사용

```sql
CREATE INDEX idx_emp_salary ON emp(salary);

-- 인덱스 활용 확인 (실행 계획)
EXPLAIN PLAN FOR
SELECT * FROM emp WHERE salary > 4000;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
```

#### **② Bitmap 인덱스**
- **카디널리티(Cardinality)가 낮은 컬럼** 전용 (성별, 상태값 등)
- 값별로 비트맵을 저장 → 복수 조건 `AND/OR` 연산을 **비트 연산**으로 처리해 DW 환경에서 강력
- OLTP 환경에서는 DML 시 **비트맵 잠금(Lock)** 이 발생하여 동시성 저하 → 사용 금지

```sql
CREATE BITMAP INDEX idx_emp_gender ON emp(gender);
```

#### **③ Function-Based 인덱스**
- 컬럼에 함수를 적용한 결과를 인덱싱 → `WHERE UPPER(name) = 'HONG'` 같은 쿼리에 활용

```sql
CREATE INDEX idx_emp_name_upper ON emp(UPPER(emp_name));
```

#### **④ 인덱스 무효화 패턴 (Index Suppression)**
- `WHERE salary * 12 > 60000` → 컬럼 가공 시 인덱스 무효화, `WHERE salary > 5000`으로 재작성
- `WHERE TO_CHAR(hire_date, 'YYYY') = '2024'` → `WHERE hire_date >= DATE '2024-01-01'`으로 변경
- `%keyword` 앞에 `%` 붙은 LIKE → **Full Table Scan** 불가피

---

### **5. Window Function — 집계하되 행을 유지하는 분석 함수**

#### **개념**
`GROUP BY`는 행을 **합쳐버리지만**, Window Function은 집계하면서도 **원본 행을 그대로 유지**합니다.
`OVER()` 절 안에서 `PARTITION BY`(그룹 기준)와 `ORDER BY`(정렬 기준)로 윈도우를 정의합니다.

#### **① 순위 함수**

```sql
SELECT emp_name, dept_id, salary,
       RANK()       OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rank,
       DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dense_rank,
       ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS row_num
FROM emp;
```

| 함수 | 동점 처리 | 다음 순위 |
| :--- | :--- | :--- |
| `RANK()` | 동점 허용 | 건너뜀 (1, 1, 3) |
| `DENSE_RANK()` | 동점 허용 | 연속 (1, 1, 2) |
| `ROW_NUMBER()` | 고유 번호 | 연속 (1, 2, 3) |

#### **② 집계 Window Function**

```sql
-- 부서별 누적 급여 합계 & 이동 평균
SELECT emp_name, dept_id, salary,
       SUM(salary) OVER (PARTITION BY dept_id ORDER BY hire_date
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS 누적급여,
       AVG(salary) OVER (PARTITION BY dept_id
                         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS 이동평균
FROM emp;
```

#### **③ LEAD / LAG — 이전·다음 행 참조**
- `LAG`: 이전 행 값 참조 → 전월 대비 증감 분석
- `LEAD`: 다음 행 값 참조 → 다음 이벤트 예측

```sql
-- 직원별 급여 인상 이력 분석
SELECT emp_name,
       salary,
       LAG(salary, 1, 0)  OVER (PARTITION BY emp_id ORDER BY change_date) AS 이전급여,
       salary - LAG(salary, 1, 0) OVER (PARTITION BY emp_id ORDER BY change_date) AS 인상액
FROM salary_history;
```

#### **④ FIRST_VALUE / LAST_VALUE**

```sql
-- 부서 내 최고 급여자 이름을 각 행에 표시
SELECT emp_name, dept_id, salary,
       FIRST_VALUE(emp_name) OVER (PARTITION BY dept_id ORDER BY salary DESC
                                   ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS 최고급여자
FROM emp;
```

---

### **6. TCL — 트랜잭션의 경계를 지배하라**

TCL(Transaction Control Language)은 `COMMIT`, `ROLLBACK`, `SAVEPOINT`로 구성되며, Oracle의 **MVCC(Multi-Version Concurrency Control)** 와 밀접하게 연동됩니다.

#### **① COMMIT**
- **변경 내용을 영구 반영** — Redo Log에 기록 후 데이터파일에 실제 반영
- Oracle은 **Auto Commit이 기본값이 아님** — 명시적 `COMMIT` 필수 (MySQL의 기본 동작과 다름)
- DDL(`CREATE`, `ALTER`, `DROP`) 실행 시 **암묵적 COMMIT** 발생에 주의

```sql
UPDATE emp SET salary = salary * 1.1 WHERE dept_id = 20;
COMMIT; -- 이 시점에 타 세션에서 변경 내용 확인 가능
```

#### **② ROLLBACK**
- **마지막 COMMIT 이후** 또는 **특정 SAVEPOINT** 이후의 모든 변경을 취소
- Undo Segment에 저장된 이전 이미지(Before Image)를 사용하여 복원

```sql
UPDATE emp SET salary = 0; -- 실수!
ROLLBACK;                   -- 마지막 COMMIT 시점으로 복원
```

#### **③ SAVEPOINT — 부분 롤백의 기준점**
- 트랜잭션 내에 **체크포인트**를 설정하여 전체가 아닌 **특정 시점까지만 롤백** 가능
- 복잡한 배치 처리나 단계별 검증 로직에서 특히 유용

```sql
INSERT INTO orders VALUES (1001, 'A');
SAVEPOINT sp1;

INSERT INTO orders VALUES (1002, 'B');
SAVEPOINT sp2;

INSERT INTO orders VALUES (1003, 'C'); -- 오류 발생 가능 지점

ROLLBACK TO SAVEPOINT sp2; -- 1003번 INSERT만 취소, 1001·1002는 유지
COMMIT;
```

#### **④ MVCC와 트랜잭션 격리**
- Oracle의 기본 격리 수준은 `READ COMMITTED` — `COMMIT`된 데이터만 읽음
- 장시간 `COMMIT` 없이 DML 수행 시 **Undo Segment 고갈** 위험 (`ORA-01555: snapshot too old`)
- 배치 처리는 일정 단위로 중간 `COMMIT`을 분할하여 Undo 압박을 분산

---

### **7. 실무 성능 개선 사례**

실제로 겪었던 쿼리 성능 이슈와 해결 과정입니다. 상황은 다르지만 원인은 대부분 비슷합니다.

#### **Case 1. 주문 조회 쿼리 30초 → 0.3초 (Full Scan → Index)**

주문 목록 페이지가 데이터가 쌓일수록 느려지는 문제였습니다. 실행 계획을 떼보니 `status` 컬럼으로 필터링하는데 인덱스가 없어 매번 **Full Table Scan**이 발생하고 있었습니다.

```sql
-- 문제 쿼리: orders 테이블 200만 건, status 조건인데 인덱스 없음
SELECT * FROM orders WHERE status = 'PENDING' ORDER BY created_at DESC;

-- 조치: 복합 인덱스 생성 (status 선두, created_at 후미)
CREATE INDEX idx_orders_status_date ON orders(status, created_at DESC);
```

- `status` 단독 인덱스보다 `(status, created_at)` 복합 인덱스가 `ORDER BY`까지 커버
- 인덱스 컬럼 순서는 **선택도(Selectivity) 높은 컬럼을 앞으로** 배치하는 것이 원칙

---

#### **Case 2. 월별 매출 집계 배치 45분 → 3분 (Materialized View 적용)**

매월 말 정산 배치가 45분 이상 걸려 타임아웃이 발생하던 케이스입니다. 핵심 원인은 매번 1억 건 이상의 거래 데이터를 `GROUP BY`로 집계하는 쿼리였습니다.

```sql
-- 기존: 실시간 집계 (매번 전체 스캔)
SELECT dept_id, TO_CHAR(sale_date, 'YYYY-MM') AS month, SUM(amount)
FROM sales
GROUP BY dept_id, TO_CHAR(sale_date, 'YYYY-MM');

-- 조치: Materialized View로 집계 결과 물리 저장
CREATE MATERIALIZED VIEW mv_monthly_sales
REFRESH COMPLETE ON DEMAND
AS
SELECT dept_id, TO_CHAR(sale_date, 'YYYY-MM') AS month, SUM(amount) AS total
FROM sales
GROUP BY dept_id, TO_CHAR(sale_date, 'YYYY-MM');

-- 배치 시작 전 수동 갱신
EXEC DBMS_MVIEW.REFRESH('mv_monthly_sales', 'C');
```

- 집계 쿼리 자체를 없애고 **미리 계산된 결과**를 읽는 방식으로 전환
- `ON DEMAND` + 배치 초입에 수동 `REFRESH`하여 최신성 보장

---

#### **Case 3. N+1 문제 → JOIN으로 해결**

JDBC로 직원 목록을 조회한 뒤, 루프 안에서 부서명을 다시 조회하는 전형적인 N+1 패턴이었습니다. 직원 100명이면 DB 쿼리가 101번 발생합니다.

```sql
-- 문제: 애플리케이션에서 루프마다 쿼리 발생
-- for each emp → SELECT dept_name FROM dept WHERE dept_id = ?

-- 해결: 한 번의 JOIN으로 해결
SELECT e.emp_id, e.emp_name, d.dept_name
FROM emp e
INNER JOIN dept d ON e.dept_id = d.dept_id
WHERE e.status = 'ACTIVE';
```

- ORM 사용 시 **Fetch Join** 또는 **Batch Size** 설정으로 동일 효과
- 네트워크 왕복(Round Trip) 횟수 자체를 줄이는 것이 가장 확실한 개선

---

#### **Case 4. 인덱스 있는데 느린 쿼리 → Index Suppression 제거**

인덱스를 만들었는데도 느리다는 제보를 받고 확인해보니, `WHERE` 절에서 컬럼을 가공하고 있었습니다.

```sql
-- 문제: 컬럼을 함수로 감싸면 인덱스 무효화
SELECT * FROM orders WHERE TO_CHAR(created_at, 'YYYY') = '2024';

-- 해결: 범위 조건으로 재작성
SELECT * FROM orders
WHERE created_at >= DATE '2024-01-01'
  AND created_at <  DATE '2025-01-01';
```

- `EXPLAIN PLAN` 확인 시 기존은 `TABLE ACCESS FULL`, 수정 후 `INDEX RANGE SCAN`으로 변경
- 날짜 컬럼 가공은 가장 자주 발생하는 실수 유형

---

### **8. 최종 정리: 상황별 선택 기준**

| 상황 | 권장 접근법 |
| :--- | :--- |
| 행마다 단일 값 조회 | 스칼라 서브쿼리 (캐시 활용) |
| 대용량 필터링 | `EXISTS` > `IN` |
| 중간 결과 재사용 | 인라인 뷰 또는 `WITH`(CTE) |
| 보안 레이어 필요 | VIEW + `WITH READ ONLY` |
| 반복 집계 성능 | Materialized View |
| OLTP 인덱스 | B-Tree (카디널리티 높은 컬럼) |
| DW/통계 인덱스 | Bitmap (카디널리티 낮은 컬럼) |
| 순위·누적 집계 | Window Function (`OVER` 절) |
| 이전/다음 행 비교 | `LAG` / `LEAD` |
| 부분 취소 필요 배치 | `SAVEPOINT` + 분할 `COMMIT` |

쿼리를 작성할 때 **"옵티마이저가 이 쿼리를 어떻게 실행할까?"** 를 먼저 떠올리는 습관이 중요합니다. `EXPLAIN PLAN`이나 `AUTOTRACE`를 통해 실행 계획을 주기적으로 확인하고, 인덱스 스캔인지 Full Table Scan인지를 의식적으로 검증하는 것이 Oracle SQL 실력의 핵심입니다.
