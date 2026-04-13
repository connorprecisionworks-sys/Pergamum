"use client";

import { motion, useReducedMotion } from "framer-motion";

interface FadeSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeSection({ children, delay = 0, className }: FadeSectionProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduce ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      viewport={{ once: true, margin: "-60px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
