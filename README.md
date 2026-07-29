# 취준생을 위한 AI기반 취업 매니지먼트 에이전트, PICKD 🍋

- **해커톤 레포지토리**: [https://github.com/PNU-2026-AI-Hackathon/pnuai-a-05-PICKD](https://github.com/PNU-2026-AI-Hackathon/pnuai-a-05-PICKD)
- **서비스 도메인**: [https://pickd.ai.kr](https://pickd.ai.kr)

---

## 1. 프로젝트 소개

### 1.1. 개발배경 및 필요성
- **청년 첫 취업의 장기화와 반복 지원 구조**: 졸업 후 첫 일자리까지 평균 11.3개월이 소요되며, 지속적인 취업난으로 인해 구직자들은 수많은 전형을 반복해서 겪게 됩니다.
- **분산·파편화된 취업 준비 경험**: 채용 플랫폼(공고), 캘린더(일정), 노션/워드(자소서), 개인폴더(증빙자료) 등 4~5개 도구를 오가며 관리해 중복 작업과 마감 누락이 빈번하게 발생합니다.
- **생성형 AI 자소서의 획일화 리스크**: 취업 준비에 생성형 AI 사용이 보편화되었으나, 개인의 실제 경험과 역량이 누락된 일반론적 문장 생성으로 인해 기업의 AI 적발에 따른 감점 및 불합격 위험이 높습니다.

### 1.2. 개발 목표 및 주요 내용
**PICKD(픽디)**는 분산된 취업 준비 과정을 하나의 대시보드로 통합하고, 개인의 경험을 자산화하여 AI 기반 자기소개서 작성을 지원하는 **취업 매니지먼트 에이전트 플랫폼**입니다.
- **올인원 취업 대시보드**: 공고 탐색부터 지원 상태, 마감일(D-day), 캘린더 연동까지 하나의 화면에서 실행·추적합니다.
- **자산화된 경험 DB**: 흩어진 경험과 스펙, 증빙 자료를 AI로 구조화하여 언제든 검색하고 재사용할 수 있도록 축적합니다.
- **AI 자기소개서 작성**: 단순 생성이 아닌, 사용자 경험 DB와 기업의 직무기술서(JD)를 매칭하여 맞춤형 자소서 초안을 제시합니다.

### 1.3. 세부내용
- **AI 기반 비정형 공고 파싱**: 공고 이미지나 URL만 입력해도 LLM이 전형 단계와 문항을 자동 구조화합니다.
- **경험 정교화 (STAR 기법)**: 입력된 단편적인 경험을 AI가 상황-역할-행동-성과 구조로 정제하고, 누락된 맥락을 보완 질문으로 채웁니다.
- **SWOT 시맨틱 매칭**: 문항 의도와 경험을 의미 기반으로 스코어링하여 가장 적합한 경험을 연결해 줍니다.

### 1.4. 기존 서비스 대비 차별성
- **통합 취업 매니지먼트**: 단순 공고 탐색에 그치는 기존 플랫폼과 달리, 공고 등록 이후의 일정·서류·직무까지 대시보드에서 한 번에 통합 관리합니다.
- **개인 경험 자산화**: 자유도 높은 범용 문서 도구(노션/엑셀)의 한계를 넘어, AI가 역량 태그를 자동 분류하여 취업에 바로 쓸 수 있는 경험 DB를 구축합니다.
- **진정성 있는 맞춤형 AI 자소서**: 범용 AI의 획일적 생성과 달리 실제 경험을 바탕으로 제안하며, 최종 반영 여부는 사용자가 직접 결정(비파괴 원칙)하여 자소서의 독창성을 확보합니다.

### 1.5. 사회적가치 도입 계획
- **취업 준비 격차 완화**: 유료 컨설팅이나 첨삭 서비스 접근이 어려운 지방 거점 국립대 학생 등에게 AI 기반 자소서 지원 도구를 제공하여 정보·자원 격차를 해소합니다.
- **취업 준비 데이터 공익 활용**: 누적된 채용 공고·전형 데이터를 익명화하여 취업 트렌드 및 직무별 요구 역량 분석 리포트로 가공해 학교 취업지원센터 및 공공기관에 제공합니다.

---

## 2. 상세설계

### 2.1. 시스템 구성도
> 시스템 전체 구성도 이미지를 이 곳에 첨부해 주세요.
*(예: `![시스템 구성도](./docs/assets/architecture.png)`)*

### 2.2. 사용 기술 (Tech Stack)

| 분류 | 기술 명칭 | 버전 / 비고 |
|:---:|:---|:---|
| **Frontend** | React.js / Vite | `19.2.4` / `8.0.1` |
| | Tailwind CSS / TypeScript | `3.4.19` / `5.9.3` |
| **Backend** | Java / Spring Boot | `21` / `3.5.12` |
| | Database | MySQL, PostgreSQL, H2, Redis |
| **AI** | Python / FastAPI | 3.x 기반 |
| | LangChain / LangGraph | - |
| | OpenAI / Google GenAI API | - |
| **Infra & DevOps** | GitHub Actions / Vercel | 프론트엔드 자동 배포 |
| | AWS S3 / EC2 (Docker) | 백엔드 인프라 및 파일 스토리지 |

---

## 3. 개발결과

### 3.1. 전체시스템 흐름도
> 유저 플로우 또는 데이터 흐름도 이미지를 이 곳에 첨부해 주세요.
*(예: `![시스템 흐름도](./docs/assets/flowchart.png)`)*

### 3.2. 기능설명
PICKD의 3대 핵심 기능 명세와 화면별 설명은 아래 상세 문서에서 확인할 수 있습니다.
- [👉 탭 1: 지원 대시보드 (공고 탐색 및 자동 등록, 마감일 관리)](./docs/tab1_dashboard.md)
- [👉 탭 2: 경험 관리 (경험·스펙 통합 관리 및 AI 역량 태그 추출)](./docs/tab2_experience.md)
- [👉 탭 3: AI 자기소개서 작성 (SWOT 시맨틱 매칭 및 글자수 조절)](./docs/tab3_coverletter.md)

### 3.3. 기능명세서 (API 명세서)
> 백엔드 서버의 통합 API 명세는 아래 Swagger 주소에서 확인할 수 있습니다.
- **Swagger API 명세서**: [https://api.pickd.ai.kr/swagger-ui/index.html](https://api.pickd.ai.kr/swagger-ui/index.html) *(예시 링크 - 실제 주소로 변경해 주세요)*

### 3.4. 디렉토리 구조
```text
.
├── AI
│   ├── AGENTS.md
│   ├── meeting.md
│   └── myeongsung
│       ├── AGENTS.md
│       ├── app
│       ├── app_streamlit.py
│       ├── Dockerfile
│       ├── docs
│       ├── requirements.txt
│       ├── scripts
│       ├── test_api.sh
│       ├── test_step1.py
│       └── tests
├── BE
│   ├── build.gradle
│   ├── Dockerfile
│   ├── docs
│   │   └── archived-entities
│   ├── gradle
│   │   └── wrapper
│   ├── gradlew
│   ├── gradlew.bat
│   ├── scripts
│   │   ├── e2e_test.py
│   │   ├── FRONTEND_GUIDE.md
│   │   ├── seed_h2.sql
│   │   └── TEST_SCENARIOS.md
│   ├── settings.gradle
│   └── src
│       ├── main
│       └── test
├── docker-compose.yml
├── docs
│   ├── tab1_dashboard.md
│   ├── tab2_experience.md
│   └── tab3_coverletter.md
├── FE
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── public
│   │   ├── favicon.svg
│   │   ├── icons.svg
│   │   ├── landingpage
│   │   └── pickd-logo.svg
│   ├── README.md
│   ├── src
│   │   ├── api
│   │   ├── App.tsx
│   │   ├── assets
│   │   ├── components
│   │   ├── constants
│   │   ├── context
│   │   ├── hooks
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── navigations
│   │   ├── screens
│   │   ├── types
│   │   └── utils
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vercel.json
│   └── vite.config.ts
├── PICKD_개발계획서.pdf
├── README.md
├── SAMPLE_README1.md
└── SERVER_SETUP.md
```

### 3.5. AI 도구 활용
프로젝트 개발 과정 전반에 걸쳐 **Antigravity (AGY)** 기반의 에이전트 오케스트레이션을 적극 도입했습니다.
- 단순한 코드 자동완성을 넘어, AI 에이전트가 코드를 스스로 계획, 실행, 검증하는 자율적 개발 환경을 구축했습니다.
- **아티팩트 기반 설계**: 에이전트가 작성한 구현 계획(Implementation Plan)을 개발팀이 사전에 검토하여, 실제 구현 전 단계에서 설계 오류를 방지했습니다.
- **Browser Subagent 활용**: 에이전트가 직접 브라우저를 제어하여 버튼 클릭 및 반응형 UI 레이아웃을 검증함으로써 테스트 소요 시간을 크게 절감했습니다.

---

## 4. 설치 및 사용 방법
> 향후 로컬 실행 방법(예: `npm run dev`, `./gradlew bootRun`, `uvicorn main:app` 등)을 기입할 예정입니다.

---

## 5. 소개 및 시연 영상
> 프로젝트 시연 영상(유튜브 등) 링크 또는 GIF를 이곳에 첨부하세요.

---

## 6. 팀 소개
| Backend | Backend | Frontend | Frontend |
|:---:|:---:|:---:|:---:|
| <a href="https://github.com/tomchccom"><img src="https://github.com/tomchccom.png" width="100px" alt="김명성" /></a> | <a href="https://github.com/mongdmin"><img src="https://github.com/mongdmin.png" width="100px" alt="현승민" /></a> | <a href="https://github.com/gayeoniya"><img src="https://github.com/gayeoniya.png" width="100px" alt="김가연" /></a> | <a href="https://github.com/Nayeeun5"><img src="https://github.com/Nayeeun5.png" width="100px" alt="나예은" /></a> |
| **김명성** | **현승민** | **김가연** | **나예은** |
| `dreamkms2014`<br>`@pusan.ac.kr` | `tmdals0429`<br>`@pusan.ac.kr` | `cindy20269405`<br>`@gmail.com` | `dmsdpsk05`<br>`@gmail.com` |
| [@tomchccom](https://github.com/tomchccom) | [@mongdmin](https://github.com/mongdmin) | [@gayeoniya](https://github.com/gayeoniya) | [@Nayeeun5](https://github.com/Nayeeun5) |
| 세부 역할 작성 | 세부 역할 작성 | 세부 역할 작성 | 세부 역할 작성 |

