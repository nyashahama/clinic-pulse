"use client";

import { motion, useSpring, useTransform, motionValue } from "motion/react";
import { useEffect } from "react";

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const springValue = motionValue(0);
  const spring = useSpring(springValue, {
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue, spring]);

  return (
    <motion.span style={{ display: "inline-block" }}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
}