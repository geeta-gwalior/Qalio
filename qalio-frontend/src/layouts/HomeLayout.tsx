"use client";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BellIcon, LogOut, Search, User, UserCircle, Sparkles } from "lucide-react";
import { Suspense } from "react";
import { AppSidebar } from "@/components/sidebar/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth-store";
import { InviteModal } from "@/components/modals/invite-modal";

type User = {
  id: string;
  name: string;
  email: string;
  role: "Student" | "Company" | "College" | "University" | "Admin";
  avatar?: string;
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const user: any = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  if (!isHydrated) return null;
  if (!user) return null;

  const avatarSrc =
    typeof user?.avatar === "string" && user.avatar.trim() !== ""
      ? user.avatar
      : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50/60 w-full relative font-sans text-slate-800">
        <div className="flex">
          <AppSidebar userRole={user?.role} />

          <div className="relative w-full flex-1 flex flex-col min-w-0">
            {/* Glassmorphic Top Navbar */}
            <header className="sticky top-0 h-16 flex items-center justify-between glass-header border-b border-slate-200/80 px-4 md:px-6 z-[40] transition-all">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors" />
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 border border-slate-200/60 rounded-full text-slate-500 text-xs w-64 shadow-inner">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">Search assessments, jobs...</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {(user?.role === "college" || user?.role === "company") && (
                  <InviteModal userRole={user?.role} />
                )}

                {/* Notifications Button */}
                <Button
                  id="notifications"
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-full bg-slate-100/80 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200/60 transition-all"
                >
                  <BellIcon className="h-4 w-4" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white" />
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      id="user"
                      className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100/80 border border-slate-200/60 transition-all cursor-pointer outline-none"
                    >
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-indigo-200 bg-gradient-to-tr from-indigo-100 to-cyan-50 flex items-center justify-center shadow-xs">
                        {avatarSrc ? (
                          <Image
                            src={avatarSrc}
                            height={40}
                            width={40}
                            quality={90}
                            alt="User Avatar"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <UserCircle className="text-indigo-500 w-5 h-5" />
                        )}
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                      </div>
                      <span className="hidden md:inline-block text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                        {user?.name || "User"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl border-slate-200/80 bg-white">
                    <DropdownMenuLabel className="px-3 py-2">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 capitalize font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          {user?.role} Account
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1 bg-slate-100" />
                    <DropdownMenuItem
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl cursor-pointer transition-colors"
                      onClick={() => {
                        router.push(`/${user?.role}/profile`);
                      }}
                    >
                      <User className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 bg-slate-100" />
                    <DropdownMenuItem
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
                      onClick={logout}
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Log Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Main Content Viewport */}
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[70vh]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              }
            >
              <main className="flex-1 w-full p-4 sm:p-6 md:p-8 max-w-7xl mx-auto transition-all">
                {children}
              </main>
            </Suspense>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

