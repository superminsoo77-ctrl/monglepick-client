/**
 * 입력값 검증 유틸리티 모듈.
 *
 * 회원가입/로그인 폼 등에서 사용하는 유효성 검사 함수들을 제공한다.
 * 각 함수는 검증 결과와 에러 메시지를 포함하는 객체를 반환한다.
 */

/**
 * 검증 결과 객체 타입.
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - 유효 여부
 * @property {string} message - 에러 메시지 (유효하면 빈 문자열)
 */

/**
 * 이메일 주소의 유효성을 검증한다.
 * RFC 5322 간소화 패턴을 사용하여 기본적인 이메일 형식을 확인한다.
 *
 * @param {string} email - 검증할 이메일 주소
 * @returns {ValidationResult} 검증 결과
 *
 * @example
 * validateEmail('user@example.com') // => { isValid: true, message: '' }
 * validateEmail('invalid')          // => { isValid: false, message: '올바른 이메일 형식이 아닙니다.' }
 */
export function validateEmail(email) {
  // 빈 값 검사
  if (!email || !email.trim()) {
    return { isValid: false, message: '이메일을 입력해주세요.' };
  }

  // 이메일 형식 검사 (간소화된 RFC 5322 패턴)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: '올바른 이메일 형식이 아닙니다.' };
  }

  // 길이 제한 검사 (최대 254자, RFC 5321 기준)
  if (email.trim().length > 254) {
    return { isValid: false, message: '이메일이 너무 깁니다.' };
  }

  return { isValid: true, message: '' };
}

/**
 * 비밀번호의 유효성을 검증한다.
 * 최소 8자, 영문+숫자 조합을 요구한다.
 *
 * @param {string} password - 검증할 비밀번호
 * @returns {ValidationResult} 검증 결과
 *
 * @example
 * validatePassword('mypass123') // => { isValid: true, message: '' }
 * validatePassword('short')     // => { isValid: false, message: '비밀번호는 8자 이상이어야 합니다.' }
 */
export function validatePassword(password) {
  // 빈 값 검사
  if (!password) {
    return { isValid: false, message: '비밀번호를 입력해주세요.' };
  }

  // 최소 길이 검사 (8자 이상)
  if (password.length < 8) {
    return { isValid: false, message: '비밀번호는 8자 이상이어야 합니다.' };
  }

  // 최대 길이 검사 (128자 이하)
  if (password.length > 128) {
    return { isValid: false, message: '비밀번호가 너무 깁니다.' };
  }

  // 영문 포함 검사
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, message: '비밀번호에 영문자를 포함해주세요.' };
  }

  // 숫자 포함 검사
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: '비밀번호에 숫자를 포함해주세요.' };
  }

  return { isValid: true, message: '' };
}

/**
 * 비밀번호 확인이 일치하는지 검증한다.
 *
 * @param {string} password - 원본 비밀번호
 * @param {string} confirmPassword - 확인 비밀번호
 * @returns {ValidationResult} 검증 결과
 */
export function validatePasswordConfirm(password, confirmPassword) {
  if (!confirmPassword) {
    return { isValid: false, message: '비밀번호 확인을 입력해주세요.' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: '비밀번호가 일치하지 않습니다.' };
  }

  return { isValid: true, message: '' };
}

/**
 * 닉네임의 유효성을 검증한다.
 * 2~20자, 한글/영문/숫자/밑줄만 허용한다.
 *
 * @param {string} nickname - 검증할 닉네임
 * @returns {ValidationResult} 검증 결과
 *
 * @example
 * validateNickname('몽글이')    // => { isValid: true, message: '' }
 * validateNickname('a')         // => { isValid: false, message: '닉네임은 2자 이상이어야 합니다.' }
 */
export function validateNickname(nickname) {
  // 빈 값 검사
  if (!nickname || !nickname.trim()) {
    return { isValid: false, message: '닉네임을 입력해주세요.' };
  }

  const trimmed = nickname.trim();

  // 최소 길이 검사 (2자 이상)
  if (trimmed.length < 2) {
    return { isValid: false, message: '닉네임은 2자 이상이어야 합니다.' };
  }

  // 최대 길이 검사 (20자 이하)
  if (trimmed.length > 20) {
    return { isValid: false, message: '닉네임은 20자 이하여야 합니다.' };
  }

  // 허용 문자 검사 (한글, 영문, 숫자, 밑줄)
  const nicknameRegex = /^[가-힣a-zA-Z0-9_]+$/;
  if (!nicknameRegex.test(trimmed)) {
    return { isValid: false, message: '닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.' };
  }

  return { isValid: true, message: '' };
}

/**
 * 게시글 제목의 유효성을 검증한다.
 *
 * @param {string} title - 검증할 제목
 * @returns {ValidationResult} 검증 결과
 */
export function validatePostTitle(title) {
  if (!title || !title.trim()) {
    return { isValid: false, message: '제목을 입력해주세요.' };
  }

  if (title.trim().length > 100) {
    return { isValid: false, message: '제목은 100자 이하여야 합니다.' };
  }

  return { isValid: true, message: '' };
}

/**
 * 게시글/리뷰 내용의 유효성을 검증한다.
 *
 * @param {string} content - 검증할 내용
 * @param {number} [minLength=10] - 최소 길이
 * @param {number} [maxLength=5000] - 최대 길이
 * @returns {ValidationResult} 검증 결과
 */
export function validateContent(content, minLength = 10, maxLength = 5000) {
  if (!content || !content.trim()) {
    return { isValid: false, message: '내용을 입력해주세요.' };
  }

  if (content.trim().length < minLength) {
    return { isValid: false, message: `내용은 ${minLength}자 이상이어야 합니다.` };
  }

  if (content.trim().length > maxLength) {
    return { isValid: false, message: `내용은 ${maxLength}자 이하여야 합니다.` };
  }

  return { isValid: true, message: '' };
}
