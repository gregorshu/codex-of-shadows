import { clsx } from "clsx";
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  fullWidth?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  className,
  children,
  variant = "primary",
  fullWidth,
  ...props
}) => {
  const styles = clsx(
    "rounded-full px-4 py-2 text-sm font-medium transition border border-outline",
    {
      "bg-slate-100 text-gray-900 hover:bg-white": variant === "primary",
      "bg-transparent text-gray-200 hover:bg-[#1f2937]": variant === "ghost",
      "bg-transparent text-gray-200": variant === "outline",
      "w-full": fullWidth,
      "opacity-50 cursor-not-allowed": props.disabled,
    },
    className
  );
  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
};
