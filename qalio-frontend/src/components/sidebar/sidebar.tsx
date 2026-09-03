"use client";

import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { roleBasedMenus } from "@/constants";
import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";
import QalioLogo from "@/components/common/QalioLogo";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

function SidebarToggleButton() {
  const { state, toggleSidebar } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="absolute right-2 top-4 h-7 w-7 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 shadow-xs border border-slate-200/60 transition-all"
    >
      {isExpanded ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
      <span className="sr-only">
        {isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      </span>
    </Button>
  );
}

export function AppSidebar({
  userRole,
}: {
  userRole: "student" | "company" | "college" | "university" | "Admin";
}) {
  const logout = useAuthStore((state) => state.logout);
  const { state } = useSidebar();
  const isExpanded = state === "expanded";
  const router = useRouter();
  const pathname = usePathname();

  const isValidRole = (role: string): role is keyof typeof roleBasedMenus => {
    return role in roleBasedMenus;
  };

  const menuItems = useMemo(() => {
    if (!userRole || !isValidRole(userRole)) return [];
    return roleBasedMenus[userRole];
  }, [userRole]);

  return (
    <Sidebar
      className="w-64 border-r border-slate-200/80 min-h-screen bg-white shadow-sm transition-all duration-300 z-[45]"
      collapsible="icon"
    >
      <SidebarHeader className="p-5 pt-6 pb-4 bg-white relative border-b border-slate-100">
        <div
          className={`w-full flex items-center ${
            !isExpanded ? "justify-center scale-90" : "justify-start px-2"
          } transition-transform duration-200`}
        >
          {isExpanded ? (
            <QalioLogo size="md" />
          ) : (
            <QalioLogo size="sm" showText={false} />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={`${!isExpanded ? "px-2" : "px-3"} py-4 bg-white`}>
        <SidebarMenu className="gap-1.5">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className={`rounded-xl font-medium px-3.5 py-2.5 h-11 transition-all duration-200 ${
                    isActive
                      ? "!bg-indigo-50/80 !text-indigo-600 font-semibold shadow-xs border border-indigo-100/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Link
                    href={item.url}
                    className="flex items-center gap-3.5 w-full"
                  >
                    <item.icon className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                    }`} />
                    <span className="text-sm truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className={`mt-auto ${!isExpanded ? "px-2" : "px-3"} py-4 bg-white border-t border-slate-100`}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Logout"
              className="rounded-xl px-3.5 py-2.5 h-11 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <button
                onClick={logout}
                className="flex items-center gap-3.5 w-full text-left"
              >
                <LogOut className="h-5 w-5 text-slate-400 group-hover:text-rose-500 shrink-0" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

