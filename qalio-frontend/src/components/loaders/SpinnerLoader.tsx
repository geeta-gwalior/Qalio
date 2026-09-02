import React from "react";

interface SpinnerLoaderProps {
  size?: number; // in pixels
  color?: string; // Tailwind border class like 'green-500' or full class 'border-green-500'
  speed?: "slow" | "normal" | "fast";
  className?: string;
}

const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({
  size = 40,
  color = "white", // base color
  speed = "normal",
  className = "",
}) => {
  const speedClass = {
    slow: "animate-spin-slow",
    normal: "animate-spin",
    fast: "animate-spin-fast",
  }[speed];

  const spinnerStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  const borderColorClass = `border-${color}`;

  return (
    <div
      className={`border-4 border-t-transparent rounded-full ${borderColorClass} ${speedClass} ${className}`}
      style={spinnerStyle}
    />
  );
};

export default SpinnerLoader;
