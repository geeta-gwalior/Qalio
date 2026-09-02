"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const experienceItemSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  position: z.string().min(2, "Position is required"),
  location: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[a-zA-Z0-9\s,-]+$/.test(val);
      },
      {
        message: "Location must not contain special characters",
      }
    ),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isCurrentlyWorking: z.boolean().default(false),
  description: z.string().optional(),
  type: z.enum(["internship", "job"]),
});

const workExperienceSchema = z.object({
  internships: z
    .array(
      experienceItemSchema.refine((item) => item.type === "internship", {
        message: "Type must be internship",
        path: ["type"],
      })
    )
    .optional(),
  jobs: z
    .array(
      experienceItemSchema.refine((item) => item.type === "job", {
        message: "Type must be job",
        path: ["type"],
      })
    )
    .optional(),
});

interface WorkExperienceFormProps {
  initialData?: {
    internships?: {
      companyName: string;
      position: string;
      location?: string;
      startDate?: Date;
      endDate?: Date;
      isCurrentlyWorking: boolean;
      description?: string;
      type: "internship";
    }[];
    jobs?: {
      companyName: string;
      position: string;
      location?: string;
      startDate?: Date;
      endDate?: Date;
      isCurrentlyWorking: boolean;
      description?: string;
      type: "job";
    }[];
  };
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export default function WorkExperienceForm({
  initialData,
  onSubmit,
  isLoading,
}: WorkExperienceFormProps) {
  const [activeTab, setActiveTab] = useState("internships");

  const form = useForm({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: initialData || {
      internships: [
        {
          companyName: "",
          position: "",
          location: "",
          startDate: undefined,
          endDate: undefined,
          isCurrentlyWorking: false,
          description: "",
          type: "internship",
        },
      ],
      jobs: [],
    },
  });

  const internships = useFieldArray({
    control: form.control,
    name: "internships",
  });

  const jobs = useFieldArray({
    control: form.control,
    name: "jobs",
  });

  const handleSubmit = (data: z.infer<typeof workExperienceSchema>) => {
    onSubmit(data);
  };

  const addInternship = () => {
    internships.append({
      companyName: "",
      position: "",
      location: "",
      startDate: undefined,
      endDate: undefined,
      isCurrentlyWorking: false,
      description: "",
      type: "internship",
    });
  };

  const addJob = () => {
    jobs.append({
      companyName: "",
      position: "",
      location: "",
      startDate: undefined,
      endDate: undefined,
      isCurrentlyWorking: false,
      description: "",
      type: "job",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Work Experience (Optional)</h2>
          <p className="text-sm text-gray-500">
            Add your internships and job experiences to showcase your
            professional background.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="internships">Internships</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="internships" className="mt-6 space-y-6">
            {internships.fields.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No internships added yet.</p>
              </div>
            ) : (
              internships.fields.map((field, index) => (
                <Card key={field.id} className="border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between bg-gray-50 rounded-t-lg p-4">
                    <CardTitle className="text-lg">
                      Internship #{index + 1}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => internships.remove(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Name */}
                    <FormField
                      control={form.control}
                      name={`internships.${index}.companyName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter company name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Position */}
                    <FormField
                      control={form.control}
                      name={`internships.${index}.position`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="E.g., Software Engineer Intern"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location */}
                    <FormField
                      control={form.control}
                      name={`internships.${index}.location`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="E.g., Bangalore, Remote"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Currently Working */}
                    <FormField
                      control={form.control}
                      name={`internships.${index}.isCurrentlyWorking`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>I am currently working here</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Start Date */}
                    <FormField
                      control={form.control}
                      name={`internships.${index}.startDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
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
                                    format(field.value, "MMM yyyy")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
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
                      name={`internships.${index}.endDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={form.watch(
                                    `internships.${index}.isCurrentlyWorking`
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "MMM yyyy")
                                  ) : form.watch(
                                      `internships.${index}.isCurrentlyWorking`
                                    ) ? (
                                    "Present"
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
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
                      name={`internships.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your responsibilities and achievements"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Hidden type field */}
                    <input
                      type="hidden"
                      {...form.register(`internships.${index}.type`)}
                      value="internship"
                    />
                  </CardContent>
                </Card>
              ))
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addInternship}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Internship
            </Button>
          </TabsContent>

          <TabsContent value="jobs" className="mt-6 space-y-6">
            {jobs.fields.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No jobs added yet.</p>
              </div>
            ) : (
              jobs.fields.map((field, index) => (
                <Card key={field.id} className="border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between bg-gray-50 rounded-t-lg p-4">
                    <CardTitle className="text-lg">Job #{index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => jobs.remove(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Name */}
                    <FormField
                      control={form.control}
                      name={`jobs.${index}.companyName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter company name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Position */}
                    <FormField
                      control={form.control}
                      name={`jobs.${index}.position`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="E.g., Software Engineer"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location */}
                    <FormField
                      control={form.control}
                      name={`jobs.${index}.location`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="E.g., Bangalore, Remote"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Currently Working */}
                    <FormField
                      control={form.control}
                      name={`jobs.${index}.isCurrentlyWorking`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>I am currently working here</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Start Date */}
                    <FormField
                      control={form.control}
                      name={`jobs.${index}.startDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
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
                                    format(field.value, "MMM yyyy")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
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
                      name={`jobs.${index}.endDate`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={form.watch(
                                    `jobs.${index}.isCurrentlyWorking`
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "MMM yyyy")
                                  ) : form.watch(
                                      `jobs.${index}.isCurrentlyWorking`
                                    ) ? (
                                    "Present"
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
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
                      name={`jobs.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your responsibilities and achievements"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Hidden type field */}
                    <input
                      type="hidden"
                      {...form.register(`jobs.${index}.type`)}
                      value="job"
                    />
                  </CardContent>
                </Card>
              ))
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addJob}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Job
            </Button>
          </TabsContent>
        </Tabs>

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
