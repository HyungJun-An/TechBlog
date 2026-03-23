---
title: "MyBatis SELECT 완전 정복 + 싱글턴 패턴"
date: 2026-03-23
authors: HyungJun
tags: [Java, JDBC, 데이터베이스, 디자인패턴]
---

`SqlSession` `#{}` `${}` `resultMap` `selectOne` `selectList` `selectMap` `CDATA` `Singleton`

파라미터 전달(기본 타입 → DTO → Map)과 결과 매핑(기본 타입 → DTO → resultMap → Map → List)을 단계적으로 확장하며 MyBatis SELECT 흐름 전체를 정리합니다. 후반부에는 XML 파싱 충돌 해결(CDATA)과 싱글턴 디자인 패턴을 다룹니다.

<!-- truncate -->

---

### **1. MyBatis 설정과 조회 기본 흐름**

#### **프로젝트 핵심 구성 5가지**

| 구성 요소 | 역할 |
| :--- | :--- |
| `configuration.xml` | MyBatis 환경 설정, DB 연결 정보, 매퍼 등록 |
| 매퍼 XML | SQL 정의. `<mappers>`에 등록해야 호출 가능 |
| DTO | 요청/응답 데이터 운반 |
| `SqlSessionFactory` / `SqlSession` | 쿼리 실행 진입점 |
| JUnit 테스트 | 실행 결과 검증 |

매퍼 XML은 만들기만 해서는 동작하지 않습니다. `configuration.xml`의 `<mappers>`에 리소스 경로를 반드시 등록해야 합니다.

#### **MyBatis 실행 고정 패턴**

```java
// 1. SqlSessionFactory로 SqlSession 생성
SqlSession session = factory.openSession();

// 2. "namespace.id" + 파라미터로 쿼리 호출
EmpDto result = session.selectOne(NS + ".findById", empId);

// 3. 반환값 반드시 수신
session.close();
```

- 네임스페이스 문자열은 상수 `NS`로 관리 → statement not found 오류 예방
- 로그가 보이지 않으면 `logback.xml` 레벨/appender 설정 점검

---

### **2. 바인딩 문법: `#{}` vs `${}`**

| 구분 | `#{}` | `${}` |
| :--- | :--- | :--- |
| 처리 방식 | 값 바인딩 (PreparedStatement) | 문자열 치환 (텍스트 직접 삽입) |
| 따옴표 처리 | 자동 적용 | 미적용 |
| 보안 | 안전 | SQL Injection 취약 |
| 권장 용도 | WHERE 절 값 | 컬럼명·정렬 기준 등 SQL 구조 요소 (제한적) |

- **`${}`는 최소화** — 컬럼명처럼 따옴표가 붙으면 안 되는 구조 요소에만 예외적으로 사용합니다.
- MyBatis 3.x에서는 `parameterType` 생략 가능 → 회사 코드에서 빠져 있어도 버전 특성 먼저 확인하세요.
- `resultType`은 `java.lang.Integer` 또는 `int`, `Integer` 모두 허용. 학습 단계에서는 FQCN을 명확히 쓰는 것이 유리합니다.

---

### **3. DTO 반환과 resultMap**

#### **자동 매핑 조건**

MyBatis는 SELECT 컬럼명과 DTO 프로퍼티명(setter 기준)을 자동 매핑합니다. `JOB_ID` → `jobId`처럼 스네이크 케이스 변환도 지원하지만, alias를 쓰거나 컬럼명이 다르면 자동 매핑이 실패합니다.

#### **resultMap — 강제 매핑**

```xml
<resultMap id="empMap" type="EmpDto">
    <result column="emp_alias"  property="empId"/>
    <result column="name_alias" property="empName"/>
</resultMap>

<select id="findByAlias" resultMap="empMap">
    SELECT emp_id AS emp_alias, emp_name AS name_alias FROM emp
</select>
```

- `column` = 쿼리 결과 컬럼명(alias 포함), `property` = DTO 필드명
- 매퍼 상단에 선언해두면 여러 쿼리에서 재사용 가능 → 유지보수 유리

| 상황 | 선택 |
| :--- | :--- |
| 컬럼명 = 프로퍼티명 (자동 매핑 가능) | `resultType` |
| alias 사용 또는 이름 불일치 | `resultMap` |
| 매핑 정의를 여러 쿼리에서 공유 | `resultMap` 재사용 |

---

### **4. `<include>` 재사용과 조회 API 반환 규칙**

#### **`<sql>` + `<include>` — 컬럼 목록 재사용**

```xml
<sql id="empCols">emp_id, emp_name, job_id, salary</sql>

<select id="findAll" resultType="EmpDto">
    SELECT <include refid="empCols"/> FROM emp
</select>
```

- `refid` 오타 → 런타임에서 fragment 탐색 실패 → 가장 먼저 점검
- `<include refid="..." />` 자기 닫힘 형태 권장

#### **selectOne / selectList / selectMap 반환 규칙**

| 메서드 | 반환 | 결과 없음 | 주의점 |
| :--- | :--- | :--- | :--- |
| `selectOne` | 단일 객체 | `null` | 결과 2개 이상 → `TooManyResultsException` |
| `selectList` | `List<T>` | 빈 리스트 (size 0) | null 아님 → NPE 방지 유리 |
| `selectMap` | `Map<K, V>` | 빈 맵 | 세 번째 인자로 키 컬럼 지정 필수 |

- `selectMap` 결과를 `Map<String, DTO>`로 캐스팅하면 내부 중첩 맵 구조 때문에 `ClassCastException` 발생 가능 → `Map<String, Object>`로 받아야 안전합니다.
- 파라미터 2개 이상 → DTO 또는 Map으로 묶어 전달. DTO면 `#{jobId}`(getter 기반), Map이면 키 기반으로 꺼냅니다.

---

### **5. CDATA로 XML 파싱 충돌 해결**

매퍼 XML에서 `<`, `&` 같은 문자는 XML 파서가 태그/엔티티로 오인합니다.

```xml
<!-- 오류: < 가 태그 시작으로 인식됨 -->
WHERE MIN_SALARY < #{minSalary}

<!-- 해결: CDATA로 SQL 구간 전체를 감쌈 -->
<![CDATA[
    WHERE MIN_SALARY < #{minSalary}
]]>
```

- SQL 구간을 **통째로** 감싸는 것이 안전합니다. 일부만 감싸다 괄호/태그 구조가 깨지는 실수가 잦습니다.

---

### **6. 싱글턴 디자인 패턴**

**인스턴스를 단 하나만 생성해 재사용**하는 패턴입니다. 설정·로그·커넥션 관리처럼 상태가 변하지 않는 기능성 객체에 적합합니다. DTO처럼 상태가 계속 바뀌는 객체에는 부적합합니다.

#### **구현 4단계**

```java
public class AppConfig {
    // 1. 자기 자신 타입의 private static 필드
    private static AppConfig instance;

    // 2. 외부 생성 차단 — private 생성자
    private AppConfig() {}

    // 3. 외부 접근용 public static 메서드
    public static AppConfig getInstance() {
        // 4. 최초 1회만 생성, 이후 캐시된 인스턴스 반환
        if (instance == null) {
            instance = new AppConfig();
        }
        return instance;
    }
}
```

```java
// 동일 객체 여부 검증
AppConfig a = AppConfig.getInstance();
AppConfig b = AppConfig.getInstance();
System.out.println(a == b);                     // true
System.out.println(a.hashCode() == b.hashCode()); // true
```

- `static`은 **멤버 필드/메서드에만** 적용 가능 — 일반 클래스 자체를 `static`으로 선언하는 것은 불가합니다.
- `SqlSessionFactory`를 싱글턴으로 관리하면 앱 전체에서 하나의 팩토리 인스턴스를 공유할 수 있습니다.

---

### **정리 — 선택 기준 요약**

| 상황 | 선택 |
| :--- | :--- |
| 단일 값 조회 | `selectOne` + `resultType` 기본 타입 |
| DTO 단건 조회 (컬럼명 일치) | `selectOne` + `resultType` DTO |
| DTO 단건 조회 (alias/불일치) | `selectOne` + `resultMap` |
| 목록 조회 | `selectList` |
| 특정 키로 빠르게 접근할 맵 조회 | `selectMap` + 키 컬럼 지정 |
| XML에서 `<`, `&` 사용 | `CDATA` |
| 앱 전체 공유 객체 (설정/팩토리) | `Singleton` 패턴 |
