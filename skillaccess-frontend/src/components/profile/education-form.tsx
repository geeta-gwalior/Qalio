"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const educationItemSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required"),
  degree: z.string().min(2, "Degree is required"),
  field: z.string().min(2, "Field of study is required"),
  startDate: z
    .date({ required_error: "Start date is required" })
    .nullable()
    .refine((date) => date !== null, {
      message: "Start date is required",
    }),
  endDate: z.date().optional(),
  isCurrentlyStudying: z.boolean().default(false),
  percentage: z.coerce
    .number()
    .min(0, { message: "Percentage must be at least 0" })
    .max(100, { message: "Percentage cannot exceed 100" })
    .optional(),
  description: z.string().optional(),
});

const educationSchema = z.object({
  educationItems: z
    .array(educationItemSchema)
    .min(1, "At least one education entry is required"),
});

interface EducationFormProps {
  initialData?: {
    institutionName: string;
    degree: string;
    field: string;
    startDate?: Date;
    endDate?: Date;
    isCurrentlyStudying: boolean;
    percentage?: number;
    description?: string;
  }[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export default function EducationForm({
  initialData,
  onSubmit,
  isLoading,
}: EducationFormProps) {
  const form = useForm({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      educationItems: initialData || [
        {
          institutionName: "",
          degree: "",
          field: "",
          startDate: undefined,
          endDate: undefined,
          isCurrentlyStudying: false,
          percentage: undefined,
          description: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "educationItems",
  });

  const handleSubmit = (data: z.infer<typeof educationSchema>) => {
    onSubmit(data.educationItems);
  };

  // Function to determine degree based on field of study
  const getDegreeFromField = (fieldOfStudy: string): string => {
    const lowerCaseField = fieldOfStudy.toLowerCase();
    if (
      lowerCaseField.includes("engineering") ||
      lowerCaseField.includes("technology")
    ) {
      return "B.Tech";
    }
    if (
      lowerCaseField.includes("computer application") ||
      lowerCaseField.includes("computer science")
    ) {
      return "BCA";
    }
    if (lowerCaseField.includes("science")) {
      return "BSc";
    }
    if (
      lowerCaseField.includes("business") ||
      lowerCaseField.includes("administration")
    ) {
      return "BBA";
    }
    // For post-graduate degrees
    if (
      lowerCaseField.includes("master of technology") ||
      lowerCaseField.includes("m.tech")
    ) {
      return "M.Tech";
    }
    if (
      lowerCaseField.includes("master of computer application") ||
      lowerCaseField.includes("mca")
    ) {
      return "MCA";
    }
    if (
      lowerCaseField.includes("master of science") ||
      lowerCaseField.includes("msc")
    ) {
      return "MSc";
    }
    if (
      lowerCaseField.includes("master of business administration") ||
      lowerCaseField.includes("mba")
    ) {
      return "MBA";
    }
    return "Other";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Education Information</h2>
          <p className="text-sm text-gray-500">
            Add your educational qualifications, starting with the most recent.
          </p>
          {initialData && initialData.length > 0 && (
    <div className="bg-blue-50 text-[#219CAE] p-3 rounded-md text-sm">
      <p>
        Your primary education details (Institution Name, Degree, and Field of Study) 
        are pre-filled from your college invite and cannot be modified. You can add 
        additional education entries below if needed.
      </p>
    </div>
  )}
        </div>
        <div className="space-y-6">
          {fields.map((field, index) => {
            const isFirstItem = index === 0;
            return (
              <Card key={field.id} className="border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between bg-gray-50 rounded-t-lg p-4">
                  <CardTitle className="text-lg">
                    Education #{index + 1}
                  </CardTitle>
                  {fields.length > 1 &&
                    !isFirstItem && ( // Only show remove button if not the first item and there's more than one item
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Institution Name */}
                  <FormField
                    control={form.control}
                    name={`educationItems.${index}.institutionName`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>Institution Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter institution name"
                            {...formField}
                            disabled={isFirstItem} // Disable if first item
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Degree */}
                  <FormField
                    control={form.control}
                    name={`educationItems.${index}.degree`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>Degree</FormLabel>
                        <Select
                          onValueChange={formField.onChange}
                          defaultValue={formField.value}
                          disabled={isFirstItem} // Disable if first item
                        >
                          <FormControl>
                            <SelectTrigger className="!h-auto !w-full">
                              <SelectValue placeholder="Select degree" />
                            </SelectTrigger>
                          </FormControl>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Field of Study */}
                  <FormField
                    control={form.control}
                    name={`educationItems.${index}.field`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>Field of Study</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="E.g., Computer Science"
                            {...formField}
                            disabled={isFirstItem} // Disable if first item
                            onChange={(e) => {
                              formField.onChange(e); // Update form state
                              const newField = e.target.value;
                              const suggestedDegree =
                                getDegreeFromField(newField);
                              // Set the degree for the current item
                              form.setValue(
                                `educationItems.${index}.degree`,
                                suggestedDegree,
                                { shouldValidate: true }
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`educationItems.${index}.percentage`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>Percentage (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="E.g., 85"
                              value={formField.value ?? ""}
                              onChange={(e) => {
                                let val = e.target.value;

                                // Only allow digits and a single optional dot
                                if (!/^\d*\.?\d{0,2}$/.test(val) && val !== "")
                                  return;

                                // Clamp values if they go over 100
                                const parsed = parseFloat(val);
                                if (!isNaN(parsed)) {
                                  if (parsed > 100) val = "100";
                                  else if (parsed < 0) val = "0";
                                }

                                formField.onChange(
                                  val === "" ? undefined : val
                                );
                              }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Start Date */}
                  <FormField
                    control={form.control}
                    name={`educationItems.${index}.startDate`}
                    render={({ field: formField }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !formField.value && "text-muted-foreground"
                                )}
                                disabled={isFirstItem} // Disable if first item
                              >
                                {formField.value ? (
                                  format(formField.value, "MMM yyyy")
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
                              selected={formField.value ?? undefined}
                              onSelect={formField.onChange}
                              disabled={(date) => date > new Date()}
                              initialFocus
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* End Date */}
                  <FormField
                    control={form.control}
                    name={`educationItems.${index}.endDate`}
                    render={({ field: formField }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date (or Expected)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !formField.value && "text-muted-foreground"
                                )}
                                // Removed disabled={isFirstItem}
                              >
                                {formField.value ? (
                                  format(formField.value, "MMM yyyy")
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
                              selected={formField.value}
                              onSelect={formField.onChange}
                              initialFocus
                              captionLayout="dropdown"
                              fromYear={1995}
                              toYear={2035} // Allow future selection
                              disabled={(date) => {
                                const startDate = form.getValues(
                                  `educationItems.${index}.startDate`
                                );
                                return startDate
                                  ? date < new Date(startDate)
                                  : false;
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name={`educationItems.${index}.description`}
                    render={({ field: formField }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your studies, achievements, etc."
                            className="min-h-[100px]"
                            {...formField}
                            // Removed disabled={isFirstItem}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            );
          })}
          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={() =>
              append({
                institutionName: "",
                degree: "",
                field: "",
                startDate: null,
                endDate: undefined,
                isCurrentlyStudying: false,
                percentage: undefined,
                description: "",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Education
          </Button>
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
