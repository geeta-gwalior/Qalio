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
import Image from "next/image";
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
      className="absolute right-2 top-4 h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100"
    >
      {isExpanded ? (
        <ChevronLeft className="h-4 w-4 text-[#219CAE]" />
      ) : (
        <ChevronRight className="h-4 w-4 text-[#219CAE]" />
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
      className="w-64 border-r min-h-[calc(100vh-4rem)] space-y-2 bg-transparent shadow-lg transition-all duration-300"
      collapsible="icon"
    >
      <SidebarHeader className={`p-4 pt-8 pb-2 bg-white relative`}>
        <div
          className={`w-full flex flex-row items-center justify-center transition-transform ${
            !isExpanded ? "scale-75" : ""
          }`}
        >
          {isExpanded ? (
            <QalioLogo size="md" />
          ) : (
            <QalioLogo size="sm" showText={false} />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className={`${!isExpanded ? "px-2" : "px-4"} bg-white`}>
        <SidebarMenu className="mt-10 gap-4">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className={`rounded-4x font-[Jost] p-4 ${
                    isActive ? "!bg-blue-50 font-medium" : ""
                  } hover:bg-blue-50 text-lg`}
                >
                  <Link
                    href={item.url}
                    className="flex items-center gap-3 h-11"
                  >
                    <item.icon className="h-5 w-5 text-[#219CAE]" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter
        className={`mt-auto ${!isExpanded ? "px-2" : "px-4"} bg-white`}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Logout"
              className="hover:bg-blue-50 "
            >
              <button
                onClick={logout}
                className="flex cursor-pointer items-center gap-3"
              >
                <LogOut color="#219CAE" className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
