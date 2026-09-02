"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { getCookie } from "@/utils/getCookie"
import CollegeAvatarUpload from "./college-avatar-upload"

// Schema for basic profile information
const collegeProfileInfoSchema = z.object({
  name: z.string().min(1, "College name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
  avatar: z.string().optional(),
})

type CollegeProfileInfoFormData = z.infer<typeof collegeProfileInfoSchema>

interface CollegeEditModalProps {
  isOpen: boolean
  onClose: () => void
  initialData: {
    name?: string
    phone?: string
    address?: string
    avatar?: string
  }
  onSuccess?: () => void
}

export function CollegeEditModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: CollegeEditModalProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CollegeProfileInfoFormData>({
    resolver: zodResolver(collegeProfileInfoSchema),
    defaultValues: {
      name: initialData.name || "",
      phone: initialData.phone || "",
      address: initialData.address || "",
      avatar: initialData.avatar || "",
    },
  })

  // Update form when initialData changes
  useEffect(() => {
    if (initialData && isOpen) {
      form.reset({
        name: initialData.name || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        avatar: initialData.avatar || "",
      })
    }
  }, [initialData, form, isOpen])

  // Handle avatar change
  const handleAvatarChange = (url: string) => {
    form.setValue("avatar", url)
    form.trigger("avatar")
  }

  // Handle form submission
  const handleSubmit = async (data: CollegeProfileInfoFormData) => {
    setIsLoading(true)
    try {
      const token = getCookie("jwt")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/update-base-user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update profile information")
      }

      const result = await response.json()
      toast.success("Profile information updated successfully")

      if (onSuccess) {
        onSuccess()
      }

      onClose()
    } catch (error: any) {
      console.error("Error updating profile information:", error)
      toast.error(error.message || "Failed to update profile information")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      form.reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Edit Profile Information</DialogTitle>
          
            
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-4">
            
            <p className="text-sm text-gray-500">Update your colleges basic profile information.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Upload */}
                    <CollegeAvatarUpload currentAvatar={form.watch("avatar")} onAvatarChange={handleAvatarChange} />

                    <div className="flex-1 space-y-4">
                      {/* College Name */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>College Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter college name" {...field} disabled={isLoading} />
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
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" {...field} disabled={isLoading} />
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
                              <Textarea
                                placeholder="Enter address"
                                {...field}
                                value={field.value || ""}
                                disabled={isLoading}
                                className="min-h-[80px]"
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

              {/* Submit Button */}
              <Button type="submit" disabled={isLoading} className="w-full bg-[#219CAE] hover:bg-[#1a7a8a] text-white">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save College Profile Information"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
