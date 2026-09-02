"use client";

import { useState, useEffect } from "react";
import { CollegeProfileView } from "@/components/college/college-profile-view";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { collegeAPI } from "@/utils/api";
import type { CollegeProfile } from "@/types/college";
import { useRouter } from "next/navigation";

export default function CollegeProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<CollegeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectAttempts, setRedirectAttempts] = useState(0);

  useEffect(() => {
    fetchCollegeProfile();
  }, []);

  const fetchCollegeProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await collegeAPI.getCollegeProfile();

      if (response.success && response.college) {
        setProfileData(response.college);

        // More flexible completion check - don't require completedProfile flag
        const hasBasicInfo = response.college?.collegeName;
        const hasLocation = response.college?.country;
        const hasAcademic = response.college?.university;

        // If we have basic required fields, consider it complete enough to show profile
        // Don't redirect if we've already tried multiple times (prevent infinite loop)
        if (!hasBasicInfo && redirectAttempts < 2) {
          setRedirectAttempts((prev) => prev + 1);
          router.push("/college/profile/complete");
          return;
        }

        // If we have basic info but missing other required fields, still show profile
        // but allow editing
        if (hasBasicInfo) {
          console.log("Profile has basic info, showing profile view");
          // Profile is good enough to display
          return;
        }
      } else {
        // No profile data found, redirect to complete page only if not already tried
        if (redirectAttempts < 2) {
          console.log("No profile found, redirecting to complete page");
          setRedirectAttempts((prev) => prev + 1);
          router.push("/college/profile/complete");
          return;
        } else {
          // Too many redirect attempts, show error instead
          setError("Unable to load profile. Please try refreshing the page.");
        }
      }
    } catch (error: any) {
      console.error("Error fetching college profile:", error);
      const errorMessage = error.message || "Failed to load profile";
      setError(errorMessage);

      // Only redirect on specific errors and if not already tried multiple times
      if (
        (error.message?.includes("not found") || error.status === 404) &&
        redirectAttempts < 2
      ) {
        setRedirectAttempts((prev) => prev + 1);
        router.push("/college/profile/complete");
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedData?: Partial<CollegeProfile>) => {
    // If specific data is provided, update local state immediately
    if (updatedData && profileData) {
      setProfileData((prev) => (prev ? { ...prev, ...updatedData } : null));
    }

    // Then fetch fresh data from server
    await fetchCollegeProfile();
    toast.success("Profile updated successfully");
  };

  const handleLocalProfileUpdate = (updatedData: Partial<CollegeProfile>) => {
    // Update local state immediately for instant UI feedback
    if (profileData) {
      setProfileData((prev) => (prev ? { ...prev, ...updatedData } : null));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#219CAE]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-2 space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/college/profile/complete")}
            >
              Complete Profile
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // Only render profile view if we have profile data
  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Profile not found</h2>
          <p className="text-gray-500 mt-2">Please complete your profile</p>
          <Button
            onClick={() => router.push("/college/profile/complete")}
            className="mt-4 bg-[#219CAE] text-white"
          >
            Complete Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 ">
      <CollegeProfileView
        fetchCollegeProfile={fetchCollegeProfile}
        profileData={profileData}
        onEdit={() => router.push("/college/profile/complete?edit=true")}
        onProfileUpdate={handleLocalProfileUpdate}
      />
    </div>
  );
}
