---
title: "Mac에서 Oracle DB 환경 구축하기"
date: 2026-03-15
authors: HyungJun
tags: [인프라, Docker, DB, JDBC]
---

`Oracle`, `Docker`, `Colima`, `Mac`

Mac에서 Oracle DB를 로컬에 올리는 가장 현실적인 방법은 **Colima + Docker** 조합입니다. Oracle XE 이미지가 `x86_64` 아키텍처 기반이기 때문에, ARM 칩(M1/M2/M3) Mac에서는 에뮬레이션 레이어가 필요합니다. 이 글은 Brew 설치부터 SQL 조회까지 전 과정을 정리합니다.

<!-- truncate -->

### **1. 왜 Colima인가?**

- **Colima** — Docker Desktop의 무료 대안. Lima(Linux VM) 위에서 Docker 데몬을 실행하며, `--arch x86_64` 옵션으로 ARM Mac에서 x86 컨테이너를 에뮬레이션할 수 있습니다.
- Docker Desktop은 라이선스 정책 변경 이후 기업 환경에서 유료화됨 → Colima가 사실상 표준 대안

---

### **2. 환경 구축 순서**

#### **① Homebrew 설치**

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### **② Docker + Colima 설치**

```bash
brew install docker colima
```

#### **③ Colima 실행 (x86_64 에뮬레이션)**

```bash
colima start --memory 4 --arch x86_64
```

- `--memory 4` — Oracle XE는 최소 2GB 이상 권장, 4GB로 여유 확보
- `--arch x86_64` — ARM Mac에서 Oracle 이미지 실행을 위한 핵심 옵션

#### **④ Oracle XE 이미지 가져오기 및 컨테이너 실행**

```bash
# 이미지 다운로드
docker pull gvenzl/oracle-xe

# 컨테이너 실행 (비밀번호: manager)
docker run -d --name oracle11g -p 1521:1521 -e ORACLE_PASSWORD=manager gvenzl/oracle-xe
```

- `-d` — 백그라운드 실행
- `-p 1521:1521` — Oracle 기본 포트 포워딩 (호스트 → 컨테이너)
- `ORACLE_PASSWORD` — `system` 계정 비밀번호 설정

---

### **3. 컨테이너 접속 및 SQL 실행**

```bash
# 실행 중인 컨테이너 ID 확인
docker ps

# 컨테이너 bash 진입
docker exec -it <CONTAINER_ID> bash

# SQLPlus 접속
bash$ sqlplus
Enter user-name: system
Enter password: manager
```

#### **접속 확인 쿼리**

```sql
SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD HH24:MI:SS') AS 현재시간 FROM DUAL;
```

---

### **4. 핵심 요약**

| 단계 | 명령어 | 포인트 |
| :--- | :--- | :--- |
| VM 시작 | `colima start --arch x86_64` | ARM Mac의 x86 에뮬레이션 핵심 |
| 컨테이너 실행 | `docker run -p 1521:1521` | 포트 포워딩 필수 |
| DB 접속 | `sqlplus` → `system/manager` | 기본 관리자 계정 |

Mac 로컬에서 Oracle을 띄울 때 가장 많이 막히는 지점은 **아키텍처 불일치**입니다. `colima start --arch x86_64` 한 줄이 그 문제를 해결합니다. 컨테이너가 재시작 루프에 빠진다면 `docker logs <CONTAINER_ID>`로 Oracle 초기화 로그를 먼저 확인하세요.
