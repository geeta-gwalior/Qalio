// src/app/(authenticated)/company/profile/profileLoader.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";

export default function ProfileLoader() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const getAuthToken = () => {
    // Get token from cookie
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('jwt='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    return null;
  };

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const token = getAuthToken();
        
        if (!token) {
          toast.error("Authentication token not found. Please log in again.");
          router.push("/login");
          setIsLoading(false);
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/company/profile/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          // Check if profile exists and its status
          const status = response.data.status;
          const completionPercentage = response.data.completionPercentage || 0;
          
          // Always redirect to profile page - the page component will handle
          // whether to show the form or the view based on completion status
          router.push("/company/profile");
        } else {
          // If profile doesn't exist or status check failed, still go to profile page
          // which will show the form
          router.push("/company/profile");
        }
      } catch (error: any) {
        console.error("Error checking profile status:", error);
        const errorMessage = error.response?.data?.message || "Failed to check profile status";
        toast.error(errorMessage);
        
        // Even on error, redirect to profile page which will handle the error state
        router.push("/company/profile");
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileStatus();
  }, [router]);

  return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)]">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      <span className="mt-4 text-teal-600 font-medium">Loading your company profile...</span>
    </div>
  );
}