"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  PlusIcon,
  Mail,
  Building2,
  Phone,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "@/utils/getCookie";

const inviteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces"),

  email: z.string().trim().email("Please enter a valid email address"),

  phone: z
    .string()
    .trim()
    .refine(
      (val) => /^\d{10}$/.test(val),
      "Phone number must be exactly 10 digits and contain only numbers"
    ),

  address: z.string().trim().min(5, "Address must be at least 5 characters"),

  message: z.string().trim().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteModalProps {
  userRole: "college" | "company" | "university" | "student" | "admin";
  trigger?: React.ReactNode;
  onInviteSuccess?: (data: InviteFormData) => void;
}

export function InviteModal({
  userRole,
  trigger,
  onInviteSuccess,
}: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Determine what entity to invite based on user role
  const isInvitingCompany = userRole === "college" || userRole === "university";
  const targetEntity = isInvitingCompany ? "Company" : "College";
  const targetEntityLower = targetEntity.toLowerCase();

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true);

    const token = getCookie("jwt");

    const isInvitingCompany =
      userRole === "college" || userRole === "university";
    const baseURL = process.env.NEXT_PUBLIC_QALIO_BACKEND_URL;

    const endpoint = isInvitingCompany
      ? `${baseURL}/college/invite-company`
      : `${baseURL}/company/invite-college`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          invitedBy: userRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Server Error");
      }

      toast.success(`Invitation sent to ${data.name} at ${data.email}`);
      onInviteSuccess?.(data);
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to send invitation. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="w-auto">
      <PlusIcon className="w-4 h-4 mr-2" />
      Invite {targetEntity === "Company" ? "Companies" : "Colleges"}
    </Button>
  );

  const EntityIcon = isInvitingCompany ? Building2 : GraduationCap;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EntityIcon className="w-5 h-5" />
            Invite {targetEntity}
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a {targetEntityLower} to join your platform.
            They will receive an email with registration details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {targetEntity} Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <EntityIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={`Enter ${targetEntityLower} name`}
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email Address <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder={`${targetEntityLower}@example.com`}
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phone Number <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter 10-digit phone number"
                        className="pl-10"
                        type="tel"
                        inputMode="numeric"
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

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Address <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={`Enter ${targetEntityLower} address`}
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#219CAE]"
              >
                {isLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
