// Utility function to detect device type
export function detectDeviceType(): "mobile" | "tablet" | "laptop" {
  // Check if navigator and userAgent are available
  if (!navigator || !navigator.userAgent) {
    return "laptop"; // Default to laptop if detection fails
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // Check for mobile devices
  const isMobile =
    /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  // Check for tablets
  const isTablet =
    /ipad|android(?!.*mobile)/i.test(userAgent) ||
    (/android/i.test(userAgent) && !/mobile/i.test(userAgent)) ||
    /tablet|playbook/i.test(userAgent);

  // Additional check for screen size (mobile/tablet typically have smaller screens)
  const hasSmallScreen = window.innerWidth < 1024;

  // Additional check for touch capability (most mobile/tablet devices have touch)
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (isMobile && hasTouch) {
    return "mobile";
  } else if (isTablet || (hasSmallScreen && hasTouch)) {
    return "tablet";
  } else {
    return "laptop";
  }
}

// Function to check if device is allowed
export function isDeviceAllowed(
  allowedDevices: ("mobile" | "tablet" | "laptop")[]
): boolean {
  const deviceType = detectDeviceType();
  return allowedDevices.includes(deviceType);
}

// Default configuration - ONLY ALLOW LAPTOP/DESKTOP DEVICES
export const DEFAULT_ALLOWED_DEVICES: ("mobile" | "tablet" | "laptop")[] = [
  "laptop",
];
