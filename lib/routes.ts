export const routes = {
  dashboard: () => "/dashboard",
  projects: () => "/projects",
  jobs: () => "/jobs",

  project: (projectId: string) => `/projects/${projectId}`,
  studio: (projectId: string) => `/projects/${projectId}/studio`,
  projectJobs: (projectId: string) => `/projects/${projectId}/jobs`,
  queue: (projectId: string, queueId: string) => `/projects/${projectId}/queues/${queueId}`,
  editor: (projectId: string, jobId: string) => `/projects/${projectId}/editor/${jobId}`,
  glossary: (projectId: string) => `/projects/${projectId}/glossary`,

  settings: {
    profile: () => "/settings/profile",
    usage: () => "/settings/usage",
    billing: () => "/settings/billing",
    api: () => "/settings/api",
    security: () => "/settings/security",
  },
} as const;

export type NavItem = {
  key: string
  label: string
  href: string
  icon?: string // or LucideIcon
  match?: (pathname: string) => boolean
}


export function buildDashboardNav(): NavItem[] {
  return [
    { key: "dashboard", label: "Dashboard", href: routes.dashboard() },
    { key: "projects", label: "Projects", href: routes.projects() },
    { key: "stats", label: "Statistics", href: "/stats" }, // Placeholder
    { key: "api", label: "API", href: "/settings/api" }, // Link to API settings
  ]
}

export function buildProjectNav(projectId: string): NavItem[] {
  return [
    { key: "studio", label: "Upload Studio", href: routes.studio(projectId) },
    { key: "uploads", label: "Uploads", href: `/projects/${projectId}/uploads` },
    { key: "queue", label: "Queue", href: `/projects/${projectId}/queues` },
    { key: "jobs", label: "Jobs", href: routes.projectJobs(projectId) },
    { key: "glossary", label: "Glossary", href: routes.glossary(projectId) },
    { key: "settings", label: "Project Settings", href: `/projects/${projectId}/settings` },
  ]
}

export function buildProfileMenu(): NavItem[] {
  return [
    { key: "settings_profile", label: "Settings", href: routes.settings.profile() },
    { key: "settings_usage", label: "Usage", href: routes.settings.usage() },
    { key: "settings_billing", label: "Billing", href: routes.settings.billing() },
    { key: "settings_api", label: "API", href: routes.settings.api() },
    { key: "settings_security", label: "Security", href: routes.settings.security() },
  ]
}

export function buildSidebarNav({ lastProjectId }: { lastProjectId?: string }): NavItem[] {
  if (lastProjectId) {
    return buildProjectNav(lastProjectId);
  }
  return buildDashboardNav();
}
