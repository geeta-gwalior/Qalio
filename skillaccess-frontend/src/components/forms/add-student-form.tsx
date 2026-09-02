"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, X } from "lucide-react";
import { getCookie } from "@/utils/getCookie";
import { toast } from "sonner";

const phoneRegex = /^[0-9]{10}$/;

// Define the form schema with Zod
const formSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  batch: z
    .string()
    .max(10, "Batch must be 10 characters or fewer")
    .optional()
    .or(z.literal("")), // allow empty string if desired
  phone: z
    .string()
    .trim()
    .refine(
      (val) => /^\d{10}$/.test(val),
      "Phone number must be exactly 10 digits and contain only numbers"
    ),
  approved: z.boolean(),
  major: z
    .string()
    .max(100, "Major must be 100 characters or fewer")
    .optional()
    .or(z.literal("")), // optional but can be validated if provided
});

type FormValues = z.infer<typeof formSchema>;

interface AddStudentFormProps {
  batches: string[];
  onSuccess: () => void;
}

export default function AddStudentForm({
  batches,
  onSuccess,
}: AddStudentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customBatch, setCustomBatch] = useState("");
  const [showCustomBatch, setShowCustomBatch] = useState(false);

  // Initialize React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      batch: "",
      phone: "",
      approved: false,
      major: "",
    },
  });

  const resetForm = () => {
    form.reset();
    setCustomBatch("");
    setShowCustomBatch(false);
  };

  const handleBatchChange = (value: string) => {
    if (value === "new-batch") {
      setShowCustomBatch(true);
      form.setValue("batch", "");
    } else {
      setShowCustomBatch(false);
      form.setValue("batch", value);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!data.batch && !customBatch && !showCustomBatch) {
      form.setError("batch", {
        type: "manual",
        message: "Please select a batch",
      });
      return;
    }

    if (showCustomBatch && !customBatch) {
      toast.error("Please enter a batch name");
      return;
    }

    setIsSubmitting(true);
    const finalBatch = showCustomBatch ? customBatch : data.batch;

    try {
      const token = getCookie("jwt");
      if (!token) throw new Error("Authentication token not found");

      toast.loading("Adding student...");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/upload-students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            students: [
              {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                batch: finalBatch,
                approved: data.approved,
                phone: data.phone || "",
                major: data.major || "",
              },
            ],
          }),
        }
      );

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Failed to add student");
      }

      const { duplicateEmails, alreadyInvitedEmails, failedEmails } =
        responseData;

      if (duplicateEmails?.includes(data.email.toLowerCase())) {
        toast.error("Student already registered", {
          description: `Email ${data.email} is already in the system.`,
        });
      } else if (alreadyInvitedEmails?.includes(data.email.toLowerCase())) {
        toast("Student already invited", {
          description: `An invitation has already been sent to ${data.email}.`,
        });
      } else if (failedEmails?.includes(data.email.toLowerCase())) {
        toast.error("Invitation failed", {
          description: `Email to ${data.email} could not be sent.`,
        });
      } else {
        toast.success("Student Invited Successfully", {
          description: `An invitation was sent to ${data.email}`,
        });

        resetForm();
        setIsOpen(false);
        onSuccess();
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to add student", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => toast.dismiss(), 4000);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="flex items-center bg-[#219CAE] hover:bg-[#1b89a4] gap-1"
          value="ghost"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter the student details below to add them to your institution.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      {...field}
                    />
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter 10-digit phone number"
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year of Passing</FormLabel>
                  <FormControl>
                    {!showCustomBatch ? (
                      <Select
                        value={field.value}
                        onValueChange={handleBatchChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {batches.map((batch) => (
                            <SelectItem key={batch} value={batch}>
                              {batch}
                            </SelectItem>
                          ))}
                          <SelectItem value="new-batch">
                            Add New Batch
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={customBatch}
                          onChange={(e) => setCustomBatch(e.target.value)}
                          placeholder="Enter Year of Passing (e.g., 2024)"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setShowCustomBatch(false);
                            setCustomBatch("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="major"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Major</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select major" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B.Tech">B.Tech</SelectItem>
                        <SelectItem value="M.Tech">M.Tech</SelectItem>
                        <SelectItem value="BCA">BCA</SelectItem>
                        <SelectItem value="MCA">MCA</SelectItem>
                        <SelectItem value="BSc">BSc</SelectItem>
                        <SelectItem value="MSc">MSc</SelectItem>
                        <SelectItem value="BBA">BBA</SelectItem>
                        <SelectItem value="MBA">MBA</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="approved"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Status</FormLabel>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="status-toggle">
                      {field.value ? "Approved" : "Pending"}
                    </Label>
                    <FormControl>
                      <Switch
                        id="status-toggle"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#219CAE] text-white hover:bg-[#1b89a4]"
              >
                {isSubmitting ? "Adding..." : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
