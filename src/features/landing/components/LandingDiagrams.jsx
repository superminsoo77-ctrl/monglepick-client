/**
 * 랜딩 페이지 아키텍처 다이어그램 모음.
 *
 * 인프라 토폴로지, ERD 개요, 코드 구조, 16노드 Agent 그래프, RAG 파이프라인을
 * SVG / CSS 기반으로 시각화한다. 모든 SVG는 viewBox 반응형.
 */

import styled from 'styled-components';

/* ================================================================
   공통 상수
   ================================================================ */

/** SVG 다이어그램 공통 색상 */
const C = {
  cardBg: 'rgba(26,26,46,0.85)',
  stroke: 'rgba(124,108,240,0.3)',
  primary: '#7c6cf0',
  cyan: '#06d6a0',
  pink: '#ef476f',
  yellow: '#ffd166',
  blue: '#118ab2',
  purple: '#a78bfa',
  orange: '#f97316',
  text: '#e8e8f0',
  dim: '#8888a0',
  line: 'rgba(124,108,240,0.4)',
};

const FONT = "'Noto Sans KR', 'Inter', sans-serif";
const AGENT_NODE_W = 140;
const AGENT_NODE_H = 34;

/** 다이어그램 공통 래퍼 — 스크롤 가능 + 글래스 배경 */
const Wrap = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 16px;
  background: rgba(10, 10, 20, 0.5);
  border: 1px solid rgba(124, 108, 240, 0.15);
  padding: 20px;
  svg {
    width: 100%;
    height: auto;
    display: block;
    min-width: 680px;
  }
`;

/** SVG 공통 마커(화살표) defs */
function Defs() {
  return (
    <defs>
      <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill={C.line} />
      </marker>
      <marker id="arr-c" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill={C.cyan} />
      </marker>
      <marker id="arr-pk" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill={C.pink} />
      </marker>
      <marker id="arr-y" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill={C.yellow} />
      </marker>
    </defs>
  );
}

/**
 * Agent 흐름 다이어그램의 공통 노드.
 *
 * react-hooks/static-components 규칙에 맞춰 render 바깥에서 선언한다.
 */
function AgentNode({ x, y, label, color = C.primary, w = AGENT_NODE_W }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={AGENT_NODE_H} rx={8}
        fill={C.cardBg} stroke={color} strokeWidth="1.3" />
      <text x={x + w / 2} y={y + AGENT_NODE_H / 2 + 4} textAnchor="middle"
        fill={C.text} fontSize="9" fontWeight="500" fontFamily={FONT}>{label}</text>
    </g>
  );
}

/**
 * Agent 흐름 다이어그램의 결정 노드.
 *
 * 다이아몬드 대신 라운드형 분기 노드로 표시한다.
 */
function AgentDecision({ x, y, label, color = C.yellow, w = AGENT_NODE_W }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={AGENT_NODE_H} rx={AGENT_NODE_H / 2}
        fill="rgba(255,209,102,0.1)" stroke={color} strokeWidth="1.3" strokeDasharray="4 2" />
      <text x={x + w / 2} y={y + AGENT_NODE_H / 2 + 4} textAnchor="middle"
        fill={color} fontSize="9" fontWeight="600" fontFamily={FONT}>{label}</text>
    </g>
  );
}

/** Agent 흐름 다이어그램의 수직 화살표 */
function AgentVArrow({ x, y1, y2 }) {
  return (
    <line x1={x} y1={y1} x2={x} y2={y2} stroke={C.line} strokeWidth="1.5" markerEnd="url(#arr)" />
  );
}

/* ================================================================
   1. 인프라 아키텍처 다이어그램 (4-VM 토폴로지)
   ================================================================ */

export function InfraArchDiagram() {
  return (
    <Wrap>
      <svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg">
        <Defs />

        {/* ── 인터넷 / 사용자 ── */}
        <rect x="330" y="8" width="240" height="36" rx="18" fill="rgba(6,214,160,0.1)" stroke={C.cyan} strokeWidth="1" />
        <text x="450" y="31" textAnchor="middle" fill={C.cyan} fontSize="12" fontWeight="600" fontFamily={FONT}>
          Internet / Users
        </text>
        <line x1="450" y1="44" x2="450" y2="68" stroke={C.line} strokeWidth="2" markerEnd="url(#arr)" />

        {/* ── VM1: Public Gateway ── */}
        <rect x="250" y="68" width="400" height="100" rx="14" fill={C.cardBg} stroke={C.cyan} strokeWidth="1.5" />
        <text x="270" y="92" fill={C.cyan} fontSize="13" fontWeight="700" fontFamily={FONT}>VM1 — Public Gateway</text>
        <text x="270" y="108" fill={C.dim} fontSize="10" fontFamily={FONT}>210.109.15.187 / 10.20.0.13</text>
        {/* VM1 서비스 칩 */}
        {[
          { label: 'Nginx', x: 270 },
          { label: 'React Build', x: 365 },
          { label: 'SSL/TLS', x: 480 },
        ].map(s => (
          <g key={s.label}>
            <rect x={s.x} y="120" width={s.label.length > 6 ? 100 : 80} height="30" rx="6"
              fill="rgba(6,214,160,0.1)" stroke="rgba(6,214,160,0.25)" strokeWidth="1" />
            <text x={s.x + (s.label.length > 6 ? 50 : 40)} y="140" textAnchor="middle"
              fill={C.cyan} fontSize="10" fontWeight="500" fontFamily={FONT}>{s.label}</text>
          </g>
        ))}

        {/* ── 팬아웃 연결선 ── */}
        <line x1="450" y1="168" x2="450" y2="210" stroke={C.line} strokeWidth="2" />
        <line x1="140" y1="210" x2="760" y2="210" stroke={C.line} strokeWidth="1.5" />
        {/* 수직 하강선 */}
        <line x1="140" y1="210" x2="140" y2="250" stroke={C.line} strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="450" y1="210" x2="450" y2="250" stroke={C.line} strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="760" y1="210" x2="760" y2="250" stroke={C.line} strokeWidth="1.5" markerEnd="url(#arr)" />

        {/* ── VM2: Service Layer ── */}
        <rect x="20" y="250" width="240" height="170" rx="14" fill={C.cardBg} stroke={C.primary} strokeWidth="1.5" />
        <text x="40" y="275" fill={C.primary} fontSize="12" fontWeight="700" fontFamily={FONT}>VM2 — Service</text>
        <text x="40" y="292" fill={C.dim} fontSize="10" fontFamily={FONT}>10.20.0.11</text>
        {[
          { label: 'Spring Boot', sub: ':8080', y: 308 },
          { label: 'FastAPI Agent', sub: ':8000', y: 338 },
          { label: 'Recommend', sub: ':8001', y: 368 },
        ].map(s => (
          <g key={s.label}>
            <rect x="40" y={s.y} width="200" height="24" rx="5"
              fill="rgba(124,108,240,0.08)" stroke="rgba(124,108,240,0.2)" strokeWidth="1" />
            <text x="50" y={s.y + 16} fill={C.text} fontSize="10" fontWeight="500" fontFamily={FONT}>{s.label}</text>
            <text x="228" y={s.y + 16} textAnchor="end" fill={C.dim} fontSize="9" fontFamily={FONT}>{s.sub}</text>
          </g>
        ))}

        {/* ── VM3: Monitoring ── */}
        <rect x="330" y="250" width="240" height="200" rx="14" fill={C.cardBg} stroke={C.yellow} strokeWidth="1.5" />
        <text x="350" y="275" fill={C.yellow} fontSize="12" fontWeight="700" fontFamily={FONT}>VM3 — Monitoring</text>
        <text x="350" y="292" fill={C.dim} fontSize="10" fontFamily={FONT}>10.20.0.12</text>
        {[
          { label: 'Prometheus', sub: ':9090', y: 308 },
          { label: 'Grafana', sub: ':3000', y: 336 },
          { label: 'Alertmanager', sub: ':9093', y: 364 },
          { label: 'ELK Stack', sub: ':5601', y: 392 },
        ].map(s => (
          <g key={s.label}>
            <rect x="350" y={s.y} width="200" height="22" rx="5"
              fill="rgba(255,209,102,0.06)" stroke="rgba(255,209,102,0.2)" strokeWidth="1" />
            <text x="360" y={s.y + 15} fill={C.text} fontSize="10" fontWeight="500" fontFamily={FONT}>{s.label}</text>
            <text x="538" y={s.y + 15} textAnchor="end" fill={C.dim} fontSize="9" fontFamily={FONT}>{s.sub}</text>
          </g>
        ))}

        {/* ── VM4: GPU / Database ── */}
        <rect x="640" y="250" width="240" height="230" rx="14" fill={C.cardBg} stroke={C.pink} strokeWidth="1.5" />
        <text x="660" y="275" fill={C.pink} fontSize="12" fontWeight="700" fontFamily={FONT}>VM4 — GPU / DB</text>
        <text x="660" y="292" fill={C.dim} fontSize="10" fontFamily={FONT}>10.20.0.10</text>
        {[
          { label: 'MySQL 8.0', sub: ':3306', y: 306 },
          { label: 'Redis 7', sub: ':6379', y: 332 },
          { label: 'Qdrant', sub: ':6333', y: 358 },
          { label: 'Neo4j 5', sub: ':7687', y: 384 },
          { label: 'Elasticsearch 8.17', sub: ':9200', y: 410 },
          { label: 'vLLM (Tesla T4)', sub: ':8000', y: 436 },
        ].map(s => (
          <g key={s.label}>
            <rect x="660" y={s.y} width="200" height="21" rx="4"
              fill="rgba(239,71,111,0.06)" stroke="rgba(239,71,111,0.2)" strokeWidth="1" />
            <text x="670" y={s.y + 14} fill={C.text} fontSize="9.5" fontWeight="500" fontFamily={FONT}>{s.label}</text>
            <text x="848" y={s.y + 14} textAnchor="end" fill={C.dim} fontSize="8" fontFamily={FONT}>{s.sub}</text>
          </g>
        ))}

        {/* ── 하단 VPC 라벨 ── */}
        <text x="450" y="508" textAnchor="middle" fill={C.dim} fontSize="11" fontFamily={FONT}>
          Kakao Cloud — Private VPC (10.20.0.0/24)
        </text>
      </svg>
    </Wrap>
  );
}

/* ================================================================
   2. ERD 개요 다이어그램 (도메인 그룹별)
   ================================================================ */

/** ERD 도메인 그룹 데이터 */
const ERD_DOMAINS = [
  { label: 'User', tables: 'users · user_point · user_ai_quota\nuser_watch_history · user_status', count: 8, color: C.primary, x: 10, y: 20, w: 270, h: 140 },
  { label: 'Movie', tables: 'movies · genres · movie_genres\nott_platforms · movie_ott', count: 6, color: C.cyan, x: 315, y: 20, w: 270, h: 140 },
  { label: 'AI / Chat', tables: 'chat_sessions · chat_messages\nrecommendations · roadmap_courses', count: 8, color: C.purple, x: 620, y: 20, w: 270, h: 140 },
  { label: 'Payment', tables: 'payment_orders · subscriptions\npoint_items · point_transactions', count: 5, color: C.pink, x: 10, y: 210, w: 270, h: 130 },
  { label: 'Community', tables: 'posts · comments · reports\ntoxicity_logs · post_likes', count: 7, color: C.orange, x: 315, y: 210, w: 270, h: 130 },
  { label: 'Review / Wish', tables: 'reviews · wish_lists\nfav_movies', count: 3, color: C.yellow, x: 620, y: 210, w: 270, h: 130 },
  { label: 'Reward', tables: 'reward_policies · activity_rewards\nachievements · user_achievements', count: 6, color: C.blue, x: 100, y: 390, w: 270, h: 110 },
  { label: 'Content', tables: 'playlists · worldcup_candidates\nplaylist_items · quiz', count: 5, color: C.cyan, x: 530, y: 390, w: 270, h: 110 },
];

/** 도메인 간 관계선 — [from_center_x, from_bottom_y, to_center_x, to_top_y] */
const ERD_RELATIONS = [
  /* User → Payment */  [145, 160, 145, 210],
  /* User → Review */   [280, 100, 620, 275],
  /* Movie → Review */  [585, 100, 620, 210],
  /* Movie → AI */      [585, 80, 620, 80],
  /* User → Community */[280, 130, 315, 260],
  /* User → Reward */   [145, 160, 235, 390],
];

export function ERDDiagram() {
  return (
    <Wrap>
      <svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg">
        <Defs />

        {/* 관계선 (도메인 뒤에 그리면 가려지므로 먼저 렌더) */}
        {ERD_RELATIONS.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={C.line} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        ))}

        {/* 도메인 그룹 카드 */}
        {ERD_DOMAINS.map(d => (
          <g key={d.label}>
            <rect x={d.x} y={d.y} width={d.w} height={d.h} rx="12"
              fill={C.cardBg} stroke={d.color} strokeWidth="1.5" />
            {/* 도메인 헤더 */}
            <text x={d.x + 14} y={d.y + 24} fill={d.color} fontSize="13" fontWeight="700" fontFamily={FONT}>
              {d.label}
            </text>
            <text x={d.x + d.w - 14} y={d.y + 24} textAnchor="end" fill={d.color} fontSize="10" fontFamily={FONT} opacity="0.7">
              {d.count} tables
            </text>
            {/* 테이블 목록 — 줄바꿈 처리 */}
            {d.tables.split('\n').map((line, li) => (
              <text key={li} x={d.x + 14} y={d.y + 48 + li * 20} fill={C.dim} fontSize="10" fontFamily={FONT}>
                {line}
              </text>
            ))}
          </g>
        ))}

        {/* 총 테이블 수 라벨 */}
        <text x="450" y="515" textAnchor="middle" fill={C.dim} fontSize="11" fontFamily={FONT}>
          총 85개 테이블 — JPA @Entity ddl-auto=update 기반 자동 관리
        </text>
      </svg>
    </Wrap>
  );
}

/* ================================================================
   3. 코드 구조 다이어그램 (5서비스 CSS 카드)
   ================================================================ */

const CodeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  @media (max-width: 900px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
`;

const CodeCard = styled.div`
  background: rgba(26, 26, 46, 0.7);
  border: 1px solid ${({ $color }) => $color || 'rgba(124,108,240,0.2)'};
  border-radius: 14px;
  padding: 16px;
  font-family: 'Noto Sans KR', sans-serif;
`;

const CodeCardHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(124, 108, 240, 0.1);
`;

const CodeCardTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ $color }) => $color || '#e8e8f0'};
`;

const CodeCardPort = styled.span`
  font-size: 0.7rem;
  color: #8888a0;
  margin-left: auto;
`;

const CodeCardTech = styled.div`
  font-size: 0.65rem;
  color: #8888a0;
  margin-bottom: 10px;
`;

const CodeTree = styled.div`
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.7rem;
  color: #b0b0c8;
  line-height: 1.7;
  white-space: pre;
`;

/** 5서비스 코드 구조 데이터 */
const CODE_SERVICES = [
  {
    name: 'Agent', port: ':8000', color: C.primary, tech: 'FastAPI + LangGraph + Ollama',
    tree: `src/monglepick/
├── api/
├── agents/
│   ├── chat/
│   ├── match/
│   ├── recommendation/
│   └── roadmap/
├── chains/
├── rag/
├── tools/
├── data_pipeline/
└── db/`,
  },
  {
    name: 'Backend', port: ':8080', color: C.cyan, tech: 'Spring Boot 3 + JPA',
    tree: `src/main/java/
├── global/
│   ├── config/
│   ├── security/
│   └── exception/
└── domain/
    ├── auth/
    ├── user/
    ├── movie/
    ├── community/
    ├── payment/
    └── reward/`,
  },
  {
    name: 'Recommend', port: ':8001', color: C.yellow, tech: 'FastAPI + SQLAlchemy + Redis',
    tree: `app/
├── routes/
│   ├── search/
│   ├── recommend/
│   └── like/
├── services/
├── models/
└── config/`,
  },
  {
    name: 'Client', port: ':5173', color: C.pink, tech: 'React + Vite + styled',
    tree: `src/
├── features/
│   ├── landing/
│   ├── chat/
│   ├── match/
│   ├── community/
│   ├── mypage/
│   └── point/
└── shared/
    ├── components/
    ├── stores/
    └── api/`,
  },
  {
    name: 'Admin', port: ':5174', color: C.blue, tech: 'React + Vite + styled',
    tree: `src/
├── features/
│   ├── dashboard/
│   ├── users/
│   ├── content/
│   ├── payment/
│   ├── ai-ops/
│   └── settings/
└── shared/
    ├── components/
    └── utils/`,
  },
];

export function CodeStructDiagram() {
  return (
    <CodeGrid>
      {CODE_SERVICES.map(s => (
        <CodeCard key={s.name} $color={s.color + '40'}>
          <CodeCardHead>
            <CodeCardTitle $color={s.color}>{s.name}</CodeCardTitle>
            <CodeCardPort>{s.port}</CodeCardPort>
          </CodeCardHead>
          <CodeCardTech>{s.tech}</CodeCardTech>
          <CodeTree>{s.tree}</CodeTree>
        </CodeCard>
      ))}
    </CodeGrid>
  );
}

/* ================================================================
   4. Agent 노드 흐름 다이어그램 (16노드 Chat Agent)
   ================================================================ */

export function AgentFlowDiagram() {
  return (
    <Wrap>
      <svg viewBox="0 0 900 700" xmlns="http://www.w3.org/2000/svg">
        <Defs />

        {/* ── 입력 레이어 라벨 ── */}
        <rect x="10" y="8" width="880" height="180" rx="16" fill="rgba(124,108,240,0.04)" stroke="rgba(124,108,240,0.1)" strokeWidth="1" />
        <text x="30" y="30" fill={C.primary} fontSize="10" fontWeight="600" fontFamily={FONT} opacity="0.6">INPUT LAYER</text>

        {/* START */}
        <rect x="400" y="40" width="60" height="28" rx="14"
          fill={C.cyan} stroke="none" />
        <text x="430" y="58" textAnchor="middle" fill="#0a0a14" fontSize="10" fontWeight="700" fontFamily={FONT}>START</text>
        <AgentVArrow x={430} y1={68} y2={85} />

        {/* context_loader */}
        <AgentNode x={360} y={88} label="context_loader" />
        <AgentVArrow x={430} y1={122} y2={138} />

        {/* route_has_image (decision) */}
        <AgentDecision x={340} y={140} label="route_has_image" w={180} />

        {/* image path (left) */}
        <line x1="340" y1="157" x2="220" y2="157" stroke={C.line} strokeWidth="1.2" />
        <AgentVArrow x={220} y1={157} y2={180} />
        <text x="275" y="152" fill={C.dim} fontSize="8" fontFamily={FONT}>이미지 있음</text>
        <AgentNode x={150} y={183} label="image_analyzer" color={C.purple} />

        {/* no image path label */}
        <text x="535" y="152" fill={C.dim} fontSize="8" fontFamily={FONT}>없음</text>

        {/* merge to intent_emotion_classifier */}
        <line x1="220" y1="217" x2="220" y2="240" stroke={C.line} strokeWidth="1.2" />
        <line x1="220" y1="240" x2="430" y2="240" stroke={C.line} strokeWidth="1.2" />
        <line x1="520" y1="157" x2="560" y2="157" stroke={C.line} strokeWidth="1.2" />
        <line x1="560" y1="157" x2="560" y2="240" stroke={C.line} strokeWidth="1.2" />
        <line x1="560" y1="240" x2="430" y2="240" stroke={C.line} strokeWidth="1.2" />
        <AgentVArrow x={430} y1={240} y2={255} />

        {/* ── 분류 레이어 ── */}
        <rect x="10" y="248" width="880" height="52" rx="12" fill="rgba(239,71,111,0.04)" stroke="rgba(239,71,111,0.08)" strokeWidth="1" />
        <AgentNode x={330} y={258} label="intent_emotion_classifier" color={C.pink} w={200} />

        {/* route_after_intent */}
        <AgentVArrow x={430} y1={292} y2={318} />
        <AgentDecision x={330} y={320} label="route_after_intent" w={200} />

        {/* ── 4개 분기 ── */}
        {/* 분기 라벨 배경 */}
        <rect x="10" y="375" width="880" height="260" rx="16" fill="rgba(6,214,160,0.03)" stroke="rgba(6,214,160,0.08)" strokeWidth="1" />
        <text x="30" y="395" fill={C.cyan} fontSize="10" fontWeight="600" fontFamily={FONT} opacity="0.6">PROCESSING BRANCHES</text>

        {/* 분기선 */}
        <line x1="330" y1="337" x2="100" y2="337" stroke={C.line} strokeWidth="1.2" />
        <line x1="430" y1="354" x2="430" y2="408" stroke={C.line} strokeWidth="1.2" markerEnd="url(#arr)" />
        <line x1="100" y1="337" x2="100" y2="408" stroke={C.line} strokeWidth="1.2" markerEnd="url(#arr)" />
        <line x1="530" y1="337" x2="610" y2="337" stroke={C.line} strokeWidth="1.2" />
        <line x1="610" y1="337" x2="610" y2="408" stroke={C.line} strokeWidth="1.2" markerEnd="url(#arr)" />
        <line x1="610" y1="337" x2="800" y2="337" stroke={C.line} strokeWidth="1.2" />
        <line x1="800" y1="337" x2="800" y2="408" stroke={C.line} strokeWidth="1.2" markerEnd="url(#arr)" />

        {/* ── Branch 1: recommend/search (가장 긴 경로) ── */}
        <text x="100" y="404" textAnchor="middle" fill={C.cyan} fontSize="8" fontWeight="600" fontFamily={FONT}>recommend</text>
        <AgentNode x={30} y={412} label="preference_refiner" color={C.cyan} />
        <AgentVArrow x={100} y1={446} y2={462} />
        <AgentNode x={30} y={465} label="query_builder" color={C.cyan} />
        <AgentVArrow x={100} y1={499} y2={515} />
        <AgentNode x={30} y={518} label="rag_retriever" color={C.cyan} />
        <AgentVArrow x={100} y1={552} y2={568} />
        <AgentNode x={15} y={571} label="llm_reranker → ranker" color={C.cyan} w={170} />

        {/* ── Branch 2: relation ── */}
        <text x="430" y="404" textAnchor="middle" fill={C.blue} fontSize="8" fontWeight="600" fontFamily={FONT}>relation</text>
        <AgentNode x={360} y={412} label="graph_traversal" color={C.blue} />
        <AgentVArrow x={430} y1={446} y2={462} />
        <AgentNode x={345} y={465} label="recommendation_ranker" color={C.blue} w={170} />

        {/* ── Branch 3: general ── */}
        <text x="610" y="404" textAnchor="middle" fill={C.orange} fontSize="8" fontWeight="600" fontFamily={FONT}>general</text>
        <AgentNode x={540} y={412} label="general_responder" color={C.orange} />

        {/* ── Branch 4: info/theater/tool ── */}
        <text x="800" y="404" textAnchor="middle" fill={C.yellow} fontSize="8" fontWeight="600" fontFamily={FONT}>info / tool</text>
        <AgentNode x={730} y={412} label="tool_executor" color={C.yellow} />

        {/* ── 출력 레이어 ── */}
        <rect x="10" y="645" width="880" height="48" rx="12" fill="rgba(124,108,240,0.04)" stroke="rgba(124,108,240,0.1)" strokeWidth="1" />
        <text x="30" y="663" fill={C.primary} fontSize="10" fontWeight="600" fontFamily={FONT} opacity="0.6">OUTPUT LAYER</text>

        {/* 수렴 */}
        {[100, 430, 610, 800].map(x => (
          <line key={x} x1={x} y1={x === 100 ? 605 : 446} x2={x} y2={640} stroke={C.line} strokeWidth="1" strokeDasharray="3 2" />
        ))}
        <line x1="100" y1="640" x2="800" y2="640" stroke={C.line} strokeWidth="1.2" />
        <AgentVArrow x={450} y1={640} y2={652} />

        {/* explanation_generator + response_formatter */}
        <AgentNode x={310} y={657} label="explanation → response_formatter" w={260} />

        {/* END */}
        <AgentVArrow x={440} y1={691} y2={696} />
        <rect x="410" y="696" width="60" height="0" rx="0" fill="none" />
      </svg>
    </Wrap>
  );
}

/* ================================================================
   5. RAG 파이프라인 다이어그램
   ================================================================ */

export function RAGDiagram() {
  return (
    <Wrap>
      <svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg">
        <Defs />

        {/* ── 사용자 쿼리 ── */}
        <rect x="350" y="15" width="200" height="40" rx="20"
          fill="rgba(6,214,160,0.12)" stroke={C.cyan} strokeWidth="1.5" />
        <text x="450" y="40" textAnchor="middle" fill={C.cyan} fontSize="12" fontWeight="600" fontFamily={FONT}>
          사용자 자연어 쿼리
        </text>
        <line x1="450" y1="55" x2="450" y2="78" stroke={C.line} strokeWidth="2" markerEnd="url(#arr)" />

        {/* ── 의도/감정 분류 ── */}
        <rect x="300" y="80" width="300" height="45" rx="12"
          fill={C.cardBg} stroke={C.pink} strokeWidth="1.3" />
        <text x="450" y="100" textAnchor="middle" fill={C.pink} fontSize="11" fontWeight="600" fontFamily={FONT}>
          Intent + Emotion Classifier
        </text>
        <text x="450" y="116" textAnchor="middle" fill={C.dim} fontSize="9" fontFamily={FONT}>
          qwen3.5:35b-a3b via Ollama
        </text>
        <line x1="450" y1="125" x2="450" y2="148" stroke={C.line} strokeWidth="2" markerEnd="url(#arr)" />

        {/* ── 쿼리 빌더 ── */}
        <rect x="310" y="150" width="280" height="40" rx="10"
          fill={C.cardBg} stroke={C.primary} strokeWidth="1.3" />
        <text x="450" y="170" textAnchor="middle" fill={C.text} fontSize="10" fontWeight="500" fontFamily={FONT}>
          Dynamic Query Builder (genre · mood · keyword · year)
        </text>
        <line x1="450" y1="190" x2="450" y2="210" stroke={C.line} strokeWidth="2" />

        {/* ── 3-way 팬아웃 ── */}
        <line x1="140" y1="210" x2="760" y2="210" stroke={C.line} strokeWidth="1.5" />
        <line x1="140" y1="210" x2="140" y2="238" stroke={C.line} strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="450" y1="210" x2="450" y2="238" stroke={C.line} strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="760" y1="210" x2="760" y2="238" stroke={C.line} strokeWidth="1.5" markerEnd="url(#arr)" />

        {/* ── 3개 DB ── */}
        {/* Qdrant */}
        <rect x="50" y="240" width="180" height="60" rx="12"
          fill={C.cardBg} stroke={C.purple} strokeWidth="1.5" />
        <text x="140" y="262" textAnchor="middle" fill={C.purple} fontSize="12" fontWeight="700" fontFamily={FONT}>Qdrant</text>
        <text x="140" y="280" textAnchor="middle" fill={C.dim} fontSize="9" fontFamily={FONT}>Vector Search · 4096D</text>
        <text x="140" y="294" textAnchor="middle" fill={C.dim} fontSize="8" fontFamily={FONT}>Upstage Solar Embedding</text>

        {/* Elasticsearch */}
        <rect x="360" y="240" width="180" height="60" rx="12"
          fill={C.cardBg} stroke={C.yellow} strokeWidth="1.5" />
        <text x="450" y="262" textAnchor="middle" fill={C.yellow} fontSize="12" fontWeight="700" fontFamily={FONT}>Elasticsearch</text>
        <text x="450" y="280" textAnchor="middle" fill={C.dim} fontSize="9" fontFamily={FONT}>BM25 · Nori 한국어</text>
        <text x="450" y="294" textAnchor="middle" fill={C.dim} fontSize="8" fontFamily={FONT}>키워드 + 퍼지 매칭</text>

        {/* Neo4j */}
        <rect x="670" y="240" width="180" height="60" rx="12"
          fill={C.cardBg} stroke={C.cyan} strokeWidth="1.5" />
        <text x="760" y="262" textAnchor="middle" fill={C.cyan} fontSize="12" fontWeight="700" fontFamily={FONT}>Neo4j</text>
        <text x="760" y="280" textAnchor="middle" fill={C.dim} fontSize="9" fontFamily={FONT}>Graph Traversal · Cypher</text>
        <text x="760" y="294" textAnchor="middle" fill={C.dim} fontSize="8" fontFamily={FONT}>감독/배우 관계 탐색</text>

        {/* ── 수렴 ── */}
        <line x1="140" y1="300" x2="140" y2="330" stroke={C.line} strokeWidth="1.5" />
        <line x1="450" y1="300" x2="450" y2="330" stroke={C.line} strokeWidth="1.5" />
        <line x1="760" y1="300" x2="760" y2="330" stroke={C.line} strokeWidth="1.5" />
        <line x1="140" y1="330" x2="760" y2="330" stroke={C.line} strokeWidth="1.5" />
        <line x1="450" y1="330" x2="450" y2="348" stroke={C.line} strokeWidth="2" markerEnd="url(#arr)" />

        {/* ── RRF Fusion ── */}
        <rect x="340" y="350" width="220" height="30" rx="8"
          fill="rgba(124,108,240,0.12)" stroke={C.primary} strokeWidth="1.3" />
        <text x="450" y="370" textAnchor="middle" fill={C.text} fontSize="10" fontWeight="600" fontFamily={FONT}>
          RRF Fusion (k=60) → LLM Reranker
        </text>
        <line x1="450" y1="380" x2="450" y2="396" stroke={C.line} strokeWidth="2" markerEnd="url(#arr)" />

        {/* ── 최종 결과 ── */}
        <rect x="360" y="398" width="180" height="18" rx="9"
          fill={C.cyan} stroke="none" />
        <text x="450" y="411" textAnchor="middle" fill="#0a0a14" fontSize="10" fontWeight="700" fontFamily={FONT}>
          Top-N Movies (MMR λ=0.7)
        </text>
      </svg>
    </Wrap>
  );
}

/* ================================================================
   6. 피그마 플레이스홀더
   ================================================================ */

const FigmaWrap = styled.div`
  width: 100%;
  min-height: 300px;
  border-radius: 16px;
  background: rgba(10, 10, 20, 0.5);
  border: 2px dashed rgba(124, 108, 240, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  color: #8888a0;
  font-size: 0.9rem;
  font-family: 'Noto Sans KR', sans-serif;

  /* 이미지가 들어오면 꽉 채우기 */
  img {
    width: 100%;
    height: auto;
    border-radius: 14px;
    object-fit: contain;
  }
`;

export function FigmaPlaceholder() {
  return (
    <FigmaWrap>
      <span style={{ fontSize: '2.5rem' }}>🎨</span>
      <span>Figma 디자인 이미지를 여기에 추가하세요</span>
      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
        public/ 폴더에 이미지를 넣고 &lt;img&gt; 태그로 교체
      </span>
    </FigmaWrap>
  );
}
