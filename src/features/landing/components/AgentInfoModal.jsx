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

// eslint-disable-next-line react-refresh/only-export-components
export const AGENT_MODAL_CONTENT = {

  /* ─────────── 1. Chat Agent 16노드 ─────────── */
  chatAgent: {
    icon: '💬',
    tag: 'CHAT AGENT',
    title: '대화형 추천 AI · 내 말을 알아듣는 16단계 처리',
    desc: '"오늘 우울한데 뭐 볼까요?" 한 마디면 충분합니다. AI가 메시지에서 감정(우울, 설렘, 분노 등)과 의도(추천 요청, 정보 질문, 잡담 등)를 동시에 파악하고, 16개의 처리 단계를 자동으로 거쳐 맞춤 영화 카드를 실시간으로 보여줍니다. 단순히 키워드를 검색하는 것이 아니라, 마치 영화를 잘 아는 친구에게 물어보는 것처럼 대화를 주고받으며 점점 더 정확한 추천을 받을 수 있어요. 16개 노드는 LangGraph 상태 그래프로 연결되어, 이전 대화 내용이 다음 단계에 자동으로 전달됩니다.',
    color: '#ef476f',
    stats: [
      { value: '16', label: '처리 단계' },
      { value: '4가지', label: '대화 유형 분기' },
      { value: '실시간', label: 'SSE 스트리밍' },
      { value: '8종', label: '알림 이벤트' },
    ],
    sections: [
      {
        title: '어떤 말을 해도 적합한 길로 안내해요',
        steps: [
          { title: '영화 추천 / 검색', desc: '취향·감정·필터 조건을 파악한 뒤 3개 DB에서 동시에 검색합니다. AI가 후보를 다시 점수 매기고, 비슷한 영화가 몰리지 않게 분산해 최종 추천까지 이어져요.' },
          { title: '감독·배우 관계 탐색', desc: '"봉준호 감독 스릴러에 나온 배우의 다른 영화"처럼 여러 단계의 연관 관계를 탐색합니다. 그래프 DB(Neo4j)가 감독-배우-영화의 연결망을 멀티홉으로 추적해요.' },
          { title: '몽글이와 자유 대화', desc: '영화 추천이 아닌 일상 대화나 감상 이야기를 나눌 때는 몽글이 페르소나로 응답합니다. EXAONE 1.2B 모델이 자연스럽고 친근한 대화 상대가 되어줘요.' },
          { title: '정보 조회', desc: '상영 시간표, 예매 링크, OTT 서비스 정보 등 사실 정보가 필요할 때는 외부 도구 7종을 호출해 정확한 답변을 제공합니다. 추측이 아닌 실제 데이터를 기반으로 답해요.' },
        ],
      },
      {
        title: '16개 처리 단계는 이렇게 구성돼요',
        list: [
          { label: '진입', value: '이전 대화 맥락 불러오기 → 이미지 첨부 여부 확인 → 이미지 분석 (있을 때만). 이미지를 함께 보내면 포스터나 장면 사진에서 영화 분위기를 읽어냅니다.' },
          { label: '분류', value: '의도·감정 동시 분류 → 4가지 처리 경로 중 하나로 안내. "오늘 우울해"라고 하면 감정(우울)과 의도(추천 요청)를 함께 파악합니다.' },
          { label: '추천 경로', value: '취향 정제 → 검색 쿼리 생성 → 3DB 병렬 검색 → 품질 확인 → AI 재정렬 → 다양성 분산 정렬 → 설명 생성. 이 경로가 가장 많이 사용되는 핵심 흐름입니다.' },
          { label: '재질문 경로', value: '취향 정보가 부족하거나 검색 품질이 낮을 때 AI가 선택지 카드를 제안합니다. 추측해서 엉뚱한 추천을 하는 것보다 한 번 더 물어보는 게 낫다는 원칙을 따릅니다.' },
          { label: '관계 탐색', value: '그래프 DB(Neo4j)에서 감독·배우·작품 연결망을 여러 단계로 탐색합니다. 필모그래피, 교집합, 연쇄 탐색 세 가지 패턴을 지원해요.' },
          { label: '일반/도구', value: '몽글이 자유 응답(잡담·감상 이야기)과 외부 도구 7종 호출(정보 조회)이 이 경로를 통해 처리됩니다.' },
          { label: '출력', value: '모든 경로가 하나의 응답 포맷으로 수렴합니다. SSE 스트림으로 영화 카드, 선택지 카드, 텍스트 응답이 화면에 순서대로 흘러와요.' },
        ],
      },
      {
        title: '의도를 먼저 파악합니다',
        text: '첫 질문 한 줄에서 사용자의 목적, 필터 조건(장르·연도·OTT·국가 등), 핵심 키워드, 감정 상태를 한꺼번에 뽑아냅니다. 예를 들어 "넷플릭스에서 볼 수 있는 90년대 일본 애니메이션"이라고 하면 OTT·연도·언어·장르를 모두 자동으로 파악해요. 정보가 충분하면 바로 검색하고, 부족하면 AI가 만들어준 선택지 카드를 먼저 보여줘 한 번 더 확인합니다.',
        note: '"애매하면 무리해서 추천하지 않고 한 번 더 묻는다" — 엉뚱한 추천 5편을 보여주는 것보다 정확한 질문 하나가 사용자 경험에 더 좋습니다. 대화가 이어질수록 AI가 파악하는 조건이 쌓여 추천 품질이 높아져요.',
      },
      {
        title: '어디서 오류가 나도 끊기지 않아요',
        list: [
          '모든 처리 단계에 개별 오류 방어 코드가 있습니다. 한 단계가 실패해도 그 단계를 건너뛰고 다음 단계로 이어져 응답이 완전히 끊기는 일이 없어요.',
          'AI API(Solar) 실패 시 → EXAONE 자유 텍스트 생성 → 미리 정의된 정적 선택지 순으로 자동 대체합니다. 인터넷이 불안정하거나 외부 API 장애가 있어도 응답이 돌아와요.',
          'AI 재정렬(LLM Reranker)이 10초 안에 끝나지 않으면 기존 점수만으로 자동 진행합니다. 속도가 느려질 수는 있지만 응답이 누락되는 일은 없어요.',
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
    title: '영화 검색 엔진 · 3가지 방식으로 동시에 찾기',
    desc: '"의미로 찾기(벡터)" + "단어로 찾기(키워드)" + "관계로 찾기(그래프)" 세 가지를 동시에 돌리고, 결과를 하나로 합쳐 가장 적합한 영화를 골라냅니다. 한 가지 방식만 쓰면 놓치는 영화가 생깁니다. 예를 들어 "봉준호 기생충"은 키워드 검색이 빠르지만, "오늘 우울해"처럼 감정적인 표현은 의미 벡터 검색이 훨씬 정확해요. 세 방식을 병렬로 실행해 속도를 유지하면서도 각 방식의 장점을 모두 취합니다. 어느 한 DB가 응답하지 않아도 나머지 두 개로 정상 작동하도록 장애 대응도 내장되어 있습니다.',
    color: '#f97316',
    stats: [
      { value: '4096차원', label: 'AI 의미 벡터' },
      { value: 'k=60', label: 'RRF 융합 상수' },
      { value: '70/30', label: '관련성/다양성 비율' },
      { value: '3가지', label: '동시 검색 방식' },
    ],
    sections: [
      /* ── A. 인덱싱 파이프라인 ── */
      {
        title: '영화 데이터를 미리 준비하는 과정',
        text: '사용자가 검색하기 전, 4개 외부 데이터 소스를 모아 정제한 뒤, 각 영화의 제목·줄거리·장르·감독·무드를 AI가 읽을 수 있는 숫자 형태(벡터)로 변환해 5개 데이터베이스에 미리 저장해 둡니다. 마치 도서관의 사서가 모든 책에 목차·키워드·분류 태그를 붙여 놓는 것처럼, 검색 요청이 들어왔을 때 즉시 꺼낼 수 있는 상태로 준비해두는 사전 작업입니다.',
        steps: [
          { title: '수집', desc: 'TMDB·KOBIS·KMDb 등 4개 소스에서 117만 편을 수집합니다. API 요청 속도 제한을 지키고, 중단된 위치(커서)를 기억해 중간에 멈춰도 이어서 재개할 수 있어요.' },
          { title: '정제', desc: '장르·무드·메타데이터를 통일된 형식으로 변환하고, 중복 영화를 제거하며, 한국어·영어·기타 언어 필드를 분리합니다. 소스마다 다른 장르 코드와 날짜 형식을 하나의 기준으로 맞춰요.' },
          { title: 'AI 임베딩', desc: 'Upstage Solar AI가 각 영화의 제목·줄거리·장르·감독·무드 태그를 합쳐 4096차원 숫자 벡터로 변환합니다. 이 벡터가 "영화의 의미"를 수학적으로 표현해, "오늘 우울해"라는 문장과 어울리는 영화를 거리 계산으로 찾게 해줘요.' },
          { title: '5개 DB 저장', desc: '벡터 DB(Qdrant), 키워드 검색 DB(Elasticsearch), 그래프 DB(Neo4j), 관계형 DB(MySQL), 캐시(Redis)에 동시에 저장합니다. 같은 영화가 중복 저장되지 않도록 영화 ID 기준 업서트(있으면 갱신, 없으면 삽입)로 처리해요.' },
        ],
        note: '현재 91만 편 적재 완료. 다국어 검색 코드(ML-1~3)는 완성됐고, 운영 서버 전체 재적재(ML-4)가 남은 작업입니다.',
      },

      /* ── B. 3개 백엔드 역할 ── */
      {
        title: '3가지 DB가 각각 다른 방식으로 찾아요',
        table: {
          headers: ['DB', '찾는 방식', '특징'],
          rows: [
            ['Qdrant (벡터 DB)', '"오늘 우울해" → 비슷한 감정의 영화 검색', '의미·감정 기반 유사도 검색 · 4096차원 코사인 유사도'],
            ['Elasticsearch (검색 엔진)', '"봉준호 기생충" 키워드로 검색', '한국어 형태소 분석(Nori) · 제목/줄거리/감독 가중 검색'],
            ['Neo4j (그래프 DB)', '"이 배우가 나온 다른 영화" 관계 탐색', '감독-배우-영화 연결망 · 멀티홉 연관 검색'],
            ['Redis (캐시)', '자주 찾는 결과를 빠르게 재사용', '세션 캐시 · 실시간 인기 영화 캐시'],
            ['MySQL (관계형 DB)', '영화 메타데이터의 단일 진실 원본', '88개 테이블 · 영화 상세 정보'],
          ],
        },
      },

      /* ── C. 쿼리 파이프라인 노드 흐름 ── */
      {
        title: '실제 검색이 진행되는 순서',
        steps: [
          { title: '취향 파악', desc: '사용자 메시지에서 원하는 장르·분위기·필터 조건(연도·OTT·국가 등), 감정 상태를 한꺼번에 추출합니다. 이전 대화에서 파악한 조건도 누적 반영돼요.' },
          { title: '검색 쿼리 변환', desc: '추출된 조건을 Qdrant 벡터 쿼리, ES 키워드 쿼리, Neo4j Cypher 쿼리 세 가지 형식으로 동시에 변환합니다. DB마다 쿼리 언어가 달라 각각 맞춤 변환이 필요해요.' },
          { title: '3DB 병렬 검색', desc: '벡터 DB·키워드 검색·그래프 DB를 동시에 조회합니다. 병렬로 돌려 응답 시간을 줄이고, 각 DB에 10초 제한을 걸어 하나가 느려져도 전체가 막히지 않아요.' },
          { title: 'RRF 융합 (여러 결과를 하나로)', desc: '3개 DB에서 온 결과 목록을 순위 기반 점수(RRF k=60)로 합산해 최종 후보 리스트를 만듭니다. 여러 DB에서 동시에 나온 영화일수록 점수가 높아져요.' },
          { title: '품질 확인', desc: '후보가 3편 미만이거나 최고 점수가 기준(0.010) 미달이면 무리해서 추천하지 않고 재질문 경로로 분기합니다. 엉뚱한 추천보다 정확한 조건 파악이 먼저예요.' },
          { title: 'AI 재정렬', desc: 'Solar AI가 후보 10편을 사용자의 감정·취향·대화 맥락에 비추어 0~1점으로 다시 평가합니다. 단순 유사도가 아닌 "이 사람에게 지금 이 영화가 맞는가"를 판단해요.' },
          { title: '다양성 보장', desc: 'MMR 알고리즘(λ=0.7)으로 비슷한 영화가 몰리지 않게 분산 정렬합니다. 관련성 70%와 다양성 30%를 균형 있게 맞춰, 같은 감독 영화가 5편 모두 차지하는 현상을 막아요.' },
        ],
      },

      /* ── D. 3 백엔드 top_k & 타임아웃 ── */
      {
        title: 'DB별 검색 수량과 장애 대응',
        table: {
          headers: ['DB', '검색 수량', '제한 시간', '실패 시 처리'],
          rows: [
            ['Qdrant (벡터)', '30편', '10초', '빈 결과 반환 → 나머지 2개 DB로만 진행'],
            ['Elasticsearch (키워드)', '20편', '10초', '동일'],
            ['Neo4j (그래프)', '15편', '10초', '동일'],
          ],
        },
        text: '3개 DB를 동시에 조회합니다. 각 DB마다 검색 수량을 다르게 설정한 이유는 역할 차이 때문입니다. 벡터 DB는 의미 유사도 후보를 넓게 수집해야 해서 30편, 키워드 검색은 정밀도가 높아 20편, 그래프 DB는 관계 탐색 특성상 15편으로 설정했어요. 하나가 느려지거나 오류가 나도 나머지 두 DB 결과로 정상 응답합니다.',
      },

      /* ── E. RRF 공식 ── */
      {
        title: 'RRF — 여러 검색 결과를 하나로 합치는 방법',
        code: `# rag/hybrid_search.py :: reciprocal_rank_fusion()
RRF_K = 60   # config.py:250

score(d) = Σ_i  1 / (RRF_K + rank_i(d))

# i ∈ {qdrant, es, neo4j}
# rank_i(d) : 백엔드 i 의 결과 내 랭크 (1-base)
# dedup key : movie_id  (가장 풍부한 metadata 보존)`,
        note: 'k=60: 상위 영화들 간의 점수 차이를 완만하게 조정해 한 DB의 점수 체계가 결과를 독점하지 않도록 합니다. 예를 들어 Elasticsearch가 특정 영화에 130점을 줘도, Qdrant에서 1위로 나온 다른 영화가 최종 순위에서 뒤처지지 않아요. 세 DB가 동등한 발언권을 갖는 구조입니다.',
      },

      /* ── F. retrieval_quality_checker 임계값 ── */
      {
        title: '검색 품질이 낮으면 재질문으로 전환해요',
        table: {
          headers: ['기준', '값', '의미'],
          rows: [
            ['최소 후보 수', '3편', '3편도 안 나오면 → 조건을 다시 물어봄'],
            ['최고 점수 하한', '0.010', '최상위 영화 점수가 너무 낮으면 → 재질문'],
            ['평균 점수 하한', '0.008', '상위 5편 평균 점수 기준'],
            ['애매함 기준', '0.020', '3턴 이전이고 점수가 애매하면 → 확인 질문 먼저'],
            ['취향 충분성', '2.0', '파악된 취향 정보의 합산 점수 기준'],
          ],
        },
        text: '검색 품질이 기준에 미달하면 무리해서 추천하지 않고, 먼저 조건을 더 파악합니다. 대화 3턴 이전에 점수가 애매한 구간(0.010~0.020)에 들어오면 바로 추천하지 않고 AI가 만든 선택지 카드로 의도를 재확인해요. 3턴 이후에는 조건이 어느 정도 쌓였다고 보고 추천을 시도합니다.',
      },

      /* ── G. LLM Reranker ── */
      {
        title: 'AI가 후보를 다시 점수 매겨요',
        list: [
          '검색된 상위 10편의 메타데이터와 사용자의 현재 감정·취향·대화 맥락을 AI(Solar API)에 한 번에 전달합니다. 단순한 유사도 순위가 아니라 "지금 이 사람에게 이 영화가 맞는가"를 판단하는 단계예요.',
          'AI가 각 영화를 0~1점으로 재평가하고 짧은 추천 이유도 함께 생성합니다. 이 이유가 화면에 표시되는 "왜 이 영화를 추천했는지" 설명의 기반이 돼요.',
          '10초 제한 시간이 있습니다. 타임아웃이나 API 오류가 발생하면 LLM 점수 없이 RRF 점수만으로 자동 진행합니다. 품질이 약간 낮아질 수 있지만 응답이 완전히 실패하지는 않아요.',
          'AI 재정렬이 실패해도 응답이 끊기지 않는 이유가 바로 이 폴백 설계입니다. "있으면 더 좋고, 없으면 기존 방식으로" 원칙을 지켜요.',
        ],
      },

      /* ── H. recommendation_ranker / MMR ── */
      {
        title: 'MMR — 비슷한 영화가 몰리지 않게 분산해요',
        code: `# config.py :: MMR_LAMBDA = 0.7
# nodes.py :: recommendation_ranker

MMR(c) = λ · relevance(c)
       − (1 − λ) · max( sim(c, s) for s in selected )

# λ = 0.7  → 관련성 70%, 다양성 30%
# relevance = LLM_rerank · w_llm + RRF · w_rrf
# sim       = 장르/무드/감독 자카드 평균`,
        note: '같은 감독이나 장르 영화가 1~5위를 모두 차지하는 현상을 수학적으로 방지합니다. λ=0.7로 설정해 관련성을 70% 유지하면서도 나머지 30%는 다양성을 강제 확보해요. 예를 들어 봉준호 감독 영화 5편 대신, 봉준호 2편 + 비슷한 한국 장르물 2편 + 다른 감독의 비슷한 분위기 1편처럼 폭넓은 추천이 가능해집니다.',
      },

      /* ── I. 4단계 완화 ── */
      {
        title: '결과가 없을 때 4단계로 넓혀가요',
        list: [
          { label: '1단계', value: '정상 검색 — 사용자가 요청한 모든 조건을 그대로 적용합니다. 가장 정확하지만 결과가 적을 수 있어요.' },
          { label: '2단계', value: '유사 검색 — 1차 후보의 장르·분위기·키워드를 자동으로 확장해 재검색합니다. "한국 범죄 스릴러"가 부족하면 "아시아 범죄 스릴러"로 넓혀요.' },
          { label: '3단계', value: '재질문 우선 — 대화 초반이고 결과가 여전히 애매하면 무리하게 추천하지 않고 AI가 선택지 카드로 조건을 재확인합니다.' },
          { label: '4단계', value: '자유 응답 — 끝까지 결과가 부족하면 몽글이가 자유롭게 대화로 안내합니다. 검색이 실패해도 빈 화면이 아닌 자연스러운 응답을 보여줘요.' },
        ],
      },

      /* ── J. 그래프 멀티홉 패턴 ── */
      {
        title: '감독·배우 관계를 여러 단계로 탐색해요',
        table: {
          headers: ['유형', '예시 질문', '탐색 방식'],
          rows: [
            ['필모그래피', '"봉준호 감독 작품 알려줘"', '감독 노드 → 연출한 영화 엣지 → 영화 노드 → 평점순 정렬'],
            ['교집합', '"최민식이랑 송강호 같이 나온 영화"', '배우A 출연 영화 집합 ∩ 배우B 출연 영화 집합'],
            ['연쇄 탐색', '"봉준호 스릴러에 나온 배우의 다른 영화"', '감독 → 장르 필터 영화 → 출연 배우 → 그 배우의 다른 작품 (3홉)'],
          ],
        },
      },

      /* ── K. 다국어 검색 ML-1~3 ── */
      {
        title: '한국어뿐 아니라 영문 제목으로도 찾아요',
        list: [
          '영문 제목·영문 줄거리·다른 언어 이름으로도 검색 가능하도록 다중 필드 색인을 적용했습니다. "Parasite"로 검색해도 기생충이 나와요.',
          'AI 임베딩 모델(Solar)은 다국어를 지원해 하나의 4096차원 벡터로 여러 언어를 처리합니다. 언어가 달라도 의미가 비슷하면 같은 벡터 공간에 가깝게 위치해요.',
          '다국어 검색 코드(ML-1~3)는 이미 완성됐고, 운영 서버에서 전체 데이터를 다시 적재하는 작업(ML-4)이 남아 있어 실제 운영 적용은 진행 예정입니다.',
        ],
        note: '운영 재적재 실행 가이드: docs/Phase_ML-4_DB재적재_실행가이드.md — 서비스 중단 없이 교체하는 방식으로 진행 예정',
      },

      /* ── L. 추가 신호 ── */
      {
        title: '점수에 반영되는 추가 요소들',
        list: [
          { label: '인기도', value: '많이 본 영화일수록 검색 단계에서 약간 우선합니다. 완전히 무명인 영화가 상위를 독점하지 않도록 ES function_score와 RRF popularity prior로 두 단계에서 조정해요.' },
          { label: '평점', value: '평점과 평가 수가 높을수록 소폭 가산합니다. 평점만 높고 평가 수가 적은 영화는 신뢰도가 낮으므로 두 값을 함께 반영해요.' },
          { label: '무드', value: '사용자가 원하는 분위기(잔잔함, 긴장감, 따뜻함 등 24종)와 일치하는 영화를 우선 배치합니다. AI가 영화 줄거리에서 자동 태깅한 무드를 활용해요.' },
          { label: 'OTT', value: '사용자가 가입한 OTT에서 볼 수 있는 영화를 우선합니다. 아무리 좋은 영화도 볼 수 없으면 의미가 없으니까요.' },
          { label: '연도/언어', value: '"최근 영화", "한국 영화" 등 조건이 있으면 검색 전 사전 필터로 걸러냅니다. 범위가 명확한 조건은 AI에게 판단을 맡기지 않고 하드 필터로 빠르게 처리해요.' },
        ],
      },
    ],
  },

  /* ─────────── 2. Movie Match Agent v3 ─────────── */
  matchAgent: {
    icon: '🎬',
    tag: 'MOVIE MATCH',
    title: '둘이 영화 고르기 · 두 취향의 교차점 찾기',
    desc: '연인이나 친구끼리 영화를 고를 때 "나는 액션, 너는 로맨스"처럼 취향이 달라 결정을 못 하는 상황이 있죠. 각자 좋아하는 영화를 하나씩 고르면, AI가 두 영화의 장르·분위기·키워드·의미 벡터를 교차 분석해 둘 다 즐길 수 있는 영화 5편을 찾아줍니다. 단순히 중간 지점을 찾는 것이 아니라, 실제로 두 영화를 모두 좋아했던 사람들이 또 좋아한 영화 데이터까지 활용해 더 신뢰도 높은 추천을 제공해요. 7단계 처리 흐름으로 진행되며, AI 평가·유사도 계산·협업 필터링 세 가지를 합산한 점수로 최종 순위를 매깁니다.',
    color: '#a78bfa',
    stats: [
      { value: '7단계', label: '처리 흐름' },
      { value: '5편', label: '추천 결과' },
      { value: '4단계', label: '결과 확장 전략' },
      { value: 'AI 50%', label: '최종 점수 반영' },
    ],
    sections: [
      {
        title: '최종 점수는 세 가지를 섞어 계산해요',
        text: 'AI 점수(50%), 두 영화 간 조화 평균 유사도(30%), "둘 다 좋아한 사람들의 협업 필터링 데이터"(20%) 세 가지를 가중 합산합니다. 조화 평균을 쓰는 이유는 두 영화의 유사도 점수 중 낮은 쪽이 발목을 잡지 않도록 균형을 잡기 위해서예요. AI 평가가 실패하면 나머지 두 요소로 자동 대체되어 결과가 끊기지 않습니다.',
        code: `final = 0.5 · llm + 0.3 · harmonic + 0.2 · cf

harmonic_sim = harmonic_mean(s1, s2)
             × (0.7 + 0.3 · (1 − |s1 − s2|))

similarity   = 0.35 · genre
             + 0.25 · mood
             + 0.15 · keyword
             + 0.25 · vector`,
      },
      {
        title: '후보 영화를 세 가지 방식으로 모아요',
        list: [
          { label: '벡터 중간값', value: '두 영화의 AI 의미 벡터를 평균 내어 "두 취향의 중간 지점"에 가장 가까운 영화를 검색합니다. 마치 두 점 사이의 중간 좌표를 찾는 것처럼, 두 취향을 동시에 만족하는 벡터 공간의 중심을 탐색해요.' },
          { label: '하이브리드 검색', value: '벡터·키워드·그래프 DB를 동시에 조회해 폭넓게 후보를 수집합니다. 벡터만으로는 놓칠 수 있는 제목·감독·배우 기반 영화도 포함해요.' },
          { label: '공동 시청 데이터', value: '두 영화를 모두 별점 3.5 이상으로 평가한 실제 사용자들이 또 좋아한 영화를 후보로 올립니다. 수학적 계산이 아닌 실제 감상 데이터 기반이라 신뢰도가 높아요.' },
          { label: '4단계 자동 확장', value: '후보가 5편 미만이면 검색 조건을 점진적으로 완화해 재검색합니다. 장르 제한 해제 → 연도 범위 확장 → 언어 제한 해제 → 자유 응답 순으로 진행해요.' },
        ],
      },
      {
        title: 'AI가 후보를 다시 평가해요',
        text: 'Solar AI가 후보 영화들을 두 취향의 관점에서 0~1점으로 평가합니다. 단순히 각 영화와 유사한 것을 찾는 게 아니라, "이 두 사람이 함께 봤을 때 둘 다 만족할 것인가"를 판단하는 맥락 기반 평가예요. 10초 안에 응답이 없거나 오류가 나면 유사도·공동 시청 점수만으로 자동 진행되어 결과가 끊기지 않습니다.',
      },
      {
        title: '성능 모니터링 지표',
        list: [
          '총 매칭 요청 수 추적 — 기능 사용량을 파악해 서버 자원을 적절히 배분해요.',
          '응답 속도 분포 (중간값·상위 5%·상위 1% 지연 시간) — 느린 요청이 얼마나 되는지 Prometheus 히스토그램으로 추적합니다.',
          'AI 재정렬 호출 수·오류 수 — Solar API 장애 여부와 폴백 빈도를 모니터링해요.',
          '"둘 다 본 사용자" 데이터 활용 횟수 — 공동 시청 데이터가 실제로 추천에 기여하는 비율을 측정합니다.',
          '후보 출처별 비율 (벡터·RRF·공동시청) — 어떤 방식이 더 좋은 후보를 만드는지 지속적으로 분석해 가중치를 조정해요.',
        ],
      },
    ],
  },

  /* ─────────── 3. Content Analysis Agent ─────────── */
  /* ─────────── 4. Roadmap Agent ─────────── */
  roadmapAgent: {
    icon: '🗺️',
    tag: 'ROADMAP',
    title: '영화 도장깨기 · 나만의 15편 코스',
    desc: '"봉준호 감독 전작 마스터하기", "프랑스 누벨바그 입문" 같은 목표를 말하면 AI가 입문부터 심화까지 15편을 순서대로 큐레이션해 줍니다. 아무 영화나 15편을 나열하는 것이 아니라, 초반에는 접근하기 쉬운 작품으로 흥미를 붙이고 후반으로 갈수록 예술적·서사적으로 깊어지는 학습 곡선을 설계해요. 한 편을 보고 리뷰를 남기면 도장 1개가 쌓이고, 15편을 완주하면 코스 전용 뱃지와 보너스 포인트를 받습니다. 마치 독서 클럽의 커리큘럼처럼, 혼자서도 체계적으로 영화를 탐험할 수 있어요.',
    color: '#ffd166',
    stats: [
      { value: '15편', label: '코스당 영화 수' },
      { value: 'AI 큐레이션', label: 'LangGraph 자동 생성' },
      { value: '완주 뱃지', label: '게임화 보상' },
    ],
    sections: [
      {
        title: '어떻게 15편 코스가 만들어지나요?',
        steps: [
          { title: '목표 입력', desc: '취향 프로필과 원하는 테마를 함께 분석합니다. "봉준호 감독 전작"이면 필모그래피 데이터를, "공포 영화 처음 도전"이면 난이도 기준 입문작을 우선 탐색해요.' },
          { title: '후보 수집', desc: 'AI 검색과 그래프 DB의 감독·배우 연결망 데이터를 결합해 관련 영화를 넓게 모읍니다. 코스 테마와 관련 있는 영화가 충분히 확보될 때까지 탐색 범위를 확장해요.' },
          { title: '순서 정렬', desc: '러닝타임·장르 분포·평점·출시 연도를 고려해 난이도와 다양성이 균형 잡힌 순서로 배치합니다. 첫 편에서 흥미를 잃으면 완주가 어렵기 때문에 진입 장벽이 낮은 작품을 앞에 놓아요.' },
          { title: '15편 확정', desc: '"입문 → 발전 → 심화" 서사 흐름으로 최종 편성합니다. 같은 장르나 같은 감독 영화가 연속으로 배치되지 않도록 분산해서 완주 과정이 지루하지 않게 설계해요.' },
        ],
      },
      {
        title: '관련 API',
        list: [
          'POST /api/v1/roadmap/generate — 사용자 목표와 취향 프로필을 받아 15편 코스를 AI가 생성합니다. 생성 결과는 DB에 저장돼 이후 진행률 조회에 활용돼요.',
          'POST /api/v1/roadmap/verify-quiz — 각 편 시청 후 출제되는 단계별 퀴즈 정답을 확인합니다. 퀴즈를 통과해야 다음 단계 도장이 찍혀요.',
          'GET /api/v1/roadmap/courses/** — 내 진행 중인 코스 목록, 각 편의 완료 여부, 남은 편 수 등 진행률을 조회합니다.',
        ],
      },
      {
        title: '재미있게 완주하는 구조',
        list: [
          '편마다 시청 + 리뷰 인증을 남기면 도장 1개가 찍힙니다. 리뷰를 쓰는 행위 자체가 영화 감상을 더 깊이 하게 만드는 효과가 있어요.',
          '15편 완주 시 코스 전용 뱃지와 보너스 포인트를 지급합니다. 뱃지는 프로필에 표시돼 다른 사람들이 볼 수 있어요.',
          '관리자 페이지에서 코스 편성·수정·삭제가 가능합니다. AI가 생성한 코스를 관리자가 검수해 품질을 유지해요.',
        ],
      },
    ],
  },

  /* ─────────── 5. LLM Stack ─────────── */
  llmStack: {
    icon: '🧠',
    tag: 'LLM STACK',
    title: 'AI 모델 구성 · 역할에 맞는 AI를 따로 씁니다',
    desc: '모든 일을 한 AI에 맡기지 않고, 역할별로 최적의 모델을 배치했습니다. 하나의 거대한 모델이 모든 것을 처리하면 비용이 높고 속도가 느립니다. 대신 "의도 분류처럼 빠르고 정확해야 하는 작업"은 Solar API가, "사용자와 친근하게 대화하는 작업"은 GPU 서버에서 직접 실행하는 EXAONE 1.2B(몽글이)가 맡습니다. 영화 데이터와 대화를 숫자 벡터로 바꾸는 임베딩도 Solar의 전용 모델을 씁니다. 역할 분리 덕분에 한 모델이 장애가 나도 다른 모델로 폴백할 수 있어요.',
    color: '#7c6cf0',
    stats: [
      { value: '3가지', label: '운영 모델' },
      { value: '4096차원', label: 'AI 의미 벡터' },
      { value: 'Solar+vLLM', label: '현재 운영 방식' },
    ],
    sections: [
      {
        title: '어떤 AI가 무슨 일을 하나요?',
        table: {
          headers: ['모델', '하는 일', '서빙 방식'],
          rows: [
            ['Solar Pro (Upstage API)', '의도 분류, 취향 추출, 추천 설명 생성, AI 재정렬, 퀴즈 생성, 리뷰 검증 등 정확도가 중요한 핵심 작업 대부분', '외부 API 호출 (인터넷 필요)'],
            ['Solar Embedding (Upstage API)', '영화 정보와 사용자 대화를 4096차원 숫자 벡터로 변환합니다. 이 벡터가 "의미 기반 검색"의 핵심 재료예요', '외부 API 호출 (OpenAI 호환 형식)'],
            ['EXAONE 4.0 1.2B (LG AI)', '몽글이 페르소나로 사용자와 자연스럽고 친근한 대화를 나눕니다. 재질문 생성, 일반 대화 응답에 사용해요', 'GPU 서버(VM4, Tesla T4)에서 vLLM으로 직접 실행'],
          ],
        },
      },
      {
        title: '맥미니에서 테스트했던 모델들 (현재 운영 미사용)',
        list: [
          'EXAONE 4.0 32B — 로컬 맥미니(Apple Silicon)에서 한국어 생성 품질과 추천 설명의 자연스러움을 테스트했습니다. 성능은 좋지만 운영 서버 GPU 메모리(T4 16GB)에 올리기 어려워 Solar API로 대체했어요.',
          'Qwen 3.5 35B-A3B — 의도·감정 분류 및 포스터 이미지 비전 분석 성능을 테스트했습니다. 다국어 성능이 뛰어나지만 운영 환경에서는 Solar API로 대체했어요.',
          '두 모델 모두 "어떤 모델이 몽글픽에 가장 적합한가"를 찾는 탐색 과정에서 검증한 히스토리입니다. 현재 운영에는 포함되지 않지만, 향후 LoRA 파인튜닝 후보로 검토 중이에요.',
        ],
      },
      {
        title: '왜 역할을 나눴나요?',
        list: [
          '"분류는 빠르게, 생성은 정확하게, 대화는 친근하게" — 작업 특성에 맞는 모델을 각각 배치해 비용과 품질을 동시에 최적화했습니다.',
          'Solar API에 오류가 생기면 → EXAONE 자유 텍스트 생성 → 미리 준비된 정적 선택지 순으로 자동 대체합니다. 외부 API 의존도를 낮추는 방어 설계예요.',
          'LangSmith로 각 모델의 응답 속도, 오류율, 입출력 내용을 실시간으로 추적합니다. 어느 모델에서 품질 문제가 생기는지 빠르게 파악할 수 있어요.',
        ],
      },
      {
        title: 'GPU 서버에서 EXAONE 1.2B 직접 실행',
        text: 'GPU 서버(VM4, Tesla T4 16GB)에서 EXAONE 1.2B를 vLLM으로 직접 서빙합니다. 대화·재질문 생성용(포트 18000)과 포스터 이미지 분석용(포트 18001)을 분리해 운영하며, 두 인스턴스 중 하나가 과부하를 받아도 서로 영향을 주지 않아요. 관리자 시스템 탭의 vLLM 상태 카드에서 실시간 헬스 체크 결과를 확인할 수 있습니다.',
        note: '몽글이 페르소나(친근하고 감성적인 말투)에 맞게 EXAONE 1.2B를 LoRA 파인튜닝하는 작업이 후속 과제로 남아 있습니다. 파인튜닝이 완료되면 대화 품질이 더욱 향상될 예정이에요.',
      },
    ],
  },

  /* ─────────── 6. SSE Events ─────────── */
  sseEvents: {
    icon: '📡',
    tag: 'STREAMING',
    title: '실시간 스트리밍 · AI 응답이 흘러오는 방식',
    desc: 'AI가 처리하는 동안 결과를 조금씩 흘려보내 화면에 바로 나타납니다. 응답이 완전히 완성될 때까지 기다렸다가 한꺼번에 보여주면 사용자가 수십 초 동안 빈 화면을 봐야 하는데, SSE(Server-Sent Events — 서버가 클라이언트에게 단방향으로 데이터를 밀어주는 방식)를 쓰면 "생각 중" 표시부터 영화 카드 하나씩 등장, 설명 텍스트가 타이핑되듯 출력되는 방식으로 즉각적인 피드백을 줄 수 있습니다. 8종의 이벤트가 정해진 순서로 도착하며, 각각이 화면의 서로 다른 부분(진행 인디케이터, 영화 카드, 선택지 버튼, 포인트 바 등)을 독립적으로 갱신합니다. 브라우저 기본 EventSource API는 인증 헤더를 붙일 수 없어, ReadableStream과 TextDecoder를 직접 조합한 커스텀 파싱으로 구현했습니다.',
    color: '#118ab2',
    stats: [
      { value: '8가지', label: '알림 이벤트 종류' },
      { value: 'SSE', label: '실시간 스트림 방식' },
      { value: 'ReadableStream', label: '커스텀 파싱' },
      { value: 'AbortController', label: '스트림 취소 지원' },
    ],
    sections: [
      {
        title: '화면에 순서대로 도착하는 8가지 신호',
        table: {
          headers: ['이벤트', '도착 시점', '담긴 정보', '화면 반응'],
          rows: [
            ['session', '대화 시작 직후', '세션 ID, 사용자 ID', 'localStorage에 저장 — 이어하기에 활용'],
            ['status', '처리 단계마다', '"영화를 찾고 있어요" 같은 진행 메시지', '상단 상태 인디케이터 문구 교체'],
            ['movie_card', '영화 카드 하나씩', '영화 정보, 점수, 추천 기록 ID', '카드 한 장이 애니메이션으로 등장'],
            ['clarification', '조건이 부족할 때', '확인 질문 + AI 생성 선택지 카드', '선택지 버튼 카드 렌더링 (클릭=자동 전송)'],
            ['token', '설명 텍스트 스트리밍', '글자 단위로 흘러오는 AI 설명 (delta)', '텍스트가 타이핑되듯 한 글자씩 표시'],
            ['point_update', '추천 완료 직전', '남은 이용 횟수, 소스(무료/구독/이용권)', '포인트 바에 "오늘 무료 1/3" 등 소스별 현황'],
            ['done', '응답 완전 종료', '총 추천 수, 소요 시간', '입력창 다시 활성화, 스트림 닫기'],
            ['error', '오류 발생 시', '오류 코드, 안내 메시지', '잔액 -1P 감지 시 "서비스 일시 오류" 배너'],
          ],
        },
      },
      {
        title: 'SSE 파싱이 어떻게 작동하나요?',
        text: '서버가 보내는 텍스트 스트림을 "\\n\\n" 기준으로 블록을 나누고, 각 블록에서 "event: 이벤트명"과 "data: JSON 본문"을 분리해 파싱합니다. 마치 편지 봉투(이벤트 타입)와 편지 내용(데이터)을 따로 읽는 것처럼요. 파싱에 실패해도 해당 블록을 건너뛰고 다음 블록을 이어서 처리하므로 스트림 전체가 중단되지 않습니다. AbortController를 사용해 사용자가 채팅창을 닫거나 새 질문을 보내면 진행 중인 스트림을 즉시 취소할 수 있어요.',
        code: `// chatApi.js — SSE 파싱 핵심 로직
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const blocks = buffer.split('\\n\\n');

  for (const block of blocks.slice(0, -1)) {
    const eventMatch = block.match(/^event: (.+)/m);
    const dataMatch  = block.match(/^data: (.+)/ms);
    if (eventMatch && dataMatch) {
      onEvent(eventMatch[1], JSON.parse(dataMatch[1]));
    }
  }
  buffer = blocks.at(-1); // 마지막 불완전 블록 유지
}`,
      },
      {
        title: '포인트 차감 시점을 정확히 잡아요',
        text: '영화 카드(movie_card 이벤트)가 실제로 화면에 표시되기 직전에만 이용 횟수를 차감합니다. "조건 확인 질문"만 주고받는 동안에는 차감하지 않는데, 이전 v3.3 설계에서는 "질문 시점에 소비"로 구현되어 영화 추천을 받지 않고 부가 질문만 해도 쿼터가 소진되는 문제가 있었습니다. v3.4(2026-04-15)에서 Agent의 consume_point 호출을 recommendation_ranker 노드의 movie_card yield 직전으로 이동해 수정했어요. 남은 횟수는 "오늘 무료 1/3회", "이용권 N회", "구독 보너스 N회" 형태로 소스별로 화면 하단 포인트 바에 정확하게 표시됩니다.',
      },
      {
        title: '앱이 끊기지 않는 이유',
        list: [
          '실시간 스트림 수신 중 로그인 토큰(JWT, 신분증)이 만료되어도 백그라운드에서 자동 갱신한 뒤 재연결합니다. 사용자는 스트림이 잠깐 멈췄다가 이어지는 것을 느낄 수 있지만, 완전히 끊기지는 않아요.',
          '선택지 카드(clarification) 이벤트가 도착하면 화면에 즉시 클릭 가능한 버튼 카드로 렌더링됩니다. 카드를 클릭하면 해당 텍스트가 채팅 입력창에 자동으로 전송돼 추가 타이핑 없이도 대화를 이어갈 수 있어요.',
          'error 이벤트에서 잔액 값이 -1P로 오면 "포인트 서비스 일시 오류" 배너를 표시합니다. 이전에는 "-1P / 필요 0P 포인트 부족"처럼 의미 없는 폴백값이 그대로 노출되어 사용자가 혼란스러워하던 문제를 2026-04-15 수정했어요.',
          '브라우저 기본 EventSource API는 Authorization 헤더를 붙일 수 없어서, fetch + ReadableStream + TextDecoder를 조합한 커스텀 파서를 직접 구현했습니다. 덕분에 JWT 토큰을 헤더로 전달하며 인증된 스트리밍이 가능해요.',
        ],
      },
    ],
  },

  /* ─────────── 7. Memory Architecture ─────────── */
  memoryArch: {
    icon: '🧊',
    tag: 'MEMORY',
    title: '대화 기억 구조 · 빠른 캐시 + 영구 저장',
    desc: '대화 내용을 두 곳에 나눠 저장합니다. AI가 응답할 때마다 빠른 접근이 필요하므로 Redis(인메모리 저장소 — RAM에서 동작해 디스크보다 수십 배 빠름)에 즉시 기록하고, 동시에 MySQL에 영구 보관해 앱을 닫았다가 다시 열어도 "이전 대화 이어하기"를 지원합니다. 단순히 두 곳에 동시 저장하는 게 아니라, 실시간 대화는 Redis가 단일 기준으로 처리하고, MySQL 저장은 비동기(응답 속도에 영향 없음)로 진행하는 write-behind(캐시에 쓰고 나중에 DB에 반영) 방식입니다. 이 구조 덕분에 이전 대화 목록을 빠르게 불러오면서도 세션이 영구 보존됩니다.',
    color: '#06d6a0',
    stats: [
      { value: '2단계', label: '저장 구조 (빠름·영구)' },
      { value: '비동기', label: 'write-behind 저장' },
      { value: '이어하기', label: '지원 기능' },
      { value: 'cache-aside', label: '이력 조회 패턴' },
    ],
    sections: [
      {
        title: '대화가 저장되는 흐름',
        steps: [
          { title: 'Redis (빠른 캐시)', desc: '대화할 때마다 즉시 읽고 씁니다. 매 턴마다 Redis R/W가 발생하며, 세션이 진행되는 동안의 단일 진실 원본(Single Source of Truth) 역할을 해요. 덕분에 AI가 직전 대화 내용을 불러올 때 DB를 거치지 않아 응답 속도가 빠릅니다.' },
          { title: '비동기 영구 저장', desc: 'AI Agent가 대화 응답을 돌려준 뒤 백그라운드로 Backend /session/save를 fire-and-forget(결과를 기다리지 않음) 방식으로 호출합니다. 저장이 늦어져도 사용자의 응답이 지연되지 않아요. 이 호출이 실패해도 대화는 계속되고, 나중에 재시도할 수 있어요.' },
          { title: 'MySQL (영구 보관)', desc: 'chat_session_archive 테이블에 모든 대화 이력이 영구 보존됩니다. 이 테이블이 이력 조회(마이페이지 > 이전 대화 목록)의 단일 진실 원본이에요. Redis 캐시가 삭제되거나 서버가 재시작돼도 MySQL에서 복원할 수 있습니다.' },
          { title: '이력 조회 (cache-aside)', desc: '"이전 대화" 페이지를 열면 먼저 MySQL에서 목록을 불러온 뒤, 자주 조회되는 최근 세션을 Redis에 워밍(미리 올려두기)합니다. 이후 동일 세션에 재진입하면 Redis에서 바로 꺼내 빠르게 제공해요.' },
        ],
      },
      {
        title: '비로그인 사용자는 저장하지 않아요',
        text: '로그인하지 않은 게스트 세션은 저장하지 않고 현재 탭에서만 유지됩니다. 브라우저를 닫으면 대화 내용이 사라져요. 로그인하면 그 시점부터의 대화가 저장되기 시작하며, 이전 게스트 대화는 소급해서 저장되지 않습니다. 비로그인 상태에서는 user_id가 빈 문자열("")로 처리되어 Redis와 MySQL 양쪽 저장을 모두 건너뜁니다.',
      },
      {
        title: '채팅 이력이 저장 안 되던 버그 수정 (2026-04-15)',
        text: 'Backend(Spring Boot, jjwt 라이브러리)가 JWT 토큰에 서명할 때 비밀키가 64바이트 이상이면 자동으로 HS512 방식을 선택합니다. 그런데 AI Agent는 "HS256만 유효한 서명"으로 검증하도록 설정되어 있었어요. 결과적으로 모든 로그인 사용자의 토큰이 "위조된 신분증"처럼 거부되어 user_id가 빈 문자열("")로 처리됐고, 세션 저장이 완전히 스킵됐습니다. chat_session_archive에 저장된 건수가 0이었던 근본 원인이에요. 해결: Agent의 JWT 검증 설정을 algorithms=["HS256", "HS384", "HS512"]로 확장했습니다.',
        note: 'HMAC 방식만 사용하므로 알고리즘 범위를 넓혀도 "알고리즘 혼동 공격(algorithm confusion attack)"이 불가능하며 보안 위협이 없습니다. 기존 사용자의 토큰을 재발급할 필요도 없어요.',
      },
      {
        title: '세션이 갑자기 사라지지 않게 보호해요',
        list: [
          'Redis는 인메모리 DB라 서버가 재시작되면 데이터가 날아갈 수 있어요. 그래서 MySQL이 영구 보관 역할을 맡아 복원 가능성을 보장합니다.',
          'Redis 저장 실패나 Backend /session/save 실패는 대화를 중단시키지 않습니다. 로그에 기록하고 다음 요청에서 재시도해요.',
          '세션 ID는 대화 시작 시 서버가 생성해 SSE session 이벤트로 브라우저에 전달합니다. 브라우저는 localStorage에 세션 ID를 보관해 탭을 새로 고쳐도 같은 대화를 이어갈 수 있어요.',
        ],
      },
    ],
  },

  /* ─────────── 8. Recommendation Scoring ─────────── */
  recoScoring: {
    icon: '⚖️',
    tag: 'SCORING · FUSION',
    title: '추천 점수 계산 · 합치고, 다양하게, 신뢰도 분리',
    desc: '좋은 추천을 위해 세 가지 문제를 동시에 해결해야 합니다. 첫째, 벡터·키워드·그래프 DB가 각각 다른 점수 체계로 결과를 내놓는데 이것을 공정하게 합쳐야 합니다(RRF 융합). 둘째, 합쳐도 비슷한 영화가 상위권을 독점할 수 있어 다양성을 수학적으로 강제해야 합니다(MMR). 셋째, "진짜 좋아서 별점을 남긴 리뷰"와 "그냥 틀어둔 재생 기록"은 추천 신뢰도가 다른데 이를 구분해서 학습해야 합니다(강/약 신호 분리). 이 세 가지를 조합해 추천 품질을 높이는 동시에, 무명작이 상위를 독점하거나 인기작만 반복 추천되는 양극단을 모두 방지합니다.',
    color: '#ef476f',
    stats: [
      { value: 'k=60', label: 'RRF 융합 상수' },
      { value: '70/30', label: '관련성/다양성 비율' },
      { value: '강/약 분리', label: '신호 신뢰도 구분' },
      { value: '3+2 슬롯', label: '인기작·숨은 명작 할당' },
    ],
    sections: [
      {
        title: '3개 DB 결과를 하나로 합치는 방법 (RRF)',
        code: `score(d) = Σ_i  1 / (k + rank_i(d))
# k = 60  ·  i ∈ {qdrant, es, neo4j}
# dedup key = movie_id

# popularity prior — Qdrant/Neo4j 결과에도 공통 적용
rrf_score += log1p(vote_count) * 0.003 + vote_average * 0.001`,
        text: 'k=60은 상위 영화들의 점수 차이를 완만하게 만들어 한 DB의 점수 체계가 결과를 독점하지 않게 합니다. 예를 들어 Elasticsearch가 특정 영화에 130점을 줘도, Qdrant에서 1위로 나온 다른 영화가 최종 순위에서 밀리지 않아요. RRF 합산 후 vote_count(평가 수)와 vote_average(평점) 기반의 popularity prior를 가산해 Qdrant·Neo4j 결과에도 인기도 보정을 적용합니다. prior 최대치는 약 0.031로 RRF 기본 점수(약 0.05)에 근접해 실질적인 영향을 줘요. DB 일부가 실패해도 나머지 DB 결과로 정상 작동합니다.',
      },
      {
        title: '비슷한 영화가 몰리지 않게 분산해요 (MMR)',
        code: `MMR(c) = λ · relevance(c)  −  (1 − λ) · max( sim(c, s) for s in selected )
# λ = 0.7  → 관련성 70% · 다양성 30%
# sim = 장르/무드/감독 자카드(Jaccard) 유사도 평균`,
        text: '봉준호 감독 영화 5편이 1~5위를 모두 차지하는 현상을 수학적으로 방지합니다. 이미 선택된 영화들과 너무 비슷한 후보는 관련성 점수가 높아도 패널티를 받아요. λ=0.7은 관련성 70%를 유지하면서 다양성 30%를 강제 확보하는 균형점이며, 이 값은 실험으로 조정된 하이퍼파라미터입니다.',
      },
      {
        title: '인기작 3편 + 숨은 명작 2편으로 슬롯을 나눠요',
        text: '추천 결과 5편을 popular(평점 5.0 이상 또는 평가 수 50건 이상) 슬롯 3개와 hidden(그 외) 슬롯 2개로 분리합니다. 각 슬롯에서 독립적으로 MMR을 실행해 상위 N개를 선택한 뒤 합산해요. 이 방식은 "완전 무명작만 추천되는 문제"(평점 0점짜리 영화 5편 독점)와 "너무 뻔한 대작만 반복 추천되는 문제"를 동시에 방지합니다. 한쪽 풀(pool)이 부족하면 다른 풀에서 자동으로 보충해 항상 5편을 채워요.',
        note: '"숨은 명작을 발굴하되, 아무도 모르는 영화만 추천하지는 않는다" — 3:2 비율로 친근함과 새로움의 균형을 맞춥니다',
      },
      {
        title: '"진짜 본 사람의 리뷰"와 "재생 기록"은 다르게 취급해요',
        list: [
          { label: '강한 신호 (reviews 테이블)', value: '별점과 감상 텍스트를 직접 남긴 리뷰입니다. AI 추천 학습의 유일한 입력이에요. "보고 나서 능동적으로 평가를 남겼다"는 것 자체가 신호 강도를 높입니다.' },
          { label: '약한 신호 (user_watch_history)', value: '재생 버튼을 눌렀다는 기록입니다. 틀어 놓고 자거나 중간에 껐을 수도 있어 추천에는 반영하지 않아요. 대신 마이페이지 시청 이력·재관람 카운트 표시에만 활용해 UX를 풍부하게 합니다.' },
          { label: '초기 보조 데이터 (kaggle_watch_history)', value: 'MovieLens 26M 공개 시청 패턴입니다. 신규 사용자의 빈 리뷰 자리를 임시로 채우는 Cold Start 보조용이에요. 에이전트 전용 읽기 전용 테이블이라 백엔드 JPA Entity 매핑이 없습니다.' },
        ],
        note: '"봤다"는 행위와 "좋았다"는 평가는 추천 신뢰도가 다릅니다. 이 둘을 섞으면 "재생 수가 많은 영화 = 좋은 영화"라는 잘못된 신호가 학습돼 추천 품질이 떨어집니다.',
      },
      {
        title: '검색 단계에서 인기도를 미리 반영해요',
        list: [
          { label: 'ES function_score', value: 'BM25(키워드 매칭 점수)에 vote_count와 vote_average 기반 스크립트 점수를 곱합니다. 평점 0점짜리 영화는 BM25의 절반으로 감점되고, 평점 8점에 500건 평가가 있으면 약 2배 부스트를 받아요. 0.5 하한이 있어 무명작을 완전히 차단하지는 않습니다.' },
          { label: 'RRF popularity prior', value: 'RRF 합산 이후 vote_count와 vote_average를 추가 가산해 Qdrant·Neo4j 결과에도 인기도 보정이 적용돼요. 검색 단계(ES)와 융합 단계(RRF) 두 곳에서 이중으로 보정하는 구조입니다.' },
          { label: 'AI 재정렬 컷오프', value: 'Solar AI가 후보에 점수를 매긴 뒤 "평균 × 0.7"과 절대 하한 3.0 중 큰 값으로 컷오프합니다. AI가 자비롭게 4~5점을 전체 후보에 주더라도 실질적인 필터가 발동해요.' },
          { label: 'MMR + 슬롯 quota', value: '위 세 단계가 모두 통과된 후보에서 인기 3슬롯·숨은 명작 2슬롯으로 최종 5편을 선정합니다.' },
        ],
      },
      {
        title: '관련 내용 안내',
        text: '신규 사용자(리뷰 0건)에게도 좋은 추천을 제공하는 방법은 ❄️ Cold Start 모달에서, 두 영화의 취향 교차점을 찾는 Movie Match 전용 점수 계산은 🎬 Movie Match v3 모달에서, 검색 단계의 전체 흐름은 🔎 RAG Pipeline 모달에서 확인하세요.',
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
    title: '결제 시스템 · 카드 빠졌는데 포인트 안 들어오는 일이 없도록',
    desc: '"결제는 됐는데 포인트는 안 들어왔어요" — 이 최악의 상황을 막기 위해 결제 승인 단계와 DB 처리 단계를 명시적으로 분리하고, 실패 시 자동으로 최대 3회 환불을 시도하며, 환불마저 실패하면 운영팀에 즉시 알립니다. Toss Payments v2 SDK로 실제 카드 결제를 처리하며, 동시에 여러 요청이 들어와도 잔액이 꼬이지 않도록 DB 레벨 비관적 락(SELECT FOR UPDATE — 먼저 잠근 요청이 처리를 끝낼 때까지 다른 요청을 대기시킴)을 적용했습니다. 포인트 원장은 Insert-Only 방식(추가만 되고 수정·삭제 불가)으로 관리해 모든 거래 이력을 감사 추적할 수 있으며, 멱등성 키(Idempotency-Key)로 네트워크 오류로 인한 중복 결제를 원천 차단합니다.',
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
        title: '결제가 진행되는 순서',
        steps: [
          { title: '① 주문 생성', desc: '결제 전에 서버에 주문을 먼저 등록하고 "결제 대기(PENDING)" 상태로 기록합니다. 이 단계가 중복 결제 방지의 첫 번째 관문이에요 — 같은 주문 ID로 두 번 들어오면 DB 레벨에서 차단합니다.' },
          { title: '② Toss 결제창', desc: '사용자가 Toss 결제창에서 카드·간편결제로 실제 결제를 진행합니다. 이 단계에서 서버는 아무것도 하지 않고 Toss가 결제를 처리하기를 기다려요.' },
          { title: '③ 승인 요청', desc: '결제 성공 후 클라이언트가 paymentKey·orderId·amount를 서버로 전달하면, 서버가 Toss에 최종 승인을 요청합니다. 이때 DB 연결을 잡지 않아요 — Toss 응답이 느려도 DB 연결이 낭비되지 않습니다.' },
          { title: '④ DB 처리', desc: '승인 완료 직후 주문 상태 COMPLETED 변경 → 포인트 적립 → 구독 활성화를 하나의 DB 트랜잭션으로 묶어 처리합니다. 셋 중 하나라도 실패하면 전부 취소돼요.' },
          { title: '⑤ 혜택 지급', desc: '포인트 상품이면 포인트 즉시 적립 / 구독이면 AI 이용 보너스 횟수 + 등급 보장 혜택이 즉시 반영됩니다. 혜택 반영은 DB 처리와 같은 트랜잭션 안에서 이루어져 분리될 수 없어요.' },
        ],
      },

      /* ── B. 2-Phase 트랜잭션 경계 ── */
      {
        title: '왜 결제 승인과 DB 처리를 나눴나요?',
        table: {
          headers: ['단계', '하는 일', 'DB 연결', '이유'],
          rows: [
            ['1단계 (Toss 승인)', 'Toss에 결제 승인 요청', '미연결', 'Toss 응답을 기다리는 동안 DB 연결을 잡아두면 다른 요청이 막힘'],
            ['2단계 (DB 처리)', '주문 완료 + 포인트 + 구독을 한 묶음으로 저장', '연결 (배타 락)', '세 가지가 모두 성공하거나 모두 취소되어야 함'],
            ['실패 기록', '보상 실패 사실을 별도로 저장', '독립 연결', '상위 처리가 실패해도 "실패했다는 사실"은 반드시 남아야 함'],
          ],
        },
        note: 'Toss API를 호출하는 동안 DB 연결을 잡지 않습니다 — 외부 응답 지연으로 DB 연결이 고갈되는 일을 원천 차단합니다',
      },

      /* ── C. 동시성 — FOR UPDATE 맵 ── */
      {
        title: '동시에 여러 요청이 들어와도 꼬이지 않아요',
        list: [
          { label: '주문 처리',      value: '같은 주문을 동시에 처리하려는 요청은 줄 세워서 하나씩 처리' },
          { label: '포인트 잔액',    value: '포인트 적립·차감·환불이 겹쳐도 잔액이 정확히 유지됨' },
          { label: 'AI 이용 횟수',   value: '여러 탭에서 동시에 AI를 호출해도 횟수가 2배로 소진되지 않음' },
          { label: '구독 처리',      value: '구독 활성화와 해지가 동시에 들어와도 최종 상태가 일관됨' },
          { label: '월말 추첨',      value: '당첨자 선정 중 상태가 꼬이지 않도록 잠금 처리' },
        ],
        note: '"혹시 충돌하면 재시도"보다 "처음부터 줄 세우기" 방식을 선택했습니다 — 돈이 오가는 영역이라 충돌 후 복구보다 애초에 막는 게 안전합니다',
      },

      /* ── D. 멱등성 ── */
      {
        title: '같은 결제 요청이 두 번 들어와도 중복 처리되지 않아요',
        list: [
          '모든 주문에 고유 식별 키를 붙여 DB 레벨에서 중복을 차단합니다',
          '네트워크 오류로 클라이언트가 같은 요청을 재전송해도 기존 결과를 그대로 돌려줍니다',
          '이미 완료된 주문에 다시 승인 요청이 오면 기존 결과를 재사용하고 중복 처리하지 않습니다',
          'Toss 측에도 같은 키를 전달해 Toss 서버에서도 중복 승인이 일어나지 않습니다',
        ],
      },

      /* ── E. Saga 패턴 선택 근거 ── */
      {
        title: '실패했을 때 보상하는 방식 — 중앙 지휘자 방식',
        text: '"중앙 지휘자 방식"은 한 곳(결제 서비스)이 모든 단계를 순서대로 호출하고, 실패 시 역순으로 되돌립니다. 반대인 "자율 이벤트 방식"은 각 서비스가 이벤트를 주고받는 방식인데, 현재처럼 서버가 하나이고 DB도 하나인 환경에서는 불필요하게 복잡합니다.',
        table: {
          headers: ['비교', '중앙 지휘자 방식 (채택)', '자율 이벤트 방식'],
          rows: [
            ['제어', '한 곳에서 순서대로 호출', '각 서비스가 이벤트를 보고 스스로 실행'],
            ['실패 추적', '어디서 실패했는지 코드 한 곳에서 파악', '여러 서비스 로그를 모아서 추적'],
            ['복구 순서', '코드로 명확하게 역순 실행', '이벤트 순서 보장 장치가 별도로 필요'],
            ['선택 이유', '결제는 정확한 순서와 원자적 복구가 최우선', '서버·DB가 하나인 지금 구조에서는 과도한 복잡도'],
          ],
        },
        note: '"돈은 빠졌는데 혜택은 없음" 이 절대 일어나면 안 되므로, 이벤트 유실이나 순서 꼬임 가능성이 있는 방식 대신 코드로 명확히 제어하는 방식을 선택했습니다',
      },

      /* ── E-2. 보상 실행 단계 (실제 코드) ── */
      {
        title: 'Toss 승인은 됐는데 서버 처리가 실패하면 어떻게 되나요?',
        text: '"카드는 빠졌는데 포인트가 안 들어온" 상황 — 이 최악의 시나리오를 4단계로 막습니다.',
        steps: [
          { title: '① 자동 롤백',         desc: '주문 완료·포인트 적립·구독 활성화 세 가지를 한 묶음으로 취소합니다' },
          { title: '② Toss 자동 환불',    desc: '서버가 Toss에 환불 요청을 최대 3회 자동으로 시도합니다' },
          { title: '③ 환불도 실패하면',   desc: '"환불 실패" 상태를 별도 트랜잭션으로 기록합니다 — 상위 처리가 실패해도 이 기록은 반드시 남습니다' },
          { title: '④ 운영팀 알림',        desc: 'Grafana 알림으로 운영팀에 즉시 통보 → 관리자가 수동으로 Toss 환불 또는 포인트 직접 지급' },
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
        title: '주문이 거치는 상태 변화',
        code: `PENDING ──► COMPLETED ──► REFUNDED
   │           │
   │           └─► COMPENSATION_FAILED  (Toss 환불 3회 실패)
   │                      │
   │                      └─► (관리자) order.markRecovered()
   └─► FAILED               │
              └─► COMPENSATION_FAILED  (승인 실패 + 환불 실패)`,
        note: 'COMPENSATION_FAILED(보상 실패) 상태는 "돈은 나갔는데 혜택 못 받음"을 명확하게 표시하는 신호입니다 — 운영 대시보드에서 즉시 알림이 울립니다',
      },

      /* ── G. 포인트 원장 (Insert-Only Ledger) ── */
      {
        title: '포인트 내역은 절대 수정·삭제되지 않아요',
        list: [
          '모든 포인트 변동은 새 줄로만 추가됩니다 — 기존 기록을 고치거나 지울 수 없습니다',
          '적립·소비·보너스·만료·환불 모든 종류를 유형별로 구분해 기록합니다',
          '등급 배율(×1.0~×1.5)이 적용된 경우 원래 금액과 적용된 배율을 함께 남깁니다',
          '같은 이유로 포인트가 두 번 지급되는 걸 DB 레벨에서 차단합니다',
          '언제 얼마가 들어오고 나갔는지 전체 이력을 언제든 재구성할 수 있습니다',
        ],
      },

      /* ── H. 환불 & 웹훅 ── */
      {
        title: '환불과 외부 알림(웹훅) 처리',
        list: [
          { label: '환불 요청',   value: '포인트를 먼저 회수한 뒤 Toss에 취소 요청을 보냅니다' },
          { label: '포인트 상품', value: '지급된 포인트 전액을 회수합니다' },
          { label: '구독 상품',   value: '이미 사용한 혜택이 있으므로 포인트를 따로 회수하지 않습니다' },
          { label: '포인트 회수 실패', value: '회수에 실패하면 실패 이유를 기록하고 운영팀이 수동 처리합니다' },
          { label: 'Toss 웹훅',   value: 'Toss가 보내는 이벤트 알림은 서명을 검증해 위변조를 차단하고, 이미 처리된 건은 무시합니다' },
        ],
      },

      /* ── I. AI 쿼터 3-Source + v3.4 버그 ── */
      {
        title: 'AI 이용 횟수는 어떤 순서로 소진되나요?',
        table: {
          headers: ['순서', '출처', '내용'],
          rows: [
            ['1순위', '등급 무료',   '오늘 무료 횟수(등급마다 다름)를 먼저 씁니다'],
            ['2순위', '구독 보너스', '구독 시 매달 지급되는 보너스 횟수를 씁니다'],
            ['3순위', '구매 이용권', '포인트 상점에서 구매한 이용권을 씁니다'],
            ['차단',  '모두 소진',   '세 가지가 모두 바닥나면 AI 추천을 이용할 수 없습니다'],
          ],
        },
        text: '이전에는 "AI에게 질문하는 순간" 횟수가 차감됐는데, 실제로 영화 카드를 받지 않고 추가 질문만 해도 차감되는 문제가 있었습니다. 지금은 영화 카드가 화면에 표시되는 순간에만 차감합니다.',
        note: '2026-04-15 버그 수정: 잔액 확인 로직이 읽기 전용 트랜잭션을 물려받아 MySQL에서 쓰기 오류가 발생했습니다. 해당 메서드에 쓰기 허용 트랜잭션을 명시해 해결했습니다.',
      },

      /* ── J. 구독 트랜잭션 ── */
      {
        title: '구독 결제는 어떻게 처리되나요?',
        list: [
          '구독 상품 목록과 사용자 현재 구독 현황은 별도 테이블로 관리합니다',
          '구독 활성화는 포인트 적립과 한 묶음으로 처리됩니다 — 하나라도 실패하면 모두 취소됩니다',
          '월간/연간 구독에 따라 AI 보너스 횟수와 포인트 지급 주기를 다르게 관리합니다',
          '4가지 플랜: 월간 기본(2,900원) · 월간 프리미엄(5,900원) · 연간 기본(29,000원) · 연간 프리미엄(59,000원)',
        ],
      },

      /* ── K. 실패 시나리오 처리표 ── */
      {
        title: '다양한 실패 상황을 어떻게 처리하나요?',
        table: {
          headers: ['상황', '처리 방식'],
          rows: [
            ['결제창에서 그냥 나감',              '대기 상태로 유지 — 나중에 자동으로 만료 처리'],
            ['승인 요청 중 네트워크 오류',         'Toss 미호출 상태로 유지 — 클라이언트가 재시도 가능'],
            ['Toss 승인은 됐는데 포인트 적립 실패', '서버 전체 취소 → Toss에 자동 환불 3회 시도 → 실패 시 운영팀 알림'],
            ['DB가 갑자기 죽은 경우',              '트랜잭션 단위로 전체 취소 — 절반만 처리된 상태가 되지 않음'],
            ['환불 중 포인트 회수 실패',           '환불 완료 상태는 유지 + 실패 이유 기록 → 운영팀 수동 처리'],
            ['같은 웹훅 알림이 두 번 도착',        '이미 처리된 상태면 무시 — 중복 처리 방지'],
          ],
        },
      },

      /* ── L. 포인트 단일 재화 정책 ── */
      {
        title: '포인트는 어떻게 쓰이나요?',
        list: [
          '1포인트 = 10원 — 크레딧·리워드·포인트를 하나로 통합한 단일 재화입니다',
          'AI 이용권 구매: 10P(1회) · 50P(5회) · 200P(20회) · 500P(50회)',
          '리뷰·퀴즈·로그인·월드컵·로드맵 완주 등 55가지 활동으로 포인트를 적립하며, 등급에 따라 최대 1.5배 더 받습니다',
          '포인트 상점에서 구매한 아이템(이용권 포함)은 인벤토리에 보관되고 사용하는 시점에 차감됩니다',
        ],
      },
    ],
  },

  /* ─────────── 10. Community & Social ─────────── */
  community: {
    icon: '👥',
    tag: 'COMMUNITY',
    title: '커뮤니티 · 혼자 보고 끝내지 않는 영화 생활',
    desc: '리뷰를 쓰면 내 추천이 더 정확해지고, 퀴즈를 풀면 포인트가 쌓이며, 나와 취향이 비슷한 사람을 만날 수도 있어요. 영화를 보는 것에서 그치지 않고 함께 즐기는 공간입니다. 커뮤니티 활동이 단순한 소통에 그치지 않고 AI 추천 학습에 직접 연결된다는 점이 가장 큰 차별점이에요 — 내가 남긴 리뷰 한 줄이 다음 대화의 추천 품질을 높이는 선순환 구조입니다. AI가 비속어·혐오 표현을 실시간으로 감지하고, 신고 시스템과 관리자 검토 대기열이 건강한 커뮤니티를 유지하도록 설계되어 있습니다.',
    color: '#118ab2',
    stats: [
      { value: '9', label: '커뮤니티 탭/기능' },
      { value: 'AI', label: '퀴즈·씬 맞추기' },
      { value: 'TOP 10', label: '시네마 소울메이트' },
      { value: '55가지', label: '포인트 적립 활동' },
    ],
    sections: [

      {
        title: '리뷰를 쓰면 추천도 똑똑해져요',
        list: [
          '영화 상세 페이지에서 별점과 리뷰를 남길 수 있어요. Solar AI가 비속어나 혐오 표현을 자동 검사한 뒤 등록됩니다. 검사가 비동기로 실행되어 글 작성 속도에 영향을 주지 않아요.',
          '작성한 리뷰는 AI 추천 학습의 핵심 데이터(강한 신호)가 됩니다. 리뷰를 쓸수록 추천 정확도가 높아져요 — 내가 좋아한 영화와 싫어한 영화를 AI가 더 정확히 파악하게 됩니다.',
          '영화관에서 실제로 봤다는 증거(영수증 이미지)를 올리면 해당 리뷰에 더 높은 신뢰 가중치가 부여됩니다. 직접 보고 쓴 감상이 더 믿을 만하다는 원칙을 반영한 설계예요.',
          '리뷰를 작성하면 등급 배율이 적용된 포인트가 자동으로 쌓여요. 몽아일체(최고 등급)는 기본의 1.5배를 받습니다.',
        ],
      },

      {
        title: '게시판에서 이야기를 나눠보세요',
        list: [
          '자유 글·리뷰·추천·공지 탭으로 구성된 커뮤니티 게시판이 있어요. URL에 noticeId를 포함하면 특정 공지를 바로 펼쳐 보여주는 딥링크도 지원합니다.',
          '댓글, 대댓글, 좋아요, 신고 기능을 모두 지원해요. Solar AI가 혐오 표현을 실시간으로 감지해 자동 플래그를 달아요.',
          '신고된 게시글은 관리자 검토 대기열로 이동하고, 필요하면 블라인드(숨김) 처리됩니다. 관리자가 부당 신고라고 판단하면 블라인드를 해제할 수도 있어요.',
          '게시글 작성, 좋아요, 유익한 댓글 선정 시마다 포인트 리워드가 자동 지급됩니다. 커뮤니티를 활성화할수록 본인의 등급도 더 빨리 오르는 구조예요.',
        ],
      },

      {
        title: 'AI 퀴즈·씬 맞추기·도장깨기로 재미를 더해요',
        list: [
          '관리자가 Solar AI로 퀴즈를 자동 생성해 매일 새 문제를 출제해요. AI가 줄거리·출연진 기반으로 OX·객관식 문항을 만들고, 관리자가 검수·승인하면 배포됩니다.',
          '영화 스틸컷 한 장만 보고 제목을 맞추는 씬 맞추기도 있어요. 제목과 포스터를 숨기고 힌트만 제공해 편견 없이 영화를 접하는 "뜻밖의 명작" 경험을 설계했습니다.',
          '도장깨기 코스(15편)를 진행하면서 리뷰를 남기면 인증 도장이 쌓입니다. "OCR 인증 필수" 도장은 영수증 업로드를 통과해야만 인정돼요 (2026-04-14 기능 추가).',
          '퀴즈 정답, 도장 완주, 코스 완료 때마다 포인트와 업적이 자동으로 기록됩니다. 업적은 프로필에 표시되어 다른 사용자가 볼 수 있어요.',
        ],
      },

      {
        title: '이상형 월드컵으로 취향을 정밀하게 맞춰봐요',
        text: '16강·32강·64강 토너먼트 방식으로 영화를 골라가면서 내 취향을 즐겁게 파악할 수 있어요. 지루한 설문 대신 "어떤 영화가 더 끌리나요?" 한 쌍씩 고르게 해서 무드·감독·장르 선호도를 자연스럽게 수집합니다. 우승작과 준우승작은 AI 추천의 초기 취향 프로필 데이터로 즉시 활용돼요.',
        list: [
          '온보딩 때 한 번 진행하며 가입 직후 첫 추천의 정확도를 높이는 데 핵심 역할을 해요. 그 이후로도 언제든 다시 참여해 취향 업데이트가 가능합니다.',
          '관리자가 후보 영화 풀을 직접 관리하고 주기적으로 업데이트할 수 있어요. 신작이 나오면 후보에 추가해 트렌드를 반영합니다.',
          '참여·우승·공유 시마다 포인트와 업적이 기록됩니다. 완주하면 500포인트 온보딩 보너스가 추가로 지급돼요.',
        ],
      },

      {
        title: '나와 취향이 비슷한 사람을 찾아볼 수 있어요',
        text: '내 리뷰 패턴과 가장 유사한 상위 10명의 유저(시네마 소울메이트)를 보여줍니다. 같은 영화에 비슷한 별점을 남긴 사람일수록 상위에 표시돼요. 그 사람이 최근에 본 영화나 즐겨찾기한 영화를 참고해 내가 아직 발견하지 못한 작품을 찾을 수 있습니다. 같이 볼 영화를 고르고 싶다면 "둘이 영화 고르기(Movie Match)" 기능으로 바로 연결됩니다.',
      },

      {
        title: '고객센터와 공지도 한 곳에서 해결해요',
        list: [
          'AI 챗봇이 자주 묻는 질문(FAQ)에 바로 답해줘요. 화면 어디서든 접근할 수 있는 플로팅 위젯으로 제공되어 페이지를 이동하지 않아도 됩니다. 챗봇이 해결 못 하면 관리자에게 문의 티켓을 생성할 수 있어요.',
          '공지사항 UX 개편(2026-04-15): displayType에 따라 BANNER(상단 카드)·POPUP(배경 클릭으로 닫기)·MODAL(확인 버튼만) 세 가지로 보여줘요. "다시 보지 않기"는 localStorage에 영구 기록해 재방문해도 표시되지 않고, "닫기"는 24시간 억제됩니다. 관리자가 pinned=true로 설정한 공지만 홈에 표시돼요.',
        ],
      },
    ],
  },

  /* ─────────── 11. Rewards & Achievements ─────────── */
  rewards: {
    icon: '🎁',
    tag: 'REWARDS',
    title: '리워드 · 업적 · 등급 시스템',
    desc: '앱을 쓸수록 포인트가 쌓이고, 등급이 오를수록 AI를 더 많이 쓸 수 있어요. 리뷰·퀴즈·로그인 등 55가지 활동에 포인트가 자동으로 붙고, 월말에는 영화 티켓 추첨도 있습니다. 포인트는 크레딧·리워드·캐시를 하나로 통합한 단일 재화(1P=10원)로, AI 이용권 구매·아이템 교환·추첨 응모에 모두 사용됩니다. 등급은 "팝콘 테마" 6단계(알갱이 → 강냉이 → 팝콘 → 카라멜팝콘 → 몽글팝콘 → 몽아일체)로 구성되어 있으며, 누적 활동 포인트에 따라 자동으로 승급합니다. 등급이 오르면 하루 무료 AI 횟수·포인트 배율·입력 글자수 한도가 함께 늘어나 앱을 열심히 쓰는 사용자가 더 나은 경험을 받는 선순환 구조입니다.',
    color: '#ffd166',
    stats: [
      { value: '55', label: '활동 리워드 정책' },
      { value: '6', label: '등급 (알갱이~몽아일체)' },
      { value: '1P=10원', label: '단일 재화' },
      { value: '월말 추첨', label: '영화 티켓' },
    ],
    sections: [

      {
        title: '어떤 활동을 하면 포인트를 받나요?',
        text: '리뷰 작성, 댓글, 로그인, 공유, 월드컵 참여, 로드맵 완주, 퀴즈 정답, 실관람 인증 등 55가지 행동에 포인트가 자동으로 지급됩니다. 관리자가 각 활동의 지급 금액과 활성 여부를 코드 배포 없이 언제든 조정할 수 있어요. 활동 리워드는 단순한 게임화 요소가 아니라, 사용자가 자연스럽게 리뷰를 남기도록 유도해 AI 추천 학습 데이터를 풍부하게 만드는 핵심 장치이기도 합니다.',
        list: [
          '지급 금액 = 기본 금액 × 등급 배율(×1.0~×1.5) — 등급이 높을수록 같은 활동을 해도 더 많이 받습니다. 몽아일체 등급은 알갱이보다 50% 더 받아요.',
          '같은 이유로 포인트가 두 번 지급되는 일은 DB 레벨에서 차단합니다. 예를 들어 같은 영화에 리뷰를 두 번 작성해도 포인트는 최초 1회만 지급돼요.',
          '모든 포인트 내역은 Insert-Only(추가만 가능, 수정·삭제 불가) 원장 방식으로 보관됩니다. 포인트 분쟁 시 전체 이력을 언제든 재구성해 증빙할 수 있어요.',
        ],
      },

      {
        title: '6단계 팝콘 등급 — 활동 누적 포인트로 자동 승급',
        table: {
          headers: ['등급', '누적 포인트', '하루 무료 AI', '쿠폰 월 한도', '배율', '입력 글자수'],
          rows: [
            ['알갱이',     '0~999',         '3회',   '10회',  '×1.0', '200자'],
            ['강냉이',     '1,000~3,999',   '5회',   '30회',  '×1.1', '400자'],
            ['팝콘',       '4,000~6,499',   '7회',   '60회',  '×1.2', '500자'],
            ['카라멜팝콘', '6,500~9,999',   '10회',  '80회',  '×1.3', '800자'],
            ['몽글팝콘',   '10,000~19,999', '15회',  '120회', '×1.4', '3,000자'],
            ['몽아일체',   '20,000+',       '무제한','무제한','×1.5', '무제한'],
          ],
        },
      },

      {
        title: '업적과 도장깨기로 성취감을 느껴요',
        list: [
          '연속 로그인, 리뷰 N편 달성, 월드컵 완주, 로드맵 코스 완주 등 다양한 업적이 있어요. 업적 달성 시 뱃지가 프로필에 표시되어 다른 사용자가 볼 수 있어 자랑할 수 있습니다.',
          '도장깨기 코스(15편)를 완주하면 코스 전용 뱃지와 보너스 포인트를 받습니다. 코스마다 테마가 다르고, 완주할수록 영화를 보는 폭이 넓어지도록 설계했어요.',
          '실관람 인증(영수증 업로드)이 필요한 도장도 있어요. 이 도장은 리뷰만으로는 완주가 인정되지 않아 "진짜 영화관에서 봤다"는 경험 자체를 특별하게 만들어줍니다.',
        ],
      },

      {
        title: '포인트 상점에서 AI 이용권을 살 수 있어요',
        list: [
          'AI 이용권: 10P(1회) · 50P(5회) · 200P(20회) · 500P(50회) 4종을 구매할 수 있어요. 많이 살수록 단가가 낮아집니다. 이용권은 등급 무료 횟수와 구독 보너스를 다 쓴 뒤 3순위로 소진됩니다.',
          '구매한 아이템은 인벤토리(UserItem)에 보관되고, 실제로 사용하는 시점에 차감됩니다. "사놓고 안 써도 유효기간 없이 보관"이 원칙이에요.',
          '프로필 꾸미기 아이템도 장착·해제할 수 있어요. 아이템마다 고유 효과가 있고, 장착된 아이템은 마이페이지와 커뮤니티에서 표시됩니다.',
        ],
      },

      {
        title: '매달 말 영화 티켓 추첨이 있어요',
        list: [
          '포인트로 추첨에 응모할 수 있습니다. 실관람 인증을 완료하면 응모권이 자동으로 지급돼요.',
          '월말 자동 추첨으로 당첨자를 선정하고, 당첨 포인트와 아이템을 자동으로 지급합니다. 당첨 결과는 앱 내 알림으로 전달돼요.',
          '당첨자 선정 중 동시에 여러 요청이 들어와도 상태가 꼬이지 않도록 DB 비관적 락(SELECT FOR UPDATE)으로 동시성 제어가 적용되어 있어요. 돈이 오가는 추첨이라 정확성이 최우선입니다.',
        ],
      },

      {
        title: '내 포인트 현황을 한눈에 볼 수 있어요',
        text: '포인트 페이지에서 리워드 지급 기준 55가지, 내 누적 포인트, 다음 등급까지 남은 포인트, 이번 달 받은 포인트 타임라인을 모두 볼 수 있어요. 2026-04-15 재개편에서 "어떤 활동을 하면 얼마를 받는지"를 실시간으로 가시화해 포인트 적립 동기를 높였습니다. 관리자는 사용자별 포인트 수동 조정, 이용권 직접 지급, 감사 로그 조회가 가능하며 모든 조작 이력이 감사 로그에 남아요.',
      },
    ],
  },

  /* ─────────── 12. Git Branching Strategy ─────────── */
  gitStrategy: {
    icon: '🌿',
    tag: 'VERSION CONTROL',
    title: 'Git 브랜칭 · 코드 버전 관리 방식',
    desc: '팀원 4명이 같은 코드를 동시에 작업해도 충돌 없이 합칠 수 있도록 브랜치를 나눠 관리합니다. 기능 개발은 feature 브랜치에서, 검토가 끝난 코드만 develop을 거쳐 main에 반영되는 Git Flow 간소화 방식입니다. 5개 서비스가 각각 별도 레포를 가지므로 한 서비스 배포가 다른 서비스에 영향을 주지 않아요. main과 develop은 보호 브랜치로 설정되어 직접 push가 불가능하고, 모든 변경은 반드시 PR(Pull Request — 코드 병합 요청)과 리뷰를 거쳐야 합니다. 이 구조는 실수로 운영 코드가 망가지는 것을 방지하고, 언제 어떤 변경이 들어갔는지 이력을 명확하게 추적할 수 있게 해줍니다.',
    color: '#ef476f',
    stats: [
      { value: '5', label: '조직 레포' },
      { value: 'main/develop', label: '보호 브랜치' },
      { value: 'Git Flow', label: '간소화' },
      { value: 'squash merge', label: '병합 방식' },
    ],
    sections: [

      {
        title: '브랜치를 어떻게 나눠 쓰나요?',
        table: {
          headers: ['브랜치', '목적', '어디로 합치나요?', '비고'],
          rows: [
            ['main',     '실제 운영 중인 코드 (보호)',           '—',                   '직접 push 금지'],
            ['develop',  '개발 완료된 기능을 모아두는 곳 (보호)', 'main (배포 시점)',     '직접 push 금지'],
            ['feature/*','새 기능을 개발하는 브랜치',             'develop (PR 검토 후)', '이슈 번호 포함 권장'],
            ['fix/*',    '버그를 고치는 브랜치',                  'develop (PR 검토 후)', '—'],
            ['hotfix/*', '운영 중 긴급히 고쳐야 할 버그',         'main + develop 동시',  '스테이징 건너뛰기 허용'],
          ],
        },
      },

      {
        title: '코드가 반영되는 순서',
        steps: [
          { title: '① 기능 브랜치 작업', desc: '개인 컴퓨터에서 코드를 짜고 단위 테스트를 통과시켜요. AI 에이전트는 332개, 백엔드는 빌드 성공이 최소 기준입니다.' },
          { title: '② PR 올리기', desc: '조직 레포(monglepick/)에 직접 PR을 올립니다. 개인 포크를 거치지 않아요 — 포크 경유 시 조직 레포 Actions와 Secret이 공유되지 않는 문제를 방지합니다.' },
          { title: '③ 자동 검사 + 리뷰', desc: '빌드·테스트·린트가 자동으로 실행되고, 팀원이 한 명 이상 리뷰합니다. 검사가 하나라도 실패하면 merge 버튼이 잠겨요.' },
          { title: '④ develop 병합', desc: '검토가 통과하면 squash merge(여러 커밋을 하나로 압축)로 깔끔하게 합쳐요. develop 이력이 기능 단위로 정리됩니다.' },
          { title: '⑤ main 배포', desc: '배포 시점에 develop → main PR을 올리고 운영에 반영합니다. 이 PR이 곧 릴리즈 노트 역할을 해요.' },
        ],
      },

      {
        title: '5개 서비스가 각각 별도 레포로 관리돼요',
        list: [
          'monglepick/monglepick-backend — Spring Boot 서버 (main + develop). DB 스키마의 단일 권위 소유자입니다.',
          'monglepick/monglepick-agent — AI 에이전트 (main + develop). 테스트 332개가 CI 게이트 역할을 해요.',
          'monglepick/monglepick-recommend — 추천 서비스 (main + develop). 좋아요 write-behind와 CF 담당입니다.',
          'monglepick/monglepick-client — 사용자 앱 (main + develop). 빌드 성공 + 주요 화면 확인이 게이트예요.',
          'monglepick/monglepick-admin — 관리자 앱 (develop 단일). 운영 서버에만 배포되어 외부 공개가 없어요.',
        ],
      },

      {
        title: '커밋 메시지는 일정한 형식으로 써요',
        list: [
          '"feat(chat): 추천 영화 카드 UI 추가" 처럼 type(범위): 요약 형식을 따릅니다. type에는 feat·fix·refactor·test·docs·chore 등을 씁니다.',
          '본문에는 "왜 바꿨는지"(what이 아닌 why)와 관련 Jira 이슈 번호를 적어요. 이슈 번호가 있으면 Jira에 자동 연결됩니다.',
          '기존 API나 DB 스키마를 깨는 큰 변경은 BREAKING CHANGE를 별도로 명시해 팀원이 미리 대응할 수 있게 해요.',
          '커밋은 작고 자주 만드는 것이 원칙입니다. 나중에 git bisect로 버그 발생 시점을 찾거나 특정 기능만 revert할 때 훨씬 쉬워요.',
        ],
      },

      {
        title: '실수로 운영 코드가 망가지지 않도록 보호해요',
        list: [
          'main과 develop에는 직접 push할 수 없어요. 강제 push(--force), hooks 건너뛰기(--no-verify), 서명 제거도 금지됩니다.',
          '실수로 환경 변수 파일(.env)이나 API 키 파일이 커밋되지 않도록 파일을 하나씩 골라 staging합니다. "git add ." 대신 특정 파일만 명시하는 방식을 사용해요.',
          'PR 없이 merge된 커밋은 감사 로그에 기록되어 추적 가능합니다. 누가 언제 어떤 코드를 올렸는지 항상 확인할 수 있어요.',
        ],
      },
    ],
  },

  /* ─────────── 13. CI / CD Strategy ─────────── */
  cicd: {
    icon: '⚙️',
    tag: 'CI / CD',
    title: 'CI / CD · 코드가 서버에 배포되는 과정',
    desc: 'PR을 올리면 자동으로 테스트가 돌고(CI — Continuous Integration, 지속적 통합), 검토가 통과하면 스테이징 서버에 먼저 배포됩니다. 최종적으로 운영 서버 3대에 순서대로 배포되어 서비스가 업데이트되는 것이 CD(Continuous Deployment, 지속적 배포)입니다. 5개 서비스가 각각 독립적인 워크플로우를 가져 한 서비스의 배포 실패가 다른 서비스를 막지 않아요. 배포 순서는 DB·AI 모델 서버(VM4) → 애플리케이션 서버(VM2) → 프론트엔드(VM1) 순으로 의존성 방향을 따르며, 각 서버 배포 후 /health 응답을 확인하고 다음 서버로 넘어갑니다.',
    color: '#7c6cf0',
    stats: [
      { value: '5', label: '레포 × 워크플로우' },
      { value: '332', label: 'Agent 테스트 통과' },
      { value: '3-VM', label: '순차 운영 배포' },
      { value: '/health', label: '단계별 게이트' },
    ],
    sections: [

      {
        title: '코드 반영은 3단계로 진행돼요',
        steps: [
          { title: 'PR 검사 (CI)', desc: '코드를 올리면 자동으로 빌드·테스트·린트가 실행됩니다. 하나라도 실패하면 merge 버튼이 잠겨요. 이 단계는 "코드가 최소한 컴파일되고 기존 기능을 부수지 않는가"를 보장하는 안전망입니다.' },
          { title: '스테이징 배포', desc: 'develop 브랜치에 합쳐지면 맥북 Docker 환경에 자동 배포돼요. 실제 운영과 동일한 docker-compose 구성으로 실행되어 "내 컴퓨터에서는 됐는데 서버에서 안 돼요" 문제를 미리 발견할 수 있습니다.' },
          { title: '운영 배포', desc: 'main 브랜치에 합쳐지면 카카오 클라우드 서버 3대에 VM4 → VM2 → VM1 순서로 배포됩니다. 각 VM 배포 후 헬스 체크를 통과해야 다음으로 넘어가요.' },
        ],
      },

      {
        title: '서비스별로 자동 검사가 다르게 실행돼요',
        table: {
          headers: ['서비스', '자동 검사 방법', '결과물', '배포 대상'],
          rows: [
            ['백엔드 (Spring)',  '빌드 성공 + JPA 스키마 충돌 감지',        '실행 파일(.jar)',     'VM2 :8080'],
            ['AI 에이전트',      '테스트 332개 통과 + 로그 형식 검증',       '도커 이미지',        'VM2 :8000'],
            ['추천 서비스',      '파이썬 테스트 통과 + import 검증',          '서버 프로세스',      'VM2 :8001'],
            ['사용자 앱',        '빌드 성공 + 주요 화면 라우트 연결 확인',   '정적 파일(dist/)',   'VM1 Nginx'],
            ['관리자 앱',        '빌드 성공',                                 '정적 파일(dist/)',   'VM1 Nginx'],
          ],
        },
      },

      {
        title: '운영 서버 배포 순서',
        code: `# scripts/deploy-prod.sh — 3-VM 순차 배포

1) VM4 (GPU/DB)  : DB·AI 모델 서버 먼저 업데이트
                   Qdrant / ES / Neo4j / Redis / MySQL / vLLM
                   → /health 확인 후 다음 단계 진행

2) VM2 (Service) : 백엔드·에이전트·추천 서비스 업데이트
                   env_file: .env.prod 로 환경변수 주입
                   → /health 확인 후 다음 단계 진행

3) VM1 (Public)  : 빌드된 앱 파일 업로드 + Nginx 재시작
                   Client(5173→dist) + Admin(5174→dist)

* VM3 (모니터링) — 설정 변경 시에만 별도 배포
  Prometheus 룰 / Grafana 대시보드 / Kibana saved objects`,
        note: 'VM4 DB 서버를 먼저 배포하는 이유: 백엔드(VM2)가 시작할 때 DB 연결을 맺기 때문입니다. 순서가 바뀌면 VM2가 DB를 못 찾아 기동에 실패해요.',
      },

      {
        title: '이 조건을 통과해야 배포가 진행돼요',
        list: [
          'AI 에이전트: pytest 332개 모두 통과 + JSON 로그 형식 검증. 한 개라도 실패하면 배포가 중단됩니다.',
          '백엔드: Gradle 빌드 성공 + JPA ddl-auto=validate로 DB 스키마 충돌 없음 확인. 스키마 불일치는 기동 시 즉시 실패로 이어지므로 CI 단계에서 미리 잡아요.',
          '사용자 앱: npm run build 성공 + 주요 라우트(/chat, /home, /movie/:id 등) 정상 연결 확인.',
          '각 VM 배포 후 GET /health 응답 200 확인 → 통과하면 다음 VM으로 진행. 실패하면 배포 스크립트가 중단되고 팀에 알림이 가요.',
        ],
      },

      {
        title: '비밀 정보(API 키, 비밀번호)는 안전하게 관리해요',
        list: [
          '카드 결제 키(Toss), 로그인 서명 키(JWT_SECRET), 소셜 로그인 정보(OAuth) 등은 GitHub Secrets에 암호화해서 보관합니다. Actions 워크플로우 안에서만 접근 가능해요.',
          '각 운영 서버에는 .env.prod 파일을 직접 주입하고 Git에는 올리지 않습니다. 2026-04-15 전면 정비로 누락되어 있던 결제·인증·CORS 관련 키들이 모두 주입 완료됐어요.',
          '어떤 키가 필요한지는 .env.prod.example 예시 파일로만 공유하고 실제 값은 비공개입니다. 신규 팀원이 환경 구성을 놓치지 않도록 예시 파일에 설명 주석이 달려있어요.',
        ],
      },
    ],
  },

  /* ─────────── 14. Staging & Production ─────────── */
  staging: {
    icon: '🏭',
    tag: 'STAGING + PRODUCTION',
    title: '스테이징 & 운영 서버 환경',
    desc: '실제 서비스 전에 맥북 Docker에서 미리 테스트합니다. "스테이징(Staging)"은 운영과 동일한 구성을 로컬에서 재현해 코드가 실제 환경에서도 문제없이 동작하는지 검증하는 사전 단계예요. 운영은 카카오 클라우드 서버 4대로 역할을 분리해 구성되며, 외부에서 직접 접근 가능한 서버는 Nginx가 올라가 있는 VM1 한 대뿐입니다. 스테이징과 운영 모두 동일한 docker-compose 형식으로 구동되어 "내 컴퓨터에서는 됐는데 서버에서 안 됩니다"라는 환경 차이 문제를 최소화했어요. 모니터링 대시보드(Grafana·Kibana)도 코드(NDJSON)로 관리해서 서버를 재구성해도 자동으로 복원됩니다.',
    color: '#a78bfa',
    stats: [
      { value: '4', label: '운영 서버 (VM)' },
      { value: '1', label: '스테이징 (맥북)' },
      { value: '동일 구성', label: '환경 동등성' },
      { value: 'VM1만 공개', label: '외부 노출 최소화' },
    ],
    sections: [

      {
        title: '운영 전에 맥북에서 먼저 확인해요 (스테이징)',
        list: [
          '명령어 한 줄(docker compose -f docker-compose.staging.yml up -d)로 전체 서비스를 맥북 Docker에서 로컬 실행할 수 있어요. 인터넷 없이도 전체 흐름을 테스트할 수 있습니다.',
          '데이터베이스 5개(MySQL·Redis·Qdrant·Neo4j·ES), AI 에이전트, 추천 서비스, 백엔드, Nginx가 모두 포함됩니다. 운영 환경을 그대로 축소해 재현한 구조예요.',
          'develop 브랜치에 코드가 합쳐지면 자동으로 스테이징에 반영됩니다. 덕분에 팀원이 서로 최신 코드를 같은 환경에서 테스트할 수 있어요.',
          '실제 사용자 흐름 E2E 테스트 14개 통과(일부 진행 중 포함). 가입 → 온보딩 → AI 추천 → 결제 → 리뷰 → 포인트 지급까지 전체 사이클을 자동으로 검증해요.',
        ],
      },

      {
        title: '운영 서버는 역할별로 4대로 나뉘어 있어요',
        table: {
          headers: ['서버', 'IP', '맡은 역할', '특이사항'],
          rows: [
            ['VM1 (공개)',     '210.109.15.187', '외부 요청 관문(Nginx) + 앱 파일 제공', '유일한 공개 IP 보유'],
            ['VM2 (서비스)',   '10.20.0.11',     '백엔드(8080) · 에이전트(8000) · 추천(8001)', '내부 통신만'],
            ['VM3 (모니터링)', '10.20.0.12',     'Prometheus · Grafana · Alertmanager · ELK', '내부 통신만'],
            ['VM4 (GPU+DB)',   '10.20.0.10',     'vLLM(18000/18001) · MySQL · Redis · Qdrant · Neo4j · ES', 'Tesla T4 GPU 탑재'],
          ],
        },
        note: 'VM4가 GPU와 DB를 함께 담당하는 이유: AI 모델이 DB 데이터를 직접 읽어 임베딩·검색을 수행하므로 같은 서버에 두면 네트워크 지연이 없습니다.',
      },

      {
        title: '외부에서는 VM1 한 대만 접근할 수 있어요',
        list: [
          'VM1만 공개 IP(210.109.15.187)를 가지고, 나머지 3대는 내부 네트워크(10.20.0.0/24)에서만 통신해요. 공격 면을 최소화하는 가장 기본적인 보안 설계입니다.',
          '관리자가 내부 서버에 SSH로 접속할 때는 VM1을 점프 호스트(Jump Host — 경유 서버)로 삼아야 합니다. VM1이 뚫려도 내부 서버 키가 노출되지 않도록 ssh-agent forwarding을 씁니다.',
          '데이터베이스 포트(3306·6379·6333·7474·9200)와 AI 모델 포트(18000·18001)는 외부에서 직접 접근이 불가능해요.',
          '모든 외부 요청은 Nginx를 반드시 거치며, 관리자 API는 Basic Auth(1차) + JWT 관리자 역할(2차)로 이중 검사합니다.',
        ],
      },

      {
        title: '스테이징과 운영이 최대한 같은 환경이에요',
        list: [
          '두 환경 모두 동일한 docker-compose 형식으로 실행됩니다. 스테이징은 docker-compose.staging.yml, 운영은 docker-compose.prod.app.yml을 쓰며 이미지 버전만 다르게 지정해요.',
          '비밀 키 구조는 .env.prod.example 예시 파일로 공유하고, 실제 값은 각 서버의 .env.prod 파일에 직접 주입합니다. Git에는 절대 올라가지 않아요.',
          '데이터베이스 구조(스키마) 변경은 백엔드 JPA @Entity + ddl-auto=update가 단독으로 책임집니다. Flyway 같은 별도 마이그레이션 도구를 쓰지 않아 서버 재시작 시 자동 반영돼요.',
          'Grafana 대시보드와 Kibana saved objects도 코드(JSON/NDJSON)로 관리합니다. 서버를 재구성해도 init 컨테이너가 자동으로 복원해줘요.',
        ],
      },

      {
        title: '서버 상태는 4가지 도구로 실시간 확인해요',
        list: [
          'Prometheus — 응답 속도(p50·p95·p99), 오류율, DB 연결 수 등 수치 데이터를 15초마다 수집합니다. 커스텀 메트릭으로 AI 추천 요청 수·LLM 리랭커 호출 수도 추적해요.',
          'Grafana — 수집된 수치를 대시보드로 시각화합니다. monglepick-logs 대시보드(12패널, 2026-04-15 신설)에서 Backend·Agent·Recommend·Nginx 로그를 실시간 스트림으로 확인할 수 있어요.',
          'Alertmanager — 이상 징후 11개 조건(5xx 급증·vLLM 헬스 실패·DB 연결 풀 90% 초과 등) 감지 시 즉시 알림을 발송합니다. 야간에도 놓치지 않아요.',
          'ELK(Elasticsearch·Logstash·Kibana) — 전체 서비스 로그를 한 곳에서 검색하고 분석합니다. Kibana에 36개 saved object(Data View 5·Saved Search 4·Visualization 22·Dashboard 4)가 자동 프로비저닝돼 있어요.',
        ],
      },
    ],
  },

  /* ─────────── 15. Jira + Confluence Project Management ─────────── */
  projectMgmt: {
    icon: '📌',
    tag: 'PROJECT MGMT',
    title: '프로젝트 관리 · 할 일 추적과 문서화 방식',
    desc: '261개 요구사항을 Jira 이슈로 쪼개어 담당자별로 관리합니다. 개발·테스트·문서화가 한 루프로 이어지도록 Claude Code AI 에이전트에서 Jira와 Confluence를 MCP(Model Context Protocol — AI가 외부 도구를 직접 호출하는 방식)로 연동해 수작업을 줄였습니다. Google Sheets WBS가 요구사항의 단일 진실 원본이고, Jira 이슈·Confluence 문서·CLAUDE.md 요약이 항상 동일한 수치를 가리키도록 유지해요. "중복 관리 금지" 원칙 아래, 이중으로 저장된 문서는 발견 즉시 한쪽을 삭제하고 통합합니다.',
    color: '#f97316',
    stats: [
      { value: '261', label: '총 요구사항' },
      { value: '29건', label: 'QA 이슈' },
      { value: 'MCP', label: 'Jira/Confluence 자동화' },
      { value: '4명', label: '팀원별 이슈 분담' },
    ],
    sections: [

      {
        title: '전체 작업 현황 (2026-03-31 기준)',
        table: {
          headers: ['상태', '건수', '비율', '의미'],
          rows: [
            ['완료',    '69',  '26.4%', 'PR 머지 + 테스트 통과 확인 완료'],
            ['진행 중', '29',  '11.1%', '현재 개발 중이거나 리뷰 대기'],
            ['대기',    '149', '57.1%', '우선순위 확정 후 착수 예정'],
            ['보류',    '14',  '5.4%',  '기술 검토 중 또는 요구사항 재정의 필요'],
            ['총계',    '261', '100%',  '—'],
          ],
        },
        note: '요구사항 목록은 Google Sheets(WBS)로 유지하고 Jira 이슈와 연동해 양방향 동기화합니다. WBS가 Jira보다 먼저 업데이트되는 단방향 흐름을 원칙으로 해요.',
      },

      {
        title: '담당자별로 이슈를 나눠 관리해요',
        list: [
          '윤형주 146개(채팅·추천·결제·포인트·고객센터·인프라·관리자) · 김민규 58개(auth·user·대시보드) · 정한나 34개(recommend FastAPI) · 이민수 22개(community·콘텐츠)로 역할을 기술 영역 단위로 분담했어요.',
          '이슈는 Epic·Story·Task·Bug·Sub-task로 구분하고, WBS의 각 항목과 1:1로 연결됩니다. 이슈 번호가 PR 제목에 포함되면 Jira 이슈 상태가 "In Review"로 자동 전환돼요.',
          'QA 테스트 29건은 별도 가이드(docs/QA_Jira_이슈생성_가이드.md)에 따라 템플릿으로 일괄 생성했습니다. 각 테스트 케이스가 기능 이슈와 연결되어 커버리지를 한눈에 확인할 수 있어요.',
          'Claude Code에서 MCP를 통해 Jira 이슈를 직접 검색·생성·수정·상태 변경할 수 있습니다. "이슈 찾아서 상태 변경하고 PR 설명 작성"을 에이전트가 한 번에 처리해요.',
        ],
      },

      {
        title: '설계 문서는 한 곳에서 관리해요',
        list: [
          '핵심 설계 문서 3종이 단일 진실 원본입니다: AI 에이전트 설계서(6,427줄) · 리워드·결제 설계서(v3.3) · DB 스키마 정의서 v2(88 테이블). 코드와 충돌하면 코드를 기준으로 교차 검증해요.',
          '작업 이력은 docs/PROGRESS.md 한 파일에만 누적하고, CLAUDE.md에는 핵심 요약만 유지합니다. PROGRESS.md가 길어져도 CLAUDE.md는 간결하게 유지하는 것이 원칙이에요.',
          '팀원 4명이 각자 개발 가이드(docs/개발가이드_*.md)와 관리자 페이지 가이드(docs/관리자페이지_*.md)를 보유합니다. 신규 작업 전에 본인 가이드를 먼저 확인하는 워크플로우예요.',
          'Claude Code에서 Confluence 페이지를 직접 생성·수정할 수 있어 코드 변경과 문서 반영 사이의 지연이 없어졌습니다.',
        ],
      },

      {
        title: '개발 한 사이클이 어떻게 돌아가나요?',
        steps: [
          { title: '① 이슈 선택', desc: '담당자가 Jira에서 이슈를 "진행 중"으로 바꾸고, "feature/이슈번호-기능명" 형식으로 브랜치를 만들어요. 이슈 번호가 브랜치 이름에 포함되어 자동으로 연결됩니다.' },
          { title: '② 코드 + 테스트', desc: '역할별 Claude Code 에이전트(백엔드·AI에이전트·프론트엔드·인프라)를 활용합니다. 코드 작성과 테스트를 같은 사이클에서 완료해야 다음 단계로 넘어갈 수 있어요.' },
          { title: '③ PR 올리기', desc: '커밋 메시지에 Jira 이슈 번호를 적으면 PR과 이슈가 자동으로 연결됩니다. PR 설명은 "변경 이유 + 테스트 방법 + 관련 이슈" 형식으로 작성해요.' },
          { title: '④ 문서 반영', desc: '설계 변경이 있으면 관련 docs/*.md를 업데이트하고, PROGRESS.md에 작업 이력을 추가합니다. 코드만 바뀌고 문서가 안 바뀌면 나중에 코드와 설계서가 불일치하는 문제가 생겨요.' },
          { title: '⑤ 이슈 완료', desc: '이슈를 완료 상태로 바꾸면 릴리즈 노트 후보로 자동 수집되어 배포 시 changelog 작성이 빨라집니다.' },
        ],
      },

      {
        title: '"같은 내용을 두 곳에서 관리하지 않는다"는 원칙을 지켜요',
        list: [
          '중복 문서가 생기면 한쪽을 삭제하고 통합합니다. 두 곳을 동시에 유지하면 어느 쪽이 최신인지 알 수 없고, 팀원이 오래된 정보를 기준으로 개발하는 사고가 발생해요.',
          'WBS·Jira·Confluence·CLAUDE.md 네 곳이 항상 같은 수치(261/69/29/149/14)를 가리켜야 합니다. 수치가 다르면 어딘가에서 업데이트가 누락된 신호예요.',
          '자동화 덕분에 "기록 → 개발 → 문서 반영"이 끊기지 않는 한 루프로 이어져 수작업 전환 비용이 크게 줄었습니다. 에이전트가 Jira 이슈 생성부터 Confluence 업데이트까지 한 번에 처리해요.',
        ],
      },
    ],
  },

  /* ─────────── 16. Recommend Service Architecture ─────────── */
  recommendArch: {
    icon: '🧮',
    tag: 'RECOMMEND SERVICE',
    title: '추천 서비스 · 좋아요가 폭발해도 끊기지 않는 이유',
    desc: '"좋아요" 버튼을 빠르게 연타하거나 동시에 많은 사람이 누를 때도 앱이 느려지지 않도록, 별도의 경량 서버(FastAPI)가 Redis로 즉시 처리하고 DB 반영은 60초마다 모아서 하는 write-behind(캐시에 먼저 쓰고 나중에 DB에 반영) 방식을 씁니다. 메인 Spring 서버에서 좋아요를 처리하면 짧은 시간에 수천 건의 DB 쓰기가 몰려 커넥션 풀(DB 연결 자원)이 고갈되어 인증·결제·채팅 같은 중요한 요청까지 느려집니다. 별도 서비스로 분리하면 좋아요 트래픽 폭증이 메인 서버에 전혀 영향을 주지 않아요. Nginx가 /api/v1/movies/:id/like* 경로를 자동으로 이 서버로 라우팅해서 사용자는 서버가 분리된 것을 알 필요가 없습니다.',
    color: '#06d6a0',
    stats: [
      { value: 'FastAPI', label: '비동기 경량 서버' },
      { value: '<1ms', label: '좋아요 응답 속도' },
      { value: '60초', label: 'DB 반영 주기' },
      { value: '5분', label: '공동 시청 캐시 TTL' },
    ],
    sections: [
      {
        title: '왜 별도 서비스로 분리했나요?',
        text: '"좋아요" 버튼은 짧은 시간에 수천 번 눌릴 수 있어요. 메인 Spring 서버에서 처리하면 DB 연결이 금방 포화되어 다른 중요한 요청까지 느려집니다. FastAPI는 Python의 async/await 기반 비동기 서버라 단일 프로세스에서 수천 개의 동시 요청을 DB 연결 1~2개만으로 처리할 수 있어요. 게다가 좋아요 응답에 DB 조회가 전혀 없이 Redis 한 번만 읽으면 되도록 구조를 설계해 응답 시간이 1ms 이하입니다.',
        code: `monglepick-recommend/app/
├── main.py                       # 서버 진입점
├── v2/
│   ├── api/{like,onboarding,wishlist,match_cowatch,review,search}.py
│   ├── service/{like_service,match_cowatch_service,trending_service}.py
│   ├── repository/*.py           # 필요한 컬럼만 선택해서 조회
│   └── core/{database, sql_logger}.py
├── background/like_flush.py      # 60초마다 DB에 모아서 반영
├── core/{redis, scheduler, metrics}.py
└── model/{entity, schema}.py`,
      },

      {
        title: '좋아요가 처리되는 과정',
        steps: [
          { title: '① 즉시 Redis 저장', desc: '좋아요를 누르면 Redis의 영화별 좋아요 수(Hash)와 내 좋아요 목록(Set)에 즉시 반영합니다. "DB 반영 대기" 목록(Hash)에도 추가돼요. 이 세 가지가 모두 Redis 내에서 처리되어 DB는 전혀 건드리지 않습니다.' },
          { title: '② 즉시 응답', desc: '좋아요 수와 내 상태(하트 채워짐/비어있음)를 Redis에서 바로 읽어 1ms 이내로 답합니다. 데이터베이스를 전혀 조회하지 않으니 수천 명이 동시에 눌러도 응답 속도가 일정해요.' },
          { title: '③ 60초마다 DB 반영', desc: 'background/like_flush.py가 매 60초마다 "대기" 목록을 꺼내 MySQL에 한꺼번에 씁니다(배치 upsert). 한 영화에 60초 동안 1,000번 눌렸어도 DB 쓰기는 딱 1번이에요.' },
          { title: '④ 장애 복구', desc: '반영에 실패하면 대기 목록을 그대로 두고 다음 60초에 재시도합니다. Redis는 AOF(Append-Only File) 지속성을 켜놔서 서버가 재시작돼도 대기 데이터가 복원돼요.' },
        ],
        note: '좋아요 연타나 동시 접속 폭증이 일어나도 DB는 분당 1번만 씁니다. 커넥션 풀이 여유롭게 유지되어 다른 서비스에 영향이 없어요.',
      },

      {
        title: 'Redis에 저장되는 데이터 종류',
        table: {
          headers: ['저장 내용', '자료구조', '유지 시간', '용도'],
          rows: [
            ['영화별 좋아요 수',        'Hash',  '영구',  '영화 상세 페이지의 좋아요 카운트 표시'],
            ['내가 좋아요한 영화 목록', 'Set',   '1시간', '하트 채워짐/비어있음 여부 판단'],
            ['DB 반영 대기 변경분',     'Hash',  '영구',  '60초 배치 플러시 대상 — 서버 재시작 후에도 보존'],
            ['둘 다 본 사용자 후보',    'JSON',  '5분',   '"둘이 영화 고르기" Co-watched CF 캐시'],
            ['인기 검색어',             'ZSet',  '10분',  '검색창 자동완성 인기 키워드 (점수순 정렬)'],
          ],
        },
      },

      {
        title: '"둘 다 좋아한 사람들"이 고른 영화를 추천에 활용해요',
        list: [
          '"둘이 영화 고르기(Movie Match)" 기능에서 두 영화를 모두 별점 3.5 이상으로 평가한 실제 사용자들을 reviews 테이블에서 찾아냅니다. 수학적 계산만으로 얻을 수 없는 "실제 함께 즐긴 영화" 데이터예요.',
          '그 사람들이 또 높게 평가한 영화를 추천 후보로 올립니다. 데이터 기반이라 신뢰도가 높고, Movie Match 점수의 20%를 차지하는 협업 필터링(CF) 성분이에요.',
          '같은 두 영화 쌍을 반복 조회하면 Redis 캐시(TTL 5분)에서 바로 꺼냅니다. 인기 영화 쌍은 DB 조회 없이 응답해 트래픽이 몰려도 빠르게 처리돼요.',
        ],
      },

      {
        title: '빠르게 응답하기 위해 쓴 기법들',
        list: [
          { label: '필요한 컬럼만 조회', value: '전체 행을 SELECT하지 않고 필요한 컬럼만 명시적으로 지정해 DB I/O와 Python 객체 생성 비용을 줄입니다. ORM의 lazy loading도 비활성화해요.' },
          { label: 'async/await 비동기', value: 'FastAPI의 비동기 처리로 단일 프로세스에서 수천 개의 동시 요청을 처리할 수 있습니다. I/O 대기 중에 다른 요청을 처리해 CPU를 낭비하지 않아요.' },
          { label: 'Redis 1회 조회',     value: '좋아요 응답은 Redis 파이프라인 1회로 모든 정보(카운트+상태)를 한 번에 읽어 반환하도록 설계했습니다. 왕복 횟수를 최소화해요.' },
          { label: 'Nginx 투명 라우팅',  value: 'VM1 Nginx가 /api/v1/movies/:id/like* 경로를 recommend 서버(VM2:8001)로 자동 재작성합니다. 클라이언트 코드 변경 없이 라우팅이 전환돼요.' },
          { label: '배치 성능 지표',     value: 'like_flush_batch_size와 like_flush_duration_seconds를 Prometheus 메트릭으로 기록합니다. 배치가 느려지거나 크기가 비정상적으로 커지면 알림이 울려요.' },
        ],
      },
    ],
  },

  /* ─────────── 17. Cold Start · Onboarding · CF Cache ─────────── */
  coldStart: {
    icon: '❄️',
    tag: 'COLD START',
    title: '첫 추천 · 리뷰가 0개여도 좋은 영화를 찾아줘요',
    desc: '방금 가입한 사람은 리뷰 데이터가 없어서 AI가 취향을 전혀 모릅니다. 이를 "Cold Start 문제"라고 해요. 협업 필터링(CF — Collaborative Filtering, "나와 비슷한 사람이 좋아한 것을 추천")은 데이터가 없으면 작동하지 않으므로, 가입 직후 짧은 온보딩으로 기초 취향을 수집하고, 비슷한 취향 패턴을 가진 다른 사람 데이터(Kaggle MovieLens 26M)를 임시로 활용합니다. 리뷰가 쌓일수록 Kaggle 의존도는 자동으로 낮아지고 내 실제 데이터 비중이 높아지는 동적 가중치 구조입니다. 온보딩 없이도 첫 마디 한 줄("오늘 우울해")만으로 대화 안에서 임시 취향 프로필이 만들어져 즉시 추천이 가능해요.',
    color: '#a78bfa',
    stats: [
      { value: '0건', label: '리뷰 없어도 추천 가능' },
      { value: '26M', label: '참고 데이터 (Kaggle)' },
      { value: '100%', label: '완전 신규 시 콘텐츠 기반' },
      { value: '4단계', label: '사용자 상태 분류' },
    ],
    sections: [

      {
        title: '사용자 상태에 따라 추천 방식이 달라져요',
        table: {
          headers: ['상태', '기준', '콘텐츠 기반(CBF)', '협업 필터링(CF)', '보완 방법'],
          rows: [
            ['완전 신규',   '리뷰 0건, 월드컵 0회', '100%', '0%',  '온보딩 장르 + Kaggle 패턴'],
            ['온보딩 완료', '월드컵 1회 이상',       '80%',  '20%', '월드컵 우승작 벡터 + Kaggle'],
            ['초기 활동',   '리뷰 1~9건',            '50%',  '50%', '내 리뷰 + Kaggle 혼합'],
            ['정상',        '리뷰 10건 이상',         '40%',  '60%', '내 리뷰 데이터가 주력'],
          ],
        },
        note: '"데이터가 0이어도 추천이 0이 되지 않게" — 콘텐츠 기반(영화 속성 유사도)·Kaggle 시드·대화 임시 프로필 세 가지로 빈 곳을 채웁니다.',
      },

      {
        title: '가입 직후 취향을 빠르게 파악해요 (온보딩)',
        steps: [
          { title: '① 장르 선택', desc: '18개 장르 중 좋아하는 것을 3개 이상 골라요. 이 정보가 초기 벡터 검색 쿼리의 필터 조건이 되어 첫 추천의 기준점이 됩니다.' },
          { title: '② 영화 월드컵', desc: '16강·32강 토너먼트로 영화를 골라가면서 무드·감독·분위기 취향을 자연스럽게 수집해요. 설문 형태보다 거부감이 적고 실제 선호를 더 잘 반영합니다.' },
          { title: '③ 영화 5편 평가', desc: '인기 영화 5편에 별점을 매겨요. 건너뛸 수도 있지만 매기면 추천이 더 정확해집니다. 이 5개 별점이 초기 CF의 출발 데이터가 돼요.' },
          { title: '④ OTT 선택', desc: '가입한 스트리밍 서비스(넷플릭스·왓챠·티빙 등)를 선택하면 실제로 볼 수 있는 영화 위주로 추천해 줘요. 아무리 좋은 추천도 볼 수 없으면 의미가 없으니까요.' },
        ],
        list: [
          '온보딩 완료 시 500포인트 보너스가 즉시 지급됩니다. 온보딩을 마치는 동기를 포인트로 강화했어요.',
          '관리자가 월드컵 후보 영화 목록을 코드 배포 없이 직접 관리·업데이트할 수 있어 신작이 나오면 즉시 반영됩니다.',
        ],
      },

      {
        title: '비슷한 취향의 다른 사람 데이터를 빌려와요 (Kaggle 시드)',
        text: '내 리뷰가 부족할 때, 같은 영화를 좋아했던 26만 명의 시청·평가 패턴(Kaggle MovieLens 공개 데이터, 2,600만 건)을 임시로 활용합니다. 에이전트 전용 읽기 전용 테이블(kaggle_watch_history)로 관리되며 백엔드 JPA Entity 매핑이 없어요. 덕분에 첫 대화부터 "나와 비슷한 패턴의 사람이 좋아한 영화"를 추천받을 수 있습니다.',
        list: [
          { label: '데이터 규모', value: '2,600만 건의 별점 데이터, 27만 명 — 읽기 전용 Cold Start 보조용. 실제 서비스 리뷰와는 완전히 분리된 테이블입니다.' },
          { label: '추천 학습 분리', value: '실제 추천 학습의 단일 입력은 내 reviews 테이블(강한 신호)입니다. Kaggle 데이터는 리뷰 10건 미만일 때만 CF 가중치를 보완하는 역할이에요.' },
          { label: '캐시 저장', value: '자주 쓰이는 유사 사용자 패턴을 Redis에 미리 올려두어 Cold Start 추천 응답 지연이 없어요. 캐시 미스 시에만 kaggle_watch_history를 직접 조회합니다.' },
        ],
        note: '내 리뷰가 10건을 넘으면 Kaggle 가중치가 자동으로 낮아지고 내 실제 데이터 비중이 60%까지 올라갑니다. 앱을 쓸수록 내 데이터가 주인이 되는 구조예요.',
      },

      {
        title: '첫 마디 한 줄만으로도 추천이 가능해요',
        text: '"오늘 우울해"라고 한 마디를 입력하면 AI가 감정(우울)·의도(추천 요청)·키워드를 즉시 추출해 검색 조건으로 변환합니다. 저장된 취향 프로필이 없어도 그 대화 안에서 임시 프로필이 만들어지고, 대화가 이어질수록 조건이 누적돼 추천 정확도가 높아져요. 5턴 이상 대화가 쌓이면 완전 신규 사용자도 일반 사용자 수준의 추천 품질을 받을 수 있습니다.',
        list: [
          '온보딩을 건너뛴 사용자도 첫 채팅에서 의미 있는 추천을 받을 수 있어요. AI가 대화에서 실시간으로 취향을 파악하기 때문입니다.',
          '대화 맥락은 Redis 세션에 저장되어 같은 대화 내에서 이전 조건이 누적 반영됩니다. 다음 대화 세션에서는 MySQL 아카이브에서 불러와 이어하기가 가능해요.',
        ],
      },

      {
        title: '추천 품질을 지속적으로 모니터링해요',
        list: [
          '가입 후 7일 이내에 리뷰가 0건인 사용자 비율을 관리자 통계 대시보드에서 실시간으로 확인합니다. 이 비율이 높으면 온보딩 UX를 개선할 신호예요.',
          '추천 품질이 떨어지면 온보딩 월드컵 강수(16강↔32강)를 조정해 취향 수집 데이터 양을 늘릴 수 있어요. 관리자가 코드 배포 없이 설정을 바꿀 수 있습니다.',
          '희귀 장르(단편·다큐 등)처럼 Kaggle 참고 데이터가 부족한 경우, 콘텐츠 기반(CBF) 비중을 자동으로 높여 데이터 빈 곳을 영화 속성 유사도로 보완합니다.',
        ],
      },
    ],
  },

  /* ─────────── 18. JWT Authentication ─────────── */
  jwtAuth: {
    icon: '🔑',
    tag: 'AUTH',
    title: '로그인 · 신분증(토큰) 발급과 갱신 방식',
    desc: '로그인하면 1시간짜리 신분증(액세스 토큰 — Access Token)과 7일짜리 갱신권(리프레시 토큰 — Refresh Token)을 발급합니다. JWT(JSON Web Token)는 서버가 서명한 암호화된 데이터 조각으로, DB를 조회하지 않고도 서명 검증만으로 사용자를 인증할 수 있어 빠르고 확장성이 높습니다. 신분증이 만료되면 갱신권으로 자동 재발급해 사용자가 1시간마다 다시 로그인해야 하는 불편함을 없앴어요. 갱신권은 DB에서 화이트리스트로 관리해 탈취된 갱신권의 재사용 시도를 즉시 탐지하고 계정 전체를 잠급니다. 카카오·구글·네이버 소셜 로그인도 내부적으로 동일한 JWT 흐름으로 수렴해요.',
    color: '#118ab2',
    stats: [
      { value: 'HS256~512', label: '서명 알고리즘' },
      { value: '1h / 7d', label: '신분증 / 갱신권 유효기간' },
      { value: 'HttpOnly', label: '갱신권 저장 방식' },
      { value: 'Rotation', label: '재사용 탐지' },
    ],
    sections: [

      {
        title: '로그인 처리를 담당하는 역할 분리',
        table: {
          headers: ['담당', '하는 일', '왜 분리했나요?'],
          rows: [
            ['토큰 공급자(JwtTokenProvider)',   '토큰 생성·검증·내용 추출. 비밀키 길이에 따라 서명 방식 자동 선택', '토큰 로직을 한 곳에서 관리해 변경 시 파급 범위를 줄임'],
            ['인증 필터(JwtAuthFilter)',         '모든 요청의 Authorization 헤더를 파싱해 로그인 상태 확인',         'Spring Security 필터 체인에 통합 — 컨트롤러가 인증 코드를 몰라도 됨'],
            ['로그인 필터(LoginFilter)',          '로그인 성공 시 신분증은 JSON 응답으로, 갱신권은 HttpOnly 쿠키로 전달', 'JS로 접근 불가한 쿠키에 갱신권을 담아 XSS 공격으로 탈취 차단'],
            ['JWT 서비스(JwtService)',            '갱신 요청 처리 — 기존 갱신권 삭제 후 새 것 발급(Rotation)',        '갱신권을 한 번만 쓸 수 있게 해 재사용 탐지 가능'],
            ['갱신권 저장소(RefreshTokenRepo)',   '유효한 갱신권 화이트리스트를 DB 테이블로 관리',                    '서버 재시작 후에도 갱신권 상태 유지, 강제 로그아웃 지원'],
          ],
        },
      },

      {
        title: '두 가지 토큰이 다른 방식으로 저장돼요',
        list: [
          { label: '신분증 (Access Token)', value: '유효기간 1시간. JSON 응답으로 전달되고 앱 메모리(React Context)에만 보관합니다. localStorage나 sessionStorage에 넣지 않아 XSS(크로스 사이트 스크립팅) 공격으로 탈취되지 않아요.' },
          { label: '갱신권 (Refresh Token)', value: '유효기간 7일. 브라우저의 HttpOnly 쿠키(JavaScript에서 document.cookie로 접근 불가)로 저장됩니다. 쿠키는 Same-Site 설정으로 CSRF(사이트 간 요청 위조) 공격도 방어해요.' },
          { label: '서명 방식 자동 선택', value: '비밀키 길이에 따라 HS256(32바이트 미만)·HS384(48바이트 미만)·HS512(64바이트 이상) 중 자동 선택됩니다. 운영 서버는 67바이트 키로 HS512가 자동 선택돼요.' },
          { label: 'AI 에이전트 호환 (2026-04-15 수정)', value: '에이전트가 세 가지 서명 방식을 모두 인식하도록 algorithms=["HS256","HS384","HS512"]로 확장했습니다. 이전에는 HS256만 허용해 운영 서버의 HS512 토큰이 전부 거부되어 채팅 이력이 저장되지 않던 버그의 근본 원인이었어요.' },
        ],
      },

      {
        title: '신분증이 만료되면 자동으로 갱신돼요',
        steps: [
          { title: '① 로그인', desc: '인증 성공 시 신분증(1h)과 갱신권(7d)을 동시에 발급합니다. 갱신권은 DB에 등록하고 HttpOnly 쿠키로 전달해요.' },
          { title: '② API 요청', desc: '매 요청마다 Authorization 헤더의 신분증을 검증합니다. DB 조회 없이 서명 검증만으로 처리해 빠릅니다.' },
          { title: '③ 신분증 만료 → 자동 갱신', desc: '클라이언트가 401 응답을 받으면 갱신 API를 자동 호출합니다. 갱신권의 유효성을 DB에서 확인하고 새 신분증을 발급해요. 기존 갱신권은 즉시 삭제(Rotation)됩니다.' },
          { title: '④ 도용 탐지', desc: '이미 삭제된 갱신권으로 요청이 들어오면 토큰 탈취로 간주하고 해당 계정의 모든 갱신권을 무효화합니다. 피해자와 공격자 모두 재로그인이 필요해져요.' },
          { title: '⑤ 로그아웃', desc: '서버에서 갱신권을 DB에서 명시적으로 삭제합니다. 이후 갱신 시도가 들어오면 DB에 없으므로 거절돼요.' },
        ],
        note: '갱신권을 DB 화이트리스트로 관리하기 때문에 "탈취된 갱신권 재사용 시도"를 즉시 감지할 수 있습니다. 블랙리스트 방식보다 구현은 복잡하지만 보안이 더 강해요.',
      },

      {
        title: '카카오·구글·네이버 로그인도 같은 방식으로 수렴해요',
        text: '소셜 로그인(OAuth2)으로 들어오면 해당 서비스에서 인증을 마친 뒤, Spring OAuth2 Client가 콜백을 처리하고 서버가 자체 JWT를 새로 발급합니다. 이 JWT를 /jwt/exchange API로 교환하면 이후 모든 요청이 일반 로그인과 완전히 동일한 경로로 처리돼요. 외부 소셜 서비스에 대한 의존도가 최초 인증 시점 이후에는 없어지는 구조입니다.',
      },

      {
        title: 'AI 에이전트와 추천 서비스는 다른 방식으로 인증해요',
        list: [
          'AI 에이전트와 추천 서비스는 사용자 JWT 대신 서버 간 전용 키(X-Service-Key 헤더)로 신뢰를 확인합니다. 서비스 키가 노출되면 Backend에서 즉시 교체 가능해요.',
          '앱에서 API 호출 중 401이 오면 fetchWithAuth 래퍼가 자동으로 갱신을 시도하고 성공하면 원래 요청을 재시도합니다. 실패하면 로그인 화면으로 이동해요.',
          'AI SSE 스트리밍 도중 토큰이 만료돼도 끊기지 않습니다. 스트림 수신 중 401이 오면 AbortController로 스트림을 취소하고 토큰 갱신 후 새 스트림을 연결해요.',
        ],
      },

      {
        title: '보안 항목 체크리스트',
        list: [
          '운영 서버의 JWT_SECRET은 67바이트 이상으로 HS512 서명을 자동 생성합니다. 짧은 비밀키로 인한 무차별 대입 공격을 방어해요.',
          '"none" 알고리즘 주입이나 RS256→HS256 알고리즘 혼동 공격이 HMAC 전용 방식 사용으로 불가능합니다.',
          '갱신권 재사용 감지 시 해당 계정의 모든 세션을 즉시 무효화합니다. 공격자와 피해자 모두 재로그인해야 해요.',
          '관리자 API는 JWT 관리자 역할 검증(1차)과 X-Service-Key(2차) 이중으로 확인합니다. 모니터링 도구 접근은 Nginx Basic Auth(1차)가 추가돼요.',
        ],
      },
    ],
  },

  /* ─────────── 19. OCR Ticket Verification ─────────── */
  ocrTicket: {
    icon: '🎫',
    tag: 'OCR VERIFICATION',
    title: '실관람 인증 · 영화관에서 실제로 봤다는 증명',
    desc: '리뷰만으로는 "정말 극장에서 봤는지" 알 수 없어서, 도장깨기 완주나 AI 추천 신뢰도 계산에서 부정행위가 발생할 수 있습니다. 이 문제를 해결하기 위해 영화관 영수증 사진을 올리면 실관람 여부를 인증하는 시스템을 만들었어요. 인증이 완료된 리뷰는 AI 추천 학습에서 더 높은 신뢰 가중치를 받아 추천 품질을 높이고, 도장깨기 코스의 "실관람 필수" 조건을 충족해 완주로 인정됩니다. 현재는 관리자가 직접 검토하는 방식이며, 향후 AI가 영수증 이미지에서 영화명·상영일시를 자동으로 추출해 검증 속도를 높일 예정입니다.',
    color: '#ef476f',
    stats: [
      { value: '2개', label: '백엔드 API 완료' },
      { value: '⏳', label: 'OCR 자동 추출 (후속)' },
      { value: '관리자 큐', label: '현재 수동 검토' },
    ],
    sections: [

      {
        title: '인증이 완료되기까지의 과정',
        steps: [
          { title: '① 배너 표시',    desc: '영화 상세 페이지에 진행 중인 인증 이벤트가 있으면 배너가 자동으로 나타납니다' },
          { title: '② 영수증 업로드', desc: '이미지를 첨부하고 관람일과 상영관을 입력해 제출해요' },
          { title: '③ 제출 완료',    desc: '이미지가 저장되고 "검토 대기" 상태로 등록됩니다' },
          { title: '④ 관리자 검토',  desc: '관리자가 관리자 페이지에서 승인 또는 거절해요. 지금은 사람이 직접 검토하고, 나중에 AI 자동 검증으로 전환할 예정입니다' },
          { title: '⑤ 혜택 지급',    desc: '승인되면 리뷰 신뢰도 가산, 도장깨기 인증, 포인트, 티켓 추첨 응모권이 지급돼요' },
        ],
      },

      {
        title: '구현 완료된 항목과 진행 예정 항목',
        table: {
          headers: ['구분', '항목', '상태'],
          rows: [
            ['백엔드 API',    '진행 중 이벤트 조회 (by-movie)',          '완료'],
            ['백엔드 API',    '영수증 제출 API',                          '완료'],
            ['사용자 앱',     '영화 상세 인증 배너 (OcrEventBanner)',     '완료'],
            ['사용자 앱',     '영수증 제출 모달 (OcrVerificationModal)',  '완료'],
            ['관리자 앱',     'OCR 이벤트 승인·거절 큐',                 '완료'],
            ['관리자 앱',     '영화 제목 검색으로 이벤트 등록 (공통화)',  '완료 (2026-04-14)'],
            ['AI 에이전트',   '이미지에서 영화명·상영관·일시 자동 추출', '미구현 (후속)'],
            ['AI 에이전트',   '자동 검증 API',                            '미구현 (후속)'],
          ],
        },
      },

      {
        title: '부정 제출을 막는 방법',
        list: [
          '같은 영수증 이미지를 다시 올리면 DB 레벨에서 차단돼요 (이미지 해시 기준)',
          '다른 사람 영수증을 쓰는 경우는 현재 관리자 수동 검토가 주된 방어선입니다',
          '영수증 날짜와 해당 영화 상영 기간이 맞지 않으면 자동 거절하는 기능을 후속으로 추가할 예정이에요',
          'OCR 인식 신뢰도가 낮으면 자동 승인 대신 관리자 검토 대기열로 보낼 계획입니다',
        ],
      },

      {
        title: '인증을 마치면 받을 수 있는 혜택',
        list: [
          '"OCR 인증 필수" 도장은 이 과정을 통과해야만 완주로 인정됩니다',
          '해당 리뷰가 AI 추천 학습에서 더 높은 신뢰 가중치를 받아요',
          '관리자가 지정한 보너스 포인트가 지급됩니다',
          '월말 영화 티켓 추첨에 자동으로 응모돼요',
        ],
      },
    ],
  },

  /* ─────────── 20. AI Quiz Generation ─────────── */
  aiQuiz: {
    icon: '❓',
    tag: 'AI QUIZ',
    title: 'AI 퀴즈 자동 생성 · 관리자 도구',
    desc: '퀴즈를 사람이 직접 만들면 시간이 오래 걸리고 영화 한 편마다 담당자가 필요해 빠르게 확장하기 어렵습니다. 이 문제를 해결하기 위해 관리자가 영화만 선택하면 Solar AI가 줄거리와 출연진을 읽고 OX·객관식 4지선다 퀴즈를 자동으로 생성해요. AI가 정해진 JSON 형식으로만 답하도록 강제해 파싱 오류를 막고, 생성된 문항은 관리자 검수를 거쳐 로드맵 코스나 매일의 영화 퀴즈로 배포됩니다. 정답 확인은 AI 없이 규칙 기반으로 처리해 서버 부담 없이 빠르게 채점하고 포인트를 지급해요.',
    color: '#ffd166',
    stats: [
      { value: '검토 → 배포', label: '퀴즈 상태 흐름' },
      { value: '10P', label: '기본 정답 포인트' },
      { value: 'Solar AI', label: '생성 모델' },
    ],
    sections: [

      {
        title: '퀴즈가 만들어지는 과정',
        steps: [
          { title: '① 관리자가 영화 선택', desc: '관리자 페이지 AI 퀴즈 탭에서 영화 제목으로 검색해 선택하고 생성 버튼을 누릅니다' },
          { title: '② AI가 문제 생성',     desc: 'Solar AI가 줄거리·출연진·장르를 읽고 OX 또는 객관식 4지선다 문항과 정답·해설을 만들어요' },
          { title: '③ DB에 저장',          desc: '생성된 퀴즈는 "검토 대기" 상태로 저장됩니다 (문항·정답·해설·포인트 포함)' },
          { title: '④ 관리자 검수',        desc: '관리자가 문항을 확인하고 오류를 수정한 뒤 승인 → 배포 상태로 전환합니다' },
          { title: '⑤ 사용자에게 노출',    desc: '매일 랜덤 1문제 또는 로드맵 코스의 각 편마다 1~2문제로 출제돼요' },
        ],
      },

      {
        title: 'AI에게 전달되는 내용과 받아오는 결과',
        code: `입력 (INPUT)
  movie_id, title, overview, genres, director, cast[0..5], release_year

지시 (PROMPT)
  "다음 영화의 줄거리를 바탕으로 스포일러 없는
   {OX | 객관식 4지선다} 문항 N개를 만들어라.
   출력은 JSON 형식으로 고정: {question, options[], correctAnswer, explanation}"

결과 (OUTPUT)
  Quiz {
    question_type: 'ox' | 'multiple_choice' | 'short_answer'
    question     : 문제 텍스트
    options      : 선택지 배열 (객관식인 경우)
    correctAnswer: 정답
    explanation  : 해설
    rewardPoint  : 10
    status       : PENDING (검토 대기)
  }`,
        note: 'AI가 정해진 JSON 형식으로만 답하도록 강제해 파싱 오류를 차단합니다. 실패하면 자유 텍스트 생성 → 수동 입력 순으로 대체해요',
      },

      {
        title: '정답 확인은 어떻게 하나요?',
        list: [
          '정답 확인은 AI 없이 규칙 기반으로 빠르게 처리됩니다',
          { label: '객관식',   value: '정답 문자열이 정확히 일치하는지 확인합니다 (앞뒤 공백 제거 후 비교)' },
          { label: 'OX',       value: 'O 또는 X 한 글자만 비교해요' },
          { label: '단답형',   value: '정답 포함 여부를 확인하고 대소문자·공백은 무시합니다' },
          '정답이면 포인트 지급과 도장깨기 진행이 기록됩니다',
        ],
      },

      {
        title: '품질을 유지하고 부정행위를 막는 방법',
        list: [
          '같은 영화에서 같은 문제가 중복 생성되지 않도록 관리합니다',
          'AI에게 "스포일러 없이 만들라"고 명시하고, 관리자 검수 단계에서 한 번 더 걸러냅니다',
          'AI가 잘못된 사실을 생성하면 관리자가 거절하고 재생성 버튼으로 다시 만들 수 있어요',
          '정답률이 95% 이상이거나 10% 이하인 문제는 관리자 화면에서 별도 표시됩니다',
        ],
      },
    ],
  },

  /* ─────────── 21. AI Review Verification (도장깨기 실관람) ─────────── */
  aiReviewVerification: {
    icon: '🧐',
    tag: 'AI REVIEW VERIFY',
    title: 'AI 리뷰 검증 · 진짜 본 사람의 감상인지 판별',
    desc: '도장깨기 코스를 완주하면 뱃지·보너스 포인트·높은 추천 신뢰도를 얻을 수 있어서, 영화를 보지 않고 인터넷 줄거리를 복사해 올리는 부정행위 유인이 큽니다. 사람이 직접 건건이 검토하면 건수가 늘수록 처리 시간이 선형으로 증가해 운영 한계가 생기죠. 이를 해결하기 위해 문장 유사도(벡터 비교) → 핵심 키워드 교차 → AI 재판정 → 최종 분류의 4단계 자동 검증 파이프라인을 설계했습니다. 점수 0.7 이상은 자동 승인, 0.3 미만은 자동 거절, 그 사이만 관리자 검토 대기열로 보내 검토 부담을 최소화해요. 현재 설계와 백엔드 제출 API는 완료됐고, AI 에이전트 본체 구현이 후속 작업으로 남아 있습니다.',
    color: '#7c6cf0',
    stats: [
      { value: '4단계', label: '검증 파이프라인' },
      { value: '0.7 / 0.3', label: '자동승인 / 자동거절 기준' },
      { value: '⏳ 미구현', label: '현재 상태 (설계 완료)' },
    ],
    sections: [

      {
        title: '왜 자동 검증이 필요한가요?',
        text: '도장깨기 코스를 완주하면 뱃지·보너스 포인트·높은 신뢰도 점수를 얻을 수 있어요. 그래서 영화를 보지 않고 인터넷에서 줄거리를 복사해 붙여넣는 부정행위 유인이 큽니다. 사람이 직접 검토하면 건수가 늘어날수록 한계가 생기므로 4단계 자동 판별 파이프라인이 필요합니다.',
      },

      {
        title: '4단계로 진짜 감상을 판별해요',
        steps: [
          { title: '1단계 — 문장 유사도',  desc: 'AI가 리뷰 문장과 영화 줄거리를 비교해 얼마나 비슷한지 점수를 냅니다 (4096차원 벡터 비교)' },
          { title: '2단계 — 핵심 키워드',  desc: '리뷰에서 명사를 뽑아 영화의 핵심 단어(배우명·장소·소재 등)와 겹치는 비율을 측정해요' },
          { title: '3단계 — AI 재판정',    desc: '1·2단계 점수가 애매한 경우(0.5~0.8 구간)에만 Solar AI에게 "진짜 본 사람의 감상인가"를 한 번 더 물어봐요' },
          { title: '4단계 — 최종 분류',    desc: '점수 0.7 이상 → 자동 승인, 0.3 미만 → 자동 거절, 그 사이 → 관리자 검토 대기열로 분류됩니다' },
        ],
      },

      {
        title: 'AI가 주고받는 데이터 형식',
        code: `요청 (REQUEST)
{
  "verification_id": 123,
  "user_id": "u_abc",
  "course_id": 45,
  "movie_id": "tt1234567",
  "review_text": "...",   // 사용자가 쓴 리뷰
  "movie_plot": "..."     // 영화 줄거리
}

응답 (RESPONSE)
{
  "similarity_score": 0.82,
  "matched_keywords": ["봉준호", "계단", "반지하"],
  "confidence": 0.76,
  "review_status": "AUTO_VERIFIED",  // 자동 승인
  "rationale": "줄거리 핵심 모티프와 고유 공간 묘사가 일치"
}`,
      },

      {
        title: '현재 구현 상태',
        table: {
          headers: ['항목', '상태', '설명'],
          rows: [
            ['설계 문서',         '완료',        '도장깨기 리뷰 검증 에이전트 설계서 확정'],
            ['백엔드 제출 API',   '완료',        '리뷰 제출 시 검증 대기 상태로 DB 저장'],
            ['AI 에이전트 본체',  '미구현 (후속)', '자동 검증 로직 — 설계 완료, 구현 예정'],
            ['관리자 검토 UI',    '완료',        '자동 거절된 항목도 관리자가 수동으로 승인 가능'],
          ],
        },
      },

      {
        title: '다양한 부정행위 시나리오 대응',
        list: [
          { label: '줄거리 복사 리뷰',    value: '3단계 AI 재판정이 "복사/요약 vs 실제 감상"을 구분해 점수를 대폭 낮춥니다' },
          { label: '엉뚱한 영화 리뷰',    value: '1단계 문장 유사도가 낮아 자동 거절됩니다' },
          { label: '너무 짧은 리뷰 (20자 미만)', value: '자동으로 관리자 검토 대기열로 보냅니다' },
          { label: 'AI가 쓴 리뷰',        value: '현재 별도 탐지 없음 — AI 텍스트 탐지 모델 도입을 검토 중입니다' },
          { label: '영수증 인증 병행',     value: 'OCR 실관람 인증이 함께 있으면 추가 가중치로 이중 방어 효과가 생깁니다' },
        ],
      },

      {
        title: '다른 기능과 어떻게 연결되나요?',
        list: [
          '도장깨기(로드맵) — 검증을 통과한 리뷰만 완주 카운트로 인정됩니다',
          'OCR 실관람 인증 — 함께 제출하면 신뢰도가 더 높아져요',
          '추천 학습 — 검증 통과 리뷰만 AI 추천 학습의 강한 신호로 활용됩니다',
          '관리자 콘텐츠 탭 — "검토 필요" 분류된 항목은 관리자 큐에서 처리합니다',
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
    title: '클라우드 서버 구성과 보안 전략',
    desc: '서버 전체를 인터넷에 직접 노출하면 공격 면이 넓어져 하나만 뚫려도 전체 서비스가 위험해집니다. 이를 막기 위해 카카오 클라우드 VPC(가상 사설 네트워크)에 4대 서버를 두고, 외부 인터넷과 연결된 서버는 Nginx가 돌아가는 VM1 한 대뿐으로 제한했어요. 나머지 3대는 공개 IP가 없어 인터넷에서 직접 접근이 불가능하고, 관리자도 반드시 VM1을 거쳐(배스천 서버) 내부 서버에 SSH로 접속해야 합니다. SSH는 비밀번호 로그인을 완전히 차단하고 키 인증만 허용하며, Nginx에는 HTTPS 강제·보안 헤더·요청 속도 제한을 모두 적용해 두었습니다.',
    color: '#06d6a0',
    stats: [
      { value: '1 / 3', label: '공개 / 내부 서버 수' },
      { value: '10.20.0.0/24', label: '내부 네트워크 대역' },
      { value: '키 인증만', label: 'SSH 접속 정책' },
      { value: "Let's Encrypt", label: 'HTTPS 자동 갱신' },
    ],
    sections: [

      {
        title: '서버 4대가 어떻게 배치되어 있나요?',
        text: '외부 공격 면을 최소화하기 위해 VM1 한 대만 인터넷에 노출하고, 나머지는 내부 통신만 허용합니다.',
        table: {
          headers: ['서버', '외부 IP', '내부 IP', '역할'],
          rows: [
            ['VM1 (공개)',     '210.109.15.187', '10.20.0.13', 'Nginx — 유일한 외부 진입점 (HTTP/HTTPS)'],
            ['VM2 (서비스)',   '없음',           '10.20.0.11', '백엔드·에이전트·추천 서비스 (내부 통신만)'],
            ['VM3 (모니터링)', '없음',           '10.20.0.12', '성능 수집·대시보드·로그·알림 (내부 통신만)'],
            ['VM4 (GPU+DB)',   '없음',           '10.20.0.10', 'AI 모델·DB 5종 (내부 통신만)'],
          ],
        },
        note: 'VM2·3·4는 공개 IP가 없어 인터넷에서 직접 접근이 불가능합니다. 모든 요청은 반드시 Nginx를 거쳐야 해요',
      },

      {
        title: '어떤 포트를 열어두었나요?',
        table: {
          headers: ['서버', '외부에서 허용', '내부 통신'],
          rows: [
            ['VM1', 'HTTP 80, HTTPS 443, SSH 22 (관리자 IP만)', '내부 서버 전체 접근 가능'],
            ['VM2', 'SSH (VM1 경유만)', '백엔드 8080 · 에이전트 8000 · 추천 8001'],
            ['VM3', 'SSH (VM1 경유만)', '모니터링 도구 포트 (내부만)'],
            ['VM4', 'SSH (VM1 경유만)', 'DB 포트 · AI 모델 포트 18000/18001 (내부만)'],
          ],
        },
        note: 'AI 모델 포트(18000/18001)는 내부 통신을 위한 보안 그룹 허용이 아직 미등록 상태입니다 (2026-04-15 기준)',
      },

      {
        title: '관리자가 서버에 접속하는 방법',
        code: `# VM1만 외부에서 SSH 접근 가능 (배스천 서버)
ssh -A ubuntu@210.109.15.187                            # VM1 직접 접속
ssh -A -J ubuntu@210.109.15.187 ubuntu@10.20.0.10       # VM1 경유 → VM4
ssh -A -J ubuntu@210.109.15.187 ubuntu@10.20.0.11       # VM1 경유 → VM2
ssh -A -J ubuntu@210.109.15.187 ubuntu@10.20.0.12       # VM1 경유 → VM3

# SSH 보안 설정
PasswordAuthentication no   # 비밀번호 로그인 차단
PubkeyAuthentication yes    # 키 인증만 허용
PermitRootLogin no          # root 직접 로그인 금지
ClientAliveInterval 300     # 5분 유휴 시 세션 자동 종료`,
        note: 'ssh-agent forwarding(-A)으로 개인 키가 VM1 서버에 복사되지 않습니다. VM1이 뚫려도 내부 서버 접근 키는 노출되지 않아요',
      },

      {
        title: '서버 보안 강화 현황',
        table: {
          headers: ['항목', '현재', '예정'],
          rows: [
            ['방화벽',          '카카오 클라우드 보안 그룹', 'ufw 추가 적용 (이중 방어)'],
            ['로그인 실패 차단', '미적용',                   '일정 횟수 실패 시 IP 자동 차단 (fail2ban)'],
            ['자동 보안 업데이트', '적용 중',               '보안 패치만 자동 적용으로 한정'],
            ['시간 동기화',      '기본값',                  '모든 서버 동일 기준으로 맞추기 (로그 정합성)'],
            ['감사 로그',        '미적용',                  'sudo·SSH 로그인·파일 변경 이력 기록'],
          ],
        },
      },

      {
        title: '도커 컨테이너 보안 설정',
        list: [
          { label: '이미지 출처',    value: '공식 이미지만 사용하고, 버전을 고정해 의도치 않은 업데이트를 막습니다' },
          { label: 'root 권한 제한', value: '컨테이너가 root가 아닌 일반 사용자로 실행돼요. 탈출해도 서버 권한을 얻기 어렵습니다' },
          { label: '리소스 제한',    value: '메모리·CPU·프로세스 수에 상한을 걸어 한 컨테이너가 서버 전체를 독점하지 않도록 합니다' },
          { label: '비밀 정보',      value: '이미지 파일 안에 API 키·비밀번호를 넣지 않고, 실행 시 환경변수로 주입해요' },
          { label: '로그 용량',      value: '로그 파일 크기와 개수에 상한을 설정해 디스크가 가득 차지 않도록 합니다' },
        ],
      },

      {
        title: 'Nginx HTTPS 보안 설정',
        code: `# HTTPS 인증서 (Let's Encrypt, 자동 갱신)
ssl_protocols TLSv1.2 TLSv1.3;   # 취약한 이전 버전 차단
ssl_ciphers HIGH:!aNULL:!MD5;

# 보안 헤더 — 브라우저에 보안 정책 전달
add_header Strict-Transport-Security "max-age=31536000" always;  # HTTPS 강제
add_header X-Content-Type-Options "nosniff" always;              # MIME 스니핑 차단
add_header X-Frame-Options "DENY" always;                        # iframe 삽입 차단

# AI 스트리밍(SSE) 경로 — 버퍼 없이 바로 전달
proxy_buffering off;
proxy_read_timeout 300s;

# 요청 속도 제한 — 초당 20건, 최대 40건 허용
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
limit_req zone=api burst=40 nodelay;`,
        list: [
          'HTTPS 인증서는 Let\'s Encrypt로 발급하고 만료 전 자동 갱신됩니다',
          '관리자·모니터링 페이지는 기본 인증(1차) + JWT 관리자 역할(2차) 이중 확인',
        ],
      },

      {
        title: '비밀 정보(API 키, 비밀번호)는 어떻게 관리하나요?',
        list: [
          { label: '보관 위치',  value: 'GitHub Secrets(자동화용) + 각 서버의 .env.prod 파일 (Git에는 올리지 않아요)' },
          { label: '구조 공유',  value: '.env.prod.example 파일로 어떤 키가 필요한지만 공개하고, 실제 값은 비공개입니다' },
          { label: '주입 방식',  value: '도커 실행 시 env_file로 주입해요. 이미지 파일 안에 비밀 정보가 포함되지 않습니다' },
          { label: '교체 예정',  value: '운영 서버의 JWT 서명 키, OAuth 클라이언트 비밀키를 실제 값으로 교체하는 작업이 남아있어요' },
        ],
        note: '2026-04-15 환경변수 전면 정비 — 누락되어 있던 결제·인증·CORS 관련 키들이 모두 주입 완료됐습니다',
      },

      {
        title: '데이터 보호 현황',
        list: [
          'MySQL 변경 로그(binlog)가 켜져 있어, 장애 시 특정 시점으로 복원할 수 있어요',
          'Redis의 좋아요 데이터는 1초마다 디스크에 백업돼 서버 재시작에도 소실되지 않습니다',
          '벡터·그래프·검색 DB는 매일 스냅샷을 찍고, 향후 외부 스토리지로 이관 예정입니다',
          '갱신 토큰(Refresh Token)은 DB에 저장되어 있어 도용 탐지 시 즉시 전체 무효화가 가능해요',
        ],
      },

      {
        title: '앞으로 강화할 보안 항목',
        table: {
          headers: ['영역', '현재', '계획'],
          rows: [
            ['웹 방화벽(WAF)',    'Nginx 속도 제한',     'Cloudflare WAF 또는 OWASP 규칙 적용'],
            ['DDoS 방어',        '클라우드 기본 제공',   'Cloudflare 또는 고급 보호 서비스 검토'],
            ['이상 행동 탐지',   '미적용',              '컨테이너 런타임 이상 감지 도구 도입'],
            ['관리자 접속 2FA',  'SSH 키 인증',         'Tailscale 또는 WireGuard + 2단계 인증'],
            ['비밀 관리 도구',   '.env.prod 파일',      'Vault 또는 클라우드 KMS 마이그레이션'],
            ['자동 백업',        '수동 스냅샷',         '일일 자동 스냅샷 + 다른 지역 복제'],
            ['취약점 자동 검사', '수동',                'CI에 이미지·의존성 취약점 스캐너 통합'],
          ],
        },
      },
    ],
  },

  /* ─────────── 23. End-to-End User Journey ─────────── */
  e2eJourney: {
    icon: '🛤️',
    tag: 'USER JOURNEY',
    title: '전체 여정 · 가입부터 리워드까지 한 사이클',
    desc: '서비스가 복잡해질수록 "이 기능이 실제로 어떻게 연결되어 있는지"를 한 화면에서 파악하기 어려워집니다. 이 모달은 가입부터 리뷰 작성·포인트 지급까지 사용자가 경험하는 전체 여정을 11단계로 정리해, 각 단계에서 백엔드·AI 에이전트·추천 서비스·5개 DB 중 어느 것이 동작하는지 보여줍니다. "리뷰가 0개인 신규 사용자도 첫 대화부터 맞춤 추천을 받고, 앱을 쓸수록 추천이 더 정확해지는" 선순환 구조가 어디서 시작되는지 확인할 수 있어요. 온보딩 → AI 대화 → 관람 인증 → 리뷰 → 포인트 → 추천 개선으로 이어지는 톱니바퀴가 전체 서비스의 핵심입니다.',
    color: '#7c6cf0',
    stats: [
      { value: '11', label: '단계' },
      { value: '4', label: '참여 서비스' },
      { value: '5', label: '참여 DB' },
    ],
    sections: [

      {
        title: '가입부터 리워드까지 11단계',
        steps: [
          { title: '① 가입 / 로그인',    desc: '이메일 로그인 또는 카카오·구글·네이버 소셜 로그인으로 시작합니다. 신분증(JWT)이 발급돼요' },
          { title: '② 온보딩',           desc: '좋아하는 장르 선택 → 영화 월드컵 → 영화 5편 평가 → OTT 선택. 취향을 처음으로 파악하는 단계예요' },
          { title: '③ 첫 AI 대화',       desc: '"오늘 우울해" 한 마디를 입력하면 AI가 감정과 의도를 읽기 시작합니다' },
          { title: '④ 영화 검색',        desc: '3개 데이터베이스를 동시에 뒤져 후보를 모은 뒤 AI가 점수를 매기고, 비슷한 영화가 몰리지 않게 분산합니다' },
          { title: '⑤ 추천 결과 표시',   desc: '영화 카드가 하나씩 화면에 나타납니다. 조건이 부족하면 선택지 카드를 먼저 보여줘요' },
          { title: '⑥ 구독 또는 이용권', desc: '무료 횟수를 다 쓰면 구독이나 AI 이용권을 결제할 수 있어요. Toss Payments로 실제 카드 결제가 처리됩니다' },
          { title: '⑦ AI 이용 횟수 소비', desc: '무료 → 구독 보너스 → 구매 이용권 순으로 소진됩니다. 실제 영화 카드를 받는 순간에만 차감돼요' },
          { title: '⑧ 관람 & 인증',      desc: '영화관에서 봤다면 영수증 사진을 올려 실관람 인증을 받을 수 있어요' },
          { title: '⑨ 리뷰 작성',        desc: '별점과 감상을 남기면 AI가 비속어·혐오 표현을 검사한 뒤 등록합니다. 도장깨기 코스라면 리뷰 검증도 함께 진행해요' },
          { title: '⑩ 포인트 지급',      desc: '등급 배율이 적용된 포인트가 자동으로 쌓이고, 업적 조건이 충족되면 업적도 기록됩니다' },
          { title: '⑪ 다음 추천 개선',   desc: '작성한 리뷰가 추천 학습 데이터로 편입됩니다. 쌓일수록 추천이 더 정확해져요' },
        ],
      },

      {
        title: '단계별로 어떤 서비스가 동작하나요?',
        table: {
          headers: ['단계', '백엔드', 'AI 에이전트', '추천 서비스', 'DB'],
          rows: [
            ['② 온보딩',       '인증·월드컵',    '—',                     '—',               'MySQL · Redis'],
            ['③④⑤ 추천',      '—',             'Chat Agent · RAG · 리랭커', '좋아요 · 공동시청', 'DB 5종 전부'],
            ['⑥ 결제',         '결제·포인트',    '—',                     '—',               'MySQL'],
            ['⑧ OCR 인증',     'OCR 이벤트',    '자동 추출 (미구현)',      '—',               'MySQL · 파일'],
            ['⑨ 리뷰',         '커뮤니티',       '비속어 검사 · 리뷰 검증', '—',               'MySQL · Qdrant'],
            ['⑩ 포인트',       '리워드·포인트',  '—',                     '—',               'MySQL 포인트 원장'],
          ],
        },
      },

      {
        title: '한 줄 요약',
        text: '"리뷰가 0개인 신규 사용자도 첫 대화부터 맞춤 추천을 받고, 앱을 쓸수록 추천이 점점 더 정확해지는 선순환 구조입니다." 온보딩 → AI 대화 → 리뷰 → 포인트 → 더 정확한 추천으로 이어지는 톱니바퀴가 맞물려 있어요.',
      },
    ],
  },

  /* ─────────── 24. Data Pipeline ─────────── */
  dataPipeline: {
    icon: '🏭',
    tag: 'DATA PIPELINE',
    title: '데이터 파이프라인 · 91만 편을 5개 DB에 넣는 과정',
    desc: 'AI 추천과 검색이 제대로 동작하려면 영화 데이터가 여러 DB에 일관된 형식으로 미리 채워져 있어야 합니다. 이를 위해 TMDB·KOBIS·KMDb·Kaggle 4개 소스에서 데이터를 수집해 정제하고, Solar AI가 각 영화에 분위기 태그(예: "잔잔함", "긴장감")를 붙인 뒤, AI가 4096차원 벡터로 변환해 의미 기반 검색이 가능하도록 만듭니다. 최종적으로 MySQL·Qdrant·Elasticsearch·Neo4j·Redis 5개 DB에 동시에 저장하며, 현재 91만 편이 적재 완료되어 검색과 추천에 사용되고 있습니다. 파이프라인은 중단 후 이어서 재개할 수 있고, 새 영화는 매일 변경분만 감지해 자동으로 반영해요.',
    color: '#f97316',
    stats: [
      { value: '91만 편', label: '적재 완료' },
      { value: '117만 편', label: 'TMDB 원본' },
      { value: '5개', label: '동기화 DB' },
      { value: '4개', label: '데이터 소스' },
    ],
    sections: [
      {
        title: '어디서 데이터를 가져오나요?',
        table: {
          headers: ['소스', '규모', '담긴 정보', '활용 목적'],
          rows: [
            ['TMDB',   '117만 편 · 25.6GB', '제목·줄거리·장르·출연진 등 39가지 항목', '메인 메타데이터·포스터·다국어 번역'],
            ['KOBIS',  '11.7만 편',          '영화진흥위원회 공식 정보',               '국내 개봉 이력·흥행 매출'],
            ['KMDb',   '4.3만 편',           '한국영화데이터베이스 고유 정보',         '한국 영화 특화 메타데이터'],
            ['Kaggle', '2,600만 건 별점',     '27만 명의 시청·평가 기록',              '신규 사용자 추천 보조 데이터 (읽기 전용)'],
          ],
        },
      },
      {
        title: '데이터가 DB에 들어가기까지 6단계',
        steps: [
          { title: '① 수집',      desc: '각 소스 API에서 데이터를 가져옵니다. 요청 속도를 지키며, 마지막으로 가져온 위치(커서)를 기억해 중단 후 재개할 수 있어요' },
          { title: '② 정제',      desc: '장르·분위기·메타데이터를 통일된 형식으로 변환하고, 중복을 제거하며, 언어별 필드를 분리합니다' },
          { title: '③ 무드 태그', desc: 'Solar AI가 줄거리를 읽고 24가지 분위기 태그(예: "잔잔함", "긴장감")를 자동으로 붙여줍니다' },
          { title: '④ AI 변환',   desc: '제목·줄거리·장르·감독·무드 태그를 합쳐 AI가 4096차원 숫자 벡터로 변환해요. 의미 기반 검색의 핵심입니다' },
          { title: '⑤ 저장',      desc: '5개 DB에 동시에 저장합니다. 같은 영화가 중복 저장되지 않도록 영화 ID 기준으로 업서트(있으면 갱신, 없으면 삽입)해요' },
          { title: '⑥ 검증',      desc: '저장된 건수, 구조 변화, 샘플 검색 결과가 예상과 맞는지 확인합니다' },
        ],
      },
      {
        title: '파이프라인 실행 명령어',
        code: `# 전체 새로 적재 (기존 데이터 삭제 후 재시작)
PYTHONPATH=src uv run python scripts/run_full_reload.py --clear-db

# 중단된 지점부터 이어서 재개
PYTHONPATH=src uv run python scripts/run_full_reload.py --resume

# 단위 테스트 (332개 통과)
PYTHONPATH=src uv run --with pytest --with pytest-asyncio --with httpx \\
  -- python -m pytest tests/ -v`,
      },
      {
        title: '한국어·영어 제목으로도 검색할 수 있어요 (다국어 지원)',
        list: [
          { label: '코드 완료 (ML-1~3)', value: '영문 제목·영문 줄거리·다른 언어 이름도 검색 필드에 색인했어요. AI 벡터는 단일 4096차원으로 다국어를 처리합니다' },
          { label: '운영 적재 예정 (ML-4)', value: '운영 서버에서 전체 데이터를 다시 적재해야 실제로 적용돼요. 서비스 중단 없이 교체하는 방식으로 진행 예정입니다' },
        ],
        note: '코드는 완료됐고, 운영 환경 재적재(ML-4)가 남은 작업입니다',
      },
      {
        title: '새 영화 데이터는 매일 자동으로 반영돼요',
        list: [
          'TMDB에서 업데이트된 영화를 매일 감지해 변경분만 가져옵니다',
          '5개 DB에 동일하게 반영되며, 같은 영화를 중복 처리하지 않아요',
          '데이터베이스 구조(스키마) 변경은 백엔드 서버만 담당합니다. 에이전트·추천 서비스는 읽기·쓰기만 해요',
          'Kaggle 시청 데이터는 초기 세팅용이라 자주 변경되지 않습니다',
        ],
      },
    ],
  },

  /* ─────────── 25. Admin Console ─────────── */
  adminConsole: {
    icon: '👑',
    tag: 'ADMIN CONSOLE',
    title: '관리자 콘솔 · 코드 배포 없이 서비스를 운영해요',
    desc: '운영 중 발생하는 신고 처리·포인트 조정·AI 모델 상태 확인 같은 작업을 개발자에게 매번 요청하거나 코드를 다시 배포하면 대응 속도가 느려집니다. 이를 해결하기 위해 10개 탭 96개 기능을 하나의 관리자 페이지에 모아, 비개발자 운영자도 서비스를 직접 제어할 수 있게 했어요. 사용자 계정 제재·포인트 수동 조정·AI 퀴즈 생성·콘텐츠 신고 처리·서버 DB 상태 확인까지 모두 이 화면 안에서 처리됩니다. 관리자가 한 모든 행동은 감사 로그 테이블에 기록되어 포인트 원장과 교차 검증할 수 있어요.',
    color: '#ef476f',
    stats: [
      { value: '10', label: '메인 탭' },
      { value: '96', label: '기능(API)' },
      { value: '11', label: '운영 도구 서브탭' },
      { value: '12', label: '통계 분석 탭' },
    ],
    sections: [
      {
        title: '10개 탭이 각각 무엇을 하나요?',
        table: {
          headers: ['탭', '담당', '주요 기능'],
          rows: [
            ['대시보드',    '김민규', '서비스 전체 현황 한눈에 보기'],
            ['사용자 관리', '김민규', '계정 조회·제재·포인트 수동 조정·이용권 지급'],
            ['콘텐츠 관리', '이민수', '신고 처리·혐오 표현 블라인드·게시글·리뷰 관리'],
            ['결제/포인트', '윤형주', '결제 내역·환불·포인트 정책·구독 관리'],
            ['AI 운영',     '윤형주', 'AI 리뷰 생성·퀴즈 자동 생성·검증 큐 처리'],
            ['고객센터',    '윤형주', 'FAQ·도움말·문의 티켓·챗봇 응답 관리'],
            ['시스템',      '윤형주', 'DB 상태·AI 모델 상태·서비스 설정·로그 조회'],
            ['데이터',      '윤형주', '영화·장르·무드 데이터 직접 입력·수정·삭제'],
            ['설정',        '윤형주', '이용약관·배너·감사 로그·관리자 계정 관리'],
            ['통계/분석',   '윤형주', '12개 서브탭으로 이용 현황·매출·이탈 위험 분석'],
          ],
        },
      },
      {
        title: '운영 도구에서 직접 할 수 있는 것들',
        list: [
          '업적·로드맵 코스·퀴즈·영화·장르 데이터를 직접 추가하고 수정할 수 있어요',
          'OCR 실관람 인증 이벤트·인기 검색어·월드컵 후보·포인트 상품·리워드 정책·공지사항 관리',
          '영화 선택이 필요한 모든 화면에서 영화 제목으로 검색해 선택할 수 있어요 (2026-04-14 공통화)',
          '포인트 지급 기준과 내 누적 현황을 실시간으로 가시화한 포인트 페이지',
        ],
      },
      {
        title: '관리자에도 권한 등급이 있어요',
        list: [
          '최고 관리자 · 일반 관리자 · 중재자',
          '재무 관리자 · 고객지원 관리자 · 데이터 관리자 · AI 운영 관리자 · 통계 관리자',
          '현재는 관리자 역할로 단일 체크하며, 세분화된 권한 강제는 별도 작업으로 진행 예정이에요',
          '관리자 페이지 접근은 기본 인증(1차)과 JWT 관리자 역할(2차)로 이중 검사합니다',
        ],
      },
      {
        title: '12개 통계 탭으로 무엇을 볼 수 있나요?',
        text: '전체 현황 · 트렌드 · AI 추천 성과 · 검색 패턴 · 사용자 행동 · 재방문율 · 매출 · 구독 · 포인트 경제 · AI 서비스 · 커뮤니티 · 참여도 · 콘텐츠 성과 · 유입 경로 · 이탈 위험 사용자 분석을 DB 조회와 Redis 캐시를 혼합해 빠르게 제공합니다.',
      },
      {
        title: '관리자가 한 모든 행동이 기록돼요',
        list: [
          '누가, 언제, 어떤 대상에, 무슨 행동을, 왜 했는지 감사 로그 테이블에 저장됩니다',
          '포인트 수동 조정, 이용권 직접 지급, 사용자 제재가 모두 기록돼요',
          '포인트 원장(수정·삭제 불가)과 교차 검증해 오류나 이상 행동을 추적할 수 있습니다',
        ],
      },
    ],
  },

  /* ─────────── 26. Monitoring & Observability ─────────── */
  observability: {
    icon: '🔭',
    tag: 'OBSERVABILITY',
    title: 'Monitoring & Observability · Prom + Graf + ELK + LangSmith',
    desc: '서버가 느려지거나 AI 추천이 실패해도 로그를 직접 뒤지기 전까지 원인을 알기 어렵다면 장애 대응이 느려집니다. 이를 해결하기 위해 숫자 지표(Prometheus) · 시각화 대시보드(Grafana) · 전체 로그 수집(ELK 스택) · 임계치 초과 즉시 알림(Alertmanager) · LLM 체인 입출력 추적(LangSmith) 5가지 도구를 함께 운영합니다. Kibana에는 36개 저장 화면(대시보드 4개 포함)이 자동 프로비저닝되어 서버를 새로 띄워도 대시보드가 바로 복원돼요. 결제 보상 실패·vLLM 연속 응답 없음·DB 커넥션 풀 90% 초과 등 11개 알림 룰이 설정되어 있고, 관리자 시스템 탭에서 각 도구 URL과 접속 계정을 한 화면에서 확인할 수 있습니다.',
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
