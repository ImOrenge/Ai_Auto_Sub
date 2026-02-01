import Link from "next/link";

export default function PrivacyPage() {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12">
            <header className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
                <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground">
                    Last updated: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </header>

            <div className="prose prose-sm max-w-none space-y-8 text-foreground">
                {/* Introduction */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">1. 개요</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        AI Sub Auto("회사", "저희", "우리")는 귀하의 개인정보를 보호하고 존중합니다.
                        본 개인정보 처리방침은 귀하가 저희 서비스를 이용할 때 수집, 사용, 공개 및 보호되는 정보에 대해 설명합니다.
                    </p>
                    <p className="leading-relaxed text-muted-foreground">
                        저희 서비스를 사용함으로써 귀하는 본 정책에 따른 정보 수집 및 사용에 동의하게 됩니다.
                    </p>
                </section>

                {/* Information We Collect */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">2. 수집하는 정보</h2>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">2.1 계정 정보</h3>
                        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                            <li>이메일 주소</li>
                            <li>이름 (선택사항)</li>
                            <li>프로필 사진 (선택사항)</li>
                            <li>비밀번호 (암호화되어 저장)</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">2.2 사용 데이터</h3>
                        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                            <li>업로드된 비디오 파일 및 오디오</li>
                            <li>생성된 자막 파일 (SRT, VTT)</li>
                            <li>프로젝트 설정 및 편집 기록</li>
                            <li>사용량 통계 (처리 시간, 파일 크기 등)</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">2.3 기술 정보</h3>
                        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                            <li>IP 주소</li>
                            <li>브라우저 유형 및 버전</li>
                            <li>디바이스 정보</li>
                            <li>쿠키 및 유사 기술</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">2.4 결제 정보</h3>
                        <p className="text-muted-foreground">
                            결제 정보는 Stripe와 같은 제3자 결제 처리업체를 통해 처리됩니다.
                            저희는 신용카드 번호를 직접 저장하지 않습니다.
                        </p>
                    </div>
                </section>

                {/* How We Use Information */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">3. 정보 사용 목적</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        수집된 정보는 다음과 같은 목적으로 사용됩니다:
                    </p>
                    <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                        <li>서비스 제공 및 유지보수</li>
                        <li>AI 기반 음성 인식 및 자막 생성</li>
                        <li>고객 지원 및 문의 응답</li>
                        <li>서비스 개선 및 새로운 기능 개발</li>
                        <li>사용자 경험 개인화</li>
                        <li>서비스 사용량 모니터링 및 분석</li>
                        <li>보안 및 사기 방지</li>
                        <li>법적 의무 준수</li>
                    </ul>
                </section>

                {/* Data Storage and Security */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">4. 데이터 저장 및 보안</h2>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">4.1 저장 위치</h3>
                        <p className="text-muted-foreground">
                            귀하의 데이터는 암호화되어 안전한 클라우드 서버에 저장됩니다.
                            파일은 Google Cloud Storage 또는 AWS S3와 같은 신뢰할 수 있는 제공업체에 저장됩니다.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">4.2 보관 기간</h3>
                        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                            <li><strong>Free 플랜:</strong> 프로젝트 및 파일은 마지막 활동 후 7일간 보관</li>
                            <li><strong>유료 플랜:</strong> 프로젝트 및 파일은 마지막 활동 후 90일간 보관</li>
                            <li><strong>계정 정보:</strong> 계정 삭제 요청 시까지 또는 2년간 비활성 상태일 경우 자동 삭제</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">4.3 보안 조치</h3>
                        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                            <li>전송 중 및 저장 시 데이터 암호화 (TLS/SSL, AES-256)</li>
                            <li>정기적인 보안 감사 및 취약점 테스트</li>
                            <li>접근 제어 및 인증 시스템</li>
                            <li>자동화된 백업 및 재해 복구 계획</li>
                        </ul>
                    </div>
                </section>

                {/* Data Sharing */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">5. 정보 공유</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        저희는 다음과 같은 경우를 제외하고 귀하의 개인정보를 제3자에게 판매하거나 공유하지 않습니다:
                    </p>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">5.1 서비스 제공업체</h3>
                        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                            <li><strong>OpenAI:</strong> 음성 인식 및 번역을 위한 Whisper API</li>
                            <li><strong>클라우드 스토리지:</strong> 파일 저장 및 관리</li>
                            <li><strong>결제 처리:</strong> Stripe 등 결제 서비스</li>
                            <li><strong>분석 도구:</strong> 서비스 개선을 위한 익명화된 사용 통계</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">5.2 법적 요구사항</h3>
                        <p className="text-muted-foreground">
                            법적 의무를 준수하거나, 안전을 보호하거나, 사기를 방지하기 위해 필요한 경우 정보를 공개할 수 있습니다.
                        </p>
                    </div>
                </section>

                {/* Your Rights */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">6. 귀하의 권리</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        귀하는 개인정보에 대해 다음과 같은 권리를 가집니다:
                    </p>
                    <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                        <li><strong>접근권:</strong> 저희가 보유한 귀하의 개인정보에 접근할 수 있습니다</li>
                        <li><strong>수정권:</strong> 부정확한 정보를 수정할 수 있습니다</li>
                        <li><strong>삭제권:</strong> 계정 및 관련 데이터를 삭제 요청할 수 있습니다</li>
                        <li><strong>이동권:</strong> 구조화된 형식으로 데이터를 받을 수 있습니다</li>
                        <li><strong>처리 제한권:</strong> 특정 상황에서 데이터 처리를 제한할 수 있습니다</li>
                        <li><strong>반대권:</strong> 특정 데이터 처리에 반대할 수 있습니다</li>
                    </ul>
                    <p className="mt-4 text-muted-foreground">
                        이러한 권리를 행사하려면 설정 페이지에서 직접 관리하거나 support@aisubauto.com으로 문의하십시오.
                    </p>
                </section>

                {/* Cookies */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">7. 쿠키 및 추적 기술</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        저희는 쿠키 및 유사한 추적 기술을 사용하여 서비스를 개선합니다:
                    </p>
                    <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                        <li><strong>필수 쿠키:</strong> 로그인 세션 유지 및 기본 기능 제공</li>
                        <li><strong>분석 쿠키:</strong> 사용 패턴 이해 및 서비스 개선</li>
                        <li><strong>선호도 쿠키:</strong> 사용자 설정 및 선호도 저장</li>
                    </ul>
                    <p className="mt-4 text-muted-foreground">
                        브라우저 설정에서 쿠키를 관리할 수 있지만, 일부 기능이 제한될 수 있습니다.
                    </p>
                </section>

                {/* Children's Privacy */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">8. 아동 개인정보 보호</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        저희 서비스는 만 14세 미만 아동을 대상으로 하지 않습니다.
                        만 14세 미만 아동의 개인정보를 고의로 수집하지 않으며,
                        이러한 사실을 알게 될 경우 즉시 삭제 조치를 취합니다.
                    </p>
                </section>

                {/* International Transfers */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">9. 국제 데이터 전송</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        귀하의 정보는 귀하의 거주 국가 외부에 위치한 서버로 전송되고 처리될 수 있습니다.
                        저희는 귀하의 데이터를 보호하기 위해 적절한 보호 조치를 취합니다.
                    </p>
                </section>

                {/* Changes to Policy */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">10. 정책 변경</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        본 개인정보 처리방침은 수시로 업데이트될 수 있습니다.
                        중요한 변경사항이 있을 경우 이메일 또는 서비스 내 알림을 통해 통지합니다.
                        변경사항은 본 페이지에 게시된 날짜부터 유효합니다.
                    </p>
                </section>

                {/* Contact */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">11. 문의하기</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        본 개인정보 처리방침에 대한 질문이나 우려사항이 있으시면 다음으로 연락주시기 바랍니다:
                    </p>
                    <div className="rounded-xl border border-border bg-card/50 p-6 space-y-2">
                        <p className="font-semibold">AI Sub Auto</p>
                        <p className="text-sm text-muted-foreground">이메일: support@aisubauto.com</p>
                        <p className="text-sm text-muted-foreground">또는 <Link href="/contact" className="text-primary hover:underline">문의 페이지</Link>를 통해 연락하실 수 있습니다.</p>
                    </div>
                </section>

                {/* Related Links */}
                <section className="rounded-xl border border-border bg-card/70 p-6">
                    <p className="font-semibold mb-3">관련 문서</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <Link
                            className="text-primary underline-offset-4 hover:underline"
                            href="/terms"
                        >
                            이용약관
                        </Link>
                        <Link
                            className="text-primary underline-offset-4 hover:underline"
                            href="/contact"
                        >
                            문의하기
                        </Link>
                        <Link
                            className="text-primary underline-offset-4 hover:underline"
                            href="/settings"
                        >
                            개인정보 설정
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
