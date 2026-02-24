interface PointerArrowProps {
  fromId: string;
  toId: string;
  color?: string;
}

export function PointerArrow({
  fromId,
  toId,
  color = "text-ci-purple",
}: PointerArrowProps) {
  return (
    <div className={`text-xs font-mono ${color}`}>
      <span className="text-ci-dim">{fromId}</span>
      <span className="mx-1">&rarr;</span>
      <span>{toId}</span>
    </div>
  );
}
