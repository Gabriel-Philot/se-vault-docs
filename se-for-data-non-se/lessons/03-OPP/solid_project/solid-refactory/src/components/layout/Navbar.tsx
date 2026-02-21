import { motion } from "framer-motion";
import { Code2, Layers, Cpu, Share2, Zap } from "lucide-react";

const navItems = [
  { name: "SRP", icon: Code2, color: "text-srp" },
  { name: "OCP", icon: Layers, color: "text-ocp" },
  { name: "LSP", icon: Cpu, color: "text-lsp" },
  { name: "ISP", icon: Share2, color: "text-isp" },
  { name: "DIP", icon: Zap, color: "text-dip" },
];

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-dark px-6 py-3 rounded-full flex items-center gap-8"
      >
        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-background font-bold text-xl">S</span>
          </div>
          <span className="font-display font-bold tracking-tighter text-xl">SOLID</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <a 
              key={item.name} 
              href={`#${item.name.toLowerCase()}`}
              className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors group"
            >
              <item.icon className={`w-4 h-4 ${item.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
              {item.name}
            </a>
          ))}
        </div>
      </motion.div>
    </nav>
  );
};
