"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])/,
        "Password must contain at least one lowercase letter"
      )
      .regex(
        /^(?=.*[A-Z])/,
        "Password must contain at least one uppercase letter"
      )
      .regex(/^(?=.*\d)/, "Password must contain at least one number")
      .regex(
        /^(?=.*[!@#$%^&*])/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  // Two-factor authentication state
  const [twoFactorOptions, setTwoFactorOptions] = useState({
    option1: true,
    option2: false,
    option3: true,
  });

  const handleToggle = (option: keyof typeof twoFactorOptions) => {
    setTwoFactorOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // React Hook Form setup
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: PasswordFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              document.cookie.split("jwt=")[1]?.split(";")[0]
            }`,
          },
          body: JSON.stringify({
            currentPassword: values.currentPassword,
            newPassword: values.password,
            confirmPassword: values.confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Password updated successfully!");
        form.reset();
      } else {
        toast.error(data.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("An error occurred while updating password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Password Section */}
      <h2 className="text-2xl font-semibold text-[#242424] pb-4">Password</h2>
      <Card className="rounded-lg bg-white border shadow-lg p-6 pb-9 h-full">
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#4C4C4C]">
                Change Password
              </h3>
              <p className="text-[#4C4C4C]">
                Create a new strong password that is at least 8 characters long.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6">
                  {/* Current Password Field */}
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[#242424]">
                          Current Password *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                              <Lock className="h-4 w-4 text-[#242424]" />
                            </div>
                            <Input
                              {...field}
                              type={showCurrentPassword ? "text" : "password"}
                              placeholder="Enter current password"
                              className="pl-10 pr-10 border-[#242424] rounded-lg h-[60px]"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4 text-[#BDBDBD]" />
                              ) : (
                                <Eye className="h-4 w-4 text-[#BDBDBD]" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* New Password Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[#242424]">
                            New Password *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <Lock className="h-4 w-4 text-[#242424]" />
                              </div>
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                className="pl-10 pr-10 border-[#242424] rounded-lg h-[60px]"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-[#BDBDBD]" />
                                ) : (
                                  <Eye className="h-4 w-4 text-[#BDBDBD]" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[#242424]">
                            Confirm New Password *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <Lock className="h-4 w-4 text-[#242424]" />
                              </div>
                              <Input
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                className="pl-10 pr-10 border-[#242424] rounded-lg h-[60px]"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-[#BDBDBD]" />
                                ) : (
                                  <Eye className="h-4 w-4 text-[#BDBDBD]" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-7 bg-[#219CAE] hover:bg-[#1a7a89] text-white font-semibold rounded-lg w-auto md:w-[333px]"
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </Card>
    </div>
  );
}
