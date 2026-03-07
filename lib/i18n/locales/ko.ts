export const ko = {
  common: {
    login: "로그인",
    signup: "무료로 시작",
    logout: "로그아웃",
    dashboard: "대시보드",
    settings: "설정",
    pricing: "요금제",
    docs: "문서",
    features: "기능",
    howItWorks: "작동 방식",
    useCases: "활용 사례",
    workspace: "공용 워크스페이스",
    nav: {
      dashboard: "대시보드",
      projects: "프로젝트",
      api: "API",
      editor: "에디터",
      mediaAssets: "미디어 에셋",
      exportHistory: "내보내기 기록",
      projectSettings: "프로젝트 설정",
      usage: "사용량",
      billing: "결제",
      security: "보안"
    },
    footer: {
      copyright: "© {year} AutoSubAI · All rights reserved",
      dashboard: "대시보드"
    },
    layout: {
      console: "콘솔",
      dashboard: "대시보드"
    }
  },
  landing: {
    hero: {
      eyebrow: "AI-Powered Subtitle Automation",
      h1: "업로드만 하면 자막이 자동으로 완성됩니다.",
      sub: "AI가 음성을 인식하고, 번역하고, 스타일링까지. 한 번의 클릭으로 SRT, VTT, 자막 입힌 MP4까지 바로 받아보세요.",
      primaryCta: "무료로 시작하기",
      secondaryCta: "기능 살펴보기",
      bullets: [
        "AI 음성 인식 90개+ 언어 지원",
        "실시간 자막 편집 & 스타일 커스텀",
        "SRT · VTT · MP4 Burn-in Export"
      ],
      stats: {
        languages: "90+ 지원 언어",
        timeSaved: "월 평균 40시간 절약",
        accuracy: "99.2% STT 정확도",
        trustedBy: "이미 수천 명의 크리에이터가 사용 중입니다"
      }
    },
    features: {
      title: "주요 기능",
      subtitle: "완벽한 자막 작업을 위한 모든 것",
      items: {
        editor: {
          title: "직관적인 편집 인터페이스",
          description: "전문 영상 편집 소프트웨어 수준의 타임라인과 실시간 미리보기를 통해 누구나 쉽게 자막을 다듬을 수 있습니다."
        },
        aiEditor: {
          title: "AI 스마트 에디터",
          description: "타임라인에서 실시간 편집. 자막 수정, 싱크 조정, 스타일 미리보기를 한 화면에서."
        },
        export: {
          title: "다양한 Export",
          description: "SRT, VTT 자막 파일은 물론, 자막이 입혀진 MP4 영상까지 원클릭 다운로드."
        },
        style: {
          title: "스타일 프리셋",
          description: "폰트, 색상, 외곽선, 위치를 자유롭게. 프리셋으로 저장해서 일관된 스타일 적용."
        },
        dashboard: {
          title: "사용량 대시보드",
          description: "플랜별 사용량(분/작업수)을 실시간 추적. 비용을 투명하게 관리하세요."
        },
        api: {
          title: "API & Webhook",
          description: "업로드부터 완료까지 이벤트 훅으로 자동화. 외부 시스템과 쉽게 연동."
        }
      }
    },
    pricing: {
      title: "필요에 맞는 플랜을 선택하세요",
      subtitle: "모든 플랜에 기본 STT와 편집 기능이 포함됩니다. 사용량과 비용은 투명하게 표시됩니다.",
      monthly: "월간",
      yearly: "연간",
      discount: "-20%",
      monthlyNote: "월간 결제",
      yearlyNote: "연간 결제 시 약 20% 할인",
      popular: "인기",
      perMonth: "/월",
      perMonthYearly: "/월 (연간)",
      comparison: {
        toggleShow: "플랜 상세 비교표 보기",
        toggleHide: "비교표 접기",
        features: "Features"
      },
      usage: {
        title: "사용량 기준 안내",
        items: {
          processing: {
            label: "Processing",
            desc: "자막 생성 및 번역 시 분당 0.2 크레딧이 소모됩니다."
          },
          export: {
            label: "Export",
            desc: "렌더링 시 화질과 효과 티어에 따라 분당 크레딧이 차감됩니다."
          },
          storage: {
            label: "저장 기간",
            desc: "결과물은 플랜별로 7일에서 최대 90일까지 보관됩니다."
          }
        }
      }
    },
    faq: {
      title: "FAQ",
      subtitle: "결제/품질/보관/편집 범위에서 많이 나오는 질문을 미리 정리했습니다.",
      items: [
        { q: "지원 언어와 정확도는 어떤가요?", a: "한국어, 영어, 일본어, 중국어 등 90개 이상의 언어를 지원합니다. STT 정확도는 평균 99% 이상이며, 전문 용어는 수동 교정 기능으로 보완할 수 있습니다." },
        { q: "긴 영상이나 대량 업로드도 가능한가요?", a: "직관적인 편집 인터페이스로 긴 영상도 빠르게 작업할 수 있습니다. Pro 플랜 기준 월 1,000분까지 처리 가능하며, Enterprise는 무제한입니다." },
        { q: "내보내기 포맷은 무엇을 지원하나요?", a: "SRT, VTT 자막 파일과 함께, 자막이 영상에 입혀진(Burn-in) MP4 파일도 다운로드할 수 있습니다." },
        { q: "파일은 어디에 저장되고 얼마나 보관되나요?", a: "모든 파일은 암호화되어 안전하게 저장됩니다. Free 플랜은 7일, 유료 플랜은 90일간 보관됩니다." },
        { q: "결제/플랜 변경은 어떻게 되나요?", a: "언제든 업/다운그레이드가 가능하며, 일할 계산으로 자동 정산됩니다. 환불 정책은 가입 후 7일 이내 전액 환불입니다." },
        { q: "팀원과 함께 사용할 수 있나요?", a: "Pro 이상 플랜에서 팀 기능을 지원합니다. 프로젝트 공유, 권한 관리, 협업 기능을 사용할 수 있습니다." }
      ]
    },
    cta: {
      badge: "무료로 시작하세요",
      title: "지금 바로 자막 자동화를 시작하세요",
      subtitle: "수천 명의 크리에이터와 함께 매주 수십 시간을 절약해보세요.",
      primary: "무료로 시작하기",
      secondary: "요금제 보기",
      disclaimer: "신용카드 없이 시작 · 언제든 취소 가능"
    },
    footer: {
      tagline: "AI-Powered Subtitle Automation",
      product: "제품",
      company: "회사",
      legal: "법적 고지",
      links: {
        features: "주요 기능",
        pricing: "요금제",
        docs: "문서",
        privacy: "개인정보 처리방침",
        terms: "이용 약관"
      }
    }
  },
  dashboard: {
      welcome: "다시 오신 것을 환영합니다",
      overview: "메인 콘솔 개요",
      stats: {
        totalProjects: "전체 프로젝트",
        activeJobs: "진행 중인 작업",
        creditsUsed: "보유 크레딧",
        monthlyusage: "이번 달 사용량",
        used: "사용됨",
        limit: "한도",
        accountStatus: "계정 상태",
        proPlan: "프로 플랜",
        proPlanDesc: "무제한 번역과 우선 처리를 즐겨보세요.",
        viewSettings: "계정 설정 보기",
        topUp: "크레딧 충전"
      },
      quickActions: {
        title: "빠른 작업",
        newProject: "새 프로젝트",
        uploadVideo: "비디오 업로드",
        recentFiles: "최근 파일",
        checkUsage: "사용량 확인",
        managePlan: "플랜 관리",
        tutorials: "튜토리얼"
      },
      empty: {
        title: "아직 프로젝트가 없습니다",
        description: "첫 번째 프로젝트를 생성하여 자막 자동화를 시작해보세요.",
        cta: "프로젝트 생성"
      },
      actionNeeded: {
        title: "계속 작업하기",
        badge: "최근 활동",
        cta: "에디터 열기",
        resume: "마지막으로 작업한 곳에서 재개하세요. 최근 업데이트: {date}"
      },
      recentProjects: {
        title: "최근 프로젝트",
        viewAll: "모두 보기",
        active: "활성"
      },
      tips: {
        title: "팁 및 업데이트",
        didYouKnow: {
          title: "알고 계셨나요?",
          desc: "원클릭으로 자막을 여러 언어로 자동 변역할 수 있습니다.",
          cta: "번역 기능 알아보기"
        },
        shortcuts: {
          title: "꿀팁: 단축키 활용",
          desc: "에디터에서 {k}로 재생/일시정지, {j}/{l}로 앞뒤 탐색이 가능합니다.",
          cta: "모든 단축키 보기"
        }
      },
      admin: {
        title: "관리자 콘솔",
        subtitle: "내부 운영 및 거버넌스",
        refresh: "데이터 새로고침",
        tabs: {
          overview: "개요",
          users: "사용자",
          jobs: "활동 내역"
        },
        stats: {
          totalUsers: "전체 사용자",
          totalProjects: "전체 프로젝트",
          totalJobs: "전체 작업",
          activeJobs: "활성 작업"
        },
        overview: {
          distribution: "상태별 분포",
          health: "시스템 상태",
          latency: "API 지연 시간",
          uptime: "워커 가동 시간",
          dbConnections: "DB 연결",
          operational: "모든 시스템 정상 작동 중"
        },
        users: {
          title: "사용자 디렉토리",
          search: "이메일로 검색...",
          table: {
            user: "사용자",
            created: "생성일",
            lastSignIn: "마지막 로그인",
            privileges: "권한",
            actions: "작업"
          },
          superAdmin: "슈퍼 관리자",
          userRole: "일반 사용자",
          never: "없음"
        },
        jobs: {
          title: "최근 시스템 작업",
          table: {
            resource: "ID / 리소스",
            status: "상태",
            created: "생성 시간",
            reference: "참조"
          }
        }
      },
      project: {
        sidebar: {
          admin: "프로젝트 관리",
          mainConsole: "메인 콘솔",
          settings: "설정"
        },
        overview: {
          title: "프로젝트 대시보드",
          recentAssets: "최근 에셋",
          noAssets: "에셋을 찾을 수 없습니다.",
          units: {
            bytes: "바이트",
            kb: "KB",
            mb: "MB",
            gb: "GB",
            tb: "TB"
          },
          stats: {
            assets: "전체 프로젝트 에셋",
            jobs: "전체 작업",
            completed: "내보내기 완료",
            updated: "최근 업데이트"
          },
          quickActions: {
            title: "빠른 작업",
            upload: "미디어 업로드",
            editor: "에디터 열기",
            exports: "내보내기 보기",
            settings: "설정"
          }
        },
        empty: {
          title: "새 프로젝트에 오신 것을 환영합니다!",
          description: "이 프로젝트는 현재 비어 있습니다. 첫 번째 비디오 또는 오디오 파일을 업로드하여 자막 마법을 시작하세요.",
          upload: "미디어 업로드",
          openEditor: "에디터 열기"
        },
        activities: {
          title: "최근 활동",
          noActivities: "최근 활동 내역이 없습니다.",
          untitled: "제목 없는 작업",
          downloadSrt: "SRT 다운로드",
          download: "다운로드"
        }
      },
      projects: {
        title: "프로젝트",
        subtitle: "비디오 프로젝트와 대기열을 관리하세요.",
        newProject: "새 프로젝트",
        noProjects: "프로젝트가없습니다",
        noProjectsDesc: "새 프로젝트를 생성하여 시작해보세요.",
        empty: {
          title: "새 프로젝트에 오신 것을 환영합니다!",
          description: "이 프로젝트는 현재 비어 있습니다. 첫 번째 비디오 또는 오디오 파일을 업로드하여 자막 마법을 시작하세요.",
          upload: "미디어 업로드",
          openEditor: "에디터 열기"
        }
      },
      profile: {
        title: "프로필 정보",
        subtitle: "개인 정보 및 계정 상세 정보를 관리하세요.",
        name: "성함",
        namePlaceholder: "이름을 입력하세요",
        email: "이메일 주소",
        emailNote: "이메일은 변경할 수 없습니다.",
        company: "회사/팀",
        companyPlaceholder: "(선택 사항)",
        save: "변경 사항 저장",
        saved: "저장됨",
        overview: "계정 개요",
        plan: "현재 플랜",
        joined: "가입일",
        lastActivity: "마지막 활동",
        userId: "사용자 ID",
        migrationNote: "귀하의 계정은 {email}을(를) 사용하여 생성되었습니다. 데이터 마이그레이션이나 로그인 제공업체 변경이 필요한 경우 고객 지원에 문의하세요.",
        dangerZone: "위험 구역",
        deleteDesc: "계정을 삭제하면 되돌릴 수 없습니다. 모든 데이터, 프로젝트 및 내보내기 파일이 영구적으로 제거됩니다.",
        deleteCta: "계정 삭제",
        confirmDelete: "정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
        confirmDeleteCta: "네, 계정을 삭제합니다",
        cancel: "취소"
      },
      billing: {
        title: "플랜 및 결제",
        subtitle: "구독 플랜과 결제 내역을 관리하세요.",
        currentPlan: "현재 플랜",
        active: "활성",
        usage: "사용량 (STT)",
        usageNote: "한도를 초과했습니다. 초과분은 다음 주기에 청구됩니다.",
        renews: "갱신일: {date}",
        cycle: "주기: {cycle}",
        managePayment: "결제 수단 관리",
        changePlan: "플랜 변경",
        remaining: "잔여량",
        estTotal: "예상 총액",
        availablePlans: "사용 가능한 플랜",
        history: "결제 내역",
        noHistory: "결제 내역이 없습니다."
      },
      usage: {
        title: "사용량 개요",
        currentPeriod: "현재 주기: {start} - {end}",
        summary: "요약",
        limit: "사용 한도",
        table: "사용 로그",
        retry: "재시도",
        loading: "사용량 데이터를 불러오는 중...",
        error: "사용량 데이터를 불러오지 못했습니다"
      },
      api: {
        title: "API 및 개발자 설정",
        subtitle: "당사의 서비스를 귀하의 어플리케이션 및 워크플로우와 통합하세요.",
        tabs: {
          keys: "API 키",
          webhooks: "웹훅"
        },
        keys: {
          title: "API 키 관리",
          subtitle: "퍼블릭 API에 대한 요청을 인증합니다.",
          newKey: "새 API 키",
          noKeys: "API 키가 없습니다",
          noKeysDesc: "자동화 도구를 사용하기 위해 새 키를 생성하세요.",
          create: "생성",
          creating: "생성 중...",
          cancel: "취소",
          nameLabel: "키 이름",
          namePlaceholder: "운영, 자동화 도구 등",
          success: "키가 성공적으로 생성되었습니다",
          successDesc: "지금 API 키를 복사해 두시기 바랍니다. 보안을 위해 다시는 확인할 수 없습니다.",
          saved: "키를 저장했습니다",
          lastUsed: "{date} 마지막 사용",
          neverUsed: "사용 내역 없음",
          deleteConfirm: "정말 이 API 키를 삭제하시겠습니까?",
          securityNote: "API 키를 비밀번호처럼 취급하세요. 절대 공유하거나 버전 관리 시스템에 업로드하지 마세요."
        },
        webhooks: {
          title: "웹훅 구독",
          subtitle: "작업 상태 업데이트에 대한 실시간 알림을 받습니다.",
          add: "엔드포인트 추가",
          noWebhooks: "웹훅이 없습니다",
          noWebhooksDesc: "시스템을 연결하여 작업 이벤트를 자동으로 수신하세요.",
          urlLabel: "엔드포인트 URL",
          urlPlaceholder: "https://your-app.com/webhooks",
          eventsLabel: "이벤트 선택",
          test: "테스트",
          deleteConfirm: "정말 이 웹훅을 삭제하시겠습니까?",
          secret: "서명 비밀키",
          created: "생성일",
          logsTitle: "전송 로그",
          logsDesc: "웹훅 전송 로그가 곧 제공될 예정입니다."
        }
      }
  }
};
