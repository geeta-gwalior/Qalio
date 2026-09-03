"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import cookies from "js-cookie";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import SpinnerLoader from "@/components/loaders/SpinnerLoader";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import QalioLogo from "@/components/common/QalioLogo";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
  rememberMe: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;
export interface SignInFields {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState<boolean>(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        toast.error("Invalid credentials", {
          description: "Please check your email and password and try again.",
        });
        return;
      }

      const { token, user } = result;

      // const expiryTime = data.rememberMe
      //   ? parseFloat(process.env.NEXT_PUBLIC_AUTH_TOKEN_EXPIRY_TIME || "0.0416") // ~1h default
      //   : undefined;

      // cookies.set("jwt", token, {
      //   maxAge: expiryTime ? expiryTime * 24 * 60 * 60 : undefined, // in seconds
      //   secure: true,
      //   sameSite: "strict",
      //   path: "/",
      // });

      // cookies.set("userDetails", encodeURIComponent(JSON.stringify(user)), {
      //   maxAge: expiryTime ? expiryTime * 24 * 60 * 60 : undefined,
      //   secure: true,
      //   sameSite: "strict",
      //   path: "/",
      // });

      const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";

      const expiryTime = data.rememberMe
        ? parseFloat(process.env.NEXT_PUBLIC_AUTH_TOKEN_EXPIRY_TIME || "0.0416")
        : undefined;

      cookies.set("jwt", token, {
        expires: expiryTime,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
      });

      cookies.set("userDetails", encodeURIComponent(JSON.stringify(user)), {
        expires: expiryTime,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
      });

      setAuth(user, token);

      toast.success("Login successful", {
        description: `Welcome back, ${user.firstName || user.name || "User"}!`,
      });

      router.push(`/${user.role.toLowerCase()}/dashboard`);
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please check your network connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Mobile logo */}
      <div className="flex justify-center lg:hidden mb-4">
        <QalioLogo size="lg" />
      </div>

      <div className="space-y-1.5 text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500 font-normal">
          Enter your credentials to access your dashboard.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        {...field}
                        placeholder="name@company.com"
                        className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 text-sm transition-all"
                      />
                    </div>
                  </FormControl>
                </div>
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 text-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                </div>
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between pt-1">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="rememberMe"
                      className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                  </FormControl>
                  <label
                    htmlFor="rememberMe"
                    className="text-xs font-medium text-slate-600 cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </FormItem>
              )}
            />
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs mt-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <SpinnerLoader size={20} />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Don't have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

