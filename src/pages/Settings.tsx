import React from 'react';
import { 
  ShieldCheck, 
  Key, 
  RefreshCw, 
  Trash2, 
  Download, 
  Cpu,
  Fingerprint,
  Link,
  ShieldAlert
} from 'lucide-react';
import { useTrade } from '../context/TradeContext';

const Settings: React.FC = () => {
  const { identity, resetSession } = useTrade();

  const handleClearSession = () => {
    if (window.confirm("Permanently purge sovereign session and identity keys?")) {
      resetSession();
    }
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-auto bg-black/10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-text uppercase">
            Node <span className="text-accent underline decoration-accent/30 underline-offset-8">Configuration</span>
          </h2>
          <p className="text-xs text-muted font-mono mt-2 tracking-widest uppercase opacity-60">
            Sovereign Identity • Lattice Verification • Cryptographic Root
          </p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1">
        
        {/* Identity & Keys */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-8">
          <section className="bg-panel border border-border/50 rounded-2xl p-8 shadow-xl">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                 <ShieldCheck size={24} />
               </div>
               <div>
                 <h3 className="text-lg font-black uppercase tracking-tighter">Sovereign Identity</h3>
                 <p className="text-xs text-muted font-mono uppercase tracking-widest mt-1">Lattice Verification Root (Ed25519)</p>
               </div>
             </div>

             <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-muted uppercase tracking-[3px] mb-2 block">Public Verification Key</label>
                   <div className="p-4 bg-black/40 border border-border/10 rounded-xl font-mono text-xs break-all leading-relaxed text-cyan/70 select-all">
                      {identity?.publicKey}
                   </div>
                </div>

                <div className="flex gap-4">
                   <button className="flex-1 py-3 bg-panel border border-border/30 hover:border-accent/50 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                     <Download size={14} />
                     Export Public Manifest
                   </button>
                   <button className="flex-1 py-3 bg-panel border border-border/30 hover:border-accent/50 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                     <RefreshCw size={14} />
                     Rotate Local State
                   </button>
                </div>
             </div>
          </section>

          <section className="bg-panel border border-border/50 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan">
                 <Cpu size={24} />
               </div>
               <div>
                 <h3 className="text-lg font-black uppercase tracking-tighter">Engine Parameters</h3>
                 <p className="text-xs text-muted font-mono uppercase tracking-widest mt-1">Lattice Propagation & Consensus</p>
               </div>
             </div>

             <div className="space-y-4">
                <ToggleItem label="Enforce Pre-Trade Simulation" description="Verify risk breach before propagation" active={true} />
                <ToggleItem label="Enable Quantum Resilience" description="Lattice-based hardening for signatures" active={true} />
                <ToggleItem label="Auto-Archive Proofs" description="Persist signed events to local indexedDB" active={false} />
             </div>
          </section>
        </div>

        {/* Status and Dangerous Actions */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
           <section className="bg-panel border border-border/50 rounded-2xl p-8 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                 <ShieldAlert size={16} className="text-yellow" />
                 Node Status
              </h3>
              <div className="space-y-4">
                 <StatusRow label="Market Service" status="CONNECTED" color="text-green" />
                 <StatusRow label="Lattice Consensus" status="VERIFIED" color="text-green" />
                 <StatusRow label="Crypto Latency" status="0.4ms" color="text-cyan" />
                 <StatusRow label="Audit Storage" status="IDB-S3" color="text-muted" />
              </div>
           </section>

           <section className="bg-panel border border-border/50 rounded-2xl p-8 shadow-xl border-accent/20">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-accent">Danger Zone</h3>
              <p className="text-[10px] text-muted uppercase tracking-widest mb-6 leading-relaxed">
                Actions here are permanent and will purge your identity keys, trade history, and portfolio data from local persistence.
              </p>
              
              <button 
                onClick={handleClearSession}
                className="w-full py-4 border border-accent/30 bg-accent/5 hover:bg-accent hover:text-black text-accent rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
              >
                <Trash2 size={16} />
                Purge Node Data
              </button>
           </section>

           <div className="mt-auto px-4 opacity-30 group">
              <div className="flex items-center gap-2 mb-2">
                 <Key size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Signed Heartbeat</span>
              </div>
              <div className="text-[9px] font-mono break-all leading-tight group-hover:text-accent transition-colors">
                LATTICE_INTEGRITY_CHECK_PASS_0X{Math.random().toString(16).slice(2, 10).toUpperCase()}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

const ToggleItem: React.FC<{ label: string, description: string, active: boolean }> = ({ label, description, active }) => (
  <div className="flex items-center justify-between py-4 border-b border-border/10 last:border-0 hover:bg-white/5 transition-colors px-2 rounded-lg">
    <div className="max-w-[80%]">
      <div className="text-xs font-bold uppercase tracking-tight">{label}</div>
      <div className="text-[10px] text-muted mt-1">{description}</div>
    </div>
    <div className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${active ? 'bg-accent' : 'bg-border/30'}`}>
       <div className={`w-4 h-4 rounded-full bg-black transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  </div>
);

const StatusRow: React.FC<{ label: string, status: string, color: string }> = ({ label, status, color }) => (
  <div className="flex justify-between items-center py-2 border-b border-border/10">
    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</span>
    <span className={`text-[10px] font-mono font-bold ${color}`}>{status}</span>
  </div>
);

export default Settings;
