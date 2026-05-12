"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type ControlledMotionProps =
  | "initial"
  | "animate"
  | "whileInView"
  | "transition"
  | "viewport";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
} & Omit<
  HTMLMotionProps<"div">,
  ControlledMotionProps | "children" | "className"
>;

function subscribeToReducedMotionPreference(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function getReducedMotionPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotionPreference() {
  return false;
}

function useHydratedReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotionPreference,
    getReducedMotionPreference,
    getServerReducedMotionPreference,
  );
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  ...props
}: ScrollRevealProps) {
  const shouldReduceMotion = useHydratedReducedMotion();
  const visible = { opacity: 1, y: 0, filter: "blur(0px)" };
  const hidden = shouldReduceMotion
    ? visible
    : { opacity: 0, y: 18, filter: "blur(6px)" };

  return (
    <motion.div
      initial={hidden}
      animate={visible}
      whileInView={visible}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.5,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      viewport={{ once: true, margin: "-12% 0px" }}
      className={cn("will-change-transform", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
