import { ChevronDown, Shield, Bolt } from "lucide-react";

interface HeroProps {
  setActiveTab: (
    tab: "home" | "battle" | "leaderboard" | "wallet" | "legal",
  ) => void;
  onConnectClick: () => void;
  walletConnected: boolean;
  onEnterArena: () => void;
}

export default function Hero({
  setActiveTab,
  onConnectClick,
  walletConnected,
  onEnterArena,
}: HeroProps) {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden border-b border-[#444748]">
      {/* Cinematic grid background and artwork overlay */}
      <div className="absolute inset-0 z-0 opacity-25 select-none pointer-events-none">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUTveVFBJ84R9kh26shls1ujj_JgQ3LfXMLs5lpApRbSUQ9HgEMz9__BCEs6XAregWWuT0BEKMTFONuv0zeURFB-MFsz1Z8avZ4lFRffOD2tNjb4vysBaw_F1o9s11D672UP-CWMyF-XHjkwqnnfE96_ddC4oGCUUVgvHys0dRAy5IIM1uSIoOF_r7u9GgaOvhF1wKUAJrs7HiOUB7qFy4c6SuBgVcVC9lDFT5ioUKc3JohHgdsTmYDO1FNXzK7ovlZFu4ifRljFM"
          alt="Cinematic monolithic Dinodash battlefield background"
          className="w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center px-4">
        {/* System ready Badge */}
        <div
          id="system-ready-badge"
          className="inline-flex items-center gap-2 border border-white px-4 py-1.5 mb-8 bg-black/60 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          <span className="font-mono text-xs tracking-[0.2em] text-white">
            SYSTEM READY: V.1.0.4
          </span>
        </div>

        {/* Action Title */}
        <h1
          className="font-display text-4xl sm:text-6xl md:text-8xl uppercase tracking-tighter leading-none text-white mb-6 select-none font-black"
          id="hero-title"
        >
          DINODASH
        </h1>

        <p
          className="font-mono text-[#c3c7cd] text-sm sm:text-lg md:text-xl tracking-[0.25em] uppercase mb-12 select-none"
          id="hero-subtitle"
        >
          BATTLE. EARN. WITHDRAW.
        </p>

        {/* Primary CTA button set */}
        <div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full max-w-md md:max-w-none"
          id="hero-actions"
        >
          <button
            id="hero-btn-enter-arena"
            onClick={onEnterArena}
            className="flex-1 sm:flex-none sm:min-w-[200px] bg-white text-black font-mono text-xs px-8 py-4 font-black tracking-widest hover:bg-neutral-200 active:scale-95 transition-all outline-none uppercase shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          >
            ENTER THE ARENA
          </button>

          {/* <button
            id="hero-btn-view-leaderboard"
            onClick={() => {
              setActiveTab("leaderboard");
              const leaderboardElem = document.getElementById(
                "elite-operators-section",
              );
              if (leaderboardElem) {
                leaderboardElem.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="flex-1 sm:flex-none sm:min-w-[200px] border border-white text-white bg-black/40 backdrop-blur-sm font-mono text-xs px-8 py-4 font-bold tracking-widest hover:bg-white/10 active:scale-95 transition-all outline-none uppercase"
          >
            VIEW LEADERBOARD
          </button> */}
        </div>
      </div>

      {/* Floating footer element indicating scrolling */}
      <div
        className="absolute bottom-8 left-6 md:left-16 hidden lg:block cursor-pointer"
        id="scroll-indicator"
        onClick={() => {
          const bentoElem = document.getElementById("bento-features-section");
          if (bentoElem) bentoElem.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <div className="flex items-center gap-4 group">
          <div className="h-px w-20 bg-gray-600 group-hover:w-28 transition-all" />
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">
            Scroll to probe system
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 animate-bounce group-hover:text-white" />
        </div>
      </div>
    </section>
  );
}
