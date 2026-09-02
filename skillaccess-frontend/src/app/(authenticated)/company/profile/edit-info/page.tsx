"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2 } from "lucide-react"
import { getCookie } from "@/utils/getCookie"
import { toast } from "sonner"
import axios from "axios"

export default function EditProfileInfoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [apiBaseUrl, setApiBaseUrl] = useState("")

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_QALIO_BACKEND_URL || ""
    setApiBaseUrl(url)
    fetchCompanyProfile()
  }, [])

  const fetchCompanyProfile = async () => {
    try {
      const token = getCookie("jwt")
      if (!token) {
        toast.error("Authentication token not found. Please log in again.")
        setIsLoading(false)
        router.push("/login")
        return
      }

      const response = await axios.get(`${apiBaseUrl}/company/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        const company = response.data.company
        setProfileData(company)

        // Set form values
        if (company.basic) {
          setFullName(company.basic.companyName || "")
          setPhoneNumber(company.basic.alternatePhone?.toString() || "")

          // Set address from location if available
          if (company.location) {
            const location = company.location
            const addressParts = []
            if (location.address) addressParts.push(location.address)
            if (location.town) addressParts.push(location.town)
            if (location.state) addressParts.push(location.state)
            if (location.country) addressParts.push(location.country)
            setAddress(addressParts.join(", "))
          }

          // Set logo preview
          if (company.basic.logo) {
            setLogoPreview(company.basic.logo)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching company profile:", error)
      toast.error("Failed to load company profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = getCookie("jwt")
      if (!token) {
        toast.error("Authentication token not found. Please log in again.")
        return
      }

      const formData = new FormData()
      formData.append("companyName", fullName)
      formData.append("alternatePhone", phoneNumber)

      // Add logo if it exists
      if (logoFile) {
        formData.append("logo", logoFile)
      }

      const response = await axios({
        method: "put",
        url: `${apiBaseUrl}/company/profile/basic`,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        toast.success("Profile information updated successfully!")

        // Dispatch an event to notify the layout that the profile has been updated
        window.dispatchEvent(new CustomEvent("company-profile-updated"))

        // Navigate back to profile page
        router.push("/company/profile")
      } else {
        toast.error("Failed to update profile information")
      }
    } catch (error: any) {
      console.error("Error updating profile info:", error)
      const errorMessage = error.response?.data?.message || "An error occurred while updating your information"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#219CAE]" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Profile Information</h1>
        <p className="text-gray-600 mb-6">Update your basic profile information.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 mb-4 relative">
              {logoPreview ? (
                <Image src={logoPreview || "/placeholder.svg"} alt="Company logo" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("logo-upload")?.click()}
              >
                Upload
              </Button>

              {logoPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-500 hover:bg-red-50"
                  onClick={handleRemoveLogo}
                >
                  Remove
                </Button>
              )}

              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Company Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
            />
          </div>

          {/* Address (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address"
              disabled
            />
            <p className="text-xs text-gray-500">Address is managed in the Location section of your profile.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.push("/company/profile")}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#219CAE] hover:bg-[#1a7a8a] text-white" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile Information"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
