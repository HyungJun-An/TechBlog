---
title: "JDBC CRUD와 Maven 기초"
date: 2026-03-20
authors: HyungJun
tags: [Java, JDBC, 데이터베이스, 기초이론]
---

`JDBC 6단계` `PreparedStatement` `ResultSet` `OCP` `Repository` `Maven` `pom.xml` `JUnit`

JDBC는 실무에서 직접 작성할 일이 줄었지만, MyBatis나 JPA가 "내부에서 대신 해주는 일"을 이해하려면 반드시 짚고 가야 하는 바닥 지식입니다. 이 글은 JDBC 6단계 흐름을 OCP 형태로 구조화하는 방식, SQL CRUD를 JUnit으로 검증하는 패턴, 그리고 Maven 웹 프로젝트 세팅까지 실무 연결 관점에서 정리합니다.

<!-- truncate -->

---

### **1. JDBC 6단계 — "자동화의 원리"를 이해하기 위한 기반**

추상화가 높아질수록 "A만 호출했는데 내부에서 B~F가 자동 실행"되는 구조가 됩니다. 그 자동화의 원리를 모르면 트러블슈팅에서 한계가 옵니다. JDBC의 핵심은 **반복되는 6단계 흐름**을 공통 모듈로 분리해 중복을 줄이는 것입니다.

| 단계 | JDBC 처리 의미 | 구현 위치 |
| :--- | :--- | :--- |
| 1단계 | 드라이버 로딩 (`Class.forName(...)`) | 공통 모듈 (`Database`) |
| 2단계 | DB 연결 (`Connection` 획득) | 공통 모듈 `getConnection()` |
| 3단계 | 쿼리 준비 (`PreparedStatement` 생성 + 바인딩) | Repository 구현체 |
| 4단계 | 쿼리 실행 (`executeQuery` / `executeUpdate`) | Repository 구현체 |
| 5단계 | 결과 처리 (`ResultSet` → DTO 매핑 또는 행 수 처리) | Repository 구현체 |
| 6단계 | 자원 해제 (`ResultSet` / `Statement` / `Connection` close) | 공통 모듈 `close()` |

공통 모듈은 1·2·6단계를 담당하고, 구현체는 3~5단계에만 집중합니다. 이 분리 덕분에 쿼리가 바뀌어도 공통 모듈은 손댈 필요가 없습니다.

---

### **2. OCP Repository 구조 — 인터페이스로 CRUD를 추상화**

Repository 인터페이스에 **기능의 추상 메서드**를 먼저 정의하고, 구현 클래스가 이를 채우는 OCP 형태로 설계합니다. 메서드 시그니처는 SQL에서 그대로 읽어냅니다.

- **WHERE 조건에 필요한 값** → 메서드 파라미터
- **단건 결과** → `EmpDto` 반환
- **다건 결과** → `List<EmpDto>` 반환
- **INSERT / UPDATE / DELETE** → 성공 행 수 `int` 반환

```java
// Repository 인터페이스 예시
public interface EmpRepository {
    List<EmpDto> findAll();
    EmpDto findByEmpno(int empno);
    int insert(EmpDto dto);
    int deleteByEmpno(int empno);
    int update(EmpDto dto);
}
```

Connection/PreparedStatement/ResultSet은 **선언을 상위 스코프로 올려** `finally` 블록에서 닫는 패턴을 사용합니다. 공통 모듈의 `close()`가 null 체크 후 역순으로 닫아줍니다.

---

### **3. SQL → JDBC 전환 핵심 포인트**

쿼리를 자바로 옮기기 전, SQL 편집기에서 CRUD를 먼저 검증합니다. "쿼리가 맞는지"를 확인한 뒤 자바 문자열로 복사하는 순서가 중요합니다.

| 작업 | SQL 관점 핵심 | JDBC 전환 포인트 |
| :--- | :--- | :--- |
| 전체 조회 | SELECT 컬럼 목록 + JOIN + ORDER BY 확정 | `executeQuery()` → `while(rs.next())`로 DTO 누적 |
| 상세 조회 | WHERE로 단일 대상 지정 | `?` 바인딩 후 DTO 1개에 매핑 |
| INSERT | 입력 컬럼과 값(서브쿼리/함수) 확정 | `executeUpdate()` → 성공 행 수 `int` 반환 |
| DELETE | WHERE로 대상 키 지정 | 바인딩 타입과 인덱스 순서 일치 필수 |
| UPDATE | SET 절 + WHERE 절 확정 | `executeUpdate()`, 바인딩 순서 엄격히 지킴 |

**주의 사항 두 가지**

- SQL 콘솔의 **세미콜론(`;`)은 JDBC 문자열에서 제거**해야 합니다.
- `ResultSet#getXXX("컬럼명")`은 SQL에서 출력한 이름(별칭 포함)을 기준으로 동작합니다. 별칭과 DTO 매핑 코드가 어긋나면 "열 이름이 부적절합니다" 오류가 발생합니다.

PreparedStatement 바인딩은 `?` 인덱스가 **1부터 시작**하며, SQL에 등장하는 순서대로 `setString(1, ...)`, `setInt(2, ...)` 방식으로 채웁니다.

```java
// INSERT 예시 — EMPNO는 MAX(EMPNO)+1 서브쿼리로 자동 증가 처리
String sql = "INSERT INTO EMP (EMPNO, ENAME, JOB, DEPTNO) "
           + "VALUES ((SELECT MAX(EMPNO)+1 FROM EMP), ?, ?, ?)";
pstmt = conn.prepareStatement(sql);
pstmt.setString(1, dto.getEname());
pstmt.setString(2, dto.getJob());
pstmt.setInt(3, dto.getDeptno());
int cnt = pstmt.executeUpdate();
```

---

### **4. JUnit으로 Repository 검증**

`@Before`에서 인터페이스 타입으로 구현체를 생성해 다형성을 활용하고, `@Test`로 각 CRUD를 자동 검증합니다.

```java
EmpRepository repo;

@Before
public void setUp() {
    repo = new EmpRepositoryImpl();  // 인터페이스 타입으로 다형성 유지
}

@Test
public void testFindAll() {
    List<EmpDto> list = repo.findAll();
    assertNotEquals(0, list.size());
}

@Test
public void testFindByEmpno() {
    EmpDto dto = repo.findByEmpno(7369);
    assertNotNull(dto);
}

@Test
public void testInsert() {
    EmpDto dto = new EmpDto("홍길동", "ANALYST", 10);
    int cnt = repo.insert(dto);
    assertEquals(1, cnt);
}
```

---

### **5. Eclipse 웹 개발 환경 세팅**

웹 프로젝트는 WAS 연동이 전제입니다. 시작 전 세 가지를 맞춥니다.

- **인코딩 통일** — Preferences → Content Types에서 JSP, HTML, CSS, JS, SQL, JSON 등 모두 UTF-8 적용
- **XML 외부 리소스 다운로드** — DTD/XSD 정의가 없으면 빨간 줄이 발생하므로 다운로드 허용 설정
- **Tomcat 런타임 등록** — Preferences → Server Runtime Environments에서 Apache Tomcat 추가, "Create new local server" 체크

강의에서는 **Tomcat 10.1 계열**을 사용했습니다. 오래된 버전(8.5 등)은 DTD/스펙 불일치로 혼란이 생길 수 있습니다.

**web.xml DTD 버전 정합성**이 핵심입니다. 서버에 포함된 web.xml의 DTD 선언을 확인하고, 프로젝트 web.xml을 동일하게 맞춥니다. 어긋나면 빨간 줄 / 임포트 실패 / 서버 실행 오류로 이어집니다.

---

### **6. Maven 프로젝트 구조**

Maven은 빌드·패키징·의존성 관리를 자동화합니다. 웹 프로젝트는 `maven-archetype-webapp`으로 생성하며, 배포 산출물은 WAR입니다.

| 위치 | 역할 |
| :--- | :--- |
| `src/main/java` | 실제 배포 대상 자바 소스 |
| `src/main/resources` | XML, properties, yml 등 설정 파일 |
| `src/test/java` | JUnit 테스트 소스 (배포 제외) |
| `src/test/resources` | 테스트용 리소스 (배포 제외) |
| `target/` | 빌드 결과 (클래스, WAR 등) |
| `~/.m2/` | 의존성 로컬 캐시 저장소 |

의존성은 `.m2` 저장소에 물리적으로 내려받고, 프로젝트는 이를 **참조 링크** 형태로 사용합니다.

---

### **7. pom.xml 핵심 구성**

```xml
<groupId>com.company</groupId>       <!-- 조직 식별자 (도메인 역순) -->
<artifactId>myapp</artifactId>       <!-- 프로젝트명 -->
<version>1.0-SNAPSHOT</version>      <!-- SNAPSHOT = 개발 중 변동 가능 버전 -->
<packaging>war</packaging>           <!-- jar / war 선택 -->

<properties>
    <java.version>21</java.version>  <!-- 반복되는 버전을 변수처럼 재사용 -->
</properties>

<build>
    <plugins>
        <!-- Java 21 컴파일 -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <source>${java.version}</source>
                <target>${java.version}</target>
            </configuration>
        </plugin>
        <!-- WAR 패키징 -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-war-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

pom.xml 설정 변경 후에는 **Maven Update Project (Force Update 포함)** 로 Eclipse 빌드 패스와 컴파일러 버전을 반드시 동기화합니다.

---

### **최종 정리: 상황별 선택 기준**

| 상황 | 선택 |
| :--- | :--- |
| DB 접근 공통 로직 분리 | 공통 모듈(Database)에 1·2·6단계 위임 |
| CRUD 메서드 시그니처 설계 | SQL WHERE 조건 → 파라미터, 결과 건수 → 반환 타입 |
| SELECT vs DML 실행 | SELECT → `executeQuery()`, INSERT/UPDATE/DELETE → `executeUpdate()` |
| 다건 매핑 | `while(rs.next())` + `List<DTO>` 누적 |
| 단건 매핑 | `if(rs.next())` + DTO 1개 반환 |
| 빌드 도구 | Maven — 의존성·빌드·패키징 자동화, `.m2` 로컬 캐시 |
| 웹 배포 산출물 | WAR (`packaging=war` + `maven-war-plugin`) |
| 버전 일관성 | `properties` 태그로 버전 변수화 |
