/**
 * OCR 실관람 인증 제출 모달 (2026-04-14 신규).
 *
 * <p>영화 상세 페이지 상단 배너의 "인증하러 가기" 버튼을 눌렀을 때 열리는 모달.
 * 영수증 이미지를 업로드하고 관람일/영화명(선택)을 기입한 뒤 제출한다.</p>
 *
 * <h3>제출 흐름</h3>
 * <ol>
 *   <li>파일 선택 → <code>uploadImages([file])</code> 로 업로드 → URL 획득</li>
 *   <li><code>submitOcrVerification(eventId, {imageUrl, watchDate, movieName})</code> 호출</li>
 *   <li>성공 시 부모의 <code>onSuccess()</code> 호출 + 닫기</li>
 * </ol>
 *
 * <h3>UX 규칙</h3>
 * <ul>
 *   <li><code>createPortal(document.body)</code> 로 부모 overflow/transform 간섭 차단
 *       (PostWatchFeedback 과 동일 패턴)</li>
 *   <li>업로드/제출 진행 중 버튼 비활성화 + 스피너</li>
 *   <li>ESC/오버레이 클릭으로 닫기 (단, 제출 중에는 잠금)</li>
 *   <li>접근성 — role="dialog" + aria-modal</li>
 * </ul>
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { submitOcrVerification, uploadImages, analyzeOcrImage } from '../../community/api/communityApi';

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB — 영수증 이미지 여유있게
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export default function OcrVerificationModal({
  isOpen,
  event,
  onClose,
  onSuccess,
}) {
  /* 업로드된 영수증 미리보기 URL */
  const [previewUrl, setPreviewUrl] = useState(null);
  /* 업로드된 서버 URL */
  const [uploadedUrl, setUploadedUrl] = useState(null);
  /* OCR 분석 결과 */
  const [ocrResult, setOcrResult] = useState(null);
  /* 진행 상태 */
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  /* 에러 메시지 */
  const [error, setError] = useState(null);

  /** 파일 입력 ref — 업로드 버튼 클릭 시 file dialog 트리거 */
  const fileInputRef = useRef(null);

  /** 모달 열림 ↔ 닫힘 전이 시 상태 리셋 + body 스크롤 잠금 */
  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      setUploadedUrl(null);
      setOcrResult(null);
      setUploading(false);
      setAnalyzing(false);
      setSubmitting(false);
      setSubmitted(false);
      setError(null);
      return;
    }
    // body 스크롤 잠금 — 모달 뒤 배경이 같이 스크롤되지 않도록
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting && !uploading && !analyzing) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, submitting, uploading, analyzing, onClose]);

  if (!isOpen || !event) return null;

  /* 제출 완료 화면 */
  if (submitted) {
    return createPortal(
      <Overlay role="presentation">
        <Dialog role="dialog" aria-modal="true">
          <SuccessBody>
            <SuccessEmoji aria-hidden="true">🎉</SuccessEmoji>
            <SuccessTitle>제출 완료!</SuccessTitle>
            <SuccessMsg>
              영수증이 정상적으로 접수되었습니다.<br />
              관리자 검토 후 리워드가 지급됩니다.
            </SuccessMsg>
          </SuccessBody>
        </Dialog>
      </Overlay>,
      document.body,
    );
  }

  /** 파일 선택 → 업로드 → OCR 분석 자동 실행 */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setOcrResult(null);

    if (!ALLOWED_MIME.includes(file.type)) {
      setError('지원하지 않는 이미지 형식입니다. (JPG/PNG/WEBP/HEIC)');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('이미지 크기는 8MB 이하여야 합니다.');
      return;
    }

    // 1) 즉시 미리보기
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setUploadedUrl(null);

    // 2) 서버 업로드
    setUploading(true);
    let serverUrl = null;
    try {
      const urls = await uploadImages([file]);
      serverUrl = Array.isArray(urls) ? urls[0] : urls;
      if (!serverUrl) throw new Error('이미지 업로드 응답에 URL이 없습니다.');
      setUploadedUrl(serverUrl);
    } catch (err) {
      console.error('[OCR 인증] 이미지 업로드 실패:', err);
      setError(err?.message || '이미지 업로드에 실패했습니다. 다시 시도해주세요.');
      setPreviewUrl(null);
      setUploading(false);
      return;
    } finally {
      setUploading(false);
    }

    // 3) OCR 분석 — 업로드 성공 후 자동 실행
    setAnalyzing(true);
    try {
      const result = await analyzeOcrImage(serverUrl);
      setOcrResult(result);
    } catch (err) {
      console.warn('[OCR 인증] 분석 실패 (제출은 가능):', err);
      // 분석 실패는 제출을 막지 않음 — 관리자가 직접 확인
      setOcrResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!uploadedUrl) {
      setError('영수증 이미지를 먼저 업로드해주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitOcrVerification(event.eventId, {
        imageUrl: uploadedUrl,
        extractedMovieName: ocrResult?.movieName?.value ?? null,
        extractedWatchDate: ocrResult?.watchDate?.value ?? null,
        extractedHeadcount: ocrResult?.headcount?.value ?? null,
        ocrConfidence: ocrResult?.ocrConfidence ?? null,
        extractedSeat: ocrResult?.seat?.value ?? null,
        extractedTheater: ocrResult?.theater?.value ?? null,
        extractedVenue: ocrResult?.venue?.value ?? null,
        extractedScreeningTime: ocrResult?.screeningTime?.value ?? null,
        extractedWatchedAt: ocrResult?.watchedAt?.value ?? null,
        parsedText: ocrResult?.parsedText ?? null,
      });
      setSubmitted(true);
      setTimeout(() => onSuccess?.(result), 2000);
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 409) {
        setError('이미 이 이벤트에 인증을 제출하셨습니다.');
      } else {
        setError(err?.response?.data?.error?.message || err?.message || '인증 제출에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !submitting && !uploading && !analyzing) {
      onClose?.();
    }
  };

  const busy = uploading || analyzing || submitting;

  return createPortal(
    <Overlay onClick={handleOverlayClick} role="presentation">
      <Dialog role="dialog" aria-modal="true" aria-labelledby="ocr-modal-title">
        <Header>
          <Title id="ocr-modal-title">🎟️ 실관람 인증</Title>
          <CloseButton
            type="button"
            onClick={() => !busy && onClose?.()}
            disabled={busy}
            aria-label="닫기"
          >
            ×
          </CloseButton>
        </Header>

        <Body>
          <EventSummary>
            <EventName>{event.title || '실관람 인증 이벤트'}</EventName>
            {event.memo && <EventMemo>{event.memo}</EventMemo>}
          </EventSummary>

          <FieldLabel>영수증 이미지 <Required>*</Required></FieldLabel>
          <UploadZone
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            $hasImage={Boolean(previewUrl)}
          >
            {previewUrl ? (
              <PreviewImg src={previewUrl} alt="업로드된 영수증 미리보기" />
            ) : (
              <UploadPlaceholder>
                <UploadIcon aria-hidden="true">📸</UploadIcon>
                <UploadText>영수증 이미지를 선택하세요</UploadText>
                <UploadHint>JPG · PNG · WEBP · HEIC / 최대 8MB</UploadHint>
              </UploadPlaceholder>
            )}
            {uploading && <UploadOverlay>업로드 중...</UploadOverlay>}
            {analyzing && <UploadOverlay>영수증 분석 중...</UploadOverlay>}
          </UploadZone>
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_MIME.join(',')}
            onChange={handleFileChange}
          />

          {/* OCR 분석 결과 */}
          {ocrResult && (() => {
            const status = ocrResult.status ?? 'FAILED';
            const isFailed  = status === 'FAILED';
            const isPartial = status === 'PARTIAL_SUCCESS';
            // 날짜+시간 조합(watchedAt)이 있으면 "관람일시"로, 없으면 "관람일"로 표시
            const dateField = ocrResult.watchedAt?.ok
              ? { label: '관람일시', field: ocrResult.watchedAt,  fmt: v => v }
              : { label: '관람일',   field: ocrResult.watchDate,  fmt: v => v };
            const fields = [
              { label: '영화명',   field: ocrResult.movieName,  fmt: v => v },
              dateField,
              { label: '인원 수',  field: ocrResult.headcount,  fmt: v => `${v}명` },
              { label: '좌석',     field: ocrResult.seat,        fmt: v => v },
              { label: '상영관',   field: ocrResult.theater,     fmt: v => v },
              { label: '영화관',   field: ocrResult.venue,       fmt: v => v },
            ];
            const okCount = fields.filter(f => f.field?.ok).length;

            return (
              <OcrResultBox $partial={isPartial} $fail={isFailed}>
                <OcrResultTitle>
                  {isFailed   ? '⚠️ 추출 실패' :
                   isPartial  ? `⚡ 일부 정보만 추출되었습니다 (${okCount}/6 항목)` :
                                '✅ 분석 완료'}
                </OcrResultTitle>
                {fields.map(({ label, field, fmt }) => (
                  <OcrRow key={label}>
                    <OcrStatusIcon $ok={field?.ok ?? false}>{field?.ok ? '✓' : '✗'}</OcrStatusIcon>
                    <OcrLabel>{label}</OcrLabel>
                    <OcrValue $empty={!field?.ok}>
                      {field?.ok ? fmt(field.value) : '미추출'}
                    </OcrValue>
                  </OcrRow>
                ))}
                {ocrResult.ocrConfidence != null && (
                  <OcrRow>
                    <OcrStatusIcon $ok={null} />
                    <OcrLabel>신뢰도</OcrLabel>
                    <OcrConfidence $pct={Math.round(ocrResult.ocrConfidence * 100)}>
                      {Math.round(ocrResult.ocrConfidence * 100)}%
                    </OcrConfidence>
                  </OcrRow>
                )}
              </OcrResultBox>
            );
          })()}

          {error && <ErrorBox role="alert">{error}</ErrorBox>}

          <Notice>
            ⓘ 제출된 영수증은 관리자 검토 후 정상 인증으로 처리되며, 검토 완료 시 리워드가 지급됩니다.
          </Notice>
        </Body>

        <Footer>
          <GhostButton type="button" onClick={onClose} disabled={busy}>
            취소
          </GhostButton>
          <PrimaryButton
            type="button"
            onClick={handleSubmit}
            disabled={busy || !uploadedUrl}
          >
            {uploading ? '업로드 중...' : analyzing ? '분석 중...' : submitting ? '제출 중...' : '인증 제출'}
          </PrimaryButton>
        </Footer>
      </Dialog>
    </Overlay>,
    document.body,
  );
}

/* ── styled-components ── */

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)   scale(1);    }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  animation: ${fadeIn} 0.18s ease-out;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Dialog = styled.div`
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  animation: ${slideUp} 0.22s ease-out;
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderDefault};
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  border-radius: 6px;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.bgTertiary};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &:disabled { cursor: not-allowed; opacity: 0.4; }
`;

const Body = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const EventSummary = styled.div`
  background: ${({ theme }) => theme.colors.primaryLight};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const EventName = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const EventMemo = styled.div`
  margin-top: 2px;
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
  white-space: pre-wrap;
`;

const FieldLabel = styled.label`
  display: block;
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Required = styled.span`
  color: ${({ theme }) => theme.colors.error};
  margin-left: 2px;
`;

/** 영수증 업로드 영역 — 클릭 시 파일 다이얼로그 */
const UploadZone = styled.button`
  position: relative;
  width: 100%;
  min-height: 180px;
  border: 2px dashed ${({ $hasImage, theme }) =>
    $hasImage ? theme.colors.primary : theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bgElevated};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.bgTertiary};
  }

  &:disabled { cursor: not-allowed; opacity: 0.7; }
`;

const UploadPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const UploadIcon = styled.div`
  font-size: 36px;
  line-height: 1;
`;

const UploadText = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
`;

const UploadHint = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  max-height: 280px;
  object-fit: contain;
  background: #000;
`;

const UploadOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const TextInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bgElevated};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.textSm};
  outline: none;
  transition: ${({ theme }) => theme.transitions.fast};

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const ErrorBox = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: ${({ theme }) => theme.colors.errorBg};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.textSm};
  border-radius: ${({ theme }) => theme.radius.sm};
  border-left: 3px solid ${({ theme }) => theme.colors.error};
`;

const OcrResultBox = styled.div`
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-left: 3px solid ${({ $fail, $partial, theme }) =>
    $fail    ? theme.colors.error :
    $partial ? theme.colors.warning :
               theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const OcrResultTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 2px;
`;

const OcrStatusIcon = styled.span`
  font-size: 10px;
  font-weight: bold;
  width: 14px;
  flex-shrink: 0;
  color: ${({ $ok, theme }) =>
    $ok === true  ? theme.colors.success :
    $ok === false ? theme.colors.error :
                    'transparent'};
`;

const OcrRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const OcrLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 60px;
  flex-shrink: 0;
`;

const OcrValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontMedium};
  color: ${({ $empty, theme }) => $empty ? theme.colors.textMuted : theme.colors.textPrimary};
  font-style: ${({ $empty }) => $empty ? 'italic' : 'normal'};
`;

const OcrConfidence = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  color: ${({ $pct, theme }) =>
    $pct >= 80 ? theme.colors.success :
    $pct >= 50 ? theme.colors.warning :
    theme.colors.error};
`;

const Notice = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.bgTertiary};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.textXs};
  border-radius: ${({ theme }) => theme.radius.sm};
  line-height: 1.5;
`;

const Footer = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  border-top: 1px solid ${({ theme }) => theme.colors.borderDefault};
  background: ${({ theme }) => theme.colors.bgSecondary};
`;

const GhostButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderDefault};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.bgTertiary};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const PrimaryButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.fontSemibold};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) { filter: brightness(1.08); }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

const SuccessBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xl};
  min-height: 240px;
  text-align: center;
`;

const SuccessEmoji = styled.div`
  font-size: 56px;
  line-height: 1;
`;

const SuccessTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.fontBold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const SuccessMsg = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
`;
