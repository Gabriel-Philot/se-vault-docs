import type { PropsWithChildren } from "react";
import { assets } from "../../lib/assets";

export function PageCard({ children }: PropsWithChildren) {
  return (
    <section className="glass-panel relative overflow-hidden rounded-2xl p-5 md:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: `url(${assets.ui.parchmentTexture})`, backgroundSize: "256px 256px" }}
      />
      <div className="relative">{children}</div>
    </section>
  );
}
