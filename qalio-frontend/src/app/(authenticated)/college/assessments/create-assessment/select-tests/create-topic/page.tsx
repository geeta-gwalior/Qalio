"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { toast } from "sonner";
import { BackHeader } from "@/components/backHeader";
import { getCookie } from "@/utils/getCookie";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
export default function CreateTopic() {
  const router = useRouter();
  const { formData } = useAssessmentForm();
  const [topicData, setTopicData] = useState({
    name: "",
    description: "",
  });

  console.log("formData", formData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topicDetails, setTopicDetails] = useState({});
  const token = getCookie("jwt");
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTopicData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNextStep = async () => {
    if (!topicData.name.trim()) {
      toast("Please add topic name!!");
      return;
    }

    if (!topicData.description.trim()) {
      toast("Please add topic description!!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post("/api/topics", topicData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setTopicDetails(res);
      toast.success("Topic added successfully!!");
      localStorage.setItem("currentTopic", JSON.stringify(topicData));
      localStorage.setItem("currentTopicDetails", JSON.stringify(res.data));
      router.push("create-topic/add-questions");
    } catch (error) {
      toast.error(`Failed to save topic. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        {/* <Button onClick={() => router.back()} variant="ghost" className="p-2">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Create Topic</h1> */}
        <BackHeader
          title="Select Topics for Assessment"
          defaultRoute="/college/assessments/create-assessment/select-tests"
        />
        <Button
          onClick={handleNextStep}
          className="bg-[#4AA3B1] hover:bg-[#3A8A98] text-white px-6"
          disabled={isSubmitting}
        >
          Next Step {isSubmitting ? "..." : "→"}
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <Input
            name="name"
            value={topicData.name}
            onChange={handleChange}
            placeholder="Name of the Topic"
            className="bg-gray-50 border-gray-200 h-14"
          />
        </div>

        <div>
          <Textarea
            name="description"
            value={topicData.description}
            onChange={handleChange}
            placeholder="Add Description"
            className="bg-gray-50 border-gray-200 min-h-[200px]"
          />
        </div>
      </div>
    </div>
  );
}
