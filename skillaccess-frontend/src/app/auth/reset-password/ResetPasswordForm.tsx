"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
        "Password must have at least one uppercase, one lowercase, one number and one special character"
      ),
    confirmPassword: z
      .string()
      .min(8, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>("");
  const [passwordReset, setPasswordReset] = useState<boolean>(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/auth/forgot-password/verify-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          setTokenValid(true);
          setEmail(result.email || emailParam || "");
        } else {
          setTokenValid(false);
          toast.error("Invalid or expired reset link", {
            description:
              result.message || "Please request a new password reset.",
          });
        }
      } catch (error) {
        setTokenValid(false);
        toast.error("Error verifying reset link", {
          description: "Please try again or request a new reset link.",
        });
      }
    };

    verifyToken();
  }, [token, emailParam]);

  async function onSubmit(values: FormValues) {
    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/auth/forgot-password/reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword: values.password,
            confirmPassword: values.confirmPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error("Password reset failed", {
          description: result.message || "Please try again.",
        });
        return;
      }

      setPasswordReset(true);
      toast.success("Password reset successful", {
        description: "You can now sign in with your new password.",
      });
    } catch (error: any) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Loading state while verifying token
  if (tokenValid === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#219CAE] mx-auto mb-4"></div>
          <p className="text-[#242424]">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>

          <div>
            <h1 className="text-[40px] font-bold text-[#242424] leading-[58px]">
              Invalid Reset Link
            </h1>
            <p className="text-[16px] font-medium text-[#242424] leading-[23px] mt-[6px]">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/auth/forgot-password">
              <Button className="w-full h-[55px] bg-[#219CAE] hover:bg-[#1a7a89] text-white rounded-[10px] text-[16px] font-semibold">
                Request New Reset Link
              </Button>
            </Link>

            <Link href="/auth/sign-in">
              <Button
                variant="outline"
                className="w-full h-[55px] border-[#219CAE] text-[#219CAE] rounded-[10px] text-[16px] font-semibold"
              >
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state after password reset
  if (passwordReset) {
    return (
      <div className="">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <div>
            <h1 className="text-[40px] font-bold text-[#242424] leading-[58px]">
              Password Reset Successful
            </h1>
            <p className="text-[16px] font-medium text-[#242424] leading-[23px] mt-[6px]">
              Your password has been successfully updated.
            </p>
          </div>

          <Link href="/auth/sign-in">
            <Button className="w-full h-[55px] bg-[#219CAE] hover:bg-[#1a7a89] text-white rounded-[10px] text-[16px] font-semibold">
              Sign In with New Password
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <h1 className="text-[40px] font-bold text-[#242424] leading-[58px]">
        Reset Your Password
      </h1>
      <p className="text-[16px] font-medium text-[#242424] leading-[23px] mt-[6px]">
        {email && `Resetting password for: ${email}`}
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-[40px] space-y-[20px]"
        >
          {/* New Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-[6px]">
                <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                  New Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
                      <Lock size={16} />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="h-[60px] pl-[46px] pr-[46px] border border-[#242424] rounded-[10px] text-[16px]"
                      {...field}
                    />
                    <div
                      className="absolute right-[20px] top-1/2 -translate-y-1/2 cursor-pointer text-[#BDBDBD]"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-[6px]">
                <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                  Confirm New Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
                      <Lock size={16} />
                    </div>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="h-[60px] pl-[46px] pr-[46px] border border-[#242424] rounded-[10px] text-[16px]"
                      {...field}
                    />
                    <div
                      className="absolute right-[20px] top-1/2 -translate-y-1/2 cursor-pointer text-[#BDBDBD]"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Requirements */}
          <div className="bg-[#F1F4F8] rounded-[10px] p-4">
            <h4 className="font-semibold text-[#242424] mb-2">
              Password Requirements:
            </h4>
            <ul className="space-y-1 text-sm text-[#242424]">
              <li>• At least 8 characters long</li>
              <li>• One uppercase letter (A-Z)</li>
              <li>• One lowercase letter (a-z)</li>
              <li>• One number (0-9)</li>
              <li>• One special character (!@#$%^&*)</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-[55px] bg-[#219CAE] hover:bg-[#1a7a89] text-white rounded-[10px] text-[16px] font-semibold mt-[40px]"
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </Button>
        </form>
      </Form>

      {/* Sign in link */}
      <p className="my-4 text-center">
        Remember your password?{" "}
        <Link href="/auth/sign-in" className="text-[#FF9900] font-semibold">
          Sign In
        </Link>
      </p>
    </div>
  );
}
