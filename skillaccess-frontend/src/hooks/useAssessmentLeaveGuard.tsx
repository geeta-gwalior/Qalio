"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLeaveModal } from "@/stores/use-leave-modal";

export const useAssessmentLeaveGuard = () => {
  const pathname = usePathname();
  const openModal = useLeaveModal((s) => s.openModal);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor || !anchor.href) return;

      const currentUrl = window.location.origin + pathname;
      const targetUrl = anchor.href;

      const isLeaving =
        pathname.startsWith("/college/assessments/create-assessment") &&
        !targetUrl.includes("/college/assessments/create-assessment");

      if (isLeaving) {
        if (sessionStorage.getItem("skipLeaveCheck")) {
          return;
        }
        e.preventDefault();
    
        openModal(anchor.href.replace(window.location.origin, ""));
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [pathname, openModal]);
};
