---
title: "MyBatis 다이나믹 SQL + 1:N 조인 매핑"
date: 2026-03-25
authors: HyungJun
tags: [Java, JDBC, 데이터베이스]
---

`if` `foreach` `choose` `trim` `set` `collection` `resultMap` `OGNL`

`<if>` `<foreach>` `<choose>` `<trim>` `<set>` 으로 조건/반복/선택/오버라이딩을 구성하고, `collection` 매핑으로 1:N 조인 결과를 DTO 리스트 구조로 변환하는 전체 흐름을 정리합니다.

<!-- truncate -->

---

### **다이나믹 SQL 전제 조건**

Java 코드에서 `for`로 쿼리를 반복 호출하면 트랜잭션이 길어져 락 경합·데드락 위험이 커집니다. **SQL 자체가 한 번에 처리되도록** 구성하는 것이 권장됩니다.

- `Map` 파라미터: Map의 **key 이름**이 XML `#{}` 참조명과 정확히 일치해야 합니다.
- 문자열 `.trim()` 호출 전 **null 체크 필수** — null에 메서드 호출 시 NPE 발생
- 조회: `openSession()` / DML: `openSession(true)` 또는 명시적 `commit()`

---

### **1. `<sql>` + `<include>` — 공통 SQL 재사용**

```xml
<sql id="selectAll">
    SELECT job_id, job_title, min_salary, max_salary FROM jobs
</sql>

<select id="findAll" resultType="JobsDTO">
    <include refid="selectAll"/>
</select>
```

중복 컬럼/FROM 절을 한 곳에서 관리합니다. `refid` 오타는 런타임 fragment 탐색 실패로 이어지므로 먼저 점검합니다.

---

### **2. `<if>` + `<where>` — 조건 분기**

```xml
<select id="findByCondition" resultType="JobsDTO">
    <include refid="selectAll"/>
    <where>
        <if test="jobId != null and jobId.trim() != ''">
            AND job_id = #{jobId}
        </if>
        <if test="jobTitle != null and jobTitle.trim() != ''">
            AND job_title LIKE '%' || #{jobTitle} || '%'
        </if>
    </where>
</select>
```

`<where>` — 조건이 하나라도 생성될 때만 `WHERE`를 붙이고 앞쪽 `AND/OR`를 자동 제거합니다.

---

### **3. `<foreach>` — IN 절 / 반복 처리**

```xml
<select id="findByIds" resultType="JobsDTO">
    <include refid="selectAll"/>
    WHERE job_id IN
    <foreach collection="list" item="id" open="(" close=")" separator=",">
        #{id}
    </foreach>
</select>
```

| 파라미터 타입 | `collection` 값 | 설명 |
| :--- | :--- | :--- |
| `List` 단독 전달 | `"list"` | 예약어처럼 사용 |
| `Map` 안의 리스트 | `"IDS"` 등 Map 키 이름 | Map 키 이름을 그대로 사용 |

---

### **4. `<choose>` — switch-case**

```xml
<where>
    <choose>
        <when test="jobId != null">AND job_id = #{jobId}</when>
        <when test="jobTitle != null">AND job_title = #{jobTitle}</when>
        <otherwise>AND min_salary > 5000</otherwise>
    </choose>
</where>
```

상위 `<when>`이 참이면 하위 조건은 평가되지 않습니다. **둘 다 적용**이 필요하면 `<trim>` + `<if>` 조합을 써야 합니다.

---

### **5. `<trim>` — 접두/접미어 오버라이딩**

```xml
<trim prefix="WHERE" prefixOverrides="AND|OR">
    <if test="jobId != null">AND job_id = #{jobId}</if>
    <if test="jobTitle != null">AND job_title = #{jobTitle}</if>
</trim>
```

| 속성 | 의미 |
| :--- | :--- |
| `prefix="WHERE"` | 조건이 하나라도 있으면 앞에 `WHERE` 추가 |
| `prefixOverrides="AND\|OR"` | 생성된 조건 앞의 `AND/OR` 제거 |
| `suffixOverrides=","` | 생성된 조건 뒤의 `,` 제거 (UPDATE에 활용) |

실행 흐름: **IF 평가 → 조건 조각 생성 → trim 오버라이드 적용** 순서입니다.

---

### **6. `<set>` — UPDATE 콤마 처리**

```xml
<update id="updateJob">
    UPDATE jobs
    <set>
        <if test="jobTitle != null">job_title = #{jobTitle},</if>
        <if test="minSalary != 0">min_salary = #{minSalary},</if>
    </set>
    WHERE job_id = #{jobId}
</update>
```

`<set>`은 내부적으로 `<trim prefix="SET" suffixOverrides=",">` 와 동일합니다. 마지막 콤마를 자동 제거합니다.

---

### **다이나믹 SQL 선택 기준**

| 상황 | 태그 |
| :--- | :--- |
| 단일 조건 분기 | `<if>` + `<where>` |
| 여러 조건 중 하나만 선택 | `<choose>` / `<when>` |
| 조건 조합 (둘 다 적용) | `<trim>` + `<if>` |
| IN 절 / 반복 처리 | `<foreach>` |
| UPDATE 콤마 처리 | `<set>` |
| 공통 SQL 재사용 | `<sql>` + `<include>` |

---

### **7. 1:N 조인 매핑 — `collection`**

조인 결과를 단일 DTO에 모두 담으면 같은 팀이 선수 수만큼 반복 생성됩니다. `collection`으로 부모(팀) 기준으로 묶어야 합니다.

| 구분 | 관계 | 목적 |
| :--- | :--- | :--- |
| `association` | 1:1 | 하위 객체 1개 매핑 |
| `collection` | 1:N | 하위 목록을 리스트로 묶음 |

#### **DTO 구조**

```java
public class TeamDTO {
    private String teamId;
    private String teamName;
    private List<PlayerDTO> playerDTOS; // 1:N 리스트
}
```

#### **매퍼 XML**

```xml
<resultMap id="playerMap" type="PlayerDTO">
    <result column="player_id"   property="playerId"/>
    <result column="player_name" property="playerName"/>
</resultMap>

<resultMap id="teamMap" type="TeamDTO">
    <result column="team_id"   property="teamId"/>
    <result column="team_name" property="teamName"/>
    <collection property="playerDTOS" resultMap="playerMap"/>
</resultMap>

<select id="findAllTeams" resultMap="teamMap">
    SELECT t.team_id, t.team_name, p.player_id, p.player_name
    FROM team t JOIN player p ON t.team_id = p.team_id
</select>
```

#### **OGNL — 점 표기법 객체 탐색**

```java
List<TeamDTO> teams = repo.findAllTeams();
System.out.println(teams.size());                          // 팀 개수 (예: 15)
System.out.println(teams.get(0).getPlayerDTOS().size());   // 0번 팀 선수 수
System.out.println(teams.get(0).getPlayerDTOS().get(0));   // 첫 선수 DTO
```

OGNL(Object Graph Navigation Language) — `teamDTO.playerDTOS.get(0).playerName` 처럼 점 표기법으로 객체 그래프를 탐색합니다.

#### **자주 발생하는 실수**

| 증상 | 원인 |
| :--- | :--- |
| 매핑 실패, 빈 객체 | `resultMap` 타입 잘못 지정 |
| 빈 리스트 반환 | `property`명과 DTO 필드명 불일치 |
| 매퍼 not found 예외 | 새 매퍼 XML을 config에 미등록 |
