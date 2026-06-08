import React, { useState, useEffect } from "react";
import { X, Shield, Cpu, Key, Check, Wifi, Terminal, AlertTriangle } from "lucide-react";
import { Keypair } from "@solana/web3.js";

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (name: string, address: string, unlockedNodes: string[], earnings: number) => void;
}

export default function ConnectModal({ isOpen, onClose, onConnect }: ConnectModalProps) {
  // Navigation states: 'select_wallet' | 'lookup' | 'register' | 'welcome'
  const [step, setStep] = useState<'select_wallet' | 'lookup' | 'register' | 'welcome'>('select_wallet');
  
  const [operatorAddress, setOperatorAddress] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("PHANTOM");
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [foundProfile, setFoundProfile] = useState<any>(null);

  // Auto-generate target Solana address using Keypair
  const generateRandomAddress = () => {
    try {
      const kp = Keypair.generate();
      setOperatorAddress(kp.publicKey.toBase58());
      setErrorMsg(null);
    } catch (err) {
      const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      const addr = Array.from({length: 44}, () => base58Chars[Math.floor(Math.random() * base58Chars.length)]).join("");
      setOperatorAddress(addr);
      setErrorMsg(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep('select_wallet');
      setOperatorAddress("");
      setOperatorName("");
      setErrorMsg(null);
      setFoundProfile(null);
      setBootSequence([
        "Protocol terminal initialized.",
        "Establishing handshakes..."
      ]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handles checking whether real Solana extensions are available, or falls back, then queries database
  const handleProceedToLookup = async () => {
    let targetAddress = operatorAddress.trim();

    // Phantom/Solflare connection flow
    if (selectedProvider === "PHANTOM" || selectedProvider === "SOLFLARE") {
      setBootSequence(prev => [...prev, `[SOL] Probing window.${selectedProvider.toLowerCase()} extensions...`]);
      
      const provider = selectedProvider === "PHANTOM" ? (window as any).solana : (window as any).solflare;

      if (provider) {
        try {
          setBootSequence(prev => [...prev, "[SOL] Requesting signature/connection handshake..."]);
          const resp = await provider.connect();
          const pubKey = resp.publicKey ? resp.publicKey.toString() : provider.publicKey?.toString();
          if (pubKey) {
            targetAddress = pubKey;
            setOperatorAddress(pubKey);
            setBootSequence(prev => [...prev, `[SOL] Connected successfully via window.${selectedProvider.toLowerCase()}. Key: ${pubKey}`]);
          } else {
            throw new Error("No public key found from provider response.");
          }
        } catch (err: any) {
          console.error(`${selectedProvider} connect error: `, err);
          setErrorMsg(`${selectedProvider} connection rejected by user.`);
          return;
        }
      } else {
        // Fallback for iframe sandbox simulation
        setBootSequence(prev => [
          ...prev, 
          `[WARN] window.${selectedProvider.toLowerCase()} not detected in sandbox iframe.`, 
          "[INFO] Activating secure Solana Devnet Sandbox Tunnel..."
        ]);
        if (!targetAddress) {
          // Generate simulated stable Solana keys
          const simulatedKeys = [
            "9rXWyS4bN8F4bW9X1E9Y5PruXfE1T6Zg3Y49m5oG6jH62",
            "DyV8EunK1rshgRqy9xM7A1eREx8fC5xP7K1Qf6Rpy9hZ",
            "7aNbeRvA9BswD18ZxpS7yD1C69REPfC66fQwRpx2qHw9"
          ];
          const index = selectedProvider === "PHANTOM" ? 1 : 2;
          targetAddress = simulatedKeys[index];
          setOperatorAddress(targetAddress);
        }
      }
    } else {
      // APEX VAULT Custom Manual Address
      if (!targetAddress || targetAddress.length < 32 || targetAddress.length > 44) {
        setErrorMsg("Please enter a valid Solana Base58 public key (32 to 44 characters in length).");
        return;
      }
    }

    setStep('lookup');
    setBootSequence(prev => [
      ...prev,
      `[DATABASE] Querying secure ledger for Solana node address: ${targetAddress}...`
    ]);

    // Query database proxy `/api/operator/:address`
    try {
      const res = await fetch(`/api/operator/${targetAddress}`);
      if (res.ok) {
        const data = await res.json();
        // Address has been saved before!
        setFoundProfile(data);
        setBootSequence(prev => [
          ...prev,
          `[FOUND] Address registered in database!`,
          `[LOG] Callsign match: ${data.name}`,
          `[LOG] Core earnings logged: $${parseFloat(data.earnings).toFixed(2)}`,
          `[SECURITY] Solana authority token created.`
        ]);
        setStep('welcome');
        setTimeout(() => {
          onConnect(data.name, data.address, data.unlockedNodes || [], parseFloat(data.earnings) || 0);
          onClose();
        }, 1800);
      } else {
        // Address has NOT been saved before!
        setBootSequence(prev => [
          ...prev,
          `[DATABASE] Address not found in secure ledger.`,
          `[SECURE] Prompting for first-time operator profiling entry...`
        ]);
        // Set standard random hacker pseudonym to aid them
        const pseudoNames = ["NEO_REPLICANT", "ZERO_SENTRY", "HYPER_GHOST", "CYPHER_COBALT", "SPECTRE_BETA", "KRONOS_AGENT", "VOID_STALKER"];
        setOperatorName(pseudoNames[Math.floor(Math.random() * pseudoNames.length)]);
        setStep('register');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Mainframe connection error. Please try again.");
      setStep('select_wallet');
    }
  };

  // Saves name and address in the Database
  const handleRegisterAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = operatorName.trim().toUpperCase().replace(/\s+/g, "_");
    if (!cleanName) {
      setErrorMsg("Operator callsign cannot be empty.");
      return;
    }

    setBootSequence(prev => [
      ...prev,
      `[REGISTRY] Registering operator callsign "${cleanName}" with Solana address ${operatorAddress}...`
    ]);

    try {
      const res = await fetch("/api/operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: operatorAddress, name: cleanName })
      });

      if (res.ok) {
        const data = await res.json();
        setBootSequence(prev => [...prev, `[REGISTRY] Saved in database. Node activated!`]);
        setFoundProfile(data);
        setStep('welcome');

        setTimeout(() => {
          onConnect(data.name, data.address, data.unlockedNodes || [], parseFloat(data.earnings) || 0);
          onClose();
        }, 1500);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to persist database identity.");
        setStep('register');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error trying to register in the database.");
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      id="connect-wallet-dialog"
    >
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/20 p-6 md:p-8 overflow-hidden rounded-sm shadow-2xl">
        {/* Glow behind */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-white/5 blur-3xl pointer-events-none rounded-full" />
        
        {/* Header line */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-6">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="font-mono text-xs tracking-widest uppercase text-zinc-300 font-bold">SECURE LOGICAL PROTOCOL</span>
          </div>
          <button 
            id="close-connect-modal"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono mb-4 flex items-start gap-2 rounded-sm">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Select Crypto Wallet & Input Address */}
        {step === 'select_wallet' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400 uppercase tracking-widest">SELECT DEVNET INTERFACE</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="provider-phantom"
                  onClick={() => {
                    setSelectedProvider("PHANTOM");
                    setErrorMsg(null);
                  }}
                  className={`p-2.5 border text-left font-mono text-[11px] transition-all flex flex-col justify-between items-start rounded-sm cursor-pointer ${
                    selectedProvider === "PHANTOM"
                      ? "border-emerald-500 bg-emerald-950/20 text-white"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 bg-zinc-950/50"
                  }`}
                >
                  <span className="font-bold">PHANTOM</span>
                  <span className="text-[8px] text-zinc-500 uppercase mt-0.5">Solana Ext</span>
                </button>

                <button
                  type="button"
                  id="provider-solflare"
                  onClick={() => {
                    setSelectedProvider("SOLFLARE");
                    setErrorMsg(null);
                  }}
                  className={`p-2.5 border text-left font-mono text-[11px] transition-all flex flex-col justify-between items-start rounded-sm cursor-pointer ${
                    selectedProvider === "SOLFLARE"
                      ? "border-emerald-500 bg-emerald-950/20 text-white"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 bg-zinc-950/50"
                  }`}
                >
                  <span className="font-bold">SOLFLARE</span>
                  <span className="text-[8px] text-zinc-500 uppercase mt-0.5">Solana Ext</span>
                </button>

                <button
                  type="button"
                  id="provider-apex-secure"
                  onClick={() => {
                    setSelectedProvider("APEX_SECURE");
                    setErrorMsg(null);
                  }}
                  className={`p-2.5 border text-left font-mono text-[11px] transition-all flex flex-col justify-between items-start rounded-sm cursor-pointer ${
                    selectedProvider === "APEX_SECURE"
                      ? "border-emerald-500 bg-emerald-950/20 text-white"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 bg-zinc-950/50"
                  }`}
                >
                  <span className="font-bold">APEX SOL DEV</span>
                  <span className="text-[8px] text-zinc-500 uppercase mt-0.5">Simulated</span>
                </button>
              </div>
            </div>

            {/* Address fields if APEX Secure Vault or custom override */}
            {selectedProvider === "APEX_SECURE" ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-mono text-xs text-zinc-400 uppercase tracking-widest">DEVNET SOL KEY ADDRESS</label>
                  <button
                    type="button"
                    onClick={generateRandomAddress}
                    className="font-mono text-[9px] text-emerald-400 underline hover:no-underline cursor-pointer"
                  >
                    GENERATE RAND SOL KEY
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={44}
                  value={operatorAddress}
                  onChange={(e) => {
                    setOperatorAddress(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="9rXWyS4bN8F4bW9X1E9Y5PruXfE1T6Zg3Y49m5oG6j..."
                  className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-300 font-mono text-xs px-3 py-2.5 focus:border-zinc-600 focus:outline-none rounded-sm transition-all"
                />
              </div>
            ) : (
              <div className="space-y-1 bg-zinc-950/80 p-3 border border-zinc-900 rounded-sm">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">SOLANA HANDSHAKE STRATEGY</span>
                <p className="font-mono text-[11px] text-zinc-400 leading-relaxed pt-1">
                  Connecting triggers a secure local account fetch. If no Web3 provider is detected in this sandbox iframe, a dynamic Devnet tunnel key will automatically authorize.
                </p>
              </div>
            )}

            {/* Bottom notification */}
            <div className="p-3 bg-zinc-950 border border-zinc-900 flex gap-3 text-xs leading-relaxed text-zinc-400 rounded-sm">
              <Key className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <p className="font-sans">
                Authority locks register instantly. Profiles, subscription permissions, and high scores persist securely in our cloud-backed database.
              </p>
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleProceedToLookup}
              className="w-full py-4 text-center bg-white text-black font-mono text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-sm shadow-md cursor-pointer"
            >
              ASSERT STAKE & SECURE ROAD
            </button>
          </div>
        )}

        {/* STEP 2: Database lookup query loader */}
        {step === 'lookup' && (
          <div className="space-y-6 py-6 font-mono text-xs">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              <span className="text-white font-bold uppercase tracking-widest text">INTERROGATING SECURITY DATABASE...</span>
            </div>
            
            <div className="bg-[#0c0c0c] p-4 border border-zinc-900 max-h-52 overflow-y-auto space-y-1.5 text-zinc-400 rounded-sm">
              {bootSequence.map((log, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-emerald-500 font-bold">&gt;&gt;</span>
                  <span className="font-mono text-[11px] select-none text-zinc-300">{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Address not found -> Ask for Callsign Name */}
        {step === 'register' && (
          <form onSubmit={handleRegisterAndConnect} className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-500 uppercase tracking-widest block font-bold">DEVNET ACCOUNT INITIALIZED</label>
              <div className="bg-zinc-950 p-3 border border-zinc-900 rounded-sm select-none">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">SECURE NODE ID</span>
                <span className="font-mono text-xs text-emerald-400 uppercase select-all font-bold block truncate">{operatorAddress}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-xs text-zinc-400 uppercase tracking-widest font-bold">CHOOSE NICKNAME / CALLSIGN</label>
                <button
                  type="button"
                  onClick={() => {
                    const names = ["NEO_REPLICANT", "ZERO_SENTRY", "HYPER_GHOST", "CYPHER_COBALT", "SPECTRE_BETA", "KRONOS_AGENT", "VOID_STALKER"];
                    setOperatorName(names[Math.floor(Math.random() * names.length)]);
                  }}
                  className="font-mono text-[10px] text-emerald-400 underline hover:no-underline"
                >
                  RANDOMIZE
                </button>
              </div>
              <input
                type="text"
                required
                maxLength={24}
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                placeholder="PROX_HACKER_77"
                className="w-full bg-zinc-950 border border-zinc-800 text-white font-mono text-xs uppercase px-4 py-3 focus:border-zinc-500 focus:outline-none transition-all rounded-sm tracking-widest"
              />
            </div>

            <p className="font-mono text-[11px] text-zinc-500 leading-relaxed select-none">
              This pseudonymous handler represents your identity on the global apex leadership board. You will be persistent in the ledger matching your cryptographic address.
            </p>

            <button
              type="submit"
              className="w-full py-4 text-center bg-white text-black font-mono text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all rounded-sm"
            >
              REGISTER OPERATOR PROFILE
            </button>
          </form>
        )}

        {/* STEP 4: Welcome established message */}
        {step === 'welcome' && foundProfile && (
          <div className="space-y-6 text-center py-6 font-mono">
            <div className="w-12 h-12 bg-emerald-950/35 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Wifi className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-white text-lg font-black uppercase tracking-widest">CONNECTION INJECTED</h3>
              <p className="text-[11px] text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Vault validated. Synced with database. Welcome back, active operator.
              </p>
            </div>

            <div className="bg-zinc-950/80 p-4 border border-zinc-900 inline-block text-left mx-auto rounded-sm space-y-1.5 min-w-[280px]">
              <div className="flex justify-between gap-10">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">CALLSIGN:</span>
                <span className="text-xs text-white font-bold">{foundProfile.name}</span>
              </div>
              <div className="flex justify-between gap-10 border-t border-zinc-900 pt-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">SCORE REGISTERED:</span>
                <span className="text-xs text-emerald-400 font-bold">{foundProfile.highScore || 0} pts</span>
              </div>
              <div className="flex justify-between gap-10 border-t border-zinc-900 pt-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">EXTRACTED BAL:</span>
                <span className="text-xs text-white font-bold">${parseFloat(foundProfile.earnings || 0).toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
