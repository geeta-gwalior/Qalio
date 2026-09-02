// components/BackHeader.tsx
"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface BackHeaderProps {
  title: string | ReactNode;
  defaultRoute?: string; // Optional default route
  className?: string;
  backButtonClassName?: string;
  // Consider adding a prop to force defaultRoute if needed:
  // forceDefaultRoute?: boolean;
}

export function BackHeader({
  title,
  defaultRoute, // No longer defaulting here, handled in handleClick
  className = "",
  backButtonClassName = "",
}: BackHeaderProps) {
  const router = useRouter();

  const handleClick = () => {
    if (defaultRoute) {
      // If a defaultRoute is explicitly provided, always go there.
      // This logic assumes that if defaultRoute is present, it *overrides* history.back().
      router.push(defaultRoute);
    } else if (window.history.length > 1) {
      // If no defaultRoute is provided, try to go back in history.
      router.back();
    } else {
      // If no defaultRoute and no history, go to the root.
      router.push("/");
    }
  };

  return (
    <div className={`flex items-center gap-4 mb-4 ${className}`}>
      <Button
        onClick={handleClick}
        variant="outline"
        size="icon"
        className={`rounded-md shadow-md ${backButtonClassName}`}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
    </div>
  );
}