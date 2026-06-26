import {
  LayoutDashboard,
  Users,
  UserPlus,
  Building2,
  Activity,
  Clock,
  CalendarOff,
  UserCheck,
  ClipboardList,
  CalendarDays,
  FileText,
  Megaphone,
  BarChart3,
  Calendar,
  Settings,
  User,
  FolderOpen,
  Wallet,
  CheckSquare,
  HelpCircle,
  IndianRupee,
  type LucideIcon,
} from "lucide-react";

export interface NavChild {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  /** If provided, this item renders as a collapsible group */
  children?: NavChild[];
  /** Roles that can see this item. Omit for all roles. */
  roles?: string[];
  /** localStorage key for persisting open state */
  storageKey?: string;
}

/**
 * Master navigation definition for the ERP sidebar.
 * Includes new HR modules (Attendance, Leaves, Recruitment, Onboarding, Holidays, Documents, Announcements, Reports, Calendar, Settings).
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Employees",
    icon: Users,
    storageKey: "sidebar_employees_open",
    children: [
      {
        label: "Employee Details",
        href: "/admin/employees",
        icon: Users,
      },
      {
        label: "Create Employee",
        href: "/admin/employees/create",
        icon: UserPlus,
      },
    ],
  },
  {
    label: "Attendance",
    href: "/admin/attendance",
    icon: Clock,
  },
  {
    label: "My Attendance",
    href: "/admin?tab=attendance",
    icon: Clock,
    roles: ["hr"],
  },
  {
    label: "Leaves",
    href: "/admin/leaves",
    icon: CalendarOff,
  },
  {
    label: "Recruitment",
    href: "/admin/recruitment",
    icon: UserCheck,
  },
  {
    label: "Onboarding",
    href: "/admin/onboarding",
    icon: ClipboardList,
  },
  {
    label: "Departments",
    href: "/admin/departments",
    icon: Building2,
  },
  {
    label: "Salary & Payroll",
    href: "/admin/salary",
    icon: IndianRupee,
    roles: ["admin"],
  },
  {
    label: "Holidays",
    href: "/admin/holidays",
    icon: CalendarDays,
  },
  {
    label: "Documents",
    href: "/admin/documents",
    icon: FileText,
  },
  {
    label: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "Calendar",
    href: "/admin/calendar",
    icon: Calendar,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    label: "Employee Queries",
    href: "/admin/queries",
    icon: HelpCircle,
  },
  {
    label: "Activity Logs",
    href: "/admin/activity",
    icon: Activity,
    roles: ["admin"],
  },
];

export const EMPLOYEE_NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/admin?tab=overview", icon: LayoutDashboard },
  { label: "My Profile", href: "/admin?tab=profile", icon: User },
  { label: "Attendance", href: "/admin?tab=attendance", icon: Clock },
  { label: "Leaves", href: "/admin?tab=leaves", icon: CalendarOff },
  { label: "Holidays", href: "/admin?tab=holidays", icon: CalendarDays },
  { label: "Documents", href: "/admin?tab=documents", icon: FolderOpen },
  { label: "Payroll Slips", href: "/admin?tab=payroll", icon: Wallet },
  { label: "My Tasks", href: "/admin?tab=tasks", icon: CheckSquare },
  { label: "Notices", href: "/admin?tab=notices", icon: Megaphone },
  { label: "Performance", href: "/admin?tab=performance", icon: BarChart3 },
  { label: "Your Queries", href: "/admin?tab=queries", icon: HelpCircle },
];
