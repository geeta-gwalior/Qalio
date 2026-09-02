"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  MapPin,
  LinkIcon,
  Edit,
  Calendar,
  Award,
  User,
  UserCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { getCookie } from "@/utils/getCookie";
import ProfilePageSkeleton from "./profileLoader";
import { Button } from "@/components/ui/button";
import type { StudentProfile } from "@/types/student";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import BaseUserForm from "@/components/profile/base-user-form";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("education");
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  );
  const [isEditingBaseInfo, setIsEditingBaseInfo] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = getCookie("jwt");

      if (!token) {
        toast.error("Authentication required");
        router.push("/auth/sign-in");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      // console.log("Profile data:", data);

      if (data.student) {
        setStudentProfile(data.student);

        // If profile is not completed, redirect to complete profile page
        if (!data.student.completedProfile) {
          toast.info("Please complete your profile");
          router.push("/student/profile/complete");
        }
      }
    } catch (error) {
      // console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = (section?: string) => {
    const params = new URLSearchParams();
    params.set("edit", "true");
    if (section) {
      params.set("step", section);
    }
    router.push(`/student/profile/complete?${params.toString()}`);
  };

  const handleBaseUserFormSuccess = () => {
    setIsEditingBaseInfo(false);
    fetchProfileData(); // Refresh the profile data
  };

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (!studentProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Profile not found</h2>
          <p className="text-gray-500 mt-2">Please complete your profile</p>
          <button
            onClick={() => router.push("/student/profile/complete")}
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
        {/* User info card */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 relative">
          <div className="flex justify-between items-start mb-4">
            <div></div> {/* Empty div for flex spacing */}
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
                    <DialogTitle>Edit Profile Information</DialogTitle>
                  </DialogHeader>
                  <BaseUserForm
                    initialData={{
                      name: studentProfile.userId.name,
                      phone: studentProfile.userId.phone,
                      address: studentProfile.userId.address,
                      avatar: studentProfile.userId.avatar,
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
            <div className="w-20 h-20 sm:w-20 sm:h-20 rounded-full bg-gray-200 overflow-hidden">
              {studentProfile.userId.avatar ? (
                <Image
                  src={studentProfile.userId.avatar || "/placeholder.svg"}
                  width={80}
                  height={80}
                  alt="Profile avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <UserCircle size={80} className="text-gray-400" />
              )}
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-medium text-gray-700">
                {studentProfile.userId.name}
              </h2>
              <p className="text-sm text-gray-600">
                {studentProfile.education && studentProfile.education[0]?.field
                  ? `${studentProfile.education[0].field} Student`
                  : "Student"}
              </p>
              {studentProfile.dob && (
                <p className="text-xs text-gray-500 mt-1 flex items-center justify-center sm:justify-start">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(studentProfile.dob).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
              {studentProfile.userId.address && (
                <p className="text-xs text-gray-500 mt-1 flex items-center justify-center sm:justify-start">
                  <MapPin className="h-3 w-3 mr-1" />
                  {studentProfile.userId.address}
                </p>
              )}
            </div>
          </div>

          <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <div className="flex items-center">
              <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
                <Mail className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm truncate">
                {studentProfile.userId.email}
              </span>
            </div>

            <div className="flex items-center">
              <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
                <Phone className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm truncate">
                {studentProfile.altContactNumber || studentProfile.userId.phone}
              </span>
            </div>

            <div className="flex items-center">
              <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
                <MapPin className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm truncate">
                {studentProfile.userId.address ||
                  studentProfile.workExperience?.jobs?.[0]?.location ||
                  studentProfile.workExperience?.internships?.[0]?.location ||
                  studentProfile.skills?.preferredJobLocations?.[0] ||
                  "Location not specified"}
              </span>
            </div>

            <div className="flex items-center">
              <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
                <LinkIcon className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm truncate">
                {studentProfile.portfolio?.[0]?.url ? (
                  <a
                    href={studentProfile.portfolio[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600"
                  >
                    {studentProfile.portfolio[0].title || "Portfolio"}
                  </a>
                ) : (
                  "No portfolio link"
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
                value="education"
                className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                  activeTab === "education"
                    ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                    : "text-gray-600 font-normal"
                }`}
              >
                Education
              </TabsTrigger>
              <TabsTrigger
                value="skill"
                className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                  activeTab === "skill"
                    ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                    : "text-gray-600 font-normal"
                }`}
              >
                Skills
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                  activeTab === "portfolio"
                    ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                    : "text-gray-600 font-normal"
                }`}
              >
                Portfolio
              </TabsTrigger>
              <TabsTrigger
                value="experience"
                className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                  activeTab === "experience"
                    ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                    : "text-gray-600 font-normal"
                }`}
              >
                Experience
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className={`px-4 sm:px-6 py-2 rounded-none whitespace-nowrap data-[state=active]:shadow-none data-[state=active]:bg-transparent ${
                  activeTab === "documents"
                    ? "border-b-2 border-t-0 border-l-0 border-r-0 border-orange-500 font-medium"
                    : "text-gray-600 font-normal"
                }`}
              >
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="education" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Education Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("education")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              {studentProfile.education &&
              studentProfile.education.length > 0 ? (
                studentProfile.education.map((edu, index) => (
                  <div key={index} className="mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">
                          Institution Name
                        </p>
                        <p className="text-lg font-medium">
                          {edu.institutionName}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Degree</p>
                        <p className="text-lg font-medium">
                          {edu.degree} in {edu.field}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="text-lg font-medium">
                          {new Date(edu.startDate).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "long",
                            }
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="text-lg font-medium">
                          {edu.isCurrentlyStudying
                            ? "Present"
                            : edu.endDate
                            ? new Date(edu.endDate).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "long",
                                }
                              )
                            : "Not specified"}
                        </p>
                      </div>

                      {edu.percentage !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Percentage</p>
                          <p className="text-lg font-medium">
                            {edu.percentage}%
                          </p>
                        </div>
                      )}
                    </div>

                    {edu.description && (
                      <>
                        <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">
                            Description
                          </h3>
                          <p className="text-gray-600">{edu.description}</p>
                        </div>
                      </>
                    )}

                    {studentProfile.education &&
                      index < studentProfile.education.length - 1 && (
                        <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>
                      )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No education details available
                  </p>
                  <Button onClick={() => handleEditProfile("education")}>
                    Add Education
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="skill" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Skills</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("skills")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              {studentProfile.skills ? (
                <div className="space-y-8">
                  {studentProfile.skills.technicalSkills &&
                    studentProfile.skills.technicalSkills.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">
                          Technical Skills
                        </h3>
                        <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>
                        <div className="flex flex-wrap gap-3">
                          {studentProfile.skills.technicalSkills.map(
                            (skill, index) => (
                              <div
                                key={`tech-skill-${index}`}
                                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-full text-gray-700 ${
                                  index % 2 === 0
                                    ? "bg-green-50"
                                    : "bg-blue-100"
                                }`}
                              >
                                {skill}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {studentProfile.skills.nonTechnicalSkills &&
                    studentProfile.skills.nonTechnicalSkills.length > 0 && (
                      <>
                        <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>
                        <div>
                          <h3 className="text-xl font-semibold mb-4">
                            Non-Technical Skills
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {studentProfile.skills.nonTechnicalSkills.map(
                              (skill, index) => (
                                <div
                                  key={`non-tech-skill-${index}`}
                                  className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-full text-gray-700 ${
                                    index % 2 === 0
                                      ? "bg-green-50"
                                      : "bg-blue-100"
                                  }`}
                                >
                                  {skill}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}

                  {studentProfile.skills.preferredJobRoles &&
                    studentProfile.skills.preferredJobRoles.length > 0 && (
                      <>
                        <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>
                        <div>
                          <h3 className="text-xl font-semibold mb-4">
                            Preferred Job Roles
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {studentProfile.skills.preferredJobRoles.map(
                              (role, index) => (
                                <div
                                  key={`job-role-${index}`}
                                  className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-full text-gray-700 ${
                                    index % 2 === 0
                                      ? "bg-green-50"
                                      : "bg-blue-100"
                                  }`}
                                >
                                  {role}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}

                  {studentProfile.skills.preferredJobLocations &&
                    studentProfile.skills.preferredJobLocations.length > 0 && (
                      <>
                        <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>
                        <div>
                          <h3 className="text-xl font-semibold mb-4">
                            Preferred Job Locations
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {studentProfile.skills.preferredJobLocations.map(
                              (location, index) => (
                                <div
                                  key={`job-location-${index}`}
                                  className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-full text-gray-700 ${
                                    index % 2 === 0
                                      ? "bg-green-50"
                                      : "bg-blue-100"
                                  }`}
                                >
                                  {location}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}

                  {studentProfile.skills.additionalInfo && (
                    <>
                      <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>
                      <div>
                        <h3 className="text-xl font-semibold mb-4">
                          Additional Information
                        </h3>
                        <p className="text-gray-600">
                          {studentProfile.skills.additionalInfo}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No skills information available
                  </p>
                  <Button onClick={() => handleEditProfile("skills")}>
                    Add Skills
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="portfolio" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Portfolio</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("portfolio")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>

              {studentProfile.portfolio &&
              studentProfile.portfolio.length > 0 ? (
                <div className="space-y-6">
                  {studentProfile.portfolio.map((item, index) => (
                    <div key={index} className="mb-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            {item.type}
                          </p>
                          <h4 className="text-lg font-medium">{item.title}</h4>
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center mt-2 md:mt-0"
                        >
                          <LinkIcon className="w-4 h-4 mr-1" />
                          Visit
                        </a>
                      </div>
                      {item.description && (
                        <p className="text-gray-600 mt-2">{item.description}</p>
                      )}
                      {studentProfile.portfolio &&
                        index < studentProfile.portfolio.length - 1 && (
                          <div className="w-full border-t border-dashed border-cyan-500 mt-6"></div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No portfolio items available
                  </p>
                  <Button onClick={() => handleEditProfile("portfolio")}>
                    Add Portfolio
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="experience" className="mt-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Work Experience</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleEditProfile("work-experience")}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>

              {studentProfile.workExperience &&
              (studentProfile.workExperience.internships?.length ||
                studentProfile.workExperience.jobs?.length) ? (
                <div className="space-y-8">
                  {/* Internships */}
                  {studentProfile.workExperience.internships &&
                    studentProfile.workExperience.internships.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4">
                          Internships
                        </h4>
                        {studentProfile.workExperience.internships.map(
                          (internship, index) => (
                            <div
                              key={index}
                              className="mb-6 border-l-2 border-cyan-500 pl-4"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between">
                                <div>
                                  <h5 className="text-md font-medium">
                                    {internship.position}
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {internship.companyName}
                                  </p>
                                  {internship.location && (
                                    <p className="text-xs text-gray-500 flex items-center mt-1">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {internship.location}
                                    </p>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-2 md:mt-0">
                                  {new Date(
                                    internship.startDate
                                  ).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                  })}{" "}
                                  -{" "}
                                  {internship.isCurrentlyWorking
                                    ? "Present"
                                    : internship.endDate
                                    ? new Date(
                                        internship.endDate
                                      ).toLocaleDateString(undefined, {
                                        year: "numeric",
                                        month: "short",
                                      })
                                    : "Not specified"}
                                </p>
                              </div>
                              {internship.description && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {internship.description}
                                </p>
                              )}
                              {studentProfile.workExperience?.internships &&
                                index <
                                  studentProfile.workExperience.internships
                                    .length -
                                    1 && (
                                  <div className="w-full border-t border-dashed border-gray-200 my-4"></div>
                                )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {/* Jobs */}
                  {studentProfile.workExperience.jobs &&
                    studentProfile.workExperience.jobs.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Jobs</h4>
                        {studentProfile.workExperience.jobs.map(
                          (job, index) => (
                            <div
                              key={index}
                              className="mb-6 border-l-2 border-cyan-500 pl-4"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between">
                                <div>
                                  <h5 className="text-md font-medium">
                                    {job.position}
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {job.companyName}
                                  </p>
                                  {job.location && (
                                    <p className="text-xs text-gray-500 flex items-center mt-1">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {job.location}
                                    </p>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-2 md:mt-0">
                                  {new Date(job.startDate).toLocaleDateString(
                                    undefined,
                                    {
                                      year: "numeric",
                                      month: "short",
                                    }
                                  )}{" "}
                                  -{" "}
                                  {job.isCurrentlyWorking
                                    ? "Present"
                                    : job.endDate
                                    ? new Date(job.endDate).toLocaleDateString(
                                        undefined,
                                        {
                                          year: "numeric",
                                          month: "short",
                                        }
                                      )
                                    : "Not specified"}
                                </p>
                              </div>
                              {job.description && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {job.description}
                                </p>
                              )}
                              {index <
                                (studentProfile.workExperience?.jobs?.length ||
                                  0) -
                                  1 && (
                                <div className="w-full border-t border-dashed border-gray-200 my-4"></div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No work experience available
                  </p>
                  <Button onClick={() => handleEditProfile("work-experience")}>
                    Add Experience
                  </Button>
                </div>
              )}
            </TabsContent>

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

              <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>

              {studentProfile.documents ? (
                <div className="space-y-6">
                  {/* Resume */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Resume/CV</h4>
                    {studentProfile.documents.resume ? (
                      <a
                        href={studentProfile.documents.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        View Resume
                      </a>
                    ) : (
                      <p className="text-gray-500">No resume uploaded</p>
                    )}
                  </div>

                  {/* Mark Sheets */}
                  {studentProfile.documents.markSheets &&
                    studentProfile.documents.markSheets.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-2">
                          Mark Sheets
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {studentProfile.documents.markSheets.map(
                            (url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-600 hover:underline"
                              >
                                <Award className="h-4 w-4 mr-2" />
                                Mark Sheet {index + 1}
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Certificates */}
                  {studentProfile.documents.certificates &&
                    studentProfile.documents.certificates.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-2">
                          Certificates
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {studentProfile.documents.certificates.map(
                            (url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-600 hover:underline"
                              >
                                <Award className="h-4 w-4 mr-2" />
                                Certificate {index + 1}
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Bonafide Certificate */}
                  {studentProfile.documents.bonafideCertificate && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-2">
                        Bonafide Certificate
                      </h4>
                      <a
                        href={studentProfile.documents.bonafideCertificate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        View Bonafide Certificate
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No documents available</p>
                  <Button onClick={() => handleEditProfile("documents")}>
                    Add Documents
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
