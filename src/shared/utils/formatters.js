/**
 * 포맷팅 유틸리티 모듈.
 *
 * 날짜, 평점, 텍스트, 장르 등의 표시 형식을 통일하는 함수들을 제공한다.
 * 전체 앱에서 일관된 데이터 표현을 위해 사용된다.
 */

/**
 * 서버 응답 문자열을 Date 로 안전하게 파싱한다.
 *
 * QA #177 (2026-04-23): Backend 엔티티가 `LocalDateTime` (타임존 없는 naive 타입) 이라서
 * Jackson 기본 직렬화가 `2026-04-23T14:30:00` 형태로 내려준다. 서버 JVM 의 user.timezone 이
 * UTC 인 상태(Docker 기본값)에서는 이 naive 문자열이 실제로 UTC 기준 시각을 나타내고,
 * 브라우저가 KST 로 로컬 파싱하면 `KST 14:30` 으로 해석되어 실제 서버 시각(KST 23:30) 과
 * 9시간 차이가 발생한다 → "방금 쓴 리뷰가 9시간 전"으로 표시되는 증상.
 *
 * 운영 JVM TZ 를 Asia/Seoul 로 고정하는 인프라 수정이 근본 해결이지만, 혼재 기간 중에도
 * 사용자에게 올바른 상대시간을 보여주도록 다음 휴리스틱을 적용한다:
 *   - 입력 문자열에 timezone suffix(`Z`/`+HH:MM`/`-HH:MM`) 가 있으면 그대로 사용
 *   - 없으면 UTC 로 가정해 `Z` 를 붙여 파싱
 * 서버가 추후 KST naive 로 내려주는 경로로 바뀌면 이 휴리스틱이 오히려 9시간 과거로 해석되므로,
 * 서버 수정 시 이 함수도 함께 롤백해야 한다.
 */
export function parseServerDate(input) {
  if (input == null) return null;
  if (input instanceof Date) return input;
  if (typeof input !== 'string') return new Date(input);
  const trimmed = input.trim();
  if (!trimmed) return null;
  // ISO-8601 날짜시간 형태이고 timezone suffix 가 없으면 UTC 부착
  const hasTimePart = trimmed.includes('T');
  const hasTzSuffix = /[Zz]|[+-]\d{2}:?\d{2}$/.test(trimmed);
  const normalized = hasTimePart && !hasTzSuffix ? `${trimmed}Z` : trimmed;
  return new Date(normalized);
}

/**
 * 날짜 문자열을 한국어 형식으로 포맷팅한다.
 *
 * @param {string|Date} dateInput - 날짜 문자열 또는 Date 객체 (예: '2024-03-15')
 * @param {Object} [options] - 포맷 옵션
 * @param {boolean} [options.includeTime=false] - 시간 포함 여부
 * @returns {string} 포맷된 날짜 문자열 (예: '2024년 3월 15일' 또는 '2024.03.15')
 *
 * @example
 * formatDate('2024-03-15') // => '2024.03.15'
 * formatDate('2024-03-15T14:30:00', { includeTime: true }) // => '2024.03.15 14:30'
 */
export function formatDate(dateInput, { includeTime = false } = {}) {
  if (!dateInput) return '-';

  try {
    const date = parseServerDate(dateInput);
    if (!date) return '-';
    // 유효하지 않은 날짜 확인
    if (isNaN(date.getTime())) return '-';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    let formatted = `${year}.${month}.${day}`;

    // 시간 포함 옵션이 활성화된 경우 시:분 추가
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      formatted += ` ${hours}:${minutes}`;
    }

    return formatted;
  } catch {
    return '-';
  }
}

/**
 * 상대적 시간 표시 (예: '3분 전', '2시간 전', '1일 전').
 *
 * @param {string|Date} dateInput - 날짜 문자열 또는 Date 객체
 * @returns {string} 상대 시간 문자열
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 60000)) // => '1분 전'
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '-';

  try {
    // QA #177: parseServerDate 로 timezone suffix 없는 서버 문자열 방어 (상단 주석 참조).
    const date = parseServerDate(dateInput);
    if (!date || isNaN(date.getTime())) return '-';

    const now = new Date();
    const diffMs = now - date;
    // 미래 시각(시계 어긋남/서버 TZ 추가 수정 후 과보정 등) — 0 이하로 내려가면 "방금 전"
    if (diffMs < 0) return '방금 전';
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // 1분 미만
    if (diffSec < 60) return '방금 전';
    // 1시간 미만
    if (diffMin < 60) return `${diffMin}분 전`;
    // 24시간 미만
    if (diffHour < 24) return `${diffHour}시간 전`;
    // 30일 미만
    if (diffDay < 30) return `${diffDay}일 전`;
    // 30일 이상이면 날짜 표시
    return formatDate(date);
  } catch {
    return '-';
  }
}

/**
 * 영화 평점을 소수점 1자리로 포맷팅한다.
 * 10점 만점 기준의 평점을 보기 좋게 표시한다.
 *
 * @param {number|string} rating - 평점 값 (0~10)
 * @returns {string} 포맷된 평점 문자열 (예: '7.5')
 *
 * @example
 * formatRating(7.523) // => '7.5'
 * formatRating(null)  // => '-'
 */
export function formatRating(rating) {
  if (rating === null || rating === undefined || rating === '') return '-';

  const num = Number(rating);
  if (isNaN(num)) return '-';

  // 소수점 1자리까지 표시
  return num.toFixed(1);
}

/**
 * 평점을 별 이모지로 변환한다 (5점 만점 기준).
 * 10점 만점 평점을 5점 척도로 변환하여 별 개수로 표현한다.
 *
 * @param {number} rating - 평점 값 (0~10)
 * @returns {string} 별 문자열 (예: '★★★★☆')
 */
export function formatRatingStars(rating) {
  if (!rating && rating !== 0) return '☆☆☆☆☆';

  // 10점 만점을 5점 만점으로 변환
  const stars = rating;
  const filled = Math.min(Math.max(stars, 0), 5);

  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/**
 * 긴 텍스트를 지정된 길이로 잘라내고 말줄임표를 추가한다.
 *
 * @param {string} text - 원본 텍스트
 * @param {number} [maxLength=100] - 최대 표시 길이
 * @returns {string} 잘린 텍스트 (말줄임표 포함)
 *
 * @example
 * truncateText('이 영화는 정말 재미있습니다...', 10) // => '이 영화는 정말 재...'
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength) + '...';
}

/**
 * 숫자를 한국어 단위로 포맷팅한다 (만, 억 단위).
 *
 * @param {number} num - 숫자
 * @returns {string} 포맷된 문자열 (예: '1.2만', '3.5억')
 *
 * @example
 * formatNumber(15000)     // => '1.5만'
 * @example
 * formatNumber(350000000) // => '3.5억'
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '-';

  const n = Number(num);
  if (isNaN(n)) return '-';

  // 1억 이상
  if (n >= 100000000) {
    return (n / 100000000).toFixed(1) + '억';
  }
  // 1만 이상
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + '만';
  }
  // 1000 이상이면 콤마 구분
  if (n >= 1000) {
    return n.toLocaleString('ko-KR');
  }

  return String(n);
}

/**
 * 숫자를 천 단위 콤마가 포함된 문자열로 포맷팅한다.
 * 포인트 잔액, 결제 금액 등 한국어 숫자 표기에 사용한다.
 *
 * @param {number} num - 포맷팅할 숫자
 * @returns {string} 콤마가 포함된 문자열 (예: '1,500')
 *
 * @example
 * formatNumberWithComma(1500)   // => '1,500'
 * formatNumberWithComma(0)      // => '0'
 * formatNumberWithComma(null)   // => '0'
 */
export function formatNumberWithComma(num) {
  if (num == null) return '0';
  return Number(num).toLocaleString('ko-KR');
}

/**
 * 러닝타임(분)을 '시간 분' 형식으로 변환한다.
 *
 * @param {number} minutes - 러닝타임(분 단위)
 * @returns {string} 포맷된 러닝타임 (예: '2시간 15분')
 *
 * @example
 * formatRuntime(135) // => '2시간 15분'
 */
export function formatRuntime(minutes) {
  if (!minutes && minutes !== 0) return '-';

  const num = Number(minutes);
  if (isNaN(num) || num <= 0) return '-';

  const hours = Math.floor(num / 60);
  const mins = num % 60;

  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

/**
 * 영어 장르명을 한국어로 매핑하는 객체.
 * TMDB API의 장르명을 한국어로 변환할 때 사용한다.
 */
export const GENRE_MAP = {
  Action: '액션',
  Adventure: '모험',
  Animation: '애니메이션',
  Comedy: '코미디',
  Crime: '범죄',
  Documentary: '다큐멘터리',
  Drama: '드라마',
  Family: '가족',
  Fantasy: '판타지',
  History: '역사',
  Horror: '공포',
  Music: '음악',
  Mystery: '미스터리',
  Romance: '로맨스',
  'Science Fiction': 'SF',
  'TV Movie': 'TV 영화',
  Thriller: '스릴러',
  War: '전쟁',
  Western: '서부',
};

/**
 * 영어 장르명을 한국어로 변환한다.
 * 매핑되지 않은 장르는 원문 그대로 반환한다.
 *
 * @param {string} genreName - 영어 장르명 (예: 'Action')
 * @returns {string} 한국어 장르명 (예: '액션')
 *
 * @example
 * genreMapper('Science Fiction') // => 'SF'
 * genreMapper('Unknown')          // => 'Unknown'
 */
export function genreMapper(genreName) {
  if (!genreName) return '';
  return GENRE_MAP[genreName] || genreName;
}

/**
 * 장르 배열을 한국어로 변환하여 콤마로 연결한다.
 *
 * @param {string[]} genres - 영어 장르명 배열
 * @returns {string} 콤마로 연결된 한국어 장르 문자열
 *
 * @example
 * formatGenres(['Action', 'Drama']) // => '액션, 드라마'
 */
export function formatGenres(genres) {
  if (!genres || !Array.isArray(genres) || genres.length === 0) return '-';
  return genres.map(genreMapper).join(', ');
}
