import { useState, useEffect, useRef } from "react";

interface ResetButtonProps {
  onReset: () => void;
  loading?: boolean;
}

export default function ResetButton({ onReset, loading }: ResetButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (loading) return;
    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 2000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setConfirming(false);
      onReset();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: "0.3rem 0.7rem",
        background: confirming ? "rgba(192,57,43,0.15)" : "transparent",
        border: `1px solid ${confirming ? "var(--error)" : "rgba(192,57,43,0.3)"}`,
        borderRadius: 5,
        color: confirming ? "var(--error)" : "rgba(192,57,43,0.6)",
        fontFamily: "var(--font-heading)",
        fontSize: "0.7rem",
        fontWeight: 600,
        cursor: loading ? "default" : "pointer",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        transition: "all 0.2s",
        opacity: loading ? 0.5 : 1,
      }}
    >
      {loading ? "Resetting..." : confirming ? "Reset?" : "Reset"}
    </button>
  );
}
