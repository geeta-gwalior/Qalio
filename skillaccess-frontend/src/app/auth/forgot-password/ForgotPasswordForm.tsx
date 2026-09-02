"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail, ArrowLeft } from "lucide-react";
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

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/auth/forgot-password/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: values.email,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error("Error", {
          description: result.message || "Failed to send reset email.",
        });
        return;
      }

      setEmailSent(true);
      toast.success("Email sent", {
        description: result.message,
      });
    } catch (error: any) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-[#219CAE] rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <div>
            <h1 className="text-[40px] font-bold text-[#242424] leading-[58px]">
              Check Your Email
            </h1>
            <p className="text-[16px] font-medium text-[#242424] leading-[23px] mt-[6px]">
              We have sent a password reset link to your email address.
            </p>
          </div>

          <div className="bg-[#F1F4F8] rounded-[10px] p-6 text-left">
            <h3 className="font-semibold text-[#242424] mb-2">Next Steps:</h3>
            <ul className="space-y-2 text-[#242424] text-sm">
              <li>• Check your email inbox (and spam folder)</li>
              <li>• Click the reset link in the email</li>
              <li>• The link will expire in 1 hour for security</li>
              <li>• Create your new password</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => {
                setEmailSent(false);
                form.reset();
              }}
              variant="outline"
              className="w-full h-[55px] border-[#219CAE] text-[#219CAE] rounded-[10px] text-[16px] font-semibold"
            >
              Send Another Email
            </Button>

            <Link href="/auth/sign-in">
              <Button
                variant="ghost"
                className="w-full h-[55px] text-[#242424] rounded-[10px] text-[16px] font-semibold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="mb-6">
        <Link href="/auth/sign-in">
          <Button
            variant="ghost"
            className="p-0 h-auto text-[#242424] hover:text-[#219CAE]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </Link>
      </div>

      <h1 className="text-[40px] font-bold text-[#242424] leading-[58px]">
        Forgot Password?
      </h1>
      <p className="text-[16px] font-medium text-[#242424] leading-[23px] mt-[6px]">
        No worries! Enter your email and we will send you a reset link.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-[40px] space-y-[20px]"
        >
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
                      placeholder="Enter your email address"
                      className="h-[60px] pl-[46px] border border-[#242424] rounded-[10px] text-[16px]"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-[55px] bg-[#219CAE] hover:bg-[#1a7a89] text-white rounded-[10px] text-[16px] font-semibold mt-[40px]"
          >
            {loading ? "Sending Reset Link..." : "Send Reset Link"}
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
