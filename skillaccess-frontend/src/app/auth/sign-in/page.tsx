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

      const expiryTime = data.rememberMe
        ? parseFloat(process.env.NEXT_PUBLIC_AUTH_TOKEN_EXPIRY_TIME || "0.0416") // in days
        : undefined;

      cookies.set("jwt", token, {
        expires: expiryTime,
        secure: true,
        sameSite: "strict",
        path: "/",
      });

      cookies.set("userDetails", encodeURIComponent(JSON.stringify(user)), {
        expires: expiryTime,
        secure: true,
        sameSite: "strict",
        path: "/",
      });

      setAuth(user, token);

      // router.replace("/");

      toast.success("Login successful", {
        description: `Welcome, ${user.firstName || user.name || "User"}!`,
      });
      // Redirect to role-based dashboard
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  // const onSubmit = async (data: FormValues) => {
  //   console.log(data);
  //   console.log("Here");
  //   try {
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/auth/login`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(data),
  //         cache: "no-store",
  //       }
  //     );

  //     if (!res.ok) {
  //       const error = await res.json();
  //       throw new Error(error.message || "Login failed");
  //     }

  //     const { token, user } = await res.json();
  //     console.log(user);

  //     const isSecure =
  //       typeof window !== "undefined" && window.location.protocol === "https:";

  //     cookies.set("jwt", token, {
  //       secure: isSecure,
  //       sameSite: "Strict",
  //       expires: data.rememberMe ? 20 : undefined,
  //     });

  //     cookies.set("userDetails", encodeURIComponent(JSON.stringify(user)), {
  //       sameSite: "Strict",
  //       secure: true,
  //     });

  //     // const exitTimestamp = Date.now() + EXPIRY_MINUTES * 60 * 1000;

  //     // if (!data.rememberMe) {
  //     //   cookies.remove("exitTimestamp");
  //     //   sessionStorage.setItem("exitTimestamp", JSON.stringify(exitTimestamp));
  //     // } else {
  //     //   sessionStorage.removeItem("exitTimestamp");
  //     //   cookies.set("exitTimestamp", JSON.stringify(exitTimestamp), {
  //     //     expires: AUTH_EXPIRY_HOURS,
  //     //   });
  //     // }

  //     // setUser(user);
  //     // router.replace("/");
  //   } catch (err: any) {
  //     console.error("Login error:", err.message);
  //     throw new Error(err.message || "Login failed");
  //   }
  // };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Mobile logo - only visible on small screens */}
      <div className="flex justify-center md:hidden mb-6">
        <QalioLogo size="lg" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#1A2B3B]">
          Welcome
        </h1>
        <p className="text-sm sm:text-base text-gray-600">Log In to Continue</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="space-y-1.5">
                  <label className="text-md font-medium text-gray-700">
                    Email Address
                  </label>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                      <Input
                        {...field}
                        placeholder="Enter here"
                        className="pl-10 h-12 sm:h-14 rounded-lg border-[#242424] focus:border-[#2AABDE] focus:ring-[#2AABDE]"
                      />
                    </div>
                  </FormControl>
                </div>
                <FormMessage className="text-xs sm:text-sm" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="space-y-1.5">
                  <label className="text-md font-medium text-gray-700">
                    Password
                  </label>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            width="18"
                            height="11"
                            x="3"
                            y="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter here"
                        className="pl-10 pr-10 h-12 sm:h-14 rounded-lg border-[#242424] focus:border-[#2AABDE] focus:ring-[#2AABDE]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                </div>
                <FormMessage className="text-xs sm:text-sm" />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
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
                      className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE]"
                    />
                  </FormControl>
                  <label
                    htmlFor="rememberMe"
                    className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Remember me
                  </label>
                </FormItem>
              )}
            />
            <Link
              href="/auth/forgot-password"
              className="text-xs sm:text-sm font-medium text-[#2AABDE] hover:underline"
            >
              Forgot password
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full h-12 sm:h-14 bg-[#219CAE] hover:bg-[#219CAE] text-white rounded-lg text-sm sm:text-base font-medium transition-colors"
          >
            Sign in {loading && <SpinnerLoader size={30} />}
          </Button>
        </form>
      </Form>

      {/* <div className="text-center pt-2">
        <span className="text-xs sm:text-sm text-gray-600">
          You don&apos;t have account?{" "}
        </span>
        <Link
          href="/auth/sign-up"
          className="text-xs sm:text-sm text-[#F5A05C] font-medium hover:underline"
        >
          Sign up
        </Link>
      </div> */}
    </div>
  );
}
