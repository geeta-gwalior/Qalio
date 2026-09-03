export const AVATAR_PLACEHOLDER_IMAGE = "/images/usericon_placeholder.jpg";

import {
  LayoutGrid,
  ClipboardList,
  Briefcase,
  BarChart3,
  MessageSquare,
  User,
  Settings,
  Bot,
} from "lucide-react";

export const roleBasedMenus = {
  student: [
    { title: "Dashboard", url: "/student/dashboard", icon: LayoutGrid },
    { title: "Assessments", url: "/student/tests", icon: ClipboardList },
    { title: "Jobs & Applications", url: "/student/jobs", icon: Briefcase },
    { title: "Test Results", url: "/student/results", icon: BarChart3 },
    { title: "Announcements", url: "/student/broadcasts", icon: MessageSquare },
    { title: "Profile", url: "/student/profile", icon: User },
    { title: "Settings", url: "/student/settings", icon: Settings },
  ],
  company: [
    { title: "Dashboard", url: "/company/dashboard", icon: LayoutGrid },
    { title: "Jobs", url: "/company/jobs", icon: Briefcase },
    { title: "Assessments", url: "/company/assessments", icon: ClipboardList },
    { title: "Applicants", url: "/company/applicants", icon: BarChart3 },
    { title: "Results", url: "/company/result", icon: BarChart3 },
    { title: "AI Knowledge Base", url: "/company/knowledge-base", icon: Bot },
    { title: "Broadcasts", url: "/company/broadcasts", icon: MessageSquare },
    { title: "Company Profile", url: "/company/profile", icon: User },
    { title: "Settings", url: "/company/settings", icon: Settings },
  ],
} as const;

