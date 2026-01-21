import Link from "next/link";

export default function FinalCTA() {
    return (
        <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8 md:p-12">
                <h3 className="text-2xl font-semibold md:text-3xl">
                    이제, 자막 작업을 “운영”하세요.
                </h3>
                <p className="mt-3 max-w-2xl text-sm text-neutral-200 md:text-base">
                    업로드 → 자동 처리 → 필요한 부분만 편집 → 다양한 포맷으로 내보내기.
                    AI Sub Auto는 반복을 줄이고 결과를 표준화합니다.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link href="/signup" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-neutral-200">
                        무료로 시작하기
                    </Link>
                    <Link href="/login" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10">
                        로그인
                    </Link>
                </div>
            </div>
        </section>
    );
}
