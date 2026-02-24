import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { Terminal, Cpu, Database, Binary, Home } from "lucide-react";
import { cn } from "../utils/cn";

const navItems = [
  { path: "/", label: "Home", icon: Home, color: "text-slate-400" },
  { path: "/bytes", label: "Bytes", icon: Binary, color: "text-cyan-400" },
  { path: "/shell", label: "Shell", icon: Terminal, color: "text-emerald-400" },
  { path: "/compiler", label: "Compiler", icon: Cpu, color: "text-amber-400" },
  { path: "/memory", label: "Memory", icon: Database, color: "text-blue-400" },
];

export function TopNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center border border-slate-700">
              <Terminal className="w-4 h-4 text-slate-300" />
            </div>
            <span className="font-mono font-bold text-lg tracking-tight text-white">
              Code<span className="text-slate-500">Matrix</span>
            </span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "relative px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2 z-10 relative">
                        <item.icon className={cn("w-4 h-4", isActive ? item.color : "text-slate-500")} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-slate-800 rounded-md -z-0 border border-slate-700/50"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
