"use client";

import { useState, useEffect } from "react";
import CompanyProfileForm from "@/components/company/company-profile-form";
import { CompanyProfileView } from "@/components/company/company-profile-view";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function CompanyProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const getAuthToken = () => {
    // Get token from cookie
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("jwt=")
    );
    if (tokenCookie) {
      return tokenCookie.split("=")[1];
    }
    return null;
  };

  const fetchCompanyProfile = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();

      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setIsLoading(false);
        setIsEditMode(true);
        return;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/company/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setProfileData(response.data.company);
        console.log("Profile data:", profileData);

        // Check if profile is complete directly from the response
        const completedProfile =
          response.data.company?.completedProfile || false;
        console.log("Completed profile:", completedProfile);

        // If profile is not complete, go to edit mode
        setIsEditMode(!completedProfile);
      } else {
        toast.error(response.data.message || "Failed to load profile");
        setIsEditMode(true);
      }
    } catch (error: any) {
      console.error("Error fetching company profile:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load profile";
      toast.error(errorMessage);
      setIsEditMode(true); // If error, default to edit mode
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    await fetchCompanyProfile();
    toast.success("Profile updated successfully");
    setIsEditMode(false);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="py-4">
      {profileData?.completedProfile && !isEditMode ? (
        <CompanyProfileView
          fetchCompanyProfile={fetchCompanyProfile}
          profileData={profileData}
          onEdit={toggleEditMode}
        />
      ) : (
        <CompanyProfileForm
          defaultValues={profileData}
          onUpdate={handleProfileUpdate}
          onCancel={toggleEditMode}
          isLoading={isLoading}
          isEditMode={isEditMode}
        />
      )}
    </div>
  );
}
