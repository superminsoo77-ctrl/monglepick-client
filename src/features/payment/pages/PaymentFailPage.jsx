/**
 * 결제 실패 콜백 페이지.
 *
 * Toss Payments SDK v2에서 결제 실패 시 failUrl로 리다이렉트될 때 표시된다.
 * URL 쿼리 파라미터(code, message, orderId)를 추출하여 에러 정보를 사용자에게 표시한다.
 *
 * 흐름:
 *   1. Toss 결제창에서 결제 실패/취소 → failUrl?code=...&message=...&orderId=... 리다이렉트
 *   2. 이 페이지에서 에러 정보 표시
 *   3. 사용자가 결제 페이지로 돌아가거나 고객센터에 문의
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import './PaymentCallbackPage.css';

/** Toss 에러 코드별 사용자 친화적 메시지 매핑 */
const ERROR_MESSAGES = {
  PAY_PROCESS_CANCELED: '결제가 취소되었습니다.',
  PAY_PROCESS_ABORTED: '결제 진행 중 문제가 발생했습니다.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다. 카드사에 문의해주세요.',
  BELOW_MINIMUM_AMOUNT: '결제 금액이 최소 금액보다 적습니다.',
  INVALID_CARD_EXPIRATION: '카드 유효기간이 만료되었습니다.',
  INVALID_STOPPED_CARD: '정지된 카드입니다.',
  EXCEED_MAX_DAILY_PAYMENT_COUNT: '일일 결제 횟수를 초과했습니다.',
  EXCEED_MAX_PAYMENT_AMOUNT: '결제 한도를 초과했습니다.',
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: '할부가 지원되지 않는 카드입니다.',
  INVALID_CARD_INSTALLMENT_PLAN: '할부 개월 수가 올바르지 않습니다.',
  NOT_AVAILABLE_PAYMENT: '현재 결제가 불가능합니다. 잠시 후 다시 시도해주세요.',
};

export default function PaymentFailPage() {
  /* URL 쿼리 파라미터에서 Toss 에러 정보 추출 */
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code = searchParams.get('code') || 'UNKNOWN_ERROR';
  const message = searchParams.get('message') || '알 수 없는 오류가 발생했습니다.';
  const orderId = searchParams.get('orderId');

  /* 에러 코드에 매핑된 사용자 친화적 메시지가 있으면 사용, 없으면 Toss 원본 메시지 사용 */
  const displayMessage = ERROR_MESSAGES[code] || message;

  return (
    <div className="payment-callback">
      <div className="payment-callback__card">
        {/* 실패 아이콘 */}
        <div className="payment-callback__icon payment-callback__icon--fail">!</div>

        {/* 제목 */}
        <h1 className="payment-callback__title">결제에 실패했습니다</h1>

        {/* 에러 메시지 */}
        <p className="payment-callback__message">{displayMessage}</p>

        {/* 디버그 정보 (에러 코드 + 주문번호) */}
        <div className="payment-callback__debug">
          <p className="payment-callback__debug-item">
            에러 코드: <span>{code}</span>
          </p>
          {orderId && (
            <p className="payment-callback__debug-item">
              주문번호: <span>{orderId.slice(0, 8)}...</span>
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="payment-callback__actions">
          <button
            className="payment-callback__btn payment-callback__btn--primary"
            onClick={() => navigate('/payment')}
          >
            다시 시도하기
          </button>
          <button
            className="payment-callback__btn payment-callback__btn--secondary"
            onClick={() => navigate('/support')}
          >
            고객센터 문의
          </button>
        </div>
      </div>
    </div>
  );
}
