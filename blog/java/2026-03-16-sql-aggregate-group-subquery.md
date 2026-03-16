---
title: "SQL 정렬·집계·그룹·집합·피벗·서브쿼리"
date: 2026-03-16
authors: HyungJun
tags: [데이터베이스, DB, 기초이론]
---

`ORDER BY` `집계함수` `GROUP BY` `HAVING` `SET OPERATION` `PIVOT` `SubQuery` `EXISTS`

SQL을 처음 배울 때 가장 헷갈리는 것들이 있습니다. "왜 ORDER BY는 SELECT 뒤에 써야 하지?", "HAVING이랑 WHERE가 뭐가 달라?", "서브쿼리를 썼는데 왜 오류가 나지?" 이 질문들의 답은 모두 하나로 통합니다 — **SQL의 실행 순서**. 이 글은 그 순서를 축으로 삼아, 각 문법이 왜 그렇게 동작하는지를 풀어서 정리합니다.

<!-- truncate -->

---

### **1. ORDER BY — "출력 순서"는 직접 지정해야 보장된다**

많은 사람이 "테이블에 넣은 순서대로 나오겠지"라고 생각하지만, RDBMS는 그런 보장을 하지 않습니다. 내부적으로 가장 빠르게 꺼낼 수 있는 방식으로 결과를 냅니다. 게시판 최신순, 점수 높은 순, 이름 가나다순 — 의도된 순서가 필요하다면 반드시 `ORDER BY`를 명시해야 합니다.

`ORDER BY`가 실행 순서상 **가장 마지막**에 수행된다는 점도 중요합니다. SELECT가 다 끝난 뒤 결과를 정렬하는 것이지, 중간에 데이터를 가공하거나 필터링하는 역할이 아닙니다.

#### **정렬 방향**

- 기본값은 `ASC`(오름차순) — 생략해도 자동 적용
- 내림차순은 `DESC`를 명시

#### **정렬 기준 세 가지**

정렬 기준은 컬럼명, SELECT 목록의 순번(인덱스), 별칭 세 가지로 지정할 수 있습니다.

| 기준 | 예시 | 주의할 점 |
| :--- | :--- | :--- |
| **컬럼명** | `ORDER BY PLAYER_ID` | 가장 명확하고 권장하는 방식 |
| **인덱스** | `ORDER BY 1, 2` | SELECT 컬럼 순서를 바꾸면 정렬 기준도 바뀌어버림 |
| **별칭** | `ORDER BY 최대키` | 계산식이나 집계 결과에 이름을 붙여 정렬할 때 편리 |

```sql
-- 집계 결과(MAX)에 별칭을 붙여 정렬 기준으로 사용
SELECT TEAM_ID, MAX(HEIGHT) AS 최대키
FROM PLAYER
GROUP BY TEAM_ID
ORDER BY 최대키 DESC;
```

---

### **2. 집계함수 — "여러 행을 하나로 압축"하는 대신 치르는 대가**

`COUNT`, `SUM`, `AVG`, `MAX`, `MIN` 같은 집계함수는 여러 행을 단 하나의 값으로 압축합니다. 편리하지만 이 압축 때문에 두 가지 제약이 생깁니다.

**첫 번째 제약: 일반 컬럼을 함께 SELECT할 수 없습니다.**

`SELECT MAX(HEIGHT), PLAYER_NAME FROM PLAYER`처럼 쓰면 오류가 납니다. 키가 가장 큰 선수가 한 명이라도, DB 입장에서는 "MAX(HEIGHT)는 1개인데 PLAYER_NAME은 여러 개 — 어떤 이름을 보여줘야 하지?"라는 모순이 생기기 때문입니다. 이 문제는 서브쿼리나 윈도우 함수로 해결합니다.

**두 번째 제약: NULL은 집계에서 자동으로 제외됩니다.**

예를 들어 10명 중 3명만 커미션(COMM)이 있고 나머지 7명은 NULL이면, `AVG(COMM)`은 10명의 평균이 아니라 3명의 평균을 냅니다. 전체 평균처럼 보이지만 실제로는 그렇지 않은 함정입니다.

#### **COUNT의 세 가지 패턴**

```sql
SELECT COUNT(*)                           FROM PLAYER;  -- 전체 행 수 (NULL 포함)
SELECT COUNT(PLAYER_NAME)                 FROM PLAYER;  -- PLAYER_NAME이 NULL인 행은 제외
SELECT COUNT(NVL(PLAYER_NAME, 'EMPTY'))   FROM PLAYER;  -- NULL을 'EMPTY'로 채워서 포함
```

`COUNT(*)`는 행 자체를 세고, `COUNT(컬럼)`은 해당 컬럼이 NULL이 아닌 행만 셉니다. `NVL`로 NULL을 대체값으로 바꾸면 사실상 전체 행을 세는 효과를 낼 수 있습니다.

#### **DISTINCT는 집계함수와 다릅니다**

`DISTINCT`도 중복을 제거하지만 집계함수와는 성격이 다릅니다.

| 구분 | 동작 방식 | 다른 컬럼을 추가하면? |
| :--- | :--- | :--- |
| `DISTINCT` | 중복 행을 제거하되 **다건으로 반환** | 중복 판정 기준이 바뀌어 묶음이 풀림 |
| 집계함수 | **단 하나의 값으로 축약** | 오류 발생 — "GROUP BY 표현식이 아님" |

---

### **3. MAX/MIN — "가장 큰 값"은 알 수 있지만 "그 값의 주인"은 모른다**

`MAX(HEIGHT)`로 가장 큰 키를 알 수 있지만, "그 키를 가진 선수의 이름"은 함께 출력할 수 없습니다. 집계함수가 여러 행을 하나로 압축해버리기 때문입니다. 선수 이름처럼 행 단위 정보가 필요하면 서브쿼리나 조인이 필요합니다.

```sql
-- 팀별 최대·최소 키와 최대·최소 몸무게
SELECT TEAM_ID, MAX(HEIGHT), MIN(HEIGHT), MAX(WEIGHT), MIN(WEIGHT)
FROM PLAYER
GROUP BY TEAM_ID;
```

#### **MAX+1로 다음 ID를 만드는 패턴**

시퀀스 없이 `연도 + 3자리 순번` 형태의 규칙형 ID를 생성해야 하는 상황이 있습니다. 예를 들어 2026년 첫 번째 주문은 `2026001`, 세 번째는 `2026003`처럼 만드는 경우입니다.

| 구성 요소 | 결과 | 사용 함수 |
| :--- | :--- | :--- |
| 현재 연도 추출 | `2026` | `TO_CHAR(SYSDATE, 'YYYY')` |
| 기존 최대 ID에서 순번 자르기 | `002` | `SUBSTR(MAX_ID, 5, 3)` |
| 1 더하기 | `3` | `TO_NUMBER(...) + 1` |
| 3자리로 앞자리 0 채우기 | `003` | `LPAD(..., 3, '0')` |
| 연결 | `2026003` | `\|\|` 연산자 |

> **주의:** 두 사용자가 동시에 같은 로직을 실행하면 같은 ID가 생성될 수 있습니다. 실무에서는 시퀀스·UUID·DB 락을 함께 고려해야 합니다.

---

### **4. GROUP BY / HAVING — WHERE는 "원본 행"에, HAVING은 "그룹 결과"에**

`GROUP BY`는 집계함수와 조합해서 **그룹별 통계**를 냅니다. 집계함수가 전체를 하나로 압축한다면, `GROUP BY`는 "팀별로", "부서별로", "월별로" 나눠서 각 그룹마다 하나의 통계를 냅니다.

여기서 가장 헷갈리는 게 `WHERE`와 `HAVING`의 구분입니다.

- `WHERE`: `GROUP BY` 이전에 실행 — 원본 행에 조건을 겁니다
- `HAVING`: `GROUP BY` 이후에 실행 — 집계가 끝난 그룹 결과에 조건을 겁니다

두 문장을 비교하면 차이가 명확해집니다.

| 요구사항 | 올바른 절 | 실행 흐름 |
| :--- | :--- | :--- |
| "190cm 이상 선수들 중에서, 팀별 최대 키를 구해라" | `WHERE HEIGHT >= 190` 먼저, 그 다음 `GROUP BY` | 먼저 190 미만 행을 제거한 뒤 그룹화 |
| "팀별 최대 키를 구했을 때, 그 값이 190 이상인 팀만 출력해라" | `GROUP BY` 먼저, 그 다음 `HAVING MAX(HEIGHT) >= 190` | 모든 팀의 통계를 낸 뒤 조건으로 필터링 |

```sql
-- 평균 급여가 2000 이상인 부서만 (HAVING 사용)
SELECT DEPTNO, TRUNC(AVG(SAL)) AS 평균급여
FROM EMP
GROUP BY DEPTNO
HAVING AVG(SAL) >= 2000;
```

또 하나 알아야 할 점은 **NULL도 하나의 그룹으로 취급**된다는 것입니다. 포지션이 NULL인 선수들이 모여 "NULL 포지션 그룹"이 생깁니다. 이를 원하지 않는다면 `WHERE POSITION IS NOT NULL`로 먼저 제거하는 것이 성능에도 유리합니다.

---

### **5. 그룹 통계 + 상세 정보 — 두 단계로 나눠서 붙인다**

"팀별로 가장 키가 큰 선수를 뽑되, 그 선수의 이름과 포지션도 함께 출력해라"는 집계만으로는 풀 수 없는 문제입니다. 그룹 통계는 값만 알 뿐 그 값이 누구의 것인지 연결이 끊겼기 때문입니다.

해법은 **두 단계**입니다. ① 그룹 통계를 먼저 만들고, ② 그 결과를 원본 테이블에 조인해서 상세 정보를 복원합니다.

```sql
-- 방법 1: 인라인 뷰 조인 — "그룹 통계 테이블"과 원본을 TEAM_ID + HEIGHT로 연결
SELECT P.PLAYER_NAME, P.TEAM_ID, P.HEIGHT, P.POSITION
FROM PLAYER P
JOIN (
    SELECT TEAM_ID, MAX(HEIGHT) AS MAX_HEIGHT
    FROM PLAYER
    GROUP BY TEAM_ID
) G ON P.TEAM_ID = G.TEAM_ID AND P.HEIGHT = G.MAX_HEIGHT;

-- 방법 2: 튜플 IN 비교 — 두 컬럼을 묶어서 한 번에 비교 (더 짧고 직관적)
SELECT PLAYER_NAME, TEAM_ID, HEIGHT, POSITION
FROM PLAYER
WHERE (TEAM_ID, HEIGHT) IN (
    SELECT TEAM_ID, MAX(HEIGHT)
    FROM PLAYER
    GROUP BY TEAM_ID
);
```

팀명까지 필요하면 TEAM 테이블을 추가로 조인해서 확장하면 됩니다. **"통계 먼저, 상세 정보는 바깥에서 조인으로 붙인다"** 는 사고방식이 핵심입니다.

---

### **6. LISTAGG / WITHIN GROUP / RANK — 집계의 확장**

#### **LISTAGG — 여러 행 값을 한 칸에 모아서 보여주기**

DB는 기본적으로 배열을 지원하지 않습니다. 그런데 화면이나 보고서에서 "K01팀 선수: 홍길동, 김철수, 이영희"처럼 여러 행 값을 한 칸에 나열해야 할 때가 있습니다. 이때 `LISTAGG`를 사용합니다.

```sql
-- 팀별 선수 이름을 쉼표로 연결 (이름 오름차순 정렬)
SELECT TEAM_ID,
       LISTAGG(PLAYER_NAME, ', ') WITHIN GROUP (ORDER BY PLAYER_NAME) AS 선수목록
FROM PLAYER
GROUP BY TEAM_ID;
```

`WITHIN GROUP (ORDER BY ...)`는 집계된 문자열 **내부**의 정렬 순서를 지정합니다. 일반 `ORDER BY`와는 다른 개념입니다. 중복이 있다면 인라인 뷰에서 `DISTINCT`로 제거한 뒤 `LISTAGG`를 적용하면 됩니다.

#### **RANK() — 행은 그대로 두고 순위만 추가**

`GROUP BY`는 행을 합쳐버리지만, `RANK()`는 원본 행을 유지하면서 각 행에 순위를 붙입니다. `PARTITION BY`로 그룹 경계를 나누고, `ORDER BY`로 그룹 내 정렬 기준을 정합니다.

```sql
-- 각 팀 내에서 키 순위 (동점이면 같은 순위, 다음 순위는 건너뜀)
SELECT PLAYER_NAME, TEAM_ID, HEIGHT,
       RANK() OVER (PARTITION BY TEAM_ID ORDER BY HEIGHT DESC) AS 팀내순위
FROM PLAYER;
```

`WITHIN GROUP`의 또 다른 활용으로, 특정 값이 전체 분포에서 몇 등인지도 계산할 수 있습니다.

```sql
-- 키 185cm는 전체 선수 중 몇 등인가?
SELECT RANK(185) WITHIN GROUP (ORDER BY HEIGHT DESC) AS 순위
FROM PLAYER;
```

---

### **7. SET OPERATION — 쿼리 결과를 세로로 쌓기**

조인이 두 테이블을 **가로(열 방향)**로 붙인다면, SET OPERATION은 쿼리 결과를 **세로(행 방향)**로 쌓습니다. 엑셀로 비유하면, 두 시트의 데이터를 아래로 이어 붙이는 것과 같습니다.

| 연산 | 의미 | 중복 처리 |
| :--- | :--- | :--- |
| `UNION` | 두 결과의 합집합 | 중복 행 자동 제거 |
| `UNION ALL` | 두 결과의 합집합 | 중복 행 그대로 유지 |
| `INTERSECT` | 두 결과에 공통으로 있는 행만 | — |
| `MINUS` | 앞 결과에서 뒤 결과에 있는 행을 제거 | — |

#### **반드시 지켜야 할 규칙**

1. **컬럼 개수**가 같아야 합니다
2. **컬럼 데이터 타입**이 대응되어야 합니다 (NUMBER ↔ VARCHAR2면 오류)
3. 결과 **컬럼명은 선행 쿼리(앞쪽 쿼리)의 이름**을 따릅니다
4. `ORDER BY`는 전체 연산이 끝난 **맨 마지막에 한 번만** 쓸 수 있습니다

```sql
-- EMP.EMPNO(NUMBER)와 PLAYER.PLAYER_ID(VARCHAR2) 타입이 다름 → TO_CHAR로 맞춤
SELECT TO_CHAR(EMPNO), ENAME FROM EMP
UNION
SELECT PLAYER_ID, PLAYER_NAME FROM PLAYER
ORDER BY 1;  -- ORDER BY는 여기 마지막에 한 번만
```

> 중복 제거 기준은 SELECT에 포함된 **컬럼 조합 전체**입니다. 같은 테이블을 합쳐도 SELECT 컬럼이 바뀌면 중복 판정 결과가 달라집니다.

---

### **8. PIVOT / UNPIVOT — 리포트용 행↔열 전환**

월별 데이터를 가로로 펼쳐서 보고 싶을 때가 있습니다. 예를 들어 날짜별 건수가 세로(행)로 쌓인 데이터를, 1월·2월·3월…이 열로 나열된 가로형 표로 바꾸는 것입니다. 이것이 `PIVOT`입니다. 반대로 열을 행으로 바꾸는 것이 `UNPIVOT`입니다.

`PIVOT` 이전에 먼저 데이터를 준비해야 합니다. 없는 경우 `CONNECT BY LEVEL`로 연속 데이터를 생성할 수 있습니다.

```sql
-- 1년치 날짜 데이터 생성 (LEVEL이 1씩 증가하며 날짜를 만들어냄)
CREATE TABLE DAILY_DATA AS
SELECT DATE '2025-01-01' + (LEVEL - 1) AS DD_DATE
FROM DUAL
CONNECT BY LEVEL <= 365;

-- 월별 건수를 열로 펼치기
SELECT *
FROM DAILY_DATA
PIVOT (
    COUNT(DD_DATE)
    FOR TO_CHAR(DD_DATE, 'MM') IN (
        '01' AS "1월", '02' AS "2월", '03' AS "3월",
        '04' AS "4월", '05' AS "5월", '06' AS "6월",
        '07' AS "7월", '08' AS "8월", '09' AS "9월",
        '10' AS "10월", '11' AS "11월", '12' AS "12월"
    )
);
```

#### **WITH AS — 테이블 없이 가상 데이터를 선언하고 바로 사용**

`WITH ... AS`는 실제 테이블을 만들지 않고 임시 데이터를 쿼리 안에서 정의하는 문법입니다. 테스트하거나 실습할 때 DDL 없이 바로 데이터를 만들어 쓸 수 있어서 편리합니다.

```sql
-- 가상 성적 데이터를 WITH로 선언 → 과목별로 행 전환 (UNPIVOT)
WITH SCORE_DATA AS (
    SELECT '홍길동' AS NAME, 90 AS KOR, 85 AS ENG, 78 AS MATH FROM DUAL
)
SELECT NAME, SUBJECT, SCORE
FROM SCORE_DATA
UNPIVOT (SCORE FOR SUBJECT IN (KOR AS '국어', ENG AS '영어', MATH AS '수학'));
```

---

### **9. 서브쿼리 — 위치에 따라 역할이 달라진다**

서브쿼리는 쿼리 안에 괄호로 감싸진 또 다른 쿼리입니다. 메인 쿼리가 실행되기 전에 먼저 실행되어 값을 제공합니다. 어디에 위치하느냐에 따라 이름과 역할이 달라집니다.

| 위치 | 이름 | 설명 |
| :--- | :--- | :--- |
| `SELECT`, `WHERE`, `HAVING` 등 | **스칼라 서브쿼리** | 단일 값 반환 기대. 여러 행을 반환하면 오류 |
| `FROM` 절 | **인라인 뷰** | 임시 테이블처럼 사용. 별칭을 붙여 조인 가능 |

#### **단일행 오류 — 가장 흔한 실수**

`=` 비교는 서브쿼리가 정확히 한 행만 반환할 것을 기대합니다. 만약 같은 이름을 가진 선수가 여러 명이라면 오류가 납니다.

```sql
-- ❌ '정현수'라는 이름이 여러 명이면 "단일 행 하위 질의에 두 개 이상의 행이 반환됩니다" 오류
SELECT * FROM PLAYER
WHERE PLAYER_NAME = (SELECT PLAYER_NAME FROM PLAYER WHERE TEAM_ID = 'K01');

-- ✅ IN으로 바꾸면 다중행을 처리할 수 있음
SELECT * FROM PLAYER
WHERE PLAYER_NAME IN (SELECT PLAYER_NAME FROM PLAYER WHERE TEAM_ID = 'K01');
```

---

### **10. 연관 서브쿼리 / EXISTS / UPDATE**

#### **연관 서브쿼리 — 메인 쿼리의 각 행을 서브쿼리로 전달**

일반 서브쿼리는 한 번만 실행되어 결과를 메인에 넘기지만, 연관 서브쿼리는 메인 쿼리의 행이 하나씩 꺼내질 때마다 서브쿼리를 다시 실행합니다.

"자기 팀의 평균 키보다 큰 선수만 뽑아라"는 팀마다 평균이 다르기 때문에, 선수 한 명씩 꺼내면서 그 선수의 팀 평균을 구해야 합니다. 이것이 연관 서브쿼리가 필요한 이유입니다.

```sql
-- P.TEAM_ID로 서브쿼리와 연결 — 현재 선수의 팀 평균을 그때그때 계산
SELECT P.PLAYER_NAME, P.TEAM_ID, P.HEIGHT
FROM PLAYER P
WHERE P.HEIGHT > (
    SELECT AVG(HEIGHT)
    FROM PLAYER
    WHERE TEAM_ID = P.TEAM_ID  -- 메인 쿼리의 현재 행 값이 들어옴
);
```

단점은 선수 수만큼 서브쿼리를 반복 실행한다는 것입니다. 데이터가 많으면 느릴 수 있으므로, 인라인 뷰에서 팀 평균을 미리 구한 뒤 조인하는 방식이 더 효율적입니다.

#### **EXISTS — 존재 여부만 확인하면 되는 경우**

`IN`은 서브쿼리 결과 전체를 리스트로 만든 뒤 비교하지만, `EXISTS`는 **조건을 만족하는 행이 하나라도 있으면 즉시 참**으로 판단하고 멈춥니다. 서브쿼리의 SELECT 목록이 무엇인지는 전혀 상관없습니다 — 존재 여부만 봅니다.

```sql
-- ✅ 주문이 1건이라도 있는 고객 — 첫 매칭 발견 즉시 중단하므로 IN보다 빠른 경우가 많음
SELECT CUST_NAME FROM CUSTOMER C
WHERE EXISTS (SELECT 1 FROM ORDERS O WHERE O.CUST_ID = C.CUST_ID);

-- ✅ 단 한 번도 주문하지 않은 고객
SELECT CUST_NAME FROM CUSTOMER C
WHERE NOT EXISTS (SELECT 1 FROM ORDERS O WHERE O.CUST_ID = C.CUST_ID);
```

> `NOT IN`은 서브쿼리 결과에 NULL이 하나라도 있으면 결과가 전부 공집합이 됩니다. 안전하게 쓰려면 `NOT EXISTS`가 낫습니다.

#### **UPDATE에 연관 서브쿼리 적용**

컬럼을 새로 추가한 뒤 다른 테이블에서 값을 가져와 채워야 할 때 연관 서브쿼리를 `SET` 절에 사용합니다.

```sql
-- ① TEAM 테이블에 경기장 이름 컬럼 추가
ALTER TABLE TEAM ADD (STADIUM_NAME VARCHAR2(40));

-- ② STADIUM 테이블에서 일치하는 경기장 이름을 찾아 채우기
UPDATE TEAM T
SET STADIUM_NAME = (
    SELECT S.STADIUM_NAME
    FROM STADIUM S
    WHERE S.STADIUM_ID = T.STADIUM_ID  -- 현재 TEAM 행의 STADIUM_ID로 연결
);
```

---

### **최종 정리: 상황별 선택 기준**

| 상황 | 선택 |
| :--- | :--- |
| 출력 순서를 보장해야 할 때 | `ORDER BY` — 생략하면 순서 보장 없음 |
| 전체 행의 통계 한 줄 | 집계함수 — NULL은 자동 제외됨을 주의 |
| 그룹별 통계 여러 줄 | `GROUP BY` + 필요 시 `HAVING` |
| 그룹 통계 + 해당 행의 상세 정보 | 인라인 뷰 조인 또는 튜플 `IN` |
| 행 값을 한 줄에 나열 | `LISTAGG ... WITHIN GROUP` |
| 행 유지하면서 순위 추가 | `RANK() OVER (PARTITION BY ...)` |
| 쿼리 결과를 세로로 합치기 | SET OPERATION — 컬럼 수·타입 일치 필수 |
| 행을 열로(가로형 리포트) | `PIVOT` |
| 열을 행으로 | `UNPIVOT` |
| 서브쿼리가 여러 행 반환할 때 | `=` 대신 `IN` |
| 존재 여부만 확인 | `EXISTS` / `NOT EXISTS` |
| 다른 테이블 값으로 UPDATE | 연관 서브쿼리 (`SET` 절 안에 서브쿼리) |
