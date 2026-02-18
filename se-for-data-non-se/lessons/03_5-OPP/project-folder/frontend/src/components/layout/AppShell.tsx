import type { ReactNode } from "react";
import NavRail from "./NavRail";

type Props = {
  children: ReactNode;
};

export default function AppShell({ children }: Props) {
  return (
    <div className="app-shell">
      <NavRail />
      <main className="app-main">{children}</main>
    </div>
  );
}
