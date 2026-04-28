import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  FileText, 
  Search, 
  ChevronRight,
  Hash,
  Clock,
  Fingerprint
} from 'lucide-react';
import { useTrade } from '../context/TradeContext';
import { verifySignature } from '../lib/integrity';
import { motion, AnimatePresence } from 'motion/react';

const Ledger: React.FC = () => {
  const { portfolio, identity } = useTrade();
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<{valid: boolean, message: string} | null>(null);

  const handleVerify = async (trade: any) => {
    if (!identity) return;
    
    // Simulations verification logic
    // In a real app we'd verify the signature string against the payload
    const isValid = await verifySignature(trade.proof, {
        ts: trade.timestamp,
        side: trade.side,
        qty: trade.qty,
        symbol: trade.symbol,
        price: trade.price,
        lattice_res: 671.6 // Static factor from sig generation
    }, identity.publicKey);

    setVerificationResult({
        valid: isValid,
        message: isValid 
            ? "Signatory confirmed. Transaction integrity verified via Ed25519." 
            : "Integrity breach! Signature mismatch detected."
    });
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-hidden bg-black/10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-text uppercase">
            Global <span className="text-accent underline decoration-accent/30 underline-offset-8">Ledger</span>
          </h2>
          <p className="text-xs text-muted font-mono mt-2 tracking-widest uppercase opacity-60">
            Immutable Audit Trail • Sovereign Proof-Bound Store
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-panel/50 border border-border/30 rounded-full px-5 py-2">
          <Database size={16} className="text-accent" />
          <div className="text-[11px] font-bold uppercase tracking-wider">
            Total Blocks: <span className="text-text font-mono">{(portfolio?.tradeHistory.length || 0).toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Ledger List */}
        <div className="col-span-7 flex flex-col gap-4 min-h-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH BY HASH OR SYMBOL..."
              className="w-full bg-panel/30 border border-border/50 rounded-xl px-12 py-4 text-xs font-mono focus:outline-none focus:border-accent transition-all"
            />
          </div>

          <div className="flex-1 bg-panel/20 border border-border/30 rounded-2xl overflow-hidden flex flex-col">
            <div className="grid grid-cols-4 px-6 py-3 border-b border-border/50 bg-black/20 text-[10px] font-black text-muted uppercase tracking-widest">
              <span>Block ID</span>
              <span>Sequence</span>
              <span>Execution</span>
              <span className="text-right">Checksum</span>
            </div>
            
            <div className="flex-1 overflow-auto">
              {portfolio?.tradeHistory.slice().reverse().map((trade) => (
                <button 
                  key={trade.id}
                  onClick={() => {
                    setSelectedTrade(trade);
                    setVerificationResult(null);
                  }}
                  className={`w-full grid grid-cols-4 px-6 py-5 border-b border-border/10 hover:bg-white/5 transition-colors text-left group ${selectedTrade?.id === trade.id ? 'bg-accent/5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${trade.side === 'BUY' ? 'bg-green' : 'bg-accent'}`} />
                    <span className="text-[11px] font-mono font-bold uppercase">{trade.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold">{trade.symbol}</span>
                    <span className="text-[9px] text-muted opacity-50">{trade.side}</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted">
                    {trade.qty} @ {(Number(trade.price || 0) / 100).toFixed(2)}
                  </div>
                  <div className="text-right flex items-center justify-end gap-2">
                    <span className="text-[9px] font-mono text-cyan/70 opacity-40 group-hover:opacity-100 transition-opacity">
                      {trade.proof.slice(0, 10)}...
                    </span>
                    <ChevronRight size={14} className="text-muted group-hover:text-accent transition-colors" />
                  </div>
                </button>
              ))}
              {(!portfolio || portfolio.tradeHistory.length === 0) && (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <Database size={64} className="mb-4" />
                  <span className="text-xs font-bold uppercase tracking-[10px]">No Data</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Detail */}
        <div className="col-span-5">
          <AnimatePresence mode="wait">
            {selectedTrade ? (
              <motion.div 
                key={selectedTrade.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-panel border border-border/50 rounded-2xl p-8 flex flex-col h-full shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <ShieldCheck size={120} />
                </div>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tighter uppercase">Transaction Receipt</h3>
                    <div className="text-[10px] font-mono font-bold text-muted flex items-center gap-2">
                      <Hash size={10} />
                      {selectedTrade.orderId}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 flex-1 min-h-0 overflow-auto pr-4">
                  <DetailItem label="Asset" value={`${selectedTrade.symbol} • ${selectedTrade.side}`} icon={<Fingerprint size={12}/>} />
                  <DetailItem label="Quantity" value={`${selectedTrade.qty} UNITS`} icon={<Database size={12}/>} />
                  <DetailItem label="Fill Price" value={`$${(Number(selectedTrade.price || 0) / 100).toFixed(2)}`} />
                  <DetailItem label="Total Basis" value={`$${((Number(selectedTrade.price || 0) * selectedTrade.qty) / 100).toLocaleString()}`} />
                  <DetailItem label="Timestamp" value={new Date(selectedTrade.timestamp).toLocaleString()} icon={<Clock size={12}/>} />
                  
                  <div className="mt-8 pt-6 border-t border-border/30">
                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">Cryptographic Proof</div>
                    <div className="p-4 bg-black/40 rounded-xl border border-border/10 font-mono text-[10px] break-all leading-relaxed text-cyan/80">
                      {selectedTrade.proof}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  {verificationResult ? (
                    <motion.div 
                       initial={{ y: 20, opacity: 0 }}
                       animate={{ y: 0, opacity: 1 }}
                       className={`p-4 rounded-xl border flex items-center gap-4 ${verificationResult.valid ? 'bg-green/10 border-green/30 text-green' : 'bg-accent/10 border-accent/30 text-accent'}`}
                    >
                      <ShieldCheck size={20} className="shrink-0" />
                      <div className="text-[11px] font-bold leading-snug">
                        {verificationResult.message}
                      </div>
                    </motion.div>
                  ) : (
                    <button 
                      onClick={() => handleVerify(selectedTrade)}
                      className="w-full py-4 bg-accent text-black rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-[0.98]"
                    >
                      Verify Transaction Proof
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full bg-panel/10 border border-border/10 border-dashed rounded-2xl flex flex-col items-center justify-center text-muted gap-4">
                 <Search size={40} className="opacity-20" />
                 <span className="text-[10px] font-bold uppercase tracking-[4px] opacity-40">Select event to inspect</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const DetailItem: React.FC<{ label: string, value: string, icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex justify-between items-end border-b border-border/10 pb-3 group">
    <div>
      <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-mono font-bold group-hover:text-accent transition-colors">{value}</div>
    </div>
  </div>
);

export default Ledger;
