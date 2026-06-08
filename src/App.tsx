import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ConnectModal from "./components/ConnectModal";
import Hero from "./components/Hero";
import Features from "./components/Features";
import ArenaBattle from "./components/ArenaBattle";
import Leaderboard from "./components/Leaderboard";
import WalletDashboard from "./components/WalletDashboard";
import Legal from "./components/Legal";
import { Operator } from "./types";

function normalizeAddress(addr: string): string {
  if (!addr) return "";
  const trimmed = addr.trim();
  if (trimmed.startsWith("0x")) {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<
    "home" | "battle" | "leaderboard" | "wallet" | "legal"
  >("home");

  // Wallet Connection and Operator Identity (with localStorage persistence)
  const [walletConnected, setWalletConnected] = useState<boolean>(() => {
    const stored = localStorage.getItem("APEX_WALLET_CONNECTED");
    return stored === "true";
  });

  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    return localStorage.getItem("APEX_WALLET_ADDRESS") || null;
  });

  const [operatorName, setOperatorName] = useState<string>(() => {
    return localStorage.getItem("APEX_OPERATOR_NAME") || "YOU (ACTIVE)";
  });

  const [earnings, setEarnings] = useState<number>(() => {
    const stored = localStorage.getItem("APEX_OPERATOR_EARNINGS");
    return stored ? parseFloat(stored) : 38150.0; // Base rate from user request
  });

  const [unlockedNodes, setUnlockedNodes] = useState<string[]>(() => {
    const stored = localStorage.getItem("APEX_UNLOCKED_NODES");
    return stored ? JSON.parse(stored) : [];
  });

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [leaderboardUsers, setLeaderboardUsers] = useState<Operator[]>([]);

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem("APEX_WALLET_CONNECTED", String(walletConnected));
    localStorage.setItem("APEX_OPERATOR_NAME", operatorName);
    localStorage.setItem("APEX_OPERATOR_EARNINGS", String(earnings));
    localStorage.setItem("APEX_UNLOCKED_NODES", JSON.stringify(unlockedNodes));
    if (walletAddress) {
      localStorage.setItem("APEX_WALLET_ADDRESS", walletAddress);
    } else {
      localStorage.removeItem("APEX_WALLET_ADDRESS");
    }
  }, [walletConnected, operatorName, earnings, walletAddress, unlockedNodes]);

  // Synchronize entire Operator Profile with Server DB inside an effect
  useEffect(() => {
    if (walletConnected && walletAddress) {
      const syncProfile = async () => {
        try {
          const res = await fetch(
            `/api/operator/${normalizeAddress(walletAddress)}`,
          );
          if (res.ok) {
            const data = await res.json();
            setOperatorName(data.name);
            setEarnings(parseFloat(data.earnings) || 0);
            setUnlockedNodes(data.unlockedNodes || []);
          }
        } catch (err) {
          console.error("Failed to sync profile from db server:", err);
        }
      };
      syncProfile();
    }
  }, [walletConnected, walletAddress]);

  // Dynamic Server Leaderboard Synchronizer
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const list = await res.json();
          const mapped: Operator[] = list.map((user: any, index: number) => ({
            rank: index + 1,
            name: user.name,
            status:
              user.highScore >= 500
                ? "LEGENDARY"
                : user.highScore >= 200
                  ? "ELITE"
                  : "RECRUIT",
            earnings: parseFloat(user.earnings) || 0,
            avatarLetter: user.name.charAt(0) || "U",
            isActiveUser:
              walletAddress &&
              normalizeAddress(user.address) ===
                normalizeAddress(walletAddress),
          }));
          setLeaderboardUsers(mapped);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      }
    };
    fetchLeaderboard();
  }, [walletAddress, earnings]);

  // Fallback / standard operators if server is initializing
  const computedOperators: Operator[] =
    leaderboardUsers.length > 0
      ? leaderboardUsers
      : [
          {
            name: "VOID_WALKER_99",
            status: "LEGENDARY" as const,
            earnings: 42902.12,
            avatarLetter: "V",
          },
          {
            name: operatorName,
            status: "ELITE" as const,
            earnings: earnings,
            avatarLetter: operatorName.charAt(0) || "U",
            isActiveUser: true,
          },
          {
            name: "KRONOS_PRIME",
            status: "ELITE" as const,
            earnings: 29441.9,
            avatarLetter: "K",
          },
          {
            name: "SPECTRE_X",
            status: "ELITE" as const,
            earnings: 18220.45,
            avatarLetter: "S",
          },
        ].sort((a, b) => b.earnings - a.earnings);

  // Interactions and Actions triggers
  const handleConnect = (
    name: string,
    address: string,
    unlocked: string[],
    currentEarnings: number,
  ) => {
    setOperatorName(name);
    setWalletAddress(address);
    setUnlockedNodes(unlocked);
    setEarnings(currentEarnings);
    setWalletConnected(true);
  };

  const handleDisconnect = () => {
    if (confirm("Disconnect safe keys channel and boot system down?")) {
      setWalletConnected(false);
      setWalletAddress(null);
      setOperatorName("YOU (ACTIVE)");
      setEarnings(0);
      setUnlockedNodes([]);
      setActiveTab("home");
      localStorage.clear();
    }
  };

  const handleAddEarnings = async (amountUsd: number, score: number) => {
    if (walletConnected && walletAddress) {
      try {
        const res = await fetch("/api/update-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: normalizeAddress(walletAddress),
            score: score,
            earnings: amountUsd,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setEarnings(parseFloat(data.earnings) || 0);
        }
      } catch (err) {
        console.error("Failed to sync score and reward with server:", err);
        setEarnings((prev) => prev + amountUsd);
      }
    } else {
      setEarnings((prev) => prev + amountUsd);
    }
  };

  const handleSubtractEarnings = (amountUsd: number) => {
    if (amountUsd > earnings) return false;
    setEarnings((prev) => prev - amountUsd);
    return true;
  };

  const handleUnlockNode = async (nodeName: string): Promise<boolean> => {
    if (!walletConnected || !walletAddress) {
      setIsConnectModalOpen(true);
      return false;
    }
    try {
      const response = await fetch("/api/unlock-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: normalizeAddress(walletAddress),
          nodeName: nodeName,
          txHash:
            "4R1v9X6H" +
            Array.from({ length: 40 }, () =>
              Math.floor(Math.random() * 16).toString(16),
            ).join(""),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUnlockedNodes(data.unlockedNodes || []);
        // Trigger profile refetch
        const profileRes = await fetch(
          `/api/operator/${normalizeAddress(walletAddress)}`,
        );
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setEarnings(parseFloat(profileData.earnings) || 0);
        }
        return true;
      }
    } catch (err) {
      console.error("Error unlocking premium simulated node:", err);
    }
    return false;
  };

  const handleChallenge = (oppName: string) => {
    setActiveTab("battle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBattleCompleted = (
    won: boolean,
    opponent: string,
    reward: number,
  ) => {
    // Navigate user to Leaderboard or Wallet if they want to review updated score or withdrawals
  };

  const scrollIntoArenaSection = () => {
    setActiveTab("battle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid-bg min-h-screen pb-12 pt-20" id="apex-main-layout">
      {/* Scanning Laser Line */}
      <div className="scanline" />

      {/* Top Navigation Panel */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        operatorName={operatorName}
        onConnectClick={() => setIsConnectModalOpen(true)}
        onDisconnectClick={handleDisconnect}
      />

      {/* Primary Main Content Streams */}
      <main className="space-y-4">
        {/* Render Tab specific views */}
        {activeTab === "home" && (
          <div className="fade-in">
            {/* Cinematic landing hero aspect */}
            <Hero
              setActiveTab={setActiveTab}
              onConnectClick={() => setIsConnectModalOpen(true)}
              walletConnected={walletConnected}
              onEnterArena={scrollIntoArenaSection}
            />

            {/* Core Bento Card Features */}
            <Features
              earnings={earnings}
              walletConnected={walletConnected}
              onEnterArena={scrollIntoArenaSection}
              onWithdrawClick={() => setActiveTab("wallet")}
            />

            {/* Final Cinematic CTA section */}
            <section
              className="relative py-28 px-4 overflow-hidden border-t border-[#444748]"
              id="cta-battle-awaits"
            >
              <div className="absolute inset-0 bg-black opacity-85 z-0" />

              {/* Visual background circuitry pattern */}
              <div className="absolute inset-0 z-[-1] opacity-20 col-span-12">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAycuVwyRGRPtRgl-apTLD8vNfj2HQWrQQzo_NToPEscs56_qfNTLqG59xA97RM5mxzzkoUwoACmoXc3--zY5AXQDpF6pkwL10IvOhjYPqiJKbTcLR5q4lQvKt1PQNCeK0qTA-GL7ABMm4kkF8CRqshfzOTF-D7n5XLKmWvH95w3DMrgPmMfzg7DP-ir8oq6UK_gZ00IbtG_zeN-d60aCSumLwW4gvfOjY2uSaetpCjEfYAh33XKoSRUafz6bPtyP6n6_U8t-BZVIA"
                  alt="Silicon grid digital hardware pattern background"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-none">
                  THE BATTLE AWAITS
                </h2>

                <p className="font-sans text-sm sm:text-base md:text-lg text-[#c3c7cd] max-w-2xl mx-auto">
                  The protocol is live. Secure your position in the hierarchy
                  and begin your extraction process today.
                </p>

                <div className="inline-block relative p-1 group">
                  <div className="absolute inset-0 bg-white opacity-25 blur-2xl group-hover:opacity-45 transition-opacity" />

                  {walletConnected ? (
                    <button
                      id="cta-enter-arena-btn"
                      onClick={scrollIntoArenaSection}
                      className="relative bg-white text-black font-mono text-sm px-10 py-5 font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all outline-none"
                    >
                      ENTER ARENA SIMULATION
                    </button>
                  ) : (
                    <button
                      id="cta-connect-wallet-btn"
                      onClick={() => setIsConnectModalOpen(true)}
                      className="relative bg-white text-black font-mono text-sm px-10 py-5 font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all outline-none"
                    >
                      CONNECT WALLET
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "battle" && (
          <div className="fade-in pt-6">
            {/* Custom Interactive Tactical Arena */}
            <ArenaBattle
              walletConnected={walletConnected}
              onConnectClick={() => setIsConnectModalOpen(true)}
              operatorName={operatorName}
              addEarnings={handleAddEarnings}
              onBattleFinish={handleBattleCompleted}
              unlockedNodes={unlockedNodes}
              onUnlockNode={handleUnlockNode}
              earnings={earnings}
            />
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="fade-in pt-6">
            <Leaderboard
              operators={computedOperators}
              walletConnected={walletConnected}
              onChallengeClick={handleChallenge}
              onViewProfileClick={() => setActiveTab("wallet")}
            />
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="fade-in pt-6">
            <WalletDashboard
              walletConnected={walletConnected}
              onConnectClick={() => setIsConnectModalOpen(true)}
              operatorName={operatorName}
              setOperatorName={setOperatorName}
              earnings={earnings}
              subtractEarnings={handleSubtractEarnings}
              walletAddress={walletAddress || "0x0000...0000"}
            />
          </div>
        )}

        {activeTab === "legal" && (
          <div className="fade-in pt-6">
            <Legal onBackToBattle={() => setActiveTab("battle")} />
          </div>
        )}
      </main>

      {/* Cybernetic Footer */}
      <footer
        className="w-full py-16 px-6 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-[#444748] bg-black/90 mt-20"
        id="apex-system-footer"
      >
        <div className="font-display text-xl font-bold tracking-tighter text-white uppercase select-none">
          DINODASH
        </div>

        <div className="font-sans text-xs text-[#c3c7cd] text-center md:text-left select-none max-w-md">
          © 2026 DINODASH. ALL RIGHTS RESERVED. POWERED BY APEX CORE HARNESS
          SYSTEMS.
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8 font-mono text-[10px] tracking-wider font-bold">
          <button
            onClick={() => {
              setActiveTab("legal");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-gray-400 hover:text-white underline underline-offset-4 transition-all uppercase cursor-pointer bg-transparent border-none p-0 outline-none"
          >
            LEGAL
          </button>
          <button
            onClick={() => {
              setActiveTab("legal");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-gray-400 hover:text-white underline underline-offset-4 transition-all uppercase cursor-pointer bg-transparent border-none p-0 outline-none"
          >
            TERMS
          </button>
          <a
            href="https://discord.gg/apexprotocol"
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-white underline underline-offset-4 transition-all"
          >
            DISCORD
          </a>
          <a
            href="https://t.me/apexprotocol"
            target="_blank"
            rel="noreferrer"
            className="text-gray-400 hover:text-white underline underline-offset-4 transition-all"
          >
            TELEGRAM
          </a>
        </div>
      </footer>

      {/* Wallet Authentication Dialog Terminal Overlay */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnect={handleConnect}
      />
    </div>
  );
}
