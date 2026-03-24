---
title: "MyBatis CRUD, 동적 SQL, Lombok"
date: 2026-03-24
authors: HyungJun
tags: [Java, JDBC, 데이터베이스]
---

`resultMap` `openSession` `Lombok` `@Builder` `#{}` `${}` `LIKE` `selectKey`

DTO 바인딩의 방향성(입력은 게터, 출력은 세터)을 도식화한 뒤, insert/delete/update 레포지토리 구현과 트랜잭션 처리, 신규 웹 프로젝트 셋업, Lombok VO 자동화, 동적 SQL 기초까지 한 번에 정리합니다.

<!-- truncate -->

---

### **1. DTO 바인딩 방향성 — 입력은 게터, 출력은 세터**

MyBatis에서 DTO는 두 방향으로 동작합니다.

| 방향 | 동작 | 예시 |
| :--- | :--- | :--- |
| 입력 (파라미터 → SQL) | `#{}` → DTO의 **게터** 호출 | `#{jobId}` → `dto.getJobId()` |
| 출력 (SQL 결과 → DTO) | `resultType/resultMap` → DTO의 **세터** 호출 | `setJobId("AD_PRES")` |

- 하나의 DTO를 쓰더라도 "입력용(게터 중심) / 출력용(세터 중심)"으로 역할을 분리해 생각하면 흐름이 명확해집니다.
- 반복 SELECT 컬럼은 `<sql id="cols">` 로 정의하고 `<include refid="cols"/>` 로 재사용합니다.

---

### **2. resultMap vs alias — 매핑 단순화 선택 기준**

| 구분 | 사용 조건 | 장점 | 주의점 |
| :--- | :--- | :--- | :--- |
| `resultType` | 컬럼명 = 프로퍼티명 (또는 alias로 일치) | 설정 간단, XML 짧음 | 불일치 많으면 관리 비용 증가 |
| `resultMap` | 컬럼명-프로퍼티명 불일치, 복잡한 매핑 | 명시적이라 협업 가독성 좋음 | 설정이 길어짐 |

```xml
<!-- resultMap: column(쿼리 결과) → property(DTO 세터) 명시 연결 -->
<resultMap id="jobsMap" type="JobsDTO">
    <result column="player_id"   property="jobId"/>
    <result column="player_name" property="jobTitle"/>
</resultMap>

<!-- alias로 resultType 자동 매핑도 가능 -->
<select id="findAll" resultType="JobsDTO">
    SELECT player_id AS jobId, player_name AS jobTitle FROM jobs
</select>
```

- `resultMap`은 매퍼 상단에 선언해두면 여러 쿼리에서 재사용 가능합니다.

---

### **3. CRUD 레포지토리 구현과 트랜잭션**

#### **구성 요소**

```
IJobsIduRepository (인터페이스)
    └── JobsIduRepositoryImpl (구현체)
            └── Mapper XML (namespace + id)
```

- `namespace`는 식별 문자열이므로 임의값도 가능하지만, 협업을 위해 레포지토리 클래스 경로(관례)를 사용합니다.
- Mapper XML 생성 후 `configuration.xml`의 `<mappers>`에 반드시 등록해야 합니다. **가장 빈번한 오류 원인**입니다.

#### **DML 반환값 — 영향받은 로우 수**

```java
// insert/update/delete는 변경된 로우 수를 int로 반환
int cnt = session.insert(NS + ".insertJob", dto);
assertEquals(1, cnt); // JUnit 검증
```

#### **openSession — 자동 커밋 vs 수동 커밋**

```java
// 자동 커밋 (학습/단순 실습)
SqlSession session = factory.openSession(true);

// 수동 커밋 (트랜잭션 묶음 처리)
SqlSession session = factory.openSession(false); // 기본값
session.insert(...);
session.update(...);
session.commit(); // 일괄 반영
session.rollback(); // 실패 시 롤백
```

#### **구현체 공통 멤버 패턴**

```java
private static final String NS = "jobs.idu.";           // SQL ID 결합
private final Logger log = LoggerFactory.getLogger(getClass());
private SqlSessionFactory factory = SqlSessionFactoryManager.getFactory();
```

---

### **4. 신규 웹 프로젝트 — MyBatis 팩토리 설정**

#### **properties로 DB 설정 분리**

```properties
# oracle.properties — 값 뒤 공백 주의! 공백도 값으로 인식됨
driver=oracle.jdbc.OracleDriver
url=jdbc:oracle:thin:@localhost:1521:xe
```

```xml
<!-- config.xml -->
<properties resource="oracle.properties"/>
<dataSource type="POOLED">
    <property name="driver" value="${driver}"/>
    <property name="url"    value="${url}"/>
</dataSource>
```

- `resource` 경로는 **파일 시스템 경로가 아닌 클래스패스 경로**입니다.

#### **SqlSessionFactory 정적 초기화**

```java
public class SqlSessionFactoryManager {
    private static SqlSessionFactory factory;

    static {
        try {
            Reader reader = Resources.getResourceAsReader("config.xml");
            factory = new SqlSessionFactoryBuilder().build(reader);
        } catch (IOException e) { throw new RuntimeException(e); }
    }

    public static SqlSessionFactory getFactory() { return factory; }
}
```

---

### **5. Lombok으로 VO 자동화**

Eclipse 기준: Lombok jar 실행 → IDE agent 설치 → `eclipse.ini` 항목 확인 → Maven 의존성 추가.

#### **주요 어노테이션**

| 어노테이션 | 생성 내용 | 비고 |
| :--- | :--- | :--- |
| `@Getter @Setter` | 전체 필드 getter/setter | DTO 기본 생산성 |
| `@NoArgsConstructor` | 기본 생성자 | 프레임워크 매핑 필수 |
| `@AllArgsConstructor` | 전체 필드 생성자 | 테스트 데이터 구성 |
| `@ToString` | `toString()` 오버라이드 | 로그/디버깅 |
| `@Builder` | 빌더 패턴 | 필요한 필드만 선택해 생성 |

```java
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@ToString @Builder
public class JobsVO {
    private String jobId;
    private String jobTitle;
    private int    minSalary;
    private int    maxSalary;
}

// Builder 사용
JobsVO vo = JobsVO.builder()
    .jobId("IT_DEV")
    .jobTitle("Developer")
    .build(); // 필요한 필드만 지정 가능
```

> **세로 편집 팁 (Eclipse)**: 필드 목록 생성 시 `Alt+Shift+A`로 멀티 커서 편집. 입력기가 한글 상태면 깨지므로 영문 상태 유지 필수.

---

### **6. `#{}` vs `${}` 바인딩, LIKE 검색**

#### **바인딩 차이 요약**

```xml
<!-- #{} — PreparedStatement 바인딩. 안전 -->
WHERE job_id = #{jobId}

<!-- ${} — 문자열 치환. 컬럼명처럼 SQL 구조 요소에만 제한 사용 -->
WHERE ${column} = #{value}
```

`${}` 위치에 `1=1 OR 1=1` 같은 입력이 들어오면 조건이 무력화됩니다. **값 위치에는 반드시 `#{}`를 사용**하고, `${}` 사용 시 허용 값 화이트리스트로 입력을 통제해야 합니다.

#### **LIKE 검색 — `%` 처리**

```xml
<!-- DB 문자열 결합으로 % 고정, 입력값은 #{} 바인딩 -->
WHERE job_title LIKE '%' || #{keyword} || '%'
```

`%`를 SQL 고정 문자열로 두고 입력값만 `#{}`로 바인딩하면, 안전성과 구현 편의성을 동시에 확보할 수 있습니다.

---

### **7. selectKey — insert 후 PK 회수 (예고)**

`insert/update/delete`는 성공한 로우 수만 반환합니다. "글 작성 후 상세 페이지로 이동"처럼 **방금 생성된 PK를 즉시 알아야 하는 시나리오**에서는 문제가 됩니다.

```java
// insert는 성공했지만 생성된 SEQ(PK)를 모름
int cnt = session.insert(NS + ".insertBoard", dto);
// dto.getBoardNo() == null ???
```

`selectKey`는 insert 전/후에 키 조회 SQL을 실행해 결과를 파라미터 DTO에 다시 주입합니다. Java의 참조 전달과 유사한 효과로, insert 이후 바로 PK를 활용한 상세 조회를 이어갈 수 있게 해줍니다.

```xml
<insert id="insertBoard" parameterType="BoardDTO">
    <selectKey keyProperty="boardNo" resultType="int" order="BEFORE">
        SELECT board_seq.nextval FROM dual
    </selectKey>
    INSERT INTO board VALUES (#{boardNo}, #{title}, #{content})
</insert>
```

- `order="BEFORE"` : insert 전에 시퀀스를 조회해 DTO에 주입 → insert 시 `#{boardNo}` 사용 가능
- 다음 수업에서 selectKey + 서비스/모델 분리 구조로 확장 예정

---

### **정리 — 선택 기준**

| 상황 | 선택 |
| :--- | :--- |
| 컬럼명 = 프로퍼티명 | `resultType` 자동 매핑 |
| 컬럼명 불일치 / alias | `resultMap` 또는 alias + `resultType` |
| DML 성공 여부 확인 | 반환 `int`(로우 수) → `assertEquals(1, cnt)` |
| 단일 SQL로 묶을 트랜잭션 | `openSession(false)` + `commit()` / `rollback()` |
| VO 빠른 구성 | Lombok `@Getter @Setter @Builder` |
| 값 조건 바인딩 | `#{}` |
| 컬럼명 동적 구성 | `${}` + 화이트리스트 통제 |
| LIKE 검색 | `'%' \|\| #{keyword} \|\| '%'` |
| insert 후 PK 필요 | `selectKey` |
