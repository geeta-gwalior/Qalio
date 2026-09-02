"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "../ui/sonner";

export default function ToasterClient() {
  const pathname = usePathname();

  // Match actual routes, not layout segment names
  const isFullscreen =
    pathname?.startsWith("/student/tests/take-test") ||
    pathname?.startsWith("/another-fullscreen-route");

  return <Toaster position={isFullscreen ? "bottom-left" : "bottom-right"} />;
}
