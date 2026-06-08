import React, { useState } from "react";
import { LogOut, ChevronRight, Menu, X, Shield, Wallet } from "lucide-react";

interface NavbarProps {
  activeTab: "home" | "battle" | "leaderboard" | "wallet" | "legal";
  setActiveTab: (
    tab: "home" | "battle" | "leaderboard" | "wallet" | "legal",
  ) => void;
  walletConnected: boolean;
  walletAddress: string | null;
  operatorName: string;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  walletConnected,
  walletAddress,
  operatorName,
  onConnectClick,
  onDisconnectClick,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabChange = (
    tab: "home" | "battle" | "leaderboard" | "wallet",
  ) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-20 z-[109] flex justify-between items-center px-4 sm:px-6 md:px-16 bg-[#131313]/90 backdrop-blur-md border-b border-[#444748] transition-all z-9999">
        {/* Logo left */}
        <div
          id="nav-logo"
          onClick={() => handleTabChange("home")}
          className="font-display text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white uppercase cursor-pointer select-none flex items-center gap-2 block hover:opacity-85"
        >
          DINODASH
        </div>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex gap-6 lg:gap-8 items-center"
          id="nav-desktop-menu"
        >
          <button
            id="nav-link-home"
            onClick={() => handleTabChange("home")}
            className={`font-mono text-xs tracking-wider pb-1 transition-all border-b-2 uppercase ${
              activeTab === "home"
                ? "text-white border-white font-black"
                : "text-[#c3c7cd] border-transparent hover:text-white"
            }`}
          >
            HOME
          </button>
          <button
            id="nav-link-battle"
            onClick={() => handleTabChange("battle")}
            className={`font-mono text-xs tracking-wider pb-1 transition-all border-b-2 uppercase ${
              activeTab === "battle"
                ? "text-white border-white font-black"
                : "text-[#c3c7cd] border-transparent hover:text-white"
            }`}
          >
            BATTLE
          </button>
          <button
            id="nav-link-leaderboard"
            onClick={() => handleTabChange("leaderboard")}
            className={`font-mono text-xs tracking-wider pb-1 transition-all border-b-2 uppercase ${
              activeTab === "leaderboard"
                ? "text-white border-white font-black"
                : "text-[#c3c7cd] border-transparent hover:text-white"
            }`}
          >
            LEADERBOARD
          </button>
          <button
            id="nav-link-wallet"
            onClick={() => handleTabChange("wallet")}
            className={`font-mono text-xs tracking-wider pb-1 transition-all border-b-2 uppercase ${
              activeTab === "wallet"
                ? "text-white border-white font-black"
                : "text-[#c3c7cd] border-transparent hover:text-white"
            }`}
          >
            WALLET
          </button>
        </nav>

        {/* Desktop Active/Connect Panel */}
        <div className="hidden md:flex items-center gap-4" id="nav-actions">
          {walletConnected && walletAddress ? (
            <div className="flex items-center gap-3">
              {/* Operator Identifier info block */}
              <div className="hidden lg:flex flex-col items-end text-right">
                <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest leading-none font-bold">
                  Connected
                </span>
              </div>

              {/* Wallet Info trigger button */}
              <button
                id="active-wallet-info-btn"
                onClick={() => handleTabChange("wallet")}
                className="bg-[#1f1f1f] border border-[#444748] hover:border-white text-white font-mono text-[11px] h-10 px-4 flex items-center gap-2 transition-all group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></div>
                <span>
                  {walletAddress
                    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    : ""}
                </span>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Secure Log out */}
              <button
                id="disconnect-wallet-btn"
                onClick={onDisconnectClick}
                title="Disconnect Operator"
                className="w-10 h-10 border border-[#444748] hover:border-red-500 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all bg-black/45"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="connect-wallet-btn"
              onClick={() => {
                console.log("[NAVBAR] CONNECT WALLET clicked");
                onConnectClick();
              }}
              className="bg-white text-black font-mono text-xs px-6 py-3 font-bold hover:bg-neutral-200 active:scale-95 transition-all outline-none"
            >
              CONNECT WALLET
            </button>
          )}
        </div>

        {/* Mobile controls: hamburger Menu Toggle */}
        <div
          className="flex md:hidden items-center gap-3"
          id="mobile-nav-toggle-wrapper"
        >
          {walletConnected && walletAddress && (
            <div
              className="w-2.5 h-2.5 bg-[#22c55e] rounded-full animate-pulse"
              title="Security lock connected"
            ></div>
          )}
          <button
            id="mobile-menu-trigger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center border border-[#444748] hover:border-white text-white transition-all rounded bg-[#131313]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-overlay"
          className="fixed inset-0 top-20 bg-black/95 z-40 flex flex-col justify-between p-6 animate-fade-in block md:hidden border-t border-[#444748]/30 overflow-y-auto"
        >
          <div className="space-y-8 py-8" id="mobile-drawer-main-panel">
            <span className="font-mono text-[9px] text-gray-500 uppercase block tracking-widest font-black leading-none pb-2 border-b border-neutral-800">
              OPERATIONAL PORTALS
            </span>
            <div className="flex flex-col gap-5 text-left">
              <button
                id="mobile-link-home"
                onClick={() => handleTabChange("home")}
                className={`font-display text-xl tracking-widest uppercase transition-colors text-left ${
                  activeTab === "home"
                    ? "text-[#22c55e] font-black"
                    : "text-white hover:text-zinc-300"
                }`}
              >
                // HOME
              </button>

              <button
                id="mobile-link-battle"
                onClick={() => handleTabChange("battle")}
                className={`font-display text-xl tracking-widest uppercase transition-colors text-left ${
                  activeTab === "battle"
                    ? "text-[#22c55e] font-black"
                    : "text-white hover:text-zinc-300"
                }`}
              >
                // BATTLE SIMULATOR
              </button>

              <button
                id="mobile-link-leaderboard"
                onClick={() => handleTabChange("leaderboard")}
                className={`font-display text-xl tracking-widest uppercase transition-colors text-left ${
                  activeTab === "leaderboard"
                    ? "text-[#22c55e] font-black"
                    : "text-white hover:text-zinc-300"
                }`}
              >
                // LEADERBOARD
              </button>

              <button
                id="mobile-link-wallet"
                onClick={() => handleTabChange("wallet")}
                className={`font-display text-xl tracking-widest uppercase transition-colors text-left ${
                  activeTab === "wallet"
                    ? "text-[#22c55e] font-black"
                    : "text-white hover:text-zinc-300"
                }`}
              >
                // KEY WALLET
              </button>
            </div>
          </div>

          {/* Connected User Mobile stats or quick links */}
          <div
            className="border-t border-neutral-900 pt-6 space-y-4"
            id="mobile-drawer-auth-panel"
          >
            {walletConnected && walletAddress ? (
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block tracking-widest font-bold">
                      OPERATOR
                    </span>
                    <span className="font-sans text-sm font-bold text-white tracking-wide">
                      {operatorName}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[8px] text-zinc-500 uppercase block tracking-widest font-bold">
                      LEDGER
                    </span>
                    <span className="font-mono text-xs text-green-400">
                      {walletAddress
                        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleTabChange("wallet")}
                    className="py-3 bg-neutral-900 border border-neutral-800 hover:border-white text-white font-mono text-xs font-bold uppercase tracking-wider text-center"
                  >
                    LEDGER WALLET
                  </button>
                  <button
                    onClick={() => {
                      onDisconnectClick();
                      setMobileMenuOpen(false);
                    }}
                    className="py-3 bg-red-950/20 border border-red-900/30 text-red-400 font-mono text-xs font-bold uppercase tracking-wider text-center hover:bg-red-950"
                  >
                    DISCONNECT
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onConnectClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-4 bg-white text-black font-mono text-xs font-black uppercase tracking-wider text-center hover:bg-neutral-200"
              >
                CONNECT DECENTRALIZED WALLET
              </button>
            )}

            <div className="text-center">
              <span className="font-mono text-[8px] text-zinc-600 block">
                APEX CONSENSUS INTERFACE V1.1.2
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
