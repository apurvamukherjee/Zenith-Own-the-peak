import { useEffect } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";

// Lightweight count-up. Eases from 0 to `value` on mount / when value changes.
export function AnimatedNumber({ value, decimals = 0, duration = 900 }: {
  value: number; decimals?: number; duration?: number;
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) =>
    v.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals }));

  useEffect(() => {
    mv.set(0);
    const controls = animate(mv, value, { duration: duration / 1000, ease: [0.33, 1, 0.68, 1] });
    return () => controls.stop();
  }, [value, duration, mv]);

  return <motion.span>{text}</motion.span>;
}
