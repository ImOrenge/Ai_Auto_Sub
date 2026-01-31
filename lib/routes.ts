export const routes = {
  dashboard: () => "/dashboard",
  projects: () => "/projects",

  project: (projectId: string) => `/projects/${projectId}`,
  // studio: removed - use projectEditor
  editor: (projectId: string, jobId: string) => `/projects/${projectId}/jobs/${jobId}/edit`,
  jobEditor: (jobId: string) => `/jobs/${jobId}/edit`,
  projectEditor: (projectId: string) => `/projects/${projectId}/editor`,
  exports: (projectId: string) => `/projects/${projectId}/exports`,
  exportResult: (projectId: string, jobId: string) => `/projects/${projectId}/jobs/${jobId}/export`,
  assetsHub: (projectId: string) => `/projects/${projectId}/assets`,

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
    { key: "api", label: "API", href: "/settings/api" }, // Link to API settings
  ]
}

export function buildProjectNav(projectId: string): NavItem[] {
  return [
    { key: "overview", label: "Dashboard", href: routes.project(projectId) },
    { key: "editor", label: "Editor", href: routes.projectEditor(projectId) },
    { key: "assets", label: "Media Assets", href: routes.assetsHub(projectId) },
    { key: "exports", label: "Export History", href: routes.exports(projectId) },
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
