import { clsx } from "clsx";
import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "soft" | "strong";
};

export const Card: React.FC<CardProps> = ({ className, children, variant = "soft", ...props }) => {
  return (
    <div
      className={clsx(
        "rounded-soft border border-outline shadow-card",
        variant === "soft" ? "card-surface" : "card-strong",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
