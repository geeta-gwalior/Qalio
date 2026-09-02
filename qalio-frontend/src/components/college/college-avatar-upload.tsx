"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Camera, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getCookie } from "@/utils/getCookie"

interface CollegeAvatarUploadProps {
  currentAvatar?: string
  onAvatarChange: (url: string) => void
}

export default function CollegeAvatarUpload({ currentAvatar, onAvatarChange }: CollegeAvatarUploadProps) {
  const [avatar, setAvatar] = useState<string | undefined>(currentAvatar)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentAvatar && currentAvatar !== avatar) {
      setAvatar(currentAvatar)
    }
  }, [currentAvatar])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", "college_avatars")

      const token = getCookie("jwt")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/upload/upload-avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      const newAvatarUrl = data.url

      setAvatar(newAvatarUrl)
      onAvatarChange(newAvatarUrl)
      toast.success("College avatar uploaded successfully")

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading college avatar:", error)
      toast.error("Failed to upload college avatar")
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeAvatar = () => {
    setAvatar(undefined)
    onAvatarChange("")
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className={`w-24 h-24 rounded-full overflow-hidden border-2 border-[#219CAE] flex items-center justify-center bg-gray-100 ${
            isUploading ? "opacity-70" : ""
          }`}
        >
          {avatar ? (
            <Image
              src={avatar || "/placeholder.svg"}
              alt="College Profile"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              key={`college-avatar-${avatar}-${Date.now()}`} // Add key to force re-render
            />
          ) : (
            <Camera className="h-8 w-8 text-gray-400" />
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="flex items-center gap-1"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        {avatar && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={removeAvatar}
            disabled={isUploading}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}
