"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  isValidMotionProp,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import { cn } from "@/lib/utils";

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

type ScrollRevealPassthroughProps = Omit<
  ScrollRevealProps,
  "children" | "className" | "delay"
>;

function getDomProps(
  props: ScrollRevealPassthroughProps,
): ComponentPropsWithoutRef<"div"> {
  const domProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (!isValidMotionProp(key)) {
      domProps[key] = value;
    }
  }

  return domProps as ComponentPropsWithoutRef<"div">;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  ...props
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...getDomProps(props)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, margin: "-12% 0px" }}
      className={cn("will-change-transform", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
