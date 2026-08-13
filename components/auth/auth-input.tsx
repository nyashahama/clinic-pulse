"use client";

import { cn } from "@/lib/utils";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

type AuthInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: ReactNode;
  error?: string;
  trailing?: ReactNode;
};

export function AuthInput({
  label,
  error,
  trailing,
  className,
  type,
  id,
  ...props
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            "block min-h-12 w-full min-w-0 appearance-none rounded-xl border bg-white px-3.5 py-2.5 text-base text-neutral-900 outline-none transition-all duration-200",
            "placeholder:text-neutral-400",
            focused
              ? "border-[#0D7A6B] ring-2 ring-[#0D7A6B]/15 shadow-[0_0_0_3px_rgba(13,122,107,0.06)]"
              : "border-neutral-300 hover:border-neutral-400",
            error && !focused && "border-red-400",
            trailing && "pr-10",
            className,
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute right-0 top-0 flex h-full items-center pr-3">
            {trailing}
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-1.5 text-xs font-medium text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
