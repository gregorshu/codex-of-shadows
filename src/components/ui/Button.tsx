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
      "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-text)] hover:bg-[color:var(--button-primary-hover)]":
        variant === "primary",
      "bg-transparent text-[color:var(--button-ghost-text)] hover:bg-[color:var(--button-ghost-hover)]":
        variant === "ghost",
      "bg-transparent text-[color:var(--text-primary)]": variant === "outline",
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
