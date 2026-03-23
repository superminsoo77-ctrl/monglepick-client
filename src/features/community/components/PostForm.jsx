/**
 * 게시글 작성/수정 폼 컴포넌트.
 *
 * 제목, 카테고리, 내용을 입력받아 게시글을 생성한다.
 * 수정 모드일 때는 기존 데이터를 폼에 채워넣는다.
 *
 * @param {Object} props
 * @param {function} props.onSubmit - 폼 제출 콜백 ({ title, content, category })
 * @param {Object} [props.initialData] - 수정 시 초기 데이터
 * @param {boolean} [props.isSubmitting=false] - 제출 중 상태
 * @param {function} [props.onCancel] - 취소 버튼 콜백
 */

import { useState, useEffect } from 'react';
/* 유효성 검사 유틸 — shared/utils에서 가져옴 */
import { validatePostTitle, validateContent } from '../../../shared/utils/validators';
import './PostForm.css';

/** 카테고리 선택 옵션 목록 */
const CATEGORY_OPTIONS = [
  { value: 'general', label: '자유' },
  { value: 'review', label: '리뷰' },
  { value: 'question', label: '질문' },
];

export default function PostForm({ onSubmit, initialData, isSubmitting = false, onCancel }) {
  // 폼 입력값 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  // 필드별 에러 메시지
  const [errors, setErrors] = useState({});

  /**
   * 수정 모드일 때 초기 데이터를 폼에 채워넣는다.
   */
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setCategory(initialData.category || 'general');
    }
  }, [initialData]);

  /**
   * 폼 유효성 검사.
   *
   * @returns {boolean} 유효 여부
   */
  const validateForm = () => {
    const newErrors = {};

    const titleResult = validatePostTitle(title);
    if (!titleResult.isValid) newErrors.title = titleResult.message;

    const contentResult = validateContent(content);
    if (!contentResult.isValid) newErrors.content = contentResult.message;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 폼 제출 핸들러.
   *
   * @param {Event} e - 폼 제출 이벤트
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({ title: title.trim(), content: content.trim(), category });
  };

  return (
    <form className="post-form" onSubmit={handleSubmit} noValidate>
      {/* 카테고리 선택 */}
      <div className="post-form__field">
        <label className="post-form__label">카테고리</label>
        <div className="post-form__categories">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`post-form__category-btn ${category === opt.value ? 'post-form__category-btn--active' : ''}`}
              onClick={() => setCategory(opt.value)}
              disabled={isSubmitting}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 제목 입력 */}
      <div className="post-form__field">
        <label htmlFor="post-title" className="post-form__label">제목</label>
        <input
          id="post-title"
          type="text"
          className={`post-form__input ${errors.title ? 'post-form__input--error' : ''}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          disabled={isSubmitting}
          maxLength={100}
        />
        {errors.title && <span className="post-form__error">{errors.title}</span>}
      </div>

      {/* 내용 입력 */}
      <div className="post-form__field">
        <label htmlFor="post-content" className="post-form__label">내용</label>
        <textarea
          id="post-content"
          className={`post-form__textarea ${errors.content ? 'post-form__textarea--error' : ''}`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요 (10자 이상)"
          disabled={isSubmitting}
          rows={10}
          maxLength={5000}
        />
        {/* 글자 수 표시 */}
        <div className="post-form__char-count">
          <span>{content.length} / 5,000</span>
        </div>
        {errors.content && <span className="post-form__error">{errors.content}</span>}
      </div>

      {/* 버튼 영역 */}
      <div className="post-form__actions">
        {onCancel && (
          <button
            type="button"
            className="post-form__btn post-form__btn--cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </button>
        )}
        <button
          type="submit"
          className="post-form__btn post-form__btn--submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? '등록 중...' : (initialData ? '수정하기' : '등록하기')}
        </button>
      </div>
    </form>
  );
}
