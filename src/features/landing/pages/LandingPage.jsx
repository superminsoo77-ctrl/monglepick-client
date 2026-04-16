/**
 * 몽글픽 랜딩 페이지 컴포넌트.
 *
 * 서비스 소개 + 팀 소개 + 기능 소개 + 기술 스택 + 데이터 규모 + 진행 현황을 포함한다.
 * 글래스모피즘 + 파티클 + 스크롤 애니메이션 기반 화려한 UI를 제공한다.
 *
 * CSS 전환: LandingPage.css → LandingPage.styled.js (styled-components)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import * as S from './LandingPage.styled';
import {
  InfraArchDiagram,
  ERDDiagram,
  CodeStructDiagram,
  AgentFlowDiagram,
  RAGDiagram,
} from '../components/LandingDiagrams';
import IAModal from '../components/IAModal';
import PlanningModal from '../components/PlanningModal';
import DiagramModal from '../components/DiagramModal';
import AgentInfoModal, { AGENT_MODAL_CONTENT } from '../components/AgentInfoModal';

/* ── AI Agent 심층 카드 데이터 ──
   각 카드는 클릭 시 AgentInfoModal 을 연다. id 는 AGENT_MODAL_CONTENT 의 키와 일치. */
const AGENT_DEEP_CARDS = [
  /* ── 전체 흐름을 가장 앞에 ── */
  { id: 'e2eJourney', icon: '🛤️', title: 'End-to-End Journey', sub: '가입 → 콜드스타트 → 추천 → 결제 → 관람 → 리뷰 → 리워드 한 루프', color: '#7c6cf0' },
  { id: 'chatAgent',  icon: '💬', title: 'Chat Agent',         sub: 'LangGraph 16노드 · 4분기 흐름 · SSE 8 이벤트',          color: '#ef476f' },
  { id: 'ragPipeline', icon: '🔎', title: 'RAG Pipeline',      sub: 'Qdrant+ES+Neo4j 병렬 · RRF k=60 · 4단계 완화 · MMR λ=0.7', color: '#f97316' },
  { id: 'matchAgent', icon: '🎬', title: 'Movie Match v3',     sub: '7노드 · LLM 리랭커 + Centroid + Co-watched CF',          color: '#a78bfa' },
  { id: 'roadmapAgent', icon: '🗺️', title: 'Roadmap Agent',    sub: '15편 테마별 큐레이션 · 단계별 진행 · 완주 뱃지',          color: '#ffd166' },
  { id: 'llmStack',   icon: '🧠', title: 'Hybrid LLM Stack',   sub: 'Solar API(분류·추출·설명) + EXAONE 1.2B vLLM(최종 응답)', color: '#7c6cf0' },
  { id: 'sseEvents',  icon: '📡', title: 'SSE Streaming',      sub: '8개 이벤트 · point_update v3.4 · clarification 카드',     color: '#118ab2' },
  { id: 'memoryArch', icon: '🧊', title: 'Memory Architecture', sub: 'Redis 핫 캐시 + MySQL 아카이브 (write-behind)',         color: '#06d6a0' },
  { id: 'recoScoring', icon: '⚖️', title: 'Reco Scoring',       sub: 'CF+CBF 동적 가중치 + MMR λ=0.7 + RRF k=60',              color: '#ef476f' },
  { id: 'paymentFlow', icon: '💳', title: 'Payment & Saga',     sub: 'Toss v2 · 2-Phase · Orchestration Saga · 3회 재시도 100ms',  color: '#06d6a0' },
  { id: 'recommendArch', icon: '🧮', title: 'Recommend Service', sub: 'FastAPI · Like Redis write-behind(60s) · Co-watched CF 5min', color: '#06d6a0' },
  { id: 'coldStart',   icon: '❄️', title: 'Cold Start & Onboarding', sub: '리뷰 0건도 추천 · 월드컵 온보딩 · Kaggle 26M CF 캐시 보완', color: '#a78bfa' },
  { id: 'jwtAuth',     icon: '🔑', title: 'JWT & Refresh Rotation', sub: 'Access 1h · Refresh 7d · DB 화이트리스트 · OAuth2 exchange', color: '#118ab2' },
  { id: 'ocrTicket',   icon: '🎫', title: 'OCR 티켓 인증',    sub: '영수증 업로드 · 관리자 검토 큐 · 도장깨기 가중 · 추첨 응모',  color: '#ef476f' },
  { id: 'aiQuiz',      icon: '❓', title: 'AI 퀴즈 생성',     sub: 'Solar 구조화 출력 → 관리자 검수 → APPROVED → PUBLISHED',      color: '#ffd166' },
  { id: 'aiReviewVerification', icon: '🧐', title: 'AI 리뷰 검증', sub: '도장깨기 실관람 판별 · 4-Stage 임베딩+키워드+LLM (⏳ 스텁)', color: '#7c6cf0' },
  { id: 'community',   icon: '👥', title: 'Community & Social', sub: '커뮤니티 · 리뷰 · AI 퀴즈 · 이상형 월드컵 · 소울메이트', color: '#118ab2' },
  { id: 'rewards',     icon: '🎁', title: 'Rewards & Achievements', sub: '55개 리워드 정책 · 6등급 · 업적 · 도장깨기 · 티켓 추첨', color: '#ffd166' },
  { id: 'gitStrategy', icon: '🌿', title: 'Git Branching',      sub: 'Git Flow · main/develop · feature PR · 조직 레포 직접',   color: '#ef476f' },
  { id: 'cicd',        icon: '⚙️', title: 'CI / CD',            sub: 'GitHub Actions · gradle test · Vite build · deploy-prod', color: '#7c6cf0' },
  { id: 'staging',     icon: '🏭', title: 'Staging & Production', sub: 'MacBook Air 스테이징 + 카카오 클라우드 4-VM 운영',     color: '#a78bfa' },
  { id: 'projectMgmt', icon: '📌', title: 'Jira + Confluence',  sub: 'WBS 261건 · Jira 이슈 · Confluence 문서화 · MCP 연동',    color: '#f97316' },
  /* ── 인프라 · 데이터 · 운영 (신규) ── */
  { id: 'cloudInfra',  icon: '🏔️', title: 'Cloud & VM Security', sub: 'Kakao Cloud VPC · SSH 배스천 · Linux 하드닝 · TLS · 로드맵', color: '#06d6a0' },
  { id: 'dataPipeline',icon: '🏭', title: 'Data Pipeline',     sub: '910K편 · TMDB/KOBIS/KMDb/Kaggle · Solar 임베딩 · 5DB 동기', color: '#f97316' },
  { id: 'adminConsole',icon: '👑', title: 'Admin Console',      sub: '10탭 · 96 API · 운영 11서브탭 · 통계 12탭 · 감사 로그',   color: '#ef476f' },
  { id: 'observability', icon: '🔭', title: 'Monitoring & Observability', sub: 'Prometheus · Grafana · ELK · Alertmanager · LangSmith', color: '#118ab2' },
];

/* ── 피처 데이터 ── */
const FEATURES = [
  { icon: '🎭', title: '감정 기반 AI 추천', desc: '"오늘 좀 우울해" 한 마디면 충분해요. 기분을 읽고 딱 맞는 영화를 골라드려요.', tag: 'AI 채팅', color: '#ef476f' },
  { icon: '⚔️', title: '영화 월드컵', desc: '이지선다로 나의 취향을 정밀하게 파악해요. 고를수록 추천이 정확해져요.', tag: '취향 분석', color: '#ffd166' },
  { icon: '🏆', title: '도장깨기 플레이리스트', desc: 'AI가 테마별 영화 로드맵을 짜드려요. 완주하면 뱃지도 드려요!', tag: '게임화', color: '#06d6a0' },
  { icon: '👥', title: '시네마 소울메이트', desc: '취향이 비슷한 유저를 찾아드려요. 함께 볼 영화 고르는 그룹 추천도 가능해요.', tag: '소셜', color: '#118ab2' },
  { icon: '🎲', title: '블라인드 데이트 추천', desc: '제목은 숨기고 힌트만! 뜻밖의 명작을 발견하는 즐거움을 드려요.', tag: '서프라이즈', color: '#a78bfa' },
  { icon: '🎬', title: 'AI 퀴즈 & 씬 맞추기', desc: '매일 새로운 영화 퀴즈와 스틸컷 맞추기 게임으로 커뮤니티가 살아있어요.', tag: '커뮤니티', color: '#f97316' },
];

/**
 * Neo4j Browser "빠른 쿼리 프리필" URL 빌더.
 *
 * Neo4j Browser 는 보안상 URL 파라미터로부터 Cypher 자동 실행을 지원하지 않는다.
 * 대신 `?cmd=edit&arg=<cypher>` 로 에디터에 쿼리를 프리필해 "열자마자 여러 쿼리가
 * 눈에 보이는 상태" 를 만들 수 있다. 아래 multi-statement 스크립트를 통째로
 * 붙여넣어 줌으로써 사용자는 원하는 블록을 선택 후 Ctrl+Enter 로 실행한다.
 *
 * 노드 라벨: Movie/Person/Genre/MoodTag — 관계: DIRECTED/ACTED_IN/HAS_GENRE/HAS_MOOD
 */
const NEO4J_PRELOAD_CYPHER = [
  '// 몽글픽 Neo4j 빠른 쿼리 샘플 — 원하는 블록 선택 후 Ctrl+Enter 로 실행하세요',
  '',
  '// 1) 전체 노드 수 (라벨별)',
  'MATCH (n) RETURN labels(n) AS label, count(*) AS cnt ORDER BY cnt DESC;',
  '',
  '// 2) 장르별 영화 TOP 20',
  'MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre) RETURN g.name AS genre, count(m) AS movies ORDER BY movies DESC LIMIT 20;',
  '',
  '// 3) 봉준호 감독 영화 네트워크',
  "MATCH (d:Person {name:'봉준호'})-[:DIRECTED]->(m:Movie)<-[:ACTED_IN]-(a:Person) RETURN d, m, a LIMIT 100;",
  '',
  '// 4) 최민식 ∩ 송강호 함께 출연한 영화',
  "MATCH (a:Person {name:'최민식'})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(b:Person {name:'송강호'}) RETURN a, m, b;",
  '',
  "// 5) 무드태그 '따뜻한' 영화 샘플",
  "MATCH (m:Movie)-[:HAS_MOOD]->(t:MoodTag {name:'따뜻한'}) RETURN m.title, m.vote_average ORDER BY m.vote_average DESC LIMIT 30;",
].join('\n');

/**
 * Neo4j Browser iframe/링크 URL.
 *
 * Nginx 에서 X-Frame-Options: DENY + CSP frame-ancestors:none 을 strip 했으므로
 * iframe 임베딩이 가능하다. `?cmd=edit&arg=<cypher>` 로 쿼리를 에디터에 프리필.
 * (Neo4j Browser 는 보안상 URL 기반 자동 실행은 지원하지 않으며 Ctrl+Enter 필요)
 */
const NEO4J_BROWSER_URL =
  `http://210.109.15.187/browser/?connectURL=neo4j://210.109.15.187:7687&preselectAuthMethod=NO_AUTH&cmd=edit&arg=${encodeURIComponent(NEO4J_PRELOAD_CYPHER)}`;

/**
 * TensorFlow Projector URL — 실제 몽글픽 벡터 데이터(3000편 × 200D) 로드.
 *
 * projector.tensorflow.org 는 HTTPS 전용이라 HTTP 벡터 파일 fetch 시 mixed content 차단.
 * → 해결: projector HTML 을 VM1 에 self-host 해 same-origin HTTP 로 제공.
 */
/** config 경로가 HTML 에 직접 하드코딩되어 있으므로 URL 파라미터 불필요 */
const TF_PROJECTOR_URL = 'http://210.109.15.187/static/projector/index.html';

/* ── 관리/모니터링/참고 링크 데이터 ── */
const QUICK_LINKS = {
  /**
   * 서비스 관리 — VM1 Nginx 리버스 프록시 경유 URL (VM3/VM4는 Private IP).
   *
   * 2026-04-16 개편:
   *  - Prometheus 카드 제거 (사용자 요청, Grafana 로 충분히 소화됨)
   *  - Neo4j Browser 카드 추가 (클릭 시 빠른 쿼리 5종이 에디터에 프리필된 상태로 열림 —
   *    Neo4j Browser 는 보안상 쿼리 자동 실행을 지원하지 않으므로 사용자 Ctrl+Enter 필요)
   *  - Swagger/OpenAPI 카드 3종 추가 (Backend / Agent / Recommend)
   */
  services: [
    { icon: '🛠️', label: '관리자 페이지',   url: 'http://210.109.15.187/admin/',              desc: 'Admin 대시보드 · 운영 도구' },
    { icon: '📊', label: 'Grafana 대시보드', url: 'http://210.109.15.187/monitoring/grafana/', desc: 'Prometheus 메트릭 모니터링' },
    { icon: '📋', label: 'Kibana (ELK)',     url: 'http://210.109.15.187/monitoring/kibana/',  desc: '로그 검색 · 시각화' },
    /* Swagger/OpenAPI — 3개 서비스 API 명세 */
    { icon: '📘', label: 'Backend Swagger',   url: 'http://210.109.15.187/swagger-ui/index.html', desc: 'Spring Boot · springdoc OpenAPI' },
    { icon: '📗', label: 'Agent Swagger',     url: 'http://210.109.15.187/agent/docs',            desc: 'FastAPI · AI Agent :8000' },
    { icon: '📙', label: 'Recommend Swagger', url: 'http://210.109.15.187/recommend/docs',        desc: 'FastAPI · Recommend :8001' },
  ],
  /* 팀원별 GitHub & 참고 링크 */
  members: [
    {
      name: '윤형주', role: 'Backend · AI Engineer', color: '#7c6cf0',
      links: [
        { label: 'GitHub', url: 'https://github.com/yhj0904' },
      ],
    },
    {
      name: '김민규', role: 'Team Lead · Backend', color: '#ef476f',
      links: [
        { label: 'GitHub', url: 'https://github.com/min-gyu' },
      ],
    },
    {
      name: '정한나', role: 'Search & Recommendation', color: '#06d6a0',
      links: [
        { label: 'GitHub', url: 'https://github.com/hanna-jeong' },
      ],
    },
    {
      name: '이민수', role: 'Community & Social', color: '#ffd166',
      links: [
        { label: 'GitHub', url: 'https://github.com/minsu-lee' },
      ],
    },
  ],
  /* 프로젝트 레포지토리 */
  repos: [
    { label: 'Backend', url: 'https://github.com/monglepick/monglepick-backend', desc: 'Spring Boot 3 + JPA' },
    { label: 'AI Agent', url: 'https://github.com/monglepick/monglepick-agent', desc: 'FastAPI + LangGraph' },
    { label: 'Client', url: 'https://github.com/monglepick/monglepick-client', desc: 'React + Vite' },
    { label: 'Recommend', url: 'https://github.com/monglepick/monglepick-recommend', desc: 'FastAPI + Redis' },
    { label: 'Admin', url: 'https://github.com/monglepick/monglepick-admin', desc: 'React + Vite' },
  ],
};

/* ── 플로팅 무비카드 데이터 ── */
const MOVIE_CARDS = [
  { title: '인셉션', genre: 'SF · 스릴러', rating: '8.8', year: '2010', style: { top: 0, left: 20, rot: -2, dur: 3.5, delay: 0 } },
  { title: '기생충', genre: '드라마 · 스릴러', rating: '8.5', year: '2019', style: { top: 20, right: 0, rot: 3, dur: 4, delay: 0.5 } },
  { title: '어바웃 타임', genre: '로맨스 · 드라마', rating: '7.8', year: '2013', style: { top: 210, left: 40, rot: 1, dur: 3.8, delay: 0.3 } },
  { title: '라라랜드', genre: '뮤지컬 · 로맨스', rating: '8.0', year: '2016', style: { top: 250, right: 10, rot: -3, dur: 4.2, delay: 0.8 } },
];

/* ── 팀원 데이터 ──
   진행률은 WBS v5(2026-03-31) 기준 + 이후 완료 작업 반영.
   윤형주: Phase 0~9 + R-0~R-6 + 관리자 페이지 72 EP + 운영 도구 + Client 전반 완료
   김민규: 인증/사용자/플레이리스트 + 관리자 사용자 관리 11 EP
   정한나: monglepick-recommend FastAPI 전담 (Like 도메인 이관 + 검색/온보딩)
   이민수: 커뮤니티 전반 + 관리자 콘텐츠 관리 9 EP                                       */
const TEAM_MEMBERS = [
  {
    initials: 'YH', name: '윤형주', role: 'Backend Developer · AI Engineer', color: '#7c6cf0',
    desc: 'AI Agent 16노드 그래프, 추천/매칭/콘텐츠분석/로드맵 4종 에이전트, 결제·포인트·리워드 시스템, 관리자 페이지 72 EP, 인프라(4-VM/Docker/CI-CD) 총괄',
    tags: ['LangGraph', 'FastAPI', 'Spring Boot', 'Toss Pay', 'Ollama', 'CI/CD'],
    progress: 90, req: '146건 중 49 완료 + 5 진행 · 전 영역 리딩',
  },
  {
    initials: 'MG', name: '김민규', role: 'Team Lead · Backend Developer', color: '#ef476f',
    desc: 'Spring Boot 백엔드 핵심 기능 개발. 회원가입/로그인 인증 시스템, 마이페이지, 플레이리스트, 도장깨기 코스, 관리자 사용자 관리 페이지 담당',
    tags: ['Spring Boot', 'JWT', 'JPA', 'MyBatis', 'MySQL'],
    progress: 50, req: '58건 중 11 완료 + 13 진행 · auth/user/playlist',
  },
  {
    initials: 'HN', name: '정한나', role: 'Search & Recommendation', color: '#06d6a0',
    desc: 'FastAPI 기반 검색/추천 서비스 단독 개발. 영화 검색, 온보딩(이상형 월드컵), 개인화 추천, 영화 Like 도메인(write-behind) 이관 담당',
    tags: ['FastAPI', 'SQLAlchemy', 'Redis', 'Write-behind'],
    progress: 35, req: '34건 중 5 진행 · monglepick-recommend 전담',
  },
  {
    initials: 'MS', name: '이민수', role: 'Community & Social', color: '#ffd166',
    desc: '커뮤니티 생태계 전담 개발. 게시글 CRUD, 댓글/대댓글, 좋아요, 신고/혐오표현, AI 영화 퀴즈, 관리자 콘텐츠 관리 9 EP 담당',
    tags: ['Spring Boot', 'JPA', 'REST API', 'AI 퀴즈'],
    progress: 55, req: '22건 중 9 완료 + 3 진행 · 커뮤니티 전반',
  },
];

export default function LandingPage() {
  /* ── 피처 자동 순환 상태 ── */
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  /* 모바일 햄버거 메뉴 열림/닫힘 상태 */
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  /* 정보구조도 / 초기 기획서 모달 열림 상태 */
  const [isIAOpen, setIsIAOpen] = useState(false);
  const [isPlanningOpen, setIsPlanningOpen] = useState(false);
  /* 다이어그램 모달 — 열려있는 다이어그램 ID (null이면 닫힘) */
  const [openDiagram, setOpenDiagram] = useState(null);
  /* AI Agent 심층 모달 — 열려있는 카드 ID (AGENT_MODAL_CONTENT 의 키) */
  const [openAgentInfo, setOpenAgentInfo] = useState(null);
  const particlesRef = useRef(null);
  const featureTimerRef = useRef(null);
  /* 벡터 임베딩 iframe — 스크롤 진입 시에만 로드 (메모리 크래시 방지) */
  const [projectorVisible, setProjectorVisible] = useState(false);
  const projectorRef = useRef(null);

  /* 첫 접속 시 반드시 맨 상단으로 — iframe 로드가 스크롤을 끌어가는 것 방지 */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /* 벡터 임베딩 iframe — 뷰포트 진입 시에만 src 설정 (WebGL 메모리 크래시 방지) */
  useEffect(() => {
    const el = projectorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setProjectorVisible(true); observer.disconnect(); } },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* 스크롤 시 네비게이션 배경 변경 */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* 모바일 메뉴 열릴 때 body 스크롤 잠금 */
  useEffect(() => {
    document.body.style.overflow = isMobileNavOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileNavOpen]);

  /* 파티클 생성 — 마운트 시 1회 */
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    const colors = ['#7c6cf0', '#06d6a0', '#ef476f', '#a78bfa'];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      /* styled-components가 .lp-particle 규칙을 HeroParticles 내부에 정의하므로
         className을 그대로 유지한다 */
      p.className = 'lp-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 8 + 's';
      p.style.animationDuration = (6 + Math.random() * 6) + 's';
      const size = (2 + Math.random() * 4) + 'px';
      p.style.width = size;
      p.style.height = size;
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      container.appendChild(p);
    }
    return () => { container.innerHTML = ''; };
  }, []);

  /* 피처 자동 전환 타이머 */
  useEffect(() => {
    featureTimerRef.current = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % FEATURES.length);
    }, 3000);
    return () => clearInterval(featureTimerRef.current);
  }, []);

  /* 피처 수동 선택 — 타이머 리셋 */
  const selectFeature = useCallback((idx) => {
    setActiveFeature(idx);
    clearInterval(featureTimerRef.current);
    featureTimerRef.current = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % FEATURES.length);
    }, 3000);
  }, []);

  /* Intersection Observer — 스크롤 등장 + 프로그레스 바 */
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('lp-visible');
          /* 프로그레스 바 애니메이션 트리거 */
          entry.target.querySelectorAll('.lp-progress-fill').forEach(bar => {
            bar.style.width = bar.dataset.width + '%';
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.lp-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* 부드러운 앵커 스크롤 핸들러 — 모바일 메뉴도 닫음 */
  const scrollTo = (e, id) => {
    e.preventDefault();
    setIsMobileNavOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* 현재 활성 피처 */
  const f = FEATURES[activeFeature];

  return (
    <S.LandingWrapper>
      {/* 배경 오브 */}
      <S.BgOrb1 />
      <S.BgOrb2 />
      <S.BgOrb3 />

      {/* ── 네비게이션 ── */}
      <S.Nav $scrolled={scrolled}>
        <S.NavLogo>
          <S.NavLogoImg src="/mongle-transparent.png" alt="몽글픽" />
          <span>MONGLEPICK</span>
        </S.NavLogo>
        {/* 데스크톱/태블릿 — 가로 링크 (600px 이하에서 숨김) */}
        <S.NavLinks>
          <a href="#lp-features" onClick={e => scrollTo(e, 'lp-features')}>기능 소개</a>
          <a href="#lp-agent" onClick={e => scrollTo(e, 'lp-agent')}>AI Agent</a>
          <a href="#lp-howto" onClick={e => scrollTo(e, 'lp-howto')}>사용방법</a>
          <a href="#lp-team" onClick={e => scrollTo(e, 'lp-team')}>팀 소개</a>
          <a href="#lp-tech" onClick={e => scrollTo(e, 'lp-tech')}>기술</a>
          <a href="#lp-progress" onClick={e => scrollTo(e, 'lp-progress')}>진행현황</a>
          <a href="#lp-links" onClick={e => scrollTo(e, 'lp-links')}>링크</a>
          <S.NavCta as={Link} to={ROUTES.HOME}>시작하기</S.NavCta>
        </S.NavLinks>
        {/* 모바일 햄버거 버튼 (600px 이하에서만 노출) */}
        <S.NavMobileToggle
          $isOpen={isMobileNavOpen}
          onClick={() => setIsMobileNavOpen(prev => !prev)}
          aria-label="메뉴 열기/닫기"
        >
          <span />
          <span />
          <span />
        </S.NavMobileToggle>
      </S.Nav>
      {/* 모바일 전체화면 메뉴 오버레이 */}
      <S.NavMobileMenu $isOpen={isMobileNavOpen}>
        <a href="#lp-features" onClick={e => scrollTo(e, 'lp-features')}>기능 소개</a>
        <a href="#lp-agent" onClick={e => scrollTo(e, 'lp-agent')}>AI Agent</a>
        <a href="#lp-howto" onClick={e => scrollTo(e, 'lp-howto')}>사용방법</a>
        <a href="#lp-team" onClick={e => scrollTo(e, 'lp-team')}>팀 소개</a>
        <a href="#lp-tech" onClick={e => scrollTo(e, 'lp-tech')}>기술</a>
        <a href="#lp-progress" onClick={e => scrollTo(e, 'lp-progress')}>진행현황</a>
        <a href="#lp-links" onClick={e => scrollTo(e, 'lp-links')}>링크</a>
        <S.NavCta as={Link} to={ROUTES.HOME} onClick={() => setIsMobileNavOpen(false)}>
          시작하기
        </S.NavCta>
      </S.NavMobileMenu>

      {/* ── 히어로 ── */}
      <S.Hero id="lp-hero">
        <S.HeroGrid />
        <S.HeroParticles ref={particlesRef} />

        <S.HeroLayout>
          {/* 좌측 텍스트 */}
          <div>
            <S.HeroBadge>
              <S.HeroBadgeDot />
              AI 영화 추천 서비스
            </S.HeroBadge>
            <S.HeroTitle>
              오늘 기분에<br />
              <span>딱 맞는 영화</span><br />
              AI가 골라드려요
            </S.HeroTitle>
            <S.HeroDesc>
              "오늘 좀 우울한데..." 한 마디면 충분해요.<br />
              몽글픽이 당신의 감정과 취향을 읽고,<br />
              지금 꼭 봐야 할 영화를 찾아드립니다.
            </S.HeroDesc>
            <S.HeroCta>
              {/* BtnPrimary를 Link로 렌더링 */}
              <S.BtnPrimary as={Link} to={ROUTES.HOME}>무료로 시작하기 &rarr;</S.BtnPrimary>
              <S.BtnGlass as="a" href="#lp-features" onClick={e => scrollTo(e, 'lp-features')}>
                서비스 둘러보기
              </S.BtnGlass>
            </S.HeroCta>
            <S.HeroChecks>
              <span><S.CheckIcon>&#10003;</S.CheckIcon> 무료 서비스(부분 유료)</span>
              <span><S.CheckIcon>&#10003;</S.CheckIcon> 소셜 로그인</span>
              <span><S.CheckIcon>&#10003;</S.CheckIcon> OTT 연동</span>
            </S.HeroChecks>
          </div>

          {/* 우측 플로팅 무비카드 */}
          <S.HeroCards>
            {MOVIE_CARDS.map((m) => (
              <S.MovieFloat
                key={m.title}
                style={{
                  top: m.style.top,
                  left: m.style.left,
                  right: m.style.right,
                  /* CSS 변수로 회전각, 지속시간, 지연 전달 */
                  '--rot': m.style.rot + 'deg',
                  '--dur': m.style.dur + 's',
                  '--delay': m.style.delay + 's',
                }}
              >
                <S.MovieFloatPoster>🎬</S.MovieFloatPoster>
                <S.MovieFloatTitle>{m.title}</S.MovieFloatTitle>
                <S.MovieFloatGenre>{m.genre}</S.MovieFloatGenre>
                <S.MovieFloatMeta>
                  <S.MovieFloatRating>⭐ {m.rating}</S.MovieFloatRating>
                  <S.MovieFloatYear>{m.year}</S.MovieFloatYear>
                </S.MovieFloatMeta>
              </S.MovieFloat>
            ))}
          </S.HeroCards>
        </S.HeroLayout>
      </S.Hero>

      {/* ── AI 채팅 데모 ── */}
      <S.ChatDemo id="lp-chat-demo">
        <S.Container>
          <S.ChatDemoLayout>
            <S.Reveal className="lp-reveal">
              <S.SectionLabel>AI Chat</S.SectionLabel>
              <S.SectionTitle>말만 하면<br />바로 추천해드려요</S.SectionTitle>
              <S.SectionSubtitle style={{ marginBottom: 24 }}>
                복잡한 필터 설정 없이 지금 기분을 자연어로 말해보세요.
                감정 분석 AI가 오늘 당신에게 맞는 영화를 찾아드려요.
              </S.SectionSubtitle>
              <S.SectionSubtitle>
                LangGraph 기반 대화 흐름이 의도를 분류하고,
                감정을 분석하고, 취향을 추출해
                SSE 스트리밍으로 실시간 응답합니다.
              </S.SectionSubtitle>
            </S.Reveal>

            {/* 채팅 UI 목업 */}
            <S.Reveal className="lp-reveal" $delay="0.2s">
              <S.ChatWindow>
                <S.ChatWindowHeader>
                  <S.ChatWindowAvatar src="/mongle-transparent.png" alt="몽글픽" />
                  <S.ChatWindowName>몽글 AI</S.ChatWindowName>
                  <S.ChatWindowStatus />
                </S.ChatWindowHeader>
                <S.ChatBubble $isUser>
                  오늘 좀 우울한데... 힐링되는 영화 추천해줘
                </S.ChatBubble>
                <S.ChatBubble>
                  감정이 느껴지네요 🌙 따뜻하게 위로받을 수 있는 영화들을 골라봤어요.
                </S.ChatBubble>
                <S.ChatRecoCards>
                  <S.ChatRecoCard>
                    <S.ChatRecoCardTitle>어바웃 타임</S.ChatRecoCardTitle>
                    <S.ChatRecoCardGenre>로맨스</S.ChatRecoCardGenre>
                    <S.ChatRecoCardBottom>
                      <S.ChatRecoCardRating>⭐ 7.8</S.ChatRecoCardRating>
                      <S.ChatRecoCardOtt>▶ OTT</S.ChatRecoCardOtt>
                    </S.ChatRecoCardBottom>
                  </S.ChatRecoCard>
                  <S.ChatRecoCard>
                    <S.ChatRecoCardTitle>인사이드 아웃</S.ChatRecoCardTitle>
                    <S.ChatRecoCardGenre>애니메이션</S.ChatRecoCardGenre>
                    <S.ChatRecoCardBottom>
                      <S.ChatRecoCardRating>⭐ 8.1</S.ChatRecoCardRating>
                      <S.ChatRecoCardOtt>▶ OTT</S.ChatRecoCardOtt>
                    </S.ChatRecoCardBottom>
                  </S.ChatRecoCard>
                </S.ChatRecoCards>
              </S.ChatWindow>
            </S.Reveal>
          </S.ChatDemoLayout>
        </S.Container>
      </S.ChatDemo>

      {/* ── 핵심 기능 ── */}
      <S.Features id="lp-features">
        <S.Container>
          <S.FeaturesHeader>
            <S.Reveal className="lp-reveal">
              <S.SectionLabel>Key Features</S.SectionLabel>
              <S.SectionTitle>
                영화를 더 즐겁게 만드는<br />
                <S.GradientText>모든 것</S.GradientText>이 담겨있어요
              </S.SectionTitle>
            </S.Reveal>
          </S.FeaturesHeader>

          {/* 피처 필 */}
          <S.Reveal className="lp-reveal">
            <S.FeaturesPills>
              {FEATURES.map((ft, i) => (
                <S.FeaturePill
                  key={ft.title}
                  $active={activeFeature === i}
                  $color={ft.color}
                  onClick={() => selectFeature(i)}
                >
                  {ft.icon} {ft.title}
                </S.FeaturePill>
              ))}
            </S.FeaturesPills>
          </S.Reveal>

          {/* 피처 상세 */}
          <S.Reveal className="lp-reveal">
            <S.FeatureDisplay $accent={f.color}>
              <S.FeatureDisplayIcon>{f.icon}</S.FeatureDisplayIcon>
              <div>
                <S.FeatureDisplayTag $color={f.color}>{f.tag}</S.FeatureDisplayTag>
                <S.FeatureDisplayTitle>{f.title}</S.FeatureDisplayTitle>
                <S.FeatureDisplayDesc>{f.desc}</S.FeatureDisplayDesc>
              </div>
            </S.FeatureDisplay>
          </S.Reveal>

          {/* 미니 그리드 */}
          <S.Reveal className="lp-reveal">
            <S.FeaturesMiniGrid>
              {FEATURES.map((ft, i) => (
                <S.FeatureMini
                  key={ft.title}
                  $active={activeFeature === i}
                  onClick={() => selectFeature(i)}
                >
                  <S.FeatureMiniIcon>{ft.icon}</S.FeatureMiniIcon>
                  <S.FeatureMiniTitle>{ft.title}</S.FeatureMiniTitle>
                </S.FeatureMini>
              ))}
            </S.FeaturesMiniGrid>
          </S.Reveal>
        </S.Container>
      </S.Features>

      {/* ── 사용 방법 3스텝 ── */}
      <S.HowTo id="lp-howto">
        <S.Container>
          <S.HowToHeader>
            <S.Reveal className="lp-reveal">
              <S.SectionLabel>How it works</S.SectionLabel>
              <S.SectionTitle>
                단 3단계로<br />
                <S.GradientText>오늘의 영화</S.GradientText>를 찾아요
              </S.SectionTitle>
            </S.Reveal>
          </S.HowToHeader>
          <S.Reveal className="lp-reveal">
            <S.HowToSteps>
              {[
                { icon: '🎯', num: '01', title: '취향 설정', desc: '장르를 고르고 영화 월드컵으로\n나만의 성향을 알아가요' },
                { icon: '💬', num: '02', title: 'AI와 대화', desc: '오늘 기분, 상황, 원하는 분위기를\n자연어로 말해보세요' },
                { icon: '🍿', num: '03', title: '바로 감상', desc: 'OTT 바로가기, 영화관 예약까지\n한 번에 연결해드려요' },
              ].map((s) => (
                <S.StepCard key={s.num}>
                  {/* className으로 부모의 &:hover .step-circle 셀렉터와 연결 */}
                  <S.StepCircle className="step-circle">{s.icon}</S.StepCircle>
                  <S.StepNum>{s.num}</S.StepNum>
                  <S.StepTitle>{s.title}</S.StepTitle>
                  <S.StepDesc>{s.desc}</S.StepDesc>
                </S.StepCard>
              ))}
            </S.HowToSteps>
          </S.Reveal>
        </S.Container>
      </S.HowTo>

      {/* ── 차별점 ── */}
      <S.Diff>
        <S.Container>
          <S.Reveal className="lp-reveal">
            <S.DiffBox>
              <div>
                <S.SectionLabel>Why Monglepick</S.SectionLabel>
                <S.SectionTitle style={{ marginBottom: 20 }}>
                  다른 추천 서비스와<br />무엇이 다를까요?
                </S.SectionTitle>
                <S.SectionSubtitle>
                  단순한 장르 필터링이 아니에요. 감정, 상황, 취향을
                  종합적으로 분석해 진짜 맞춤 추천을 드려요.
                </S.SectionSubtitle>
              </div>
              <S.DiffItems>
                {[
                  { icon: '🧠', text: '감정 분석 기반 AI 추천', sub: 'LLM 기반 의도+감정 통합 분류 모델 적용' },
                  { icon: '🎮', text: '게임화된 취향 분석', sub: '영화 월드컵 이지선다로 재미있게' },
                  { icon: '💞', text: '시네마 소울메이트 매칭', sub: '취향 유사도 TOP 10 유저 연결' },
                  { icon: '📺', text: 'OTT 통합 연동', sub: '넷플릭스, 왓챠, 디즈니+ 등 한번에' },
                ].map((d) => (
                  <S.DiffItem key={d.text}>
                    <S.DiffItemIcon>{d.icon}</S.DiffItemIcon>
                    <div>
                      <S.DiffItemText>{d.text}</S.DiffItemText>
                      <S.DiffItemSub>{d.sub}</S.DiffItemSub>
                    </div>
                  </S.DiffItem>
                ))}
              </S.DiffItems>
            </S.DiffBox>
          </S.Reveal>
        </S.Container>
      </S.Diff>

      {/* ── 팀 소개 ── */}
      <S.Team id="lp-team">
        <S.Container>
          <S.TeamHeader>
            <S.Reveal className="lp-reveal">
              <S.SectionLabel>Our Team</S.SectionLabel>
              <S.SectionTitle>몽글픽을 만드는 사람들</S.SectionTitle>
              <S.SectionSubtitle style={{ margin: '0 auto' }}>
                각자의 전문 영역에서 하나의 목표를 향해 달리고 있습니다
              </S.SectionSubtitle>
            </S.Reveal>
          </S.TeamHeader>

          <S.TeamGrid>
            {TEAM_MEMBERS.map((m, i) => (
              <S.Reveal
                className="lp-reveal"
                $delay={`${(i + 1) * 0.1}s`}
                key={m.name}
              >
                <S.TeamCard $accent={m.color}>
                  <S.TeamCardTop>
                    {/* 이민수(노랑)는 어두운 텍스트, 나머지는 흰색 */}
                    <S.TeamCardAvatar
                      $bg={m.color}
                      $color={m.color === '#ffd166' ? '#0a0a14' : '#fff'}
                    >
                      {m.initials}
                    </S.TeamCardAvatar>
                    <S.TeamCardInfo>
                      <h3>{m.name}</h3>
                      <S.TeamCardRole $color={m.color}>{m.role}</S.TeamCardRole>
                    </S.TeamCardInfo>
                  </S.TeamCardTop>
                  <S.TeamCardDesc>{m.desc}</S.TeamCardDesc>
                  <S.TeamCardTags>
                    {m.tags.map((t) => (
                      <S.Tag
                        key={t}
                        $bg={m.color + '18'}
                        $border={m.color + '30'}
                        $color={m.color}
                      >
                        {t}
                      </S.Tag>
                    ))}
                  </S.TeamCardTags>
                  <div>
                    <S.ProgressHeader>
                      <S.ProgressLabel>구현 진행률</S.ProgressLabel>
                      <S.ProgressValue $color={m.color}>{m.progress}%</S.ProgressValue>
                    </S.ProgressHeader>
                    <S.ProgressBar>
                      {/* data-width: Intersection Observer에서 width 설정에 사용 */}
                      <S.ProgressFill
                        className="lp-progress-fill"
                        data-width={m.progress}
                        $gradient={`linear-gradient(90deg, ${m.color}, #06d6a0)`}
                      />
                    </S.ProgressBar>
                  </div>
                  <S.TeamCardReq
                    $bg={m.color + '12'}
                    $border={m.color + '25'}
                    $color={m.color}
                  >
                    {m.req}
                  </S.TeamCardReq>
                </S.TeamCard>
              </S.Reveal>
            ))}
          </S.TeamGrid>
        </S.Container>
      </S.Team>

      {/* ── 기술 스택 ── */}
      <S.Tech id="lp-tech">
        <S.Container>
          <S.TechHeader>
            <S.Reveal className="lp-reveal">
              <S.SectionLabel>Tech Stack</S.SectionLabel>
              <S.SectionTitle>검증된 기술의 조합</S.SectionTitle>
            </S.Reveal>
          </S.TechHeader>
          <S.TechCategories>
            {[
              { title: 'AI / LLM', dot: '#7c6cf0', items: ['EXAONE 4.0 32B (한국어 생성)', 'Qwen 3.5 35B (의도/감정/이미지)', 'Upstage Solar (임베딩 4096D)', 'LangGraph StateGraph', 'LangSmith Tracing', 'Ollama (Apple Silicon Metal)'] },
              { title: 'Backend', dot: '#ef476f', items: ['Spring Boot 4.0.3 (Java 21)', 'FastAPI + uvicorn', 'JWT Authentication', 'SSE Streaming', 'structlog Logging'] },
              { title: 'Database (5)', dot: '#118ab2', items: ['MySQL 8.0 (36 Tables)', 'Qdrant (Vector, 4096D)', 'Neo4j 5 (Graph)', 'Elasticsearch 8.17 (Nori)', 'Redis 7 (Cache + Session)'] },
              { title: 'Infrastructure', dot: '#06d6a0', items: ['Docker Compose (Multi VM)', 'Nginx (SSL + SSE Proxy)', 'GitHub Actions CI/CD', 'Prometheus + Grafana + Loki', 'Kakao Cloud (4 VM)'] },
            ].map((cat, i) => (
              <S.Reveal
                className="lp-reveal"
                $delay={`${(i + 1) * 0.1}s`}
                key={cat.title}
              >
                <S.TechCategory>
                  <S.TechCategoryTitle>{cat.title}</S.TechCategoryTitle>
                  <S.TechItems>
                    {cat.items.map((item) => (
                      <S.TechItem key={item}>
                        <S.TechItemDot $bg={cat.dot} />
                        {item}
                      </S.TechItem>
                    ))}
                  </S.TechItems>
                </S.TechCategory>
              </S.Reveal>
            ))}
          </S.TechCategories>
        </S.Container>
      </S.Tech>

      {/* ── 데이터 규모 ── */}
      <S.Data>
        <S.Container>
          <S.DataHeader>
            <S.Reveal className="lp-reveal">
              <S.SectionLabel>Data Scale</S.SectionLabel>
              <S.SectionTitle>117만 편의 영화 데이터</S.SectionTitle>
              <S.SectionSubtitle style={{ margin: '0 auto' }}>
                TMDB, KOBIS, KMDb, Kaggle 4개 소스에서 수집한 방대한 데이터
              </S.SectionSubtitle>
            </S.Reveal>
          </S.DataHeader>
          <S.DataGrid>
            {[
              { value: '1.17M', label: 'TMDB 영화 데이터', sub: '25.6GB JSONL, 39개 필드' },
              { value: '910K', label: '현재 DB 적재', sub: '5개 DB 동기화 + 무드태그' },
              { value: '26M', label: '시청 이력 레코드', sub: '270K 유저 기반 CF' },
              { value: '117K', label: 'KOBIS 영화', sub: '영화진흥위원회 API' },
              { value: '43K', label: 'KMDb 영화', sub: '한국영화데이터베이스' },
              { value: '586K', label: 'Redis 캐시 키', sub: 'CF 캐시 975MB' },
            ].map((d, i) => (
              <S.Reveal
                className="lp-reveal"
                $delay={`${((i % 4) + 1) * 0.1}s`}
                key={d.label}
              >
                <S.DataCard>
                  <S.DataCardValue>{d.value}</S.DataCardValue>
                  <S.DataCardLabel>{d.label}</S.DataCardLabel>
                  <S.DataCardSub>{d.sub}</S.DataCardSub>
                </S.DataCard>
              </S.Reveal>
            ))}
          </S.DataGrid>
        </S.Container>
      </S.Data>

      {/* ── Neo4j 그래프 시각화 (정적 JSON 덤프 + vis-network) ──
          Neo4j HTTP API 로 봉준호 네트워크 / 영화-장르 / 영화-무드태그 쿼리를 실행해
          126노드·176엣지를 graph_dump.json 으로 추출. vis-network 로 인터랙티브 렌더.
          Bolt 포트 불필요, 로딩 즉시 그래프 표시.
          ────────────────────────────────────────────────────────────── */}
      <S.EmbeddingSection>
        <S.Container>
          <S.Reveal className="lp-reveal">
            <S.SectionLabel>Graph Database</S.SectionLabel>
            <S.SectionTitle>Neo4j 그래프 시각화</S.SectionTitle>
            <S.SectionSubtitle style={{ margin: '0 auto' }}>
              봉준호 감독 네트워크를 중심으로 영화-배우-장르-무드 관계 그래프를 탐색합니다
            </S.SectionSubtitle>
          </S.Reveal>
          <S.Reveal className="lp-reveal" $delay="0.15s">
            <S.EmbeddingIframeWrap>
              <iframe
                src="http://210.109.15.187/static/vectors/graph.html"
                title="몽글픽 Neo4j 그래프 시각화 — 봉준호 감독 네트워크"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allow="fullscreen"
                loading="lazy"
              />
            </S.EmbeddingIframeWrap>
            <S.EmbeddingNote>
              상단 버튼으로 <b>봉준호 네트워크</b> / <b>영화-장르</b> / <b>영화-무드태그</b> / <b>전체</b> 전환.
              노드 클릭 시 좌측 하단에 상세 정보 표시. 드래그로 이동, 스크롤로 줌.
              <br />
              Neo4j 5 Community &middot; 노드 126개 &middot; 엣지 176개 &middot;
              vis-network 렌더링
            </S.EmbeddingNote>
          </S.Reveal>
        </S.Container>
      </S.EmbeddingSection>

      {/* ── 벡터 임베딩 시각화 (TF Projector — 새 탭 링크) ──
          WebGL iframe 은 메모리 과다로 페이지 크래시 유발 → 프리뷰 카드 + 새 탭 링크로 전환.
          ────────────────────────────────────────────────────────────── */}
      <S.EmbeddingSection>
        <S.Container>
          <S.Reveal className="lp-reveal">
            <S.SectionLabel>Vector Space</S.SectionLabel>
            <S.SectionTitle>벡터 임베딩 시각화</S.SectionTitle>
            <S.SectionSubtitle style={{ margin: '0 auto' }}>
              Upstage Solar 4096차원 벡터를 3D 공간에 투영해 영화 간 의미적 거리를 직관적으로 탐색합니다
            </S.SectionSubtitle>
          </S.Reveal>
          <S.Reveal className="lp-reveal" $delay="0.15s">
            <S.EmbeddingIframeWrap ref={projectorRef}>
              {projectorVisible ? (
                <iframe
                  src={TF_PROJECTOR_URL}
                  title="몽글픽 영화 임베딩 시각화 — TensorFlow Projector (1,000편 × 200D)"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allow="fullscreen"
                  loading="lazy"
                />
              ) : (
                <S.ProjectorPlaceholder>
                  <S.ProjectorIcon>🔮</S.ProjectorIcon>
                  <div>스크롤하면 벡터 시각화가 로드됩니다...</div>
                </S.ProjectorPlaceholder>
              )}
            </S.EmbeddingIframeWrap>
            <S.EmbeddingNote>
              TensorFlow Embedding Projector — 1,000편 영화 벡터 (Solar 4096D → 200D).
              PCA / t-SNE / UMAP 3D 시각화. 점 클릭으로 유사 영화 탐색.
            </S.EmbeddingNote>
          </S.Reveal>
        </S.Container>
      </S.EmbeddingSection>

      {/* ── 진행 현황 ── */}
      <S.Timeline id="lp-progress">
        <S.Container>
          <S.TimelineHeader>
            <S.Reveal className="lp-reveal">
              <S.SectionLabel>Progress</S.SectionLabel>
              <S.SectionTitle>구현 여정</S.SectionTitle>
            </S.Reveal>
          </S.TimelineHeader>
          <S.Reveal className="lp-reveal">
            <S.TimelineList>
              {[
                /* 진행 현황 — CLAUDE.md 기준 (2026-04-08 업데이트)
                   Phase 0~9 + R-0~R-6 + 관리자 + 활동 리워드까지 모두 완료.
                   현재 운영 환경 다국어 검색 재적재(ML-4)와 LoRA 파인튜닝이 남아있다 */
                { dot: 'done', title: 'Phase 0~4 — 데이터 + RAG + Chat Agent + 추천 엔진', desc: '5DB 하이브리드 RAG, LangGraph 16노드 StateGraph(relation 포함), CF+CBF+MMR 추천 엔진', badge: 'done' },
                { dot: 'done', title: 'Phase 5~8 — Movie Match + 콘텐츠 분석 + 로드맵', desc: 'Movie Match 6노드, 4기능 콘텐츠 분석(포스터/혐오/패턴), 개인화 로드맵 LangGraph, 332 tests pass', badge: 'done' },
                { dot: 'done', title: 'Phase 9 + R-0~R-6 — 결제 + 인증 + 포인트', desc: 'Toss Payments 실연동, JWT/OAuth2, 6등급 팝콘 쿼터, 포인트 단일 재화(1P=10원), 55개 활동 리워드 정책', badge: 'done' },
                { dot: 'done', title: '관리자 페이지 + 운영 도구 (10탭 + 운영 11서브탭)', desc: 'Backend 72 EP 충족, 운영 도구 통합 페이지(사용자 제재/포인트 조정/이용권/앱 공지)', badge: 'done' },
                { dot: 'done', title: '910K건 5DB 적재 + 유저 활동 수집', desc: '910,140건 영화 데이터, 무드태그 보강, 다국어 검색 코드(ML-1~3), 유저 활동 수집 Phase 0~5', badge: 'done' },
                { dot: 'done', title: 'Client 윤형주 영역 + 다크/라이트 모드', desc: '채팅+포인트+결제+고객센터+추천내역+플레이리스트+업적+월드컵+로드맵, 반응형 + 테마 시스템', badge: 'done' },
                { dot: 'active', title: '다국어 검색 Phase ML-4 — 운영 재적재', desc: '운영 서버 Qdrant 임베딩 재적재 + Elasticsearch 인덱스 재생성 진행 중', badge: 'active' },
                { dot: '', title: '몽글이 LoRA 파인튜닝', desc: 'EXAONE 4.0 1.2B 페르소나 파인튜닝 → vLLM 서빙(Tesla T4)', badge: 'pending' },
              ].map((item) => (
                <S.TimelineItem key={item.title}>
                  <S.TimelineDot $variant={item.dot} />
                  <S.TimelineContent>
                    <h4>
                      {item.title}
                      <S.TimelineBadge $variant={item.badge}>
                        {item.badge === 'done' ? '완료' : item.badge === 'active' ? '진행 중' : '예정'}
                      </S.TimelineBadge>
                    </h4>
                    <p>{item.desc}</p>
                  </S.TimelineContent>
                </S.TimelineItem>
              ))}
            </S.TimelineList>
          </S.Reveal>
        </S.Container>
      </S.Timeline>

      {/* ── CTA ── */}
      <S.Cta id="lp-cta">
        <S.Container>
          <S.Reveal className="lp-reveal">
            <S.CtaIcon>🎬</S.CtaIcon>
            <S.CtaTitle>
              오늘 밤 볼 영화,<br />
              <S.GradientText>지금 바로 찾아볼까요?</S.GradientText>
            </S.CtaTitle>
            <S.CtaDesc>
              회원가입하고 나만의 영화 취향을 분석해보세요.<br />
              카카오, 구글, 네이버로 10초 만에 시작할 수 있어요.
            </S.CtaDesc>
            <S.CtaButtons>
              <S.CtaBtnPrimary as={Link} to={ROUTES.HOME}>무료로 시작하기 &rarr;</S.CtaBtnPrimary>
              <S.CtaBtnGlass as="a" href="#lp-features" onClick={e => scrollTo(e, 'lp-features')}>
                더 알아보기
              </S.CtaBtnGlass>
            </S.CtaButtons>
            <S.CtaSub>신용카드 불필요 · 언제든지 탈퇴 가능</S.CtaSub>
          </S.Reveal>
        </S.Container>
      </S.Cta>

      {/* ── 프로젝트 허브 (프로젝트명 + 서비스 링크 + 아키텍처 다이어그램 + 팀 Git) ── */}
      <S.QuickLinks id="lp-links">
        <S.Container>

          {/* ── 프로젝트 공식 명칭 ── */}
          <S.Reveal className="lp-reveal">
            <S.ProjectTitleBlock>
              <S.ProjectAlias>몽글픽</S.ProjectAlias>
              <S.ProjectNameKr>
                사용자 행동 패턴과 자체 데이터를 결합하여 최적의 콘텐츠를 제안하는<br />
                RAG 기반 파인튜닝 LLM(EXAONE 4.0 LoRA) AI컨텐츠 추천 플랫폼
              </S.ProjectNameKr>
              <S.ProjectNameEn>
                AI Content Recommendation Platform Using a RAG-Based Fine-Tuned LLM
                (EXAONE 4.0 LoRA) to Deliver Optimal Content Through the Integration
                of User Behavior Patterns and Proprietary Data
              </S.ProjectNameEn>
            </S.ProjectTitleBlock>
          </S.Reveal>

          {/* ── 서비스 관리 & 모니터링 (프로젝트명 바로 아래) ── */}
          <S.Reveal className="lp-reveal">
            <S.QLSubTitle>서비스 관리 & 모니터링</S.QLSubTitle>
            <S.QLServiceGrid>
              {QUICK_LINKS.services.map((s) => (
                <S.QLServiceCard key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">
                  <S.QLServiceIcon>{s.icon}</S.QLServiceIcon>
                  <S.QLServiceInfo>
                    <S.QLServiceLabel>{s.label}</S.QLServiceLabel>
                    <S.QLServiceDesc>{s.desc}</S.QLServiceDesc>
                  </S.QLServiceInfo>
                  <S.QLArrow>&rarr;</S.QLArrow>
                </S.QLServiceCard>
              ))}
            </S.QLServiceGrid>
          </S.Reveal>

          {/* ── 아키텍처 & 다이어그램 — 카드 그리드 (클릭 시 모달) ── */}
          <S.Reveal className="lp-reveal">
            <S.DiagramSection>
              <S.DiagramTitle>Architecture & Diagrams</S.DiagramTitle>
              <S.DiagramDesc>카드를 클릭하면 상세 다이어그램을 확인할 수 있어요</S.DiagramDesc>
              <S.DiagramCardGrid>
                {/* 기획 문서 */}
                <S.DiagramCard $color="#FF6B35" onClick={() => setIsIAOpen(true)}>
                  <S.DiagramCardIcon $color="#FF6B35">📐</S.DiagramCardIcon>
                  <S.DiagramCardTitle>정보구조도 (IA)</S.DiagramCardTitle>
                  <S.DiagramCardSub>전체 서비스 정보 구조 트리</S.DiagramCardSub>
                </S.DiagramCard>
                <S.DiagramCard $color="#7c6cf0" onClick={() => setIsPlanningOpen(true)}>
                  <S.DiagramCardIcon $color="#7c6cf0">📋</S.DiagramCardIcon>
                  <S.DiagramCardTitle>초기 기획서</S.DiagramCardTitle>
                  <S.DiagramCardSub>기획 의도 · 핵심 기능 · 목표</S.DiagramCardSub>
                </S.DiagramCard>
                {/* 아키텍처 & 다이어그램 */}
                {[
                  { id: 'infra-svg',   icon: '🏗️', title: 'Infrastructure',     sub: '4-VM 서비스 토폴로지',        color: '#06d6a0' },
                  { id: 'infra-prod',  icon: '☁️', title: 'Production Infra',   sub: '카카오 클라우드 VPC 4-VM',    color: '#118ab2' },
                  { id: 'infra-stage', icon: '🐳', title: 'Staging Infra',      sub: 'MacBook Air Docker 환경',     color: '#45B7D1' },
                  { id: 'infra-full',  icon: '🔄', title: 'Full Architecture',  sub: '스테이징 → 프로덕션 전체',    color: '#4ECDC4' },
                  { id: 'erd-svg',     icon: '🗄️', title: 'ERD Overview',       sub: '8개 도메인 그룹 관계도',      color: '#7c6cf0' },
                  { id: 'erd-img',     icon: '📊', title: 'ERD Diagram',        sub: 'MySQL 85개 테이블 전체',       color: '#a78bfa' },
                  { id: 'code',        icon: '📂', title: 'Code Structure',     sub: '5개 서비스 디렉터리 구조',    color: '#ef476f' },
                  { id: 'agent',       icon: '🤖', title: 'Chat Agent Graph',   sub: 'LangGraph 16노드 흐름',       color: '#ffd166' },
                  { id: 'rag',         icon: '🔍', title: 'RAG Pipeline',       sub: 'Qdrant+ES+Neo4j → RRF',       color: '#f97316' },
                  { id: 'screen',      icon: '🎨', title: 'Screen Design',      sub: 'UI/UX 화면설계서',            color: '#DDA0DD' },
                ].map((d) => (
                  <S.DiagramCard key={d.id} $color={d.color} onClick={() => setOpenDiagram(d.id)}>
                    <S.DiagramCardIcon $color={d.color}>{d.icon}</S.DiagramCardIcon>
                    <S.DiagramCardTitle>{d.title}</S.DiagramCardTitle>
                    <S.DiagramCardSub>{d.sub}</S.DiagramCardSub>
                  </S.DiagramCard>
                ))}
              </S.DiagramCardGrid>
            </S.DiagramSection>
          </S.Reveal>

          {/* ── AI Agent Deep Dive (Architecture & Diagrams 바로 아래 배치) ── */}
          <S.Reveal className="lp-reveal" style={{ textAlign: 'center', marginTop: 60, marginBottom: 36 }}>
            <S.SectionLabel>AI Agent · Deep Dive</S.SectionLabel>
            <S.SectionTitle>
              "오늘 우울해" 한 마디가<br />
              <S.GradientText>추천 5편</S.GradientText>이 되기까지
            </S.SectionTitle>
            <S.SectionSubtitle style={{ margin: '12px auto 0' }}>
              몽글픽 에이전트가 어떻게 동작하는지 카드별로 풀어드려요. 클릭하면 더 깊이 들어갑니다.
            </S.SectionSubtitle>
          </S.Reveal>
          <S.Reveal className="lp-reveal" $delay="0.1s">
            <S.DiagramCardGrid>
              {AGENT_DEEP_CARDS.map((c) => (
                <S.DiagramCard
                  key={c.id}
                  $color={c.color}
                  onClick={() => setOpenAgentInfo(c.id)}
                >
                  <S.DiagramCardIcon $color={c.color}>{c.icon}</S.DiagramCardIcon>
                  <S.DiagramCardTitle>{c.title}</S.DiagramCardTitle>
                  <S.DiagramCardSub>{c.sub}</S.DiagramCardSub>
                </S.DiagramCard>
              ))}
            </S.DiagramCardGrid>
          </S.Reveal>

          {/* ── 팀원 GitHub ── */}
          <S.Reveal className="lp-reveal" $delay="0.1s">
            <S.QLSubTitle>팀원 GitHub</S.QLSubTitle>
            <S.QLMemberGrid>
              {QUICK_LINKS.members.map((m) => (
                <S.QLMemberCard key={m.name} $accent={m.color}>
                  <S.QLMemberAvatar $bg={m.color}>
                    {m.name.charAt(0)}
                  </S.QLMemberAvatar>
                  <S.QLMemberInfo>
                    <S.QLMemberName>{m.name}</S.QLMemberName>
                    <S.QLMemberRole>{m.role}</S.QLMemberRole>
                  </S.QLMemberInfo>
                  <S.QLMemberLinks>
                    {m.links.map((l) => (
                      <S.QLMemberLink
                        key={l.label}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        $color={m.color}
                      >
                        {l.label}
                      </S.QLMemberLink>
                    ))}
                  </S.QLMemberLinks>
                </S.QLMemberCard>
              ))}
            </S.QLMemberGrid>
          </S.Reveal>

          {/* ── 프로젝트 레포지토리 ── */}
          <S.Reveal className="lp-reveal" $delay="0.2s">
            <S.QLSubTitle>프로젝트 레포지토리</S.QLSubTitle>
            <S.QLRepoGrid>
              {QUICK_LINKS.repos.map((r) => (
                <S.QLRepoCard key={r.label} href={r.url} target="_blank" rel="noopener noreferrer">
                  <S.QLRepoIcon>
                    <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                  </S.QLRepoIcon>
                  <div>
                    <S.QLRepoName>{r.label}</S.QLRepoName>
                    <S.QLRepoDesc>{r.desc}</S.QLRepoDesc>
                  </div>
                </S.QLRepoCard>
              ))}
            </S.QLRepoGrid>
          </S.Reveal>
        </S.Container>
      </S.QuickLinks>

      {/* ── 푸터 ── */}
      <S.LpFooter>
        <S.Container>
          <S.FooterInner>
            <S.FooterText><span>MONGLEPICK</span> — AI Movie Recommendation Platform</S.FooterText>
            <S.FooterLinks>
              <span>이용약관</span>
              <span>개인정보처리방침</span>
              <span>고객센터</span>
            </S.FooterLinks>
            <S.FooterText>&copy; 2026 몽글픽. All rights reserved.</S.FooterText>
          </S.FooterInner>
        </S.Container>
      </S.LpFooter>

      {/* ── AI Agent 심층 정보 모달 (8종 동적 렌더) ── */}
      <AgentInfoModal
        isOpen={openAgentInfo !== null}
        onClose={() => setOpenAgentInfo(null)}
        content={openAgentInfo ? AGENT_MODAL_CONTENT[openAgentInfo] : null}
      />

      {/* ── 정보구조도 모달 ── */}
      <IAModal isOpen={isIAOpen} onClose={() => setIsIAOpen(false)} />

      {/* ── 초기 기획서 모달 ── */}
      <PlanningModal isOpen={isPlanningOpen} onClose={() => setIsPlanningOpen(false)} />

      {/* ── 다이어그램 모달 10종 ── */}
      <DiagramModal
        isOpen={openDiagram === 'infra-svg'}
        onClose={() => setOpenDiagram(null)}
        title="Infrastructure Architecture"
        desc="카카오 클라우드 4-VM 기반 서비스 토폴로지"
      >
        <InfraArchDiagram />
      </DiagramModal>

      <DiagramModal
        isOpen={openDiagram === 'infra-prod'}
        onClose={() => setOpenDiagram(null)}
        title="Production Infrastructure"
        desc="카카오 클라우드 VPC 4-VM 프로덕션 구성"
      >
        <S.DiagramImage src="/diagrams/infra_production.png" alt="프로덕션 인프라" />
      </DiagramModal>

      <DiagramModal
        isOpen={openDiagram === 'infra-stage'}
        onClose={() => setOpenDiagram(null)}
        title="Staging Infrastructure"
        desc="MacBook Air Docker 기반 스테이징 환경"
      >
        <S.DiagramImage src="/diagrams/infra_staging.png" alt="스테이징 인프라" />
      </DiagramModal>

      <DiagramModal
        isOpen={openDiagram === 'infra-full'}
        onClose={() => setOpenDiagram(null)}
        title="Full Architecture"
        desc="스테이징 → 프로덕션 전체 인프라 흐름"
      >
        <S.DiagramImage src="/diagrams/infra_full.png" alt="전체 인프라" />
      </DiagramModal>

      <DiagramModal
        isOpen={openDiagram === 'erd-svg'}
        onClose={() => setOpenDiagram(null)}
        title="ERD Overview"
        desc="85개 테이블 · 8개 도메인 그룹 관계도"
      >
        <ERDDiagram />
      </DiagramModal>

      <DiagramModal
        isOpen={openDiagram === 'erd-img'}
        onClose={() => setOpenDiagram(null)}
        title="ERD Diagram"
        desc="MySQL 85개 테이블 전체 ERD"
      >
        <S.DiagramImage src="/diagrams/monglepick_ERD.png" alt="몽글픽 ERD" />
      </DiagramModal>

      <DiagramModal
        isOpen={openDiagram === 'code'}
        onClose={() => setOpenDiagram(null)}
        title="Code Structure"
        desc="5개 서비스 · 주요 디렉터리 구조"
      >
        <CodeStructDiagram />
      </DiagramModal>

      <DiagramModal
        isOpen={openDiagram === 'agent'}
        onClose={() => setOpenDiagram(null)}
        title="Chat Agent Graph"
        desc="LangGraph 16노드 StateGraph · 4분기 처리 흐름"
      >
        <AgentFlowDiagram />
      </DiagramModal>

      <DiagramModal
        isOpen={openDiagram === 'rag'}
        onClose={() => setOpenDiagram(null)}
        title="RAG Pipeline"
        desc="Qdrant + Elasticsearch + Neo4j → RRF 하이브리드 검색"
      >
        <RAGDiagram />
      </DiagramModal>

      <DiagramModal
        isOpen={openDiagram === 'screen'}
        onClose={() => setOpenDiagram(null)}
        title="Screen Design"
        desc="UI/UX 화면설계서"
      >
        <S.DiagramImage src="/diagrams/screen_design.png" alt="화면설계" />
      </DiagramModal>
    </S.LandingWrapper>
  );
}
