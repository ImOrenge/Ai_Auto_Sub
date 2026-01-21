export default function ProblemSolution() {
    return (
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="text-sm font-semibold">Before</div>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-200">
                        자막 제작은 반복 작업이 많고, 영상이 늘수록 편집/번역/내보내기까지 사람이 직접 관리해야 합니다.
                        품질은 올라가도 시간과 비용이 계속 증가합니다.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-neutral-200">
                        {["업로드/정리/대기", "STT 결과 확인", "번역/표기 통일", "편집/싱크 조정", "포맷 내보내기"].map((t) => (
                            <li key={t} className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="text-sm font-semibold">After</div>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-200">
                        AI Sub Auto는 파이프라인을 “작업 큐”로 표준화합니다. 자동으로 만들고, 필요한 부분만 사람이 편집해
                        빠르게 완성합니다.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-neutral-200">
                        {["멀티잡 큐로 병렬 처리", "상태/재시도/실패 추적", "편집툴로 후편집 최소화", "SRT/VTT/MP4 즉시 Export", "사용량/비용 투명"].map((t) => (
                            <li key={t} className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
