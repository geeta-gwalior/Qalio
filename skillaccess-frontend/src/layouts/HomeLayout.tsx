"use client";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BellIcon, LogOut, PlusIcon, User, UserCircle } from "lucide-react";
import { Suspense, useEffect } from "react";
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
import cookies from "js-cookie";
import { useAuthStore } from "@/stores/auth-store";
import { InviteModal } from "@/components/modals/invite-modal";

type User = {
  id: string;
  name: string;
  email: string;
  role: "Student" | "Company" | "College" | "University" | "Admin";
  avatar?: string; // Optional avatar field
  // Add any additional fields
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

  if (!isHydrated) return null; // wait until store is ready
  if (!user) return null; // optional, based on logic

  const avatarSrc =
    typeof user?.avatar === "string" && user.avatar.trim() !== ""
      ? user.avatar
      : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full relative">
        <div className="flex">
          <AppSidebar userRole={user?.role} />

          <div className="relative w-full">
            <header className="border fixed top-0 h-16 flex flex-col justify-center bg-background w-[-webkit-fill-available] shadow-lg z-[50]">
              <div className="flex justify-between gap-4 my-1 px-4">
                <SidebarTrigger />

                <div className="flex gap-4 ">
                  {(user?.role == "college" || user?.role == "company") && (
                    <InviteModal userRole={user?.role} />
                  )}

                  <Button id="notifications" variant="ghost" size="icon">
                    <div className="w-9 h-9 bg-[#e4eeff] border-[1px] border-[#bed4f9] rounded-full overflow-hidden flex flex-col items-center justify-center">
                      <BellIcon color="black" fill="black" />
                    </div>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button id="user" variant="ghost" size="icon">
                        <div className="w-9 h-9 border border-[#bed4f9] rounded-full overflow-hidden flex items-center justify-center bg-white">
                          {avatarSrc ? (
                            <Image
                              src={avatarSrc}
                              height={50}
                              width={50}
                              quality={100}
                              alt="User Avatar"
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <UserCircle className="text-gray-400 w-full h-full" />
                          )}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="text-gray-600">
                      <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          router.push(`/${user?.role}/profile`);
                        }}
                      >
                        <User className="w-4 h-4" /> Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={logout}>
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>
            <Suspense fallback={<div>Loading...</div>}>
              <div className="absolute bg-[#fbfafa] min-h-[95vh] flex-1 w-full items-center overflow-hidden overflow-y-scroll mt-12 p-4">
                <main className="max-w-full relative z-10 overflow-auto p-2">
                  {children}
                </main>
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
