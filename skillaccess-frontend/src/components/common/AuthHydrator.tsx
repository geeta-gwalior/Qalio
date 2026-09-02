"use client";

import { useEffect } from "react";
import cookies from "js-cookie";
import { useAuthStore } from "@/stores/auth-store";

export default function AuthHydrator() {
  const setUser = useAuthStore((state) => state.setUser);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    const userDetailsCookie = cookies.get("userDetails");
    if (userDetailsCookie) {
      try {
        const user = JSON.parse(decodeURIComponent(userDetailsCookie));
        if (user?.id) {
          setUser(user);
        }
      } catch (e) {
        console.error("Invalid user cookie", e);
      }
    }
    setHydrated(); // Important: tells rest of the app hydration is done
  }, []);

  return null;
}
