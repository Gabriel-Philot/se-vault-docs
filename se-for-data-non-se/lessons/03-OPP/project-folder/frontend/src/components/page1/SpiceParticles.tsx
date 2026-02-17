import { motion } from "motion/react";
import { useMemo } from "react";

const PARTICLE_COUNT = 24;

export default function SpiceParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 0.8 + Math.random() * 0.7,
        delay: Math.random() * 0.3,
        dx: (Math.random() - 0.5) * 120,
        dy: -30 - Math.random() * 80,
      })),
    []
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 50,
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            x: p.dx,
            y: p.dy,
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, #f0a030, #e8722a)`,
            boxShadow: "0 0 6px rgba(232,114,42,0.6)",
          }}
        />
      ))}
    </div>
  );
}
