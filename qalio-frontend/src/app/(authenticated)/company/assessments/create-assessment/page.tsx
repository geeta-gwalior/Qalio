"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, ArrowLeft, Clock } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ProgressBar } from "@/components/progress-bar";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
import { BackHeader } from "@/components/backHeader";

// Define the steps for the progress bar
const formSteps = [
  { id: 1, name: "Name Assessment" },
  { id: 2, name: "Select Tests" },
  { id: 3, name: "Review & Submit" },
];

// Define the form schema with TypeScript and zod
const formSchema = z.object({
  name: z.string().min(1, { message: "Assessment name is required" }),
  level: z.string().min(1, { message: "Level is required" }),
  attempts: z
    .string()
    .min(1, { message: "Number of attempts is required" })
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num <= 5;
      },
      { message: "Number of attempts must be 5 or less" }
    ),
  questions: z.string().min(1, { message: "Number of questions is required" }),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  totalDuration: z.string().optional(), // Changed to optional
  isTotalDuration: z.boolean(), // Changed from optional to required
  isNegativeMarking: z.boolean().optional(),
  cameraAccess: z.boolean().optional(),
  tabSwitches: z.boolean().optional(),
  additionalDescription: z.string().optional(),
});

// Define the type for our form values
type FormValues = z.infer<typeof formSchema>;

// Time options for hours, minutes, and period
const hours = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
const minutes = Array.from({ length: 60 }, (_, i) => i);
const periods = ["AM", "PM"];
const validateDates = (start: Date | undefined, end: Date | undefined) => {
  if (!start || !end) return false;
  return end > start;
};

export default function AssessmentForm() {
  const router = useRouter();
  const { formData, updateFormData, isLoading } = useAssessmentForm();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [timingType, setTimingType] = useState<
    "questionWise" | "totalDuration"
  >("questionWise");

  // Time state for start date
  const [startHour, setStartHour] = useState<number>(9);
  const [startMinute, setStartMinute] = useState<number>(0);
  const [startPeriod, setStartPeriod] = useState<string>("AM");

  // Time state for end date
  const [endHour, setEndHour] = useState<number>(5);
  const [endMinute, setEndMinute] = useState<number>(0);
  const [endPeriod, setEndPeriod] = useState<string>("PM");
  const [dateError, setDateError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      level: "",
      attempts: "",
      questions: "",
      isNegativeMarking: false,
      isTotalDuration: false, // Make sure this is set
    },
  });

  // Function to create a date with the specified time
  const createDateWithTime = (
    date: Date | undefined,
    hour: number,
    minute: number,
    period: string
  ): Date | undefined => {
    if (!date) return undefined;

    const newDate = new Date(date);

    // Convert 12-hour format to 24-hour format
    let hours24 = hour;
    if (period === "PM" && hour !== 12) hours24 += 12;
    if (period === "AM" && hour === 12) hours24 = 0;

    // Set the time components
    newDate.setHours(hours24);
    newDate.setMinutes(minute);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    return newDate;
  };

  // Format time in 12-hour format
  const formatTime = (hour: number, minute: number, period: string): string => {
    return `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  // Handle timing type change
  const handleTimingTypeChange = (value: "questionWise" | "totalDuration") => {
    setTimingType(value);
    setValue("isTotalDuration", value === "totalDuration");

    // Clear total duration if question wise is selected
    if (value === "questionWise") {
      setValue("totalDuration", "");
    }
  };

  // Load saved form data into the form
  useEffect(() => {
    if (!isLoading && formData) {
      // Set form values from saved data
      if (formData.name) setValue("name", formData.name);
      if (formData.level) setValue("level", formData.level);
      if (formData.attempts) setValue("attempts", formData.attempts);
      if (formData.questions) setValue("questions", formData.questions);

      if (formData.startDate) {
        const startDateObj = new Date(formData.startDate);
        setStartDate(startDateObj);
        setValue("startDate", startDateObj);

        // Extract time from saved start date
        const hours24 = startDateObj.getHours();
        const minutes = startDateObj.getMinutes();

        // Convert to 12-hour format
        const period = hours24 >= 12 ? "PM" : "AM";
        const hours12 = hours24 % 12 || 12;

        setStartHour(hours12);
        setStartMinute(minutes);
        setStartPeriod(period);
      }

      if (formData.endDate) {
        const endDateObj = new Date(formData.endDate);
        setEndDate(endDateObj);
        setValue("endDate", endDateObj);

        // Extract time from saved end date
        const hours24 = endDateObj.getHours();
        const minutes = endDateObj.getMinutes();

        // Convert to 12-hour format
        const period = hours24 >= 12 ? "PM" : "AM";
        const hours12 = hours24 % 12 || 12;

        setEndHour(hours12);
        setEndMinute(minutes);
        setEndPeriod(period);
      }

      // Set timing type based on saved data
      if (formData.isTotalDuration !== undefined) {
        setValue("isTotalDuration", formData.isTotalDuration);
        setTimingType(
          formData.isTotalDuration ? "totalDuration" : "questionWise"
        );
      }

      if (formData.totalDuration)
        setValue("totalDuration", String(formData.totalDuration));
      if (formData.additionalDescription)
        setValue("additionalDescription", formData.additionalDescription);
    }
  }, [isLoading, formData, setValue]);

  const onSubmit = (data: FormValues) => {
    // Create dates with the selected times
    const startDateWithTime = createDateWithTime(
      data.startDate,
      startHour,
      startMinute,
      startPeriod
    );
    const endDateWithTime = createDateWithTime(
      data.endDate,
      endHour,
      endMinute,
      endPeriod
    );

    // Validate dates
    if (!validateDates(startDateWithTime, endDateWithTime)) {
      setDateError("End date must be after start date");
      return;
    }

    setDateError(null);

    // Save form data to localStorage with the time included
    updateFormData({
      ...data,
      startDate: startDateWithTime?.toISOString(),
      endDate: endDateWithTime?.toISOString(),
      isTotalDuration: timingType === "totalDuration",
      totalDuration: data.totalDuration
        ? Number(data.totalDuration)
        : undefined,
    });

    // Navigate to next step
    router.push("create-assessment/select-tests/");
  };
  useEffect(() => {
    if (startDate && endDate) {
      const startWithTime = createDateWithTime(
        startDate,
        startHour,
        startMinute,
        startPeriod
      );
      const endWithTime = createDateWithTime(
        endDate,
        endHour,
        endMinute,
        endPeriod
      );

      if (startWithTime) setValue("startDate", startWithTime);
      if (endWithTime) setValue("endDate", endWithTime);

      const isValid = validateDates(startWithTime, endWithTime);
      setDateError(isValid ? null : "End date must be after start date");
    } else {
      setDateError(null);
    }
  }, [
    startDate,
    endDate,
    startHour,
    startMinute,
    startPeriod,
    endHour,
    endMinute,
    endPeriod,
    setValue,
  ]);
  const isFormValid =
    !errors.name &&
    watch("level") &&
    !errors.level &&
    !errors.attempts &&
    !errors.questions &&
    !errors.startDate &&
    !errors.endDate &&
    startDate &&
    endDate &&
    (timingType !== "totalDuration" || !errors.totalDuration) &&
    !dateError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w mx-auto px-1 py-5.5">
      <BackHeader
        title="Create Assessment"
        defaultRoute="/company/assessments"
      />

      {/* Progress bar component */}
      <ProgressBar currentStep={1} steps={formSteps} />

      <Card className="w-full h-full mx-auto bg-white shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assessment Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Assessment Name<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter Here"
                    {...register("name")}
                    className="w-full h-10"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Assessment Level */}
                <div className="space-y-2">
                  <Label htmlFor="level" className="text-sm font-medium">
                    Assessment Level<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("level", value)}
                    value={watch("level")}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      {/* <SelectItem value="expert">Expert</SelectItem> */}
                    </SelectContent>
                  </Select>
                  {errors.level && (
                    <p className="text-xs text-red-500">
                      {errors.level.message}
                    </p>
                  )}
                </div>

                {/* No. of Attempts - Changed to input field */}
                <div className="space-y-2">
                  <Label htmlFor="attempts" className="text-sm font-medium">
                    No. of Attempts<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="attempts"
                    type="number"
                    min="1"
                    max="5"
                    placeholder="Enter number of attempts"
                    {...register("attempts")}
                    onWheel={(e) => e.currentTarget.blur()} // 👈 disables scroll wheel changes
                    className="w-full h-10"
                  />
                  {errors.attempts && (
                    <p className="text-xs text-red-500">
                      {errors.attempts.message}
                    </p>
                  )}
                </div>

                {/* No. of Questions - Changed to input field */}
                <div className="space-y-2">
                  <Label htmlFor="questions" className="text-sm font-medium">
                    No. of Questions<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="questions"
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Enter number of questions"
                    {...register("questions")}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full h-10"
                  />
                  {errors.questions && (
                    <p className="text-xs text-red-500">
                      {errors.questions.message}
                    </p>
                  )}
                </div>

                {/* Start Date - Improved layout */}
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium">
                    Start Date<span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full sm:w-[180px] h-10 justify-between text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          {startDate
                            ? format(startDate, "MM/dd/yyyy")
                            : "MM/DD/YYYY"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date);
                            if (date) {
                              const dateWithTime = createDateWithTime(
                                date,
                                startHour,
                                startMinute,
                                startPeriod
                              );
                              setValue("startDate", dateWithTime || date);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <div className="flex h-10 items-center space-x-1 border rounded-md px-2 py-1 w-full sm:w-auto">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <Select
                        value={startHour.toString()}
                        onValueChange={(value) =>
                          setStartHour(Number.parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-16 h-8 border-0 p-0 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) =>
                            i === 0 ? 12 : i
                          ).map((hour) => (
                            <SelectItem
                              key={`start-hour-${hour}`}
                              value={hour.toString()}
                            >
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>:</span>
                      <Select
                        value={startMinute.toString()}
                        onValueChange={(value) =>
                          setStartMinute(Number.parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-16 h-8 border-0 p-0 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(
                            (minute) => (
                              <SelectItem
                                key={`start-minute-${minute}`}
                                value={minute.toString()}
                              >
                                {minute.toString().padStart(2, "0")}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <Select
                        value={startPeriod}
                        onValueChange={setStartPeriod}
                      >
                        <SelectTrigger className="w-16 h-8 border-0 p-0 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["AM", "PM"].map((period) => (
                            <SelectItem
                              key={`start-period-${period}`}
                              value={period}
                            >
                              {period}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {errors.startDate && (
                    <p className="text-xs text-red-500">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                {/* End Date - Improved layout */}
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-medium">
                    End Date<span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full sm:w-[180px] h-10 justify-between text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          {endDate
                            ? format(endDate, "MM/dd/yyyy")
                            : "MM/DD/YYYY"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date);
                            if (date) {
                              // Create a new date with the selected time
                              const dateWithTime = createDateWithTime(
                                date,
                                endHour,
                                endMinute,
                                endPeriod
                              );
                              setValue("endDate", dateWithTime || date);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <div className="flex h-10 items-center space-x-1 border rounded-md px-2 py-1 w-full sm:w-auto">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <Select
                        value={endHour.toString()}
                        onValueChange={(value) =>
                          setEndHour(Number.parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-16 h-8 border-0 p-0 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) =>
                            i === 0 ? 12 : i
                          ).map((hour) => (
                            <SelectItem
                              key={`end-hour-${hour}`}
                              value={hour.toString()}
                            >
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>:</span>
                      <Select
                        value={endMinute.toString()}
                        onValueChange={(value) =>
                          setEndMinute(Number.parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-16 h-8 border-0 p-0 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(
                            (minute) => (
                              <SelectItem
                                key={`end-minute-${minute}`}
                                value={minute.toString()}
                              >
                                {minute.toString().padStart(2, "0")}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <Select value={endPeriod} onValueChange={setEndPeriod}>
                        <SelectTrigger className="w-16 h-8 border-0 p-0 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["AM", "PM"].map((period) => (
                            <SelectItem
                              key={`end-period-${period}`}
                              value={period}
                            >
                              {period}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {errors.endDate && (
                    <p className="text-xs text-red-500">
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
                {dateError && (
                  <p className="text-xs text-red-500 col-span-full -mt-4">
                    {dateError}
                  </p>
                )}
              </div>

              {/* Assessment Timing Options */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Assessment Timing</h3>
                <RadioGroup
                  value={timingType}
                  onValueChange={(value: "questionWise" | "totalDuration") =>
                    handleTimingTypeChange(value)
                  }
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="questionWise" id="questionWise" />
                    <Label
                      htmlFor="questionWise"
                      className="text-sm font-medium"
                    >
                      Question Wise Assessment Timing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="totalDuration" id="totalDuration" />
                    <Label
                      htmlFor="totalDuration"
                      className="text-sm font-medium"
                    >
                      Total Duration Timing
                    </Label>
                  </div>
                </RadioGroup>

                {/* Total Duration - Only shown when Total Duration Timing is selected */}
                {timingType === "totalDuration" && (
                  <div className="space-y-2 mt-4">
                    <Label
                      htmlFor="totalDuration"
                      className="text-sm font-medium"
                    >
                      Total Duration (minutes)
                      <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="totalDuration"
                      {...register("totalDuration")}
                      className="w-full h-10 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select duration</option>
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="20">20 minutes</option>
                      <option value="25">25 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                    {errors.totalDuration && (
                      <p className="text-xs text-red-500">
                        {errors.totalDuration.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Additional Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="additionalDescription"
                  className="text-sm font-medium"
                >
                  Additional Description
                </Label>
                <textarea
                  id="additionalDescription"
                  placeholder="Enter additional description here..."
                  {...register("additionalDescription")}
                  className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#219CAE]"
                />
                {errors.additionalDescription && (
                  <p className="text-xs text-red-500">
                    {errors.additionalDescription.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full md:w-auto bg-[#219CAE] hover:bg-[#1a7d8b] text-white"
                  disabled={!isFormValid}
                >
                  Next
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
