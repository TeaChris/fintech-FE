"use client";

import { motion, type Variants } from "framer-motion";

import { cn } from "@/lib/utils";

import type { FadeInProps } from "@/features/auth/types/auth.types";

const OFFSET = 8;

function getVariants(direction: FadeInProps["direction"] = "up"): Variants {
  const map: Record<string, { x?: number; y?: number }> = {
    up: { y: OFFSET },
    down: { y: -OFFSET },
    left: { x: -OFFSET },
    right: { x: OFFSET },
    none: {},
  };

  return {
    hidden: { opacity: 0, ...(map[direction ?? "up"] ?? {}) },
    visible: { opacity: 1, x: 0, y: 0 },
  };
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={getVariants(direction)}
      transition={{
        duration: 0.2,
        delay,
        ease: "easeOut",
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
