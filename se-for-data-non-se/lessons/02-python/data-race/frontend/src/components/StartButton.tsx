import { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
  isRacing: boolean;
  isFinished: boolean;
  onStart: () => void;
  disabled?: boolean;
}

export default function StartButton({ isRacing, isFinished, onStart, disabled = false }: Props) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  const handleClick = useCallback(() => {
    if (isRacing || disabled || countdown !== null) return;
    setCountdown(3);
  }, [isRacing, disabled, countdown]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      // Show "GO!" for 400ms, then fire the race
      const timer = setTimeout(() => {
        setCountdown(null);
        onStartRef.current();
      }, 400);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 700);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (countdown !== null) {
    return (
      <div className="start-button-area">
        <div className="countdown" data-testid="countdown">{countdown === 0 ? 'GO!' : countdown}</div>
      </div>
    );
  }

  return (
    <div className="start-button-area">
      <button
        className="start-button"
        data-testid="start-button"
        onClick={handleClick}
        disabled={isRacing || disabled}
      >
        {isFinished ? 'RACE AGAIN' : 'START RACE'}
      </button>
    </div>
  );
}
