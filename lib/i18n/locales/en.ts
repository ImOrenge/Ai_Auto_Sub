export const en = {
  common: {
    login: "Login",
    signup: "Start for free",
    logout: "Logout",
    dashboard: "Dashboard",
    settings: "Settings",
    pricing: "Pricing",
    docs: "Docs",
    features: "Features",
    howItWorks: "How it works",
    useCases: "Use Cases",
    workspace: "Global Workspace",
    nav: {
      dashboard: "Dashboard",
      projects: "Projects",
      api: "API",
      editor: "Editor",
      mediaAssets: "Media Assets",
      exportHistory: "Export History",
      projectSettings: "Project Settings",
      usage: "Usage",
      billing: "Billing",
      security: "Security"
    },
    footer: {
      copyright: "© {year} AutoSubAI · All rights reserved",
      dashboard: "Dashboard"
    },
    layout: {
      console: "Console",
      dashboard: "Dashboard"
    }
  },
  landing: {
    hero: {
      eyebrow: "AI-Powered Subtitle Automation",
      h1: "Subtitles are automatically completed just by uploading.",
      sub: "AI recognizes voice, translates, and styles. Get SRT, VTT, and subtitle-embedded MP4 with one click.",
      primaryCta: "Start for Free",
      secondaryCta: "Explore Features",
      bullets: [
        "AI voice recognition support for 90+ languages",
        "Real-time subtitle editing & style customization",
        "SRT · VTT · MP4 Burn-in Export"
      ],
      stats: {
        languages: "90+ Languages",
        timeSaved: "40h/mo Saved",
        accuracy: "99.2% Accuracy",
        trustedBy: "Trusted by thousands of creators"
      }
    },
    features: {
      title: "Core Features",
      subtitle: "Everything you need for perfect subtitles",
      items: {
        editor: {
          title: "Intuitive Editing Interface",
          description: "Anyone can easily refine subtitles through a timeline and real-time preview at the level of professional video editing software."
        },
        aiEditor: {
          title: "AI Smart Editor",
          description: "Real-time editing on the timeline. Subtitle modification, sync adjustment, and style preview on one screen."
        },
        export: {
          title: "Various Exports",
          description: "One-click download of SRT, VTT subtitle files, as well as MP4 videos with burned-in subtitles."
        },
        style: {
          title: "Style Presets",
          description: "Freely adjust fonts, colors, outlines, and positions. Save as presets for consistent style application."
        },
        dashboard: {
          title: "Usage Dashboard",
          description: "Track usage (minutes/tasks) by plan in real-time. Manage costs transparently."
        },
        api: {
          title: "API & Webhook",
          description: "Automate everything from upload to completion with event hooks. Easily integrate with external systems."
        }
      }
    },
    pricing: {
      title: "Choose the right plan for your needs",
      subtitle: "Basic STT and editing features are included in all plans. Usage and costs are clearly displayed.",
      monthly: "Monthly",
      yearly: "Yearly",
      discount: "-20%",
      monthlyNote: "Monthly Billing",
      yearlyNote: "Save ~20% with Yearly Billing",
      popular: "Popular",
      perMonth: "/mo",
      perMonthYearly: "/mo (Yearly)",
      comparison: {
        toggleShow: "View Detailed Plan Comparison",
        toggleHide: "Hide Comparison",
        features: "Features"
      },
      usage: {
        title: "Usage Guidelines",
        items: {
          processing: {
            label: "Processing",
            desc: "0.2 credits per minute consumed for subtitle generation and translation."
          },
          export: {
            label: "Export",
            desc: "Credits deducted per minute based on resolution and effect tier during rendering."
          },
          storage: {
            label: "Storage Retention",
            desc: "Results are kept for 7 to 90 days depending on the plan."
          }
        }
      }
    },
    faq: {
      title: "FAQ",
      subtitle: "Questions about billing, quality, storage, and editing range.",
      items: [
        { q: "What is the supported languages and accuracy?", a: "We support over 90 languages including Korean, English, Japanese, and Chinese. The average STT accuracy is over 99%, and specialized terms can be supplemented with manual correction." },
        { q: "Is it possible to upload long videos or bulk upload?", a: "Long videos can be processed quickly with our intuitive editing interface. The Pro plan supports up to 1,000 minutes per month, and Enterprise is unlimited." },
        { q: "What export formats are supported?", a: "You can download SRT and VTT subtitle files, as well as MP4 files with subtitles burned-in." },
        { q: "Where are files stored and how long are they kept?", a: "All files are encrypted and stored safely. The Free plan keeps files for 7 days, and paid plans for 90 days." },
        { q: "How does payment and plan change work?", a: "You can upgrade or downgrade at any time, and it will be automatically calculated on a pro-rata basis. The refund policy is a full refund within 7 days of signup." },
        { q: "Can I use it with team members?", a: "Team features are supported in Pro and above plans. You can share projects, manage permissions, and collaborate." }
      ]
    },
    cta: {
      badge: "Try for free",
      title: "Start Automating Your Subtitles Today",
      subtitle: "Join thousands of creators saving hours every week with AI Sub Auto.",
      primary: "Start for Free",
      secondary: "View Pricing",
      disclaimer: "Start without credit card · Cancel anytime"
    },
    footer: {
      tagline: "AI-Powered Subtitle Automation",
      product: "Product",
      company: "Company",
      legal: "Legal",
      links: {
        features: "Features",
        pricing: "Pricing",
        docs: "Docs",
        privacy: "Privacy Policy",
        terms: "Terms of Service"
      }
    }
  },
  dashboard: {
      welcome: "Welcome Back",
      overview: "Main Console Overview",
      stats: {
        totalProjects: "Total Projects",
        activeJobs: "Active Jobs",
        creditsUsed: "Available Credits",
        monthlyusage: "Monthly Usage",
        used: "used",
        limit: "Limit",
        accountStatus: "Account Status",
        proPlan: "Pro Plan",
        proPlanDesc: "Enjoy unlimited translations and priority processing.",
        viewSettings: "View Account Settings",
        topUp: "Top up Credits"
      },
      quickActions: {
        title: "Quick Actions",
        newProject: "New Project",
        uploadVideo: "Upload Video",
        recentFiles: "Recent Files",
        checkUsage: "Check Usage",
        managePlan: "Manage Plan",
        tutorials: "Tutorials"
      },
      empty: {
        title: "No projects yet",
        description: "Create your first project to start automating subtitles.",
        cta: "Create Project"
      },
      actionNeeded: {
        title: "Continue Working",
        badge: "Recently Active",
        cta: "Open Editor",
        resume: "Resume where you left off. Last updated {date}"
      },
      recentProjects: {
        title: "Recent Projects",
        viewAll: "View All",
        active: "Active"
      },
      tips: {
        title: "Tips & Updates",
        didYouKnow: {
          title: "Did you know?",
          desc: "You can use AI to automatically translate your subtitles into multiple languages with one click.",
          cta: "Learn about translations"
        },
        shortcuts: {
          title: "Pro Tip: Keyboard Shortcuts",
          desc: "Press {k} to pause/play and {j}/{l} to seek while editing.",
          cta: "View all shortcuts"
        }
      },
      admin: {
        title: "Admin Console",
        subtitle: "Internal Operations & Governance",
        refresh: "Refresh Data",
        tabs: {
          overview: "Overview",
          users: "Users",
          jobs: "Activities"
        },
        stats: {
          totalUsers: "Total Users",
          totalProjects: "Total Projects",
          totalJobs: "Total Jobs",
          activeJobs: "Active Jobs"
        },
        overview: {
          distribution: "Distribution by Status",
          health: "System Health",
          latency: "API Latency",
          uptime: "Worker Uptime",
          dbConnections: "DB Connections",
          operational: "All Systems Operational"
        },
        users: {
          title: "User Directory",
          search: "Search by email...",
          table: {
            user: "User",
            created: "Created",
            lastSignIn: "Last Sign In",
            privileges: "Privileges",
            actions: "Actions"
          },
          superAdmin: "Super Admin",
          userRole: "User",
          never: "Never"
        },
        jobs: {
          title: "Recent System Jobs",
          table: {
            resource: "ID / Resource",
            status: "Status",
            created: "Created Time",
            reference: "Reference"
          }
        }
      },
      project: {
        sidebar: {
          admin: "Project Admin",
          mainConsole: "Main Console",
          settings: "Settings"
        },
        overview: {
          title: "Project Dashboard",
          recentAssets: "Recent Assets",
          noAssets: "No assets found.",
          units: {
            bytes: "Bytes",
            kb: "KB",
            mb: "MB",
            gb: "GB",
            tb: "TB"
          },
          stats: {
            assets: "Total Project Assets",
            jobs: "Total Jobs",
            completed: "Completed Exports",
            updated: "Last Updated"
          },
          quickActions: {
            title: "Quick Actions",
            upload: "Upload Media",
            editor: "Open Editor",
            exports: "View Exports",
            settings: "Settings"
          }
        },
        empty: {
          title: "Welcome to your new project!",
          description: "This project is currently empty. Get started by uploading your first video or audio file to begin the subtitling magic.",
          upload: "Upload Media",
          openEditor: "Open Blank Editor"
        },
        activities: {
          title: "Recent Activity",
          noActivities: "No recent activity found.",
          untitled: "Untitled Job",
          downloadSrt: "Download SRT",
          download: "Download"
        }
      },
      projects: {
        title: "Projects",
        subtitle: "Manage your video projects and queues.",
        newProject: "New Project",
        noProjects: "No projects",
        noProjectsDesc: "Get started by creating a new project.",
        empty: {
          title: "Welcome to your new project!",
          description: "This project is currently empty. Get started by uploading your first video or audio file to begin the subtitling magic.",
          upload: "Upload Media",
          openEditor: "Open Blank Editor"
        }
      },
      profile: {
        title: "Profile Information",
        subtitle: "Manage your personal information and account details.",
        name: "Full Name",
        namePlaceholder: "Your Name",
        email: "Email Address",
        emailNote: "Email cannot be changed.",
        company: "Company/Team",
        companyPlaceholder: "(Optional)",
        save: "Save Changes",
        saved: "Saved",
        overview: "Account Overview",
        plan: "Current Plan",
        joined: "Joined At",
        lastActivity: "Last Activity",
        userId: "User ID",
        migrationNote: "Your account was created using {email}. If you need to migrate your data or change your login provider, please contact support.",
        dangerZone: "Danger Zone",
        deleteDesc: "Once you delete your account, there is no going back. All your data, projects, and exports will be permanently removed.",
        deleteCta: "Delete Account",
        confirmDelete: "Are you sure? This action cannot be undone.",
        confirmDeleteCta: "Yes, Delete My Account",
        cancel: "Cancel"
      },
      billing: {
        title: "Plans & Billing",
        subtitle: "Manage your subscription plan and billing history.",
        currentPlan: "Current Plan",
        active: "Active",
        usage: "Usage (STT)",
        usageNote: "Limit exceeded. Overage will be charged next cycle.",
        renews: "Renews: {date}",
        cycle: "Cycle: {cycle}",
        managePayment: "Manage Payment Method",
        changePlan: "Change Plan",
        remaining: "Remaining",
        estTotal: "Est. Total",
        availablePlans: "Available Plans",
        history: "Billing History",
        noHistory: "No billing history available."
      },
      usage: {
        title: "Usage Overview",
        currentPeriod: "Current period: {start} - {end}",
        summary: "Summary",
        limit: "Usage Limit",
        table: "Usage Logs",
        retry: "Retry",
        loading: "Loading usage data...",
        error: "Failed to load usage data"
      },
      api: {
        title: "API & Developer Settings",
        subtitle: "Integrate our services into your own applications and workflows.",
        tabs: {
          keys: "API Keys",
          webhooks: "Webhooks"
        },
        keys: {
          title: "Your API Keys",
          subtitle: "Authenticate your requests to the public API.",
          newKey: "New API Key",
          noKeys: "No API Keys",
          noKeysDesc: "Create a new key to start using our automation tools.",
          create: "Create",
          creating: "Creating...",
          cancel: "Cancel",
          nameLabel: "Key Name",
          namePlaceholder: "Production, Automation Tool, etc.",
          success: "Key Created Successfully",
          successDesc: "Make sure to copy your API key now. For your security, you won't be able to see it again.",
          saved: "I've saved my key",
          lastUsed: "Last used {date}",
          neverUsed: "Never used",
          deleteConfirm: "Are you sure you want to delete this API key?",
          securityNote: "Treat your API keys like passwords. Never share them or check them into version control."
        },
        webhooks: {
          title: "Webhook Subscriptions",
          subtitle: "Receive real-time notifications for job status updates.",
          add: "Add Endpoint",
          noWebhooks: "No webhooks yet",
          noWebhooksDesc: "Connect your system to receive job events automatically.",
          urlLabel: "Endpoint URL",
          urlPlaceholder: "https://your-app.com/webhooks",
          eventsLabel: "Select Events",
          test: "Test",
          deleteConfirm: "Are you sure you want to delete this webhook?",
          secret: "Signing Secret",
          created: "Created",
          logsTitle: "Delivery Logs",
          logsDesc: "Logs for your webhook deliveries will be available here soon."
        }
      }
  }
};
