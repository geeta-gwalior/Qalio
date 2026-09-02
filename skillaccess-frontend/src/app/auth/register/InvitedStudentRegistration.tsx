"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { toast, Toaster } from "sonner";
import cookies from "js-cookie";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";

const formSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters." }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters." }),

    email: z.string().email("Please enter a valid email address."),
    phone: z.string().optional(),
    major: z.string().optional(),
    batch: z.string().optional(),
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
    terms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions.",
    }),
    rememberMe: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function InvitedStudentRegistration() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isInvited, setIsInvited] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  // Extract invitation parameters from URL
  const inviteLink = searchParams.get("inviteLink");
  const CollegeId = searchParams.get("CollegeId");
  const Email = searchParams.get("Email");
  const firstName = searchParams.get("firstName");
  const lastName = searchParams.get("lastName");
  const phone = searchParams.get("phone");
  const major = searchParams.get("major");
  const batch = searchParams.get("batch");

  // Set up form with default values from URL parameters
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: firstName || "",
      lastName: lastName || "",
      email: Email || "",
      phone: phone || "",
      major: major || "",
      password: "",
      confirmPassword: "",
      terms: false,
      rememberMe: true,
    },
  });

  // Check if this is an invited registration
  useEffect(() => {
    if (inviteLink && CollegeId && Email) {
      setIsInvited(true);
      // Disable email field as it comes from the invitation
      form.setValue("email", Email);
      if (firstName) form.setValue("firstName", firstName);
      if (lastName) form.setValue("lastName", lastName);
      if (phone) form.setValue("phone", phone);
      if (major) form.setValue("major", major);
      if (batch) form.setValue("batch", batch);
    } else {
      // If not invited, redirect to regular registration
      router.push("/auth/register");
    }
  }, [
    inviteLink,
    CollegeId,
    Email,
    firstName,
    lastName,
    phone,
    major,
    form,
    router,
  ]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      // Construct the API URL with query parameters
      const apiUrl = `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/register/invite?inviteLink=${inviteLink}&CollegeId=${CollegeId}`;

      // Submit registration data
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || "",
          password: values.password,
          major: values.major || "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("Registration failed", {
          description: result.message || "Please try again later.",
        });
        return;
      }

      // ✅ Use the real token and user from backend
      const { token, user } = result;

      // Set cookie expiry time
      const expiryTime = values.rememberMe
        ? Number(process.env.NEXT_PUBLIC_AUTH_TOKEN_EXPIRY_TIME || "0.0416") // ~1h
        : undefined;

      // Set JWT cookie (used by your middleware)
      cookies.set("jwt", token, {
        secure: true,
        sameSite: "strict",
        path: "/",
        ...(expiryTime && { expires: expiryTime }),
      });

      // Set user details cookie
      const userDetailsValue = encodeURIComponent(JSON.stringify(user));
      cookies.set("userDetails", userDetailsValue, {
        secure: true,
        sameSite: "strict",
        path: "/",
        ...(expiryTime && { expires: expiryTime }),
      });

      // Set auth state
      setAuth(user, token);

      toast.success("Registration successful", {
        description: `Welcome, ${user.name || "Student"}!`,
      });

      // // Optional short delay to ensure cookies are persisted
      // setTimeout(() => {
      //   window.location.href = "/student/dashboard";
      // }, 300);

      const redirectPath = `/student/dashboard`;

      setTimeout(() => {
        router.push(redirectPath);
      }, 300);
    } catch (error: any) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isInvited) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <h1 className="text-[40px] font-bold text-[#242424] leading-[58px]">
        Complete Your Registration
      </h1>
      <p className="text-[16px] font-medium text-[#242424] leading-[23px] mt-[6px]">
        You&apos;ve been invited to join as a student!
      </p>

      {/* <div className="mt-6">
        <GoogleAuthButton />
      </div> */}

      {/* <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300"></span>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div> */}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-[40px] space-y-[20px]"
        >
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Personal Information</h2>

            {/* First Name */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="space-y-[6px]">
                  <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                    First Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
                        <User size={16} />
                      </div>
                      <Input
                        placeholder="Enter your first name"
                        className="h-[60px] pl-[46px] border border-[#242424] rounded-[10px] text-[16px]"
                        {...field}
                        disabled={!!firstName} // Disable if provided in URL
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Name */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="space-y-[6px]">
                  <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
                        <User size={16} />
                      </div>
                      <Input
                        placeholder="Enter your last name"
                        className="h-[60px] pl-[46px] border border-[#242424] rounded-[10px] text-[16px]"
                        {...field}
                        disabled={!!lastName} // Disable if provided in URL
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Address */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-[6px]">
                  <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
                        <Mail size={16} />
                      </div>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="h-[60px] pl-[46px] border border-[#242424] rounded-[10px] text-[16px]"
                        {...field}
                        disabled={true} // Always disabled for invited students
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="batch"
              render={({ field }) => (
                <FormItem className="space-y-[6px]">
                  <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                    Year of Passing
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      {/* Optional: Remove or replace icon if Mail is not relevant */}
                      {/* <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
            <CalendarIcon size={16} /> // Example replacement
          </div> */}
                      <Input
                        type="text" // or "number" if you prefer numeric input
                        placeholder="Enter your year of passing"
                        className="h-[60px] pl-[20px] border border-[#242424] rounded-[10px] text-[16px]"
                        {...field}
                        disabled={true} // Change to true if it should still be readonly
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-[6px]">
                  <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                    Contact Number
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
                        <Phone size={16} />
                      </div>
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        className="h-[60px] pl-[46px] border border-[#242424] rounded-[10px] text-[16px]"
                        {...field}
                        disabled={!!phone} // Disable if provided in URL
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Major */}
            <FormField
              control={form.control}
              name="major"
              render={({ field }) => (
                <FormItem className="space-y-[6px]">
                  <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                    Major
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
                        <User size={16} />
                      </div>
                      <Input
                        placeholder="Enter your major"
                        className="h-[60px] pl-[46px] border border-[#242424] rounded-[10px] text-[16px]"
                        {...field}
                        disabled={!!major} // Disable if provided in URL
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Security</h2>

            {/* Create Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-[6px]">
                  <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                    Create Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
                        <Lock size={16} />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        className="h-[60px] pl-[46px] pr-[46px] border border-[#242424] rounded-[10px] text-[16px]"
                        {...field}
                      />
                      <div
                        className="absolute right-[20px] top-1/2 -translate-y-1/2 cursor-pointer text-[#BDBDBD]"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
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

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-[6px]">
                  <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
                        <Lock size={16} />
                      </div>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
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
          </div>

          {/* Remember Me */}
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="w-[16px] h-[16px] border rounded-[4px]
            data-[state=checked]:bg-[#219CAE] data-[state=checked]:text-white data-[state=checked]:border-[#219CAE]"
                  />
                </FormControl>
                <FormLabel className="text-[14px] text-[#242424] font-normal m-0">
                  Remember me
                </FormLabel>
              </FormItem>
            )}
          />

          {/* Terms & Conditions */}
          {/* <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 mt-[20px]">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="w-[16px] h-[16px] border rounded-[4px]
            data-[state=checked]:bg-[#219CAE] data-[state=checked]:text-white data-[state=checked]:border-[#219CAE]"
                  />
                </FormControl>
                <div className="flex flex-col space-y-1 leading-none">
                  <FormLabel className="text-[14px] text-[#242424] font-normal">
                    By creating your account, you agree with our{" "}
                    <Link
                      href="/terms-and-conditions"
                      className="text-[#219CAE] underline"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/terms-and-conditions"
                      className="text-[#219CAE] underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          /> */}

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 mt-[20px]">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="w-[16px] h-[16px] border rounded-[4px]
            data-[state=checked]:bg-[#219CAE] data-[state=checked]:text-white data-[state=checked]:border-[#219CAE]"
                  />
                </FormControl>
                <div className="flex flex-col space-y-1 leading-none">
                  <FormLabel className="text-[14px] text-[#242424] font-normal">
                    By creating your account, you agree with our{" "}
                    {/* Link removed below */}
                    <span className="text-[#219CAE] underline">
                      Terms & Conditions
                    </span>{" "}
                    and{" "}
                    <span className="text-[#219CAE] underline">
                      Privacy Policy
                    </span>
                    .
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-[55px] bg-[#219CAE] text-white rounded-[10px] text-[16px] font-semibold mt-[40px]"
          >
            {loading ? "Creating Account..." : "Complete Registration"}
          </Button>
        </form>
      </Form>

      {/* Sign in link */}
      <p className="my-4 text-center">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-[#FF9900] font-semibold">
          Sign In
        </Link>
      </p>
    </div>
  );
}
