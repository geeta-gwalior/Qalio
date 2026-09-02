"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { BasicInfoFormData } from "@/types/student"; // Import the type
import { JSX } from "react";

const MIN_AGE = 10;
const MAX_AGE = 100;

// Helper function to safely convert various date inputs to a Date object or null
const safeDate = (dateInput: Date | string | null | undefined): Date | null => {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  if (typeof dateInput === "string" && dateInput) {
    const date = new Date(dateInput);
    // Check if the parsed date is valid
    return isNaN(date.getTime()) ? null : date;
  }
  return null; // For null, undefined, or empty string
};

const basicInfoSchema = z.object({
  dob: z
    .union([
      z.date({
        required_error: "Please select your date of birth",
        invalid_type_error: "Invalid date format",
      }),
      z.null(), // Allow null for initial state if no date is selected
    ])
    .refine(
      (val) => {
        if (val === null) return false; // If dob is required, null should fail validation
        if (!(val instanceof Date)) return false; // Should ideally be caught by z.date()
        const today = new Date();
        const age = today.getFullYear() - val.getFullYear();
        const hasHadBirthdayThisYear =
          today.getMonth() > val.getMonth() ||
          (today.getMonth() === val.getMonth() &&
            today.getDate() >= val.getDate());
        const realAge = hasHadBirthdayThisYear ? age : age - 1;
        return realAge >= MIN_AGE && realAge <= MAX_AGE;
      },
      {
        message: `Age must be between ${MIN_AGE} and ${MAX_AGE} years`,
      }
    ),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  altContactNumber: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)) // Transform empty string to undefined for optional fields
    .refine(
      (val) => {
        if (!val) return true; // Allow empty or undefined (since it's optional)
        return /^[6-9]\d{9}$/.test(val);
      },
      {
        message: "Please enter a valid 10-digit Indian mobile number",
      }
    ),
  aadharNumber: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  panCardNumber: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  digitalSignature: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
});

interface BasicInfoFormProps {
  initialData: BasicInfoFormData;
  onSubmit: (data: BasicInfoFormData) => void;
  isLoading: boolean;
}

export default function BasicInfoForm({
  initialData,
  onSubmit,
  isLoading,
}: BasicInfoFormProps): JSX.Element {
  console.log("BasicInfoForm: Rendering with initialData prop:", initialData);

  const form = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      dob: safeDate(initialData?.dob),
      gender: initialData?.gender ?? undefined,
      altContactNumber: initialData?.altContactNumber ?? "", // Ensure it's an empty string for input value
      aadharNumber: initialData?.aadharNumber ?? "",
      panCardNumber: initialData?.panCardNumber ?? "",
      digitalSignature: initialData?.digitalSignature ?? "",
    },
  });

  // UseEffect to reset form when initialData changes (e.g., navigating back with pre-filled data)
  useEffect(() => {
    console.log(
      "BasicInfoForm useEffect: initialData changed, resetting form..."
    );
    const resetValues = {
      dob: safeDate(initialData.dob),
      gender: initialData.gender ?? undefined,
      altContactNumber: initialData.altContactNumber ?? "",
      aadharNumber: initialData.aadharNumber ?? "",
      panCardNumber: initialData.panCardNumber ?? "",
      digitalSignature: initialData.digitalSignature ?? "",
    };
    form.reset(resetValues);
    console.log(
      "BasicInfoForm useEffect: Form reset with values:",
      resetValues
    );
  }, [initialData, form]); // Depend on initialData and the form instance

  const handleSubmit = (data: z.infer<typeof basicInfoSchema>) => {
    // The data here is already validated against the schema.
    // Cast to BasicInfoFormData as the schema infer type should match it.
    onSubmit(data as BasicInfoFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <p className="text-sm text-gray-500">
            Please provide your personal details to complete your profile.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date of Birth */}
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined} // Ensure selected is undefined if field.value is null
                      onSelect={field.onChange}
                      captionLayout="dropdown"
                      disabled={(date) =>
                        date > new Date() || date < new Date("1950-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Gender */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="male" />
                      </FormControl>
                      <FormLabel className="font-normal">Male</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="female" />
                      </FormControl>
                      <FormLabel className="font-normal">Female</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="other" />
                      </FormControl>
                      <FormLabel className="font-normal">Other</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Alternate Contact Number */}
          <FormField
            control={form.control}
            name="altContactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alternate Contact Number (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter alternate phone number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Aadhar Number */}
          {/* <FormField
            control={form.control}
            name="aadharNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aadhar Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="12-digit Aadhar number" {...field} />
                </FormControl>
                <FormDescription>Your Aadhar number will be kept secure and private.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          /> */}
          {/* PAN Card Number */}
          {/* <FormField
            control={form.control}
            name="panCardNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PAN Card Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="10-character PAN number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}
          {/* Digital Signature */}
          {/* <FormField
            control={form.control}
            name="digitalSignature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Digital Signature (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Upload or enter signature URL" {...field} />
                </FormControl>
                <FormDescription>You can upload your digital signature or provide a URL.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          /> */}
        </div>
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
            "Save & Continue"
          )}
        </Button>
      </form>
    </Form>
  );
}
