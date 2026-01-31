"use client";

import HeaderSticky from "@/components/landing/HeaderSticky";
import Footer from "@/components/landing/Footer";
import { Link as ScrollLink } from "react-scroll";
import {
    BookOpen,
    Video,
    Wand2,
    Scissors,
    Download,
    Layers,
    MonitorPlay,
    Upload,
    FolderOpen,
    Languages,
    Mic,
    Palette,
    Type,
    Move,
    FileVideo,
    Link as LinkIcon,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Crop,
    Trash2,
    Settings,
    Globe,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
} from "lucide-react";

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <HeaderSticky />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 md:py-20 flex gap-12">
                {/* Sidebar Navigation */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">목차</h3>
                            <nav className="space-y-1 border-l border-border/50">
                                <NavLink to="intro" label="Introduction" />
                                <NavLink to="getting-started" label="시작하기" />
                                <NavGroup label="프로젝트">
                                    <NavLink to="project-creation" label="프로젝트 생성" indent />
                                    <NavLink to="asset-upload" label="어셋 업로드" indent />
                                    <NavLink to="asset-management" label="어셋 관리" indent />
                                </NavGroup>
                                <NavGroup label="에디터">
                                    <NavLink to="editor-overview" label="에디터 개요" indent />
                                    <NavLink to="editor-timeline" label="타임라인 편집" indent />
                                    <NavLink to="editor-preview" label="비디오 프리뷰" indent />
                                </NavGroup>
                                <NavGroup label="AI 기능">
                                    <NavLink to="ai-stt" label="AI STT 자막" indent />
                                    <NavLink to="ai-translation" label="AI 번역" indent />
                                </NavGroup>
                                <NavLink to="subtitle-styling" label="자막 스타일링" />
                                <NavLink to="export" label="내보내기" />
                            </nav>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <article className="prose prose-slate dark:prose-invert max-w-none flex-1">
                    {/* Introduction */}
                    <Section id="intro" icon={<BookOpen className="w-8 h-8 text-primary" />} title="AI Sub Auto 문서">
                        <p className="lead text-xl text-muted-foreground">
                            AI Sub Auto는 인공지능을 활용하여 영상의 자막 작업을 자동화하고,
                            강력한 편집 도구를 통해 고품질의 콘텐츠를 빠르게 제작할 수 있도록 돕는 서비스입니다.
                        </p>
                        <p>
                            이 문서는 AI Sub Auto의 모든 기능과 사용 방법을 상세하게 설명합니다.
                            처음 사용하시는 분들부터 고급 기능을 활용하고자 하는 전문가까지 유용한 정보를 찾으실 수 있습니다.
                        </p>

                        <div className="grid md:grid-cols-3 gap-4 not-prose my-8">
                            <QuickLinkCard
                                icon={<FolderOpen className="w-5 h-5" />}
                                title="프로젝트 시작"
                                description="새 프로젝트 생성부터 어셋 업로드까지"
                                to="project-creation"
                            />
                            <QuickLinkCard
                                icon={<Wand2 className="w-5 h-5" />}
                                title="AI 자막 생성"
                                description="자동 음성 인식과 번역 기능"
                                to="ai-stt"
                            />
                            <QuickLinkCard
                                icon={<Download className="w-5 h-5" />}
                                title="내보내기"
                                description="SRT, VTT, MP4 형식으로 저장"
                                to="export"
                            />
                        </div>
                    </Section>

                    {/* 시작하기 */}
                    <Section id="getting-started" icon={<MonitorPlay className="w-6 h-6" />} title="시작하기">
                        <h3>1. 계정 생성 및 로그인</h3>
                        <p>
                            서비스를 이용하기 위해 먼저 계정을 생성해야 합니다.
                            메인 페이지의 &apos;무료로 시작하기&apos; 버튼을 클릭하여 회원가입을 진행할 수 있습니다.
                        </p>
                        <div className="bg-muted p-4 rounded-lg not-prose mb-6">
                            <h4 className="font-semibold mb-3">지원 로그인 방식</h4>
                            <div className="flex flex-wrap gap-3">
                                <span className="px-3 py-1 bg-background rounded-full text-sm border">이메일 가입</span>
                                <span className="px-3 py-1 bg-background rounded-full text-sm border">Google 소셜 로그인</span>
                            </div>
                        </div>

                        <h3>2. 대시보드 둘러보기</h3>
                        <p>
                            로그인 후 가장 먼저 만나게 되는 대시보드에서는 최근 프로젝트 목록, 사용량 통계,
                            그리고 새로운 작업을 시작할 수 있는 퀵 액션 버튼을 확인할 수 있습니다.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 not-prose my-6">
                            <FeatureCard
                                icon={<Layers className="w-5 h-5" />}
                                title="프로젝트 목록"
                                description="생성한 모든 프로젝트를 한눈에 확인하고 관리할 수 있습니다."
                            />
                            <FeatureCard
                                icon={<Clock className="w-5 h-5" />}
                                title="최근 작업"
                                description="최근에 작업한 프로젝트에 빠르게 접근할 수 있습니다."
                            />
                        </div>
                    </Section>

                    {/* 프로젝트 생성 */}
                    <Section id="project-creation" icon={<FolderOpen className="w-6 h-6" />} title="프로젝트 생성">
                        <p>
                            새로운 자막 작업을 시작하려면 먼저 프로젝트를 생성해야 합니다.
                            프로젝트는 영상과 자막, 설정을 하나로 묶어 관리하는 단위입니다.
                        </p>

                        <h3>프로젝트 생성 단계</h3>
                        <div className="not-prose my-6">
                            <StepList steps={[
                                { title: "New Project 클릭", desc: "대시보드 우측 상단의 'New Project' 버튼을 클릭합니다." },
                                { title: "프로젝트 이름 입력", desc: "프로젝트를 식별할 수 있는 이름을 입력합니다." },
                                { title: "영상 소스 선택", desc: "YouTube URL을 입력하거나 로컬 파일을 업로드합니다." },
                                { title: "생성 완료", desc: "프로젝트가 생성되면 에디터 화면으로 이동합니다." },
                            ]} />
                        </div>

                        <h3>영상 소스 옵션</h3>
                        <div className="grid md:grid-cols-2 gap-4 not-prose my-6">
                            <FeatureCard
                                icon={<Upload className="w-5 h-5" />}
                                title="로컬 파일 업로드"
                                description="컴퓨터에 저장된 영상 파일을 직접 업로드합니다. MP4, MOV, MKV, WebM 등 다양한 포맷을 지원합니다."
                            />
                            <FeatureCard
                                icon={<LinkIcon className="w-5 h-5" />}
                                title="YouTube URL"
                                description="YouTube 영상 URL을 입력하면 자동으로 영상을 가져와 작업을 시작합니다."
                            />
                        </div>

                        <h3>지원 비디오 포맷</h3>
                        <div className="bg-muted p-4 rounded-lg not-prose">
                            <div className="flex flex-wrap gap-2">
                                {["MP4", "MOV", "MKV", "WebM", "AVI", "FLV"].map((fmt) => (
                                    <span key={fmt} className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-medium">
                                        {fmt}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Section>

                    {/* 어셋 업로드 */}
                    <Section id="asset-upload" icon={<Upload className="w-6 h-6" />} title="어셋 업로드">
                        <p>
                            어셋은 프로젝트에서 사용하는 영상 파일을 의미합니다.
                            하나의 프로젝트에 여러 어셋을 업로드하여 관리할 수 있습니다.
                        </p>

                        <h3>로컬 파일 업로드</h3>
                        <div className="not-prose my-6">
                            <StepList steps={[
                                { title: "업로드 버튼 클릭", desc: "에디터 좌측 소스 패널의 '+' 버튼을 클릭합니다." },
                                { title: "파일 선택", desc: "파일 선택 대화상자에서 업로드할 영상을 선택합니다. 드래그 앤 드롭도 지원합니다." },
                                { title: "업로드 진행", desc: "프로그레스 바로 업로드 상태를 확인할 수 있습니다." },
                                { title: "완료", desc: "업로드가 완료되면 소스 목록에 어셋이 추가됩니다." },
                            ]} />
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg not-prose my-6">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">파일 크기 제한</h4>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                        플랜에 따라 업로드 가능한 파일 크기가 다릅니다. Free 플랜은 최대 500MB, Pro 플랜은 최대 5GB까지 지원합니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <h3>YouTube URL 가져오기</h3>
                        <div className="not-prose my-6">
                            <StepList steps={[
                                { title: "URL 입력 모드 선택", desc: "소스 패널에서 링크 아이콘을 클릭합니다." },
                                { title: "URL 붙여넣기", desc: "YouTube 영상 URL을 입력 필드에 붙여넣습니다." },
                                { title: "가져오기", desc: "엔터 키 또는 확인 버튼을 누르면 영상을 가져옵니다." },
                            ]} />
                        </div>

                        <div className="bg-muted p-4 rounded-lg not-prose">
                            <h4 className="font-semibold mb-2">지원되는 YouTube URL 형식</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                <li><code className="bg-background px-1 rounded">https://www.youtube.com/watch?v=VIDEO_ID</code></li>
                                <li><code className="bg-background px-1 rounded">https://youtu.be/VIDEO_ID</code></li>
                            </ul>
                        </div>
                    </Section>

                    {/* 어셋 관리 */}
                    <Section id="asset-management" icon={<FileVideo className="w-6 h-6" />} title="어셋 관리">
                        <p>
                            업로드된 어셋들은 에디터 좌측의 소스 패널에서 관리할 수 있습니다.
                        </p>

                        <h3>소스 패널 기능</h3>
                        <div className="grid md:grid-cols-2 gap-4 not-prose my-6">
                            <FeatureCard
                                icon={<FileVideo className="w-5 h-5" />}
                                title="어셋 목록"
                                description="프로젝트에 업로드된 모든 어셋을 확인합니다. 파일명, 크기, 업로드 상태를 한눈에 볼 수 있습니다."
                            />
                            <FeatureCard
                                icon={<CheckCircle2 className="w-5 h-5" />}
                                title="어셋 선택"
                                description="어셋을 클릭하면 해당 영상이 프리뷰에 로드되고 타임라인에서 편집할 수 있습니다."
                            />
                            <FeatureCard
                                icon={<Trash2 className="w-5 h-5" />}
                                title="어셋 삭제"
                                description="더 이상 필요 없는 어셋은 삭제 버튼으로 제거할 수 있습니다."
                            />
                            <FeatureCard
                                icon={<Settings className="w-5 h-5" />}
                                title="어셋 정보"
                                description="어셋의 상세 정보(파일명, 크기, 형식, 길이)를 확인할 수 있습니다."
                            />
                        </div>

                        <h3>어셋 상태 표시</h3>
                        <div className="not-prose my-6">
                            <div className="grid grid-cols-3 gap-3">
                                <StatusBadge status="ready" label="준비됨" desc="편집 가능한 상태" />
                                <StatusBadge status="processing" label="처리 중" desc="업로드/변환 진행 중" />
                                <StatusBadge status="error" label="오류" desc="문제 발생, 재업로드 필요" />
                            </div>
                        </div>
                    </Section>

                    {/* 에디터 개요 */}
                    <Section id="editor-overview" icon={<Wand2 className="w-6 h-6" />} title="에디터 개요">
                        <p>
                            AI Sub Auto의 스마트 에디터는 영상 편집과 자막 작업을 하나의 화면에서 처리할 수 있는 통합 도구입니다.
                        </p>

                        <h3>에디터 레이아웃</h3>
                        <div className="bg-muted p-6 rounded-lg not-prose my-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-background p-4 rounded-lg border">
                                    <Layers className="w-6 h-6 mx-auto mb-2 text-primary" />
                                    <h4 className="font-semibold">좌측 패널</h4>
                                    <p className="text-sm text-muted-foreground mt-1">소스(어셋) 목록</p>
                                </div>
                                <div className="bg-background p-4 rounded-lg border-2 border-primary">
                                    <Video className="w-6 h-6 mx-auto mb-2 text-primary" />
                                    <h4 className="font-semibold">중앙 영역</h4>
                                    <p className="text-sm text-muted-foreground mt-1">비디오 프리뷰 + 타임라인</p>
                                </div>
                                <div className="bg-background p-4 rounded-lg border">
                                    <Type className="w-6 h-6 mx-auto mb-2 text-primary" />
                                    <h4 className="font-semibold">우측 패널</h4>
                                    <p className="text-sm text-muted-foreground mt-1">자막 편집 / 디자인</p>
                                </div>
                            </div>
                        </div>

                        <h3>주요 구성 요소</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>소스 패널:</strong> 프로젝트에 업로드된 어셋 목록을 관리합니다.</li>
                            <li><strong>비디오 프리뷰:</strong> 현재 영상을 미리보고 자막이 적용된 결과를 확인합니다.</li>
                            <li><strong>타임라인:</strong> 클립을 배치하고 자르기, 이동 등의 편집을 수행합니다.</li>
                            <li><strong>자막 리스트:</strong> 생성된 자막을 시간순으로 확인하고 수정합니다.</li>
                            <li><strong>디자인 패널:</strong> 자막의 폰트, 색상, 위치 등을 설정합니다.</li>
                        </ul>
                    </Section>

                    {/* 타임라인 편집 */}
                    <Section id="editor-timeline" icon={<Scissors className="w-6 h-6" />} title="타임라인 편집">
                        <p>
                            타임라인에서는 영상 클립을 시각적으로 편집할 수 있습니다.
                            불필요한 부분을 잘라내거나 클립의 순서를 변경할 수 있습니다.
                        </p>

                        <h3>타임라인 컨트롤</h3>
                        <div className="grid md:grid-cols-2 gap-4 not-prose my-6">
                            <FeatureCard
                                icon={<Scissors className="w-5 h-5" />}
                                title="클립 자르기 (Split)"
                                description="재생 헤드 위치에서 클립을 두 부분으로 나눕니다. 단축키: S"
                            />
                            <FeatureCard
                                icon={<Trash2 className="w-5 h-5" />}
                                title="클립 삭제"
                                description="선택한 클립을 타임라인에서 제거합니다. 단축키: Delete"
                            />
                            <FeatureCard
                                icon={<Move className="w-5 h-5" />}
                                title="클립 이동"
                                description="클립을 드래그하여 타임라인 내에서 위치를 변경합니다."
                            />
                            <FeatureCard
                                icon={<ArrowRight className="w-5 h-5" />}
                                title="트림(Trim)"
                                description="클립의 시작점/끝점을 드래그하여 길이를 조절합니다."
                            />
                        </div>

                        <h3>키보드 단축키</h3>
                        <div className="bg-muted p-4 rounded-lg not-prose">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <ShortcutItem keys={["Space"]} action="재생/일시정지" />
                                <ShortcutItem keys={["S"]} action="클립 자르기" />
                                <ShortcutItem keys={["Delete"]} action="클립 삭제" />
                                <ShortcutItem keys={["←", "→"]} action="프레임 이동" />
                                <ShortcutItem keys={["Ctrl", "S"]} action="저장" />
                                <ShortcutItem keys={["Ctrl", "Z"]} action="실행 취소" />
                            </div>
                        </div>
                    </Section>

                    {/* 비디오 프리뷰 */}
                    <Section id="editor-preview" icon={<Video className="w-6 h-6" />} title="비디오 프리뷰">
                        <p>
                            중앙의 비디오 프리뷰 영역에서는 영상을 재생하고 자막이 적용된 결과를 실시간으로 확인할 수 있습니다.
                        </p>

                        <h3>프리뷰 컨트롤</h3>
                        <div className="grid md:grid-cols-3 gap-4 not-prose my-6">
                            <FeatureCard
                                icon={<Play className="w-5 h-5" />}
                                title="재생 컨트롤"
                                description="재생, 일시정지, 앞/뒤로 이동 등 기본 재생 컨트롤을 제공합니다."
                            />
                            <FeatureCard
                                icon={<SkipBack className="w-5 h-5" />}
                                title="구간 이동"
                                description="자막 구간 단위로 빠르게 이동하여 편집할 수 있습니다."
                            />
                            <FeatureCard
                                icon={<Crop className="w-5 h-5" />}
                                title="크롭 모드"
                                description="영상의 비율을 변경하거나 특정 영역만 잘라낼 수 있습니다."
                            />
                        </div>

                        <h3>영상 크롭 (Cropping)</h3>
                        <p>
                            다양한 소셜 미디어 플랫폼에 맞춰 영상의 비율을 변경할 수 있습니다.
                        </p>
                        <div className="bg-muted p-4 rounded-lg not-prose my-6">
                            <h4 className="font-semibold mb-3">프리셋 비율</h4>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { ratio: "16:9", desc: "유튜브, 일반 영상" },
                                    { ratio: "9:16", desc: "쇼츠, 릴스, TikTok" },
                                    { ratio: "1:1", desc: "인스타그램 피드" },
                                    { ratio: "4:5", desc: "인스타그램 세로" },
                                ].map((item) => (
                                    <div key={item.ratio} className="bg-background px-3 py-2 rounded-lg border text-center">
                                        <div className="font-semibold">{item.ratio}</div>
                                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Section>

                    {/* AI STT 자막 */}
                    <Section id="ai-stt" icon={<Mic className="w-6 h-6" />} title="AI STT 자막">
                        <p>
                            AI Sub Auto는 최신 음성 인식 기술을 활용하여 영상의 음성을 자동으로 텍스트로 변환(STT: Speech-to-Text)합니다.
                        </p>

                        <h3>자막 생성 프로세스</h3>
                        <div className="not-prose my-6">
                            <StepList steps={[
                                { title: "자막 생성 시작", desc: "'자막 생성' 버튼을 클릭하여 AI 분석을 시작합니다." },
                                { title: "음성 분석 중", desc: "AI가 영상의 음성을 분석합니다. 영상 길이에 따라 시간이 소요됩니다." },
                                { title: "자막 생성 완료", desc: "타임코드가 포함된 자막이 자동으로 생성됩니다." },
                                { title: "편집 및 검토", desc: "생성된 자막을 확인하고 필요한 부분을 수정합니다." },
                            ]} />
                        </div>

                        <h3>지원 언어</h3>
                        <div className="bg-muted p-4 rounded-lg not-prose my-6">
                            <div className="flex flex-wrap gap-2">
                                {["한국어", "English", "日本語", "中文", "Español", "Français", "Deutsch"].map((lang) => (
                                    <span key={lang} className="px-3 py-1 bg-background rounded-full text-sm border">
                                        {lang}
                                    </span>
                                ))}
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20">
                                    +90개 이상
                                </span>
                            </div>
                        </div>

                        <h3>STT 정확도 향상 팁</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>영상의 오디오 품질이 높을수록 인식률이 향상됩니다.</li>
                            <li>배경 음악이나 노이즈가 적은 영상이 더 정확한 결과를 얻습니다.</li>
                            <li>발음이 명확한 영상일수록 좋은 결과를 기대할 수 있습니다.</li>
                        </ul>
                    </Section>

                    {/* AI 번역 */}
                    <Section id="ai-translation" icon={<Languages className="w-6 h-6" />} title="AI 번역">
                        <p>
                            생성된 자막을 다양한 언어로 자동 번역할 수 있습니다.
                            글로벌 콘텐츠 제작에 필수적인 기능입니다.
                        </p>

                        <h3>번역 워크플로우</h3>
                        <div className="not-prose my-6">
                            <StepList steps={[
                                { title: "원본 자막 준비", desc: "STT로 생성되었거나 직접 입력한 원본 자막이 필요합니다." },
                                { title: "타겟 언어 선택", desc: "번역할 대상 언어를 선택합니다." },
                                { title: "번역 실행", desc: "AI가 자막을 선택한 언어로 번역합니다." },
                                { title: "번역 검토", desc: "번역된 결과를 확인하고 필요시 수정합니다." },
                            ]} />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 not-prose my-6">
                            <FeatureCard
                                icon={<Globe className="w-5 h-5" />}
                                title="다국어 지원"
                                description="90개 이상의 언어 간 번역을 지원합니다. 주요 언어는 물론 소수 언어도 지원합니다."
                            />
                            <FeatureCard
                                icon={<CheckCircle2 className="w-5 h-5" />}
                                title="문맥 기반 번역"
                                description="단순 단어 치환이 아닌 문맥을 이해한 자연스러운 번역을 제공합니다."
                            />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg not-prose">
                            <div className="flex gap-3">
                                <Globe className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">번역 후편집 권장</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        AI 번역은 높은 품질을 제공하지만, 전문 용어나 고유명사는 수동 검토를 권장합니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* 자막 스타일링 */}
                    <Section id="subtitle-styling" icon={<Palette className="w-6 h-6" />} title="자막 스타일링">
                        <p>
                            영상의 분위기에 맞는 자막 스타일을 설정하세요.
                            폰트, 색상, 위치 등 다양한 옵션을 커스터마이징할 수 있습니다.
                        </p>

                        <h3>폰트 설정</h3>
                        <div className="grid md:grid-cols-2 gap-4 not-prose my-6">
                            <FeatureCard
                                icon={<Type className="w-5 h-5" />}
                                title="폰트 종류"
                                description="다양한 한글/영문 폰트를 제공합니다. 영상 분위기에 맞는 폰트를 선택하세요."
                            />
                            <FeatureCard
                                icon={<Type className="w-5 h-5" />}
                                title="폰트 크기"
                                description="슬라이더로 자막 크기를 조절합니다. 플랫폼에 맞는 적절한 크기를 선택하세요."
                            />
                        </div>

                        <h3>색상 설정</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>글자 색상 (Primary):</strong> 자막 텍스트의 기본 색상을 설정합니다.</li>
                            <li><strong>외곽선 색상 (Stroke):</strong> 글자 외곽선의 색상을 지정합니다. 가독성 향상에 효과적입니다.</li>
                            <li><strong>배경 색상:</strong> 자막 뒤에 배경 박스를 추가할 수 있습니다.</li>
                        </ul>

                        <h3>외곽선 설정</h3>
                        <div className="bg-muted p-4 rounded-lg not-prose my-6">
                            <div className="flex flex-wrap gap-6">
                                <div>
                                    <h4 className="font-semibold mb-2">외곽선 두께</h4>
                                    <p className="text-sm text-muted-foreground">0px ~ 10px 범위에서 조절 가능</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">외곽선 색상</h4>
                                    <p className="text-sm text-muted-foreground">컬러 피커로 자유롭게 선택</p>
                                </div>
                            </div>
                        </div>

                        <h3>위치 설정</h3>
                        <div className="grid grid-cols-3 gap-3 not-prose my-6">
                            <div className="bg-muted p-4 rounded-lg text-center border hover:border-primary transition-colors cursor-pointer">
                                <div className="font-semibold">상단</div>
                                <p className="text-xs text-muted-foreground mt-1">Top</p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg text-center border-2 border-primary">
                                <div className="font-semibold">중앙</div>
                                <p className="text-xs text-muted-foreground mt-1">Center</p>
                            </div>
                            <div className="bg-muted p-4 rounded-lg text-center border hover:border-primary transition-colors cursor-pointer">
                                <div className="font-semibold">하단</div>
                                <p className="text-xs text-muted-foreground mt-1">Bottom (기본값)</p>
                            </div>
                        </div>

                        <p>
                            Y축 오프셋을 통해 위치를 미세하게 조정할 수도 있습니다.
                        </p>
                    </Section>

                    {/* 내보내기 */}
                    <Section id="export" icon={<Download className="w-6 h-6" />} title="내보내기">
                        <p>
                            작업이 완료되면 다양한 형태로 결과물을 다운로드할 수 있습니다.
                        </p>

                        <h3>지원 포맷</h3>
                        <div className="bg-muted p-6 rounded-lg not-prose my-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FormatCard
                                    ext="SRT"
                                    desc="가장 널리 쓰이는 자막 파일 포맷. 대부분의 미디어 플레이어와 플랫폼에서 지원합니다."
                                />
                                <FormatCard
                                    ext="VTT"
                                    desc="웹 환경에 최적화된 자막 포맷. HTML5 비디오에서 기본 지원됩니다."
                                />
                                <FormatCard
                                    ext="MP4"
                                    desc="자막이 영상에 함께 입혀진(Burn-in) 완성본. 별도 자막 파일 없이 재생 가능합니다."
                                />
                            </div>
                        </div>

                        <h3>내보내기 단계</h3>
                        <div className="not-prose my-6">
                            <StepList steps={[
                                { title: "저장 확인", desc: "내보내기 전 현재 작업 상태가 저장되었는지 확인합니다." },
                                { title: "포맷 선택", desc: "SRT, VTT, MP4 중 원하는 형식을 선택합니다." },
                                { title: "설정 확인", desc: "자막 스타일, 크롭 설정 등이 올바른지 최종 확인합니다." },
                                { title: "다운로드", desc: "파일이 생성되면 자동으로 다운로드가 시작됩니다." },
                            ]} />
                        </div>

                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-lg not-prose">
                            <div className="flex gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-green-800 dark:text-green-200">MP4 Burn-in 안내</h4>
                                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                        MP4로 내보내면 자막이 영상에 영구적으로 삽입됩니다.
                                        나중에 자막을 수정하려면 SRT/VTT 파일도 함께 보관하세요.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Section>

                </article>
            </main>

            <Footer />
        </div>
    );
}

// Helper Components
function Section({ id, icon, title, children }: { id: string, icon: React.ReactNode, title: string, children: React.ReactNode }) {
    return (
        <section id={id} className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {icon}
                </div>
                <h2 className="text-3xl font-bold m-0">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function NavLink({ to, label, indent }: { to: string, label: string, indent?: boolean }) {
    return (
        <ScrollLink
            to={to}
            smooth={true}
            offset={-100}
            duration={500}
            className={`block text-sm text-muted-foreground hover:text-primary hover:border-l-2 hover:border-primary py-1.5 cursor-pointer transition-all border-l-2 border-transparent ${indent ? 'pl-6' : 'pl-4'}`}
            activeClass="!text-primary font-medium !border-primary bg-primary/5"
            spy={true}
        >
            {label}
        </ScrollLink>
    );
}

function NavGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="mt-3 first:mt-0">
            <div className="text-xs font-semibold text-muted-foreground/60 pl-4 py-1 uppercase tracking-wider">{label}</div>
            {children}
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-5 border rounded-xl bg-card hover:shadow-md transition-shadow">
            <div className="mb-3 text-primary">{icon}</div>
            <h4 className="text-base font-semibold mb-2">{title}</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
    );
}

function QuickLinkCard({ icon, title, description, to }: { icon: React.ReactNode, title: string, description: string, to: string }) {
    return (
        <ScrollLink
            to={to}
            smooth={true}
            offset={-100}
            duration={500}
            className="block p-5 border rounded-xl bg-card hover:shadow-md hover:border-primary transition-all cursor-pointer group"
        >
            <div className="mb-3 text-primary group-hover:scale-110 transition-transform">{icon}</div>
            <h4 className="text-base font-semibold mb-1 group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-muted-foreground text-sm">{description}</p>
        </ScrollLink>
    );
}

function FormatCard({ ext, desc }: { ext: string, desc: string }) {
    return (
        <div className="bg-background border rounded-lg p-4">
            <span className="inline-block px-3 py-1 rounded bg-primary text-primary-foreground font-bold text-sm mb-3">{ext}</span>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    );
}

function StepList({ steps }: { steps: { title: string, desc: string }[] }) {
    return (
        <div className="space-y-4">
            {steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                        {idx + 1}
                    </div>
                    <div>
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ShortcutItem({ keys, action }: { keys: string[], action: string }) {
    return (
        <div className="flex items-center justify-between gap-2 bg-background p-2 rounded">
            <div className="flex gap-1">
                {keys.map((key, idx) => (
                    <span key={idx}>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{key}</kbd>
                        {idx < keys.length - 1 && <span className="mx-1 text-muted-foreground">+</span>}
                    </span>
                ))}
            </div>
            <span className="text-muted-foreground">{action}</span>
        </div>
    );
}

function StatusBadge({ status, label, desc }: { status: "ready" | "processing" | "error", label: string, desc: string }) {
    const colors = {
        ready: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
        processing: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        error: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    };
    const icons = {
        ready: <CheckCircle2 className="w-4 h-4" />,
        processing: <Clock className="w-4 h-4" />,
        error: <AlertCircle className="w-4 h-4" />,
    };

    return (
        <div className={`p-3 rounded-lg border ${colors[status]}`}>
            <div className="flex items-center gap-2 mb-1">
                {icons[status]}
                <span className="font-semibold text-sm">{label}</span>
            </div>
            <p className="text-xs opacity-80">{desc}</p>
        </div>
    );
}
