import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button as ShadcnButton } from "@/components/ui/button";

const customButtonVariants = cva(
  "w-full flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "",
        custom: "",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        xl: "h-14 px-8",
        custom: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof customButtonVariants> {
  asChild?: boolean;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  customHeight?: string;
  customWidth?: string;
  customBorderRadius?: string;
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      backgroundColor = "#4f46e5", // Modern indigo primary brand color
      textColor = "white",
      fontSize = "1rem",
      fontWeight = "medium",
      customHeight,
      customWidth,
      customBorderRadius = "0.5rem",
      style,
      ...props
    },
    ref
  ) => {
    // If using the custom variant, apply custom styles
    if (variant === "custom" || size === "custom") {
      const customStyle = {
        backgroundColor,
        color: textColor,
        fontSize,
        fontWeight,
        height: customHeight,
        width: customWidth || "100%",
        borderRadius: customBorderRadius,
        ...style,
      };

      return (
        <button
          className={cn(
            customButtonVariants({
              variant: "custom",
              size: "custom",
              className,
            })
          )}
          ref={ref}
          style={customStyle}
          {...props}
        />
      );
    }

    // Otherwise use the shadcn Button with default variants
    return (
      <ShadcnButton
        className={cn(customButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

CustomButton.displayName = "CustomButton";

export { CustomButton, customButtonVariants };
