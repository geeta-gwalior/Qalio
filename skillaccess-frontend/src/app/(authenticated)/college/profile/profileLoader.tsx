"use client"

import { useQuery } from "@tanstack/react-query"
import { collegeAPI } from "@/utils/api"
import type { ProfileStatusResponse } from "@/types/college"
import { useState, useEffect } from "react"

const ProfileLoader = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const { data, isLoading, error } = useQuery<ProfileStatusResponse>({
    queryKey: ["profileStatus"],
    queryFn: collegeAPI.getProfileStatus,
    enabled: isClient,
    retry: 3,
    retryDelay: 1000,
  })

  const status = data?.status || "pending"
  const completionPercentage = data?.completionPercentage || 0
  const completedProfile = data?.completedProfile || false

  if (isLoading) {
    return (
      <div className="profile-status">
        <p>Loading profile status...</p>
        <div className="progress-bar">
          <div className="progress" style={{ width: "0%" }}></div>
        </div>
      </div>
    )
  }

  if (error && isClient) {
    return (
      <div className="profile-status error">
        <p>Failed to load profile status</p>
        <div className="progress-bar">
          <div className="progress" style={{ width: "0%" }}></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="profile-status">
        <p>Status: {status}</p>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${completionPercentage}%` }}></div>
        </div>
        <p>{completionPercentage}% Complete</p>
        {completedProfile && <p className="completed-badge">Profile Completed</p>}
      </div>
    </div>
  )
}

export default ProfileLoader
