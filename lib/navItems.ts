import {
  LayoutDashboard,
  ListVideo,
  Upload,
  BookOpen,
  CreditCard,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/projects", label: "Projects", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: ListVideo },
  { href: "/usage", label: "사용량", icon: BarChart3 },
  { href: "/billing", label: "결제/크레딧", icon: CreditCard },
  { href: "/settings", label: "설정", icon: Settings },
];
