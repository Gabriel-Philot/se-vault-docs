import { Shield, User } from "lucide-react";

interface UserCompareProps {
  currentUser: string;
  users: string[];
  onSwitchUser: (user: string) => void;
}

export function UserCompare({
  currentUser,
  users,
  onSwitchUser,
}: UserCompareProps) {
  return (
    <div className="rounded-xl border border-ci-border bg-linear-to-b from-ci-panel to-ci-surface/35 p-4 shadow-lg shadow-black/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-ci-muted">Identity Context</h3>
        <span className="rounded-full border border-ci-border bg-ci-bg/45 px-2 py-0.5 text-[11px] font-mono text-ci-dim">
          {users.length} users
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {users.map((user) => (
          <button
            key={user}
            onClick={() => onSwitchUser(user)}
            aria-pressed={user === currentUser}
            className={
              user === currentUser
                ? "inline-flex items-center gap-1.5 rounded-lg border border-ci-green/35 bg-ci-green/18 px-3 py-1.5 text-xs font-mono text-ci-green transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-green/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg"
                : "inline-flex items-center gap-1.5 rounded-lg border border-ci-border bg-ci-surface px-3 py-1.5 text-xs font-mono text-ci-muted transition-all duration-200 hover:border-ci-muted/55 hover:text-ci-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-muted/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ci-bg"
            }
          >
            {user === "root" ? <Shield size={12} /> : <User size={12} />}
            {user}
          </button>
        ))}
      </div>
    </div>
  );
}
