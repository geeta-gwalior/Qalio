"use client";

import { useState } from "react";
import {
  MapPin,
  Edit,
  Calendar,
  User,
  Building,
  Users,
  Briefcase,
  Phone,
  Mail,
  Globe,
  FileText,
  GraduationCap,
  MapIcon,
  BookOpen,
  TrendingUp,
  Home,
  CreditCard,
  Info,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CollegeEditModal } from "./college-edit-modal";
import { ViewInvitationsModal } from "../modals/view-invitations-modal";

interface CollegeProfile {
  userId?: {
    address?: string;
    collegeName?: string;
    avatar?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  collegeName?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  avatar?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  region?: string;
  collegeType?: string;
  university?: string;
  yearOfEstablishment?: number;
  totalStudents?: number | string;
  totalCompanies?: number | string;
  totalJobs?: number | string;
  avgPackage?: number | string;
  achievement?: string;
  performance?: string;
  description?: string;
  coursesOffered?: Array<{
    program: string;
    specializations?: string[];
    intakeCapacity?: number;
  }>;
  placementStatistics?: {
    average?: string;
    highest?: string;
    averagePackage?: string;
  };
  placementOfficer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  topCompanies?: string[];
  infrastructure?: {
    campusArea?: string;
    hostelFacility?: string;
    laboratoryDetails?: string;
    libraryFacilities?: string;
    sportsFacilities?: string;
    transportFacilities?: string;
  };
  bankingDetails?: {
    panCard?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  status?: string;
  tier?: string;
}

interface CollegeProfileViewProps {
  profileData: CollegeProfile;
  onEdit: () => void;
  onProfileUpdate: (profileData: any) => void;
  fetchCollegeProfile: () => void;
}

export function CollegeProfileView({
  profileData,
  onEdit,
  onProfileUpdate,
  fetchCollegeProfile,
}: CollegeProfileViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic-info");
  const [isEditingBaseInfo, setIsEditingBaseInfo] = useState(false);

  const handleEditProfile = (section?: string) => {
    const params = new URLSearchParams();
    params.set("edit", "true");
    if (section) {
      params.set("step", section);
    }
    router.push(`/college/profile/complete?${params.toString()}`);
  };

  const handleBaseUserFormSuccess = async () => {
    setIsEditingBaseInfo(false);
    await fetchCollegeProfile();
    window.location.reload();
  };

  // Get avatar from either userId or direct avatar field
  const getAvatarUrl = () => {
    return profileData?.userId?.avatar || profileData?.avatar;
  };

  // Get college name from various possible sources
  const getCollegeName = () => {
    return profileData?.userId?.name || profileData?.name;
  };

  // Get phone from various sources
  const getPhone = () => {
    return profileData?.userId?.phone || profileData?.phone;
  };

  // Get email from various sources
  const getEmail = () => {
    return profileData?.userId?.email || profileData?.email;
  };

  // Get address from various sources
  const getAddress = () => {
    return (
      profileData?.userId?.address ||
      profileData?.address ||
      (profileData?.city && profileData?.state && profileData?.country
        ? `${profileData.city}, ${profileData.state}, ${profileData.country}`
        : "")
    );
  };

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Profile not found</h2>
          <p className="text-gray-500 mt-2">Please complete your profile</p>
          <button
            onClick={() => router.push("/college/profile/complete")}
            className="mt-4 px-4 py-2 bg-[#219CAE] text-white rounded-md"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-1">
        {/* College info card with integrated avatar */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 relative">
          <div className="flex justify-between items-start mb-4">
            <div></div>
            <div className="flex gap-2">
              <Dialog
                open={isEditingBaseInfo}
                onOpenChange={setIsEditingBaseInfo}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <User className="h-4 w-4" />
                    Edit Profile Info
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Edit College Profile Information</DialogTitle>
                  </DialogHeader>
                  <CollegeEditModal
                    isOpen={isEditingBaseInfo}
                    onClose={() => setIsEditingBaseInfo(false)}
                    initialData={{
                      name: getCollegeName() || "",
                      phone: getPhone() || "",
                      address: getAddress() || "",
                      avatar: getAvatarUrl() || "",
                    }}
                    onSuccess={handleBaseUserFormSuccess}
                  />
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => handleEditProfile("basic-info")}
              >
                <Edit className="h-4 w-4" />
                Edit Details
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar - This serves as the "logo" */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 overflow-hidden border-2 border-[#219CAE]">
              {getAvatarUrl() ? (
                <Image
                  src={getAvatarUrl() || "/placeholder.svg"}
                  width={96}
                  height={96}
                  alt="College avatar"
                  className="w-full h-full object-cover rounded-full"
                  key={`profile-avatar-${getAvatarUrl()}-${Date.now()}`}
                  onError={(e) => {
                    console.log("Profile avatar load error:", e);
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#219CAE] text-white">
                  <Building className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-medium text-gray-700">
                {getCollegeName()}
              </h2>
              <p className="text-sm text-gray-600">
                {profileData?.collegeType} College • {profileData?.university}
              </p>
              {profileData.yearOfEstablishment && (
                <p className="text-xs text-gray-500 mt-1 flex items-center justify-center sm:justify-start">
                  <Calendar className="h-3 w-3 mr-1" />
                  Established {profileData.yearOfEstablishment}
                </p>
              )}
              {profileData.city && (
                <p className="text-xs text-gray-500 mt-1 flex items-center justify-center sm:justify-start">
                  <MapPin className="h-3 w-3 mr-1" />
                  {profileData.city}, {profileData.state}, {profileData.country}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <ViewInvitationsModal userRole={"college"} />
          </div>

          <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="flex items-center">
              <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
                <Users className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <span className="text-xs text-gray-500">Total Students</span>
                <p className="text-sm font-medium">
                  {profileData.totalStudents || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center"></div>
          </div>
        </div>

        {/* College Information section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">College Information</h2>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0 h-auto overflow-x-auto flex-nowrap">
              <TabsTrigger
                value="basic-info"
                className={`px-4 sm:px-6 py-3 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent relative ${
                  activeTab === "basic-info"
                    ? "text-blue-600 font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:border-b-2 after:border-dotted after:border-blue-600"
                    : "text-gray-600 font-normal hover:text-gray-800"
                }`}
              >
                <Building className="h-4 w-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="location"
                className={`px-4 sm:px-6 py-3 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent relative ${
                  activeTab === "location"
                    ? "text-blue-600 font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:border-b-2 after:border-dotted after:border-blue-600"
                    : "text-gray-600 font-normal hover:text-gray-800"
                }`}
              >
                <MapIcon className="h-4 w-4 mr-2" />
                Location
              </TabsTrigger>
              <TabsTrigger
                value="academic"
                className={`px-4 sm:px-6 py-3 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent relative ${
                  activeTab === "academic"
                    ? "text-blue-600 font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:border-b-2 after:border-dotted after:border-blue-600"
                    : "text-gray-600 font-normal hover:text-gray-800"
                }`}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Academic Info
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className={`px-4 sm:px-6 py-3 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent relative ${
                  activeTab === "courses"
                    ? "text-blue-600 font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:border-b-2 after:border-dotted after:border-blue-600"
                    : "text-gray-600 font-normal hover:text-gray-800"
                }`}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Courses
              </TabsTrigger>
              <TabsTrigger
                value="placement"
                className={`px-4 sm:px-6 py-3 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent relative ${
                  activeTab === "placement"
                    ? "text-blue-600 font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:border-b-2 after:border-dotted after:border-blue-600"
                    : "text-gray-600 font-normal hover:text-gray-800"
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Placement
              </TabsTrigger>
              <TabsTrigger
                value="banking"
                className={`px-4 sm:px-6 py-3 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent relative ${
                  activeTab === "banking"
                    ? "text-blue-600 font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:border-b-2 after:border-dotted after:border-blue-600"
                    : "text-gray-600 font-normal hover:text-gray-800"
                }`}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Banking
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className={`px-4 sm:px-6 py-3 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent relative ${
                  activeTab === "about"
                    ? "text-blue-600 font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:border-b-2 after:border-dotted after:border-blue-600"
                    : "text-gray-600 font-normal hover:text-gray-800"
                }`}
              >
                <Info className="h-4 w-4 mr-2" />
                About
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className={`px-4 sm:px-6 py-3 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent relative ${
                  activeTab === "documents"
                    ? "text-blue-600 font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:border-b-2 after:border-dotted after:border-blue-600"
                    : "text-gray-600 font-normal hover:text-gray-800"
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic-info" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Basic Information</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("basic-info")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500">College Name</p>
                  <p className="text-lg font-medium">
                    {getCollegeName() || "Not specified"}
                  </p>
                </div>

                <div className="w-full border-t border-dashed border-cyan-500"></div>

                <div>
                  <p className="text-sm text-gray-500">Website</p>
                  {profileData.website ? (
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-blue-600 hover:underline"
                    >
                      {profileData.website}
                    </a>
                  ) : (
                    <p className="text-lg font-medium">Not specified</p>
                  )}
                </div>

                <div className="w-full border-t border-dashed border-cyan-500"></div>

                <div>
                  <p className="text-sm text-gray-500">Total Students</p>
                  <p className="text-lg font-medium">
                    {profileData.totalStudents || "Not specified"}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Location Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("location")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500">Country</p>
                  <p className="text-lg font-medium">
                    {profileData.country || "Not specified"}
                  </p>
                </div>

                <div className="w-full border-t border-dashed border-cyan-500"></div>

                <div>
                  <p className="text-sm text-gray-500">State</p>
                  <p className="text-lg font-medium">
                    {profileData.state || "Not specified"}
                  </p>
                </div>

                <div className="w-full border-t border-dashed border-cyan-500"></div>

                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="text-lg font-medium">
                    {profileData.city || "Not specified"}
                  </p>
                </div>

                <div className="w-full border-t border-dashed border-cyan-500"></div>

                <div>
                  <p className="text-sm text-gray-500">Zip Code</p>
                  <p className="text-lg font-medium">
                    {profileData.zipCode || "Not specified"}
                  </p>
                </div>

                <div className="w-full border-t border-dashed border-cyan-500"></div>

                {profileData.region && (
                  <div>
                    <p className="text-sm text-gray-500">Region</p>
                    <p className="text-lg font-medium">{profileData.region}</p>
                  </div>
                )}

                {profileData.region && (
                  <div className="w-full border-t border-dashed border-cyan-500"></div>
                )}

                {getAddress() && (
                  <div>
                    <p className="text-sm text-gray-500">Full Address</p>
                    <p className="text-lg font-medium">{getAddress()}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Academic Info Tab */}
            <TabsContent value="academic" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Academic Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("academic-info")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500">University</p>
                  <p className="text-lg font-medium">
                    {profileData.university || "Not specified"}
                  </p>
                </div>

                <div className="w-full border-t border-dashed border-cyan-500"></div>

                <div>
                  <p className="text-sm text-gray-500">College Type</p>
                  <p className="text-lg font-medium">
                    {profileData.collegeType || "Not specified"}
                  </p>
                </div>

                <div className="w-full border-t border-dashed border-cyan-500"></div>

                <div>
                  <p className="text-sm text-gray-500">Year of Establishment</p>
                  <p className="text-lg font-medium">
                    {profileData.yearOfEstablishment || "Not specified"}
                  </p>
                </div>

                <div className="w-full border-t border-dashed border-cyan-500"></div>

                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-medium capitalize">
                    {profileData.status || "Pending"}
                  </p>
                </div>

                <div className="w-full border-t border-dashed border-cyan-500"></div>

                <div>
                  <p className="text-sm text-gray-500">Tier</p>
                  <p className="text-lg font-medium uppercase">
                    {profileData.tier || "Tier 3"}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Courses Offered</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("courses")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              {profileData.coursesOffered &&
              profileData.coursesOffered.length > 0 ? (
                <div className="space-y-6">
                  {profileData.coursesOffered.map((course, index) => (
                    <div
                      key={index}
                      className="space-y-6 border rounded-lg p-4"
                    >
                      <div>
                        <p className="text-sm text-gray-500">Program</p>
                        <p className="text-lg font-medium">{course.program}</p>
                      </div>

                      <div className="w-full border-t border-dashed border-cyan-500"></div>

                      <div>
                        <p className="text-sm text-gray-500">Intake Capacity</p>
                        <p className="text-lg font-medium">
                          {course.intakeCapacity || "Not specified"}
                        </p>
                      </div>

                      {course.specializations &&
                        course.specializations.length > 0 && (
                          <div className="mt-4">
                            <div className="w-full border-t border-dashed border-cyan-500"></div>
                            <p className="text-sm text-gray-500 mb-2">
                              Specializations
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {course.specializations.map((spec, specIndex) => (
                                <span
                                  key={specIndex}
                                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No courses information available
                  </p>
                  <Button onClick={() => handleEditProfile("courses")}>
                    Add Courses
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Placement Tab */}
            <TabsContent value="placement" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Placement Information</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("placement")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              {profileData.placementStatistics ||
              profileData.placementOfficer ||
              profileData.topCompanies ? (
                <div className="space-y-6">
                  {profileData.placementStatistics && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold mb-4">
                        Placement Statistics
                      </h4>
                      <div>
                        <p className="text-sm text-gray-500">Placement Rate</p>
                        <p className="text-lg font-medium">
                          {profileData.placementStatistics.average
                            ? `${profileData.placementStatistics.average}%`
                            : "Not specified"}
                        </p>
                      </div>

                      <div className="w-full border-t border-dashed border-cyan-500"></div>

                      <div>
                        <p className="text-sm text-gray-500">Highest Package</p>
                        <p className="text-lg font-medium">
                          {profileData.placementStatistics.highest
                            ? `${profileData.placementStatistics.highest} LPA`
                            : "Not specified"}
                        </p>
                      </div>

                      <div className="w-full border-t border-dashed border-cyan-500"></div>

                      <div>
                        <p className="text-sm text-gray-500">Average Package</p>
                        <p className="text-lg font-medium">
                          {profileData.placementStatistics.averagePackage
                            ? `${profileData.placementStatistics.averagePackage} LPA`
                            : "Not specified"}
                        </p>
                      </div>
                    </div>
                  )}

                  {profileData.placementOfficer && (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold mb-4">
                        Placement Officer
                      </h4>
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="text-lg font-medium">
                          {profileData.placementOfficer.name || "Not specified"}
                        </p>
                      </div>

                      <div className="w-full border-t border-dashed border-cyan-500"></div>

                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-lg font-medium">
                          {profileData.placementOfficer.email ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className="w-full border-t border-dashed border-cyan-500"></div>

                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-lg font-medium">
                          {profileData.placementOfficer.phone ||
                            "Not specified"}
                        </p>
                      </div>
                    </div>
                  )}

                  {profileData.topCompanies &&
                    profileData.topCompanies.length > 0 && (
                      <div className="space-y-6">
                        <h4 className="text-lg font-semibold mb-4">
                          Top Companies
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {profileData.topCompanies.map((company, index) => (
                            <span
                              key={index}
                              className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded"
                            >
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No placement information available
                  </p>
                  <Button onClick={() => handleEditProfile("placement")}>
                    Add Placement Info
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Banking Tab */}
            <TabsContent value="banking" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  Banking & Contact Information
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("banking")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold mb-4">
                    Contact Information
                  </h4>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">
                          {getEmail() || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="w-full border-t border-dashed border-cyan-500"></div>

                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">
                          {getPhone() || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="w-full border-t border-dashed border-cyan-500"></div>

                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Globe className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        {profileData.website ? (
                          <a
                            href={profileData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {profileData.website}
                          </a>
                        ) : (
                          <p className="font-medium">Not specified</p>
                        )}
                      </div>
                    </div>

                    <div className="w-full border-t border-dashed border-cyan-500"></div>

                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">
                          {getAddress() || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banking Information */}
                {profileData.bankingDetails && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold mb-4">
                      Banking Details
                    </h4>
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm text-gray-500">PAN Card</p>
                        <p className="text-lg font-medium">
                          {profileData.bankingDetails.panCard ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className="w-full border-t border-dashed border-cyan-500"></div>

                      <div>
                        <p className="text-sm text-gray-500">Bank Name</p>
                        <p className="text-lg font-medium">
                          {profileData.bankingDetails.bankName ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className="w-full border-t border-dashed border-cyan-500"></div>

                      <div>
                        <p className="text-sm text-gray-500">Account Number</p>
                        <p className="text-lg font-medium">
                          {profileData.bankingDetails.accountNumber
                            ? "****" +
                              profileData.bankingDetails.accountNumber.slice(-4)
                            : "Not specified"}
                        </p>
                      </div>

                      <div className="w-full border-t border-dashed border-cyan-500"></div>

                      <div>
                        <p className="text-sm text-gray-500">IFSC Code</p>
                        <p className="text-lg font-medium">
                          {profileData.bankingDetails.ifscCode ||
                            "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">About College</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("about")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="space-y-6">
                {profileData.description && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold mb-2">
                      College Description
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {profileData.description}
                    </p>
                  </div>
                )}

                {!profileData.description &&
                  !profileData.achievement &&
                  !profileData.performance && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        No about information available
                      </p>
                      <Button onClick={() => handleEditProfile("about")}>
                        Add About Information
                      </Button>
                    </div>
                  )}
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Documents</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("documents")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  Document management available in edit mode
                </p>
                <Button onClick={() => handleEditProfile("documents")}>
                  Manage Documents
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
