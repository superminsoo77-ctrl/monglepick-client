/**
 * 게시글 작성/수정 폼 컴포넌트.
 *
 * 제목, 카테고리, 내용, 이미지 첨부를 입력받아 게시글을 생성한다.
 *
 * 임시저장:
 *   - 편집 모드(initialData 있음)에서는 비활성.
 *   - 입력 후 3초 디바운스로 localStorage에 자동 저장.
 *   - 이미지는 선택 즉시 서버에 업로드 → URL을 draft에 저장 (용량 제한 없음).
 *   - 폼 진입 시 기존 draft가 있으면 복원 배너를 표시한다.
 *   - 등록/수정 완료 시 draft를 삭제한다.
 */

import { useState, useEffect, useRef } from 'react';
import { validatePostTitle, validateContent } from '../../../shared/utils/validators';
import { uploadImages } from '../api/communityApi';
import * as S from './PostForm.styled';

const CATEGORY_OPTIONS = [
  { value: 'FREE', label: '자유' },
  { value: 'DISCUSSION', label: '토론' },
  { value: 'RECOMMENDATION', label: '추천' },
  { value: 'NEWS', label: '뉴스' },
];

const MAX_IMAGE_COUNT = 5;
const DRAFT_KEY = 'community_post_draft';

function formatSavedAt(date) {
  if (!date) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 10) return '방금 저장됨';
  if (diff < 60) return `${diff}초 전 저장됨`;
  const mins = Math.floor(diff / 60);
  return `${mins}분 전 저장됨`;
}

export default function PostForm({ onSubmit, initialData, isSubmitting = false, onCancel }) {
  const isEditMode = !!initialData;

  const [title, setTitle]       = useState(() => initialData?.title ?? '');
  const [content, setContent]   = useState(() => initialData?.content ?? '');
  const [category, setCategory] = useState(() => initialData?.category ?? 'FREE');
  const [errors, setErrors]     = useState({});

  /**
   * images: { preview: string, url: string | null }[]
   *   - preview : 즉시 표시용 (blob: URL 또는 복원 시 서버 URL)
   *   - url     : 서버 업로드 완료된 URL (업로드 중이면 null)
   */
  const [images, setImages]       = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // 임시저장 관련 상태
  const [draftStatus, setDraftStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [savedAt, setSavedAt]         = useState(null);
  const [showBanner, setShowBanner]   = useState(false);
  const saveTimerRef = useRef(null);
  const idleTimerRef = useRef(null);

  // 마운트 시 기존 draft 확인
  useEffect(() => {
    if (isEditMode) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.title?.trim() || parsed.content?.trim() || parsed.imageUrls?.length) {
        setShowBanner(true);
      }
    } catch { /* localStorage 접근 불가 환경 — 무시 */ }
  }, [isEditMode]);

  // 업로드 완료된 URL만 추출
  const uploadedUrls = images.map((img) => img.url).filter(Boolean);

  // 3초 디바운스 자동 저장
  useEffect(() => {
    if (isEditMode) return;
    if (!title && !content && uploadedUrls.length === 0) return;

    clearTimeout(saveTimerRef.current);
    clearTimeout(idleTimerRef.current);
    setDraftStatus('saving');

    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            title,
            content,
            category,
            imageUrls: uploadedUrls,
            savedAt: new Date().toISOString(),
          }),
        );
        setSavedAt(new Date());
        setDraftStatus('saved');
      } catch { /* localStorage 저장 실패 — 무시 */ }
      idleTimerRef.current = setTimeout(() => setDraftStatus('idle'), 2000);
    }, 3000);

    return () => {
      clearTimeout(saveTimerRef.current);
      clearTimeout(idleTimerRef.current);
    };
  // uploadedUrls는 매 렌더마다 새 배열이므로 JSON 비교 대신 length+join으로 안정화
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, category, uploadedUrls.join(','), isEditMode]);

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.title    !== undefined) setTitle(parsed.title);
      if (parsed.content  !== undefined) setContent(parsed.content);
      if (parsed.category !== undefined) setCategory(parsed.category);
      if (parsed.imageUrls?.length) {
        // 서버 URL로 바로 복원 — preview와 url 모두 동일한 서버 URL 사용
        setImages(parsed.imageUrls.map((url) => ({ preview: url, url })));
      }
      if (parsed.savedAt) setSavedAt(new Date(parsed.savedAt));
    } catch { /* localStorage 접근 불가 환경 — 무시 */ }
    setShowBanner(false);
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowBanner(false);
  };

  const validateForm = () => {
    const newErrors = {};
    const titleResult = validatePostTitle(title);
    if (!titleResult.isValid) newErrors.title = titleResult.message;
    const contentResult = validateContent(content);
    if (!contentResult.isValid) newErrors.content = contentResult.message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = async (e) => {
    const selected = Array.from(e.target.files);
    if (images.length + selected.length > MAX_IMAGE_COUNT) {
      alert(`이미지는 최대 ${MAX_IMAGE_COUNT}장까지 첨부 가능합니다.`);
      return;
    }

    // 즉시 blob: URL로 미리보기 추가 (업로드 완료 전에도 화면에 표시)
    const newEntries = selected.map((f) => ({ preview: URL.createObjectURL(f), url: null }));
    const startIndex = images.length;
    setImages((prev) => [...prev, ...newEntries]);
    e.target.value = '';

    // 서버에 업로드
    setIsUploading(true);
    try {
      const urls = await uploadImages(selected);
      setImages((prev) => {
        const updated = [...prev];
        urls.forEach((url, i) => {
          if (updated[startIndex + i]) {
            updated[startIndex + i] = { ...updated[startIndex + i], url };
          }
        });
        return updated;
      });
    } catch {
      alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
      // 업로드 실패한 항목 제거
      setImages((prev) => prev.filter((_, i) => i < startIndex || i >= startIndex + selected.length));
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (isUploading) {
      alert('이미지 업로드가 완료될 때까지 기다려주세요.');
      return;
    }

    // 이미지는 이미 서버에 올라간 URL만 사용
    const imageUrls = images.map((img) => img.url).filter(Boolean);

    localStorage.removeItem(DRAFT_KEY);
    onSubmit({ title: title.trim(), content: content.trim(), category, imageUrls });
  };

  return (
    <S.Wrapper onSubmit={handleSubmit} noValidate>

      {/* 임시저장 상태 인디케이터 — 상단 */}
      {!isEditMode && (draftStatus !== 'idle' || savedAt) && (
        <S.DraftStatusBar>
          {draftStatus === 'saving' && (
            <><S.DraftDot /><span>저장 중...</span></>
          )}
          {draftStatus === 'saved' && <span>자동저장 완료</span>}
          {draftStatus === 'idle' && savedAt && <span>{formatSavedAt(savedAt)}</span>}
        </S.DraftStatusBar>
      )}

      {/* 임시저장 복원 배너 */}
      {showBanner && (
        <S.DraftBanner>
          <S.DraftBannerBody>
            <S.DraftBannerTitle>이전에 작성 중인 글이 있어요</S.DraftBannerTitle>
            <S.DraftBannerSub>임시저장된 내용을 불러올까요?</S.DraftBannerSub>
            <S.DraftBannerBtns>
              <S.DraftRestoreBtn type="button" onClick={restoreDraft}>불러오기</S.DraftRestoreBtn>
              <S.DraftDiscardBtn type="button" onClick={discardDraft}>버리기</S.DraftDiscardBtn>
            </S.DraftBannerBtns>
          </S.DraftBannerBody>
          <S.DraftBannerClose type="button" onClick={() => setShowBanner(false)}>✕</S.DraftBannerClose>
        </S.DraftBanner>
      )}

      {/* 카테고리 선택 */}
      <S.Field>
        <S.Label>카테고리</S.Label>
        <S.Categories>
          {CATEGORY_OPTIONS.map((opt) => (
            <S.CategoryBtn
              key={opt.value}
              type="button"
              $active={category === opt.value}
              onClick={() => setCategory(opt.value)}
              disabled={isSubmitting}
            >
              {opt.label}
            </S.CategoryBtn>
          ))}
        </S.Categories>
      </S.Field>

      {/* 제목 입력 */}
      <S.Field>
        <S.Label htmlFor="post-title">제목</S.Label>
        <S.Input
          id="post-title"
          type="text"
          $error={!!errors.title}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          disabled={isSubmitting}
          maxLength={100}
        />
        {errors.title && <S.ErrorMsg>{errors.title}</S.ErrorMsg>}
      </S.Field>

      {/* 내용 입력 */}
      <S.Field>
        <S.Label htmlFor="post-content">내용</S.Label>
        <S.Textarea
          id="post-content"
          $error={!!errors.content}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요 (10자 이상)"
          disabled={isSubmitting}
          rows={10}
          maxLength={5000}
        />
        <S.CharCount>
          <span>{content.length} / 5,000</span>
        </S.CharCount>
        {errors.content && <S.ErrorMsg>{errors.content}</S.ErrorMsg>}
      </S.Field>

      {/* 이미지 첨부 */}
      <S.Field>
        <S.Label>이미지 첨부 ({images.length}/{MAX_IMAGE_COUNT})</S.Label>
        {images.length > 0 && (
          <S.ImagePreviewList>
            {images.map((img, i) => (
              <S.ImagePreviewItem key={i}>
                <img src={img.preview} alt={`첨부 이미지 ${i + 1}`} />
                {/* 업로드 중인 항목은 오버레이 표시 */}
                {!img.url && <S.UploadingOverlay>업로드 중...</S.UploadingOverlay>}
                <S.ImageRemoveBtn
                  type="button"
                  onClick={() => handleImageRemove(i)}
                  disabled={isSubmitting || !img.url}
                >
                  ✕
                </S.ImageRemoveBtn>
              </S.ImagePreviewItem>
            ))}
          </S.ImagePreviewList>
        )}
        {images.length < MAX_IMAGE_COUNT && (
          <S.ImageUploadLabel>
            📷 이미지 추가
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleImageChange}
              disabled={isSubmitting || isUploading}
              style={{ display: 'none' }}
            />
          </S.ImageUploadLabel>
        )}
        {isUploading && <S.UploadingMsg>이미지 업로드 중...</S.UploadingMsg>}
      </S.Field>

      {/* 버튼 영역 */}
      <S.Actions>
        {onCancel && (
          <S.CancelBtn
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isUploading}
          >
            취소
          </S.CancelBtn>
        )}
        <S.SubmitBtn type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting ? '등록 중...' : (initialData ? '수정하기' : '등록하기')}
        </S.SubmitBtn>
      </S.Actions>

    </S.Wrapper>
  );
}
