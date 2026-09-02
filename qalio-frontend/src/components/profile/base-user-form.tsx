"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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
import { Card, CardContent } from "@/components/ui/card";
import AvatarUpload from "./avatar-upload";
import type { BaseUserUpdateData } from "@/types/student";
import { getCookie } from "@/utils/getCookie";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

const baseUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Phone number is required"),
  address: z.string().optional(),
  avatar: z.string().optional(),
});

interface BaseUserFormProps {
  initialData: {
    name: string;
    phone: string;
    address?: string;
    avatar?: string;
  };
  onSuccess?: () => void;
}

export default function BaseUserForm({
  initialData,
  onSuccess,
}: BaseUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof baseUserSchema>>({
    resolver: zodResolver(baseUserSchema),
    defaultValues: initialData,
  });

  const handleAvatarChange = (url: string) => {
    form.setValue("avatar", url);
  };

  const handleSubmit = async (data: z.infer<typeof baseUserSchema>) => {
    setIsLoading(true);
    try {
      const token = getCookie("jwt");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Only include fields that have changed
      const updateData: BaseUserUpdateData = {};
      if (data.name !== initialData.name) updateData.name = data.name;
      if (data.phone !== initialData.phone) updateData.phone = data.phone;
      if (data.address !== initialData.address)
        updateData.address = data.address;
      if (data.avatar !== initialData.avatar) updateData.avatar = data.avatar;

      // If nothing has changed, don't make the API call
      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to save");
        onSuccess?.();
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/update-base-user`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update user information"
        );
      }

      //   // ✅ Update auth store
      //   const { setUser } = useAuthStore.getState();
      //   setUser(updateData);

      toast.success("Profile information updated successfully");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error updating user information:", error);
      toast.error(error.message || "Failed to update profile information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Profile Information</h2>
          <p className="text-sm text-gray-500">
            Update your basic profile information.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <AvatarUpload
                currentAvatar={initialData.avatar}
                onAvatarChange={handleAvatarChange}
              />

              <div className="flex-1 space-y-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your address"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full bg-[#219CAE]"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile Information"
          )}
        </Button>
      </form>
    </Form>
  );
}
