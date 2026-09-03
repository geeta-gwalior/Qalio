"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  Building,
  GraduationCap,
  Briefcase,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth-store";

const formSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Full name must be at least 2 characters." }),
    email: z.string().email("Please enter a valid email address."),
    phone: z
      .string()
      .trim()
      .refine(
        (val) => /^\d{10}$/.test(val),
        "Phone number must be exactly 10 digits and contain only numbers"
      ),
    role: z
      .string()
      .min(2, { message: "Full name must be at least 2 characters." }),
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

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const { setAuth } = useAuthStore();

  // Extract role from URL path if available
  const [initialRole, setInitialRole] = useState<string>("student");

  useEffect(() => {
    // Parse the URL path to extract role
    const pathParts = pathname.split("/");
    const roleFromPath = pathParts[pathParts.length - 1];

    // Check if the extracted role is valid
    const validRoles = [
      "university",
      "student",
      "college",
      "company",
      "others",
    ];
    if (validRoles.includes(roleFromPath)) {
      setInitialRole(roleFromPath);
    }
  }, [pathname]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: initialRole,
      password: "",
      confirmPassword: "",
      terms: false,
      rememberMe: true,
    },
  });

  // Update form value when initialRole changes
  useEffect(() => {
    form.setValue("role", initialRole as any);
  }, [initialRole, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/${values.role}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            phone: values.phone,
            password: values.password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error("Registration failed", {
          description: result.message || "Please try again later.",
        });
        return;
      }

      const { token, user } = result;

      const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";

      const expiryTime = values.rememberMe
        ? Number(process.env.NEXT_PUBLIC_AUTH_TOKEN_EXPIRY_TIME || "0.0416")
        : undefined;

      cookies.set("jwt", token, {
        expires: expiryTime,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
      });

      const userDetailsValue = encodeURIComponent(JSON.stringify(user));
      cookies.set("userDetails", userDetailsValue, {
        expires: expiryTime,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
      });

      setAuth(user, token);

      toast.success("Registration successful", {
        description: `Welcome to Qalio, ${user.firstName || user.name || "User"}!`,
      });

      const redirectPath = `/${user.role.toLowerCase()}/dashboard`;
      router.push(redirectPath);
    } catch (error: any) {
      toast.error("Something went wrong", {
        description: "Please check your network and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const roleIcons = {
    student: <GraduationCap size={16} />,
    university: <Building size={16} />,
    college: <Building size={16} />,
    company: <Briefcase size={16} />,
    others: <User size={16} />,
  };

  return (
    <div className="w-full space-y-5">
      <div className="space-y-1 text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Account
        </h1>
        <p className="text-sm text-slate-500 font-normal">
          Get started with Qalio today!
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3.5"
        >
          {/* Full Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Full Name
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="John Doe"
                      className="h-10 pl-10 rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            )}
          />

          {/* Email Address */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Email Address
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      className="h-10 pl-10 rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            )}
          />

          {/* Role Selection */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Select Role
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-10 w-full pl-10 rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          {roleIcons[field.value as keyof typeof roleIcons]}
                        </div>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="college">College</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            )}
          />

          {/* Contact Number */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Contact Number
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="10-digit mobile number"
                      type="tel"
                      inputMode="numeric"
                      className="h-10 pl-10 rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      maxLength={10}
                      {...field}
                      onChange={(e) => {
                        const onlyNums = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        field.onChange(onlyNums);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            )}
          />

          {/* Create Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Create Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      className="h-10 pl-10 pr-10 rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      {...field}
                    />
                    <div
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      className="h-10 pl-10 pr-10 rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      {...field}
                    />
                    <div
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            )}
          />

          {/* Terms & Conditions */}
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2.5 space-y-0 pt-1">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 mt-0.5"
                  />
                </FormControl>
                <div className="flex flex-col space-y-1 leading-none">
                  <FormLabel className="text-xs text-slate-600 font-normal leading-normal">
                    I agree with the{" "}
                    <Link
                      href="/terms-and-conditions"
                      className="text-indigo-600 font-medium hover:underline"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/terms-and-conditions"
                      className="text-indigo-600 font-medium hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </FormLabel>
                  <FormMessage className="text-xs text-rose-500" />
                </div>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs mt-3"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>
      </Form>

      {/* Sign in link */}
      <p className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="text-indigo-600 font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

