---
title: "[JDBC] PreparedStatement 보단 CallableStatement를 선호하는 이유"
date: 2025-04-08
authors: HyungJun
tags: [JDBC, Java, 데이터베이스]
---

JDBC 환경에서 단순 쿼리 실행보다 저장 프로시저(Stored Procedure) 호출에 최적화된 CallableStatement의 장점과 보안/성능 측면의 차이점을 비교합니다.

<!-- truncate -->

## 데이터베이스 연결 설정

먼저 DB 연결 정보를 `db.properties` 파일로 관리합니다. 하드코딩을 피하고 환경에 따라 쉽게 변경할 수 있습니다.

```properties
driver=com.mysql.cj.jdbc.Driver
url=jdbc:mysql://localhost:3306/my_emp
user=mydb
password=admin1234
```

## JDBC 템플릿 클래스

연결 관리와 정리(Close) 처리를 공통화한 `JDBCTemplate` 유틸리티 클래스입니다.

```java
public class JDBCTemplate {
    private static Connection conn = null;

    public static Connection getConnection() {
        if (conn == null) {
            try {
                Properties prop = new Properties();
                prop.load(new FileReader("db.properties"));

                String driver = prop.getProperty("driver");
                String url    = prop.getProperty("url");
                String user   = prop.getProperty("user");
                String pw     = prop.getProperty("password");

                Class.forName(driver);
                conn = DriverManager.getConnection(url, user, pw);
                conn.setAutoCommit(false); // 트랜잭션 수동 제어
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return conn;
    }

    public static void close(Statement stmt) {
        try { if (stmt != null) stmt.close(); } catch (SQLException e) { e.printStackTrace(); }
    }

    public static void close(ResultSet rs) {
        try { if (rs != null) rs.close(); } catch (SQLException e) { e.printStackTrace(); }
    }
}
```

## MySQL 저장 프로시저 예시

데이터베이스 내부에서 보너스 지급 로직을 처리하는 프로시저입니다.

```sql
DELIMITER $$
CREATE PROCEDURE PRO09_SALARY_BONUS(IN emp_id INT, OUT new_salary DECIMAL(10,2))
BEGIN
    UPDATE employees SET salary = salary + 1000 WHERE employee_id = emp_id;
    SELECT salary INTO new_salary FROM employees WHERE employee_id = emp_id;
END $$
DELIMITER ;
```

## CallableStatement 구현

```java
public void updateSalaryBonus(int empId) {
    Connection conn = JDBCTemplate.getConnection();
    CallableStatement cstmt = null;

    try {
        // 프로시저 호출 구문: { call 프로시저명(?, ?) }
        cstmt = conn.prepareCall("{ call PRO09_SALARY_BONUS(?, ?) }");

        cstmt.setInt(1, empId);                              // IN 파라미터
        cstmt.registerOutParameter(2, Types.DECIMAL);        // OUT 파라미터 등록

        cstmt.execute();

        double newSalary = cstmt.getDouble(2);
        System.out.println("변경된 급여: " + newSalary);

        conn.commit();
    } catch (SQLException e) {
        try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
        e.printStackTrace();
    } finally {
        JDBCTemplate.close(cstmt);
    }
}
```

## CallableStatement vs PreparedStatement 비교

| 항목 | CallableStatement | PreparedStatement |
|------|-------------------|-------------------|
| **용도** | 저장 프로시저/함수 호출 | 직접 SQL 실행 |
| **성능** | 우수 (DB 미리 컴파일) | 매번 파싱 필요 |
| **복잡한 로직** | DB 내부에서 처리 | 애플리케이션에서 처리 |
| **유지보수** | DB 레벨에서 관리 | 코드 레벨에서 관리 |
| **보안** | 테이블 직접 접근 불가 | SQL Injection 위험성 낮음 |
| **이식성** | DB 의존적 | DB 독립적 |

## 왜 CallableStatement인가?

### 1. 성능 향상
저장 프로시저는 데이터베이스에 **미리 컴파일**되어 실행 계획이 최적화되어 있습니다. PreparedStatement는 매 호출마다 파싱 과정이 필요하지만, CallableStatement는 이미 컴파일된 프로시저를 호출하므로 오버헤드가 줄어듭니다.

### 2. 네트워크 트래픽 감소
복잡한 비즈니스 로직을 애플리케이션에서 처리하면 DB와 여러 번 통신해야 합니다. 저장 프로시저를 사용하면 DB 내부에서 모든 처리 후 결과값만 반환하므로 **네트워크 I/O가 크게 감소**합니다.

### 3. 유지보수 용이성
비즈니스 로직의 일부를 DB 레벨에서 관리하면, 로직 변경 시 애플리케이션을 재배포하지 않아도 됩니다. 특히 여러 언어/플랫폼에서 동일 프로시저를 재사용할 때 효과적입니다.

### 4. 보안성
테이블에 대한 직접 접근 권한을 제한하고, 오직 프로시저를 통해서만 데이터를 조작하도록 강제할 수 있습니다. 이를 통해 **SQL Injection 공격 표면을 줄이고** 접근 제어를 더 세밀하게 관리할 수 있습니다.

## 언제 무엇을 써야 하나?

- **CallableStatement**: 복잡한 비즈니스 로직, 여러 테이블에 걸친 트랜잭션, 배치 처리, 반복 사용되는 로직
- **PreparedStatement**: 단순 CRUD 작업, DB 독립적인 코드가 필요한 경우, 동적 쿼리
