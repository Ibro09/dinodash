import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Play,
  Clock,
  Users,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Operator } from "../types";

interface LeaderboardProps {
  operators: Operator[];
  walletConnected: boolean;
  onChallengeClick: (operatorName: string) => void;
  onViewProfileClick?: () => void;
}

// Additional mock rank data for page 2 and page 3 to make pagination completely functional
const MOCK_RANKS_PAGE_2 = [
  {
    rank: "#09",
    name: "CHRONOS_REAPER",
    status: "ELITE",
    wins: 185,
    earnings: 29400,
    avatarLetter: "C",
  },
  {
    rank: "#10",
    name: "COSMOS_VORTEX",
    status: "ELITE",
    wins: 172,
    earnings: 28100,
    avatarLetter: "C",
  },
  {
    rank: "#11",
    name: "BIT_RUNNER_8",
    status: "RECRUIT",
    wins: 154,
    earnings: 24700,
    avatarLetter: "B",
  },
  {
    rank: "#12",
    name: "ARES_GUARD",
    status: "RECRUIT",
    wins: 148,
    earnings: 22100,
    avatarLetter: "A",
  },
  {
    rank: "#13",
    name: "SHADOW_LINK",
    status: "RECRUIT",
    wins: 122,
    earnings: 19800,
    avatarLetter: "S",
  },
  {
    rank: "#14",
    name: "ZERO_ONE",
    status: "RECRUIT",
    wins: 110,
    earnings: 18500,
    avatarLetter: "Z",
  },
];

const MOCK_RANKS_PAGE_3 = [
  {
    rank: "#15",
    name: "KALEIDO_CODE",
    status: "RECRUIT",
    wins: 95,
    earnings: 15400,
    avatarLetter: "K",
  },
  {
    rank: "#16",
    name: "ECHO_PULSE",
    status: "RECRUIT",
    wins: 88,
    earnings: 13905,
    avatarLetter: "E",
  },
  {
    rank: "#17",
    name: "SYNAPSE_88",
    status: "RECRUIT",
    wins: 82,
    earnings: 11200,
    avatarLetter: "S",
  },
  {
    rank: "#18",
    name: "ROUTER_PHANTOM",
    status: "RECRUIT",
    wins: 71,
    earnings: 9400,
    avatarLetter: "R",
  },
  {
    rank: "#19",
    name: "GLITCH_DOG",
    status: "RECRUIT",
    wins: 64,
    earnings: 7800,
    avatarLetter: "G",
  },
  {
    rank: "#20",
    name: "NET_WARDEN",
    status: "RECRUIT",
    wins: 41,
    earnings: 4200,
    avatarLetter: "N",
  },
];

export default function Leaderboard({
  operators,
  walletConnected,
  onChallengeClick,
  onViewProfileClick,
}: LeaderboardProps) {
  const [activePage, setActivePage] = useState(1);
  const [seasonFilter, setSeasonFilter] = useState<"ALL_TIME" | "SEASON_04">(
    "SEASON_04",
  );

  // Dynamic countdown timer state mimicking "14:22:01"
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 22,
    seconds: 1,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let h = prev.hours;
        let m = prev.minutes;
        let s = prev.seconds - 1;

        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        if (h < 0) {
          // Reset countdown loop
          h = 23;
          m = 59;
          s = 59;
        }
        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (v: number) => String(v).padStart(2, "0");

  // Format dynamic user states
  const activeUser = operators.find((op) => op.isActiveUser) || {
    name: "NEON_VAGABOND_771",
    earnings: 38150.0,
  };

  // Static Rank lists for the Top 3 Cards
  const top1Card = {
    rank: "RANK 01",
    name: "ARCHITECT_01",
    status: "GRANDMASTER LEGEND",
    earnings: 154200,
    avatarSvg: (
      <svg
        viewBox="0 0 100 100"
        className="w-16 h-16 text-white stroke-1.5 fill-none"
      >
        <polygon
          points="50,15 80,35 80,65 50,85 20,65 20,35"
          stroke="currentColor"
          className="animate-spin-slow"
          style={{ transformOrigin: "50% 50%" }}
        />
        <polygon
          points="50,25 70,40 70,60 50,75 30,60 30,40"
          stroke="currentColor"
        />
        <circle
          cx="50"
          cy="50"
          r="8"
          fill="currentColor"
          className="animate-pulse"
        />
      </svg>
    ),
  };

  const top2Card = {
    rank: "RANK 02",
    name: "XERO_PHASE",
    status: "LEGENDARY",
    earnings: 82440,
    avatarSvg: (
      <svg
        viewBox="0 0 100 100"
        className="w-16 h-16 text-zinc-400 stroke-1.5 fill-none"
      >
        <circle
          cx="50"
          cy="50"
          r="35"
          stroke="currentColor"
          strokeDasharray="5 5"
          className="animate-spin-slow"
          style={{ transformOrigin: "50% 50%" }}
        />
        <circle cx="50" cy="50" r="25" stroke="currentColor" />
        <polygon points="50,38 58,55 42,55" fill="currentColor" />
      </svg>
    ),
  };

  const top3Card = {
    rank: "RANK 03",
    name: "VOID_RUNNER",
    status: "LEGENDARY",
    earnings: 67110,
    avatarSvg: (
      <svg
        viewBox="0 0 100 100"
        className="w-16 h-16 text-zinc-500 stroke-1.5 fill-none"
      >
        <rect
          x="25"
          y="25"
          width="50"
          height="50"
          stroke="currentColor"
          strokeDasharray="10 2"
        />
        <rect x="35" y="35" width="30" height="30" stroke="currentColor" />
        <circle cx="50" cy="50" r="4" fill="currentColor" />
      </svg>
    ),
  };

  // Define table data list based on page selection
  let tableRowsToRender = [];
  if (activePage === 1) {
    // Page 1 is dynamically styled and contains the user at #42 and high flyers
    tableRowsToRender = [
      {
        rank: "#42",
        name: activeUser.name,
        status: "ELITE",
        wins: 142,
        earnings: activeUser.earnings,
        isUser: true,
      },
      {
        rank: "#04",
        name: "CYBER_STRIKE",
        status: "LEGENDARY",
        wins: 312,
        earnings: 55400,
      },
      {
        rank: "#05",
        name: "GHOST_SHELL",
        status: "LEGENDARY",
        wins: 289,
        earnings: 51920,
      },
      {
        rank: "#06",
        name: "SYNTH_WAVE",
        status: "ELITE",
        wins: 245,
        earnings: 44100,
      },
      {
        rank: "#07",
        name: "PROTOCOL_7",
        status: "ELITE",
        wins: 210,
        earnings: 38000,
      },
      {
        rank: "#08",
        name: "RAZOR_EDGE",
        status: "ELITE",
        wins: 198,
        earnings: 32500,
      },
    ];
  } else if (activePage === 2) {
    tableRowsToRender = MOCK_RANKS_PAGE_2;
  } else {
    tableRowsToRender = MOCK_RANKS_PAGE_3;
  }

  return (
    <>
      <section
        id="elite-operators-view"
        className="relative py-12 px-4 sm:px-6 md:px-16 max-w-7xl mx-auto space-y-12"
      >
        <div className="fixed left-0 right-0 bottom-0 top-16 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <h1 className="text-white text-5xl font-bold uppercase tracking-widest">
            Coming Soon
          </h1>
        </div>
        {/* 1. Header Information Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
              <span className="font-mono text-xs text-[#22c55e] tracking-widest font-black uppercase">
                LIVE DATA FEED :: REGION_01
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-wider leading-none">
              ELITE OPERATORS
            </h2>
          </div>

          {/* Technical HUD cards */}
          <div className="flex flex-row gap-4 w-full md:w-auto overflow-x-auto pb-1 scrollbar-none">
            <div className="border border-neutral-850 bg-[#0c0c0c] p-4 text-left min-w-[150px] shrink-0 rounded">
              <span className="font-mono text-[9px] text-[#8e9192] uppercase block tracking-widest font-black">
                GLOBAL PARTICIPANTS
              </span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-white block">
                12,842
              </span>
            </div>

            <div className="border border-neutral-850 bg-[#0c0c0c] p-4 text-left min-w-[150px] shrink-0 rounded">
              <span className="font-mono text-[9px] text-[#8e9192] uppercase block tracking-widest font-black">
                SEASON ENDS IN
              </span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#22c55e] block tracking-wider animate-pulse">
                {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:
                {formatTime(timeLeft.seconds)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. User Hero Profile Panel card */}
        <div
          className="border border-neutral-800 bg-[#070707] p-5 sm:p-6 md:p-8 relative rounded-lg"
          id="user-leaderboard-profile-panel"
        >
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neutral-600"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neutral-600"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neutral-600"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neutral-600"></div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 md:gap-8">
            {/* Left Column: Helmet Avatar Portrait & ID */}
            <div className="flex items-center gap-4 text-left">
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 bg-neutral-900 border border-neutral-850 flex items-center justify-center rounded overflow-hidden select-none">
                {/* Abstract cyber helmet SVG */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-[85%] h-[85%] text-zinc-400"
                >
                  <path
                    d="M50,15 L30,35 L30,65 L50,85 L70,65 L70,35 Z"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                  />
                  <path
                    d="M35,35 L65,35 L65,55 L50,70 L35,55 Z"
                    fill="currentColor"
                    opacity="0.15"
                  />
                  <circle
                    cx="50"
                    cy="45"
                    r="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M38,30 L62,30"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M42,75 L58,75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                {/* "YOU" overlay label */}
                <div className="absolute bottom-0 left-0 right-0 bg-neutral-950 text-[8px] font-mono font-black text-center text-zinc-400 tracking-wider py-0.5 border-t border-neutral-800">
                  YOU
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[8px] text-[#8e9192] uppercase block tracking-widest font-black leading-none">
                  OPERATOR_ID
                </span>
                <h4 className="font-display text-sm sm:text-lg md:text-xl font-bold text-white tracking-widest leading-none">
                  {activeUser.name}
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-1.5 py-0.5 uppercase rounded tracking-wider">
                    TIER: ELITE
                  </span>
                  <span className="font-mono text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-300 px-1.5 py-0.5 uppercase rounded tracking-wider">
                    XP: 84,200
                  </span>
                </div>
              </div>
            </div>

            {/* Center Column: Stats Row */}
            <div className="grid grid-cols-3 gap-3 md:gap-8 flex-1 max-w-xl text-left border-t border-b lg:border-t-0 lg:border-b-0 border-neutral-850 py-4 lg:py-0">
              <div className="space-y-1">
                <span className="font-mono text-[8px] text-[#8e9192] uppercase block tracking-widest">
                  CURRENT RANK
                </span>
                <span className="font-display text-base sm:text-xl md:text-2xl font-black text-white block">
                  #42
                </span>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[8px] text-[#8e9192] uppercase block tracking-widest">
                  WINS / LOSSES
                </span>
                <span className="font-display text-base sm:text-xl md:text-2xl font-black text-white block tracking-wider">
                  142/56
                </span>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[8px] text-[#8e9192] uppercase block tracking-widest">
                  TOTAL EARNINGS
                </span>
                <span className="font-display text-base sm:text-xl md:text-2xl font-black text-[#22c55e] block leading-tight">
                  $
                  {activeUser.earnings.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Profile Link */}
            <div className="shrink-0 flex items-center justify-end">
              <button
                id="view-profile-sec-btn"
                onClick={onViewProfileClick}
                className="px-6 py-3.5 border border-neutral-700 bg-transparent hover:border-white hover:bg-white hover:text-black font-mono text-center text-xs font-black uppercase tracking-widest transition-all rounded w-full lg:w-auto"
              >
                VIEW PROFILE & LEDGER
              </button>
            </div>
          </div>
        </div>

        {/* 3. Top Three Podium cards */}
        <div
          id="podium-cards-grid"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end"
        >
          {/* RANK 02: XERO_PHASE */}
          <div className="border border-neutral-850 bg-[#060606] p-6 lg:p-8 space-y-6 flex flex-col items-center justify-between text-center rounded-lg order-2 md:order-1 transition-all hover:border-neutral-700">
            <div className="space-y-5 w-full flex flex-col items-center">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                RANK 02
              </span>
              <div className="w-18 h-18 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg">
                {top2Card.avatarSvg}
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-base sm:text-lg font-black text-white tracking-widest">
                  {top2Card.name}
                </h4>
                <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">
                  {top2Card.status}
                </span>
              </div>
            </div>
            <div className="font-display text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-wider">
              ${top2Card.earnings.toLocaleString("en-US")}
            </div>
          </div>

          {/* RANK 01: ARCHITECT_01 (Glow focus feature) */}
          <div className="border-2 border-white bg-[#0e0e0e] shadow-[0_0_24px_rgba(255,255,255,0.08)] p-8 lg:p-10 space-y-6 flex flex-col items-center justify-between text-center rounded-lg order-1 md:order-2 relative z-10 scale-[1.02] sm:scale-105 transition-transform">
            {/* Top highlight indicator */}
            <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 bg-white text-black px-4 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest rounded-b select-none">
              CHAMPION
            </div>

            <div className="space-y-5 w-full flex flex-col items-center">
              <span className="font-mono text-[10px] text-white uppercase tracking-widest font-black leading-none pt-2 flex items-center gap-1.5">
                <span>☆</span> {top1Card.rank} <span>☆</span>
              </span>
              <div className="w-20 h-20 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)] glow-active">
                {top1Card.avatarSvg}
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-lg sm:text-xl lg:text-2xl font-black text-white tracking-widest">
                  {top1Card.name}
                </h4>
                <span className="font-mono text-[10px] text-green-400 uppercase tracking-widest block font-black">
                  {top1Card.status}
                </span>
              </div>
            </div>
            <div className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              ${top1Card.earnings.toLocaleString("en-US")}
            </div>
          </div>

          {/* RANK 03: VOID_RUNNER */}
          <div className="border border-neutral-850 bg-[#060606] p-6 lg:p-8 space-y-6 flex flex-col items-center justify-between text-center rounded-lg order-3 transition-all hover:border-neutral-700">
            <div className="space-y-5 w-full flex flex-col items-center">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                RANK 03
              </span>
              <div className="w-18 h-18 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg">
                {top3Card.avatarSvg}
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-base sm:text-lg font-black text-white tracking-widest">
                  {top3Card.name}
                </h4>
                <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">
                  {top3Card.status}
                </span>
              </div>
            </div>
            <div className="font-display text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-wider">
              ${top3Card.earnings.toLocaleString("en-US")}
            </div>
          </div>
        </div>

        {/* 4. Global Ranks Table layout */}
        <div className="space-y-6">
          {/* Table subtitle header & Season filter options pill selection */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-display text-lg sm:text-2xl font-extrabold text-white tracking-wider uppercase text-left">
              GLOBAL RANKS
            </h3>

            <div className="bg-neutral-950 border border-neutral-850 p-1 flex rounded">
              <button
                id="filter-all-time-btn"
                onClick={() => setSeasonFilter("ALL_TIME")}
                className={`font-mono text-[10px] tracking-wider px-3 py-1 uppercase font-bold transition-all ${
                  seasonFilter === "ALL_TIME"
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ALL TIME
              </button>
              <button
                id="filter-season-04-btn"
                onClick={() => setSeasonFilter("SEASON_04")}
                className={`font-mono text-[10px] tracking-wider px-3 py-1 uppercase font-bold transition-all ${
                  seasonFilter === "SEASON_04"
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                SEASON 04
              </button>
            </div>
          </div>

          {/* Global operators list table stream panel */}
          <div className="border border-neutral-850 bg-[#080808] overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-850 bg-black/40">
                    <th className="font-mono text-[10px] font-extrabold leading-none py-6 px-5 text-neutral-400 uppercase tracking-widest">
                      RANK
                    </th>
                    <th className="font-mono text-[10px] font-extrabold leading-none py-6 px-5 text-neutral-400 uppercase tracking-widest">
                      OPERATOR
                    </th>
                    <th className="font-mono text-[10px] font-extrabold leading-none py-6 px-5 text-neutral-400 uppercase tracking-widest">
                      STATUS
                    </th>
                    <th className="font-mono text-[10px] font-extrabold leading-none py-6 px-5 text-neutral-400 uppercase tracking-widest">
                      WINS
                    </th>
                    <th className="font-mono text-[10px] font-extrabold leading-none py-6 px-5 text-neutral-400 uppercase tracking-widest text-right">
                      EARNINGS
                    </th>
                  </tr>
                </thead>

                <tbody className="font-mono text-xs divide-y divide-neutral-900">
                  {tableRowsToRender.map((row) => (
                    <tr
                      key={row.name}
                      className={`transition-all hover:bg-neutral-900/40 relative group ${
                        row.isUser
                          ? "bg-[#141414] border-t border-b border-white hover:bg-[#1a1a1a]"
                          : ""
                      }`}
                    >
                      {/* Rank item */}
                      <td
                        className={`py-5 px-5 font-bold ${row.isUser ? "text-white" : "text-neutral-300"}`}
                      >
                        {row.rank}
                      </td>

                      {/* Operator Item (Name with optional label) */}
                      <td className="py-5 px-5">
                        <div className="flex items-center gap-2.5">
                          {row.isUser && (
                            <span className="font-mono text-[8px] bg-neutral-950 text-neutral-300 border border-neutral-700 px-1.5 py-0.5 rounded select-none uppercase font-black tracking-widest shrink-0">
                              YOU
                            </span>
                          )}
                          <span className="font-display text-xs sm:text-sm font-bold text-white tracking-widest">
                            {row.name}
                          </span>
                        </div>
                      </td>

                      {/* Status badges */}
                      <td className="py-5 px-5">
                        {row.status === "LEGENDARY" ? (
                          <span className="text-[9px] px-2 py-0.5 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] font-black tracking-widest uppercase rounded">
                            LEGENDARY
                          </span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 bg-neutral-900 border border-zinc-700 text-[#c3c7cd] font-bold tracking-widest uppercase rounded">
                            ELITE
                          </span>
                        )}
                      </td>

                      {/* Wins value */}
                      <td className="py-5 px-5 text-neutral-300 tracking-wider font-bold">
                        {row.wins}
                      </td>

                      {/* Earnings value */}
                      <td className="py-5 px-5 text-right font-bold text-[#22c55e] tracking-wider text-xs sm:text-sm">
                        $
                        {row.earnings.toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Pagination Controls */}
          <div className="flex justify-center items-center gap-3 pt-4">
            <button
              id="prev-page-btn"
              disabled={activePage === 1}
              onClick={() => setActivePage((prev) => Math.max(1, prev - 1))}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase font-bold text-left py-2 px-3 hover:bg-neutral-900 border border-neutral-800 rounded disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREVIOUS_DATA</span>
            </button>

            <div className="flex gap-1.5 font-mono text-[10px] font-bold">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  id={`page-btn-${page}`}
                  onClick={() => setActivePage(page)}
                  className={`py-2 px-3 border transition-colors rounded ${
                    activePage === page
                      ? "bg-white text-black border-white"
                      : "border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {String(page).padStart(2, "0")}
                </button>
              ))}
            </div>

            <button
              id="next-page-btn"
              disabled={activePage === 3}
              onClick={() => setActivePage((prev) => Math.min(3, prev + 1))}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase font-bold text-left py-2 px-3 hover:bg-neutral-900 border border-neutral-800 rounded disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <span>NEXT_DATA</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
