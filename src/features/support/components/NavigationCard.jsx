/**
 * 화면 이동 CTA 카드 (v4 신규).
 *
 * Agent 가 `navigation` SSE 이벤트를 발행했을 때 봇 메시지 하단에 렌더된다.
 * redirect 의도("영화 추천해 줘") 또는 narrator 가 화면 이동을 안내할 때 사용한다.
 *
 * 단건 모드 (candidates 빈 배열 또는 미지정):
 *  - target_path + label 단일 버튼 CTA
 *
 * 다건 모드 (candidates 배열에 항목이 있을 때):
 *  - "여러 옵션 중 선택" 형태로 후보 버튼 목록 노출
 *
 * 경로별 아이콘 매핑:
 *  - /chat              → 영화/채팅 아이콘
 *  - /account/point     → 포인트 아이콘
 *  - /account/payment   → 카드 아이콘
 *  - /support/tickets   → 메일 아이콘
 *  - /account/profile   → 사람 아이콘
 *  - /home              → 집 아이콘
 *  - /search            → 돋보기 아이콘
 *  - 그 외              → 화살표 아이콘
 *
 * @param {Object} props
 * @param {string} [props.target_path] - 이동 대상 경로
 * @param {string} [props.label] - 버튼 레이블
 * @param {Array<{target_path: string, label: string}>} [props.candidates] - 다건 후보 배열
 */

import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

/* ── 경로별 아이콘 매핑 헬퍼 ── */

/**
 * target_path 에 따라 적절한 이모지 아이콘을 반환한다.
 *
 * @param {string} path - 이동 경로
 * @returns {string} 이모지 문자열
 */
function pathToIcon(path = '') {
  if (path.startsWith('/chat')) return '🎬';
  if (path.includes('point-shop') || path.includes('/point')) return '💎';
  if (path.includes('/payment')) return '💳';
  if (path.includes('/tickets')) return '✉️';
  if (path.includes('/support')) return '🎧';
  if (path.includes('/profile')) return '👤';
  if (path.startsWith('/home')) return '🏠';
  if (path.startsWith('/search')) return '🔍';
  if (path.startsWith('/movie')) return '🎥';
  if (path.includes('/account')) return '⚙️';
  if (path.startsWith('/community')) return '💬';
  return '→';
}

/* ── 메인 컴포넌트 ── */

export default function NavigationCard({ target_path, label, candidates }) {
  const navigate = useNavigate();

  /* 단건·다건 모드 판별 */
  const isMulti = Array.isArray(candidates) && candidates.length > 0;

  /* target_path 도 candidates 도 없으면 렌더 스킵 */
  if (!isMulti && !target_path) return null;

  /**
   * 경로 이동 핸들러.
   * 외부 URL(http) 은 새 탭으로, 내부 경로는 SPA navigate 로 처리한다.
   *
   * @param {string} path - 이동할 경로
   */
  function handleNavigate(path) {
    if (!path) return;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      window.open(path, '_blank', 'noopener noreferrer');
    } else {
      navigate(path);
    }
  }

  return (
    <Card>
      {/* 카드 헤더 */}
      <CardHeader>
        <HeaderIcon aria-hidden="true">🗺️</HeaderIcon>
        <HeaderText>화면 이동</HeaderText>
      </CardHeader>

      {/* 단건 모드 */}
      {!isMulti && target_path && (
        <SingleAction>
          <NavButton
            type="button"
            onClick={() => handleNavigate(target_path)}
            title={target_path}
          >
            <BtnIcon aria-hidden="true">{pathToIcon(target_path)}</BtnIcon>
            <BtnLabel>{label || '화면으로 이동'}</BtnLabel>
            <ArrowIcon aria-hidden="true">›</ArrowIcon>
          </NavButton>
        </SingleAction>
      )}

      {/* 다건 모드 */}
      {isMulti && (
        <>
          <MultiHint>여러 옵션 중 선택하세요</MultiHint>
          <CandidateList>
            {candidates.map((c, idx) => (
              <CandidateRow key={c.target_path || idx}>
                <CandidateIcon aria-hidden="true">
                  {pathToIcon(c.target_path)}
                </CandidateIcon>
                <CandidateLabel>{c.label}</CandidateLabel>
                <CompactNavButton
                  type="button"
                  onClick={() => handleNavigate(c.target_path)}
                  disabled={!c.target_path}
                  title={c.target_path || '경로 없음'}
                >
                  이동 ›
                </CompactNavButton>
              </CandidateRow>
            ))}
          </CandidateList>
        </>
      )}
    </Card>
  );
}

/* ════════════════════════════════
   styled-components
   ════════════════════════════════ */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Card = styled.div`
  margin-top: 8px;
  border: 1px solid rgba(181, 165, 255, 0.3);
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bgSecondary};
  animation: ${fadeIn} 0.25s ease;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(181, 165, 255, 0.08);
  border-bottom: 1px solid rgba(181, 165, 255, 0.2);
`;

const HeaderIcon = styled.span`
  font-size: 13px;
  flex-shrink: 0;
`;

const HeaderText = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: #B5A5FF;
`;

/* 단건 모드 레이아웃 */
const SingleAction = styled.div`
  padding: 10px 12px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid rgba(181, 165, 255, 0.35);
  background: rgba(181, 165, 255, 0.08);
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: #B5A5FF;
    background: rgba(181, 165, 255, 0.15);
    box-shadow: 0 0 10px rgba(181, 165, 255, 0.15);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const BtnIcon = styled.span`
  font-size: 16px;
  flex-shrink: 0;
`;

const BtnLabel = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ArrowIcon = styled.span`
  font-size: 18px;
  color: #B5A5FF;
  flex-shrink: 0;
  line-height: 1;
`;

/* 다건 모드 레이아웃 */
const MultiHint = styled.p`
  margin: 0;
  padding: 6px 12px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

const CandidateList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const CandidateRow = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(181, 165, 255, 0.05);
  }
`;

const CandidateIcon = styled.span`
  font-size: 14px;
  flex-shrink: 0;
`;

const CandidateLabel = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textPrimary};
  min-width: 0;
  word-break: break-word;
`;

const CompactNavButton = styled.button`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid rgba(181, 165, 255, 0.4);
  background: rgba(181, 165, 255, 0.1);
  color: #B5A5FF;
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: rgba(181, 165, 255, 0.2);
    border-color: #B5A5FF;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
