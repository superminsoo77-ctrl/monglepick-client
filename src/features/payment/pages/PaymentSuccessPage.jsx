/**
 * 결제 성공 콜백 페이지.
 *
 * Toss Payments SDK v2에서 결제 완료 후 successUrl로 리다이렉트될 때 표시된다.
 * URL 쿼리 파라미터(paymentKey, orderId, amount)를 추출하여
 * Backend 결제 승인 API를 호출하고, 결과를 사용자에게 표시한다.
 *
 * 흐름:
 *   1. Toss 결제창에서 결제 완료 → successUrl?paymentKey=...&orderId=...&amount=... 리다이렉트
 *   2. 이 페이지에서 쿼리 파라미터 추출
 *   3. Backend POST /api/v1/payment/confirm 호출 (paymentKey + orderId + amount)
 *   4. 승인 성공 → 포인트 지급 결과 표시
 *   5. 승인 실패 → 에러 메시지 표시
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPayment } from '../api/paymentApi';
import Loading from '../../../shared/components/Loading/Loading';
import './PaymentCallbackPage.css';

export default function PaymentSuccessPage() {
  /* URL 쿼리 파라미터에서 Toss 결제 결과 추출 */
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  /* 승인 결과 상태 */
  const [result, setResult] = useState(null);
  /* 에러 메시지 */
  const [error, setError] = useState(null);
  /* 로딩 상태 */
  const [isLoading, setIsLoading] = useState(true);

  /* 중복 호출 방지용 ref (React 18 StrictMode에서 useEffect 2회 실행 대응) */
  const confirmedRef = useRef(false);

  useEffect(() => {
    /* 이미 승인 요청을 보낸 경우 스킵 */
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    /* 필수 파라미터 누락 시 에러 처리 */
    if (!paymentKey || !orderId || !amount) {
      setError('결제 정보가 올바르지 않습니다. 필수 파라미터가 누락되었습니다.');
      setIsLoading(false);
      return;
    }

    /* Backend 결제 승인 API 호출 */
    const confirm = async () => {
      try {
        const data = await confirmPayment({
          paymentKey,
          orderId,
          amount: Number(amount),
        });
        setResult(data);
      } catch (err) {
        setError(err.message || '결제 승인에 실패했습니다. 고객센터에 문의해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    confirm();
  }, [searchParams]);

  /* 로딩 중 */
  if (isLoading) {
    return (
      <div className="payment-callback">
        <Loading message="결제를 승인하고 있습니다..." fullPage />
      </div>
    );
  }

  /* 에러 발생 */
  if (error) {
    return (
      <div className="payment-callback">
        <div className="payment-callback__card">
          <div className="payment-callback__icon payment-callback__icon--fail">!</div>
          <h1 className="payment-callback__title">결제 승인 실패</h1>
          <p className="payment-callback__message">{error}</p>
          <div className="payment-callback__actions">
            <button
              className="payment-callback__btn payment-callback__btn--secondary"
              onClick={() => navigate('/payment')}
            >
              결제 페이지로 돌아가기
            </button>
            <button
              className="payment-callback__btn payment-callback__btn--primary"
              onClick={() => navigate('/support')}
            >
              고객센터 문의
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* 승인 성공 */
  return (
    <div className="payment-callback">
      <div className="payment-callback__card">
        <div className="payment-callback__icon payment-callback__icon--success">&#10003;</div>
        <h1 className="payment-callback__title">결제가 완료되었습니다</h1>

        {result && (
          <div className="payment-callback__details">
            {result.pointsGranted > 0 && (
              <p className="payment-callback__detail">
                <span className="payment-callback__detail-label">지급 포인트</span>
                <span className="payment-callback__detail-value payment-callback__detail-value--highlight">
                  +{result.pointsGranted.toLocaleString()}P
                </span>
              </p>
            )}
            {result.newBalance != null && (
              <p className="payment-callback__detail">
                <span className="payment-callback__detail-label">현재 잔액</span>
                <span className="payment-callback__detail-value">
                  {result.newBalance.toLocaleString()}P
                </span>
              </p>
            )}
          </div>
        )}

        <div className="payment-callback__actions">
          <button
            className="payment-callback__btn payment-callback__btn--secondary"
            onClick={() => navigate('/payment')}
          >
            결제 내역 보기
          </button>
          <button
            className="payment-callback__btn payment-callback__btn--primary"
            onClick={() => navigate('/chat')}
          >
            AI 추천 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
