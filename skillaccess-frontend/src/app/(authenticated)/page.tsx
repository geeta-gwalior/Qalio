"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export default function AuthHome() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user?.role) {
      router.replace(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user]);

  return <div>Redirecting...</div>;
}
