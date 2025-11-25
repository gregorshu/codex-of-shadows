import { clsx } from "clsx";
import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <label className="flex flex-col gap-2 text-sm text-gray-200">
      {label && <span className="text-subtle">{label}</span>}
      <input
        className={clsx(
          "rounded-lg border border-outline bg-[#0f1116] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-400/50",
          className
        )}
        {...props}
      />
    </label>
  );
};
