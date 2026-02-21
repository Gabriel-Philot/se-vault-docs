import { ContainerScroll } from "../ui/container-scroll-animation";
import { SplitText } from "../ui/split-text";
import { Waves } from "../ui/waves";

export const HeroSection = () => {
  return (
    <section className="flex flex-col bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Waves
          lineColor="rgba(249, 115, 22, 0.3)"
          backgroundColor="transparent"
          xGap={28}
          yGap={36}
          waveAmpX={40}
          waveAmpY={18}
          friction={0.9}
          tension={0.01}
          waveSpeedX={0.015}
          waveSpeedY={0.005}
        />
        <Waves
          lineColor="rgba(139, 92, 246, 0.2)"
          backgroundColor="transparent"
          xGap={44}
          yGap={36}
          waveAmpX={50}
          waveAmpY={22}
          friction={0.9}
          tension={0.008}
          waveSpeedX={0.01}
          waveSpeedY={0.003}
        />
      </div>
      
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center mb-16 md:mb-24 relative z-10">
            <h1 className="text-4xl font-semibold text-white dark:text-white mb-4">
              Domine a Arte do
            </h1>
            <SplitText
              text="SOLID Refactory"
              className="text-4xl md:text-[7rem] font-bold leading-none font-display text-white justify-center drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
              delay={0.15}
            />
            {/* Subtle dark overlay behind text for readability */}
            <div className="absolute inset-0 bg-radial-gradient from-[#0a0a0f]/80 via-transparent to-transparent -z-10 pointer-events-none blur-3xl scale-150" />
          </div>
        }
      >
        <img
          src="https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2048&auto=format&fit=crop"
          alt="hero"
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </section>
  );
};
