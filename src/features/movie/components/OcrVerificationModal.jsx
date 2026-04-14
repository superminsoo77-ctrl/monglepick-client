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
import { submitOcrVerification, uploadImages } from '../../community/api/communityApi';

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB — 영수증 이미지 여유있게
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export default function OcrVerificationModal({
  isOpen,
  event,
  onClose,
  onSuccess,
}) {
  /* 업로드된 영수증 미리보기 URL (blob 은 선택 직후, 서버 URL 은 업로드 성공 시) */
  const [previewUrl, setPreviewUrl] = useState(null);
  /* 업로드된 서버 URL — 최종 제출 바디에 들어갈 값 */
  const [uploadedUrl, setUploadedUrl] = useState(null);
  /* 관람일(선택) — 자유 텍스트 */
  const [watchDate, setWatchDate] = useState('');
  /* 영수증에 찍힌 영화명(선택) */
  const [movieName, setMovieName] = useState('');
  /* 업로드/제출 진행 상태 */
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /* 사용자 노출용 에러/성공 메시지 */
  const [error, setError] = useState(null);

  /** 파일 입력 ref — 업로드 버튼 클릭 시 file dialog 트리거 */
  const fileInputRef = useRef(null);

  /** 모달 열림 ↔ 닫힘 전이 시 상태 리셋 + body 스크롤 잠금 */
  useEffect(() => {
    if (!isOpen) {
      // 닫힐 때 내부 상태 초기화 — 다음 오픈에서 깨끗한 폼 보장
      setPreviewUrl(null);
      setUploadedUrl(null);
      setWatchDate('');
      setMovieName('');
      setUploading(false);
      setSubmitting(false);
      setError(null);
      return;
    }
    // body 스크롤 잠금 — 모달 뒤 배경이 같이 스크롤되지 않도록
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  /** ESC 키로 닫기 — 제출 중에는 잠금 */
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting && !uploading) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, submitting, uploading, onClose]);

  if (!isOpen || !event) return null;

  /** 파일 선택 변경 핸들러 — validation + 즉시 업로드 */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // 1) 유효성 — 타입/크기
    if (!ALLOWED_MIME.includes(file.type)) {
      setError('지원하지 않는 이미지 형식입니다. (JPG/PNG/WEBP/HEIC)');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('이미지 크기는 8MB 이하여야 합니다.');
      return;
    }

    // 2) 즉시 미리보기 (blob URL) — 업로드 중에도 사용자가 확인할 수 있도록
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setUploadedUrl(null);

    // 3) 서버 업로드 — 기존 /api/v1/images/upload 재사용
    setUploading(true);
    try {
      const urls = await uploadImages([file]);
      const serverUrl = Array.isArray(urls) ? urls[0] : urls;
      if (!serverUrl) {
        throw new Error('이미지 업로드 응답에 URL 이 없습니다.');
      }
      setUploadedUrl(serverUrl);
    } catch (err) {
      console.error('[OCR 인증] 이미지 업로드 실패:', err);
      setError(err?.message || '이미지 업로드에 실패했습니다. 다시 시도해주세요.');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  /** 제출 핸들러 — Backend POST /ocr-events/{eventId}/verify */
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
        watchDate: watchDate?.trim() || undefined,
        movieName: movieName?.trim() || undefined,
      });
      // 성공 콜백 — 부모에서 토스트/알림 처리
      onSuccess?.(result);
    } catch (err) {
      // 백엔드 에러 메시지 우선 노출 — ApiResponse 래퍼 에러 포맷(error.message)
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        '인증 제출에 실패했습니다.';
      // 중복(409) 시 특화 안내
      if (err?.response?.status === 409) {
        setError('이미 이 이벤트에 인증을 제출하셨습니다.');
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** 오버레이(바깥 영역) 클릭 시 닫기 — 제출/업로드 중에는 잠금 */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !submitting && !uploading) {
      onClose?.();
    }
  };

  const busy = uploading || submitting;

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
          </UploadZone>
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_MIME.join(',')}
            onChange={handleFileChange}
          />

          <FieldLabel htmlFor="ocr-watch-date">관람일 (선택)</FieldLabel>
          <TextInput
            id="ocr-watch-date"
            type="text"
            placeholder="예: 2026-04-10 또는 4월 10일"
            value={watchDate}
            onChange={(e) => setWatchDate(e.target.value)}
            disabled={busy}
            maxLength={50}
          />

          <FieldLabel htmlFor="ocr-movie-name">영수증에 적힌 영화명 (선택)</FieldLabel>
          <TextInput
            id="ocr-movie-name"
            type="text"
            placeholder="관리자 검토에 도움이 됩니다"
            value={movieName}
            onChange={(e) => setMovieName(e.target.value)}
            disabled={busy}
            maxLength={200}
          />

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
            {submitting ? '제출 중...' : '인증 제출'}
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
