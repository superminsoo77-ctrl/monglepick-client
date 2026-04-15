/**
 * Agent 상세 정보 모달.
 *
 * DiagramModal 이 SVG/이미지 위주라면, AgentInfoModal 은 텍스트 중심의
 * "심층 설명 카드"를 모달로 표시한다.
 *
 * 구성 요소:
 *   - 헤더(제목 + 설명 + accent 컬러바)
 *   - 핵심 스탯 칩(예: "16 nodes", "Avg p95 4.2s")
 *   - 섹션(섹션 제목 + 본문 / 리스트 / 코드 블록 / 표)
 *   - 닫기 버튼 + ESC 닫기 + 오버레이 클릭 닫기 + body 스크롤 잠금
 *
 * 사용:
 *   <AgentInfoModal isOpen={open} onClose={...} content={CONTENT.chatAgent} />
 *
 * content 스키마는 파일 하단의 AGENT_MODAL_CONTENT 참조.
 */

import { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

/* ──────────────────────────────────────────────────────────────
   1. 모달 컴포넌트
   ────────────────────────────────────────────────────────────── */

export default function AgentInfoModal({ isOpen, onClose, content }) {
  /* ESC 닫기 + body 스크롤 잠금 */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !content) return null;

  const accent = content.color || '#7c6cf0';

  return (
    <Overlay onClick={onClose}>
      <ModalBox $accent={accent} onClick={(e) => e.stopPropagation()}>
        {/* 닫기 */}
        <CloseBtn onClick={onClose} aria-label="닫기">&times;</CloseBtn>

        {/* 헤더 */}
        <Header>
          <HeaderIcon $accent={accent}>{content.icon}</HeaderIcon>
          <HeaderText>
            {content.tag && <HeaderTag $accent={accent}>{content.tag}</HeaderTag>}
            <HeaderTitle>{content.title}</HeaderTitle>
            {content.desc && <HeaderDesc>{content.desc}</HeaderDesc>}
          </HeaderText>
        </Header>

        {/* 핵심 스탯 칩 */}
        {content.stats && content.stats.length > 0 && (
          <StatRow>
            {content.stats.map((s) => (
              <StatChip key={s.label} $accent={accent}>
                <StatValue $accent={accent}>{s.value}</StatValue>
                <StatLabel>{s.label}</StatLabel>
              </StatChip>
            ))}
          </StatRow>
        )}

        {/* 섹션들 */}
        <Body>
          {(content.sections || []).map((sec, i) => (
            <Section key={i} $accent={accent}>
              <SectionTitle $accent={accent}>{sec.title}</SectionTitle>
              {/* 텍스트 본문 */}
              {sec.text && <SectionText>{sec.text}</SectionText>}

              {/* 단순 리스트 */}
              {sec.list && (
                <SectionList>
                  {sec.list.map((item, j) => (
                    <li key={j}>
                      {typeof item === 'string' ? item : (
                        <>
                          {item.label && <LiLabel>{item.label}</LiLabel>}
                          {item.value && <LiValue>{item.value}</LiValue>}
                          {item.sub && <LiSub>{item.sub}</LiSub>}
                        </>
                      )}
                    </li>
                  ))}
                </SectionList>
              )}

              {/* 단계 노드 (가로 흐름) */}
              {sec.steps && (
                <Steps>
                  {sec.steps.map((step, j) => (
                    <Step key={j} $accent={accent}>
                      <StepNum $accent={accent}>{j + 1}</StepNum>
                      <StepTitle>{step.title}</StepTitle>
                      {step.desc && <StepDesc>{step.desc}</StepDesc>}
                    </Step>
                  ))}
                </Steps>
              )}

              {/* 표 */}
              {sec.table && (
                <Table>
                  <thead>
                    <tr>
                      {sec.table.headers.map((h) => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {sec.table.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => <td key={c}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {/* 코드 블록 */}
              {sec.code && (
                <CodeBlock>
                  {sec.code}
                </CodeBlock>
              )}

              {/* 강조 박스 */}
              {sec.note && (
                <Note $accent={accent}>
                  <NoteIcon>💡</NoteIcon>
                  <span>{sec.note}</span>
                </Note>
              )}
            </Section>
          ))}
        </Body>
      </ModalBox>
    </Overlay>
  );
}


/* ──────────────────────────────────────────────────────────────
   2. styled-components
   ────────────────────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: ${fadeIn} 0.2s ease;
`;

const ModalBox = styled.div`
  position: relative;
  width: 100%;
  max-width: 880px;
  max-height: 90vh;
  overflow-y: auto;
  background: linear-gradient(180deg, #11111c 0%, #0a0a14 100%);
  border-radius: 22px;
  border: 1px solid ${({ $accent }) => `${$accent}33`};
  box-shadow: 0 30px 80px rgba(0,0,0,0.6),
              0 0 0 1px ${({ $accent }) => `${$accent}18`};
  padding: 32px 32px 28px;
  animation: ${slideUp} 0.28s ease;
  color: #e8e8f0;
  font-family: 'Noto Sans KR', sans-serif;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

  @media (max-width: 640px) {
    padding: 24px 16px 18px;
    max-height: 92vh;
    border-radius: 18px;
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: #aaa;
  font-size: 24px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  z-index: 2;
  &:hover { background: rgba(255, 255, 255, 0.13); color: #fff; transform: rotate(90deg); }
`;

const Header = styled.div`
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  padding-right: 44px;
`;

const HeaderIcon = styled.div`
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: ${({ $accent }) => `linear-gradient(135deg, ${$accent}33, ${$accent}10)`};
  border: 1px solid ${({ $accent }) => `${$accent}55`};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
`;

const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;

const HeaderTag = styled.div`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ $accent }) => $accent};
  background: ${({ $accent }) => `${$accent}1c`};
  border: 1px solid ${({ $accent }) => `${$accent}40`};
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 8px;
`;

const HeaderTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 6px;
  color: #f3f3fa;
  font-family: 'Inter', 'Noto Sans KR', sans-serif;
  line-height: 1.3;
`;

const HeaderDesc = styled.p`
  font-size: 14px;
  color: #9696b0;
  margin: 0;
  line-height: 1.55;
`;

const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 22px;
`;

const StatChip = styled.div`
  background: rgba(255,255,255,0.025);
  border: 1px solid ${({ $accent }) => `${$accent}28`};
  border-radius: 12px;
  padding: 12px 14px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: ${({ $accent }) => $accent};
  font-family: 'Inter', sans-serif;
  line-height: 1.2;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: #8a8aa3;
  margin-top: 4px;
  letter-spacing: 0.02em;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const Section = styled.section`
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-left: 3px solid ${({ $accent }) => `${$accent}80`};
  border-radius: 12px;
  padding: 16px 18px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 10px;
  color: ${({ $accent }) => $accent};
  letter-spacing: 0.02em;
`;

const SectionText = styled.p`
  font-size: 13.5px;
  color: #c8c8dd;
  margin: 0;
  line-height: 1.65;
`;

const SectionList = styled.ul`
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    font-size: 13px;
    color: #c8c8dd;
    line-height: 1.55;
    padding-left: 18px;
    position: relative;
    &::before {
      content: '▸';
      position: absolute;
      left: 0;
      top: 0;
      color: rgba(255,255,255,0.3);
      font-size: 11px;
    }
  }
`;

const LiLabel = styled.span`
  font-weight: 700;
  color: #e0e0f0;
  margin-right: 8px;
`;

const LiValue = styled.span`
  color: #c8c8dd;
`;

const LiSub = styled.span`
  display: block;
  font-size: 12px;
  color: #7a7a92;
  margin-top: 2px;
`;

const Steps = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 4px;
`;

const Step = styled.div`
  background: rgba(0,0,0,0.25);
  border: 1px solid ${({ $accent }) => `${$accent}25`};
  border-radius: 10px;
  padding: 12px;
  position: relative;
`;

const StepNum = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: ${({ $accent }) => `${$accent}22`};
  color: ${({ $accent }) => $accent};
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  font-family: 'Inter', sans-serif;
`;

const StepTitle = styled.div`
  font-size: 12.5px;
  font-weight: 700;
  color: #e8e8f0;
  margin-bottom: 4px;
`;

const StepDesc = styled.div`
  font-size: 11.5px;
  color: #8a8aa3;
  line-height: 1.5;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  margin-top: 6px;

  th {
    text-align: left;
    padding: 8px 10px;
    color: #b0b0c8;
    font-weight: 700;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    font-size: 11.5px;
    letter-spacing: 0.02em;
  }
  td {
    padding: 8px 10px;
    color: #c8c8dd;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    line-height: 1.5;
  }
  tr:last-child td { border-bottom: none; }
`;

const CodeBlock = styled.pre`
  background: rgba(0,0,0,0.45);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 12px;
  color: #c8e8d4;
  font-family: 'JetBrains Mono', 'Fira Code', Menlo, monospace;
  overflow-x: auto;
  line-height: 1.6;
  margin: 6px 0 0;
  white-space: pre;
`;

const Note = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: ${({ $accent }) => `${$accent}10`};
  border: 1px solid ${({ $accent }) => `${$accent}30`};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12.5px;
  color: #d8d8e8;
  margin-top: 10px;
  line-height: 1.55;
`;

const NoteIcon = styled.span`
  flex-shrink: 0;
`;


/* ──────────────────────────────────────────────────────────────
   3. 모달 콘텐츠 데이터 (8종)
   ──────────────────────────────────────────────────────────────
   모든 수치/구조는 CLAUDE.md + docs/AI_Agent_설계_및_구현계획서.md 기준.
*/

export const AGENT_MODAL_CONTENT = {

  /* ─────────── 1. Chat Agent 16노드 ─────────── */
  chatAgent: {
    icon: '💬',
    tag: 'CHAT AGENT',
    title: 'Chat Agent · LangGraph 16노드 그래프',
    desc: '의도/감정을 분류하고 4갈래로 흐름을 분기해 SSE 로 실시간 응답하는 대화형 추천 에이전트',
    color: '#ef476f',
    stats: [
      { value: '16', label: 'StateGraph 노드' },
      { value: '4', label: '의도 분기' },
      { value: 'SSE', label: '실시간 스트리밍' },
      { value: '8', label: '이벤트 종류' },
    ],
    sections: [
      {
        title: '🧭 처리 흐름 (4 분기)',
        steps: [
          { title: 'recommend / search', desc: '선호 추출 → 쿼리빌더 → RAG → LLM 리랭커 → 추천' },
          { title: 'relation', desc: 'Neo4j 멀티홉 (감독 ↔ 배우 ↔ 작품)' },
          { title: 'general', desc: '몽글이 페르소나 자유 대화 (vLLM EXAONE 1.2B)' },
          { title: 'info / theater / booking', desc: 'LangChain Tools 7종 호출' },
        ],
      },
      {
        title: '🧱 16개 노드 구성',
        list: [
          { label: '진입', value: 'context_loader · route_has_image · image_analyzer (vLLM Vision)' },
          { label: '분류', value: 'intent_emotion_classifier (Qwen 3.5 35B) · route_after_intent' },
          { label: '추천 경로', value: 'preference_refiner · query_builder · rag_retriever · retrieval_quality_checker · llm_reranker · recommendation_ranker · explanation_generator' },
          { label: '재질문 경로', value: 'question_generator (Solar API json_schema · 카드형 옵션 자동 생성)' },
          { label: '관계', value: 'graph_traversal_node (Neo4j chain/intersection/filmography)' },
          { label: '일반/도구', value: 'general_responder · tool_executor_node' },
          { label: '출력', value: 'response_formatter (모든 분기 수렴)' },
        ],
      },
      {
        title: '🎯 Intent-First 설계',
        text: 'ExtractedPreferences 에 user_intent / dynamic_filters / search_keywords 를 함께 추출. 선호 충분성을 OR 조건으로 평가해, 부족하면 question_generator 로 자동 분기해 카드형 옵션을 제안한다.',
        note: 'v3.4 부터 retrieval_quality_checker 임계값 (top_score 0.020 / soft-ambiguous 분기) 으로 "애매하면 무리해서 추천 X, 한 번 더 묻기" 정책 강화',
      },
      {
        title: '🛡️ 회복성',
        list: [
          '모든 노드 try/except — 실패 시 fallback 반환 (에러 전파 금지)',
          'Solar API 실패 → EXAONE 자유 텍스트 → 정적 옵션 2단 fallback',
          'LLM Reranker 10초 타임아웃 시 harmonic + cf 점수만으로 진행',
        ],
      },
    ],
  },

  /* ─────────── 1.5 RAG Pipeline (인덱싱 + 쿼리) ───────────
     - 출처: monglepick-agent/src/monglepick/rag/hybrid_search.py
              monglepick-agent/src/monglepick/agents/chat/nodes.py
              monglepick-agent/src/monglepick/db/clients.py
              monglepick-agent/src/monglepick/data_pipeline/*
     - CLAUDE.md 의 "RAG: Qdrant + ES + Neo4j → RRF k=60", MMR λ=0.7 등 일치 확인. */
  ragPipeline: {
    icon: '🔎',
    tag: 'RAG PIPELINE',
    title: 'Hybrid RAG · Qdrant + Elasticsearch + Neo4j → RRF',
    desc: '벡터 의미 + BM25 키워드 + 그래프 관계 3축을 병렬로 조회하고 RRF 로 융합한 뒤, LLM 리랭커와 MMR 로 정렬해 추천을 만든다',
    color: '#f97316',
    stats: [
      { value: '4096D', label: 'Solar 벡터 차원' },
      { value: 'k=60', label: 'RRF 상수' },
      { value: 'λ=0.7', label: 'MMR 가중치' },
      { value: '3', label: '병렬 백엔드' },
    ],
    sections: [
      /* ── A. 인덱싱 파이프라인 ── */
      {
        title: '🏭 인덱싱 파이프라인 (Cold Path)',
        text: 'TMDB / KOBIS / KMDb / Kaggle 4개 소스를 수집·정제하고, 영화별로 단일 텍스트(title + overview + genres + director + mood_tags)를 만들어 Solar 임베딩(4096D)을 생성한 뒤 5개 DB에 동시 적재한다.',
        steps: [
          { title: '수집', desc: 'tmdb_collector / kobis / kmdb · 117만 편 → 25.6GB JSONL' },
          { title: '정제', desc: 'preprocessor — 장르/무드/메타 정규화, 중복 제거' },
          { title: '임베딩', desc: 'embedder — Upstage Solar embedding-passage (4096D)' },
          { title: '5DB 적재', desc: 'qdrant / es / neo4j / mysql / redis 동시 upsert' },
        ],
        note: '910,140편 적재 완료. ML-4 (운영 재적재) 는 다국어 필드 포함 재임베딩·재색인 단계',
      },

      /* ── B. 3개 백엔드 역할 ── */
      {
        title: '🗂️ 3개 백엔드의 역할 분담',
        table: {
          headers: ['백엔드', '역할', '주요 설정'],
          rows: [
            ['Qdrant', '의미 기반 벡터 검색', 'Cosine · 4096D · payload index(genres/mood_tags/rating/release_year/popularity_score/ott_platforms/original_language/...)'],
            ['Elasticsearch', 'BM25 · 한국어 형태소 + 다국어', 'Nori 분석기 · multi_match(title^3.0, title_en^2.5, alternative_titles^1.5, overview^1.0, overview_en^0.8) · function_score(popularity·vote_count·vote_average)'],
            ['Neo4j', '그래프 관계 탐색', '노드 9종(Movie/Person/Genre/Keyword/MoodTag/OTTPlatform/Studio/Collection/Country) · 관계 8종(HAS_GENRE/HAS_MOOD/DIRECTED/ACTED_IN/HAS_KEYWORD/SIMILAR_TO/HAS_COLLECTION/BELONGS_TO)'],
            ['Redis', '핫 캐시 (세션 + Top-K 캐시)', 'TTL 기반, write-behind'],
            ['MySQL', '메타 단일 진실 원본', '88 테이블 · JPA ddl-auto=update'],
          ],
        },
      },

      /* ── C. 쿼리 파이프라인 노드 흐름 ── */
      {
        title: '🛰️ 쿼리 파이프라인 (Hot Path) — 노드 흐름',
        steps: [
          { title: 'preference_refiner', desc: 'ExtractedPreferences 추출 (intent/genre/mood/dynamic_filters/search_keywords/era)' },
          { title: 'query_builder', desc: 'dynamic_filters → Qdrant payload filter / ES bool filter / Neo4j Cypher WHERE 동시 변환' },
          { title: 'rag_retriever', desc: 'asyncio.gather 로 3 백엔드 병렬 호출 (각 10s 타임아웃, 실패 백엔드만 빈 리스트)' },
          { title: 'RRF Fusion', desc: 'reciprocal_rank_fusion() · k=60 · movie_id 기준 dedup' },
          { title: 'retrieval_quality_checker', desc: '임계값 미달 시 question_generator 로 분기 (재질문)' },
          { title: 'llm_reranker', desc: 'Solar 가 후보 + 사용자 맥락(감정/선호) → 0~1 점수, 실패 시 RRF 만으로 진행' },
          { title: 'recommendation_ranker', desc: 'CF + CBF 가중 합산 → MMR(λ=0.7) 다양성 보장 → Top-N' },
        ],
      },

      /* ── D. 3 백엔드 top_k & 타임아웃 ── */
      {
        title: '⚙️ 백엔드별 top_k · 병렬 호출',
        table: {
          headers: ['백엔드', 'top_k', '타임아웃', '실패 정책'],
          rows: [
            ['Qdrant', '30', '10s', '빈 리스트 반환 → 다른 두 소스로만 RRF'],
            ['Elasticsearch', '20', '10s', '동일'],
            ['Neo4j', '15', '10s', '동일'],
          ],
        },
        text: '세 호출은 asyncio.gather 로 병렬. 한 백엔드가 실패해도 나머지로 정상 응답.',
      },

      /* ── E. RRF 공식 ── */
      {
        title: '🔄 RRF (Reciprocal Rank Fusion) 공식',
        code: `# rag/hybrid_search.py :: reciprocal_rank_fusion()
RRF_K = 60   # config.py:250

score(d) = Σ_i  1 / (RRF_K + rank_i(d))

# i ∈ {qdrant, es, neo4j}
# rank_i(d) : 백엔드 i 의 결과 내 랭크 (1-base)
# dedup key : movie_id  (가장 풍부한 metadata 보존)`,
        note: 'k=60 은 상위권 차이를 부드럽게 평탄화 — 백엔드 간 점수 스케일 차이를 흡수',
      },

      /* ── F. retrieval_quality_checker 임계값 ── */
      {
        title: '🩺 retrieval_quality_checker — 분기 임계값',
        table: {
          headers: ['임계값', '값', '의미'],
          rows: [
            ['RETRIEVAL_MIN_CANDIDATES', '3편', '후보 수 미달 시 재질문'],
            ['RETRIEVAL_MIN_TOP_SCORE', '0.010', '최상위 RRF 점수 (2026-04-15: 0.015 → 0.010 하향)'],
            ['RETRIEVAL_QUALITY_MIN_AVG', '0.008', '상위 5개 평균 RRF'],
            ['RETRIEVAL_SOFT_AMBIGUOUS_TOP_SCORE', '0.020', 'turn<3 이고 애매하면 → question_generator 우선'],
            ['SUFFICIENCY_THRESHOLD', '2.0', '선호 필드 가중치 합 (genre 1 + mood 0.8 + ...)'],
          ],
        },
        text: '품질 미달 → 무리하게 추천하지 않고 한 번 더 묻는 정책 (v3.4).',
      },

      /* ── G. LLM Reranker ── */
      {
        title: '🤖 LLM Reranker (Solar API)',
        list: [
          'Top-10 후보 + 사용자 감정/선호 컨텍스트를 단일 프롬프트로 묶어 배치 스코어링',
          '구조화 출력 (JSON Schema) 로 0~1 점수 + 짧은 근거',
          'guarded_ainvoke 로 timeout / 재시도 / 예외 격리',
          '실패 시 RRF 점수만으로 폴백 → 응답 누락 없음',
        ],
      },

      /* ── H. recommendation_ranker / MMR ── */
      {
        title: '🎲 MMR — 다양성 보장 정렬',
        code: `# config.py :: MMR_LAMBDA = 0.7
# nodes.py :: recommendation_ranker

MMR(c) = λ · relevance(c)
       − (1 − λ) · max( sim(c, s) for s in selected )

# λ = 0.7  → 관련성 70%, 다양성 30%
# relevance = LLM_rerank · w_llm + RRF · w_rrf
# sim       = 장르/무드/감독 자카드 평균`,
        note: '같은 감독·장르가 결과 상단에 몰리는 현상을 자동으로 분산',
      },

      /* ── I. 4단계 완화 ── */
      {
        title: '🪜 검색 완화 4 단계',
        list: [
          { label: 'Stage 1', value: '정상 hybrid_search — 모든 dynamic_filter 적용' },
          { label: 'Stage 2', value: 'similar_fallback_search — 1차 후보의 장르/무드/키워드를 자동 확장 재검색' },
          { label: 'Stage 3', value: 'soft-ambiguous 분기 — turn_count<3 + top_score<0.020 이면 question_generator 우선' },
          { label: 'Stage 4', value: 'general_responder 폴백 — 검색이 끝까지 부족하면 몽글이 페르소나 자유 응답' },
        ],
      },

      /* ── J. 그래프 멀티홉 패턴 ── */
      {
        title: '🕸️ Neo4j 멀티홉 패턴 (relation Intent)',
        table: {
          headers: ['패턴', '예시 쿼리', 'Cypher 핵심'],
          rows: [
            ['filmography', '"봉준호 감독 작품"', 'MATCH (p:Person {name})-[:DIRECTED]->(m:Movie) ORDER BY m.rating DESC'],
            ['intersection', '"최민식 + 송강호 같이 나온 영화"', 'MATCH (a:Person)-[:ACTED_IN]->(m)<-[:ACTED_IN]-(b:Person) WHERE a.name=$x AND b.name=$y'],
            ['chain', '"봉준호 스릴러에 나온 배우의 다른 영화"', 'MATCH (d:Person {name:$dir})-[:DIRECTED]->(m1)<-[:ACTED_IN]-(actor)-[:ACTED_IN]->(m2:Movie) WHERE m1.genre CONTAINS $g'],
          ],
        },
      },

      /* ── K. 다국어 검색 ML-1~3 ── */
      {
        title: '🌐 다국어 검색 (Phase ML-1 ~ ML-4)',
        list: [
          'ML-1~3: ES 인덱스에 title_en(^2.5) · overview_en(^0.8) · alternative_titles(^1.5) 다중 필드 색인 + tie_breaker 0.3',
          '단일 Solar 임베딩(다국어 학습)으로 4096D 벡터 1개를 유지 (모델당 인덱스 분할 X)',
          'ML-4 (운영 재적재): 운영 Qdrant/ES 를 다국어 메타데이터 포함으로 전량 재임베딩 + 재색인',
        ],
        note: '실행 가이드: docs/Phase_ML-4_DB재적재_실행가이드.md',
      },

      /* ── L. 추가 신호 ── */
      {
        title: '✨ 추가 신호 (ranking signals)',
        list: [
          { label: '인기도', value: 'ES function_score · log1p(popularity_score) factor 0.1' },
          { label: '평점',   value: 'vote_average factor 0.03 · vote_count factor 0.05' },
          { label: '무드',   value: 'Neo4j HAS_MOOD 매치 횟수 → mood_match DESC 정렬 + CBF 가중치' },
          { label: 'OTT',    value: 'ott_filter payload — 가입 OTT 만 우선' },
          { label: '연도/언어', value: 'dynamic_filters 의 release_year/original_language 로 사전 필터링' },
        ],
      },
    ],
  },

  /* ─────────── 2. Movie Match Agent v3 ─────────── */
  matchAgent: {
    icon: '🎬',
    tag: 'MOVIE MATCH',
    title: 'Movie Match Agent v3 · 둘이 영화 고르기',
    desc: '두 영화의 취향 교차점을 LLM 리랭커 + 하모닉 유사도 + Co-watched CF 로 융합해 5편을 추천',
    color: '#a78bfa',
    stats: [
      { value: '7', label: '노드' },
      { value: '5', label: '추천 결과' },
      { value: '4', label: '완화 단계' },
      { value: '0.5', label: 'LLM 가중치' },
    ],
    sections: [
      {
        title: '🧮 스코어링 공식',
        text: '결측 시 자동 재정규화. LLM 리랭커가 실패해도 harmonic + CF 만으로 안전하게 동작.',
        code: `final = 0.5 · llm + 0.3 · harmonic + 0.2 · cf

harmonic_sim = harmonic_mean(s1, s2)
             × (0.7 + 0.3 · (1 − |s1 − s2|))

similarity   = 0.35 · genre
             + 0.25 · mood
             + 0.15 · keyword
             + 0.25 · vector`,
      },
      {
        title: '🔍 후보 수집 (병렬 RRF)',
        list: [
          { label: 'Vector Centroid', value: '(vec_A + vec_B) / 2 정규화 → Qdrant Top-K' },
          { label: '하이브리드 RRF', value: 'Qdrant + ES + Neo4j 결합' },
          { label: 'Co-watched CF', value: 'reviews INNER JOIN → 둘 다 본 사용자 기반' },
          { label: '4단계 완화', value: '결과 부족 시 stage 1 → 2 → 3 → 4 자동 확장' },
        ],
      },
      {
        title: '🤖 LLM Reranker (Solar API)',
        text: '후보를 0~1 점수로 배치 스코어링. 10초 타임아웃, 실패 시 fallback. Prometheus 메트릭(match_llm_reranker_*)으로 호출/실패율 추적.',
      },
      {
        title: '📊 Prometheus 메트릭',
        list: [
          'match_requests_total — 매칭 요청 수',
          'match_duration_seconds — p50/p95/p99 지연',
          'match_llm_reranker_calls_total / errors_total',
          'match_cowatch_hits_total — CF 후보 히트',
          'match_candidate_source_total{source=vector|rrf|cowatch}',
        ],
      },
    ],
  },

  /* ─────────── 3. Content Analysis Agent ─────────── */
  contentAgent: {
    icon: '🖼️',
    tag: 'CONTENT ANALYSIS',
    title: 'Content Analysis Agent · 4기능 콘텐츠 분석',
    desc: '포스터 분석으로 리뷰 초안을 짜고, 비속어/혐오를 차단하며, 사용자 작성 패턴을 분석',
    color: '#f97316',
    stats: [
      { value: '4', label: '핵심 기능' },
      { value: 'Vision', label: 'Qwen 3.5 35B' },
      { value: 'P50', label: '< 3.0s' },
    ],
    sections: [
      {
        title: '🎨 포스터 분석 → 리뷰 초안',
        list: [
          'POST /api/v1/content/poster-analysis',
          '이미지 URL → Qwen 3.5 35B 비전 모델 분석',
          '톤(감성/유머/시니컬) + 키워드 + 한 문장 인상 추출',
          'EXAONE 4.0 32B 가 톤에 맞춰 리뷰 초안 3줄 생성',
        ],
      },
      {
        title: '🚫 비속어/혐오 검출',
        list: [
          'POST /api/v1/content/toxicity-check',
          '리뷰/댓글 작성 직전 호출, 점수 0~1 + 카테고리 반환',
          '관리자 페이지 혐오표현 탭에서 임계값 일괄 조정',
        ],
      },
      {
        title: '✍️ 사용자 패턴 분석',
        text: '리뷰 누적 시 좋아하는 무드/장르 분포를 LLM 으로 한 줄 요약. 마이페이지 "나의 취향 한 줄 요약" 위젯에 노출.',
      },
      {
        title: '🪪 도장깨기 리뷰 검증 (스텁)',
        text: 'POST /admin/ai/review-verification/verify — 현재 503 스텁. 설계서: docs/도장깨기_리뷰검증_에이전트_설계서.md',
        note: '실구현은 후속 (Phase 11)',
      },
    ],
  },

  /* ─────────── 4. Roadmap Agent ─────────── */
  roadmapAgent: {
    icon: '🗺️',
    tag: 'ROADMAP',
    title: 'Personalized Roadmap Agent · 도장깨기 코스',
    desc: '유저 취향 + 학습 목표를 입력받아 LangGraph 로 15편짜리 영화 로드맵을 큐레이션하고 퀴즈를 자동 생성',
    color: '#ffd166',
    stats: [
      { value: '15', label: '편 / 코스' },
      { value: 'LangGraph', label: '큐레이션 그래프' },
      { value: '🏆', label: '완주 뱃지' },
    ],
    sections: [
      {
        title: '📚 큐레이션 흐름',
        steps: [
          { title: '입력', desc: '취향 프로필 + 목표(예: 봉준호 마스터)' },
          { title: '후보 풀', desc: 'RAG + Neo4j filmography 결합' },
          { title: '난이도 정렬', desc: '러닝타임/장르/평점 분포 균형화' },
          { title: '15편 확정', desc: '서사 흐름 고려 (입문 → 심화)' },
          { title: '퀴즈 자동 생성', desc: 'LLM 으로 편당 OX/객관식 1~2 문항' },
        ],
      },
      {
        title: '🛠️ API',
        list: [
          'POST /api/v1/roadmap/generate — 15편 코스 생성',
          'POST /api/v1/roadmap/verify-quiz — 퀴즈 정답 검증',
          'GET /api/v1/roadmap/courses/** — 진행률 조회',
        ],
      },
      {
        title: '🎮 게임화',
        list: [
          '편당 시청 + 리뷰 + 퀴즈 통과 시 도장 1개',
          '15편 완주 → 코스 뱃지 + 보너스 포인트',
          '관리자 페이지에서 코스 / 퀴즈 일괄 관리 (운영 도구)',
        ],
      },
    ],
  },

  /* ─────────── 5. LLM Stack ─────────── */
  llmStack: {
    icon: '🧠',
    tag: 'LLM STACK',
    title: 'Hybrid LLM Stack · 4-Model Orchestration',
    desc: '용도에 따라 4개 모델을 분할 — 한국어 생성 / 의도·감정·이미지 / 일반 대화·재질문 / 분류·추출·설명',
    color: '#7c6cf0',
    stats: [
      { value: '4', label: '모델' },
      { value: '4096D', label: '임베딩 차원' },
      { value: 'Hybrid', label: '운영 모드' },
    ],
    sections: [
      {
        title: '🎚️ 모델 역할 매트릭스',
        table: {
          headers: ['모델', '용도', '서빙'],
          rows: [
            ['EXAONE 4.0 32B', '한국어 추천 설명·자연어 생성', 'Ollama (Apple Silicon Metal)'],
            ['Qwen 3.5 35B-A3B', '의도/감정 분류 · 이미지 비전', 'Ollama'],
            ['EXAONE 4.0 1.2B', '몽글이 페르소나 일반 대화·질문', 'vLLM (Tesla T4, port 18000/18001)'],
            ['Solar Pro (Upstage)', '구조화 추출 · 분류 · 리뷰 점수', 'API'],
            ['Solar Embedding', '4096D 벡터 임베딩', 'API (OpenAI 호환)'],
          ],
        },
      },
      {
        title: '🪛 왜 모델을 나눠 쓰나요?',
        list: [
          '비용/속도/품질 trade-off 최적화 (작은 모델로 분류 → 큰 모델로 생성)',
          '실패 시 cross-fallback (Solar 실패 → EXAONE → 정적값)',
          'LangSmith Tracing 으로 모델별 latency / 실패율 시각화',
        ],
      },
      {
        title: '🚀 Tesla T4 vLLM 운영',
        text: 'VM4 GPU에서 EXAONE 1.2B 를 vLLM 으로 서빙. Chat: 18000 / Vision: 18001 분리 포트. 관리자 시스템 탭의 vLLM 카드에서 /v1/models + /health 실시간 프로브.',
        note: 'LoRA 파인튜닝(몽글이 페르소나) 후속 작업 진행 중',
      },
    ],
  },

  /* ─────────── 6. SSE Events ─────────── */
  sseEvents: {
    icon: '📡',
    tag: 'STREAMING',
    title: 'SSE Streaming Events · 8종 이벤트 명세',
    desc: '서버는 LangGraph 노드를 진행하며 8가지 SSE 이벤트로 클라이언트에 점진적 응답을 흘려준다',
    color: '#118ab2',
    stats: [
      { value: '8', label: '이벤트 종류' },
      { value: 'SSE', label: 'text/event-stream' },
    ],
    sections: [
      {
        title: '📨 8개 이벤트',
        table: {
          headers: ['event', '시점', '주요 필드'],
          rows: [
            ['session', '맨 처음', 'session_id, user_id'],
            ['status', '노드 진입마다', 'node, message'],
            ['movie_card', '추천 카드 단위', 'movie, score, recommendation_log_id'],
            ['clarification', '재질문 분기', 'question, suggestions[], allow_custom'],
            ['token', '설명 스트리밍', 'delta (LLM 토큰)'],
            ['point_update', '소비 시점', 'balance, source, daily_used, daily_limit'],
            ['done', '응답 종료', 'total_movies, duration_ms'],
            ['error', '예외 발생', 'code, message'],
          ],
        },
      },
      {
        title: '🪄 v3.4 — point_update 분리',
        text: 'check 시점이 아닌 movie_card yield 직전에 consume 호출. balance 외에 source / daily_used / daily_limit / sub_bonus_remaining / purchased_remaining 가 함께 내려와 클라이언트 ChatPointBar 가 "오늘 무료 1/3", "이용권 N회" 등을 정확히 분기 표시.',
      },
      {
        title: '🪟 클라이언트 처리',
        list: [
          'fetch 기반 ReadableStream 파서 (Authorization 헤더 필요해 EventSource 미사용)',
          'fetchWithAuth 자동 401 재시도 → 토큰 만료에도 끊김 없음',
          'clarification 이벤트는 ClarificationOptions 카드 UI 로 즉시 렌더',
        ],
      },
    ],
  },

  /* ─────────── 7. Memory Architecture ─────────── */
  memoryArch: {
    icon: '🧊',
    tag: 'MEMORY',
    title: 'Memory Architecture · Redis 핫 캐시 + MySQL 아카이브',
    desc: '대화 이력을 Redis 에 즉시 R/W 하고, Backend write-behind 로 MySQL 에 영구 저장하는 2-Tier 구조',
    color: '#06d6a0',
    stats: [
      { value: '2', label: 'Tier (Hot/Cold)' },
      { value: 'Option B', label: 'Write-behind' },
      { value: 'fire-and-forget', label: '아카이브 호출' },
    ],
    sections: [
      {
        title: '🏗️ 구조',
        steps: [
          { title: 'Redis 핫 캐시', desc: '매 턴 R/W. 세션 진행 중에는 Redis 단일 진실' },
          { title: 'Backend /session/save', desc: 'Agent 가 fire-and-forget 호출 → 비동기 아카이브' },
          { title: 'MySQL 아카이브', desc: 'chat_session_archive 테이블이 영구 진실 원본' },
          { title: 'cache-aside 조회', desc: '이력 페이지는 MySQL → Redis 워밍 → 응답' },
        ],
      },
      {
        title: '🗝️ 빈 user_id 처리',
        text: '비로그인 / 게스트 세션은 user_id="" 로 도착. Redis · Backend 양쪽 모두 스킵하고 메모리에서만 휘발 처리.',
      },
      {
        title: '🐞 2026-04-15 Phase 2 수정 (JWT 알고리즘)',
        text: 'Backend(jjwt 0.12.6)가 JWT_SECRET 67B → HmacSHA512 키로 자동 HS512 서명하던 것을 Agent 측 algorithms=["HS256"] 만 허용해 InvalidAlgorithmError → user_id="" → 0건 저장으로 이어지던 버그를 ["HS256","HS384","HS512"] 확장으로 해소.',
        note: 'HMAC 만 사용 → 알고리즘 혼동 공격 가능성 없음, 기존 토큰 무효화 없음',
      },
    ],
  },

  /* ─────────── 8. Recommendation Scoring ─────────── */
  recoScoring: {
    icon: '⚖️',
    tag: 'SCORING · FUSION',
    title: 'Recommendation Scoring — 융합 · 다양성 · 신호',
    desc: 'RRF 로 3 백엔드를 융합하고, MMR 로 다양성을 강제하며, 강/약 신호를 분리해 학습 편향을 제어한다 (상태별 CF/CBF 가중치는 ❄️ Cold Start 모달 참조)',
    color: '#ef476f',
    stats: [
      { value: 'k=60', label: 'RRF Fusion' },
      { value: 'λ=0.7', label: 'MMR 다양성' },
      { value: '강/약', label: '신호 분리' },
    ],
    sections: [
      {
        title: '🔗 RRF Fusion (Qdrant · ES · Neo4j)',
        code: `score(d) = Σ_i  1 / (k + rank_i(d))
# k = 60  ·  i ∈ {qdrant, es, neo4j}
# dedup key = movie_id`,
        text: 'k=60 은 상위권 차이를 부드럽게 평탄화해 백엔드 간 점수 스케일 차이를 흡수. 3 백엔드 중 일부가 실패해도 나머지로 정상 응답.',
      },
      {
        title: '🎲 MMR (Maximal Marginal Relevance)',
        code: `MMR(c) = λ · relevance(c)  −  (1 − λ) · max( sim(c, s) for s in selected )
# λ = 0.7  → 관련성 70% · 다양성 30%`,
        text: '같은 감독/장르가 결과 상단에 몰리는 현상을 수학적으로 분산 — 후순위 가치를 확보해 사용자 만족도 유지.',
      },
      {
        title: '🧪 강한 신호 vs 약한 신호 (목적 분리)',
        list: [
          { label: '강한 신호',  value: 'reviews 테이블 — 추천 학습의 단일 진실 원본 (별점 + 텍스트 검증 통과)' },
          { label: '약한 신호',  value: 'user_watch_history — 마이페이지 UX(시청 이력·재관람 카운트·완주율) 전용, 추천 학습에 미편입' },
          { label: '시드',      value: 'kaggle_watch_history — MovieLens 26M 시드, Cold 사용자 보조용 (read-only)' },
        ],
        note: '"봤다 = 리뷰" 원칙(2026-04-08 부분 재정의) — 중복 관리가 아니라 강약 신호의 분리로, 학습 노이즈와 UX 데이터 혼입을 원천 차단',
      },
      {
        title: '✨ 추가 랭킹 신호',
        list: [
          { label: '인기도', value: 'ES function_score · log1p(popularity_score) factor 0.1' },
          { label: '평점',   value: 'vote_average factor 0.03 · vote_count factor 0.05' },
          { label: '무드',   value: 'Neo4j HAS_MOOD 매치 횟수 → mood_match DESC + CBF 가중치' },
          { label: 'OTT',    value: '가입 OTT payload 필터 — 가입 플랫폼 보유 작품 우선' },
        ],
      },
      {
        title: '🔗 연결 모달',
        text: '사용자 상태별 가중치 전략(Cold/Semi-Cold/Warm/정상)과 온보딩·Kaggle CF 캐시 보완은 ❄️ Cold Start 모달에 상세. Movie Match 의 스코어링(0.5·llm + 0.3·harmonic + 0.2·cf)은 🎬 Movie Match v3 모달 참조.',
      },
    ],
  },

  /* ─────────── 9. Payment Flow (2-Phase + Saga) ───────────
     출처 (실제 코드 확인):
       backend domain/payment/PaymentService.java
       backend domain/payment/PaymentConfirmProcessor.java
       backend domain/payment/TossPaymentsClient.java
       backend domain/payment/entity/PaymentOrder.java
       backend domain/point/PointService.java · entity/PointsHistory.java
       backend domain/subscription/SubscriptionService.java
       docs/결제_구독_시스템_설계_및_구현_보고서.md, docs/리워드_결제_설계서.md                */
  paymentFlow: {
    icon: '💳',
    tag: 'PAYMENT · TRANSACTION',
    title: '결제 프로세스 & 트랜잭션 정합성',
    desc: 'Toss Payments v2 실연동 + 2-Phase 트랜잭션 분리 + 비관적 FOR UPDATE 락 + 보상(Saga) 트랜잭션으로 "카드 청구됐는데 포인트 안 들어감" 을 구조적으로 봉쇄',
    color: '#06d6a0',
    stats: [
      { value: '2-Phase', label: 'Approve / Confirm' },
      { value: 'Saga', label: '보상 트랜잭션' },
      { value: 'FOR UPDATE', label: '비관적 락' },
      { value: 'Insert-Only', label: '포인트 원장' },
    ],
    sections: [

      /* ── A. End-to-End 흐름 ── */
      {
        title: '🧭 End-to-End 결제 흐름',
        steps: [
          { title: '① 주문 생성',   desc: 'POST /payment/orders — PaymentService.createOrder(). PaymentOrder(PENDING) INSERT + idempotencyKey 중복 체크' },
          { title: '② Toss 결제창', desc: '클라이언트가 Toss SDK v2 로 결제 수행 (서버 트랜잭션 없음)' },
          { title: '③ 승인 요청',   desc: 'POST /payment/confirm — Toss Basic Auth + Idempotency-Key(=orderId) 전송' },
          { title: '④ Phase 2 처리', desc: 'PaymentConfirmProcessor.execute() — FOR UPDATE 재조회 → order.complete() → earnPoint() → createSubscription()' },
          { title: '⑤ 적립/활성화', desc: '포인트팩=포인트 적립 / 구독=AI 보너스·혜택 등급 승격' },
        ],
      },

      /* ── B. 2-Phase 트랜잭션 경계 ── */
      {
        title: '🧱 2-Phase 트랜잭션 — 왜 분리했나',
        table: {
          headers: ['Phase', '메서드', '@Transactional', 'DB 커넥션'],
          rows: [
            ['Phase 1 (검증 + Toss 호출)', 'PaymentService.confirmPayment()', 'propagation = NOT_SUPPORTED', '미점유 (외부 I/O 동안 풀 고갈 방지)'],
            ['Phase 2 (DB 처리)', 'PaymentConfirmProcessor.execute()', 'readOnly = false (기본 REPEATABLE_READ)', 'FOR UPDATE 락 획득'],
            ['보상 기록', 'PaymentCompensationService.recordCompensationFailed()', 'propagation = REQUIRES_NEW', '독립 트랜잭션 — 상위 롤백에도 흔적 보존'],
          ],
        },
        note: 'Toss API 호출 중에는 커넥션을 잡지 않는다 — HikariCP 풀이 외부 지연으로 소진되는 전형적 장애를 원천 차단',
      },

      /* ── C. 동시성 — FOR UPDATE 맵 ── */
      {
        title: '🔒 비관적 FOR UPDATE 락 (PESSIMISTIC_WRITE)',
        list: [
          { label: 'payment_orders',      value: 'findByPaymentOrderIdForUpdate() — 승인·환불·웹훅 재처리 직렬화' },
          { label: 'user_points',         value: 'findByUserIdForUpdate() — 포인트 적립/차감/환불 회수' },
          { label: 'user_ai_quota',       value: 'findByUserIdWithLock() — 일일 AI 무료·이용권 소비' },
          { label: 'user_subscriptions',  value: 'findByUserIdForUpdate() — 구독 활성화·해지' },
          { label: 'movie_ticket_lottery',value: '월말 추첨 진행 시 상태 전이 보호' },
        ],
        note: 'optimistic(@Version) 미사용 — 결제 도메인 특성상 충돌 시 재시도보다 직렬화가 안전',
      },

      /* ── D. 멱등성 ── */
      {
        title: '🪪 멱등성 (Idempotency)',
        list: [
          'PaymentOrder.idempotencyKey VARCHAR(100) UNIQUE — DB 레벨 중복 차단',
          '동일 키 + 동일 파라미터 → 기존 주문 응답 그대로 반환',
          '동일 키 + 다른 파라미터 → IDEMPOTENCY_KEY_REUSE 에러',
          'Toss 승인 요청 헤더 Idempotency-Key = orderId, 취소 요청은 paymentKey + "_cancel_" + amount',
          'FOR UPDATE 재조회 후 이미 COMPLETED 면 기존 결과를 재사용 (재승인 금지)',
        ],
      },

      /* ── E. Saga 패턴 선택 근거 ── */
      {
        title: '🧭 어떤 Saga 패턴? — Orchestration (중앙 오케스트레이터)',
        text: '분산 트랜잭션의 두 축 Orchestration vs Choreography 중 **Orchestration** 을 선택. PaymentService / PaymentConfirmProcessor / PaymentCompensationService 3 컴포넌트가 단계 진행·실패 판정·보상 실행을 중앙에서 결정한다. 이벤트 브로커에 의존하지 않고, 각 단계가 호출자의 제어권 아래 순차적으로 실행.',
        table: {
          headers: ['구분', 'Orchestration (채택)', 'Choreography'],
          rows: [
            ['제어 방식', '중앙 오케스트레이터가 순차 호출', '각 서비스가 이벤트 구독·발행'],
            ['실패 지점 추적', '단일 책임 클래스에 응집 (스택트레이스 선형)', '분산 로그 추적 필요'],
            ['보상 순서',   '코드로 명시적 역순 실행 가능',   '이벤트 순서 보장 장치 필요(SAGA 로그)'],
            ['결합도',      'Backend 단일 프로세스 내 결합',  '메시지 브로커 결합 + 계약 관리'],
            ['선택 이유',   '결제는 강한 일관성·원자적 복구가 최우선', '현재 서비스 경계가 단일 DB 라 분산 이벤트가 오버엔지니어링'],
          ],
        },
        note: '결제 도메인은 "돈이 빠져나갔는데 혜택이 안 들어감" 이 절대 있어선 안 됨 → 이벤트 소실/순서 꼬임 가능성이 있는 Choreography 는 부적합. Spring Boot 단일 프로세스, 단일 DB (MySQL) 라는 현재 경계에서 Orchestration 이 코드 추적성·트랜잭션 원자성 모두 우위',
      },

      /* ── E-2. 보상 실행 단계 (실제 코드) ── */
      {
        title: '🛡️ 보상 트랜잭션 실행 단계 (실 코드)',
        text: 'Toss 승인은 성공했는데 Phase 2 DB 처리가 실패한 경우 — 사용자는 돈만 빠져나가고 포인트/구독은 못 받는 최악 시나리오를 4단계로 봉쇄.',
        steps: [
          { title: '① Phase 2 롤백',     desc: '@Transactional 전체 롤백 (order.complete + earnPoint + createSubscription 원자적 취소)' },
          { title: '② Toss 자동 환불',    desc: 'attemptCancelWithRetry() — MAX_CANCEL_RETRIES=3회 · CANCEL_RETRY_INTERVAL_MS=100ms · InterruptedException 시 즉시 탈출' },
          { title: '③ 실패도 실패하면',   desc: 'PaymentCompensationService.recordCompensationFailed() — propagation=REQUIRES_NEW 독립 트랜잭션으로 order.markCompensationFailed(reason) 영속' },
          { title: '④ 운영 수동 복구',    desc: '[COMPENSATION_FAILED] 패턴 Grafana/Loki 알람 → 관리자 Toss 수동 환불 또는 포인트 수동 지급 → order.markRecovered(adminNote)' },
        ],
        code: `// PaymentService.java
private static final int  MAX_CANCEL_RETRIES       = 3;
private static final long CANCEL_RETRY_INTERVAL_MS = 100L;

private boolean attemptCancelWithRetry(String paymentKey, String orderId) {
    for (int attempt = 1; attempt <= MAX_CANCEL_RETRIES; attempt++) {
        try {
            tossClient.cancelPayment(paymentKey, "서버 내부 오류로 인한 자동 보상 취소");
            return true;
        } catch (Exception e) {
            if (attempt < MAX_CANCEL_RETRIES) Thread.sleep(100L);
        }
    }
    return false;  // 3회 모두 실패 → COMPENSATION_FAILED 전이
}`,
        note: 'REQUIRES_NEW 가 핵심 — Phase 2 가 롤백 중인 상황에서도 "실패했다는 사실" 은 반드시 남겨야 하므로 독립 트랜잭션으로 커밋',
      },

      /* ── F. 주문 상태 머신 ── */
      {
        title: '🔁 PaymentOrder 상태 머신',
        code: `PENDING ──► COMPLETED ──► REFUNDED
   │           │
   │           └─► COMPENSATION_FAILED  (Toss 환불 3회 실패)
   │                      │
   │                      └─► (관리자) order.markRecovered()
   └─► FAILED               │
              └─► COMPENSATION_FAILED  (승인 실패 + 환불 실패)`,
        note: 'COMPENSATION_FAILED 는 "돈은 나갔는데 혜택 안 줌" 을 명시적으로 알리는 신호 — 운영 대시보드에서 알림',
      },

      /* ── G. 포인트 원장 (Insert-Only Ledger) ── */
      {
        title: '📒 포인트 원장 (points_history INSERT-ONLY)',
        list: [
          'UPDATE / DELETE 금지 — @PreUpdate / @PreRemove 로 차단',
          'pointChange(양수=적립/음수=소비) + pointAfter(스냅샷) + pointType(earn/spend/bonus/expire/refund/revoke)',
          'baseAmount + appliedMultiplier 로 등급 배율(×1.0~×1.5) 추적',
          'UNIQUE (user_id, action_type, reference_id) — 동일 이벤트 중복 지급 원천 차단',
          '모든 변동이 감사 가능 — before/after 재구성 가능',
        ],
      },

      /* ── H. 환불 & 웹훅 ── */
      {
        title: '↩️ 환불 (Refund) & 웹훅',
        list: [
          { label: '엔드포인트', value: 'POST /payment/orders/{id}/refund — FOR UPDATE 재조회 → 포인트 회수 → Toss cancelPayment → order.refund()' },
          { label: 'POINT_PACK',  value: '지급 포인트 전액 회수 (deductPoint)' },
          { label: 'SUBSCRIPTION',value: '사용 혜택 고려 포인트 미회수' },
          { label: '회수 실패',   value: 'order.setRefundPointFailed() — 상태 COMPLETED 유지 + failedReason 기록 → 수동 조치' },
          { label: '웹훅',        value: 'POST /payment/webhook — HMAC-SHA256 서명 검증 · 이미 REFUNDED 면 무시 (이중 처리 방지)' },
        ],
      },

      /* ── I. AI 쿼터 3-Source + v3.4 버그 ── */
      {
        title: '🎟️ AI 쿼터 3-Source 소비 (v3.4 Check/Consume 분리)',
        table: {
          headers: ['우선순위', 'Source', '차감 대상'],
          rows: [
            ['1', 'GRADE_FREE (등급 무료)',   'user_ai_quota.daily_ai_used++'],
            ['2', 'SUB_BONUS (구독 보너스)',   'user_subscriptions.remaining_ai_bonus--'],
            ['3', 'PURCHASED (구매 이용권)',   'user_ai_quota.purchased_ai_tokens-- + monthly_coupon_used++'],
            ['BLOCK', '모두 소진',              '—'],
          ],
        },
        text: 'v3.3 까지 check 시점에 차감 → "추천 안 받고 후속 질문만 해도 쿼터 차감" 정책 버그. v3.4 에서 POST /point/check (조회) · /point/consume (차감) 2단계로 분리, Agent 의 movie_card yield 직전에만 consume 호출.',
        note: '2026-04-15: checkPoint() 가 readOnly=true 를 상속받아 내부 QuotaService SELECT ... FOR UPDATE 가 MySQL 1792 에러. 메서드에 @Transactional(readOnly=false) 재선언으로 수정',
      },

      /* ── J. 구독 트랜잭션 ── */
      {
        title: '📅 구독 (Subscription) 트랜잭션',
        list: [
          'SubscriptionPlan (마스터) · UserSubscription (사용자 현황) 2엔티티',
          '결제 승인 Phase 2 내부에서 원자적으로 createSubscription() 호출 → 실패 시 포인트 적립과 함께 통째 롤백',
          '월간/연간 periodType + monthlyAiBonus + pointsPerPeriod 지급 주기 관리',
          '4플랜: monthly_basic(2,900/월) · monthly_premium(5,900/월) · yearly_basic(29,000/년) · yearly_premium(59,000/년)',
        ],
      },

      /* ── K. 실패 시나리오 처리표 ── */
      {
        title: '🚨 실패 시나리오 처리',
        table: {
          headers: ['시나리오', '처리'],
          rows: [
            ['결제창 이탈',                'PENDING 유지 → 스케줄러로 만료 예정'],
            ['confirm 중 네트워크 실패',    'Toss 미호출 → PENDING 유지, 클라이언트 재시도 가능'],
            ['confirm 성공 + 포인트 적립 실패', 'Phase 2 롤백 → Toss 환불 재시도(3회) → 실패 시 COMPENSATION_FAILED'],
            ['포인트 적립 성공 + DB 크래시', '트랜잭션 원자성으로 전체 롤백 → 일관성 유지'],
            ['환불 회수 실패',              'COMPLETED 유지 + failedReason 기록 → 관리자 수동'],
            ['웹훅 중복 수신',              '상태 전이 체크 (COMPLETED 만 처리) + REFUNDED 재수신 무시'],
          ],
        },
      },

      /* ── L. 포인트 단일 재화 정책 ── */
      {
        title: '💰 포인트 단일 재화 정책 (v3.2)',
        list: [
          '1 P = 10 원 — 통합 단일 재화 (v2.x 크레딧/포인트/리워드 분리 폐지)',
          'AI 이용권: 10P/1회 · 50P/5회 · 200P/20회 · 500P/50회',
          '55개 활동 리워드 정책 (리뷰/퀴즈/로그인/월드컵/로드맵 완주 …) × 등급 배율(×1.0~×1.5)',
          '유저 아이템 (UserItem) 인벤토리 — 포인트 상점 구매 → 실사용 시점에 consumeQuota()',
        ],
      },
    ],
  },

  /* ─────────── 10. Community & Social ─────────── */
  community: {
    icon: '👥',
    tag: 'COMMUNITY',
    title: '커뮤니티 & 소셜 — 함께 즐기는 영화 문화',
    desc: '혼자 보는 데서 그치지 않고, 유저끼리 취향을 공유하고 겨루고 매칭되는 생태계',
    color: '#118ab2',
    stats: [
      { value: '9', label: '커뮤니티 탭/기능' },
      { value: 'AI', label: '퀴즈·씬 맞추기' },
      { value: 'TOP 10', label: '시네마 소울메이트' },
    ],
    sections: [

      {
        title: '📝 리뷰 & 평점',
        list: [
          '영화 상세에서 별점 + 리뷰 작성 (비속어/혐오 AI 검열 통과 시 등록)',
          'reviews 테이블이 추천 학습의 단일 진실 원본 — 쓰는 것 자체가 취향 학습 신호',
          'OCR 영수증 업로드로 실관람 인증 시 더 높은 신뢰 등급으로 가중',
          '리뷰 작성 → 등급 배율 반영 포인트 지급 (기본 N·P × 등급배율)',
        ],
      },

      {
        title: '💬 게시글 · 댓글 · 대댓글 · 신고',
        list: [
          'CommunityPage 탭: 자유/리뷰/추천/공지 + 공지사항 딥링크 (?noticeId=)',
          '댓글/대댓글 · 좋아요 · 신고 / 혐오표현 AI 검출',
          '관리자 콘텐츠 관리 9 EP 로 신고 큐 · 블라인드 처리',
          '게시글 작성 · 좋아요 · 유익한 댓글 선정 시 리워드 포인트',
        ],
      },

      {
        title: '🎮 AI 퀴즈 · 씬 맞추기 · 도장깨기',
        list: [
          '관리자 AI 퀴즈 생성기(solar) 로 매일 새 퀴즈 출제 — Agent 가 LLM + MySQL INSERT',
          '스틸컷 한 장으로 영화 맞추기 — 난이도별 포인트 차등',
          '도장깨기 리뷰 인증(2026-04-14) — OCR 배너 + 영수증 업로드 제출 플로우',
          '퀴즈 정답 · 도장 완주 시 포인트 + 업적 트리거',
        ],
      },

      {
        title: '⚔️ 이상형 월드컵 (온보딩 & 상시)',
        text: '16/32/64강 이지선다 토너먼트로 취향 프로필을 재미있게 정밀화. 우승작/준우승작이 추천 시드로 흘러가 CBF 초기값을 강화.',
        list: [
          'GET/POST /api/v1/worldcup/{start,pick,result}',
          '관리자 Worldcup Candidates 운영 도구에서 후보 풀 관리',
          '참여·우승·공유 시 포인트 + 업적 (예: "월드컵 10회 완주")',
        ],
      },

      {
        title: '💞 시네마 소울메이트',
        text: '리뷰 기반 취향 벡터 유사도 TOP 10 유저를 매칭 → 상대의 최근 본 영화 · 즐겨찾기를 공유. "누구와 같이 볼까?" 그룹 추천은 Movie Match Agent 로 연결.',
      },

      {
        title: '🎯 블라인드 데이트 추천',
        text: '제목/포스터는 가리고 힌트만 먼저. 편견 없이 만나는 "뜻밖의 명작" 경험 — 감상 완료 후 공개.',
      },

      {
        title: '📢 고객센터 · 공지',
        list: [
          '고객센터 챗봇 백엔드 + 전역 플로팅 위젯 + FAQ/도움말 시드',
          '공지 UX 전면 개편(2026-04-15): BANNER/POPUP/MODAL displayType 분기, 홈 pinned 필터, 커뮤니티 공지 탭 딥링크, [다시 보지 않기] 영구 억제',
        ],
      },
    ],
  },

  /* ─────────── 11. Rewards & Achievements ─────────── */
  rewards: {
    icon: '🎁',
    tag: 'REWARDS',
    title: '리워드 · 업적 · 등급 시스템',
    desc: '쓰는 만큼 돌려받는 구조 — 55개 활동 리워드, 6등급 팝콘 테마, 업적/도장깨기, 포인트 상점, 월말 영화 티켓 추첨까지',
    color: '#ffd166',
    stats: [
      { value: '55', label: '활동 리워드 정책' },
      { value: '6', label: '등급 (알갱이~몽아일체)' },
      { value: '1P=10원', label: '단일 재화' },
      { value: '월말 추첨', label: '영화 티켓' },
    ],
    sections: [

      {
        title: '🏆 55개 활동 리워드 정책',
        text: '리뷰/댓글/로그인/공유/월드컵/로드맵 완주/퀴즈 정답/OCR 인증 등 앱 내 55가지 행위에 포인트 정책이 매핑. RewardPolicy 테이블 기반으로 관리자가 금액·활성 여부 조정.',
        list: [
          '기본 지급 = base_amount × 등급 배율(×1.0 ~ ×1.5)',
          'UNIQUE(user_id, action_type, reference_id) 로 동일 이벤트 중복 지급 차단',
          'points_history INSERT-ONLY 원장 — 변조 불가',
        ],
      },

      {
        title: '🍿 6등급 팝콘 테마 (earned_by_activity 누적)',
        table: {
          headers: ['등급', '누적', '일일 AI', '쿠폰 월한도', '배율', '입력 글자수'],
          rows: [
            ['알갱이 (NORMAL)',       '0~999',         '3회',   '10회',  '×1.0', '200자'],
            ['강냉이 (BRONZE)',       '1,000~3,999',    '5회',   '30회',  '×1.1', '400자'],
            ['팝콘 (SILVER)',         '4,000~6,499',    '7회',   '60회',  '×1.2', '500자'],
            ['카라멜팝콘 (GOLD)',     '6,500~9,999',    '10회',  '80회',  '×1.3', '800자'],
            ['몽글팝콘 (PLATINUM)',   '10,000~19,999',  '15회',  '120회', '×1.4', '3,000자'],
            ['몽아일체 (DIAMOND)',    '20,000+',        '무제한','무제한','×1.5', '무제한'],
          ],
        },
      },

      {
        title: '🪪 업적 (Achievements) & 도장깨기',
        list: [
          'GET /api/v1/users/me/achievements — 로그인 연속 / 리뷰 N편 / 월드컵 완주 / 로드맵 코스 완주 등',
          '도장깨기 코스(Roadmap Agent 15편) 완주 시 코스 뱃지 + 보너스 포인트',
          'OCR 실관람 인증이 있는 도장은 가중 점수 — 리뷰만으로는 완주 X (인증 필수)',
        ],
      },

      {
        title: '🛒 포인트 상점 + UserItem 인벤토리',
        list: [
          'POST /api/v1/point-shop/** — AI 이용권 10P/1회 · 50P/5회 · 200P/20회 · 500P/50회 등',
          'GET /api/v1/users/me/items — 구매한 아이템 인벤토리 (장착/미장착/사용)',
          '/{id}/equip · /unequip · /use — 프로필 꾸미기 아이템, AI 이용권은 use → consumeQuota',
        ],
      },

      {
        title: '🎟️ 월말 영화 티켓 추첨',
        list: [
          'POST /api/v1/users/me/lottery/entries — 포인트로 응모',
          'movie_ticket_lottery 테이블에 FOR UPDATE 락 걸고 상태 전이 보호',
          '월말 스케줄러가 당첨자 선정 → 당첨 포인트/아이템 자동 지급',
        ],
      },

      {
        title: '📥 지급 가시화',
        text: 'PointPage 재개편 — 리워드 지급 기준 / 내 누적 / 다음 등급까지 남은 포인트 / 이번 달 받은 리워드 타임라인을 한 화면에 노출. 관리자 페이지에서는 사용자별 포인트 조정 / 이용권 수동 지급 / 감사 로그 제공.',
      },
    ],
  },

  /* ─────────── 12. Git Branching Strategy ─────────── */
  gitStrategy: {
    icon: '🌿',
    tag: 'VERSION CONTROL',
    title: 'Git 브랜칭 · 버전 관리 전략',
    desc: 'Git Flow 간소화 — feature/* → develop → main. 개인 포크 경유 금지, PR 은 조직 레포(monglepick/) 에 직접',
    color: '#ef476f',
    stats: [
      { value: '5', label: '조직 레포' },
      { value: 'main/develop', label: '보호 브랜치' },
      { value: 'Git Flow', label: '간소화' },
    ],
    sections: [

      {
        title: '🏗️ 브랜치 구조',
        table: {
          headers: ['브랜치', '목적', '병합 대상'],
          rows: [
            ['main',     '운영 릴리즈 (보호)',     '—'],
            ['develop',  '통합 개발 (보호)',       'main (릴리즈 시점)'],
            ['feature/*','기능 단위 작업',         'develop (PR)'],
            ['fix/*',    '버그 수정',              'develop (PR)'],
            ['hotfix/*', '운영 긴급 수정',         'main + develop (cherry-pick)'],
          ],
        },
      },

      {
        title: '🚦 PR 반영 순서 (CLAUDE.md 규정)',
        steps: [
          { title: '① feature/* 작업',    desc: '로컬에서 작업 + 단위 테스트 통과 확인' },
          { title: '② develop 으로 PR',   desc: 'PR 항상 조직 레포 monglepick/ 에 직접 — 개인 포크 경유 X' },
          { title: '③ 리뷰 + CI 통과',    desc: 'code-reviewer / test-runner 자동 실행 + 사람 리뷰 1+' },
          { title: '④ develop 병합',      desc: 'Squash merge 선호, 이슈 번호/소유자/레포#PR 표기' },
          { title: '⑤ develop → main PR', desc: '릴리즈 시점에만. main 은 배포와 동일한 축' },
        ],
      },

      {
        title: '📦 5개 조직 레포',
        list: [
          'monglepick/monglepick-backend (main + develop)',
          'monglepick/monglepick-agent (main + develop)',
          'monglepick/monglepick-recommend (main + develop)',
          'monglepick/monglepick-client (main + develop)',
          'monglepick/monglepick-admin (develop 단일)',
        ],
      },

      {
        title: '✍️ 커밋 컨벤션',
        list: [
          'type(scope): summary — type 은 feat/fix/refactor/docs/test/chore',
          '본문에 왜/어떤 영향/관련 이슈(Jira key, owner/repo#123)',
          '파괴적 변경은 BREAKING CHANGE 푸터',
          '커밋은 작게 자주 — /commit 스킬이 자동으로 컨벤션 맞춤',
        ],
      },

      {
        title: '🛡️ 보호 규칙',
        list: [
          'main/develop 직접 push 금지 (보호 브랜치 설정)',
          'force-push / hooks skip(--no-verify) / 서명 제거 금지',
          '같은 변경은 새 커밋 — amend 최소화 (pre-commit 실패 후 amend 는 이전 커밋을 훼손할 수 있음)',
          'staged 안전 add — git add . 대신 파일 지정 (시크릿 유출 방지)',
        ],
      },
    ],
  },

  /* ─────────── 13. CI / CD Strategy ─────────── */
  cicd: {
    icon: '⚙️',
    tag: 'CI / CD',
    title: 'CI / CD 파이프라인 전략',
    desc: 'GitHub Actions 기반 — PR CI(빌드/테스트/린트) + develop merge 시 스테이징 배포 + main merge 시 운영 3-VM 순차 배포',
    color: '#7c6cf0',
    stats: [
      { value: '5', label: '레포 × 워크플로우' },
      { value: '332', label: 'Agent pytest 통과' },
      { value: '3-VM', label: '순차 운영 배포' },
    ],
    sections: [

      {
        title: '🔁 3 단계 파이프라인',
        steps: [
          { title: 'CI (PR)',        desc: '빌드 + 단위 테스트 + 린트 + code-reviewer/test-runner 서브에이전트' },
          { title: 'Staging (develop)', desc: 'MacBook Air Docker 환경에 docker-compose.staging.yml up 자동 배포' },
          { title: 'Production (main)',  desc: './scripts/deploy-prod.sh — 카카오 클라우드 3-VM 순차 배포' },
        ],
      },

      {
        title: '🧪 레포별 검증 커맨드',
        table: {
          headers: ['레포', 'CI 커맨드', '빌드 산출물'],
          rows: [
            ['backend',   './gradlew build (Spring Boot 3 + JPA)',                       'bootJar → VM2'],
            ['agent',     'uv run --with pytest -- pytest tests/ -v  (332 pass)',        'Docker image → VM2'],
            ['recommend', 'uv run pytest',                                               'uvicorn:8001 → VM2'],
            ['client',    'npm ci && npm run build (Vite)',                              'dist/ → VM1 Nginx'],
            ['admin',     'npm ci && npm run build',                                     'dist/ → VM1 Nginx /admin/'],
          ],
        },
      },

      {
        title: '🚀 deploy-prod.sh 흐름',
        code: `# scripts/deploy-prod.sh — 3-VM 순차 배포

1) VM4 (GPU/DB)  : ssh → docker compose pull+up (Qdrant/ES/Neo4j/Redis/MySQL/vLLM)
2) VM2 (Service) : ssh → pull+up (Spring + FastAPI Agent + Recommend)
                   └── env_file: .env.prod (2026-04-15 전면 정비)
3) VM1 (Public)  : client/admin dist 업로드 + Nginx reload
                   └── /api/v1/admin/system/{db|ollama|vllm} regex 갱신 포인트

* VM3 (Monitoring) 은 변경 시에만 — Prometheus/Grafana/ELK/Alertmanager`,
      },

      {
        title: '📈 품질 게이트',
        list: [
          'Agent: pytest 332개 통과 필수 + structlog 로그 형식 검증',
          'Backend: JPA @Entity ddl-auto=update — 스키마 충돌 감지',
          'Client: Vite 빌드 성공 + 주요 라우트 smoke 테스트',
          '운영 배포 전 /health 프로브 통과 후 다음 VM 로 진행',
        ],
      },

      {
        title: '🔐 시크릿 관리',
        list: [
          'GitHub Actions Secrets — TOSS_* / JWT_SECRET / OAUTH_* / DB 접속 정보',
          'VM 로컬 .env.prod 는 Git 미추적 — .env.prod.example 로만 구조 공개',
          '2026-04-15 env 주입 전면 정비: docker-compose.prod.app.yml 도입, env_file 통일',
        ],
      },
    ],
  },

  /* ─────────── 14. Staging & Production ─────────── */
  staging: {
    icon: '🏭',
    tag: 'STAGING + PRODUCTION',
    title: '스테이징 & 프로덕션 환경 전략',
    desc: '로컬 MacBook Air Docker = 스테이징, 카카오 클라우드 4-VM = 프로덕션. 동일한 docker-compose 포맷으로 환경 갭 최소화',
    color: '#a78bfa',
    stats: [
      { value: '4', label: 'Production VM' },
      { value: '1', label: 'Staging (MBA)' },
      { value: '동일 Compose', label: '환경 동등성' },
    ],
    sections: [

      {
        title: '🖥️ 스테이징 (MacBook Air Docker)',
        list: [
          'docker compose -f docker-compose.staging.yml up -d',
          '5개 DB + Agent + Recommend + Backend + Nginx 전체 로컬 구동',
          'develop merge 시 자동 pull + up (팀원이 같은 develop 에 올려도 상태 일치)',
          'E2E 테스트(14 PASS/3 PARTIAL/1 FAIL/2 SKIP) 의 기준 환경',
        ],
      },

      {
        title: '☁️ 프로덕션 (카카오 클라우드 4-VM VPC)',
        table: {
          headers: ['VM', 'IP', '역할'],
          rows: [
            ['VM1 Public',     '210.109.15.187 / 10.20.0.13', 'Nginx(SSL+SSE Proxy) + React dist'],
            ['VM2 Service',    '10.20.0.11',                  'Spring Boot + Agent + Recommend'],
            ['VM3 Monitoring', '10.20.0.12',                  'Prometheus + Grafana + Alertmanager + ELK'],
            ['VM4 GPU/DB',     '10.20.0.10',                  'vLLM(T4) + MySQL + Redis + Qdrant + Neo4j + ES'],
          ],
        },
      },

      {
        title: '🔒 네트워크 격리',
        list: [
          'VM1 만 Public — 나머지는 Private (10.20.0.0/24)',
          'SSH 점프: ssh -J VM1 → VM2/VM3/VM4',
          'VM4 DB/LLM 포트는 Private 에서만 노출 (7687/18000/18001 등)',
          'Nginx 에서만 외부 진입 — Basic Auth + JWT + 관리자 역할 8종',
        ],
      },

      {
        title: '🔄 환경 동등성 보장',
        list: [
          '스테이징/프로덕션 모두 동일한 docker-compose 포맷 — 이미지 tag 만 환경별 분기',
          '.env.prod.example 로 키 구조 동등성 유지',
          'DB 마이그레이션은 JPA ddl-auto=update 단일 원본 (Flyway 미도입, backend 가 마스터)',
          'Grafana/Kibana 대시보드 프로비저닝도 NDJSON 으로 선언화 (2026-04-15)',
        ],
      },

      {
        title: '🧯 관찰성 스택 (VM3)',
        list: [
          'Prometheus — 메트릭 수집 (match_*, chat_*, backend_*, node_exporter)',
          'Grafana — monglepick-logs 대시보드 12 패널 + 실시간 스트림',
          'Alertmanager — 11개 알림 룰 (severity pill 로 관리자 시스템 탭에 요약)',
          'ELK 8.13 — 로그 검색 (Kibana saved objects 36 자동 import)',
          'LangSmith — LLM 체인 tracing',
        ],
      },
    ],
  },

  /* ─────────── 15. Jira + Confluence Project Management ─────────── */
  projectMgmt: {
    icon: '📌',
    tag: 'PROJECT MGMT',
    title: 'Jira + Confluence 프로젝트 관리',
    desc: 'WBS · 이슈 · 문서화를 Atlassian 스택으로 통합. Claude Code 에서 MCP 로 직접 조작해 기록-개발-문서가 한 루프로 돌아감',
    color: '#f97316',
    stats: [
      { value: '261', label: 'WBS 요구사항' },
      { value: '29건', label: 'QA Jira 이슈' },
      { value: 'MCP', label: 'Atlassian 연동' },
    ],
    sections: [

      {
        title: '📊 WBS (v5, 2026-03-31)',
        table: {
          headers: ['상태', '건수', '비율'],
          rows: [
            ['완료',   '69',   '26.4%'],
            ['진행 중','29',   '11.1%'],
            ['대기',   '149',  '57.1%'],
            ['보류',   '14',   '5.4%'],
            ['총계',   '261',  '100%'],
          ],
        },
        note: 'WBS 는 Google Sheets 로 유지 + Atlassian MCP 로 Jira 이슈와 양방향 동기화',
      },

      {
        title: '🎫 Jira 이슈 관리',
        list: [
          '담당자별 분할: 윤형주 146 / 김민규 58 / 정한나 34 / 이민수 22',
          '이슈 타입: Story / Task / Bug / Sub-task, WBS row 1:1 매핑',
          'QA 라운드 이슈 29건 일괄 생성 가이드: docs/QA_Jira_이슈생성_가이드.md',
          'Claude Code MCP(mcp__atlassian__*) 로 search/createJiraIssue/editJiraIssue/transition 직접 호출',
        ],
      },

      {
        title: '📚 Confluence 문서화',
        list: [
          '설계 권위 문서: AI_Agent_설계_및_구현계획서.md · 리워드_결제_설계서 v3.3 · RDB_스키마_정의서_v2',
          'Phase 별 이력 단일 원본: docs/PROGRESS.md (CLAUDE.md 는 핵심 요약)',
          '팀원별 개발가이드 / 관리자페이지 문서 8개 (윤형주·김민규·이민수·정한나)',
          'Claude Code 에서 createConfluencePage / updateConfluencePage / CQL 검색 MCP 로 문서화 자동 반영',
        ],
      },

      {
        title: '🔁 작업 루프',
        steps: [
          { title: '① Jira 이슈 Pick',  desc: '담당자별 in_progress 전환 + 브랜치 feature/MON-123-*' },
          { title: '② 코드 + 테스트',   desc: 'Claude Code 서브에이전트(backend/agent/frontend/devops) 활용' },
          { title: '③ PR → develop',    desc: '커밋 본문에 Jira key 명시 — Jira 에 자동 링크' },
          { title: '④ Confluence 업데이트', desc: '설계 문서/PROGRESS.md/CLAUDE.md 요약 갱신' },
          { title: '⑤ 이슈 Done',       desc: 'transitionJiraIssue — 릴리즈 노트 자동 후보로 수집' },
        ],
      },

      {
        title: '🤝 커뮤니케이션 & 일관성',
        list: [
          '단일 진실 원본 원칙 — 중복 문서 발견 시 한쪽 삭제·통합 (feedback memory 로 고정)',
          'WBS · Jira · Confluence · CLAUDE.md 4축이 같은 수치(261/69/29/149/14)를 바라봄',
          '상세 이력은 PROGRESS.md, CLAUDE.md 는 핵심 요약만 유지',
          'MCP 연동으로 "기록 → 개발 → 문서 반영" 한 루프, 수작업 전환 비용 최소화',
        ],
      },
    ],
  },

  /* ─────────── 16. Recommend Service Architecture ─────────── */
  recommendArch: {
    icon: '🧮',
    tag: 'RECOMMEND SERVICE',
    title: 'monglepick-recommend · FastAPI + Redis 대용량 트래픽',
    desc: 'Backend 와 분리된 경량 FastAPI — 영화 Like · Co-watched CF · 온보딩 검색의 핫 경로를 Redis Write-behind 로 사용자 폭증에도 ms 단위로 응답',
    color: '#06d6a0',
    stats: [
      { value: 'FastAPI', label: 'async + aiomysql' },
      { value: '<1ms', label: 'Like cache hit' },
      { value: '60s', label: 'DB flush 주기' },
      { value: '5min', label: 'Co-watched TTL' },
    ],
    sections: [
      {
        title: '🏗️ 서비스 구조',
        text: 'Like 는 폭증 트래픽(토글 연타) 때문에 Backend Spring 의 동기 트랜잭션으로 처리하면 DB 커넥션이 금세 포화 → 전용 FastAPI 서비스로 분리.',
        code: `monglepick-recommend/app/
├── main.py                       # FastAPI 엔트리
├── v2/
│   ├── api/{like,onboarding,wishlist,match_cowatch,review,search}.py
│   ├── service/{like_service,match_cowatch_service,trending_service}.py
│   ├── repository/*.py           # SQLAlchemy Raw SQL (ORM 우회)
│   └── core/{database, sql_logger}.py
├── background/like_flush.py      # 60초 주기 write-behind flush
├── core/{redis, scheduler, metrics}.py
└── model/{entity, schema}.py`,
      },

      {
        title: '❤️ Like 도메인 — Redis Write-behind',
        steps: [
          { title: '① 즉시 Redis', desc: 'POST /api/v2/movies/{id}/like — SADD/SREM user:{uid}:likes + HINCRBY like:count:{mid} + HSET like:dirty {uid}:{mid}=1' },
          { title: '② 즉시 응답',   desc: 'like_count/is_liked 를 Redis hit 으로 <1ms 반환 (MySQL 미조회)' },
          { title: '③ 60초 flush', desc: 'background/like_flush.py 가 like:dirty 큐를 배치로 SCAN → MySQL INSERT/DELETE' },
          { title: '④ 장애 복구',   desc: 'flush 실패 시 dirty 키 그대로 유지 → 다음 tick 재시도. Redis AOF 로 재기동에도 소실 없음' },
        ],
        note: '연타/폭증에도 MySQL 은 분당 1회만 두드림 → 커넥션 풀 여유 · 대용량 트래픽 수용',
      },

      {
        title: '🗝️ 캐시 키 & TTL',
        table: {
          headers: ['키', '타입', 'TTL', '용도'],
          rows: [
            ['like:count:{movie_id}',  'Hash',   '없음',   '영화별 누적 좋아요 (lazy rehydrate)'],
            ['like:user:{user_id}',    'Set',    '3600s',  '사용자가 좋아한 영화 목록'],
            ['like:dirty',             'Hash',   '없음',   'flush 대기 변경분 (60초 scheduler 소비)'],
            ['match:cowatched:{a}:{b}','JSON',   '300s',   '"둘 다 좋아한 사용자" CF 후보'],
            ['trending:keywords',      'ZSet',   '600s',   '인기 검색어 ZINCRBY'],
          ],
        },
      },

      {
        title: '👥 Co-watched CF — "둘 다 좋아한 사용자"',
        list: [
          'POST/GET /api/v2/match/co-watched — Movie Match Agent 가 호출',
          'reviews INNER JOIN (rating >= 3.5) → 두 영화 모두 높게 평가한 user 집합 → 그들이 좋아한 "다른" 영화를 CF 후보로',
          'cf_score = 0.7 · normalize(co_user_count) + 0.3 · avg_rating',
          'Redis TTL 300s — 같은 영화 쌍 질의가 반복되면 MySQL 부담 제거',
        ],
      },

      {
        title: '🚀 속도 최적화 기법',
        list: [
          { label: 'SQLAlchemy Raw SQL', value: 'ORM 우회 · 필요한 컬럼만 SELECT' },
          { label: 'async/aiomysql',     value: '단일 프로세스에서 수천 동시 요청 수용' },
          { label: 'Redis 1-RTT',        value: 'Hash/Set/ZSet 으로 O(1) · pipelining 으로 RTT 최소화' },
          { label: 'Nginx 재작성',       value: '/api/v1/movies/{id}/like* → recommend:8001 투명 라우팅 (Backend 경유 X)' },
          { label: 'Prometheus',         value: 'like_flush_batch_size / like_flush_duration_seconds 메트릭' },
        ],
      },
    ],
  },

  /* ─────────── 17. Cold Start · Onboarding · CF Cache ─────────── */
  coldStart: {
    icon: '❄️',
    tag: 'COLD START',
    title: '콜드스타트 · 온보딩 · CF 캐시 보완 전략',
    desc: '초기 데이터(리뷰 0건) 유저도 첫 세션부터 의미 있는 추천을 받도록, 온보딩으로 기초 취향을 수집하고 Kaggle CF 캐시로 결손 신호를 메꾼다',
    color: '#a78bfa',
    stats: [
      { value: '0건', label: '리뷰도 → 추천 가능' },
      { value: '26M', label: 'Kaggle CF 시드' },
      { value: 'CBF 100%', label: '완전 콜드' },
      { value: '3 단계', label: 'Warm-up 경로' },
    ],
    sections: [

      {
        title: '🥶 3-Tier Warm-up — 사용자 상태 분기',
        table: {
          headers: ['상태',       '판별 기준',           'CBF',   'CF',   '보완 신호'],
          rows: [
            ['Cold Start',        '리뷰 0건 · 월드컵 0회', '100%',  '0%',   '온보딩 월드컵 강제 + Kaggle CF 캐시'],
            ['Semi-Cold',         '월드컵 ≥1 / 리뷰 0건',  '80%',   '20%',  '월드컵 우승작 시드 + Kaggle CF'],
            ['Warm',              '리뷰 1~9건',           '50%',   '50%',  '본인 리뷰 + Kaggle CF 혼합'],
            ['정상',              '리뷰 10건+',            '40%',   '60%',  '본인 신호가 가장 강함'],
          ],
        },
        note: '핵심: "데이터가 0 이어도 추천이 0 이 되지 않게" — CBF + 온보딩 + Kaggle CF 3중 보완',
      },

      {
        title: '🎯 온보딩 플로우 (기초 취향 수집)',
        steps: [
          { title: '① 장르 선호 체크', desc: '가입 직후 18개 장르 다중 선택 (최소 3개) → user_preferences.genres 저장' },
          { title: '② 이상형 월드컵',  desc: '16/32강 토너먼트로 우승작 1 + 준우승작 1 → 그들의 장르/무드/감독 추출' },
          { title: '③ 평가 시드 5편',  desc: '대중적 영화 5편 별점 평가 (스킵 가능) → 본인 리뷰 벡터 초기화' },
          { title: '④ OTT 선택',       desc: '가입 OTT 체크 → dynamic_filters.ott_platforms 강제' },
        ],
        list: [
          'GET/POST /api/v1/worldcup/{start,pick,result} — 월드컵 API',
          '관리자 운영 도구에서 월드컵 후보 풀 관리 (Worldcup Candidates 탭)',
          '온보딩 완료 시 +500P 보너스 + 등급 진입 조건 일부 충족',
        ],
      },

      {
        title: '🧊 CF 캐시로 결손 메꾸기 — Kaggle MovieLens 26M',
        text: '본인 리뷰가 부족해도, 같은 월드컵 우승작을 고른 Kaggle 유저군의 시청 패턴을 빌려와 CF 신호를 만든다. 신규 유저 첫 세션부터 "나와 비슷한 사람들이 좋아한 영화" 추천이 가능한 이유.',
        list: [
          { label: '데이터',          value: 'kaggle_watch_history — MovieLens 26M rating · 270K 사용자 (read-only 시드)' },
          { label: 'Agent read',      value: '추천 학습은 reviews(강한 신호)만 사용 — Kaggle 은 Cold 사용자의 "가짜 이웃" 보조' },
          { label: 'CF 캐시',         value: 'Redis 586K 키 · 975MB — 장르·무드별 CF 이웃을 미리 워밍' },
          { label: '속도',            value: '본인 리뷰 벡터가 없어도 Kaggle 이웃으로 즉시 CF 점수 생성 → 응답 지연 0' },
        ],
        note: '강한 신호(본인 reviews) vs 약한 신호(Kaggle CF) 구분 — Warm 상태가 되면 본인 신호 비중을 자동으로 끌어올려 Kaggle 편향을 서서히 제거',
      },

      {
        title: '🪄 Intent-First — 대화 1턴이 곧 시드',
        text: 'Chat Agent 는 첫 질문 한 줄("오늘 우울해")에서 user_intent / mood / dynamic_filters / search_keywords 를 뽑아 바로 RAG 쿼리로 변환. 영구 프로필이 없어도 "턴 단위 프로필" 이 임시 CBF 벡터 역할을 한다.',
        list: [
          'preference_refiner 가 감정 + 키워드 + 영화 레퍼런스를 추출',
          'ExtractedPreferences.search_keywords 에 누적되어 그 세션 내내 시드로 재활용',
          '5턴 이상 대화가 쌓이면 세션 프로필이 Warm 수준에 근접 → CF 비중 자동 증가',
        ],
      },

      {
        title: '🛟 관찰 & 회복',
        list: [
          '콜드 사용자 비율 Grafana 대시보드 모니터링 (신규 가입 후 7일 내 리뷰 0건)',
          '추천 품질 저하 시 온보딩 플로우 A/B 로 월드컵 라운드 수(16강 ↔ 32강) 조절',
          'CF 캐시 hit ratio · Kaggle 이웃 매칭률을 Prometheus 로 추적',
          'Kaggle 이웃이 고갈된 희귀 장르는 CBF 비중을 동적으로 재상승',
        ],
      },
    ],
  },

  /* ─────────── 18. JWT Authentication ─────────── */
  jwtAuth: {
    icon: '🔑',
    tag: 'AUTH',
    title: 'JWT 토큰 관리 & Refresh Rotation',
    desc: 'Access 1시간 · Refresh 7일 · DB 화이트리스트 기반 Rotation · OAuth2 exchange 로 외부 로그인도 JWT 로 수렴',
    color: '#118ab2',
    stats: [
      { value: 'HS256~512', label: '서명 알고리즘' },
      { value: '1h / 7d', label: 'Access / Refresh' },
      { value: 'HttpOnly', label: 'Refresh 쿠키' },
      { value: 'Rotation', label: '재사용 탐지' },
    ],
    sections: [

      {
        title: '🧩 컴포넌트 책임 분리',
        table: {
          headers: ['컴포넌트', '경로', '책임'],
          rows: [
            ['JwtTokenProvider',        'global/security/JwtTokenProvider', '토큰 생성 · 검증 · 클레임 추출 (HmacShaKeyFor 자동 선택)'],
            ['JwtAuthenticationFilter', 'global/security/',                  'Authorization 헤더 파싱 → SecurityContext 주입'],
            ['LoginFilter',             'domain/auth/filter/',               '로그인 성공 시 Access body · Refresh HttpOnly 쿠키 내려줌'],
            ['JwtService',              'domain/auth/service/',              'Refresh Rotation · DB 화이트리스트 (addRefresh/existsRefresh/removeRefresh)'],
            ['RefreshEntity',           'domain/auth/entity/',               'refresh 토큰 화이트리스트 테이블 (MyBatis Mapper)'],
          ],
        },
      },

      {
        title: '🔐 토큰 발급 · 저장 전략',
        list: [
          { label: 'Access Token',  value: '만료 1시간 · Response Body JSON · 메모리 보관 (localStorage X, XSS 방어)' },
          { label: 'Refresh Token', value: '만료 7일 · HttpOnly Secure SameSite=Strict 쿠키 · JS 접근 불가' },
          { label: '서명',          value: 'Backend jjwt 0.12.6 Keys.hmacShaKeyFor — secret 길이로 HS256/384/512 자동 선택' },
          { label: 'Agent 수용',    value: 'algorithms=["HS256","HS384","HS512"] 모두 허용 (2026-04-15 확장)' },
        ],
      },

      {
        title: '🔄 Refresh Token Rotation (DB 화이트리스트)',
        steps: [
          { title: '① 로그인',      desc: 'addRefresh(refresh, userId, expiresAt) — RefreshEntity INSERT' },
          { title: '② 액세스 갱신', desc: 'POST /jwt/refresh — existsRefresh(oldRefresh) 검사 → 신/구 교체' },
          { title: '③ 신 토큰 발행', desc: '새 Refresh 는 INSERT, 기존은 즉시 DELETE — 1회성' },
          { title: '④ 재사용 탐지', desc: '이미 DELETE 된 Refresh 재제출 → 비정상 감지 → 해당 user 전체 removeAllRefreshByUser()' },
          { title: '⑤ 로그아웃',    desc: 'removeRefresh(token) — 서버가 명시적으로 무효화' },
        ],
        note: 'Rotation + DB 화이트리스트로 "탈취된 Refresh 재사용" 을 즉시 감지해 세션 전체 무효화 — JWT 순수 stateless 의 약점을 보완',
      },

      {
        title: '🌐 OAuth2 → JWT 교환',
        text: '/oauth2/authorization/{provider} 시작 → 카카오/구글/네이버 콜백 → OAuth2Service 가 User 엔티티 생성/조회 → JwtTokenProvider 로 자체 JWT 발급 → 최종 응답은 로컬 로그인과 동일한 형태 (Access body + Refresh 쿠키). 이후 모든 요청은 동일 경로.',
      },

      {
        title: '🛰️ Agent / Recommend 호출 인증',
        list: [
          'Agent / Recommend 는 Backend JWT 직접 검증이 아닌 X-Service-Key 헤더 + Body userId 방식',
          'Backend → Agent SSE 스트림은 최초 1회만 세션 생성 (user_id="" 면 스킵)',
          'Client fetchWithAuth 가 401 자동 감지 → /jwt/refresh 1회 재시도 → 실패 시 로그인 화면 이동',
        ],
      },

      {
        title: '🧯 보안 체크리스트',
        list: [
          'JWT_SECRET 67B (운영) → HmacSHA512 키 자동 생성 (Backend/Agent 모두 ≥HS256)',
          'HMAC only — 알고리즘 혼동(none / alg 변조) 공격 불가',
          'Refresh 재사용 시 즉시 세션 전체 무효화',
          '관리자 영역은 JWT + ServiceKey 이중 검증, 그리고 관리자 역할 enum 8종으로 @PreAuthorize (진행 중)',
        ],
      },
    ],
  },

  /* ─────────── 19. OCR Ticket Verification ─────────── */
  ocrTicket: {
    icon: '🎫',
    tag: 'OCR VERIFICATION',
    title: 'OCR 영화 티켓 실관람 인증',
    desc: '"실제로 영화관에서 봤음" 을 영수증 이미지로 증명 — 리뷰 신뢰도 가중 + 도장깨기 가중치 + 월말 추첨 응모권',
    color: '#ef476f',
    stats: [
      { value: '2 EP', label: 'Backend 완료' },
      { value: '⏳', label: 'OCR 자동 추출 (후속)' },
      { value: '관리자 큐', label: '수동 검토' },
    ],
    sections: [

      {
        title: '🧭 전체 플로우',
        steps: [
          { title: '① 배너 노출',    desc: '영화 상세 진입 시 GET /api/v1/ocr-event/{movieId}/active 로 진행 중 이벤트 조회 → OcrEventBanner 렌더' },
          { title: '② 영수증 업로드', desc: 'OcrVerificationModal 에서 이미지 첨부 + 관람일 · 상영관 입력' },
          { title: '③ 인증 제출',    desc: 'POST /api/v1/ocr-event/verification — 이미지 저장 + UserVerification(status=PENDING) INSERT' },
          { title: '④ 관리자 검토',  desc: 'Admin OCR Events 탭 큐에서 승인/거절 (현재 수동, OCR 자동 추출은 후속)' },
          { title: '⑤ 지급',         desc: '승인 시 리뷰 신뢰도 +α · 도장깨기 가중치 · 리워드 포인트 + 월말 티켓 추첨 응모권' },
        ],
      },

      {
        title: '✅ 구현 완료 / ⏳ 예정',
        table: {
          headers: ['구분', '항목', '상태'],
          rows: [
            ['Backend EP',    'GET /ocr-event/{movieId}/active',          '✅ (OcrEventController)'],
            ['Backend EP',    'POST /ocr-event/verification',              '✅ (UserVerificationController)'],
            ['Client',        'OcrEventBanner (영화 상세 배너)',           '✅'],
            ['Client',        'OcrVerificationModal (제출 모달)',          '✅'],
            ['Admin',         'OCR Events 관리 큐 (승인/거절)',            '✅ (AdminOcrEventController)'],
            ['Admin Picker',  'MovieSearchPicker 로 movie_id 검색 선택',   '✅ (2026-04-14 공통화)'],
            ['Agent',         'OCR 자동 추출 체인 (이미지 → 영화명·상영관·일시)', '⏳ 미구현'],
            ['Agent',         'POST /admin/ai/ocr/verify 자동 검증',       '⏳ 미구현'],
          ],
        },
      },

      {
        title: '🛡️ 부정행위 방어',
        list: [
          '동일 영수증 재사용 — user_id × receipt_image_hash 유니크 제약 (동일 이미지 재업로드 차단)',
          '타인 영수증 — 현재 관리자 수동 검토가 주 방어선 (OCR 자동 추출 후 날짜/영화/상영관 교차 검증으로 강화 예정)',
          '관람일 자동 비교 — 영수증 날짜 ↔ 해당 영화 상영 기간 불일치 시 reject (후속)',
          'OCR 신뢰도 < 임계 → NEEDS_REVIEW 로 관리자 큐에만 노출 (후속)',
        ],
      },

      {
        title: '🎁 인증 완료 시 혜택',
        list: [
          '도장깨기 코스에서 "OCR 인증 필수" 도장은 이 플로우 통과 시에만 완주 인정',
          '리뷰 신뢰도 가중 — reviews 테이블의 추천 학습에서 더 높은 weight',
          '리워드 포인트 +α (관리자 지정)',
          '월말 영화 티켓 추첨 응모권 (movie_ticket_lottery)',
        ],
      },
    ],
  },

  /* ─────────── 20. AI Quiz Generation ─────────── */
  aiQuiz: {
    icon: '❓',
    tag: 'AI QUIZ',
    title: 'AI 퀴즈 생성 파이프라인 (관리자 도구)',
    desc: '영화 메타데이터 + 줄거리를 LLM 에 넣어 OX/객관식 퀴즈를 자동 생성 — 관리자가 검수·승인 후 로드맵/매일의 퀴즈로 배포',
    color: '#ffd166',
    stats: [
      { value: '2 상태', label: 'PENDING → PUBLISHED' },
      { value: '10P', label: '기본 정답 리워드' },
      { value: 'Solar', label: '생성 LLM' },
    ],
    sections: [

      {
        title: '🏭 생성 플로우',
        steps: [
          { title: '① 관리자 트리거',  desc: 'Admin AI Quiz 탭 → 대상 영화 선택(MovieSearchPicker) → POST /admin/ai/quiz/generate' },
          { title: '② Agent LLM',     desc: 'Solar API 가 줄거리 + 출연진 + 장르를 프롬프트로 받아 OX/객관식 문항 + 정답 + 해설 생성' },
          { title: '③ MySQL INSERT',  desc: 'quizzes 테이블에 status=PENDING 저장 (questionType · question · options(JSON) · correctAnswer · explanation · rewardPoint=10)' },
          { title: '④ 관리자 검수',   desc: '관리자 화면에서 문항 교정 → APPROVED → PUBLISHED 전이' },
          { title: '⑤ 클라이언트 노출', desc: '매일 랜덤 1문제 또는 로드맵 편마다 1~2문제로 배포' },
        ],
      },

      {
        title: '🧠 프롬프트 설계 (요약)',
        code: `INPUT
  movie_id, title, overview, genres, director, cast[0..5], release_year
PROMPT
  "다음 영화의 줄거리를 바탕으로 스포일러 없는
   {OX | 객관식 4지선다} 문항 N개를 만들어라.
   출력은 JSON Schema 로 고정: {question, options[], correctAnswer, explanation}"
OUTPUT
  Quiz {
    question_type: 'ox' | 'multiple_choice' | 'short_answer'
    question     : text
    options      : JSON array (MC 인 경우)
    correctAnswer: string
    explanation  : text
    rewardPoint  : 10
    status       : PENDING
  }`,
        note: 'with_structured_output(json_schema) 로 파싱 실패 원천 차단 — 실패 시 EXAONE 자유 텍스트 → 수동 입력 2단 fallback',
      },

      {
        title: '🎯 정답 검증 (클라이언트 응시)',
        list: [
          'POST /api/v1/roadmap/verify-quiz — 규칙 기반 검증 (LLM 불필요)',
          { label: 'multiple_choice', value: '정답 문자열 정확 일치 (strip 후 비교)' },
          { label: 'ox',              value: 'O / X 단일 문자 비교' },
          { label: 'short_answer',    value: '상호 포함 검사 + 대소문자/공백 정규화' },
          '통과 시 rewardPoint 지급 + 도장깨기 진행 카운트 · 실패 시 재응시 정책은 후속',
        ],
      },

      {
        title: '🛡️ 품질 / 부정행위 대응',
        list: [
          '동일 영화 × 동일 question 중복 방지 (복합 유니크 제약 권장)',
          '스포일러 금지 프롬프트 + 관리자 검수 단계에서 스포일러/오답 제거',
          'LLM 환각으로 실제와 다른 사실 생성 시 관리자 reject → 재생성 버튼',
          '정답률 너무 높거나(95%↑) 낮은(10%↓) 문항은 관리자 화면에서 플래그',
        ],
      },
    ],
  },

  /* ─────────── 21. AI Review Verification (도장깨기 실관람) ─────────── */
  aiReviewVerification: {
    icon: '🧐',
    tag: 'AI REVIEW VERIFY',
    title: 'AI 리뷰 검증 · 도장깨기 실관람 판별',
    desc: '도장깨기 코스 리뷰가 "진짜 본 사람의 감상" 인지 LLM + 임베딩 유사도 + 키워드 매칭으로 4단계 검증 (503 스텁 → 실구현 후속)',
    color: '#7c6cf0',
    stats: [
      { value: '4 단계', label: '검증 파이프라인' },
      { value: '0.7 / 0.3', label: 'High / Low 임계값' },
      { value: '⏳ 503', label: '현재 스텁' },
    ],
    sections: [

      {
        title: '🎯 왜 필요한가',
        text: '도장깨기 코스는 완주 시 뱃지 + 보너스 포인트 + 실관람 신뢰도 가산점을 주기 때문에 "영화를 보지도 않고 검색만으로 리뷰를 복붙" 하는 부정행위 유인이 큼. 운영자 수동 검토로는 확장 불가 → 4-Stage 자동 검증 파이프라인이 필요.',
      },

      {
        title: '🧪 4-Stage 검증 파이프라인',
        steps: [
          { title: 'Stage 1 — 임베딩 유사도', desc: 'Solar 4096D 임베딩 · 리뷰 ↔ 줄거리 코사인 유사도 계산' },
          { title: 'Stage 2 — 키워드 매칭',   desc: 'Nori 한국어 토크나이저로 명사 추출 · 교집합 정규화 점수' },
          { title: 'Stage 3 — LLM 재검증',    desc: 'confidence_draft 경계(0.5~0.8) 구간만 Solar 에 "이 리뷰가 실제로 이 영화를 본 사람의 것인가" 재판정' },
          { title: 'Stage 4 — 임계값 분기',   desc: 'THRESHOLD_HIGH=0.7 → AUTO_VERIFIED · THRESHOLD_LOW=0.3 → AUTO_REJECTED · 중간 → NEEDS_REVIEW (관리자 큐)' },
        ],
      },

      {
        title: '📥 입출력 스키마',
        code: `REQUEST
{
  "verification_id": 123,
  "user_id": "u_abc",
  "course_id": 45,
  "movie_id": "tt1234567",
  "review_text": "...",
  "movie_plot": "..."
}

RESPONSE
{
  "similarity_score": 0.82,
  "matched_keywords": ["봉준호", "계단", "반지하"],
  "confidence": 0.76,
  "review_status": "AUTO_VERIFIED",
  "rationale": "줄거리 핵심 모티프와 고유 공간 묘사가 일치"
}`,
      },

      {
        title: '🛠️ 현재 상태 & 운영 플로우',
        table: {
          headers: ['구성', '상태', '비고'],
          rows: [
            ['설계 문서',        '✅ 확정',   'docs/도장깨기_리뷰검증_에이전트_설계서.md'],
            ['Backend 제출 API', '✅',        '도장깨기 리뷰 제출 시 CourseVerification(review_status=PENDING) INSERT'],
            ['Agent 검증 EP',    '⏳ 503 스텁', 'POST /admin/ai/review-verification/verify — 에이전트 본체 후속'],
            ['Admin 검토 UI',    '✅',        '관리자 수동 오버라이드(AUTO_REJECTED → 승인 가능)'],
          ],
        },
      },

      {
        title: '🛡️ 부정행위 방어 매트릭스',
        list: [
          { label: '줄거리 복사 리뷰',     value: 'Stage 3 LLM 이 "복제/요약 vs 감상" 판정 — 복제 시 confidence 대폭 감점' },
          { label: '다른 영화 리뷰 전용',  value: 'Stage 1 임베딩 유사도 낮음 → AUTO_REJECTED' },
          { label: '짧은 리뷰 (<20자)',    value: '자동 NEEDS_REVIEW — 관리자 큐로' },
          { label: 'LLM 생성 리뷰',        value: '현재 방어 없음 — AI-text detector 모델 도입 검토 중' },
          { label: 'OCR 인증 동반 여부',   value: '티켓 OCR 인증까지 있으면 가중치 +α — 이중 방어' },
        ],
      },

      {
        title: '🔗 연관 시스템',
        list: [
          '도장깨기(Roadmap Agent) — 완주 카운트 결정 신호',
          'OCR 영화 티켓 인증 — 병렬 신뢰 신호',
          '리뷰(reviews) — 통과한 리뷰만 추천 학습의 강한 신호로 편입',
          '관리자 콘텐츠 관리 탭 — NEEDS_REVIEW 큐 처리',
        ],
      },
    ],
  },

  /* ─────────── 22. Cloud Infrastructure & Security ───────────
     카카오 클라우드 4-VM VPC · SSH 배스천 · Linux 하드닝 ·
     Nginx 보안 헤더 · 비밀 관리 · 향후 WAF/IDS 로드맵.
     현재 상태와 앞으로 진행할 부분을 함께 기술. */
  cloudInfra: {
    icon: '🏔️',
    tag: 'CLOUD · SECURITY',
    title: '클라우드 인프라 · VM 세팅 · 보안 전략',
    desc: '카카오 클라우드 VPC 4-VM — Public 1 + Private 3 으로 공격면 최소화, SSH 배스천 점프, Linux 하드닝, Nginx 보안 헤더, 비밀 관리, 그리고 향후 WAF/IDS 강화 로드맵',
    color: '#06d6a0',
    stats: [
      { value: '1 / 3', label: 'Public / Private VM' },
      { value: '10.20.0.0/24', label: 'Private Subnet' },
      { value: 'Key-only', label: 'SSH 정책' },
      { value: "Let's Encrypt", label: 'TLS 자동 갱신' },
    ],
    sections: [

      /* ── A. VPC 토폴로지 ── */
      {
        title: '🗺️ VPC 토폴로지 (카카오 클라우드)',
        text: '공격면 최소화 원칙 — 외부 노출은 VM1 한 대로 집중하고, 나머지는 VPC 내부 통신만 허용.',
        table: {
          headers: ['VM', '외부 IP', '내부 IP', '역할 · 노출 포트'],
          rows: [
            ['VM1 Public',     '210.109.15.187', '10.20.0.13', 'Nginx (80/443) · 유일한 Public 진입점'],
            ['VM2 Service',    '—',              '10.20.0.11', 'Backend 8080 / Agent 8000 / Recommend 8001 (Private only)'],
            ['VM3 Monitoring', '—',              '10.20.0.12', 'Prometheus 9090 / Grafana 3000 / Alertmanager 9093 / ELK (Private only)'],
            ['VM4 GPU+DB',     '—',              '10.20.0.10', 'vLLM 18000/18001 · MySQL 3306 · Redis 6379 · Qdrant 6333 · Neo4j 7687 · ES 9200 (Private only)'],
          ],
        },
        note: 'VM2/3/4 는 Public IP 미할당 — 인터넷에서 직접 접근 불가. 모든 외부 요청은 반드시 Nginx 를 거침',
      },

      /* ── B. 보안그룹 & 포트 정책 ── */
      {
        title: '🛡️ 보안그룹 (Security Group) 포트 정책',
        table: {
          headers: ['VM', 'Ingress 허용', 'Egress 허용'],
          rows: [
            ['VM1', 'TCP 80/443 (Any) · TCP 22 (관리자 IP allowlist)', 'Any (VM2~4 Private + 외부 API)'],
            ['VM2', 'TCP 8080/8000/8001 (VPC 내부만) · 22 (VM1 에서만)', 'VM4 DB 포트 · 외부 API (Toss/Upstage/Ollama)'],
            ['VM3', 'TCP 3000/9090/9093/5601 (VPC 내부만) · 22 (VM1)',  'VM2/4 metrics scrape'],
            ['VM4', 'TCP 3306/6379/6333/7687/9200/18000/18001 (VPC 내부만) · 22 (VM1)', 'HuggingFace · 모델 다운로드'],
          ],
        },
        note: 'vLLM 7687/18000/18001 은 보안그룹 인바운드 허용이 필요 (2026-04-15 운영 미등록 상태). Toss 콘솔 리다이렉트 URI, JWT_SECRET 운영 랜덤키 교체도 함께 진행 예정',
      },

      /* ── C. SSH 배스천 전략 ── */
      {
        title: '🚪 SSH 배스천 (Jump Host) 전략',
        code: `# VM1 만 외부에서 SSH 접근 가능
ssh -A ubuntu@210.109.15.187                            # VM1 (배스천)
ssh -A -J ubuntu@210.109.15.187 ubuntu@10.20.0.10       # VM4 (점프)
ssh -A -J ubuntu@210.109.15.187 ubuntu@10.20.0.11       # VM2
ssh -A -J ubuntu@210.109.15.187 ubuntu@10.20.0.12       # VM3

# /etc/ssh/sshd_config 핵심 설정
PasswordAuthentication no       # 비밀번호 로그인 차단
PubkeyAuthentication yes        # 키 인증만 허용
PermitRootLogin no              # root 직접 로그인 금지
AllowUsers ubuntu               # 특정 유저만 허용
ClientAliveInterval 300         # 유휴 세션 자동 종료`,
        note: 'ssh-agent forwarding(-A) 으로 개인 키가 VM1 에 남지 않음 — 배스천이 뚫려도 Private VM 접근 키는 노출되지 않음',
      },

      /* ── D. Linux 하드닝 ── */
      {
        title: '🐧 Linux 하드닝 (현재 / 예정)',
        table: {
          headers: ['항목',             '현재 적용',        '예정 / 강화'],
          rows: [
            ['방화벽 (ufw)',             'Kakao 보안그룹',   'ufw 이중 방어 (deny default · allow 최소)'],
            ['fail2ban',                 '—',                'SSH · Nginx 5xx · Basic Auth 실패 IP 자동 차단'],
            ['자동 보안 업데이트',        'unattended-upgrades', 'security-only 로 한정'],
            ['시간 동기화 (chrony/ntp)', '기본값',           '모든 VM 동일 NTP 소스 (토큰 만료 · 감사 로그 정합)'],
            ['swap · OOM killer',        'swap 2GB',         'vm.swappiness=10 · vLLM/DB 우선순위'],
            ['sysctl 튜닝',              '기본값',           'net.ipv4.tcp_syncookies=1 · tcp_max_syn_backlog 확대'],
            ['감사 로그 (auditd)',        '—',                'sudo · SSH login · 주요 디렉터리 변경 감사'],
            ['파일시스템 무결성 (AIDE)',  '—',                '향후 도입 검토 — 주요 /etc /usr/bin 변조 감지'],
          ],
        },
      },

      /* ── E. Docker 보안 ── */
      {
        title: '🐳 Docker 컨테이너 보안',
        list: [
          { label: '이미지 출처',      value: '공식 이미지 pin(digest) · GitHub Actions Trivy 스캔 (예정)' },
          { label: '비루트 실행',      value: 'USER 1000 — 컨테이너 탈옥 시 root 권한 획득 방지' },
          { label: 'read-only FS',     value: 'Agent/Backend read-only 마운트 · tmpfs 로 /tmp 격리 (예정)' },
          { label: '리소스 제한',      value: 'mem_limit / cpus / pids-limit — DoS 차단' },
          { label: 'secret 미내장',    value: 'env_file: .env.prod 런타임 주입 · 이미지에 secret 미포함' },
          { label: '로그 드라이버',    value: 'json-file max-size=10m max-file=3 — 디스크 폭주 방지' },
        ],
      },

      /* ── F. Nginx 보안 헤더 & TLS ── */
      {
        title: '🔒 Nginx TLS · 보안 헤더 · 레이트 리밋',
        code: `# /etc/nginx/sites-enabled/monglepick
ssl_certificate /etc/letsencrypt/live/monglepick.kr/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/monglepick.kr/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;            # 취약 TLS 1.0/1.1 비활성
ssl_ciphers HIGH:!aNULL:!MD5;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
# CSP 는 관리자/클라이언트 각각 별도 번들 후 점진 적용 예정

# SSE 프록시 (Agent:8000)
proxy_buffering off;
proxy_read_timeout 300s;

# 레이트 리밋
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
limit_req zone=api burst=40 nodelay;

# 모니터링 영역 Basic Auth (1차 방어)
location /monitoring/ {
    auth_basic "Monitoring";
    auth_basic_user_file /etc/nginx/.htpasswd;
}`,
        list: [
          'Let\'s Encrypt + certbot —renew-hook 으로 TLS 자동 갱신',
          '관리자/모니터링 경로는 Nginx Basic Auth(1차) + JWT Admin Role(2차) 이중 방어',
          'SSE 경로만 proxy_buffering off — 실시간 스트리밍 보장',
        ],
      },

      /* ── G. 비밀 관리 ── */
      {
        title: '🗝️ 비밀(Secret) 관리',
        list: [
          { label: '저장소',        value: 'GitHub Actions Secrets + VM 로컬 .env.prod (Git 미추적)' },
          { label: '공개 스캐폴드', value: '.env.prod.example 로 키 구조만 노출, 값은 각 VM 에 수동 배포' },
          { label: '주입 방식',     value: 'docker-compose env_file: .env.prod — 이미지에 내장 X' },
          { label: '로테이션',      value: 'JWT_SECRET 운영 랜덤키 교체 · OAuth CLIENT_SECRET 실값 교체 예정' },
          { label: '향후',          value: 'HashiCorp Vault 또는 AWS KMS/SSM 마이그레이션 검토' },
        ],
        note: '2026-04-15 env 주입 전면 정비 — Backend/Agent/Recommend 누락 키(TOSS_*/OAUTH_*/CORS_*/UPLOAD_*/BACKEND_BASE_URL) 전량 주입 완료',
      },

      /* ── H. 데이터 보호 ── */
      {
        title: '💾 데이터 보호 (현재 / 향후)',
        list: [
          'MySQL binlog 활성화 → PITR(Point-In-Time Recovery) 기반으로 운영 장애 시 특정 시점 복원',
          'Redis AOF everysec — Like write-behind 의 소실 창을 최소 1초로 제한',
          'Qdrant/Neo4j/ES 는 주기 snapshot (일일) — VM 외부 오브젝트 스토리지 이관 예정',
          '개인정보 컬럼(email/phone) 은 서버단 bcrypt · AES(예정) — 현재는 환경 DB 암호화 미적용',
          'Refresh Token 화이트리스트는 DB 저장 — 탈취 시 즉시 전역 무효화 가능',
        ],
      },

      /* ── I. 앞으로 강화할 영역 ── */
      {
        title: '🚀 앞으로 강화할 영역 (로드맵)',
        table: {
          headers: ['영역', '현재', '계획'],
          rows: [
            ['WAF',              'Nginx 레이트 리밋',  'Cloudflare WAF 또는 ModSecurity + OWASP CRS'],
            ['DDoS 방어',        'Kakao 기본 L3/L4',   'Cloudflare / Kakao ADP 프리미엄 보호 검토'],
            ['IDS/IPS',          '—',                  'Wazuh 또는 Falco — 컨테이너 런타임 이상 탐지'],
            ['VPN/ZeroTrust',    'SSH 배스천',         'Tailscale 또는 WireGuard — 관리자 접근 2FA'],
            ['시크릿 저장소',    '.env.prod',          'Vault/KMS 마이그레이션'],
            ['백업/DR',          '수동 스냅샷',        '일일 자동 스냅샷 + 리전 간 복제'],
            ['취약점 스캔',      '수동',               'Trivy(이미지) + Snyk(의존성) CI 통합'],
            ['감사 로그 중앙화',  'VM 로컬 /var/log',   'Wazuh / Loki 집계 + 90일 보존'],
            ['K8s 마이그레이션', 'docker-compose',    '트래픽 성장 시 Kakao Kubernetes Engine 검토'],
          ],
        },
      },
    ],
  },

  /* ─────────── 23. End-to-End User Journey ─────────── */
  e2eJourney: {
    icon: '🛤️',
    tag: 'USER JOURNEY',
    title: '전체 프로세스 — 가입부터 리워드까지 1회 루프',
    desc: '신규 유저가 처음 들어와서 마지막 리뷰·리워드 지급까지 도달하는 한 사이클. 각 단계에서 어떤 시스템·어떤 DB·어떤 Agent 가 동원되는지 한 화면에 정리',
    color: '#7c6cf0',
    stats: [
      { value: '11', label: '단계' },
      { value: '4', label: '참여 에이전트' },
      { value: '5', label: '참여 DB' },
    ],
    sections: [

      {
        title: '🔁 전체 루프 11 단계',
        steps: [
          { title: '① 가입 / 로그인', desc: 'LoginFilter 또는 OAuth2 → JwtTokenProvider · Access body + Refresh HttpOnly 쿠키 (🔑 JWT 모달)' },
          { title: '② 온보딩 콜드스타트', desc: '장르 선택 → 이상형 월드컵 → 시드 5편 평가 → OTT 선택 (❄️ Cold Start 모달)' },
          { title: '③ 첫 대화',        desc: 'POST /api/v1/chat SSE — intent_emotion_classifier 가 감정·의도 추출 (💬 Chat Agent)' },
          { title: '④ RAG 검색',       desc: 'Qdrant + ES + Neo4j 병렬 → RRF k=60 → LLM Reranker → MMR λ=0.7 (🔎 RAG · ⚖️ Scoring)' },
          { title: '⑤ 추천 노출',       desc: 'SSE movie_card 이벤트 · clarification 카드 · point_update v3.4 (📡 SSE)' },
          { title: '⑥ 구독 또는 이용권', desc: 'POST /payment/orders → Toss SDK → /payment/confirm · 2-Phase + Orchestration Saga (💳 Payment)' },
          { title: '⑦ AI 쿼터 소비',    desc: 'GRADE_FREE → SUB_BONUS → PURCHASED 3층 · v3.4 check/consume 분리' },
          { title: '⑧ 관람 & OCR 인증', desc: '영화 상세 OCR 배너 → 영수증 업로드 → 관리자 검토 큐 (🎫 OCR)' },
          { title: '⑨ 리뷰 작성',       desc: '비속어/혐오 AI 검출 통과 → reviews INSERT · 도장깨기 코스면 AI 리뷰 검증 동반 (🧐 AI Review)' },
          { title: '⑩ 리워드 지급',     desc: 'RewardPolicy × 등급 배율 → PointsHistory INSERT-ONLY 원장 · 업적 트리거 (🎁 Rewards)' },
          { title: '⑪ 재호출 루프',     desc: '다음 세션에서 reviews → 추천 학습 강한 신호로 편입 → Warm 상태 전환 → 더 정확한 추천' },
        ],
      },

      {
        title: '🧭 단계별 참여 시스템',
        table: {
          headers: ['단계', 'Backend', 'Agent',              'Recommend', 'DB'],
          rows: [
            ['② 온보딩',    '✅ auth · worldcup',  '—',                  '—',           'MySQL · Redis'],
            ['③④⑤ 추천',   '—',                  '✅ Chat Agent · RAG · Reranker', '✅ Like · Match co-watched', '5 DB 전부'],
            ['⑥ 결제',     '✅ payment · point',  '—',                  '—',           'MySQL (FOR UPDATE)'],
            ['⑧ OCR',     '✅ ocr-event',       '⏳ OCR 자동 추출',     '—',           'MySQL · 파일저장소'],
            ['⑨ 리뷰',     '✅ community',        '✅ toxicity-check · review verify', '—', 'MySQL · Qdrant'],
            ['⑩ 리워드',   '✅ reward · point',   '—',                  '—',           'MySQL points_history'],
          ],
        },
      },

      {
        title: '🎯 한 줄 요약',
        text: '"리뷰 0건 유저도 첫 대화부터 Warm 사용자처럼 느끼게 하고, 시간이 지날수록 본인 신호가 자연스럽게 강해지는 구조." — 콜드스타트 + Intent-First + 강/약 신호 분리 + 리워드 루프가 톱니바퀴처럼 맞물림',
      },
    ],
  },

  /* ─────────── 24. Data Pipeline ─────────── */
  dataPipeline: {
    icon: '🏭',
    tag: 'DATA PIPELINE',
    title: '데이터 파이프라인 — 910K편 5DB 적재',
    desc: 'TMDB · KOBIS · KMDb · Kaggle 4개 소스를 수집·정제·무드태그 보강·다국어 임베딩 후 Qdrant/ES/Neo4j/MySQL/Redis 5개 DB 에 동기화',
    color: '#f97316',
    stats: [
      { value: '910K', label: '적재 완료' },
      { value: '1.17M', label: 'TMDB 원본' },
      { value: '5', label: '동기화 DB' },
      { value: '4', label: '데이터 소스' },
    ],
    sections: [
      {
        title: '🗂️ 4개 수집 소스',
        table: {
          headers: ['소스', '규모', '필드', '용도'],
          rows: [
            ['TMDB',   '1.17M편 · 25.6GB JSONL', '39 필드 (title/overview/genres/credits/...)', '메타 · 포스터 · 번역'],
            ['KOBIS',  '117K편',                  '영화진흥위원회 API',                          '국내 개봉 · 매출'],
            ['KMDb',   '43K편',                   '한국영화데이터베이스',                        '한국 영화 고유 메타'],
            ['Kaggle', 'MovieLens 26M',           'rating 270K users',                            'Cold Start CF 시드 (read-only)'],
          ],
        },
      },
      {
        title: '🧰 파이프라인 단계',
        steps: [
          { title: '① 수집 (collect)',     desc: 'data_pipeline/tmdb_collector · kobis · kmdb — rate limit 준수 · 증분 수집 (cursor)' },
          { title: '② 정제 (preprocess)',  desc: 'preprocessor — 장르/무드/메타 정규화, 중복 제거, 다국어 필드 분리' },
          { title: '③ 무드 보강',          desc: 'LLM (Solar) 로 24개 mood_tag 자동 부여 · 관리자 화면에서 교정' },
          { title: '④ 임베딩 (embed)',     desc: 'Upstage Solar embedding-passage (4096D) · title+overview+genres+director+mood_tags 합산' },
          { title: '⑤ 적재 (load)',        desc: 'qdrant / es / neo4j / mysql / redis 동시 upsert · 트랜잭션 아닌 idempotent upsert' },
          { title: '⑥ 검증',              desc: 'count · schema drift · 샘플 쿼리 재현율 체크' },
        ],
      },
      {
        title: '🧪 실행 커맨드',
        code: `# 전체 재적재 (clean slate)
PYTHONPATH=src uv run python scripts/run_full_reload.py --clear-db

# 중단 지점부터 재개 (cursor)
PYTHONPATH=src uv run python scripts/run_full_reload.py --resume

# 단위 테스트
PYTHONPATH=src uv run --with pytest --with pytest-asyncio --with httpx \\
  -- python -m pytest tests/ -v   # 332 pass`,
      },
      {
        title: '🌐 다국어 Phase ML-1 ~ ML-4',
        list: [
          { label: 'ML-1~3 (코드)', value: 'ES 다국어 필드 색인 (title_en^2.5 · overview_en^0.8 · alternative_titles^1.5) · Solar 단일 임베딩 4096D 유지' },
          { label: 'ML-4 (운영)',   value: 'Qdrant 임베딩 전량 재생성 + ES 인덱스 재색인 — 운영 다운타임 최소화 blue/green 재적재 예정' },
          { label: '가이드',        value: 'docs/Phase_ML-4_DB재적재_실행가이드.md' },
        ],
        note: '코드는 ML-1~3 완료, 운영 재적재(ML-4)는 남은 작업',
      },
      {
        title: '🔁 증분 동기화 & 일관성',
        list: [
          'TMDB 변경 감시 — 업데이트 타임스탬프 커서 기반 일일 증분',
          '5 DB idempotent upsert — 재실행 안전 (같은 movie_id 중복 INSERT 없음)',
          'Backend = MySQL DDL 마스터 — @Entity ddl-auto=update 단일 진실, recommend/agent 는 read/write 만',
          'Kaggle 26M 시드는 시드 파이프라인으로 별도 관리 — kaggle_watch_history 테이블은 데이터 갱신 드묾',
        ],
      },
    ],
  },

  /* ─────────── 25. Admin Console ─────────── */
  adminConsole: {
    icon: '👑',
    tag: 'ADMIN CONSOLE',
    title: 'Admin Console · 10탭 96 API + 운영 도구 11서브탭',
    desc: '운영에 필요한 모든 행위를 코드 배포 없이 수행 — 사용자 제재 / 포인트 조정 / AI 운영 / 콘텐츠 큐 / 통계 12탭 / 시스템 상태',
    color: '#ef476f',
    stats: [
      { value: '10', label: '메인 탭' },
      { value: '96', label: 'API' },
      { value: '11', label: '운영 서브탭' },
      { value: '12', label: '통계 탭' },
    ],
    sections: [
      {
        title: '🧭 10개 메인 탭',
        table: {
          headers: ['탭', '담당자', '주요 EP 수'],
          rows: [
            ['① 대시보드',          '김민규',  '6'],
            ['② 사용자 관리',        '김민규',  '5 + 제재/포인트/이용권/리워드'],
            ['③ 콘텐츠 관리',        '이민수',  '9 (신고/혐오/게시글/리뷰)'],
            ['④ 결제/포인트',        '윤형주',  '15'],
            ['⑤ AI 운영',            '윤형주',  '12 (리뷰 생성/퀴즈 생성/검증)'],
            ['⑥ 고객센터',           '윤형주',  '8 (FAQ/도움말/티켓/챗봇)'],
            ['⑦ 시스템',             '윤형주',  'DB · Ollama · vLLM (2026-04-15) · 서비스/설정/로그'],
            ['⑧ 데이터',             '윤형주',  '16 (데이터 CRUD 영화/장르/무드)'],
            ['⑨ 설정',               '윤형주',  '약관 · 배너 · 감사 · 관리자'],
            ['⑩ 통계/분석',          '윤형주',  '12 서브탭 (overview/trends/.../churn-risk)'],
          ],
        },
      },
      {
        title: '🛠️ 운영 도구 11 서브탭',
        list: [
          'Achievements · Roadmap Courses · Quizzes · Movies · Genres',
          'OCR Events · Popular Keywords · Worldcup Candidates · Point Packs · Categories · Reward Policies · Notices',
          'MovieSearchPicker 공통화(2026-04-14) — Review/Quiz/OCR/Worldcup/Roadmap 전수 제목 검색 전환',
          '리워드 지급 기준/누적/남은 포인트 실시간 가시화 (PointPage 재개편)',
        ],
      },
      {
        title: '🔐 관리자 역할 (AdminRole enum 8종)',
        list: [
          'SUPER_ADMIN · ADMIN · MODERATOR',
          'FINANCE_ADMIN · SUPPORT_ADMIN · DATA_ADMIN · AI_OPS_ADMIN · STATS_ADMIN',
          '@PreAuthorize 세분화 강제는 별도 이슈 — 현재 ADMIN role 단일 체크',
          '관리자 영역은 Nginx Basic Auth(1차) + JWT Admin role(2차) 이중 방어',
        ],
      },
      {
        title: '📊 통계 12 탭',
        text: 'overview · trends · recommendation · search · behavior · retention · revenue · subscription · point-economy · ai-service · community · engagement · content-performance · funnel · churn-risk (DB 쿼리 · Redis 캐시 하이브리드)',
      },
      {
        title: '📒 감사 로그',
        list: [
          '관리자 행위 audit_logs 테이블 — admin_id · action · target · before/after · reason',
          '포인트 수동 조정 / 이용권 지급 / 사용자 제재 전수 기록',
          'PointsHistory INSERT-ONLY 원장과 교차 감사 가능',
        ],
      },
    ],
  },

  /* ─────────── 26. Monitoring & Observability ─────────── */
  observability: {
    icon: '🔭',
    tag: 'OBSERVABILITY',
    title: 'Monitoring & Observability · Prom + Graf + ELK + LangSmith',
    desc: '메트릭(Prometheus) · 대시보드(Grafana) · 로그(ELK) · 알림(Alertmanager) · LLM 체인 추적(LangSmith) 5축 — 2026-04-15 Kibana 36 saved objects + Grafana logs 대시보드 전면 보강',
    color: '#118ab2',
    stats: [
      { value: '5축', label: '관찰 스택' },
      { value: '36', label: 'Kibana saved obj' },
      { value: '11', label: 'Alert Rules' },
      { value: '12', label: 'Grafana Logs 패널' },
    ],
    sections: [
      {
        title: '📡 메트릭 (Prometheus · VM3)',
        list: [
          'Node exporter — CPU/MEM/Disk/Network 기본 메트릭',
          'Spring Actuator / FastAPI /metrics — 레이턴시 p50/p95/p99, 에러율',
          'Agent 커스텀 — chat_requests_total, match_llm_reranker_calls_total, match_cowatch_hits_total, match_candidate_source_total',
          'Recommend — like_flush_batch_size, like_flush_duration_seconds',
        ],
      },
      {
        title: '📈 Grafana 대시보드',
        table: {
          headers: ['대시보드',              '패널 수', '핵심 패널'],
          rows: [
            ['monglepick-logs (2026-04-15)', '12',    'Backend/Agent/Recommend/Nginx 실시간 로그 스트림 2'],
            ['infra-overview',               '—',     'CPU/MEM/Disk/Net per VM'],
            ['agent-quality',                '—',     'Retrieval quality, rerank latency, MMR distribution'],
            ['payment',                      '—',     '결제 성공률 / 보상 실패 / COMPENSATION_FAILED 패턴 알람'],
          ],
        },
      },
      {
        title: '🚨 Alertmanager 알림 룰 (11개)',
        list: [
          'Backend 5xx 비율 · Agent p95 응답시간 · Recommend Redis 연결 실패',
          'COMPENSATION_FAILED 로그 패턴 · 결제 실패율 급증',
          'vLLM /health 3회 연속 실패 · Ollama 모델 미로드',
          'DB 커넥션 풀 90% 초과 · Qdrant 점유율 · Disk 85% 초과',
          'Admin 시스템 탭 모니터링 접속 가이드(2026-04-15) 에 요약 노출',
        ],
      },
      {
        title: '📋 로그 (ELK 8.13)',
        list: [
          'es-bootstrap init 컨테이너가 인덱스 템플릿/ILM 정책 자동 PUT',
          'kibana-setup init 컨테이너가 saved objects(36) NDJSON 프로비저닝',
          'Data View 5 · Saved Search 4 · Visualization 22 · Dashboard 4 (로그 개요/Backend/Agent+Recommend/Nginx)',
          '30일 ILM — warm 7일 · cold 14일 · delete 30일',
        ],
      },
      {
        title: '🧠 LangSmith (LLM 체인 추적)',
        list: [
          'intent_emotion / preference / question / explanation / rerank 체인의 입출력·latency 전수 캡처',
          '실패/환각 케이스를 샘플로 추출해 프롬프트 개선 피드백 루프',
          '환경변수 LANGCHAIN_TRACING_V2=true 로 on/off',
        ],
      },
      {
        title: '🪟 운영 관찰 접속',
        text: '관리자 시스템 탭 "모니터링 접속 가이드"(2026-04-15, MonitoringGuide.jsx)에 Grafana/Kibana/Prometheus/Alertmanager URL + Basic Auth 계정 + 주요 알림 룰 요약이 한 화면에 노출. URL/계정 복사 버튼 제공.',
      },
    ],
  },
};
