import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Mail,
  MessageSquare,
  ShieldAlert,
  Cpu,
  Award,
  Zap,
} from "lucide-react";

interface LegalProps {
  onBackToBattle?: () => void;
}

const SECTIONS = [
  { id: "introduction", label: "01. INTRODUCTION" },
  { id: "eligibility", label: "02. USER ELIGIBILITY" },
  { id: "mechanics", label: "03. PLAY-TO-EARN MECHANICS" },
  { id: "distribution", label: "04. REWARD DISTRIBUTION" },
  { id: "disclosure", label: "05. RISK DISCLOSURE" },
  { id: "contact", label: "06. CONTACT" },
];

export default function Legal({ onBackToBattle }: LegalProps) {
  const [activeSection, setActiveSection] = useState("introduction");

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Listen to scroll to highlight active menu item
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;

      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="legal-terms-section"
      className="py-12 px-4 sm:px-6 md:px-16 max-w-7xl mx-auto scroll-mt-24"
    >
      {/* Top Banner Header */}
      <div className="mb-14 text-left border-b border-gray-800 pb-10">
        <div className="inline-block bg-[#22c55e]/10 border border-[#22c55e]/30 px-3 py-1 text-[#22c55e] font-mono text-[10px] tracking-widest uppercase mb-4 rounded">
          PROTOCOL DOCUMENTATION V4.0.2
        </div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-widest uppercase mb-3">
          LEGAL & TERMS
        </h1>
        <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
          EFFECTIVE DATE: NOVEMBER 14, 2024
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Sticky Left Sidebar (Navigation Menu) */}
        <div className="lg:col-span-4 lg:sticky lg:top-28 lg:h-fit z-25">
          <div className="border border-neutral-800 bg-[#0e0e0e]/90 p-4 md:p-6 rounded-lg backdrop-blur-sm space-y-2">
            <span className="font-mono text-[9px] text-[#8e9192] uppercase block tracking-widest font-bold mb-3">
              DOCUMENT SECTIONS
            </span>
            <div className="flex flex-row overflow-x-auto lg:flex-col gap-1 pb-2 lg:pb-0 scrollbar-none snap-x">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`font-mono text-[11px] tracking-wider text-left py-2 px-3 transition-all uppercase whitespace-nowrap snap-center shrink-0 w-auto lg:w-full ${
                    activeSection === sec.id
                      ? "bg-white text-black font-black"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-8 space-y-16">
          {/* Section 01: Introduction */}
          <div
            id="introduction"
            className="border border-neutral-900 bg-[#070707] p-6 md:p-10 relative rounded-lg transition-colors hover:border-neutral-800"
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-600"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-600"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-600"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-600"></div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-600 font-bold text-lg md:text-xl">
                  01
                </span>
                <h3 className="font-display text-lg md:text-2xl font-extrabold text-white uppercase tracking-wider">
                  INTRODUCTION
                </h3>
              </div>

              <div className="font-sans text-xs md:text-sm text-neutral-400 leading-relaxed space-y-4">
                <p>
                  These Terms of Service (&ldquo;Terms&rdquo;) constitute a
                  legally binding agreement between you and Dinodash
                  (&ldquo;Protocol,&rdquo; &ldquo;we,&rdquo; or
                  &ldquo;us&rdquo;). By accessing the platform, connecting your
                  digital wallet, or engaging in any &ldquo;Battle&rdquo; or
                  &ldquo;Earn&rdquo; activities, you acknowledge that you have
                  read, understood, and agreed to be bound by these Terms.
                </p>
                <p>
                  Dinodash is a decentralized, high-stakes competitive ecosystem
                  operating on-chain. Our services facilitate peer-to-peer
                  competition and automated reward distribution through audited
                  smart contracts. Participation carries inherent technological
                  and financial risks.
                </p>
              </div>
            </div>
          </div>

          {/* Section 02: User Eligibility */}
          <div
            id="eligibility"
            className="border border-neutral-900 bg-[#070707] p-6 md:p-10 relative rounded-lg transition-colors hover:border-neutral-800"
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-600"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-600"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-600"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-600"></div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-600 font-bold text-lg md:text-xl">
                  02
                </span>
                <h3 className="font-display text-lg md:text-2xl font-extrabold text-white uppercase tracking-wider">
                  USER ELIGIBILITY
                </h3>
              </div>

              {/* Grid with parameters info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-neutral-800 bg-[#0b0b0b] p-4 rounded text-left">
                  <span className="font-mono text-[9px] text-[#8e9192] uppercase block tracking-widest font-bold mb-1">
                    MINIMUM AGE
                  </span>
                  <p className="font-sans text-xs text-neutral-300 leading-relaxed">
                    You must be at least 18 years of age or the legal age of
                    majority in your jurisdiction to access Dinodash.
                  </p>
                </div>

                <div className="border border-neutral-800 bg-[#0b0b0b] p-4 rounded text-left">
                  <span className="font-mono text-[9px] text-[#8e9192] uppercase block tracking-widest font-bold mb-1">
                    JURISDICTION
                  </span>
                  <p className="font-sans text-xs text-neutral-300 leading-relaxed">
                    Users from restricted regions, including but not limited to
                    OFAC sanctioned countries, are prohibited from protocol
                    access.
                  </p>
                </div>
              </div>

              <div className="font-sans text-xs md:text-sm text-neutral-400 leading-relaxed">
                <p className="italic text-zinc-500">
                  Protocol access is automatically restricted via IP geolocation
                  for high-risk jurisdictions. Attempting to bypass these
                  measures using VPN technology constitutes a breach of these
                  Terms.
                </p>
              </div>
            </div>
          </div>

          {/* Smart Contract Sovereignty Hardware Graphic Panel */}
          <div className="border border-neutral-900 bg-[#0a0a0a] rounded-lg overflow-hidden relative">
            <div className="aspect-[16/7] w-full overflow-hidden relative">
              <img
                src="/src/assets/images/cybernetic_chip_1780833776811.png"
                alt="Cybernetic Microchip Motherboard Smart Contract"
                className="w-full h-full object-cover grayscale opacity-70 hover:grayscale-0 transition-all duration-700 hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>

              {/* Overlay text */}
              <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-left space-y-1">
                <h4 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-wider leading-none uppercase">
                  SMART CONTRACT
                  <br />
                  SOVEREIGNTY
                </h4>
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-mono text-[10px] text-green-400 font-bold tracking-widest uppercase">
                    SYSTEM STATUS: OPTIMIZED // SECURE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 03: Play To Earn Mechanics */}
          <div
            id="mechanics"
            className="border border-neutral-900 bg-[#070707] p-6 md:p-10 relative rounded-lg transition-colors hover:border-neutral-800"
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-600"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-600"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-600"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-600"></div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-600 font-bold text-lg md:text-xl">
                  03
                </span>
                <h3 className="font-display text-lg md:text-2xl font-extrabold text-white uppercase tracking-wider">
                  PLAY-TO-EARN MECHANICS
                </h3>
              </div>

              <p className="font-sans text-xs md:text-sm text-neutral-400 leading-relaxed">
                The &ldquo;Battle&rdquo; system operates on a winner-take-all or
                proportional reward distribution model depending on the selected
                Tier. By initiating a Battle, you authorize the protocol smart
                contracts to escrow the required tokens from your connected
                wallet.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <span className="font-sans text-xs md:text-sm text-neutral-300">
                    Execution of battle logic is final once confirmed on-chain.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <span className="font-sans text-xs md:text-sm text-neutral-300">
                    Gas fees (Transaction costs) are the sole responsibility of
                    the user.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <span className="font-sans text-xs md:text-sm text-neutral-300">
                    Network latency may affect real-time leaderboard
                    positioning.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 04: Reward Distribution */}
          <div
            id="distribution"
            className="border border-neutral-900 bg-[#070707] p-6 md:p-10 relative rounded-lg transition-colors hover:border-neutral-800"
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-600"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-600"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-600"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-600"></div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-600 font-bold text-lg md:text-xl">
                  04
                </span>
                <h3 className="font-display text-lg md:text-2xl font-extrabold text-white uppercase tracking-wider">
                  REWARD DISTRIBUTION
                </h3>
              </div>

              <div className="border border-neutral-800 bg-[#0b0b0b] p-4 rounded text-left">
                <span className="font-mono text-[9px] text-[#8e9192] uppercase block tracking-widest font-bold mb-1">
                  DISTRIBUTION LATENCY
                </span>
                <p className="font-sans text-xs text-neutral-300 leading-relaxed">
                  Rewards are distributed automatically within 400ms of battle
                  resolution, subject to blockchain block times and network
                  congestion. Dinodash does not hold or manage user private
                  keys.
                </p>
              </div>

              <div className="font-sans text-xs md:text-sm text-neutral-400 leading-relaxed">
                <p>
                  We reserve the right to audit and withhold rewards in cases of
                  suspected exploit usage, sybil attacks, or manipulation of
                  protocol mechanics. Automated detection scripts are active
                  24/7/365.
                </p>
              </div>
            </div>
          </div>

          {/* Section 05: Risk Disclosure */}
          <div
            id="disclosure"
            className="border border-neutral-900 bg-[#070707] p-6 md:p-10 relative rounded-lg transition-colors hover:border-neutral-800"
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-600"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-600"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-600"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-600"></div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-600 font-bold text-lg md:text-xl">
                  05
                </span>
                <h3 className="font-display text-lg md:text-2xl font-extrabold text-white uppercase tracking-wider">
                  RISK DISCLOSURE
                </h3>
              </div>

              <div className="font-sans text-xs md:text-sm text-white font-bold leading-relaxed space-y-1">
                <div className="text-red-500 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>
                    PARTICIPATION IN DINODASH INVOLVES SIGNIFICANT FINANCIAL
                    RISK.
                  </span>
                </div>
                <p className="text-neutral-400 font-normal">
                  Cryptographic assets are highly volatile. You may lose the
                  full value of the assets committed to the protocol. Dinodash
                  is provided &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo;
                  without warranties of any kind.
                </p>
              </div>

              {/* Three items specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-neutral-850 bg-[#0c0c0c] p-3 rounded text-center">
                  <span className="font-mono text-[8px] text-zinc-500 uppercase block tracking-widest mb-0.5">
                    RISK LEVEL
                  </span>
                  <span className="font-mono text-[10px] text-white font-black uppercase">
                    CRITICAL
                  </span>
                </div>
                <div className="border border-neutral-850 bg-[#0c0c0c] p-3 rounded text-center">
                  <span className="font-mono text-[8px] text-zinc-500 uppercase block tracking-widest mb-0.5">
                    ASSET TYPE
                  </span>
                  <span className="font-mono text-[10px] text-white font-black uppercase">
                    SYNTHETIC
                  </span>
                </div>
                <div className="border border-neutral-850 bg-[#0c0c0c] p-3 rounded text-center">
                  <span className="font-mono text-[8px] text-zinc-500 uppercase block tracking-widest mb-0.5">
                    CUSTODY
                  </span>
                  <span className="font-mono text-[10px] text-white font-black uppercase">
                    NON-CUSTODIAL
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 06: Contact */}
          <div
            id="contact"
            className="border border-neutral-900 bg-[#070707] p-6 md:p-10 relative rounded-lg transition-colors hover:border-neutral-800"
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-600"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-600"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-600"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-600"></div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-600 font-bold text-lg md:text-xl">
                  06
                </span>
                <h3 className="font-display text-lg md:text-2xl font-extrabold text-white uppercase tracking-wider">
                  CONTACT
                </h3>
              </div>

              <p className="font-sans text-xs md:text-sm text-neutral-400 leading-relaxed">
                For legal inquiries, partnership proposals, or technical dispute
                resolution, please utilize our encrypted communication channels.
              </p>

              {/* Two channels column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="mailto:legal@apex.proto"
                  className="group flex items-center gap-4 border border-neutral-800 hover:border-white bg-[#0a0a0a] p-4 rounded hover:bg-neutral-900 transition-all text-left"
                >
                  <div className="w-10 h-10 border border-neutral-800 group-hover:border-white bg-[#131313] flex items-center justify-center text-neutral-400 group-hover:text-white transition-all rounded">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block tracking-widest font-black">
                      EMAIL
                    </span>
                    <span className="font-mono text-[10px] text-neutral-300 group-hover:text-white transition-colors">
                      LEGAL@APEX.PROTO
                    </span>
                  </div>
                </a>

                <a
                  href="https://discord.gg/apexprotocol"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 border border-neutral-800 hover:border-white bg-[#0a0a0a] p-4 rounded hover:bg-neutral-900 transition-all text-left"
                >
                  <div className="w-10 h-10 border border-neutral-800 group-hover:border-white bg-[#131313] flex items-center justify-center text-neutral-400 group-hover:text-white transition-all rounded">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block tracking-widest font-black">
                      DISCORD
                    </span>
                    <span className="font-mono text-[10px] text-neutral-300 group-hover:text-white transition-colors">
                      DISCORD.GG/APEXPROTOCOL
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Quick CTA to return to main stream if provided */}
          {onBackToBattle && (
            <div className="pt-8 text-center sm:text-left">
              <button
                onClick={onBackToBattle}
                className="px-6 py-3 bg-white text-black font-mono text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
              >
                <span>RETURN TO OPERATIONAL SIMULATOR</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
