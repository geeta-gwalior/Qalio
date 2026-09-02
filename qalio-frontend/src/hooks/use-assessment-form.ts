"use client";
import axios from "axios";
import { useState, useEffect } from "react";
import { SelectedQuestion } from "@/types/assessment";

export type AssessmentFormData = {
  name: string;
  level: string;
  attempts: string;
  questions: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  totalDuration: number; // in minutes
  isNegativeMarking: boolean;
  topics: {
    _id: string;
    heading: string;
    description: string;
    type: string;
    icon?: string;
    questionCount?: number;
    duration?: string;
    selectedQuestions?: SelectedQuestion[];
  }[];
  cameraAccess: boolean;
  tabSwitches: boolean;
  instructionTitle: string;
  description: string;
  additionalDescription?: string;
  departments?: string[];
  [key: string]: any;
  isTotalDuration: boolean;
};

// Initial empty form data
const initialFormData: AssessmentFormData = {
  name: "",
  level: "",
  attempts: "",
  questions: "",
  startDate: null,
  endDate: null,
  totalDuration: 0,
  isNegativeMarking: false,
  topics: [],
  cameraAccess: false,
  tabSwitches: false,
  instructionTitle: "",
  description: "",
  additionalDescription: "",
  //selectedSections: [],
  departments: [],
  isTotalDuration: false,
};

export function useAssessmentForm() {
  const [formData, setFormData] = useState<AssessmentFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(true);

  console.log("formdata", formData);

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem("assessmentFormData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);

        // Convert date strings back to Date objects
        if (parsedData.startDate)
          parsedData.startDate = new Date(parsedData.startDate);
        if (parsedData.endDate)
          parsedData.endDate = new Date(parsedData.endDate);

        setFormData(parsedData);
      } catch (error) {
        console.error("Error parsing saved form data:", error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("assessmentFormData", JSON.stringify(formData));
    }
  }, [formData, isLoading]);

  const updateFormData = (newData: Partial<AssessmentFormData>) => {
    setFormData((prevData) => {
      const updatedData = {
        ...prevData,
        ...newData,
      };

      // Ensure dates are properly handled
      if (newData.startDate) {
        updatedData.startDate = new Date(newData.startDate);
      }
      if (newData.endDate) {
        updatedData.endDate = new Date(newData.endDate);
      }

      return updatedData;
    });
  };

  const clearFormData = () => {
    localStorage.removeItem("assessmentFormData");
    setFormData(initialFormData);
  };

  const submitFormData = async (
    token: string | null | undefined
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const response = await axios.post("/api/assessment/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      //  console.log("Form submitted successfully", response.data);
      return { success: true, message: "Assessment created successfully!" };
    } catch (error) {
      console.error("Error submitting form:", error);
      return {
        success: false,
        message: "Failed to create assessment. Please try again.",
      };
    }
  };

  return {
    formData,
    updateFormData,
    clearFormData,
    submitFormData,
    isLoading,
  };
}
