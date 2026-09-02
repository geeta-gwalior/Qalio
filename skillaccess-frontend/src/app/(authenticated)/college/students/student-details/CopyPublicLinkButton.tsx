"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useState } from "react";

export default function CopyPublicLinkButton({
  studentId,
}: {
  studentId: string;
}) {
  const [copied, setCopied] = useState(false);

  const publicUrl = `${process.env.NEXT_PUBLIC_QALIO_FRONTEND_URL}/publicprofile/details/${studentId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      className="flex items-center gap-2 text-sm"
    >
      <Copy className="w-4 h-4" />
      {copied ? "Copied!" : "Copy Public Link"}
    </Button>
  );
}
