/**
 * 푸터 컴포넌트.
 *
 * 2026-04-23 v3 개편 — 법적·크레딧 중심으로 전면 재구성.
 *
 * 배경:
 *   v2 (2026-04-08) 의 4컬럼 구조는 헤더 NAV(서비스) / 유저 드롭다운(계정) 과 완전 중복이라
 *   `/account/*` 라우팅 통합 이후 "이중 노출" 이 심해졌다. 단일 진실 원본 원칙에 따라
 *   헤더와 중복되는 서비스/계정 NAV 컬럼은 완전 제거.
 *
 * 새 구조 (3영역 + 하단 바):
 *   - 좌:   브랜드 (로고 + 미션 한 줄 설명 + 이메일)
 *   - 중:   데이터 크레딧 (TMDB / KMDb / KOBIS — 외부 API 사용 시 의무 표기)
 *   - 우:   정책 링크 (이용약관 / 개인정보처리방침 / 운영정책 / 환불정책)
 *          ※ 정책 페이지는 미구현 상태 — 고객센터 `/support` 해시 앵커로 임시 연결.
 *             추후 독립 페이지 신설 시 ROUTES 상수만 교체.
 *   - 하단: 사업자 정보 (팀 모드 placeholder) + 저작권
 *
 * 모바일에서는 1컬럼 스택으로 전환된다.
 *
 * NOTE: TMDB 약관은 "This product uses the TMDB API but is not endorsed or certified by TMDB."
 *       문구를 명시적으로 요구한다. CreditNote 에 반영.
 */

/* 라우트 경로 상수 — shared/constants에서 가져옴 */
import { ROUTES } from '../../constants/routes';
import * as S from './Footer.styled';

export default function Footer() {
  // 현재 연도 — 저작권 표시에 사용
  const currentYear = new Date().getFullYear();

  return (
    <S.FooterWrapper>
      <S.Inner>
        {/* ── 3영역 메인 콘텐츠 ── */}
        <S.Columns>
          {/*
            좌측 — 브랜드.
            로고 + 서비스 한 줄 설명 + 문의 이메일을 한 블록으로 묶어
            "누가 만들었는지" 정보의 유일한 진입점 역할을 한다.
          */}
          <S.Brand>
            <S.LogoLink to={ROUTES.HOME}>
              <S.LogoIcon src="/mongle-transparent.png" alt="몽글픽" />
              <S.LogoText>몽글픽</S.LogoText>
            </S.LogoLink>
            {/* 2026-04-23 크기 축소 — 2줄 → 1줄로 압축 */}
            <S.Desc>AI가 당신의 영화 취향을 분석해 딱 맞는 작품을 추천합니다.</S.Desc>
            <S.ContactEmail href="mailto:contact@monglepick.com">
              contact@monglepick.com
            </S.ContactEmail>
          </S.Brand>

          {/*
            중앙 — 데이터 크레딧.
            TMDB / KMDb / KOBIS 모두 외부에서 제공받는 영화 메타데이터이므로
            출처를 명시한다. 특히 TMDB 는 공식 attribution 문구(disclaimer) 요구.
            각 로고/링크는 외부 이동이므로 target="_blank" + rel="noopener".
          */}
          <S.Section>
            <S.SectionTitle>데이터 제공</S.SectionTitle>
            <S.ExternalLink
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              TMDB
            </S.ExternalLink>
            <S.ExternalLink
              href="https://www.kmdb.or.kr/"
              target="_blank"
              rel="noopener noreferrer"
            >
              KMDb (영화진흥위원회)
            </S.ExternalLink>
            <S.ExternalLink
              href="https://www.kobis.or.kr/"
              target="_blank"
              rel="noopener noreferrer"
            >
              KOBIS (영화관입장권 통합전산망)
            </S.ExternalLink>
            <S.CreditNote>
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </S.CreditNote>
          </S.Section>

          {/*
            우측 — 정책 링크.
            2026-04-23 Footer 후속 — 독립 페이지 4종 신설로 해시 앵커 폐기.
            각 페이지는 LegalPageLayout 공용 컴포넌트 기반 placeholder 상태이며,
            실제 약관 문구 확정 시 각 페이지 내부 sections prop 만 채우면 된다.
          */}
          <S.Section>
            <S.SectionTitle>약관 및 정책</S.SectionTitle>
            <S.NavLink to={ROUTES.TERMS}>이용약관</S.NavLink>
            <S.NavLink to={ROUTES.PRIVACY}>개인정보처리방침</S.NavLink>
            <S.NavLink to={ROUTES.OPERATION_POLICY}>운영정책</S.NavLink>
            <S.NavLink to={ROUTES.REFUND_POLICY}>환불정책</S.NavLink>
            <S.NavLink to={ROUTES.SUPPORT}>고객센터</S.NavLink>
          </S.Section>
        </S.Columns>

        {/* ── 구분선 ── */}
        <S.Divider />

        {/*
          ── 사업자 정보 + 저작권 ──
          졸업 프로젝트 단계에서는 팀명·대표·사업자번호 등이 확정되지 않았으므로
          "운영팀" placeholder 와 이메일만 표기. 상용화 시 이 블록에 법적 필수 정보
          (상호 / 대표자 / 사업자등록번호 / 통신판매업신고번호 / 주소 / 전화번호) 를 추가한다.
        */}
        <S.LegalRow>
          <S.LegalInfo>
            <span>몽글픽 운영팀</span>
            <S.LegalDivider aria-hidden="true">|</S.LegalDivider>
            <span>대표 이메일 contact@monglepick.com</span>
          </S.LegalInfo>
          <S.Copyright>
            &copy; {currentYear} 몽글픽. All rights reserved.
          </S.Copyright>
        </S.LegalRow>
      </S.Inner>
    </S.FooterWrapper>
  );
}
