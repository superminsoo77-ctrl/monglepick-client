/**
 * 포인트 잔액 요약 카드 컴포넌트.
 *
 * 보유 포인트, 등급 배지, 총 획득 포인트, 충전 버튼을 표시한다.
 * 등급 표시명은 팝콘 테마 한국어명(알갱이/강냉이/팝콘/카라멜팝콘/몽글팝콘/몽아일체).
 * 단일 진실 원본: `shared/constants/grade.js`
 *
 * @param {Object} props
 * @param {Object|null} props.balanceInfo - 잔액 정보 {balance, grade, totalEarned}
 *   - grade 필드는 백엔드가 내려주는 대문자 영문 코드(NORMAL/BRONZE/.../DIAMOND)
 * @param {boolean} props.isLoading - 로딩 상태
 * @param {Function} props.onNavigatePayment - 충전 버튼 클릭 핸들러
 * @param {Function} props.formatNumber - 숫자 포맷팅 함수
 */

import Loading from '../../../shared/components/Loading/Loading';
import { DEFAULT_GRADE_CODE, getGradeLabel } from '../../../shared/constants/grade';
import * as S from './BalanceCard.styled';

export default function BalanceCard({
  balanceInfo,
  isLoading,
  onNavigatePayment,
  formatNumber,
}) {
  /* 등급 코드 — 없으면 NORMAL(알갱이) 기본값 (가입 직후 기본 등급) */
  const gradeKey = balanceInfo?.grade || DEFAULT_GRADE_CODE;

  return (
    /* SummarySection은 point-page__section + point-page__summary 역할을 겸함 */
    <S.SummarySection className="point-page__section">
      {isLoading ? (
        <Loading message="포인트 정보 로딩 중..." />
      ) : (
        <S.SummaryCard>
          {/* 좌측: 잔액 정보 */}
          <S.SummaryLeft>
            <S.SummaryLabel>보유 포인트</S.SummaryLabel>
            <S.SummaryBalance>
              {formatNumber(balanceInfo?.balance)}
              <S.SummaryUnit>P</S.SummaryUnit>
            </S.SummaryBalance>
            <S.SummaryEarned>
              총 획득: {formatNumber(balanceInfo?.totalEarned)}P
            </S.SummaryEarned>
          </S.SummaryLeft>

          {/* 우측: 등급 배지 + 충전 버튼 */}
          <S.SummaryRight>
            {/* $grade prop으로 등급별 색상 적용 (인라인 스타일 제거) */}
            <S.GradeBadge $grade={gradeKey}>
              {getGradeLabel(gradeKey)}
            </S.GradeBadge>
            <S.ChargeButton onClick={onNavigatePayment}>
              충전하기
            </S.ChargeButton>
          </S.SummaryRight>
        </S.SummaryCard>
      )}
    </S.SummarySection>
  );
}
