import axios from "axios"

// Use the existing getCookie function
function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null
  }

  const cookies = document.cookie.split("; ")
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=")
    if (key === name) return decodeURIComponent(value)
  }
  return null
}

// Create base axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_QALIO_BACKEND_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// College API functions
export const collegeAPI = {
  getCollegeProfile: async () => {
    const token = getCookie("jwt")
    try {
      const response = await api.get("/college/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch college profile:", error)
      throw error
    }
  },

  getProfileStatus: async () => {
    try {
      const token = getCookie("jwt")
      const response = await api.get("/college/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = response.data
      return {
        success: data.success,
        status: data.college?.status || "pending",
        completionPercentage: data.college?.completionPercentage || 0,
        completedProfile: data.college?.completedProfile || false,
      }
    } catch (error) {
      console.error("Failed to fetch profile status:", error)
      throw error
    }
  },

  updateBasicInfo: async (data: any) => {
    const token = getCookie("jwt")
    try {
      console.log("Sending basic info data:", data)
      const response = await api.put("/college/update-basic", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update basic info:", error)
      throw error
    }
  },

  // Update base user info (name, phone, email)
  updateBaseUserInfo: async (data: any) => {
    const token = getCookie("jwt")
    try {
      console.log("Sending base user info data:", data)
      const response = await api.put("/college/update-base-user", data, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // If successful, also refresh the college profile to get updated data
      if (response.data.success) {
        // Return the response but also trigger a profile refresh
        return response.data
      }

      return response.data
    } catch (error) {
      console.error("Failed to update base user info:", error)
      throw error
    }
  },

  // Upload avatar
  uploadAvatar: async (file: File) => {
    const token = getCookie("jwt")
    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const response = await api.post("/college/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Failed to upload avatar:", error)
      throw error
    }
  },

  // Location uses the same update-basic endpoint
  updateLocation: async (data: any) => {
    const token = getCookie("jwt")
    try {
      // Validate data before sending
      if (!data.country || !data.state || !data.city || !data.zipCode) {
        console.error("Invalid location data:", data)
        throw new Error("Missing required location fields")
      }

      console.log("Sending location data:", data)

      const response = await api.put("/college/update-basic", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log("Location update response:", response.data)
      return response.data
    } catch (error) {
      console.error("Failed to update location info:", error)
      throw error
    }
  },

  // Academic info uses the same update-basic endpoint
  updateAcademicInfo: async (data: any) => {
    const token = getCookie("jwt")
    try {
      console.log("Sending academic info:", data)

      const response = await api.put("/college/update-basic", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update academic info:", error)
      throw error
    }
  },

  updateAccreditation: async (data: any) => {
    const token = getCookie("jwt")
    try {
      const response = await api.put("/college/update-accreditation", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update accreditation:", error)
      throw error
    }
  },

  uploadAccreditationCertificate: async (file: File, accreditationIndex = 0) => {
    const token = getCookie("jwt")
    try {
      const formData = new FormData()
      formData.append("certificate", file)

      const response = await api.post(`/college/upload-accreditation/${accreditationIndex}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Failed to upload accreditation certificate:", error)
      throw error
    }
  },

  uploadAffiliationCertificate: async (file: File) => {
    const token = getCookie("jwt")
    try {
      const formData = new FormData()
      formData.append("certificate", file)

      const response = await api.post("/college/upload-affiliation", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Failed to upload affiliation certificate:", error)
      throw error
    }
  },

  // This matches your backend route
  updateCourses: async (data: any) => {
    const token = getCookie("jwt")
    try {
      console.log("Sending courses data:", data)
      const response = await api.put("/college/update-courses", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update courses offered:", error)
      throw error
    }
  },

  // This matches your backend route
  updatePlacement: async (data: any) => {
    const token = getCookie("jwt")
    try {
      console.log("Sending placement data:", data)
      const response = await api.put("/college/update-placement-stats", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update placement details:", error)
      throw error
    }
  },

  updatePlacementOfficer: async (data: any) => {
    const token = getCookie("jwt")
    try {
      const response = await api.put("/college/update-placement-officer", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update placement officer:", error)
      throw error
    }
  },

  updateStudentDemographics: async (data: any) => {
    const token = getCookie("jwt")
    try {
      const response = await api.put("/college/update-demographics", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update student demographics:", error)
      throw error
    }
  },

  // This matches your backend route
  updateInfrastructure: async (data: any) => {
    const token = getCookie("jwt")
    try {
      console.log("Sending infrastructure data:", data)
      const response = await api.put("/college/update-infrastructure", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update infrastructure:", error)
      throw error
    }
  },

  // This matches your backend route
  updateBanking: async (data: any) => {
    const token = getCookie("jwt")
    try {
      console.log("Sending banking data:", data)
      const response = await api.put("/college/update-banking", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update banking details:", error)
      throw error
    }
  },

  uploadGstCertificate: async (file: File) => {
    const token = getCookie("jwt")
    try {
      const formData = new FormData()
      formData.append("certificate", file)

      const response = await api.post("/college/upload-gst", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Failed to upload GST certificate:", error)
      throw error
    }
  },

  updateIndustryConnections: async (data: any) => {
    const token = getCookie("jwt")
    try {
      const response = await api.put("/college/update-industry", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update industry connections:", error)
      throw error
    }
  },

  updateAlumniNetwork: async (data: any) => {
    const token = getCookie("jwt")
    try {
      const response = await api.put("/college/update-alumni", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update alumni network:", error)
      throw error
    }
  },

  updateCommunityInvolvement: async (data: any) => {
    const token = getCookie("jwt")
    try {
      const response = await api.put("/college/update-community", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to update community involvement:", error)
      throw error
    }
  },

  addPendingStudent: async (data: any) => {
    const token = getCookie("jwt")
    try {
      const response = await api.post("/college/student/add", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to add pending student:", error)
      throw error
    }
  },

  approveStudent: async (data: any) => {
    const token = getCookie("jwt")
    try {
      const response = await api.post("/college/student/approve", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to approve student:", error)
      throw error
    }
  },

  rejectStudent: async (data: any) => {
    const token = getCookie("jwt")
    try {
      const response = await api.post("/college/student/reject", data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to reject student:", error)
      throw error
    }
  },

  getCollegeStudents: async (params: any = {}) => {
    const token = getCookie("jwt")
    try {
      const response = await api.get("/college/students", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch college students:", error)
      throw error
    }
  },

  getPendingStudents: async (params: any = {}) => {
    const token = getCookie("jwt")
    try {
      const response = await api.get("/college/students/pending", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch pending students:", error)
      throw error
    }
  },

  searchColleges: async (params: any = {}) => {
    try {
      const response = await api.get("/college/search", { params })
      return response.data
    } catch (error) {
      console.error("Failed to search colleges:", error)
      throw error
    }
  },

  getCollegeById: async (id: string) => {
    try {
      const response = await api.get(`/college/public/${id}`)
      return response.data
    } catch (error) {
      console.error("Failed to fetch college by ID:", error)
      throw error
    }
  },

  getDashboard: async () => {
    const token = getCookie("jwt")
    try {
      const response = await api.get("/college/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error("Failed to fetch dashboard:", error)
      throw error
    }
  },

  uploadDocument: async (file: File, type: string) => {
    switch (type) {
      case "gst":
        return collegeAPI.uploadGstCertificate(file)
      case "affiliation":
        return collegeAPI.uploadAffiliationCertificate(file)
      case "accreditation":
      default:
        return collegeAPI.uploadAccreditationCertificate(file, 0)
    }
  },
}

export default api;
