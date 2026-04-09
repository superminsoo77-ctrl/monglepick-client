/**
 * 약관 내용 모달 컴포넌트.
 *
 * 회원가입 폼에서 각 약관 "보기" 버튼 클릭 시 약관 전문을 보여준다.
 * ESC 키 또는 오버레이 클릭으로 닫을 수 있다.
 *
 * @param {Object} props
 * @param {'service'|'privacy'|'marketing'} props.type - 표시할 약관 종류
 * @param {function} props.onClose - 닫기 콜백
 */

import { useEffect, useCallback } from 'react';
import * as S from './TermsModal.styled';

/** 약관별 제목 및 내용 정의 */
const TERMS_CONTENT = {
  service: {
    title: '서비스 이용약관',
    sections: [
      {
        heading: '제1조 (목적)',
        content: (
          <>
            <S.Paragraph>
              이 약관은 몽글픽(이하 "회사")이 제공하는 영화 추천 서비스(이하 "서비스")의 이용 조건 및
              절차, 회사와 회원 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
            </S.Paragraph>
          </>
        ),
      },
      {
        heading: '제2조 (정의)',
        content: (
          <>
            <S.List>
              <li>"서비스"란 회사가 제공하는 AI 기반 영화 추천, 커뮤니티, 포인트 등 일체의 서비스를 말합니다.</li>
              <li>"회원"이란 이 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
              <li>"계정"이란 회원이 서비스에 로그인하기 위해 설정한 이메일 및 비밀번호를 말합니다.</li>
            </S.List>
          </>
        ),
      },
      {
        heading: '제3조 (약관의 효력 및 변경)',
        content: (
          <>
            <S.Paragraph>
              이 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써 효력이 발생합니다.
              회사는 관련 법령에 위배되지 않는 범위 내에서 약관을 개정할 수 있으며,
              개정 시 적용 일자 및 사유를 명시하여 7일 이전부터 공지합니다.
            </S.Paragraph>
          </>
        ),
      },
      {
        heading: '제4조 (서비스 이용)',
        content: (
          <>
            <S.Paragraph>
              회원은 다음 행위를 해서는 안 됩니다.
            </S.Paragraph>
            <S.List>
              <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
              <li>서비스의 운영을 방해하거나 다른 회원에게 피해를 주는 행위</li>
              <li>회사의 지식재산권을 침해하는 행위</li>
              <li>불법적이거나 공서양속에 반하는 콘텐츠를 게시하는 행위</li>
            </S.List>
          </>
        ),
      },
      {
        heading: '제5조 (서비스 중단)',
        content: (
          <>
            <S.Paragraph>
              회사는 시스템 점검, 장애 복구, 천재지변 등 부득이한 사유가 있는 경우 서비스 제공을
              일시적으로 중단할 수 있습니다. 이 경우 사전에 공지하며, 불가피한 경우 사후에 공지할 수 있습니다.
            </S.Paragraph>
          </>
        ),
      },
      {
        heading: '제6조 (면책조항)',
        content: (
          <>
            <S.Paragraph>
              회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력으로 인한 서비스 장애에
              대해 책임을 지지 않습니다. 회원이 게시한 정보·자료에 대한 책임은 해당 회원에게 있습니다.
            </S.Paragraph>
          </>
        ),
      },
    ],
  },

  privacy: {
    title: '개인정보 수집 및 이용 동의',
    sections: [
      {
        heading: '1. 수집하는 개인정보 항목',
        content: (
          <>
            <S.List>
              <li>필수 항목: 이메일 주소, 비밀번호, 닉네임</li>
              <li>선택 항목: 프로필 사진, 선호 장르/분위기</li>
              <li>자동 수집 항목: 접속 IP, 접속 일시, 서비스 이용 기록, 쿠키</li>
            </S.List>
          </>
        ),
      },
      {
        heading: '2. 개인정보 수집 및 이용 목적',
        content: (
          <>
            <S.List>
              <li>회원 가입 및 관리 (본인 확인, 서비스 이용 계약 이행)</li>
              <li>AI 기반 영화 추천 서비스 제공 (개인화 추천 알고리즘 활용)</li>
              <li>포인트 및 결제 서비스 운영</li>
              <li>고객 문의 및 불만 처리</li>
              <li>서비스 개선 및 이용 통계 분석</li>
            </S.List>
          </>
        ),
      },
      {
        heading: '3. 개인정보 보유 및 이용 기간',
        content: (
          <>
            <S.Paragraph>
              회원 탈퇴 시까지 보유·이용합니다. 단, 관련 법령에 따라 아래 기간 동안 보관합니다.
            </S.Paragraph>
            <S.List>
              <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
              <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
              <li>로그인 기록: 3개월 (통신비밀보호법)</li>
            </S.List>
          </>
        ),
      },
      {
        heading: '4. 개인정보 제3자 제공',
        content: (
          <>
            <S.Paragraph>
              회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 다만, 법령에 의한 경우
              또는 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관이 요구하는 경우는 예외로 합니다.
            </S.Paragraph>
          </>
        ),
      },
      {
        heading: '5. 개인정보 처리 거부 권리',
        content: (
          <>
            <S.Paragraph>
              위 개인정보 수집·이용을 거부할 권리가 있습니다. 다만, 필수 항목 수집·이용을 거부하실 경우
              회원 가입 및 서비스 이용이 제한될 수 있습니다.
            </S.Paragraph>
          </>
        ),
      },
    ],
  },

  marketing: {
    title: '마케팅 정보 수신 동의',
    sections: [
      {
        heading: '수신 동의 내용',
        content: (
          <>
            <S.Paragraph>
              몽글픽의 신규 서비스, 이벤트, 프로모션, 혜택 등의 마케팅 정보를 아래 채널을 통해 수신하는 것에 동의합니다.
            </S.Paragraph>
            <S.List>
              <li>이메일</li>
              <li>서비스 내 알림(푸시)</li>
            </S.List>
          </>
        ),
      },
      {
        heading: '수집하는 개인정보',
        content: (
          <>
            <S.List>
              <li>이메일 주소, 서비스 이용 내역 (관심 장르, 추천 이력 등)</li>
            </S.List>
          </>
        ),
      },
      {
        heading: '보유 및 이용 기간',
        content: (
          <>
            <S.Paragraph>
              마케팅 수신 동의 철회 시까지 보유·이용합니다.
              마이페이지 &gt; 알림 설정에서 언제든지 수신 동의를 철회할 수 있습니다.
            </S.Paragraph>
          </>
        ),
      },
      {
        heading: '동의 거부 권리',
        content: (
          <>
            <S.Paragraph>
              마케팅 정보 수신 동의는 선택 사항으로, 동의하지 않아도 서비스 이용에 불이익이 없습니다.
            </S.Paragraph>
          </>
        ),
      },
    ],
  },
};

export default function TermsModal({ type, onClose }) {
  const terms = TERMS_CONTENT[type];

  /** ESC 키로 닫기 */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [handleKeyDown]);

  if (!terms) return null;

  return (
    <S.Overlay onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <S.Container role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
        <S.Header>
          <S.Title id="terms-modal-title">{terms.title}</S.Title>
          <S.CloseButton onClick={onClose} aria-label="닫기">✕</S.CloseButton>
        </S.Header>

        <S.Body>
          {terms.sections.map((section) => (
            <div key={section.heading}>
              <S.SectionTitle>{section.heading}</S.SectionTitle>
              {section.content}
            </div>
          ))}
        </S.Body>

        <S.Footer>
          <S.ConfirmButton onClick={onClose}>확인</S.ConfirmButton>
        </S.Footer>
      </S.Container>
    </S.Overlay>
  );
}
