import axios from "axios"
import { toast } from "sonner"
import type { CollegeProfile } from "@/types/college"

// Define ApiResponse type locally
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  college?: T
}

// Get the actual backend URL considering both environment variable names
const getBackendUrl = () => {
  // Fix for environment variable mismatch
  if (typeof window !== "undefined") {
    if (!process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NEXT_PUBLIC_QALIO_BACKEND_URL) {
      
      process.env.NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_QALIO_BACKEND_URL
    }
  }

  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_QALIO_BACKEND_URL ||
    "http://localhost:4000/api"
  )
}

// Create an axios instance with default config
const api = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response || error)
    const message = error.response?.data?.message || "Something went wrong"
    toast.error(message)
    return Promise.reject(error)
  },
)

// Function to make API requests with multiple endpoint attempts
const makeApiRequest = async (
  endpoints: string[],
  method: "get" | "post" | "put" | "delete" = "get",
  data?: any,
  contentType = "application/json",
) => {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("Authentication token not found")
  }

  let response = null
  let error = null

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying ${method.toUpperCase()} request to: ${endpoint}`)

      response = await axios({
        method,
        url: endpoint,
        data,
        headers: {
          "Content-Type": contentType,
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data) {
        console.log(`Success with endpoint: ${endpoint}`)
        // Store the successful endpoint pattern for future use
        const baseEndpoint = endpoint.split("/profile")[0]
        localStorage.setItem("workingEndpoint", baseEndpoint)
        break
      }
    } catch (err) {
      console.log(`Failed with endpoint: ${endpoint}`, err)
      error = err
    }
  }

  if (!response) {
    throw error || new Error(`Failed to ${method} from any endpoint`)
  }

  return response.data
}

// College API methods
export const collegeAPI = {
  // Get college profile
  getCollegeProfile: async (): Promise<ApiResponse<CollegeProfile>> => {
    try {
      const backendUrl = getBackendUrl()

      // Try multiple endpoint patterns to find the working one
      const endpoints = [
        `${backendUrl}/college/profile`,
        `${backendUrl.replace("/api", "")}/api/college/profile`,
        `${backendUrl.replace("/api", "")}/college/profile`,
        "/api/college/profile",
        "/college/profile",
      ]

      return await makeApiRequest(endpoints)
    } catch (error) {
      console.error("Error fetching college profile:", error)
      throw error
    }
  },

  // Get profile status
  getProfileStatus: async (): Promise<ApiResponse<{ status: string; completionPercentage: number }>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/status`,
        `${backendUrl}/college/profile/status`,
        `${backendUrl.replace("/api", "")}/api/college/profile/status`,
        `${backendUrl.replace("/api", "")}/college/profile/status`,
        "/api/college/profile/status",
        "/college/profile/status",
      ]

      return await makeApiRequest(endpoints)
    } catch (error) {
      console.error("Error fetching profile status:", error)
      throw error
    }
  },

  // Update basic info
  updateBasicInfo: async (data: Partial<CollegeProfile>): Promise<ApiResponse<Partial<CollegeProfile>>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/basic`,
        `${backendUrl}/college/profile/basic`,
        `${backendUrl.replace("/api", "")}/api/college/profile/basic`,
        `${backendUrl.replace("/api", "")}/college/profile/basic`,
        "/api/college/profile/basic",
        "/college/profile/basic",
      ]

      console.log("Submitting basic info:", data)
      return await makeApiRequest(endpoints, "put", data)
    } catch (error) {
      console.error("Error updating basic info:", error)
      throw error
    }
  },

  // Update location info
  updateLocationInfo: async (data: Partial<CollegeProfile>): Promise<ApiResponse<Partial<CollegeProfile>>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/location`,
        `${backendUrl}/college/profile/location`,
        `${backendUrl.replace("/api", "")}/api/college/profile/location`,
        `${backendUrl.replace("/api", "")}/college/profile/location`,
        "/api/college/profile/location",
        "/college/profile/location",
      ]

      return await makeApiRequest(endpoints, "put", data)
    } catch (error) {
      console.error("Error updating location info:", error)
      throw error
    }
  },

  // Update academic info
  updateAcademicInfo: async (data: Partial<CollegeProfile>): Promise<ApiResponse<Partial<CollegeProfile>>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/academic`,
        `${backendUrl}/college/profile/academic`,
        `${backendUrl.replace("/api", "")}/api/college/profile/academic`,
        `${backendUrl.replace("/api", "")}/college/profile/academic`,
        "/api/college/profile/academic",
        "/college/profile/academic",
      ]

      return await makeApiRequest(endpoints, "put", data)
    } catch (error) {
      console.error("Error updating academic info:", error)
      throw error
    }
  },

  // Update courses offered
  updateCoursesOffered: async (data: Partial<CollegeProfile>): Promise<ApiResponse<Partial<CollegeProfile>>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      // Ensure coursesOffered is an array
      if (data.coursesOffered && !Array.isArray(data.coursesOffered)) {
        data.coursesOffered = [data.coursesOffered]
      }

      // Ensure each course has specializations as an array
      if (data.coursesOffered && Array.isArray(data.coursesOffered)) {
        data.coursesOffered = data.coursesOffered.map((course) => {
          if (course.specializations && !Array.isArray(course.specializations)) {
            return {
              ...course,
              specializations: [course.specializations],
            }
          }
          return course
        })
      }

      console.log("Submitting courses (formatted):", data)

      const endpoints = [
        `${workingEndpoint}/profile/courses`,
        `${backendUrl}/college/profile/courses`,
        `${backendUrl.replace("/api", "")}/api/college/profile/courses`,
        `${backendUrl.replace("/api", "")}/college/profile/courses`,
        "/api/college/profile/courses",
        "/college/profile/courses",
      ]

      return await makeApiRequest(endpoints, "put", data)
    } catch (error) {
      console.error("Error updating courses offered:", error)
      throw error
    }
  },

  // Update placement details
  updatePlacementDetails: async (data: Partial<CollegeProfile>): Promise<ApiResponse<Partial<CollegeProfile>>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/placement`,
        `${backendUrl}/college/profile/placement`,
        `${backendUrl.replace("/api", "")}/api/college/profile/placement`,
        `${backendUrl.replace("/api", "")}/college/profile/placement`,
        "/api/college/profile/placement",
        "/college/profile/placement",
      ]

      return await makeApiRequest(endpoints, "put", data)
    } catch (error) {
      console.error("Error updating placement details:", error)
      throw error
    }
  },

  // Update student demographics
  updateStudentDemographics: async (data: Partial<CollegeProfile>): Promise<ApiResponse<Partial<CollegeProfile>>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/demographics`,
        `${backendUrl}/college/profile/demographics`,
        `${backendUrl.replace("/api", "")}/api/college/profile/demographics`,
        `${backendUrl.replace("/api", "")}/college/profile/demographics`,
        "/api/college/profile/demographics",
        "/college/profile/demographics",
      ]

      return await makeApiRequest(endpoints, "put", data)
    } catch (error) {
      console.error("Error updating student demographics:", error)
      throw error
    }
  },

  // Update infrastructure
  updateInfrastructure: async (data: Partial<CollegeProfile>): Promise<ApiResponse<Partial<CollegeProfile>>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/infrastructure`,
        `${backendUrl}/college/profile/infrastructure`,
        `${backendUrl.replace("/api", "")}/api/college/profile/infrastructure`,
        `${backendUrl.replace("/api", "")}/college/profile/infrastructure`,
        "/api/college/profile/infrastructure",
        "/college/profile/infrastructure",
      ]

      return await makeApiRequest(endpoints, "put", data)
    } catch (error) {
      console.error("Error updating infrastructure:", error)
      throw error
    }
  },

  // Update banking details
  updateBankingDetails: async (data: Partial<CollegeProfile>): Promise<ApiResponse<Partial<CollegeProfile>>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/banking`,
        `${backendUrl}/college/profile/banking`,
        `${backendUrl.replace("/api", "")}/api/college/profile/banking`,
        `${backendUrl.replace("/api", "")}/college/profile/banking`,
        "/api/college/profile/banking",
        "/college/profile/banking",
      ]

      return await makeApiRequest(endpoints, "put", data)
    } catch (error) {
      console.error("Error updating banking details:", error)
      throw error
    }
  },

  // Upload accreditation certificate
  uploadAccreditationCertificate: async (formData: FormData): Promise<ApiResponse<any>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/accreditation-certificate`,
        `${backendUrl}/college/profile/accreditation-certificate`,
        `${backendUrl.replace("/api", "")}/api/college/profile/accreditation-certificate`,
        `${backendUrl.replace("/api", "")}/college/profile/accreditation-certificate`,
        "/api/college/profile/accreditation-certificate",
        "/college/profile/accreditation-certificate",
      ]

      return await makeApiRequest(endpoints, "post", formData, "multipart/form-data")
    } catch (error) {
      console.error("Error uploading accreditation certificate:", error)
      throw error
    }
  },

  // Upload GST certificate
  uploadGstCertificate: async (formData: FormData): Promise<ApiResponse<any>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/gst-certificate`,
        `${backendUrl}/college/profile/gst-certificate`,
        `${backendUrl.replace("/api", "")}/api/college/profile/gst-certificate`,
        `${backendUrl.replace("/api", "")}/college/profile/gst-certificate`,
        "/api/college/profile/gst-certificate",
        "/college/profile/gst-certificate",
      ]

      return await makeApiRequest(endpoints, "post", formData, "multipart/form-data")
    } catch (error) {
      console.error("Error uploading GST certificate:", error)
      throw error
    }
  },

  // Complete profile
  completeProfile: async (): Promise<ApiResponse<any>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/complete`,
        `${backendUrl}/college/profile/complete`,
        `${backendUrl.replace("/api", "")}/api/college/profile/complete`,
        `${backendUrl.replace("/api", "")}/college/profile/complete`,
        "/api/college/profile/complete",
        "/college/profile/complete",
      ]

      return await makeApiRequest(endpoints, "put")
    } catch (error) {
      console.error("Error completing profile:", error)
      throw error
    }
  },

  // Get admin comments
  getAdminComments: async (): Promise<ApiResponse<any>> => {
    try {
      const workingEndpoint = localStorage.getItem("workingEndpoint") || ""
      const backendUrl = getBackendUrl()

      const endpoints = [
        `${workingEndpoint}/profile/comments`,
        `${backendUrl}/college/profile/comments`,
        `${backendUrl.replace("/api", "")}/api/college/profile/comments`,
        `${backendUrl.replace("/api", "")}/college/profile/comments`,
        "/api/college/profile/comments",
        "/college/profile/comments",
      ]

      return await makeApiRequest(endpoints)
    } catch (error) {
      console.error("Error fetching admin comments:", error)
      throw error
    }
  },
}

export default api
