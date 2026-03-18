---
title: "SQL 통계·계층·윈도우 함수"
date: 2026-03-18
authors: HyungJun
tags: [데이터베이스, DB, 기초이론]
---

`ROLLUP` `CUBE` `GROUPING SETS` `START WITH` `CONNECT BY` `PRIOR` `LEVEL` `RANK` `LAG/LEAD` `RANGE vs ROWS`

GROUP BY를 쓸 줄 안다고 해서 SQL 통계를 다 안다고 말하기 어렵습니다. "ROLLUP이랑 GROUP BY가 뭐가 달라?", "LAST_VALUE를 썼는데 왜 자기 자신이 나오지?", "PRIOR를 어디에 써야 하지?" 이 질문들은 모두 하나의 원칙에서 답이 나옵니다 — **집계의 범위와 방향**. 이 글은 통계함수, 계층형 쿼리, 윈도우 함수 세 축을 중심으로, 각 문법이 왜 그렇게 동작하는지를 정리합니다.

<!-- truncate -->

---

### **1. GROUP BY vs ROLLUP — "순서"가 결과를 바꾸는 시점**

`GROUP BY dname, job`과 `GROUP BY job, dname`은 ORDER BY를 동일하게 맞추면 결과가 사실상 같습니다. GROUP BY 자체는 묶음 기준 컬럼의 순서가 결과의 의미를 바꾸지 않습니다.

반면 **ROLLUP은 순서가 소계 구조를 결정**합니다.

| 구문 | 생성되는 소계 |
| :--- | :--- |
| `GROUP BY ROLLUP(dname, job)` | 부서(dname) 소계 + 전체 총계 |
| `GROUP BY ROLLUP(job, dname)` | 업무(job) 소계 + 전체 총계 |

```sql
-- 부서-업무 집계 + 부서 소계 + 전체 총계
SELECT dname, job, SUM(sal)
FROM emp JOIN dept USING (deptno)
GROUP BY ROLLUP(dname, job)
ORDER BY dname, job;
```

ROLLUP 괄호 안의 컬럼만 소계 대상이라는 점이 핵심입니다. `GROUP BY job, ROLLUP(dname)`처럼 섞인 형태라면 job은 단순 그룹 기준이고, dname만 소계로 생성됩니다.

> **시험 포인트:** ROLLUP 순서 변경 문제가 자주 나옵니다. "앞에 둔 컬럼이 상위 차원, 그 기준으로 소계가 생긴다"는 규칙을 기억하세요.

---

### **2. UNION ALL로 소계·총계 만들기 — 통계함수 없이**

ROLLUP 이전에 소계를 만들던 방식은 `UNION ALL`로 SELECT를 여러 번 쌓는 것입니다. 컬럼 개수와 타입을 맞추고, 소계 행은 NULL로 자리를 채웁니다.

```sql
-- ① 부서+업무 상세
SELECT dname, job, SUM(sal) FROM emp JOIN dept USING(deptno) GROUP BY dname, job
UNION ALL
-- ② 부서 소계 (job 자리를 NULL로)
SELECT dname, NULL, SUM(sal) FROM emp JOIN dept USING(deptno) GROUP BY dname
UNION ALL
-- ③ 전체 총계 (두 자리 모두 NULL)
SELECT NULL, NULL, SUM(sal) FROM emp JOIN dept USING(deptno);
```

이 구조를 이해하면 "ROLLUP/CUBE 결과를 UNION으로 재현하라"는 역방향 문제도 풀 수 있습니다.

---

### **3. CUBE — 가능한 모든 차원의 소계**

ROLLUP이 "상위→하위" 방향으로만 소계를 만든다면, **CUBE는 지정된 컬럼 조합의 모든 소계**를 생성합니다.

| 집계 조합 | 의미 |
| :--- | :--- |
| `(dname, job)` | 부서+업무 상세 |
| `(dname)` | 부서 소계 |
| `(job)` | 업무 소계 ← ROLLUP에는 없는 행 |
| `()` | 전체 총계 |

```sql
SELECT dname, job, SUM(sal)
FROM emp JOIN dept USING (deptno)
GROUP BY CUBE(dname, job);
```

ROLLUP 결과보다 행이 늘어나는 이유는 job 차원의 소계가 추가되기 때문입니다. "왜 행이 늘었는가"를 설명할 수 있어야 CUBE 문제를 안정적으로 풀 수 있습니다.

---

### **4. GROUPING과 GROUPING SETS**

#### **GROUPING() — 소계로 생성된 NULL인지 구분**

ROLLUP/CUBE 결과에 NULL이 생기면 "원래 데이터의 NULL"인지 "소계로 생성된 NULL"인지 구분이 필요합니다.

- `GROUPING(column) = 1` → 집계(소계/총계)로 생성된 값
- `GROUPING(column) = 0` → 원본 그룹의 실제 값

```sql
SELECT
  CASE WHEN GROUPING(dname) = 1 THEN '모든 부서' ELSE dname END AS 부서,
  CASE WHEN GROUPING(job)   = 1 THEN '모든 업무' ELSE job   END AS 업무,
  SUM(sal)
FROM emp JOIN dept USING (deptno)
GROUP BY ROLLUP(dname, job);
```

#### **GROUPING SETS — 원하는 소계만 선택**

CUBE/ROLLUP은 원치 않는 소계까지 나올 수 있습니다. 필요한 집계만 골라서 출력하려면 `GROUPING SETS`를 사용합니다.

```sql
-- job 집계와 dname 집계만 (부서+업무 상세, 전체 총계는 제외)
SELECT dname, job, SUM(sal)
FROM emp JOIN dept USING (deptno)
GROUP BY GROUPING SETS((dname), (job));
```

---

### **5. 계층형 쿼리(START WITH / CONNECT BY)**

#### **개념: 자기참조 테이블을 트리로 조회**

EMP 테이블의 `MGR` 컬럼은 다른 행의 `EMPNO`를 참조합니다. 이 자기참조 구조를 반복 셀프조인 대신 계층형 쿼리로 펼칠 수 있습니다.

| 키워드 | 역할 |
| :--- | :--- |
| `START WITH` | 시작 노드 조건 지정 |
| `CONNECT BY` | 부모-자식 연결 규칙 정의 |
| `PRIOR` | 부모/자식 방향 결정 |
| `LEVEL` | 계층 깊이 (최상위 = 1) |

#### **순차 전개(Top-down) — 루트에서 아래로**

```sql
SELECT LEVEL, LPAD(' ', (LEVEL-1)*2) || ename AS 조직도, empno, mgr
FROM emp
START WITH mgr IS NULL          -- 최상위(사장)부터
CONNECT BY PRIOR empno = mgr;  -- 부모의 empno = 자식의 mgr
```

`PRIOR`가 `empno` 앞에 붙으면 "부모의 empno로 자식의 mgr을 찾아 내려간다"는 뜻입니다.

#### **역차 전개(Bottom-up) — 특정 노드에서 위로**

```sql
-- 7900 사원의 상위 관리자 체인
SELECT LEVEL, ename, empno, mgr
FROM emp
START WITH empno = 7900
CONNECT BY PRIOR mgr = empno;  -- PRIOR 방향 반전
```

`PRIOR`를 `mgr` 앞으로 옮기면 방향이 역전되어 아래에서 위로 올라갑니다.

#### **LEVEL 활용과 주의점**

`CONNECT_BY_ISLEAF`는 자식이 없는 리프 노드를 1로, 자식이 있으면 0으로 표시합니다. CONNECT BY는 `DUAL + LEVEL`과 조합해 연속 행 생성에도 활용됩니다.

```sql
-- 1~10 연속 숫자 생성
SELECT LEVEL AS num FROM DUAL CONNECT BY LEVEL <= 10;
```

> **시험 포인트:** `WHERE` 절은 `FROM` 뒤에 위치해야 하며, `CONNECT BY` 절 뒤에 `WHERE`를 두면 안 됩니다.

---

### **6. 윈도우 함수 기본 구조 — OVER**

윈도우 함수는 GROUP BY처럼 행을 합치지 않고, **원본 행을 유지하면서** 파티션·정렬·프레임 기준으로 계산 결과를 각 행에 붙입니다.

```sql
함수명(...) OVER (
  PARTITION BY 컬럼   -- 그룹 경계 (없으면 전체를 하나의 파티션으로)
  ORDER BY 컬럼        -- 파티션 내 정렬
  ROWS/RANGE BETWEEN ... AND ...  -- 집계 범위(프레임)
)
```

| 요소 | 역할 |
| :--- | :--- |
| `PARTITION BY` | GROUP BY처럼 묶음 분리 |
| `ORDER BY` | 파티션 내 정렬 기준 |
| 윈도우잉(프레임) | 현재 행 기준 집계 범위 |

프레임 절은 ORDER BY가 있을 때 의미가 생기며, **생략 시 디폴트 프레임은 `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`** 입니다. 이 디폴트가 LAST_VALUE 함정의 원인입니다.

---

### **7. 순위 함수 — RANK / DENSE_RANK / ROW_NUMBER**

동점이 있는 데이터에서 세 함수의 차이가 명확하게 드러납니다.

| 급여 | RANK | DENSE_RANK | ROW_NUMBER |
| :--- | :---: | :---: | :---: |
| 5000 | 1 | 1 | 1 |
| 3000 | 2 | 2 | 2 |
| 3000 | 2 | 2 | 3 |
| 2975 | 4 | 3 | 4 |

- `RANK()` — 동점에 같은 순위, 다음 순위는 동점 개수만큼 건너뜀
- `DENSE_RANK()` — 동점에 같은 순위, 다음 순위는 연속
- `ROW_NUMBER()` — 동점 무관, 정렬 순서대로 1부터 일련번호

```sql
SELECT ename, sal,
  RANK()        OVER (ORDER BY sal DESC) AS rank,
  DENSE_RANK()  OVER (ORDER BY sal DESC) AS dense_rank,
  ROW_NUMBER()  OVER (ORDER BY sal DESC) AS row_num
FROM emp;
```

---

### **8. 비율 함수 — RATIO_TO_REPORT / PERCENT_RANK / CUME_DIST**

#### **RATIO_TO_REPORT — 전체 합 대비 비율**

```sql
SELECT ename, sal,
  TRUNC(RATIO_TO_REPORT(sal) OVER () * 100, 1) AS 비율PCT
FROM emp
WHERE deptno = 20;
```

동일 급여가 있으면 같은 비율이 반복 출력됩니다. 이는 정상 동작입니다.

#### **PERCENT_RANK — 상대 위치(0~1)**

처음 값을 0, 마지막 값을 1로 두고 상대 위치를 나타냅니다. 데이터가 N개면 간격은 대략 `1/(N-1)`입니다. 동점이면 같은 percent_rank가 나옵니다.

#### **CUME_DIST — 누적 분포 비율**

`PERCENT_RANK`가 "자신보다 작은 값의 비율"이라면, `CUME_DIST`는 "자신보다 작거나 같은 값의 비율"입니다.

| 구분 | 분모 기준 | 동점 처리 |
| :--- | :--- | :--- |
| `PERCENT_RANK` | N-1 | 동일 percent_rank 공유 |
| `CUME_DIST` | N | 동점끼리 같은 값 → 다음 값 점프 |

---

### **9. 위치 함수와 프레임 함정 — FIRST_VALUE / LAST_VALUE**

`FIRST_VALUE`는 파티션 정렬 기준의 첫 행 값을 가져옵니다.

**`LAST_VALUE`는 디폴트 프레임 때문에 "자기 자신"이 나오는 함정**이 있습니다.

디폴트 프레임은 `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, 즉 "처음부터 현재 행까지"입니다. 현재 행이 해당 범위의 마지막이므로 자기 자신 값이 반환됩니다.

**올바른 사용법 — 프레임을 명시해야 합니다.**

```sql
-- ❌ 자기 자신이 나오는 함정
SELECT ename, sal,
  LAST_VALUE(ename) OVER (PARTITION BY deptno ORDER BY sal DESC) AS 최저급여자
FROM emp;

-- ✅ 프레임을 파티션 끝까지 확장
SELECT ename, sal,
  LAST_VALUE(ename) OVER (
    PARTITION BY deptno
    ORDER BY sal DESC
    ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
  ) AS 최저급여자
FROM emp;
```

> **시험 포인트:** LAST_VALUE + UNBOUNDED FOLLOWING 조합은 매우 자주 출제됩니다.

---

### **10. LAG / LEAD — 이전·이후 행 값 조회**

행과 행을 비교해야 할 때 셀프조인 없이 간결하게 해결합니다.

```sql
-- 문법: LAG/LEAD(컬럼, 오프셋, 기본값)
SELECT ename, sal,
  LAG(sal, 1, 0)  OVER (ORDER BY sal) AS 이전급여,
  LEAD(sal, 1, 0) OVER (ORDER BY sal) AS 다음급여
FROM emp;
```

- `LAG` — 이전 행 (오프셋 기본값 1)
- `LEAD` — 이후 행
- 범위를 벗어나면 세 번째 인자(기본값)가 반환

---

### **11. 윈도우 집계와 RANGE vs ROWS**

ORDER BY + 프레임 조합으로 누적합, 이동 평균 같은 계산을 만듭니다. 핵심 비교는 **RANGE vs ROWS**입니다.

| 구분 | 프레임 기준 | 동일 값 처리 |
| :--- | :--- | :--- |
| `ROWS` | 행 개수 | 각 행 독립 |
| `RANGE` | 값 범위 | 동일 값을 같은 프레임으로 묶음 |

```sql
-- ROWS: 각 행마다 독립적으로 누적
SELECT sal,
  SUM(sal) OVER (ORDER BY sal ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS 누적합_rows
FROM emp;

-- RANGE: 동일 급여(3000)가 두 행이면 같은 누적합이 나옴
SELECT sal,
  SUM(sal) OVER (ORDER BY sal RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS 누적합_range
FROM emp;
```

자주 사용하는 프레임 패턴을 정리하면 다음과 같습니다.

| 프레임 | 의미 |
| :--- | :--- |
| `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | 처음부터 현재까지 누적 |
| `ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING` | 현재부터 끝까지 |
| `ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING` | 앞1행 + 현재 + 뒤1행 이동 집계 |

---

### **최종 정리: 상황별 선택 기준**

| 상황 | 선택 |
| :--- | :--- |
| 그룹별 통계 + 소계/총계 한 번에 | `ROLLUP` — 순서가 소계 구조를 결정 |
| 모든 차원의 소계 필요 | `CUBE` — 조합 수만큼 행이 증가 |
| 원하는 소계만 선택 | `GROUPING SETS` |
| 소계 NULL을 사용자 친화 문자열로 | `GROUPING() + CASE` |
| 트리 구조 상→하 조회 | `START WITH ... CONNECT BY PRIOR empno = mgr` |
| 특정 노드에서 상위 체인 조회 | `PRIOR mgr = empno` 방향 반전 |
| 행 유지하면서 순위 | `RANK / DENSE_RANK / ROW_NUMBER` |
| 전체 합 대비 비율 | `RATIO_TO_REPORT` |
| 상대 위치 0~1 | `PERCENT_RANK` |
| 누적 분포 비율 | `CUME_DIST` |
| 파티션의 첫/마지막 값 | `FIRST_VALUE` / `LAST_VALUE + UNBOUNDED FOLLOWING` 필수 |
| 이전/이후 행 값 비교 | `LAG / LEAD` |
| 동일 값을 묶어 집계 | `RANGE` 프레임 |
| 행 단위 독립 집계 | `ROWS` 프레임 |
