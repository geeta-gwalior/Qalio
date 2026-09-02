import cookies from "js-cookie";
import { toast } from "sonner";
import { create } from "zustand";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "Student" | "Company" | "College" | "University" | "Admin";
  avatar?: string;
  // Add any additional fields
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  logout: () => void;
  setUser: (user: User) => void;
  setHydrated: () => void;
};

let initialUser: User | null = null;
let initialAuth = false;

const userCookie = cookies.get("userDetails");
if (userCookie) {
  try {
    initialUser = JSON.parse(decodeURIComponent(userCookie));
    initialAuth = true;
  } catch (e) {
    console.error("Error parsing user cookie:", e);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: null,
  isAuthenticated: initialAuth,
  isHydrated: false,

  setAuth: (user, token) =>
    set(() => ({
      user,
      token,
      isAuthenticated: true,
    })),

  clearAuth: () =>
    set(() => ({
      user: null,
      token: null,
      isAuthenticated: false,
    })),

  logout: () => {
    try {
      cookies.remove("jwt");
      cookies.remove("userDetails");
      cookies.remove("exitTimestamp");
      sessionStorage.clear();
      localStorage.removeItem("exitTimestamp");

      set(() => ({
        user: null,
        token: null,
        isAuthenticated: false,
      }));

      toast.success("Logged out", {
        description: "You have been successfully logged out.",
      });

      if (typeof window !== "undefined") {
        window.location.href = "/auth/sign-in";
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed", {
        description: "Something went wrong. Please try again.",
      });
    }
  },

  setUser: (user) =>
    set(() => ({
      user,
      isAuthenticated: true,
    })),

  setHydrated: () =>
    set(() => ({
      isHydrated: true,
    })),
}));
