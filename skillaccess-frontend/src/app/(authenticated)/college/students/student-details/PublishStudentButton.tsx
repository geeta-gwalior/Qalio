"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { getCookie } from "@/utils/getCookie";

export function PublishStudentButton({ studentId }: { studentId: string }) {
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // ✅ On mount, check if the student profile is published
  useEffect(() => {
    const checkPublishedStatus = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/public/${studentId}`
        );
        if (res.status === 200) {
          setIsPublic(true);
        }
      } catch (err) {
        setIsPublic(false); // Not published
      } finally {
        setChecking(false);
      }
    };

    checkPublishedStatus();
  }, [studentId]);

  const togglePublish = async () => {
    const token = getCookie("jwt");

    if (!token) {
      console.error("User is not authenticated");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/publish`,
        {
          studentId,
          publish: !isPublic,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        setIsPublic(!isPublic);
      }
    } catch (err) {
      console.error("Failed to update publish status", err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <Button
      onClick={togglePublish}
      className={`px-4 py-2 text-sm ${
        isPublic
          ? "bg-red-600 hover:bg-red-700"
          : "bg-green-600 hover:bg-green-700"
      } text-white`}
      disabled={loading}
    >
      {loading
        ? "Updating..."
        : isPublic
        ? "Unpublish Profile"
        : "Publish Profile"}
    </Button>
  );
}
