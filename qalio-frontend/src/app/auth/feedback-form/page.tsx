"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { User, Mail, Phone } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().optional(),
  rating: z.string().min(1, "Please select a rating."),
  likedFeatures: z.array(z.string()).min(1, "Select at least one feature."),
  recommend: z.string().min(1, "Please choose an option."),
  facedIssues: z.string().min(1, "Please choose an option."),
  issueDetails: z.string().optional(),
  overallExperience: z.string().min(1, "Please select your experience level."),
  suggestions: z.string().min(5, "Please write some feedback."),
});

type FormValues = z.infer<typeof formSchema>;

export default function FeedbackForm() {
  const [loading, setLoading] = useState(false);
  const [showIssueDetails, setShowIssueDetails] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      rating: "",
      likedFeatures: [],
      recommend: "",
      facedIssues: "no", // Default to "no"
      issueDetails: "",
      overallExperience: "",
      suggestions: "",
    },
  });

  const facedIssuesValue = form.watch("facedIssues");

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/feedback-student`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      toast.success("Thank you for your feedback!");
      setIsSubmitted(true);
      form.reset();
    } catch {
      toast.error("Failed to send feedback. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    "Easy to use",
    "Fast loading speed",
    "Good question quality",
    "Responsive design",
    "Helpful support",
  ];

  const experienceOptions = ["Excellent", "Very Good", "Good", "Fair", "Poor"];

  return (
    <div>
      <h1 className="text-[40px] font-bold text-[#242424]">Student Feedback</h1>
      <p className="text-[16px] text-[#242424] mt-[6px]">
        We value your opinion! Help us improve our assessment platform.
      </p>

      {isSubmitted ? (
        <div className="mt-10 text-center p-6 border rounded-lg bg-green-50">
          <h2 className="text-2xl font-bold text-green-700">
            Thank you for your feedback!
          </h2>
          <p className="mt-2 text-gray-700">
            The Qalio team will take everything into consideration.
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-8 space-y-6"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#242424]"
                        size={16}
                      />
                      <Input
                        {...field}
                        placeholder="Your full name"
                        className="pl-10 h-[50px]"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#242424]"
                        size={16}
                      />
                      <Input
                        type="email"
                        {...field}
                        placeholder="you@example.com"
                        className="pl-10 h-[50px]"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone (optional) */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#242424]"
                        size={16}
                      />
                      <Input
                        type="tel"
                        {...field}
                        placeholder="10-digit phone"
                        className="pl-10 h-[50px]"
                        maxLength={10}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Rating</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-[50px]">
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((r) => (
                          <SelectItem key={r} value={String(r)}>
                            {Array(r).fill("⭐").join("")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Liked Features */}
            <FormField
              control={form.control}
              name="likedFeatures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What did you like?</FormLabel>
                  <div className="space-y-2">
                    {features.map((f) => (
                      <div key={f} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value.includes(f)}
                          className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE]"
                          onCheckedChange={(checked) => {
                            if (checked) field.onChange([...field.value, f]);
                            else
                              field.onChange(
                                field.value.filter((val) => val !== f)
                              );
                          }}
                        />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Faced Issues */}
            <FormField
              control={form.control}
              name="facedIssues"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Did you face any issues while giving the assessment?
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setShowIssueDetails(value === "yes");
                    }}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="h-[50px]">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Issue Details - Conditionally rendered */}
            {facedIssuesValue === "yes" && (
              <FormField
                control={form.control}
                name="issueDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please describe the issue</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the issue..."
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Overall Experience Dropdown */}
            <FormField
              control={form.control}
              name="overallExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    How is your overall experience with our platform?
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-[50px]">
                        <SelectValue placeholder="Select your experience" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recommend */}
            <FormField
              control={form.control}
              name="recommend"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Would you recommend us to others?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="h-[50px]">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Suggestions */}
            <FormField
              control={form.control}
              name="suggestions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suggestions / Improvements</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Your feedback..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#219CAE] h-[50px]"
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
