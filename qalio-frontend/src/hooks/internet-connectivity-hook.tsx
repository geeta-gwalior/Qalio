"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

interface ConnectionQuality {
  status: "good" | "poor" | "offline";
  latency: number;
  speed: "fast" | "slow" | "unknown";
}

export const useInternetConnectivity = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(
    {
      status: "good",
      latency: 0,
      speed: "unknown",
    }
  );
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Test connection speed and latency
  const testConnectionQuality =
    useCallback(async (): Promise<ConnectionQuality> => {
      if (!navigator.onLine) {
        return { status: "offline", latency: 0, speed: "unknown" };
      }

      try {
        const start = performance.now();

        // Test with a small image to measure speed
        const testUrl = `${window.location.origin}/favicon.ico?t=${Date.now()}`;
        const response = await fetch(testUrl, {
          method: "HEAD",
          cache: "no-cache",
          mode: "cors",
        });

        const end = performance.now();
        const latency = end - start;

        if (!response.ok) {
          return { status: "poor", latency, speed: "slow" };
        }

        // Determine connection quality based on latency
        let status: "good" | "poor" = "good";
        let speed: "fast" | "slow" = "fast";

        if (latency > 3000) {
          status = "poor";
          speed = "slow";
        } else if (latency > 1000) {
          status = "poor";
          speed = "slow";
        }

        return { status, latency, speed };
      } catch (error) {
        console.error("Connection test failed:", error);
        return { status: "poor", latency: 0, speed: "slow" };
      }
    }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const quality = await testConnectionQuality();
      setConnectionQuality(quality);
      setLastChecked(new Date());

      if (quality.status === "good") {
        toast.success("Internet connection restored");
      } else {
        toast.warning("Internet connection restored but quality is poor");
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality({ status: "offline", latency: 0, speed: "unknown" });
      setLastChecked(new Date());
      toast.error("Internet connection lost");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial connection test
    testConnectionQuality().then((quality) => {
      setConnectionQuality(quality);
      setLastChecked(new Date());
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [testConnectionQuality]);

  // Periodic connection quality checks
  useEffect(() => {
    const interval = setInterval(async () => {
      if (navigator.onLine) {
        const quality = await testConnectionQuality();
        setConnectionQuality(quality);
        setLastChecked(new Date());

        // Warn if connection quality degrades
        if (quality.status === "poor" && connectionQuality.status === "good") {
          toast.warning("Internet connection quality has degraded");
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [testConnectionQuality, connectionQuality.status]);

  // Force connection test
  const forceConnectionTest = useCallback(async () => {
    const quality = await testConnectionQuality();
    setConnectionQuality(quality);
    setLastChecked(new Date());
    return quality;
  }, [testConnectionQuality]);

  return {
    isOnline,
    connectionQuality,
    lastChecked,
    forceConnectionTest,
    isGoodConnection: connectionQuality.status === "good" && isOnline,
    isPoorConnection: connectionQuality.status === "poor" && isOnline,
    isOffline: !isOnline || connectionQuality.status === "offline",
  };
};
