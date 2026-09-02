"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface CollegeCompletionSummaryProps {
  profileData: {
    collegeName?: string;
    website?: string;
    totalStudents?: number;
    totalCompanies?: number;
    totalJobs?: number;
    country?: string;
    state?: string;
    city?: string;
    zipCode?: string;
    region?: string;
    university?: string;
    collegeType?: string;
    yearOfEstablishment?: number;
    coursesOffered?: any[];
    placementStatistics?: any;
    placementOfficer?: any;
    topCompanies?: string[];
    bankingDetails?: any;
    description?: string;
    gstCertificate?: { url?: string; publicId?: string; _id?: string };
    affiliationCertificate?: { url?: string; publicId?: string; _id?: string };
    accreditations?: Array<{
      body?: string;
      _id?: string;
      accreditationCertificate?: {
        url?: string;
        publicId?: string;
        _id?: string;
      };
    }>;
  };
  onSubmit: () => void;
  isLoading: boolean;
  isEditMode?: boolean;
}

// Define a type for the keys of openSections for type safety
type OpenSectionsState = {
  basicInfo: boolean;
  location: boolean;
  academicInfo: boolean;
  courses: boolean;
  placement: boolean;
  banking: boolean;
  about: boolean;
  documents: boolean;
};

export default function CollegeCompletionSummary({
  profileData,
  onSubmit,
  isLoading,
  isEditMode = false,
}: CollegeCompletionSummaryProps) {
  const [openSections, setOpenSections] = useState<OpenSectionsState>({
    basicInfo: true,
    location: false,
    academicInfo: false,
    courses: false,
    placement: false,
    banking: false,
    about: false,
    documents: false,
  });

  // Use the strictly typed key for toggleSection
  const toggleSection = (section: keyof OpenSectionsState) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const checkSectionCompletion = (
    data: CollegeCompletionSummaryProps["profileData"]
  ) => {
    let completed = 0;
    // Documents is now optional for overall completion, so total is 7 (excluding documents)
    const total = 7; // Basic Info, Location, Academic Info, Courses, Placement, Banking, About

    // Basic Info
    if (data.collegeName) completed++;
    // Location
    if (data.country && data.state && data.city && data.zipCode) completed++;
    // Academic Info
    if (data.university && data.collegeType) completed++;
    // Courses
    if (
      data.coursesOffered &&
      data.coursesOffered.length > 0 &&
      data.coursesOffered[0].program
    )
      completed++;
    // Placement
    if (data.placementStatistics?.average || data.placementOfficer?.name)
      completed++;
    // Banking
    if (data.bankingDetails?.panCard || data.bankingDetails?.bankName)
      completed++;
    // About
    if (data.description) completed++;
    // Documents are optional for overall completion, so no 'completed++' here.
    // The individual document checks are still useful for displaying status within the summary,
    // but not for blocking the final 'Complete Profile' button.

    return { completed, total };
  };

  const { completed: completedSteps, total: totalSteps } =
    checkSectionCompletion(profileData);
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          College Profile Completion Summary
        </h2>
        <p className="text-sm text-gray-500">
          Review your profile information before finalizing. You can go back to
          any section to make changes.
        </p>
      </div>
      <Card className="border-none bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Profile Completion</h3>
              <p className="text-sm text-gray-600">
                {completedSteps} of {totalSteps} sections completed
              </p>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {completionPercentage}%
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {/* Basic Info */}
        <Collapsible open={openSections.basicInfo}>
          <Card
            className={`border ${
              profileData.collegeName ? "border-green-200" : "border-amber-200"
            }`}
          >
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.collegeName ? "bg-green-50" : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.collegeName ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <button
                  onClick={() => toggleSection("basicInfo")}
                  className="rounded-full p-1 hover:bg-black/5"
                >
                  {openSections.basicInfo ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.collegeName ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">College Name</p>
                      <p>{profileData.collegeName || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Website</p>
                      <p>{profileData.website || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total Students</p>
                      <p>{profileData.totalStudents || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total Companies</p>
                      <p>{profileData.totalCompanies || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total Jobs</p>
                      <p>{profileData.totalJobs || "Not provided"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Location */}
        <Collapsible open={openSections.location}>
          <Card
            className={`border ${
              profileData.country &&
              profileData.state &&
              profileData.city &&
              profileData.zipCode
                ? "border-green-200"
                : "border-amber-200"
            }`}
          >
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.country &&
                profileData.state &&
                profileData.city &&
                profileData.zipCode
                  ? "bg-green-50"
                  : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.country &&
                profileData.state &&
                profileData.city &&
                profileData.zipCode ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Location Information</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <button
                  onClick={() => toggleSection("location")}
                  className="rounded-full p-1 hover:bg-black/5"
                >
                  {openSections.location ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.country &&
                profileData.state &&
                profileData.city &&
                profileData.zipCode ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Country</p>
                      <p>{profileData.country || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">State</p>
                      <p>{profileData.state || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">City</p>
                      <p>{profileData.city || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Zip Code</p>
                      <p>{profileData.zipCode || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Region</p>
                      <p>{profileData.region || "Not provided"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Academic Info */}
        <Collapsible open={openSections.academicInfo}>
          <Card
            className={`border ${
              profileData.university && profileData.collegeType
                ? "border-green-200"
                : "border-amber-200"
            }`}
          >
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.university && profileData.collegeType
                  ? "bg-green-50"
                  : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.university && profileData.collegeType ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Academic Information</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <button
                  onClick={() => toggleSection("academicInfo")}
                  className="rounded-full p-1 hover:bg-black/5"
                >
                  {openSections.academicInfo ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.university && profileData.collegeType ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">University</p>
                      <p>{profileData.university || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">College Type</p>
                      <p>{profileData.collegeType || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Year of Establishment</p>
                      <p>{profileData.yearOfEstablishment || "Not provided"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Courses */}
        <Collapsible open={openSections.courses}>
          <Card
            className={`border ${
              profileData.coursesOffered &&
              profileData.coursesOffered.length > 0 &&
              profileData.coursesOffered[0].program
                ? "border-green-200"
                : "border-amber-200"
            }`}
          >
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.coursesOffered &&
                profileData.coursesOffered.length > 0 &&
                profileData.coursesOffered[0].program
                  ? "bg-green-50"
                  : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.coursesOffered &&
                profileData.coursesOffered.length > 0 &&
                profileData.coursesOffered[0].program ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Courses Offered</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <button
                  onClick={() => toggleSection("courses")}
                  className="rounded-full p-1 hover:bg-black/5"
                >
                  {openSections.courses ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.coursesOffered &&
                profileData.coursesOffered.length > 0 &&
                profileData.coursesOffered[0].program ? (
                  <div className="space-y-4">
                    {profileData.coursesOffered.map(
                      (course: any, index: number) => (
                        <div
                          key={index}
                          className="border-b pb-3 last:border-b-0 last:pb-0"
                        >
                          <p className="font-medium">{course.program}</p>
                          <p className="text-sm">
                            Intake Capacity:{" "}
                            {course.intakeCapacity || "Not specified"}
                          </p>
                          {course.specializations &&
                            course.specializations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {course.specializations.map(
                                  (spec: string, specIndex: number) => (
                                    <span
                                      key={specIndex}
                                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                    >
                                      {spec}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Placement */}
        <Collapsible open={openSections.placement}>
          <Card
            className={`border ${
              profileData.placementStatistics?.average ||
              profileData.placementOfficer?.name
                ? "border-green-200"
                : "border-amber-200"
            }`}
          >
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.placementStatistics?.average ||
                profileData.placementOfficer?.name
                  ? "bg-green-50"
                  : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.placementStatistics?.average ||
                profileData.placementOfficer?.name ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Placement Information</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <button
                  onClick={() => toggleSection("placement")}
                  className="rounded-full p-1 hover:bg-black/5"
                >
                  {openSections.placement ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.placementStatistics?.average ||
                profileData.placementOfficer?.name ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">Placement Statistics</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          Average Rate:{" "}
                          {profileData.placementStatistics?.average || "N/A"}%
                        </p>
                        <p>
                          Highest Package:{" "}
                          {profileData.placementStatistics?.highest || "N/A"}{" "}
                          LPA
                        </p>
                        <p>
                          Average Package:{" "}
                          {profileData.placementStatistics?.averagePackage ||
                            "N/A"}{" "}
                          LPA
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Placement Officer</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          Name: {profileData.placementOfficer?.name || "N/A"}
                        </p>
                        <p>
                          Email: {profileData.placementOfficer?.email || "N/A"}
                        </p>
                        <p>
                          Phone: {profileData.placementOfficer?.phone || "N/A"}
                        </p>
                      </div>
                    </div>
                    {profileData.topCompanies &&
                      profileData.topCompanies.length > 0 && (
                        <div>
                          <p className="font-medium">Top Companies</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profileData.topCompanies.map(
                              (company: string, index: number) => (
                                <span
                                  key={index}
                                  className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                                >
                                  {company}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Banking */}
        <Collapsible open={openSections.banking}>
          <Card
            className={`border ${
              profileData.bankingDetails?.panCard ||
              profileData.bankingDetails?.bankName
                ? "border-green-200"
                : "border-amber-200"
            }`}
          >
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.bankingDetails?.panCard ||
                profileData.bankingDetails?.bankName
                  ? "bg-green-50"
                  : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.bankingDetails?.panCard ||
                profileData.bankingDetails?.bankName ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Banking Details</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <button
                  onClick={() => toggleSection("banking")}
                  className="rounded-full p-1 hover:bg-black/5"
                >
                  {openSections.banking ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.bankingDetails?.panCard ||
                profileData.bankingDetails?.bankName ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">PAN Card</p>
                      <p>
                        {profileData.bankingDetails?.panCard || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Bank Name</p>
                      <p>
                        {profileData.bankingDetails?.bankName || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Account Number</p>
                      <p>
                        {profileData.bankingDetails?.accountNumber ||
                          "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">IFSC Code</p>
                      <p>
                        {profileData.bankingDetails?.ifscCode || "Not provided"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* About */}
        <Collapsible open={openSections.about}>
          <Card
            className={`border ${
              profileData.description ? "border-green-200" : "border-amber-200"
            }`}
          >
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.description ? "bg-green-50" : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.description ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">About College</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <button
                  onClick={() => toggleSection("about")}
                  className="rounded-full p-1 hover:bg-black/5"
                >
                  {openSections.about ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.description ? (
                  <div className="text-sm">
                    <p className="font-medium">Description</p>
                    <p>{profileData.description}</p>
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Documents */}
        <Collapsible open={openSections.documents}>
          <Card
            className={`border ${
              profileData.gstCertificate?.url ||
              profileData.affiliationCertificate?.url ||
              (profileData.accreditations &&
                profileData.accreditations.some(
                  (acc) => acc.accreditationCertificate?.url
                ))
                ? "border-green-200"
                : "border-amber-200"
            }`}
          >
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.gstCertificate?.url ||
                profileData.affiliationCertificate?.url ||
                (profileData.accreditations &&
                  profileData.accreditations.some(
                    (acc) => acc.accreditationCertificate?.url
                  ))
                  ? "bg-green-50"
                  : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.gstCertificate?.url ||
                profileData.affiliationCertificate?.url ||
                (profileData.accreditations &&
                  profileData.accreditations.some(
                    (acc) => acc.accreditationCertificate?.url
                  )) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Documents</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <button
                  onClick={() => toggleSection("documents")}
                  className="rounded-full p-1 hover:bg-black/5"
                >
                  {openSections.documents ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.gstCertificate?.url ||
                profileData.affiliationCertificate?.url ||
                (profileData.accreditations &&
                  profileData.accreditations.some(
                    (acc) => acc.accreditationCertificate?.url
                  )) ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">GST Certificate</p>
                      {profileData.gstCertificate?.url ? (
                        <a
                          href={profileData.gstCertificate.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View GST Certificate
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">Not provided</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Affiliation Certificate</p>
                      {profileData.affiliationCertificate?.url ? (
                        <a
                          href={profileData.affiliationCertificate.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Affiliation Certificate
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">Not provided</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Accreditation Certificates</p>
                      {profileData.accreditations &&
                      profileData.accreditations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.accreditations.map((acc, index) =>
                            acc.accreditationCertificate?.url ? (
                              <a
                                key={index}
                                href={acc.accreditationCertificate.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Accreditation {index + 1} ({acc.body || "N/A"})
                              </a>
                            ) : (
                              <span
                                key={index}
                                className="text-sm text-gray-500"
                              >
                                Accreditation {index + 1} (No URL)
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Not provided</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
      <div className="pt-4">
        <Button
          onClick={() => onSubmit()}
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={isLoading || completedSteps < totalSteps}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? "Updating Profile..." : "Completing Profile..."}
            </>
          ) : completedSteps < totalSteps ? (
            "Please Complete All Required Sections"
          ) : isEditMode ? (
            "Save Profile Changes"
          ) : (
            "Complete Profile"
          )}
        </Button>
        {completedSteps < totalSteps && (
          <p className="text-center text-amber-600 text-sm mt-2">
            You need to complete all required sections before finalizing your
            profile.
          </p>
        )}
      </div>
    </div>
  );
}
