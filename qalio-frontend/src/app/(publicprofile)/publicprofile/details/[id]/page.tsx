"use client";
import { use, useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  LinkIcon,
  Calendar,
  Award,
  UserCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth-store";
import { getCookie } from "@/utils/getCookie";
import type { StudentProfile } from "@/types/student";

export default function StudentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isPublicView, setIsPublicView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("education");

  const { id } = use(params);
  const user: any = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return;

      const token = getCookie("jwt");
      let studentData = null;

      try {
        if (token) {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/forcollege/${id}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await res.json();

          // Check application-level success
          if (data.success === false || !res.ok) {
            // Not throwing here — move on to public fallback
            console.warn("Authenticated route failed:", data.message);
          } else {
            // Success
            studentData = data.student;
            setIsPublicView(false);
          }
        }

        // If no token or failed above
        if (!studentData) {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/public/${id}`
          );
          const data = await res.json();

          if (data.success === false || !res.ok) {
            throw new Error(data.message || "Student not found");
          }

          studentData = data.student;
          setIsPublicView(true);
        }

        setStudent(studentData);
      } catch (err: any) {
        console.error("Student not found or not public: ", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500">
            Student not found
          </h2>
          <p className="text-gray-500 mt-2">
            This profile may not be public or does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Qalio Logo */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <Image
                  src="/images/skill_access_logo.png"
                  alt="Qalio Logo"
                  width={140}
                  height={18.34}
                />
                <p className="text-sm text-gray-600">
                  Connecting Skills with Opportunities
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Student Profile</p>
              <p className="text-xs text-gray-400">
                Powered by Qalio Platform
              </p>
            </div>
          </div>
        </div>
        {/* User info card */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 relative">
          {/* Public view indicator */}
          {isPublicView && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600 flex items-center">
                <UserCircle className="h-4 w-4 mr-2" />
                This is a public profile page.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 overflow-hidden">
              {student.userId.avatar ? (
                <Image
                  src={student.userId.avatar || "/placeholder.svg"}
                  width={96}
                  height={96}
                  alt="Profile avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <UserCircle size={96} className="text-gray-400" />
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {student.userId.name}
              </h1>
              <p className="text-lg text-gray-600">
                {student.education && student.education[0]?.field
                  ? `${student.education[0].field} Student`
                  : "Student"}
              </p>
              {student.dob && (
                <p className="text-sm text-gray-500 mt-2 flex items-center justify-center sm:justify-start">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(student.dob).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
              {student.userId.address && (
                <p className="text-sm text-gray-500 mt-1 flex items-center justify-center sm:justify-start">
                  <MapPin className="h-4 w-4 mr-1" />
                  {student.userId.address}
                </p>
              )}
            </div>
          </div>

          <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center">
              <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
                <Mail className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm truncate">{student.userId.email}</span>
            </div>
            <div className="flex items-center">
              <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
                <Phone className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm truncate">
                {student.altContactNumber || student.userId.phone}
              </span>
            </div>
            <div className="flex items-center">
              <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
                <MapPin className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm truncate">
                {student.userId.address ||
                  student.workExperience?.jobs?.[0]?.location ||
                  student.workExperience?.internships?.[0]?.location ||
                  student.skills?.preferredJobLocations?.[0] ||
                  "Location not specified"}
              </span>
            </div>
            <div className="flex items-center">
              <div className="min-w-[40px] w-10 h-10 flex items-center justify-center border border-cyan-500 rounded mr-3">
                <LinkIcon className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm truncate">
                {student.portfolio?.[0]?.url ? (
                  <a
                    href={student.portfolio[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600"
                  >
                    {student.portfolio[0].title || "Portfolio"}
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
          <h2 className="text-xl font-semibold">
            Detailed Profile Information
          </h2>
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

            <TabsContent value="education" className="mt-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Education Details</h3>
              </div>
              {student.education && student.education.length > 0 ? (
                student.education.map((edu, index) => (
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
                    {student.education &&
                      index < student.education.length - 1 && (
                        <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>
                      )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No education details available
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="skill" className="mt-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Skills</h3>
              </div>
              {student.skills ? (
                <div className="space-y-8">
                  {student.skills.technicalSkills &&
                    student.skills.technicalSkills.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">
                          Technical Skills
                        </h3>
                        <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>
                        <div className="flex flex-wrap gap-3">
                          {student.skills.technicalSkills.map(
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

                  {student.skills.nonTechnicalSkills &&
                    student.skills.nonTechnicalSkills.length > 0 && (
                      <>
                        <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>
                        <div>
                          <h3 className="text-xl font-semibold mb-4">
                            Non-Technical Skills
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {student.skills.nonTechnicalSkills.map(
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

                  {student.skills.preferredJobRoles &&
                    student.skills.preferredJobRoles.length > 0 && (
                      <>
                        <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>
                        <div>
                          <h3 className="text-xl font-semibold mb-4">
                            Preferred Job Roles
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {student.skills.preferredJobRoles.map(
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

                  {student.skills.preferredJobLocations &&
                    student.skills.preferredJobLocations.length > 0 && (
                      <>
                        <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>
                        <div>
                          <h3 className="text-xl font-semibold mb-4">
                            Preferred Job Locations
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {student.skills.preferredJobLocations.map(
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

                  {student.skills.additionalInfo && (
                    <>
                      <div className="w-full border-t border-dashed border-cyan-500 my-4"></div>
                      <div>
                        <h3 className="text-xl font-semibold mb-4">
                          Additional Information
                        </h3>
                        <p className="text-gray-600">
                          {student.skills.additionalInfo}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No skills information available
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="portfolio" className="mt-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Portfolio</h3>
              </div>
              <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>
              {student.portfolio && student.portfolio.length > 0 ? (
                <div className="space-y-6">
                  {student.portfolio.map((item, index) => (
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
                      {student.portfolio &&
                        index < student.portfolio.length - 1 && (
                          <div className="w-full border-t border-dashed border-cyan-500 mt-6"></div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No portfolio items available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="experience" className="mt-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Work Experience</h3>
              </div>
              <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>
              {student.workExperience &&
              (student.workExperience.internships?.length ||
                student.workExperience.jobs?.length) ? (
                <div className="space-y-8">
                  {/* Internships */}
                  {student.workExperience.internships &&
                    student.workExperience.internships.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4">
                          Internships
                        </h4>
                        {student.workExperience.internships.map(
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
                              {student.workExperience?.internships &&
                                index <
                                  student.workExperience.internships.length -
                                    1 && (
                                  <div className="w-full border-t border-dashed border-gray-200 my-4"></div>
                                )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {/* Jobs */}
                  {student.workExperience.jobs &&
                    student.workExperience.jobs.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Jobs</h4>
                        {student.workExperience.jobs.map((job, index) => (
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
                              (student.workExperience?.jobs?.length || 0) -
                                1 && (
                              <div className="w-full border-t border-dashed border-gray-200 my-4"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No work experience available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Documents</h3>
              </div>
              <div className="w-full border-t border-dashed border-cyan-500 mb-4"></div>
              {student.documents ? (
                <div className="space-y-6">
                  {/* Resume */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Resume/CV</h4>
                    {student.documents.resume ? (
                      <a
                        href={student.documents.resume}
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
                  {student.documents.markSheets &&
                    student.documents.markSheets.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-2">
                          Mark Sheets
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {student.documents.markSheets.map((url, index) => (
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
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Certificates */}
                  {student.documents.certificates &&
                    student.documents.certificates.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-2">
                          Certificates
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {student.documents.certificates.map((url, index) => (
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
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Bonafide Certificate */}
                  {student.documents.bonafideCertificate && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-2">
                        Bonafide Certificate
                      </h4>
                      <a
                        href={student.documents.bonafideCertificate}
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
                  <p className="text-gray-500">No documents available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
