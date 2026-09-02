"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Globe,
  MapPin,
  Users,
  Building,
  Briefcase,
  DollarSign,
} from "lucide-react";
import { CollegeEditModal } from "@/components/college/college-edit-modal";
import { getCookie } from "@/utils/getCookie";
import { toast } from "sonner";
import Image from "next/image";

interface CollegeProfileData {
  name: string;
  phone: string;
  address: string;
  avatar?: string;
  collegeName: string;
  website: string;
  location: string;
  totalStudents: number | string;
  totalCompanies: number | string;
  totalJobs: number | string;
  avgPackage: number | string;
  status: string;
  completion: number;
}

interface CollegeDashboardProps {
  initialData: CollegeProfileData;
}

export default function CollegeDashboard({
  initialData,
}: CollegeDashboardProps): React.JSX.Element {
  const [profileData, setProfileData] =
    useState<CollegeProfileData>(initialData);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh profile data from server
  const refreshProfileData = async () => {
    try {
      setIsLoading(true);
      const token = getCookie("jwt");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      const newProfileData = data.college || data.data || data;

      // Force update of profile data
      setProfileData(newProfileData);
    } catch (error) {
      console.error("Error refreshing profile data:", error);
      toast.error("Failed to refresh profile data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful profile update
  const handleProfileUpdateSuccess = async () => {
    await refreshProfileData();
    // Force page refresh to ensure all components update
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-[#219CAE] to-[#19b8d0] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                {profileData.avatar ? (
                  <Image
                    src={profileData.avatar || "/placeholder.svg"}
                    alt="College Avatar"
                    className="w-full h-full object-cover"
                    key={`dashboard-avatar-${profileData.avatar}-${Date.now()}`}
                    onError={(e) => {
                      console.log("Dashboard avatar error:", e);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <Building className="w-8 h-8 text-white" />
                )}
              </div>

              {/* College Info */}
              <div>
                <h1 className="text-2xl font-bold">
                  {profileData.collegeName || profileData.name}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm opacity-90">
                    {profileData.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="secondary"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              disabled={isLoading}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile Info
            </Button>
          </div>

          {/* Status and Completion */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-sm opacity-75">Status:</span>
                <Badge className={`ml-2 ${getStatusColor(profileData.status)}`}>
                  {profileData.status}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm opacity-75">Completion:</span>
              <span className="ml-2 font-semibold">
                {profileData.completion}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold">@</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">iitm@example.com</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-semibold">#</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{profileData.phone || "N/A"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#219CAE]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Website</p>
              <a
                href={profileData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                {profileData.website}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">College Name</h3>
            <p className="text-lg">
              {profileData.collegeName || profileData.name}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Website</h3>
            <a
              href={profileData.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {profileData.website}
            </a>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Total Students</h3>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-lg">
                {profileData.totalStudents || "N/A"}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">
              Total Companies
            </h3>
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-green-500" />
              <span className="text-lg">
                {profileData.totalCompanies || "N/A"}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Total Jobs</h3>
            <div className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-purple-500" />
              <span className="text-lg">{profileData.totalJobs || "N/A"}</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">
              Average Package (LPA)
            </h3>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <span className="text-lg">{profileData.avgPackage || "N/A"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      {profileData.address && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Address</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{profileData.address}</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Profile Modal */}
      <CollegeEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={{
          name: profileData.name || profileData.collegeName,
          phone: profileData.phone,
          address: profileData.address,
          avatar: profileData.avatar,
        }}
        onSuccess={handleProfileUpdateSuccess}
      />
    </div>
  );
}
