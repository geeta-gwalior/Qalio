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

      // Set cookies with expiry time based on rememberMe
      const expiryTime = values.rememberMe
        ? Number(process.env.NEXT_PUBLIC_AUTH_TOKEN_EXPIRY_TIME || "0.0416") // ~1h default
        : undefined;

      // Set JWT cookie
      if (expiryTime) {
        cookies.set("jwt", token, {
          expires: expiryTime,
          secure: true,
          sameSite: "strict",
          path: "/",
        });
      } else {
        cookies.set("jwt", token, {
          secure: true,
          sameSite: "strict",
          path: "/",
        });
      }

      // Set user details cookie
      const userDetailsValue = encodeURIComponent(JSON.stringify(user));
      if (expiryTime) {
        cookies.set("userDetails", userDetailsValue, {
          expires: expiryTime,
          secure: true,
          sameSite: "strict",
          path: "/",
        });
      } else {
        cookies.set("userDetails", userDetailsValue, {
          secure: true,
          sameSite: "strict",
          path: "/",
        });
      }

      // Set auth state with user data and token
      setAuth(user, token);

      toast.success("Registration successful", {
        description: `Welcome, ${user.firstName || user.name || "User"}!`,
      });

      router.push("/student/dashboard");

      // Log the redirect path for debugging
      const redirectPath = `/${user.role.toLowerCase()}/dashboard`;

      // Add a small delay before redirecting
      setTimeout(() => {
        router.push(redirectPath);
      }, 500);
    } catch (error: any) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
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
    <div className="">
      <h1 className="text-[40px] font-bold text-[#242424] leading-[58px]">
        Create Account
      </h1>
      <p className="text-[16px] font-medium text-[#242424] leading-[23px] mt-[6px]">
        Create an account to continue!
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-[40px] space-y-[20px]"
        >
          {/* Full Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-[6px]">
                <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                  Full Name
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
                      <User size={16} />
                    </div>
                    <Input
                      placeholder="Enter your full name"
                      className="h-[60px] pl-[46px] border border-[#242424] rounded-[10px] text-[16px]"
                      {...field}
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
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role Selection */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-[6px]">
                <FormLabel className="text-[16px] text-[#242424] leading-[23px]">
                  Role
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="!h-[60px] w-full pl-[46px] border border-[#242424] rounded-[10px] text-[16px]">
                        <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-[#242424]">
                          {roleIcons[field.value as keyof typeof roleIcons]}
                        </div>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        {/* <SelectItem value="university">University</SelectItem> */}
                        <SelectItem value="college">College</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        {/* <SelectItem value="others">Others</SelectItem> */}
                      </SelectContent>
                    </Select>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact Number */}
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
                      placeholder="Enter 10-digit phone number"
                      type="tel"
                      inputMode="numeric"
                      className="h-[60px] pl-[46px] border border-[#242424] rounded-[10px] text-[16px]"
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
                <FormMessage />
              </FormItem>
            )}
          />

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
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-[55px] bg-[#219CAE] text-white rounded-[10px] text-[16px] font-semibold mt-[40px]"
          >
            {loading ? "Creating Account..." : "Sign Up"}
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
