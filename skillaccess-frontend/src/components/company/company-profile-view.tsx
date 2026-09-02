"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  Edit,
  Download,
  Award,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import BaseUserForm from "../profile/base-user-form";
import { ViewInvitationsModal } from "../modals/view-invitations-modal";

interface CompanyProfileViewProps {
  profileData: any;
  onEdit: () => void;
  fetchCompanyProfile: () => void;
}

export function CompanyProfileView({
  profileData,
  onEdit,
  fetchCompanyProfile,
}: CompanyProfileViewProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [expandedPolicies, setExpandedPolicies] = useState<string[]>([]);
  const [isEditingBaseInfo, setIsEditingBaseInfo] = useState(false);

  const togglePolicy = (policy: string) => {
    setExpandedPolicies((prev) =>
      prev.includes(policy)
        ? prev.filter((p) => p !== policy)
        : [...prev, policy]
    );
  };

  // Helper function to format status with appropriate color
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            Pending Approval
          </Badge>
        );
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      default:
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600">Incomplete</Badge>
        );
    }
  };

  // Helper function to render a field with icon
  const renderField = (
    icon: React.ReactNode,
    label: string,
    value: string | undefined | null
  ) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 mb-4">
        <div className="text-cyan-500 mt-1">{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="font-medium">{value}</p>
        </div>
      </div>
    );
  };

  // Helper function to render a document link
  const renderDocument = (label: string, url: string | undefined) => {
    if (!url) return null;
    return (
      <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-md">
        <span className="font-medium">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:underline"
        >
          <Download size={16} className="mr-1" />
          Download
        </a>
      </div>
    );
  };

  // Helper function to render a collapsible policy section
  const renderPolicySection = (
    id: string,
    title: string,
    content: string | undefined
  ) => {
    if (!content) return null;
    const isExpanded = expandedPolicies.includes(id);

    return (
      <div className="border-b last:border-b-0">
        <button
          type="button"
          onClick={() => togglePolicy(id)}
          className="flex w-full justify-between items-center py-4 text-left font-medium transition-all hover:text-cyan-500 focus:outline-none focus:text-cyan-500"
        >
          {title}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-cyan-500" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {isExpanded && (
          <div className="pb-4">
            <p className="text-gray-700 whitespace-pre-line">{content}</p>
          </div>
        )}
      </div>
    );
  };

  // Helper function to render a detail field
  const renderDetailField = (
    label: string,
    value: string | number | undefined | null
  ) => {
    if (!value) return null;
    return (
      <div className="mb-6">
        <div className="text-gray-500 text-sm mb-1">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    );
  };

  const handleBaseUserFormSuccess = () => {
    setIsEditingBaseInfo(false);
    fetchCompanyProfile(); // Refresh the profile data
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Company Banner */}
      <div className="relative w-full h-48 md:h-64 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg overflow-hidden mb-6">
        <div className="absolute z-20 top-4 right-4 flex items-center gap-2">
          <Dialog open={isEditingBaseInfo} onOpenChange={setIsEditingBaseInfo}>
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
                <DialogTitle>Edit Profile Information</DialogTitle>
              </DialogHeader>
              <BaseUserForm
                initialData={{
                  name: profileData.userId.name,
                  phone: profileData.userId.phone,
                  address: profileData.userId.address,
                  avatar: profileData.userId.avatar,
                }}
                onSuccess={handleBaseUserFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>

        {profileData?.basic?.coverPhoto ? (
          <Image
            src={profileData.basic.coverPhoto || "/placeholder.svg"}
            alt="Company Cover"
            fill
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white text-xl font-medium">Company Banner</p>
          </div>
        )}

        <div className="absolute bottom-4 left-4 flex items-end">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-lg overflow-hidden border-4 border-white shadow-md">
            {profileData?.userId?.avatar ? (
              <Image
                src={profileData?.userId?.avatar || "/placeholder.svg"}
                alt="Company Logo"
                width={96}
                height={96}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-200">
                <Building2 size={32} className="text-gray-400" />
              </div>
            )}
          </div>
          <div className="ml-3 bg-white/80 backdrop-blur-sm p-2 rounded-md">
            <h2 className="text-xl font-bold">
              {profileData?.userId?.name || "Company Name"}
            </h2>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin size={14} className="mr-1" />
              {profileData?.location?.locName || "Location"}
            </div>
          </div>
        </div>

        {/* Add the Edit Profile Info button at the top of the profile view, next to the Edit Profile button */}
        {/* In the Company Banner section, replace the existing button div with: */}
      </div>

      <div className="mt-4 flex items-center justify-end">
        <ViewInvitationsModal userRole={"company"} />
      </div>

      {/* User info card */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 relative">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <p className="text-gray-500">Status:</p>
            {getStatusBadge(profileData?.status)}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-gray-500">Completion:</p>
            <span className="font-medium">
              {profileData?.completionPercentage || 0}%
            </span>
          </div>
        </div>

        <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div className="flex items-center">
            <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
              <Mail className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm truncate">
              {profileData?.basic?.corporateEmail || "N/A"}
            </span>
          </div>

          <div className="flex items-center">
            <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
              <Phone className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm truncate">
              {profileData?.basic?.alternatePhone || "N/A"}
            </span>
          </div>

          <div className="flex items-center">
            <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
              <MapPin className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm truncate">
              {profileData?.location?.locName || "N/A"}
            </span>
          </div>

          <div className="flex items-center">
            <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
              <Globe className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm truncate">
              {profileData?.basic?.website ? (
                <a
                  href={profileData.basic.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-blue-600"
                >
                  {profileData.basic.website.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                "No website"
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Other Information section */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Other Information</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0 h-auto overflow-x-auto flex-nowrap">
            <TabsTrigger
              value="basic"
              className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                activeTab === "basic"
                  ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                  : "text-gray-600 font-normal"
              }`}
            >
              Basic Info
            </TabsTrigger>
            <TabsTrigger
              value="official"
              className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                activeTab === "official"
                  ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                  : "text-gray-600 font-normal"
              }`}
            >
              Official Info
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                activeTab === "contact"
                  ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                  : "text-gray-600 font-normal"
              }`}
            >
              Contact Person
            </TabsTrigger>
            <TabsTrigger
              value="location"
              className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                activeTab === "location"
                  ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                  : "text-gray-600 font-normal"
              }`}
            >
              Location
            </TabsTrigger>
            <TabsTrigger
              value="job"
              className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                activeTab === "job"
                  ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                  : "text-gray-600 font-normal"
              }`}
            >
              Job Details
            </TabsTrigger>
            <TabsTrigger
              value="policies"
              className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                activeTab === "policies"
                  ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                  : "text-gray-600 font-normal"
              }`}
            >
              Policies
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                activeTab === "about"
                  ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                  : "text-gray-600 font-normal"
              }`}
            >
              About
            </TabsTrigger>
            {/* <TabsTrigger
              value="documents"
              className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                activeTab === "documents"
                  ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                  : "text-gray-600 font-normal"
              }`}
            >
              Documents
            </TabsTrigger> */}
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="mt-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Basic Information</h3>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Company Name</p>
                <p className="text-lg font-medium">
                  {profileData?.basic?.companyName || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Website</p>
                <p className="text-lg font-medium">
                  {profileData?.basic?.website ? (
                    <a
                      href={profileData.basic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {profileData.basic.website}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Corporate Email</p>
                <p className="text-lg font-medium">
                  {profileData?.basic?.corporateEmail || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Alternate Phone</p>
                <p className="text-lg font-medium">
                  {profileData?.basic?.alternatePhone || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-lg font-medium">
                  {profileData?.basic?.totalEmployees || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Year Founded</p>
                <p className="text-lg font-medium">
                  {profileData?.basic?.yearFounded || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Sector</p>
                <p className="text-lg font-medium">
                  {profileData?.basic?.sector || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Industry</p>
                <p className="text-lg font-medium">
                  {profileData?.basic?.industry || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Annual Revenue</p>
                <p className="text-lg font-medium">
                  {profileData?.basic?.annualRevenue || "N/A"}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Official Info Tab */}
          <TabsContent value="official" className="mt-6 relative">
            {/* Replace the existing buttons in the Official Info Tab with: */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Official Information</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={onEdit}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                {/* <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() =>
                    (window.location.href = "/company/profile/edit-info")
                  }
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile Info
                </Button> */}
              </div>
            </div>

            <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>

            {profileData?.officialInformation ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Company Type</p>
                  <p className="text-lg font-medium">
                    {profileData.officialInformation.companyType || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">GST Number</p>
                  <p className="text-lg font-medium">
                    {profileData.officialInformation.gstNumber || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Udyam Registration Number
                  </p>
                  <p className="text-lg font-medium">
                    {profileData.officialInformation.udyamRegistrationNumber ||
                      "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Industry Type</p>
                  <p className="text-lg font-medium">
                    {profileData.officialInformation.industryType || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Year of Establishment</p>
                  <p className="text-lg font-medium">
                    {profileData.officialInformation.yearOfEstablishment ||
                      "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No official information provided
              </p>
            )}
          </TabsContent>

          {/* Contact Person Tab */}
          <TabsContent value="contact" className="mt-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Contact Person Details</h3>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>

            {profileData?.contactPerson ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-lg font-medium">
                    {profileData.contactPerson.name || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Designation</p>
                  <p className="text-lg font-medium">
                    {profileData.contactPerson.designation || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-lg font-medium">
                    {profileData.contactPerson.email || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-lg font-medium">
                    {profileData.contactPerson.phone || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No contact person information provided
              </p>
            )}
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="mt-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Location Details</h3>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>

            {profileData?.location ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Location Name</p>
                  <p className="text-lg font-medium">
                    {profileData.location.locName || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-lg font-medium">
                    {profileData.location.address || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Town/City</p>
                  <p className="text-lg font-medium">
                    {profileData.location.town || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">State</p>
                  <p className="text-lg font-medium">
                    {profileData.location.state || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Country</p>
                  <p className="text-lg font-medium">
                    {profileData.location.country || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Postal Code</p>
                  <p className="text-lg font-medium">
                    {profileData.location.postalCode || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No location information provided
              </p>
            )}
          </TabsContent>

          {/* Job Details Tab */}
          <TabsContent value="job" className="mt-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Job Details</h3>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>

            {profileData?.jobDetails ? (
              <div className="space-y-6">
                {profileData.jobDetails.primaryJobRoles &&
                  profileData.jobDetails.primaryJobRoles.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4">
                        Primary Job Roles
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {profileData.jobDetails.primaryJobRoles.map(
                          (role: string, index: number) => (
                            <div
                              key={`job-role-${index}`}
                              className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-full text-gray-700 ${
                                index % 2 === 0 ? "bg-green-50" : "bg-blue-100"
                              }`}
                            >
                              {role}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">
                      Number of Open Positions
                    </p>
                    <p className="text-lg font-medium">
                      {profileData.jobDetails.numberOfOpenPositions || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Expected Salary Range
                    </p>
                    <p className="text-lg font-medium">
                      {profileData.jobDetails.expectedSalaryRange || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No job details provided</p>
            )}
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="mt-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Company Policies</h3>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>

            {profileData?.companyPolicies ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">
                      Internship Stipend Policy
                    </p>
                    <p className="text-lg font-medium">
                      {profileData.companyPolicies.internshipStipendPolicy ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Work From Home Policy
                    </p>
                    <p className="text-lg font-medium">
                      {profileData.companyPolicies.workFromHomePolicy || "N/A"}
                    </p>
                  </div>
                </div>

                {profileData.companyPolicies.diversityInclusionInitiatives && (
                  <>
                    <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">
                        Diversity & Inclusion Initiatives
                      </h4>
                      <p className="text-gray-600 whitespace-pre-line">
                        {
                          profileData.companyPolicies
                            .diversityInclusionInitiatives
                        }
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No company policies provided
              </p>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">About Company</h3>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>

            {profileData?.about?.description ? (
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold mb-2">
                    Company Description
                  </h4>
                  <p className="text-gray-600 whitespace-pre-line">
                    {profileData.about.description}
                  </p>
                </div>

                {profileData.about.missions && (
                  <>
                    <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">
                        Mission & Vision
                      </h4>
                      <p className="text-gray-600 whitespace-pre-line">
                        {profileData.about.missions}
                      </p>
                    </div>
                  </>
                )}

                {profileData.about.programs && (
                  <>
                    <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">
                        Programs & Initiatives
                      </h4>
                      <p className="text-gray-600 whitespace-pre-line">
                        {profileData.about.programs}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No company description provided
              </p>
            )}
          </TabsContent>

          {/* Documents Tab */}
          {/* <TabsContent value="documents" className="mt-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Documents</h3>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>

            <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>

            {profileData?.documents &&
            Object.keys(profileData.documents).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(profileData.documents).map(
                  ([key, url]: [string, any], index) => (
                    <div key={index} className="mb-6">
                      <h4 className="text-lg font-semibold mb-2">
                        {key.charAt(0).toUpperCase() +
                          key.slice(1).replace(/([A-Z])/g, " $1")}
                      </h4>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        View Document
                      </a>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No documents uploaded</p>
            )}
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
}
