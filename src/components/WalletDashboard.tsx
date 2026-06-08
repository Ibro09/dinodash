import React, { useState } from "react";
import {
  Coins,
  LogOut,
  Key,
  ArrowUpRight,
  Send,
  CheckCircle,
  RefreshCw,
  Cpu,
  ShieldCheck,
} from "lucide-react";
import {
  Connection,
  Transaction as SolanaTransaction,
  SystemProgram,
  PublicKey,
} from "@solana/web3.js";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "seed";
  amountUsd: number;
  timestamp: string;
  txHash: string;
  status: "PENDING" | "CONFIRMED";
  memo: string;
}

interface WalletDashboardProps {
  walletConnected: boolean;
  onConnectClick: () => void;
  operatorName: string;
  setOperatorName: (name: string) => void;
  earnings: number;
  subtractEarnings: (amountUsd: number) => boolean;
  walletAddress: string;
}

const DEFAULT_TXS: Transaction[] = [
  {
    id: "tx-1",
    type: "seed",
    amountUsd: 38150.0,
    timestamp: "2026-06-07 10:12:44",
    txHash: "4R1v9X6H9Zp8BswfD18ZxpS7yD1C69REPfC66fQwRpx2qHw9",
    status: "CONFIRMED",
    memo: "SOLANA BLOCK PROTOCOL SEEDING",
  },
];

// Solana Devnet connection and withdrawal setup
const connection = new Connection("https://api.devnet.solana.com");
const TREASURY_WALLET = "CJppdfe8AghHT7fDjrHQANN7zNT4YgXXrH7rFQet3te5"; // TODO: Replace with actual treasury wallet

export default function WalletDashboard({
  walletConnected,
  onConnectClick,
  operatorName,
  setOperatorName,
  earnings,
  subtractEarnings,
  walletAddress,
}: WalletDashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TXS);
  const [recipientAddress, setRecipientAddress] = useState(walletAddress || "");
  const [withdrawAmountSol, setWithdrawAmountSol] = useState("1.50");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(operatorName);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const solBalance = earnings;
  const parsedAmount = parseFloat(withdrawAmountSol || "0");
  const isInvalid =
    !parsedAmount ||
    parsedAmount <= 0 ||
    parsedAmount > earnings ||
    isNaN(parsedAmount);

  const handleNameSave = () => {
    if (tempName.trim()) {
      const sanitized = tempName.toUpperCase().replace(/\s+/g, "_");
      setOperatorName(sanitized);
      setIsEditingName(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      if (!walletConnected) return onConnectClick();

      const amount = Number(withdrawAmountSol);

      // 🚫 validate
      if (!amount || amount <= 0 || amount > earnings) {
        alert("Invalid withdrawal amount");
        return;
      }

      if (!walletAddress) {
        alert("Wallet address not available");
        return;
      }

      setIsWithdrawing(true);
      setFeedback(null);

      // API CALL - use connected wallet address
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: walletAddress, // ✅ Use connected wallet
          amountUsd: amount,
        }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        const msg = data?.error || "Withdrawal failed";
        throw new Error(msg);
      }

      if (!data?.success || !data?.txHash) {
        throw new Error("Invalid transaction response");
      }

      const signature = data.txHash;

      console.log("[WITHDRAW] Success:", signature);

      setFeedback(`✅ Withdrawal successful: ${signature.slice(0, 16)}...`);
      alert("Withdrawal successful!");

      // update UI balance
      const success = subtractEarnings(amount);

      if (success) {
        setTransactions((prev) => [
          {
            id: `tx-${Date.now()}`,
            type: "withdrawal",
            amountUsd: amount,
            timestamp: new Date().toISOString(),
            txHash: signature,
            status: "CONFIRMED",
            memo: `WITHDRAWAL: ${amount.toFixed(2)} USD`,
          },
          ...prev,
        ]);

        setWithdrawAmountSol("");
      }
    } catch (err: any) {
      console.error("[WITHDRAW]", err);
      setFeedback(`❌ ${err.message}`);
      alert(err.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <section
      id="wallet-dashboard-section"
      className="py-20 px-6 md:px-16 max-w-7xl mx-auto"
    >
      {/* Page Title */}
      <div className="mb-10 text-center md:text-left">
        <span className="font-mono text-xs text-neutral-400 tracking-widest uppercase block mb-1">
          SECTION // 02
        </span>
        <h2 className="font-display text-2xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
          OPERATOR WALLET LEDGER
        </h2>
      </div>

      {!walletConnected ? (
        /* Disconnected State fallback */
        <div
          className="border border-gray-800 bg-[#0e0e0e]/80 p-8 md:p-12 text-center relative"
          id="wallet-lockout-panel"
        >
          <div className="max-w-md mx-auto space-y-6">
            <Coins className="w-12 h-12 text-neutral-500 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-white uppercase">
                UNAUTHORIZED WALLET BOUNDS
              </h3>
            </div>
            <p className="font-sans text-xs text-gray-400">
              Connect your wallet to access real-time consensus asset balances,
              and the outward withdrawal portal. Only wallets with active
              operator nodes will display secured protocol earnings.
            </p>
            <button
              id="wallet-connect-inline-btn"
              onClick={onConnectClick}
              className="px-8 py-3.5 bg-white text-black font-mono text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-all text-center"
            >
              CONNECT WALLET
            </button>
          </div>
        </div>
      ) : (
        /* Dynamic Wallet view */
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          id="wallet-app-grid"
        >
          {/* Left Column: Stats & Edit Profile */}
          <div className="lg:col-span-4 space-y-6">
            {/* Operator Node Profile block */}
            <div className="border border-gray-850 bg-[#0e0e0e] p-6 space-y-4">
              <span className="font-mono text-[9px] text-[#8e9192] uppercase block tracking-widest">
                Operator Identity Parameters
              </span>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white text-black flex items-center justify-center font-mono font-bold text-lg select-none">
                    {operatorName.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-sm font-bold text-white tracking-widest">
                          {operatorName}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="font-mono text-[10px] bg-black/60 p-3 border border-gray-900 text-gray-400 space-y-1 rounded">
                  <div className="flex justify-between">
                    <span>LEDGER ROUTE:</span>
                    <span className="text-white text-right">
                      {walletAddress
                        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Balances summary Block */}
            <div className="border border-gray-850 bg-[#0e0e0e] p-6 space-y-4">
              <span className="font-mono text-[9px] text-[#8e9192] uppercase block tracking-widest font-bold">
                Consensus Asset Ledger
              </span>

              <div className="space-y-1">
                <div className="font-mono text-[10px] text-gray-400 uppercase">
                  Total Settled Value
                </div>
                <div
                  className="font-display font-extrabold text-white text-3xl sm:text-4xl tracking-tighter"
                  id="wallet-balance-usd"
                >
                  $
                  {earnings.toLocaleString("en-US", {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 6,
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Center Column: Direct Withdrawal Portal */}
          <div className="lg:col-span-6 border border-gray-850 bg-[#0e0e0e] p-6 flex flex-col justify-between">
            <div className="space-y-4 font-sans">
              <div>
                <span className="font-mono text-[9px] text-[#8e9192] uppercase tracking-widest block font-bold mb-1">
                  Outward Withdrawal Portal
                </span>
                <span className="font-sans text-xs text-gray-500">
                  Process real-time node yield settlements directly into
                  external Solana address chains.
                </span>
              </div>

              {isWithdrawing ? (
                <div
                  className="py-20 text-center space-y-4"
                  id="withdrawal-processing-view"
                >
                  <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin mx-auto"></div>
                  <p className="font-mono text-xs text-white uppercase tracking-wider animate-pulse">
                    Processing withdrawal...
                  </p>
                </div>
              ) : (
                <div className="space-y-4" id="withdrawal-form">
                  {feedback && (
                    <div
                      className={`font-mono text-xs p-3 border rounded ${
                        feedback.includes("✅")
                          ? "bg-green-900/20 border-green-700 text-green-300"
                          : "bg-red-900/20 border-red-700 text-red-300"
                      }`}
                    >
                      {feedback}
                    </div>
                  )}
                  {/* Recipient Input */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                      RECIPIENT SOLANA ADDRESS (YOUR WALLET)
                    </label>
                    <input
                      id="withdraw-recipient-input"
                      type="text"
                      required
                      disabled
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="w-full bg-black border border-gray-700 text-white font-mono text-[11px] px-3 py-2.5 focus:border-white focus:outline-none opacity-60 cursor-not-allowed"
                    />
                  </div>

                  {/* Quantity Config */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <label className="text-gray-400 uppercase tracking-widest">
                        QUANTITY
                      </label>
                      <button
                        type="button"
                        id="withdraw-max-preset-btn"
                        onClick={() =>
                          setWithdrawAmountSol(solBalance.toFixed(2))
                        }
                        className="text-white hover:underline uppercase cursor-pointer"
                      >
                        SET MAX ($
                        {solBalance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                        )
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="withdraw-amount-input"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={solBalance}
                        required
                        value={withdrawAmountSol}
                        onChange={(e) => setWithdrawAmountSol(e.target.value)}
                        className="w-full bg-black border border-gray-700 text-white font-mono text-xs px-3 py-2.5 focus:border-white focus:outline-none pr-12"
                      />
                      <span className="absolute top-1/2 -translate-y-1/2 right-3 font-mono text-xs text-gray-400 select-none">
                        $
                      </span>
                    </div>
                  </div>

                  {/* Trigger */}
                  <button
                    disabled={isInvalid || isWithdrawing}
                    onClick={handleWithdraw}
                    id="submit-withdrawal-btn"
                    className={`w-full py-4 text-center font-mono text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors ${
                      isInvalid
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-white text-black hover:bg-neutral-200 cursor-pointer"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isWithdrawing
                        ? "Processing..."
                        : "PROCESS WITHDRAWAL STREAM"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-900 flex items-center gap-2 text-[10px] font-mono text-gray-400">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>TRANSACTIONS SETTLED VIA APEX SECURE PROTOCOL</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
