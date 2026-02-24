interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

const SIZES = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

export function LoadingSpinner({
  size = "md",
  color = "border-ci-green",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`${SIZES[size]} ${color} border-2 border-t-transparent rounded-full animate-spin`}
    />
  );
}
