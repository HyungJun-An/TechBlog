---
title: "Maven POM 심화, 로깅(Log4j2·SLF4J·Logback), MyBatis 입문"
date: 2026-03-21
authors: HyungJun
tags: [Java, JDBC, 데이터베이스, 기초이론]
---

`pom.xml` `scope` `exclusions` `Log4j2` `SLF4J` `Logback` `MyBatis` `SqlSessionFactory`

`System.out.println`으로 로그를 찍다가 운영 서버에서 터진다면? SQL이 자바 코드 안에 문자열로 박혀 있어 수정할 때마다 빌드를 해야 한다면? 이 글은 그 두 가지 문제를 해결하는 도구들 — 로깅 프레임워크와 MyBatis — 의 "왜 쓰는가"부터 "어떻게 구성하는가"까지를 실무 관점으로 정리합니다.

<!-- truncate -->

---

### **1. Maven POM 심화 — 저장소, 스코프, 전이 의존성 제거**

#### **repositories — "어디서 가져올지" 탐색 경로**

Maven은 의존성을 Maven Central → `repositories`에 등록된 순서대로 탐색합니다. 실무에서는 사내 Nexus/Artifactory(사설 저장소)를 추가해 내부 공용 라이브러리를 배포/조회합니다. 신규 입사 시 `.m2` 압축본을 받는 이유도 같습니다 — Central에서 수백 개를 최초 다운로드하면 수십 분이 걸리기 때문입니다.

#### **scope — "어느 구간에 포함시킬지"**

| scope | 컴파일 | 실행 | 패키징 포함 | 대표 사용처 |
| :--- | :---: | :---: | :---: | :--- |
| `compile` (기본) | O | O | O | 일반 라이브러리 전반 |
| `provided` | O | O | X | 서블릿 API — 서버에 이미 있음 |
| `runtime` | X | O | O | JDBC 드라이버 — 실행 시만 필요 |
| `test` | X | X | X | JUnit — 배포 산출물에서 제외 |
| `system` | O | O | 환경 의존 | 로컬 경로 JAR — 이식성 최저 |

- JDBC 드라이버를 `runtime`으로 선언하는 이유: 컴파일 단계에서는 `java.sql.*` 인터페이스만 쓰므로, 드라이버 구현체는 실행 시에만 있으면 충분합니다.
- 서블릿 API를 `provided`로 선언하는 이유: WAR로 배포하면 Tomcat이 이미 서블릿 API를 가지고 있어, 함께 패키징하면 클래스 충돌이 발생합니다.

#### **exclusions — 전이 의존성 충돌 제거**

라이브러리 A를 추가하면 A가 의존하는 B, C도 자동으로 따라옵니다(전이 의존성). 이미 프로젝트에 다른 버전의 B가 있다면 충돌이 발생합니다. 실무에서 가장 빈번한 충돌 영역이 **로깅 계열** — Log4j, SLF4J, Logback 버전 불일치 — 입니다.

```xml
<dependency>
    <groupId>some.library</groupId>
    <artifactId>some-lib</artifactId>
    <version>1.0</version>
    <exclusions>
        <exclusion>
            <!-- some-lib이 끌고 오는 log4j를 제거 → 프로젝트의 logback을 쓰게 함 -->
            <groupId>log4j</groupId>
            <artifactId>log4j</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

#### **build — 산출물 이름과 플러그인 구성**

```xml
<build>
    <finalName>myapp</finalName>  <!-- target/myapp.war 로 생성됨 -->
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <source>21</source>
                <target>21</target>
            </configuration>
        </plugin>
    </plugins>
</build>
```

`mvn clean` → `target/` 삭제. `mvn package` → 컴파일 + 테스트 + WAR 생성. `scope=test` 라이브러리는 WAR에 포함되지 않습니다.

---

### **2. System.out.println vs 로깅 프레임워크 — 왜 달라야 하는가**

많은 입문자가 `System.out.println`(syso)으로 로그를 찍습니다. 학습 단계에서는 무방하지만, 실무 코드에 들어가면 즉시 문제가 됩니다.

| 비교 항목 | `System.out.println` | 로깅 프레임워크 |
| :--- | :--- | :--- |
| **레벨 제어** | 없음 — 무조건 출력 | `ERROR/WARN/INFO/DEBUG/TRACE` 레벨로 제어 가능 |
| **운영 환경 비활성화** | 코드 수정 후 재배포 필요 | 설정 파일 레벨 변경만으로 즉시 반영 |
| **출력 포맷** | 없음 — 날짜·스레드·클래스 정보 없음 | 패턴으로 시간·스레드·클래스·레벨 등 표준화 |
| **파일 저장** | 직접 구현 필요 | Appender 설정만으로 파일·롤링·압축까지 처리 |
| **성능** | 항상 문자열 생성 | 레벨 미달 시 문자열 연산 자체를 건너뜀 |
| **관제 연계** | 불가 | ELK, Grafana 등 관제 도구와 포맷 기반 연계 가능 |

운영에서 syso가 남아있으면, 디버그용 데이터(개인정보, 쿼리 파라미터 등)가 레벨 구분 없이 항상 콘솔에 노출됩니다. 설정으로 끌 방법도 없습니다. 로깅 프레임워크는 **"무엇을, 어느 레벨에서, 어디에, 어떤 형식으로"**를 코드 수정 없이 설정으로 제어합니다.

```java
// ❌ syso — 항상 출력, 포맷 없음, 운영에서 끌 수 없음
System.out.println("사용자 ID: " + userId);

// ✅ 로거 — 레벨이 INFO 이상일 때만 출력, {} 바인딩으로 문자열 연산 지연
logger.debug("사용자 ID: {}", userId);
```

`logger.debug(...)`는 현재 레벨이 INFO 이상이면 `{}` 안의 `userId.toString()`조차 호출하지 않습니다. syso는 항상 문자열을 만들어야 하므로 불필요한 연산이 발생합니다.

---

### **3. Log4j2 vs SLF4J — 구현체와 추상화의 차이**

가장 많이 헷갈리는 개념입니다. 한 줄로 정리하면:

> **SLF4J는 인터페이스(추상화), Log4j2·Logback은 구현체(엔진)**

| 구분 | 성격 | 코드에서 import |
| :--- | :--- | :--- |
| **Log4j2** | 구현체 — 직접 사용 가능 | `org.apache.logging.log4j.Logger` |
| **SLF4J** | 추상화(파사드) — 구현체 교체 가능 | `org.slf4j.Logger` |
| **Logback** | 구현체 — SLF4J와 기본 결합 | (SLF4J API로 호출) |

```java
// Log4j2 직접 사용 — 구현체가 Log4j2로 고정됨
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
private static final Logger logger = LogManager.getLogger(MyClass.class);

// SLF4J 사용 — 구현체(Logback/Log4j2)를 pom.xml 의존성 교체만으로 바꿀 수 있음
import org.slf4j.LoggerFactory;
private static final Logger logger = LoggerFactory.getLogger(MyClass.class);
```

**실무에서 SLF4J를 사용하는 이유:** 코드는 SLF4J API로 작성하고, 배포 환경에 따라 구현체를 바꿀 수 있습니다. 예를 들어 Spring Boot는 기본으로 SLF4J + Logback을 제공하므로, SLF4J로 작성된 코드는 별도 수정 없이 Spring Boot 환경에서 그대로 동작합니다. Log4j2로 직접 작성했다면 구현체를 교체할 때 import를 모두 바꿔야 합니다.

#### **로그 레벨 제어 흐름**

```
TRACE < DEBUG < INFO < WARN < ERROR
```

설정 레벨이 `INFO`이면 `INFO·WARN·ERROR`만 출력되고, `TRACE·DEBUG`는 무시됩니다.

| 레벨 | 언제 사용 | 환경 |
| :--- | :--- | :--- |
| `ERROR` | 예외, 시스템 오류 | 운영 필수 |
| `WARN` | 잠재적 문제, 경고 | 운영 기본값으로 흔함 |
| `INFO` | 정상 흐름 주요 이벤트 | 개발+운영 공통 |
| `DEBUG` | 상세 디버깅 정보 | 개발 환경 |
| `TRACE` | 가장 세밀한 추적 | 제한적 사용 (로그 폭증 주의) |

---

### **4. Log4j2 설정 구조**

`src/main/resources/log4j2.xml`에 위치하며 자동 탐지됩니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="WARN">
    <Appenders>
        <!-- 콘솔 출력 -->
        <Console name="Console" target="SYSTEM_OUT">
            <PatternLayout pattern="%d{yyyy-MM-dd HH:mm:ss} [%t] %-5level %logger{36} - %msg%n"/>
        </Console>

        <!-- 날짜·용량 기반 롤링 파일 -->
        <RollingFile name="File" fileName="logs/app.log"
                     filePattern="logs/app-%d{yyyy-MM-dd}-%i.log.gz">
            <PatternLayout pattern="%d{yyyy-MM-dd HH:mm:ss} %-5level %logger - %msg%n"/>
            <Policies>
                <TimeBasedTriggeringPolicy interval="1"/>   <!-- 하루 1회 교체 -->
                <SizeBasedTriggeringPolicy size="50MB"/>    <!-- 50MB 초과 시 분리 -->
            </Policies>
        </RollingFile>
    </Appenders>

    <Loggers>
        <Root level="INFO">
            <AppenderRef ref="Console"/>
            <AppenderRef ref="File"/>
        </Root>
    </Loggers>
</Configuration>
```

- **PatternLayout 주요 토큰:** `%d` 날짜, `%t` 스레드명, `%-5level` 레벨(5자 패딩), `%logger` 클래스, `%msg` 메시지, `%n` 개행
- **RollingFile:** 단일 파일이 무한정 커지는 것을 방지 — 날짜 기준 or 용량 기준으로 새 파일 생성, `.gz`로 압축 보관

---

### **5. Logback 설정 구조와 내부 흐름**

Spring Boot의 기본 로거입니다. `src/main/resources/logback.xml`에 위치합니다.

```xml
<configuration>
    <property name="LOG_PATH" value="logs"/>
    <property name="LOG_FILE" value="app"/>

    <appender name="Console" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss} %-5level [%thread] %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <appender name="File" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_PATH}/${LOG_FILE}.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>${LOG_PATH}/${LOG_FILE}.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>  <!-- 30일치 보관 후 자동 삭제 -->
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} %-5level %logger - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="Console"/>
        <appender-ref ref="File"/>
    </root>
</configuration>
```

**Logback 내부 동작 흐름 (면접 포인트)**

| 단계 | 동작 | 확인 포인트 |
| :--- | :--- | :--- |
| 1 | JVM 시작, 로깅 구현체 로딩 | 클래스패스 바인딩 충돌 여부 |
| 2 | LoggerContext 생성 | 설정/환경에 접근하는 중심 객체 |
| 3 | `logback.xml` 탐색 및 파싱 | 리소스 루트 경로가 핵심 |
| 4 | Appender·Logger·Root 구성 | 패턴, 레벨, 롤링 정책 적용 |
| 5 | 애플리케이션에서 `logger.info(...)` 호출 | Root 레벨과 개별 Logger 레벨 교차 적용 |

---

### **6. MyBatis를 쓰는 이유 — JDBC의 어떤 문제를 해결하는가**

JDBC로 CRUD를 구현하면 반드시 마주치는 세 가지 문제가 있습니다.

**문제 1: SQL이 자바 코드 안에 문자열로 박혀 있다**

```java
// JDBC — SQL이 자바 코드에 고정됨
String sql = "SELECT EMPNO, ENAME FROM EMP WHERE DEPTNO = ?";
```

SQL을 수정하려면 자바 파일을 열고, 재컴파일하고, 재배포해야 합니다. SQL 담당자(DBA)와 자바 개발자가 협업하는 실무에서는 분리가 필요합니다.

**문제 2: ResultSet → DTO 매핑 코드가 반복된다**

```java
// 컬럼마다 직접 꺼내서 세터 호출 — 컬럼 10개면 10줄
dto.setEmpno(rs.getInt("EMPNO"));
dto.setEname(rs.getString("ENAME"));
// ...반복
```

**문제 3: 공통 코드(연결·해제)가 모든 메서드에 반복된다**

MyBatis는 이 세 가지를 모두 해결합니다.

| JDBC 문제 | MyBatis 해결 방식 |
| :--- | :--- |
| SQL이 자바 코드 안에 있음 | **Mapper XML**으로 SQL 분리 |
| ResultSet → DTO 수동 매핑 | `resultType` 선언만으로 **setter 자동 호출** |
| 연결/해제 반복 코드 | `SqlSession`이 **JDBC 6단계 중 1·2·6단계 대행** |

결론적으로 MyBatis는 "SQL은 직접 쓰고 싶은데, 반복 코드는 줄이고 싶다"는 실무 요구를 충족합니다. JPA(ORM)와 달리 SQL을 완전히 제어할 수 있어, 복잡한 쿼리나 성능 튜닝이 필요한 환경에서 강점을 가집니다.

---

### **7. MyBatis 구성 — Mapper XML + Configuration XML**

#### **Mapper XML**

```xml
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.mapper.DeptMapper">

    <!-- resultType: 컬럼명이 DTO 필드명과 일치하면 setter 자동 호출 -->
    <select id="selectAllDept" resultType="com.example.dto.DeptDto">
        SELECT DEPTNO, DNAME, LOC FROM DEPT ORDER BY DEPTNO
    </select>

    <select id="selectDeptByNo" parameterType="int" resultType="com.example.dto.DeptDto">
        SELECT DEPTNO, DNAME, LOC FROM DEPT WHERE DEPTNO = #{deptno}
    </select>

</mapper>
```

- `#{deptno}`: JDBC의 `?` 바인딩과 동일하지만 이름으로 참조 → SQL Injection 방지
- `resultType` FQCN으로 DTO 클래스 지정 → 컬럼명과 DTO 필드명 매핑 자동 수행

#### **Configuration XML**

```xml
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-config.dtd">

<configuration>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="oracle.jdbc.driver.OracleDriver"/>
                <property name="url" value="jdbc:oracle:thin:@localhost:1521:xe"/>
                <property name="username" value="hr"/>
                <property name="password" value="hr"/>
            </dataSource>
        </environment>
    </environments>

    <mappers>
        <mapper resource="com/example/mapper/DeptMapper.xml"/>
    </mappers>
</configuration>
```

#### **SqlSessionFactory 초기화 및 세션 생성**

```java
public class SqlSessionManager {
    private static SqlSessionFactory factory;

    static {
        try {
            Reader reader = Resources.getResourceAsReader(
                "com/example/mybatis/configuration.xml");
            factory = new SqlSessionFactoryBuilder().build(reader);
        } catch (IOException e) {
            throw new RuntimeException("MyBatis 초기화 실패", e);
        }
    }

    public static SqlSession openSession() {
        return factory.openSession();
    }
}
```

```java
// JUnit — 세션 생성 1차 검증
@Test
public void testSessionOpen() {
    SqlSession session = SqlSessionManager.openSession();
    assertNotNull(session);
    session.close();
}
```

프레임워크 에러는 "어느 XML을 파싱하다 실패했는지" 메시지가 비교적 명확히 나옵니다. `resource` 경로 오타가 가장 흔한 원인입니다.

---

### **최종 정리: 상황별 선택 기준**

| 상황 | 선택 |
| :--- | :--- |
| 운영 서버에서 디버그 로그를 끄고 싶을 때 | 로깅 프레임워크 레벨 설정 변경 (`syso`는 불가) |
| 구현체를 나중에 교체할 가능성이 있을 때 | SLF4J API로 코드 작성 |
| Spring Boot 프로젝트 | SLF4J + Logback (기본 제공) |
| 로그 파일이 무한정 커지는 것을 방지 | RollingFile Appender + 시간/용량 정책 |
| SQL 직접 제어가 필요하고 반복 코드는 줄이고 싶을 때 | MyBatis |
| SQL 자동 생성 + 객체 중심 개발 | JPA/Hibernate |
| 전이 의존성 로깅 충돌 발생 시 | `exclusions`로 충돌 라이브러리 제거 |
| 서블릿 API처럼 서버가 이미 가진 라이브러리 | `scope=provided` |
