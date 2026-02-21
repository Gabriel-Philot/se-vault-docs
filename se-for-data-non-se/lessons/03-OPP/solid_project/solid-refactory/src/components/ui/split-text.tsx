import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "../../lib/utils";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  delay = 0.1,
}) => {
  const words = text.split(" ");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });

  return (
    <motion.div 
      ref={ref} 
      className={cn("flex flex-wrap relative z-20", className)}
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { 
            opacity: 1, 
            y: 0,
            textShadow: [
              "0 0 15px rgba(255,255,255,0.3)",
              "0 0 30px rgba(255,255,255,0.6)",
              "0 0 15px rgba(255,255,255,0.3)"
            ]
          } : { opacity: 0, y: 20 }}
          transition={{
            opacity: { duration: 0.5, delay: i * delay },
            y: { duration: 0.5, delay: i * delay },
            textShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="inline-block mr-[0.25em] last:mr-0 relative text-white"
        >
          {word}
          {/* Continuous Shimmer Effect - Reduced opacity for readability */}
          <motion.span
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.2,
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
          />
        </motion.span>
      ))}
    </motion.div>
  );
};
