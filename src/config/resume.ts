/**
 * Content for the /resume page. Everything the page renders comes from here, so
 * editing a career history never means touching markup.
 *
 * Any section whose array is empty is skipped entirely, so delete what you do
 * not need rather than leaving blank entries behind. Optional single values are
 * hidden by an empty string — never comment the key out, or it drops off the
 * type and the page stops compiling.
 */

export interface ResumeLink {
  label: string;
  href: string;
  /** Shown instead of the raw href. Defaults to the label. */
  text?: string;
}

/**
 * A bullet. `children` renders as an indented sub-list, which is how project
 * entries carry their supporting detail. `href` turns the text into a link, and
 * `badge` points at a shields.io-style image (stars, downloads).
 */
export interface ResumePoint {
  text: string;
  href?: string;
  badge?: string;
  children?: ResumePoint[];
}

export interface ResumeRole {
  /** e.g. "2024. 02 ~ 2025. 04", or "2025. 04 ~" while current. */
  period: string;
  title: string;
  points: ResumePoint[];
  skills?: string[];
}

export interface ResumeCompany {
  name: string;
  period: string;
  /** e.g. "3년 1개월". Rendered as a badge beside the name. */
  duration?: string;
  current?: boolean;
  roles: ResumeRole[];
}

export interface ResumeProject {
  period: string;
  title: string;
  /** One line on what the project was, shown under the title. */
  summary?: string;
  /** Live URL, rendered as a link on the title. */
  link?: string;
  /** Rendered as pills under the entry. */
  techStack?: string[];
  points: ResumePoint[];
}

export interface ResumeEntry {
  period: string;
  title: string;
  subtitle?: string;
}

export interface ResumeOpenSource {
  name: string;
  points: ResumePoint[];
}

/** A card under the introduction. */
export interface ResumeHighlight {
  title: string;
  description: string;
  tags: string[];
}

export const resume = {
  name: "이현석",
  /** Shown in parentheses after the name. Leave blank to hide. */
  alias: "",
  tagline: "Full Stack Developer",
  /** Optional. Drop a file in public/ and point at it, e.g. "/profile.jpg". */
  photo: "",
  /** Callout under the contact links. Leave blank to hide — commenting the key
      out instead removes it from the type and breaks the page. */
  notice: "",
  /** ISO date. Renders as "Latest Updated <date> (D+n)". Blank hides the line. */
  updated: "",
  /** Cursive sign-off at the end of the intro block. Blank hides it. */
  signature: "",

  links: [
    // { label: "Email", href: "mailto:vedivero73@gmail.com", text: "vedivero73@gmail.com" },
    // { label: "GitHub", href: "https://github.com/vedivero", text: "@vedivero" },
    // { label: "Blog", href: "https://vedivero.github.io", text: "vedivero.github.io" },
  ] as ResumeLink[],

  /**
   * Headline numbers. Entries with an empty `value` are dropped, and the whole
   * band disappears when none are left — which is the current state. Fill a
   * `value` in to bring it back; three reads best, more than four crowds.
   */
  stats: [
    { value: "", label: "Years of experience" },
    { value: "", label: "Tech posts" },
    { value: "", label: "GitHub stars" },
  ],

  /** Free-form paragraphs. */
  introduce: [
    "4년 2개월의 웹 개발 경력을 바탕으로, TypeScript, Java, NestJS, Next.js, Spring Boot 등 다양한 백엔드 및 프론트엔드 프레임워크에서 실무 경험을 쌓았습니다.",
    "REST API와 TypeORM, PostgreSQL, MySQL, MongoDB 등 여러 DBMS 환경에서 데이터 모델링과 최적화 작업을 수행해왔습니다.",
    "더 깊은 경험을 가진 분들에게 배우며 시야를 넓히고 싶습니다. 아직 모르는 것이 많다는 사실이 이 일을 계속하게 만드는 이유이기도 합니다.",
  ],

  /** Highlight cards under the introduction. */
  highlights: [
    // {
    //   title: "풀스택 개발",
    //   description:
    //     "Java·Spring Boot와 TypeScript·NestJS를 오가며 API를 설계하고, React 기반 화면까지 함께 담당",
    //   tags: ["Spring Boot", "NestJS", "React"],
    // },
    // {
    //   title: "공간정보(GIS) 개발",
    //   description:
    //     "QGIS·GeoServer·OpenLayers·Cesium을 활용한 지도 구축과 PostGIS 기반 공간 분석, WMTS 전환을 통한 성능 개선",
    //   tags: ["PostGIS", "GeoServer", "OpenLayers", "Cesium"],
    // },
    // {
    //   title: "LLM · 벡터 검색",
    //   description:
    //     "임베딩 모델을 사내 GPU 서버에 서빙하고, 부품 데이터를 색인해 자연어로 검색하는 파이프라인을 설계·구현",
    //   tags: ["Milvus", "BGE-M3", "FastAPI"],
    // },
  ] as ResumeHighlight[],

  /** Total across every company, e.g. "총 5년 3개월". Blank hides it. */
  experienceTotal: "",

  /**
   * Entries past this index collapse behind a "더보기" button. 0 disables the
   * button and shows everything.
   */
  experienceVisible: 0,
  etcVisible: 0,

  companies: [
    {
      name: "주식회사 에이에스티홀딩스",
      period: "2025. 04 ~",
      current: true,
      roles: [
        {
          period: "",
          title: "개발팀 선임연구원 / 웹 개발",
          points: [
            { text: "사우디아라비아, Cesium기반 3D 디지털 트윈 플랫폼 개발" },
            { text: "LG전자, AI기반 3D 매뉴얼 프로젝트 개발" },
          ],
        },
      ],
    },
    {
      name: "주식회사 시선아이티",
      period: "2021. 08 ~ 2024. 05",
      duration: "2년 9개월",
      roles: [
        {
          period: "",
          title: "개발팀 대리 / 웹 개발",
          points: [
            { text: "공공 공간정보 플랫폼의 백엔드 API 설계·구현 및 지도 서비스 성능 개선" },
            { text: "재난·소방 시스템의 위치 기반 자원 조회와 시스템 간 데이터 연계 개발" },
            { text: "레거시 결제 모듈(PG) 전환 및 결제 데이터 구조 정비" },
          ],
        },
      ],
    },
  ] as ResumeCompany[],

  projects: [
    {
      period: "",
      title: "LG전자 3D 매뉴얼 시스템",
      summary: "AI기반 3D모델 제어 시스템 설계 및 풀스택 개발",
      techStack: [
        "Python",
        "FastAPI",
        "TypeScript",
        "NestJS",
        "MySQL",
        "Milvus",
        "React",
        "Next.js",
        "Three.js",
        "Docker",
        "Kubernetes",
        "Jenkins",
        "Azure",
      ],
      points: [
        {
          text: "Milvus 벡터 검색 기반 의미 검색 구현으로 문자열 매칭의 한계 보완",
          children: [
            { text: "한·영 혼재 질의에 대응하기 위해 다국어 임베딩 모델(BGE-M3) 적용" },
            { text: "멀티턴 대화 상태를 DB에 저장하여 문맥 유지" },
          ],
        },
        {
          text: "로컬 Ollama와 OpenAI 호환 엔드포인트를 이중화하고 설정 기반으로 전환 가능하도록 구성",
        },
        { text: "3D 에디터 개발 (애니메이션 실행, 타임라인, 채팅 UI)" },
      ],
    },
    {
      period: "",
      title: "사우디아라비아 디지털 트윈 플랫폼",
      summary: "Cesium기반 디지털 트윈 및 공간 분석 API 개발",
      techStack: [
        "Spring Boot",
        "Spring Security",
        "PostgreSQL",
        "JavaScript",
        "Cesium",
        "Docker",
        "Kubernetes",
        "Jenkins",
        "OCI",
      ],
      points: [
        { text: "지역(Medinah, Mekkah, Jeddah)별 권한 제어 구현" },
        {
          text: "보안 요건 대응을 위해 Interceptor 기반 감사 로그 구현 (사용자·요청·결과 DB 적재)",
        },
        { text: "3D Feature Interaction 구현" },
        { text: "레이어 호출 속도 개선(WMS(15s) → WMTS(10ms))" },
      ],
    },
    {
      period: "",
      title: "울산 신불산 야영장 결제 모듈 교체",
      summary: "레거시 PG 전환(XPay → Toss Payments)",
      link: "https://camping.ulju.ulsan.kr/",
      techStack: ["Spring", "전자정부 표준프레임워크", "MyBatis", "MySQL", "JEUS", "SVN"],
      points: [
        {
          text: "기존 XPay 결제 시스템을 Toss Payments로 교체",
          children: [{ text: "Toss Payments API 연동" }],
        },
      ],
    },
    {
      period: "",
      title: "경상남도 스마트 공간정보 시스템 — 공유재산 관리",
      summary: "경상남도 공유재산 데이터 GIS 관리 시스템",
      link: "https://gis.gyeongnam.go.kr/um/publicProperty.do",
      techStack: [
        "Spring",
        "전자정부 표준프레임워크",
        "MyBatis",
        "PostgreSQL",
        "PostGIS",
        "GeoServer",
        "QGIS",
        "OpenLayers",
        "SVN",
      ],
      points: [
        {
          text: "지도 레이어 호출 방식을 WMS에서 WMTS로 전환하고 타일 캐시를 적용해 응답 속도 대폭 단축",
        },
        {
          text: "공유재산·국유재산·군유재산 데이터 조회 및 지도 시각화 기능 개발",
        },
      ],
    },
    {
      period: "",
      title: "경상남도 스마트 공간정보 시스템 — 도시재생 플랫폼",
      summary: "도시재생 데이터 API 구축 및 외부 데이터 연동",
      link: "https://gis.gyeongnam.go.kr/gnur/main.do",
      techStack: [
        "Spring",
        "전자정부 표준프레임워크",
        "MyBatis",
        "PostgreSQL",
        "GeoServer",
        "OpenLayers",
        "SVN",
      ],
      points: [
        { text: "도시재생 공간 데이터 조회·시각화 및 지도 조작 기능 개발" },
        { text: "NAVER Blog API 기반 외부 데이터 수집 및 분석 처리" },
        { text: "이미지 업로드·저장 기능 구현" },
        { text: "OpenLayers 클러스터링 및 피처 클릭 이벤트 처리" },
      ],
    },
    {
      period: "",
      title: "실시간 재난 응급상황 공유서비스 기반 스마트 119 구축",
      summary: "위치 기반 신고자 조회 및 실시간 알림 발송 개발",
      techStack: [
        "Spring",
        "전자정부 표준프레임워크",
        "iBatis",
        "Oracle",
        "OpenLayers",
        "CentOS",
        "SVN",
      ],
      points: [
        { text: "재난 발생 위치 인근의 인적·물적 데이터 조회 기능 개발" },
        { text: "신고자 GPS 좌표를 지도에 실시간 표시하고 소방대원 모바일로 알림 발송" },
        { text: "누리고 API를 연동해 의용소방대원 대상 재난 정보 SMS 발송" },
      ],
    },
    {
      period: "",
      title: "신고접수 — 소방민원정보시스템 연계 구축",
      summary: "시스템 간 데이터 연계 API 개발",
      techStack: ["Spring", "전자정부 표준프레임워크", "iBatis", "Oracle", "CentOS", "SVN"],
      points: [
        { text: "소방민원 정보 조회 및 신고접수 시스템 간 연계 개발" },
        { text: "연계 데이터베이스 설계 및 구축" },
      ],
    },
  ] as ResumeProject[],

  /** Grouped skills. The group name is the row label. */
  skills: [
    { group: "Languages", items: ["Java", "TypeScript", "Python"] },
    {
      group: "Frameworks & Libraries",
      items: ["Spring Boot", "전자정부 표준프레임워크", "Nest.js", "Next.js", "FastAPI"],
    },
    {
      group: "Databases",
      items: ["PostgreSQL", "MySQL", "MongoDB", "Milvus"],
    },
    { group: "GIS", items: ["PostGIS", "GeoServer", "QGIS", "OpenLayers", "Cesium"] },
    {
      group: "Cloud & Deployment",
      items: ["Docker", "Kubernetes", "Jenkins", "OCI", "Azure", "AWS", "Netlify", "Rocky"],
    },
    { group: "Tools", items: ["Git", "GitHub", "SVN", "DBeaver", "Slack", "Notion"] },
  ],

  openSource: [] as ResumeOpenSource[],

  education: [
    {
      period: "2024. 08 ~ 2025. 02",
      title: "프로그래머스",
      subtitle: "타입스크립트로 함께하는 웹 풀 사이클 개발",
    },
    {
      period: "2020. 05 ~ 2020. 11",
      title: "아이티윌 부산교육센터",
      subtitle: "전자정부 프레임워크 자바(JAVA) 개발자 양성 교육 과정",
    },
  ] as ResumeEntry[],

  etc: [] as ResumeEntry[],
};
