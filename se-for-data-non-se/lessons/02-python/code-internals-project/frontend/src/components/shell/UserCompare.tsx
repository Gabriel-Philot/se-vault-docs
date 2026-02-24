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
    <div className="bg-ci-panel rounded-lg border border-ci-border p-4 space-y-3">
      <h3 className="text-sm font-medium text-ci-muted">Users</h3>
      <div className="flex gap-2 flex-wrap">
        {users.map((user) => (
          <button
            key={user}
            onClick={() => onSwitchUser(user)}
            className={
              user === currentUser
                ? "rounded-lg border border-ci-green/30 bg-ci-green/20 px-3 py-1.5 text-xs font-mono text-ci-green transition-colors duration-200"
                : "rounded-lg border border-ci-border bg-ci-surface px-3 py-1.5 text-xs font-mono text-ci-muted transition-colors duration-200 hover:text-ci-text"
            }
          >
            {user}
          </button>
        ))}
      </div>
    </div>
  );
}
