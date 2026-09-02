"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Loader2, Plus, Trash2, LinkIcon } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const portfolioItemSchema = z.object({
  title: z.string().min(2, "Title is required"),
  url: z.string().url("Please enter a valid URL"),
  description: z.string().optional(),
  type: z.string().min(2, "Type is required"),
});

const portfolioSchema = z.object({
  portfolioItems: z
    .array(portfolioItemSchema)
    .min(1, "At least one portfolio item is required"),
});

interface PortfolioFormProps {
  initialData?: {
    title: string;
    url: string;
    description?: string;
    type: string;
  }[];
  onSubmit: (
    data: { title: string; url: string; description?: string; type: string }[]
  ) => void;
  isLoading: boolean;
}

export default function PortfolioForm({
  initialData,
  onSubmit,
  isLoading,
}: PortfolioFormProps) {
  const form = useForm({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      portfolioItems: initialData || [
        {
          title: "",
          url: "",
          description: "",
          type: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "portfolioItems",
  });

  const handleSubmit = (data: {
    portfolioItems: {
      title: string;
      url: string;
      description?: string;
      type: string;
    }[];
  }) => {
    onSubmit(data.portfolioItems);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Portfolio</h2>
          <p className="text-sm text-gray-500">
            Add links to your projects, GitHub repositories, personal website,
            or any other work you&apos;d like to showcase.
          </p>
        </div>

        <div className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between bg-gray-50 rounded-t-lg p-4">
                <CardTitle className="text-lg">
                  Portfolio Item #{index + 1}
                </CardTitle>
                {fields.length > 1 && (
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
                {/* Title */}
                <FormField
                  control={form.control}
                  name={`portfolioItems.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="E.g., Personal Website, GitHub Project"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type */}
                <FormField
                  control={form.control}
                  name={`portfolioItems.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="E.g., Website, GitHub, LinkedIn"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* URL */}
                <FormField
                  control={form.control}
                  name={`portfolioItems.${index}.url`}
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <LinkIcon className="mr-2 h-4 w-4 text-gray-500" />
                          <Input placeholder="https://..." {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name={`portfolioItems.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe this portfolio item"
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
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              append({
                title: "",
                url: "",
                description: "",
                type: "",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Portfolio Item
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
