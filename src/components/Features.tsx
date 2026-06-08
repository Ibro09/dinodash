import { Bolt, Wallet, ArrowRight, ShieldCheck, Activity } from "lucide-react";

interface FeaturesProps {
  earnings: number;
  walletConnected: boolean;
  onEnterArena: () => void;
  onWithdrawClick: () => void;
}

export default function Features({ earnings, walletConnected, onEnterArena, onWithdrawClick }: FeaturesProps) {
  return (
    <section id="bento-features-section" className="py-20 px-6 md:px-16 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Large Feature Card: PLAY-TO-EARN */}
        <div 
          id="feature-card-play-earn"
          onClick={onEnterArena}
          className="md:col-span-2 border border-gray-800 bg-[#0e0e0e]/90 p-8 md:p-10 flex flex-col justify-between group hover:border-white transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
          {/* Cybernetic geometric background highlight */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 translate-x-12 -translate-y-12 rotate-45 group-hover:scale-125 transition-transform duration-500" />
          
          <div>
            <div className="w-12 h-12 border border-gray-700 group-hover:border-white flex items-center justify-center mb-6 transition-colors">
              <Bolt className="w-6 h-6 text-white group-hover:animate-pulse" />
            </div>
            
            <h3 className="font-display text-xl md:text-2xl font-bold uppercase tracking-tight text-white mb-4">
              PLAY-TO-EARN MECHANICS
            </h3>
            
            <p className="font-sans text-sm md:text-base text-gray-400 leading-relaxed max-w-xl group-hover:text-white/90 transition-colors">
              Engage in high-stakes tactical combat where every move translates to protocol value. Outperform competitors in the dark arena to claim your share of the daily rewards pool. Experience real-time game loops with secure outcomes.
            </p>
          </div>
          
          <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gray-500" />
              <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                SECURED BY APEX_CORE
              </span>
            </div>
            <div className="flex items-center gap-1 text-white font-mono text-xs font-bold">
              <span className="opacity-0 group-hover:opacity-100 group-hover:mr-1 transition-all">LAUNCH SYSTEMS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>

        {/* Small Feature Card: INSTANT WITHDRAWALS */}
        <div 
          id="feature-card-withdrawals"
          onClick={onWithdrawClick}
          className="border border-gray-800 bg-[#0e0e0e]/90 p-8 md:p-10 flex flex-col justify-between group hover:border-white transition-all duration-300 cursor-pointer relative"
        >
          <div>
            <div className="w-12 h-12 border border-gray-700 group-hover:border-white flex items-center justify-center mb-6 transition-colors">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white mb-4">
              INSTANT WITHDRAWALS
            </h3>
            
            <p className="font-sans text-sm text-gray-400 leading-relaxed">
              No waiting periods. Your battle earnings are settled automatically. Initiate a direct, real-time withdrawal request straight to your connected secure wallet ledger.
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-900 space-y-4">
            {/* Real Stats */}
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-gray-500">YOUR SETTLED SOL:</span>
              <span className="font-mono text-white font-bold">{(earnings / 140).toFixed(4)} SOL</span>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                <span className="font-mono text-[10px] text-white tracking-widest uppercase">
                  NETWORK: ONLINE
                </span>
              </div>
              <span className="font-mono text-[10px] text-gray-400 group-hover:text-white transition-colors underline uppercase">
                WITHDRAWAL PORTAL
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
