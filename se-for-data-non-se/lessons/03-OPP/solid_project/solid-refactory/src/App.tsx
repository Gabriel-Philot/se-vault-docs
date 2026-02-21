import { Navbar } from "./components/layout/Navbar";
import { HeroSection } from "./components/sections/HeroSection";
import { SRPSection } from "./components/sections/SRPSection";
import { OCPSection } from "./components/sections/OCPSection";
import { LSPSection } from "./components/sections/LSPSection";
import { ISPSection } from "./components/sections/ISPSection";
import { DIPSection } from "./components/sections/DIPSection";
import { YAGNISection } from "./components/sections/YAGNISection";
import { RecapSection } from "./components/sections/RecapSection";
import { CompletionProvider } from "./context/CompletionContext";

export default function App() {
  return (
    <CompletionProvider>
      <div className="relative min-h-screen bg-background selection:bg-srp/30">
        <Navbar />
        <main>
          <HeroSection />
          <SRPSection />
          <OCPSection />
          <LSPSection />
          <ISPSection />
          <DIPSection />
          <YAGNISection />
          <RecapSection />
        </main>

        {/* Background Glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-srp/10 blur-[120px] rounded-full" />
          <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] bg-ocp/10 blur-[120px] rounded-full" />
          <div className="absolute top-[60%] left-[-10%] w-[40%] h-[40%] bg-lsp/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-dip/10 blur-[120px] rounded-full" />
        </div>
      </div>
    </CompletionProvider>
  );
}
