export const AVATAR_PLACEHOLDER_IMAGE = "/images/usericon_placeholder.jpg";

import {
  LayoutGrid,
  ClipboardList,
  Briefcase,
  BarChart3,
  MessageSquare,
  User,
  Settings,
} from "lucide-react";

export const roleBasedMenus = {
  student: [
    { title: "Dashboard", url: "/student/dashboard", icon: LayoutGrid },
    { title: "Test", url: "/student/tests", icon: ClipboardList },
    { title: "Jobs", url: "/student/jobs", icon: Briefcase },
    { title: "Result", url: "/student/results", icon: BarChart3 },
    { title: "Broadcasts", url: "/student/broadcasts", icon: MessageSquare },
    { title: "Profile", url: "/student/profile", icon: User },
    { title: "Setting", url: "/student/settings", icon: Settings },
  ],
  company: [
    { title: "Dashboard", url: "/company/dashboard", icon: LayoutGrid },
    { title: "Jobs", url: "/company/jobs", icon: Briefcase },
    { title: "Results", url: "/company/result", icon: BarChart3 },
    { title: "Applicants", url: "/company/applicants", icon: BarChart3 },
    { title: "Assessments", url: "/company/assessments", icon: ClipboardList },
    { title: "Broadcasts", url: "/company/broadcasts", icon: MessageSquare },
    { title: "Profile", url: "/company/profile", icon: User },
    { title: "Setting", url: "/company/settings", icon: Settings },
  ],
  college: [
    { title: "Dashboard", url: "/college/dashboard", icon: LayoutGrid },
    { title: "Assessments", url: "/college/assessments", icon: ClipboardList },
    { title: "Companies", url: "/college/companies", icon: Briefcase },
    { title: "Jobs", url: "/college/jobs", icon: Briefcase },
    { title: "Students", url: "/college/students", icon: User },
    { title: "Result", url: "/college/result", icon: BarChart3 },
    { title: "Profile", url: "/college/profile", icon: User },
    { title: "Broadcasts", url: "/college/broadcasts", icon: MessageSquare },
    { title: "Setting", url: "/college/settings", icon: Settings },
    // {title : "Attendance", url: "/college/attendance", icon: Settings },
  ],
  university: [
    { title: "Dashboard", url: "/university/dashboard", icon: LayoutGrid },
    { title: "Colleges", url: "/university/colleges", icon: User },
    { title: "Reports", url: "/university/reports", icon: BarChart3 },
    { title: "Inbox", url: "/university/inbox", icon: MessageSquare },
    { title: "Setting", url: "/university/settings", icon: Settings },
  ],
} as const;
