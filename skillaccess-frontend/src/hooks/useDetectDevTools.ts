import { useEffect } from "react";

export function useDetectDevTools(onDetect: () => void) {
  useEffect(() => {
    let devtoolsOpen = false;
    const threshold = 160;

    const check = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          onDetect();
        }
      } else {
        devtoolsOpen = false;
      }
    };

    const interval = setInterval(check, 1000);

    return () => clearInterval(interval);
  }, [onDetect]);
}
