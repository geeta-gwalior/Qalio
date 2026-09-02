"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const skillsSchema = z.object({
  technicalSkills: z
    .array(z.string())
    .min(1, "At least one technical skill is required"),
  nonTechnicalSkills: z.array(z.string()).optional(),
  preferredJobRoles: z
    .array(z.string())
    .min(1, "At least one preferred job role is required"),
  preferredJobLocations: z.array(z.string()).optional(),
  additionalInfo: z.string().optional(),
});

interface SkillsFormProps {
  initialData?: {
    technicalSkills: string[];
    nonTechnicalSkills?: string[];
    preferredJobRoles: string[];
    preferredJobLocations?: string[];
    additionalInfo?: string;
  };
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export default function SkillsForm({
  initialData,
  onSubmit,
  isLoading,
}: SkillsFormProps) {
  const [technicalSkill, setTechnicalSkill] = useState("");
  const [nonTechnicalSkill, setNonTechnicalSkill] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobLocation, setJobLocation] = useState("");

  const form = useForm<z.infer<typeof skillsSchema>>({
    resolver: zodResolver(skillsSchema),
    defaultValues: initialData || {
      technicalSkills: [],
      nonTechnicalSkills: [],
      preferredJobRoles: [],
      preferredJobLocations: [],
      additionalInfo: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof skillsSchema>) => {
    onSubmit(data);
  };

  const addTechnicalSkill = () => {
    if (technicalSkill.trim() !== "") {
      const currentSkills = form.getValues("technicalSkills") || [];
      if (!currentSkills.includes(technicalSkill.trim())) {
        form.setValue(
          "technicalSkills",
          [...currentSkills, technicalSkill.trim()],
          { shouldValidate: true } // Trigger validation
        );
        setTechnicalSkill("");
      }
    }
  };

  const removeTechnicalSkill = (skill: string) => {
    const currentSkills = form.getValues("technicalSkills") || [];
    form.setValue(
      "technicalSkills",
      currentSkills.filter((s) => s !== skill),
      { shouldValidate: true } // Trigger validation
    );
  };

  const addNonTechnicalSkill = () => {
    if (nonTechnicalSkill.trim() !== "") {
      const currentSkills = form.getValues("nonTechnicalSkills") || [];
      if (!currentSkills.includes(nonTechnicalSkill.trim())) {
        form.setValue(
          "nonTechnicalSkills",
          [...currentSkills, nonTechnicalSkill.trim()],
          { shouldValidate: true } // Trigger validation
        );
        setNonTechnicalSkill("");
      }
    }
  };

  const removeNonTechnicalSkill = (skill: string) => {
    const currentSkills = form.getValues("nonTechnicalSkills") || [];
    form.setValue(
      "nonTechnicalSkills",
      currentSkills.filter((s) => s !== skill),
      { shouldValidate: true } // Trigger validation
    );
  };

  const addJobRole = () => {
    if (jobRole.trim() !== "") {
      const currentRoles = form.getValues("preferredJobRoles") || [];
      if (!currentRoles.includes(jobRole.trim())) {
        form.setValue(
          "preferredJobRoles",
          [...currentRoles, jobRole.trim()],
          { shouldValidate: true } // Trigger validation
        );
        setJobRole("");
      }
    }
  };

  const removeJobRole = (role: string) => {
    const currentRoles = form.getValues("preferredJobRoles") || [];
    form.setValue(
      "preferredJobRoles",
      currentRoles.filter((r) => r !== role),
      { shouldValidate: true } // Trigger validation
    );
  };

  const addJobLocation = () => {
    if (jobLocation.trim() !== "") {
      const currentLocations = form.getValues("preferredJobLocations") || [];
      if (!currentLocations.includes(jobLocation.trim())) {
        form.setValue(
          "preferredJobLocations",
          [...currentLocations, jobLocation.trim()],
          { shouldValidate: true } // Trigger validation
        );
        setJobLocation("");
      }
    }
  };

  const removeJobLocation = (location: string) => {
    const currentLocations = form.getValues("preferredJobLocations") || [];
    form.setValue(
      "preferredJobLocations",
      currentLocations.filter((l) => l !== location),
      { shouldValidate: true } // Trigger validation
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Skills & Preferences</h2>
          <p className="text-sm text-gray-500">
            Add your skills and job preferences to help match you with suitable
            opportunities.
          </p>
        </div>
        <div className="space-y-6">
          {/* Technical Skills */}
          <Card>
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="technicalSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technical Skills</FormLabel>
                    <div className="flex gap-2 mb-2">
                      <FormControl>
                        <Input
                          placeholder="E.g., JavaScript, Python, React"
                          value={technicalSkill}
                          onChange={(e) => setTechnicalSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTechnicalSkill();
                            }
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        className="bg-[#219CAE]"
                        onClick={addTechnicalSkill}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value?.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeTechnicalSkill(skill)}
                            className="ml-2 h-4 w-4 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                            aria-label={`Remove ${skill}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <FormDescription>
                      Press Enter or click Add to add a skill.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Non-Technical Skills */}
          <Card>
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="nonTechnicalSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Non-Technical Skills (Optional)</FormLabel>
                    <div className="flex gap-2 mb-2">
                      <FormControl>
                        <Input
                          placeholder="E.g., Communication, Leadership, Teamwork"
                          value={nonTechnicalSkill}
                          onChange={(e) => setNonTechnicalSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addNonTechnicalSkill();
                            }
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        className="bg-[#219CAE]"
                        onClick={addNonTechnicalSkill}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value?.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => {
                              removeNonTechnicalSkill(skill);
                            }}
                            className="ml-2 h-4 w-4 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                            aria-label={`Remove ${skill}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <FormDescription>
                      Add soft skills that complement your technical abilities.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Preferred Job Roles */}
          <Card>
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="preferredJobRoles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Job Roles</FormLabel>
                    <div className="flex gap-2 mb-2">
                      <FormControl>
                        <Input
                          placeholder="E.g., Software Developer, Data Analyst"
                          value={jobRole}
                          onChange={(e) => setJobRole(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addJobRole();
                            }
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        className="bg-[#219CAE]"
                        onClick={addJobRole}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value?.map((role, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1"
                        >
                          {role}
                          <button
                            type="button"
                            onClick={() => removeJobRole(role)}
                            className="ml-2 h-4 w-4 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                            aria-label={`Remove ${role}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Preferred Job Locations */}
          <Card>
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="preferredJobLocations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Job Locations (Optional)</FormLabel>
                    <div className="flex gap-2 mb-2">
                      <FormControl>
                        <Input
                          placeholder="E.g., Bangalore, Remote, Hybrid"
                          value={jobLocation}
                          onChange={(e) => setJobLocation(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addJobLocation();
                            }
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        className="bg-[#219CAE]"
                        onClick={addJobLocation}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value?.map((location, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1"
                        >
                          {location}
                          <button
                            type="button"
                            onClick={() => removeJobLocation(location)}
                            className="ml-2 h-4 w-4 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                            aria-label={`Remove ${location}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <FormDescription>
                      Add cities, regions, or work arrangements (remote/hybrid).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardContent className="p-6">
              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other information about your skills or preferences"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
        <Button
          type="submit"
          className="w-full bg-[#219CAE]"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save & Continue"
          )}
        </Button>
      </form>
    </Form>
  );
}
