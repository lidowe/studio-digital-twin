import { useState } from 'react';
import type { Microphone, Preamp, Compressor, Equalizer, OutboardProcessor, InsertProcessor, Perspective } from '../types/studio';
import { patchRows } from '../data/studio';
import { microphones } from '../data/microphones';
import { preamps } from '../data/preamps';
import { compressors } from '../data/compressors';
import { assessBridging, bridgingRatio } from '../engine/signalChain';

interface Props {
  perspective: Perspective;
  selectedMic: Microphone | null;
  selectedPreamp: Preamp | null;
  insertChain: InsertProcessor[];
  onSelectMic: (m: Microphone | null) => void;
  onSelectPreamp: (p: Preamp | null) => void;
  onAddInsert: (proc: InsertProcessor) => void;
  onRemoveInsert: (index: number) => void;
  equalizers: Equalizer[];
  outboardProcessors: OutboardProcessor[];
}

function BridgingBadge({ mic, preamp }: { mic: Microphone; preamp: Preamp }) {
  const ratio = bridgingRatio(mic.output_z_ohm, preamp.input_z_ohm);
  const a = assessBridging(ratio);
  const colors = {
    transparent: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    minimal: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    audible: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    significant: 'bg-red-500/20 text-red-300 border-red-500/40',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[a]}`}>
      {ratio.toFixed(1)}:1
    </span>
  );
}

function MicCard({ mic, selected, onSelect, perspective }: {
  mic: Microphone; selected: boolean; onSelect: (m: Microphone) => void; perspective: Perspective;
}) {
  return (
    <button
      onClick={() => onSelect(mic)}
      className={`text-left w-full px-3 py-2 rounded border transition text-sm ${
        selected
          ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
          : 'border-zinc-700/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{mic.name}</span>
        <span className="text-[10px] text-zinc-500">{mic.type} · {mic.qty}×</span>
      </div>
      <div className="text-xs text-zinc-400 mt-0.5">
        {perspective === 'musician' ? mic.character.slice(0, 80) + '…' :
         perspective === 'technical' ? `Z: ${mic.output_z_ohm}Ω · ${mic.sensitivity_dbv}dBV · ${mic.patterns.join('/')}` :
         `${mic.patterns.join('/')} · ~${mic.gain_demand_db}dB gain · ${mic.best_for.slice(0, 3).join(', ')}`}
      </div>
    </button>
  );
}

function PreampCard({ pre, mic, selected, onSelect, perspective }: {
  pre: Preamp; mic: Microphone | null; selected: boolean; onSelect: (p: Preamp) => void; perspective: Perspective;
}) {
  return (
    <button
      onClick={() => onSelect(pre)}
      className={`text-left w-full px-3 py-2 rounded border transition text-sm ${
        selected
          ? 'bg-blue-500/10 border-blue-500/50 text-blue-200'
          : 'border-zinc-700/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{pre.name}</span>
        <div className="flex items-center gap-1">
          {mic && <BridgingBadge mic={mic} preamp={pre} />}
          <span className="text-[10px] text-zinc-500">{pre.channels}ch</span>
        </div>
      </div>
      <div className="text-xs text-zinc-400 mt-0.5">
        {perspective === 'musician' ? pre.character.slice(0, 80) + '…' :
         perspective === 'technical' ? `Z_in: ${pre.input_z_ohm}Ω · Z_out: ${pre.output_z_ohm}Ω · ${pre.has_transformer ? 'XFMR' : 'Xfmrless'} · ${pre.gain_range_db[0]}–${pre.gain_range_db[1]}dB` :
         `${pre.topology} · ${pre.gain_range_db[0]}–${pre.gain_range_db[1]}dB · ${pre.best_for.slice(0, 3).join(', ')}`}
      </div>
    </button>
  );
}

function CompCard({ comp, inChain, onAdd, perspective }: {
  comp: Compressor; inChain: boolean; onAdd: (c: Compressor) => void; perspective: Perspective;
}) {
  return (
    <button
      onClick={() => onAdd(comp)}
      className={`text-left w-full px-3 py-2 rounded border transition text-sm ${
        inChain
          ? 'bg-purple-500/10 border-purple-500/50 text-purple-200'
          : 'border-zinc-700/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{comp.name}</span>
        <div className="flex items-center gap-1">
          {inChain && <span className="text-[9px] text-purple-400">IN CHAIN</span>}
          <span className="text-[10px] text-zinc-500">{comp.topology}</span>
        </div>
      </div>
      <div className="text-xs text-zinc-400 mt-0.5">
        {perspective === 'musician' ? comp.character.slice(0, 80) + '…' :
         perspective === 'technical' ? `${comp.detection} · ${comp.ratios} · ${comp.attack_range}` :
         `${comp.ratios} · ${comp.best_for.slice(0, 3).join(', ')}`}
      </div>
    </button>
  );
}

function EQCard({ eq, inChain, onAdd, perspective }: {
  eq: Equalizer; inChain: boolean; onAdd: (e: Equalizer) => void; perspective: Perspective;
}) {
  return (
    <button
      onClick={() => onAdd(eq)}
      className={`text-left w-full px-3 py-2 rounded border transition text-sm ${
        inChain
          ? 'bg-teal-500/10 border-teal-500/50 text-teal-200'
          : 'border-zinc-700/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{eq.name}</span>
        <div className="flex items-center gap-1">
          {inChain && <span className="text-[9px] text-teal-400">IN CHAIN</span>}
          <span className="text-[10px] text-zinc-500">{eq.topology} · {eq.channels}ch</span>
        </div>
      </div>
      <div className="text-xs text-zinc-400 mt-0.5">
        {perspective === 'musician' ? eq.character.slice(0, 80) + '…' :
         perspective === 'technical' ? `Z_in: ${eq.input_z_ohm}Ω · Z_out: ${eq.output_z_ohm}Ω · ${eq.has_transformer ? 'XFMR' : 'Xfmrless'} · ${eq.bands}` :
         `${eq.bands.slice(0, 60)} · ${eq.best_for.slice(0, 3).join(', ')}`}
      </div>
    </button>
  );
}

function OutboardCard({ proc, inChain, onAdd, perspective }: {
  proc: OutboardProcessor; inChain: boolean; onAdd: (p: OutboardProcessor) => void; perspective: Perspective;
}) {
  return (
    <button
      onClick={() => onAdd(proc)}
      className={`text-left w-full px-3 py-2 rounded border transition text-sm ${
        inChain
          ? 'bg-rose-500/10 border-rose-500/50 text-rose-200'
          : 'border-zinc-700/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{proc.name}</span>
        <div className="flex items-center gap-1">
          {inChain && <span className="text-[9px] text-rose-400">IN CHAIN</span>}
          <span className="text-[10px] text-zinc-500">{proc.type} · {proc.format}</span>
        </div>
      </div>
      <div className="text-xs text-zinc-400 mt-0.5">
        {perspective === 'musician' ? proc.character.slice(0, 80) + '…' :
         perspective === 'technical' ? `Z_in: ${proc.input_z_ohm}Ω · Z_out: ${proc.output_z_ohm}Ω · ${proc.format}` :
         `${proc.best_for.slice(0, 3).join(', ')}`}
      </div>
    </button>
  );
}

function InsertChainStrip({ insertChain, onRemove }: { insertChain: InsertProcessor[]; onRemove: (i: number) => void }) {
  if (insertChain.length === 0) return null;
  const typeColors = { compressor: 'bg-purple-500/20 border-purple-500/40 text-purple-200', equalizer: 'bg-teal-500/20 border-teal-500/40 text-teal-200', outboard: 'bg-rose-500/20 border-rose-500/40 text-rose-200' };
  return (
    <div className="flex items-center gap-1 flex-wrap py-1">
      <span className="text-[10px] text-zinc-500 mr-1">Insert Chain:</span>
      {insertChain.map((proc, i) => (
        <span key={`${proc.item.id}-${i}`} className="flex items-center gap-1">
          {i > 0 && <span className="text-zinc-600 text-xs">→</span>}
          <button
            onClick={() => onRemove(i)}
            className={`text-[10px] px-1.5 py-0.5 rounded border ${typeColors[proc.type]} hover:opacity-70 transition`}
            title="Click to remove from chain"
          >
            {proc.item.name} ✕
          </button>
        </span>
      ))}
    </div>
  );
}

export default function PatchbayView({
  perspective, selectedMic, selectedPreamp, insertChain,
  onSelectMic, onSelectPreamp, onAddInsert, onRemoveInsert,
  equalizers, outboardProcessors,
}: Props) {
  const rows = patchRows;
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['row-mic-ties', 'row-preamp-in']));

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // IDs currently in the insert chain (for highlighting)
  const chainIds = new Set(insertChain.map(p => p.item.id));

  // Group mics by type
  const micGroups = new Map<string, Microphone[]>();
  microphones.forEach(m => {
    const existing = micGroups.get(m.type) || [];
    existing.push(m);
    micGroups.set(m.type, existing);
  });

  // Group preamps by topology
  const preampGroups = new Map<string, Preamp[]>();
  preamps.forEach(p => {
    const label = { 'all-valve': 'All-Valve', 'hybrid-tube': 'Hybrid Tube', 'discrete-ss': 'Discrete Solid-State', 'dc-coupled': 'DC-Coupled' }[p.topology] || p.topology;
    const existing = preampGroups.get(label) || [];
    existing.push(p);
    preampGroups.set(label, existing);
  });

  // Group compressors by topology
  const compGroups = new Map<string, Compressor[]>();
  compressors.forEach(c => {
    const existing = compGroups.get(c.topology) || [];
    existing.push(c);
    compGroups.set(c.topology, existing);
  });

  // Group equalizers by topology
  const eqGroups = new Map<string, Equalizer[]>();
  equalizers.forEach(eq => {
    const label = { 'passive-inductor': 'Passive Inductor', 'active-inductor': 'Active Inductor', 'parametric': 'Parametric', 'tilt': 'Tilt', 'tube-reactive': 'Tube-Reactive' }[eq.topology] || eq.topology;
    const existing = eqGroups.get(label) || [];
    existing.push(eq);
    eqGroups.set(label, existing);
  });

  // Group outboard by type
  const fxGroups = new Map<string, OutboardProcessor[]>();
  outboardProcessors.forEach(p => {
    const label = { 'reverb': 'Reverb', 'delay': 'Delay', 'multi-fx': 'Multi-FX', 'enhancement': 'Enhancement / Width', 'width': 'Width / Stereo', 'utility': 'Utility' }[p.type] || p.type;
    const existing = fxGroups.get(label) || [];
    existing.push(p);
    fxGroups.set(label, existing);
  });

  // API insert point labels
  const apiInsertPoints = [
    ...Array.from({ length: 16 }, (_, i) => `Ch ${i + 1}`),
    'Mix A Bus', 'Mix B Bus',
  ];

  // Category styling
  const catColors: Record<string, string> = {
    'signal-path': 'bg-zinc-800/80',
    'outboard-pool': 'bg-indigo-950/30 border-indigo-800/30',
    'summing': 'bg-violet-950/30 border-violet-800/30',
    'digital': 'bg-red-950/30 border-red-800/40',
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      <p className="text-xs text-zinc-500 mb-3">
        Signal flows top → bottom. Click rows to expand/collapse. Normalled connections shown between rows. Outboard racks are pools of gear for insert patching.
      </p>

      {/* Insert chain strip (persistent) */}
      <InsertChainStrip insertChain={insertChain} onRemove={onRemoveInsert} />

      {rows.map((row) => {
        const isOpen = expanded.has(row.id);
        const hasNormal = row.normalled_to != null;
        const isHalfNormal = row.half_normal === true;

        return (
          <div key={row.id}>
            {/* Row header (clickable to expand/collapse) */}
            <button
              onClick={() => toggle(row.id)}
              className={`w-full flex items-center justify-between px-3 py-2 border border-zinc-700 transition-colors hover:bg-zinc-700/30 ${
                isOpen ? 'rounded-t' : 'rounded'
              } ${catColors[row.category] || 'bg-zinc-800/80'}`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                <span className="text-xs font-mono text-zinc-500 w-5 text-right">{row.order}</span>
                <span className="text-sm font-medium text-zinc-200">{row.label}</span>
                {row.category === 'outboard-pool' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">OUTBOARD</span>
                )}
                {row.category === 'digital' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">⚡ DIGITAL THRESHOLD</span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 text-right max-w-xs truncate">
                {row.description.slice(0, 70)}
              </span>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="border border-t-0 border-zinc-700 rounded-b bg-zinc-900/50 p-3 space-y-3">
                {/* Row description */}
                <p className="text-xs text-zinc-400">{row.description}</p>

                {/* ── Mic Tie Lines ── */}
                {row.id === 'row-mic-ties' && (
                  <>
                    {Array.from(micGroups.entries()).map(([type, mics]) => (
                      <div key={type}>
                        <div className="text-[10px] tracking-wide text-zinc-500 uppercase mb-1.5">{type} ({mics.reduce((s,m)=>s+m.qty,0)} units)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                          {mics.map(mic => (
                            <MicCard key={mic.id} mic={mic} selected={selectedMic?.id === mic.id} onSelect={onSelectMic} perspective={perspective} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* ── Preamp Inputs ── */}
                {row.id === 'row-preamp-in' && (
                  <>
                    {selectedMic && (
                      <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded px-2 py-1">
                        Chain: <strong>{selectedMic.name}</strong> → select a preamp below
                        {selectedMic.type === 'Ribbon' && ' ⚠️ Ribbon — check impedance bridging'}
                      </div>
                    )}
                    {Array.from(preampGroups.entries()).map(([label, pres]) => (
                      <div key={label}>
                        <div className="text-[10px] tracking-wide text-zinc-500 uppercase mb-1.5">{label}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                          {pres.map(pre => (
                            <PreampCard key={pre.id} pre={pre} mic={selectedMic} selected={selectedPreamp?.id === pre.id} onSelect={onSelectPreamp} perspective={perspective} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* ── Preamp Outputs ── */}
                {row.id === 'row-preamp-out' && (
                  <div className="text-xs text-zinc-400">
                    {selectedPreamp
                      ? <span>Signal: <strong className="text-blue-300">{selectedPreamp.name}</strong> output (Z_out: {selectedPreamp.output_z_ohm}Ω) → normals to API ASM164 line input</span>
                      : <span className="text-zinc-500 italic">No preamp selected. Preamp outputs normal to API ASM164 line inputs.</span>
                    }
                  </div>
                )}

                {/* ── API Line Inputs ── */}
                {row.id === 'row-api-line-in' && (
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400">
                      16 line-level inputs on the API ASM164. Each channel has its own insert send/return point and routes to Mix A or Mix B.
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
                      {Array.from({ length: 16 }, (_, i) => (
                        <div key={i} className="text-center text-[10px] px-1.5 py-1 rounded border border-zinc-700/50 bg-zinc-800/50 text-zinc-400">
                          Ch {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── API Insert Sends ── */}
                {row.id === 'row-insert-send' && (
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400">
                      Half-normalled tap points — signal passes through to the API channel unless a patch cable is inserted. Tap here to feed outboard gear from the Dynamics, EQ, or FX racks below.
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-1">
                      {apiInsertPoints.map((label, i) => (
                        <div key={i} className={`text-center text-[10px] px-1.5 py-1.5 rounded border ${
                          i >= 16 ? 'border-violet-600/40 bg-violet-950/30 text-violet-300' : 'border-zinc-700/50 bg-zinc-800/50 text-zinc-400'
                        }`}>
                          {label}
                          <div className="text-[8px] text-zinc-600 mt-0.5">send</div>
                        </div>
                      ))}
                    </div>
                    {insertChain.length > 0 && (
                      <div className="mt-2">
                        <InsertChainStrip insertChain={insertChain} onRemove={onRemoveInsert} />
                      </div>
                    )}
                  </div>
                )}

                {/* ── API Insert Returns ── */}
                {row.id === 'row-insert-return' && (
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400">
                      Return points from outboard processing. When patched, the processed signal replaces the direct signal at the API channel.
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-1">
                      {apiInsertPoints.map((label, i) => (
                        <div key={i} className={`text-center text-[10px] px-1.5 py-1.5 rounded border ${
                          i >= 16 ? 'border-violet-600/40 bg-violet-950/30 text-violet-300' : 'border-zinc-700/50 bg-zinc-800/50 text-zinc-400'
                        }`}>
                          {label}
                          <div className="text-[8px] text-zinc-600 mt-0.5">return</div>
                        </div>
                      ))}
                    </div>
                    {insertChain.length > 0 && (
                      <div className="mt-2">
                        <InsertChainStrip insertChain={insertChain} onRemove={onRemoveInsert} />
                      </div>
                    )}
                  </div>
                )}

                {/* ── Dynamics Rack ── */}
                {row.id === 'row-dynamics' && (
                  <>
                    {Array.from(compGroups.entries()).map(([topo, comps]) => (
                      <div key={topo}>
                        <div className="text-[10px] tracking-wide text-zinc-500 uppercase mb-1.5">{topo}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                          {comps.map(comp => (
                            <CompCard key={comp.id} comp={comp} inChain={chainIds.has(comp.id)} onAdd={(c) => onAddInsert({ type: 'compressor', item: c })} perspective={perspective} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* ── EQ Rack ── */}
                {row.id === 'row-eq' && (
                  <>
                    {Array.from(eqGroups.entries()).map(([label, eqs]) => (
                      <div key={label}>
                        <div className="text-[10px] tracking-wide text-zinc-500 uppercase mb-1.5">{label}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                          {eqs.map(eq => (
                            <EQCard key={eq.id} eq={eq} inChain={chainIds.has(eq.id)} onAdd={(e) => onAddInsert({ type: 'equalizer', item: e })} perspective={perspective} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* ── FX / Outboard ── */}
                {row.id === 'row-fx' && (
                  <>
                    <div className="text-xs text-zinc-400 bg-zinc-800/50 border border-zinc-700/50 rounded px-2 py-1 mb-2">
                      FX unit outputs normal → Tonelux OTB 16xh → sums → API Mix B insert return
                    </div>
                    {Array.from(fxGroups.entries()).map(([label, procs]) => (
                      <div key={label}>
                        <div className="text-[10px] tracking-wide text-zinc-500 uppercase mb-1.5">{label}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                          {procs.map(proc => (
                            <OutboardCard key={proc.id} proc={proc} inChain={chainIds.has(proc.id)} onAdd={(p) => onAddInsert({ type: 'outboard', item: p })} perspective={perspective} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* ── API Mix Buses ── */}
                {row.id === 'row-api-mix' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border border-zinc-700/50 rounded p-3 bg-zinc-800/30">
                      <div className="text-xs font-medium text-zinc-200 mb-1">Mix A — Tracking</div>
                      <div className="text-[10px] text-zinc-400 space-y-1">
                        <div>Ch 1–16 sum to Mix A bus</div>
                        <div>Mix A has stereo bus insert (send/return on patchbay)</div>
                        <div className="text-amber-300">Mix A output → Dangerous AD+ input #1</div>
                      </div>
                    </div>
                    <div className="border border-zinc-700/50 rounded p-3 bg-zinc-800/30">
                      <div className="text-xs font-medium text-zinc-200 mb-1">Mix B — FX / Overflow</div>
                      <div className="text-[10px] text-zinc-400 space-y-1">
                        <div>Mix B has stereo bus insert (send/return on patchbay)</div>
                        <div>Tonelux OTB 16xh normals → Mix B insert return</div>
                        <div className="text-violet-300">FX returns and overflow summing enter here</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Pueblo / Tonelux ── */}
                {row.id === 'row-pueblo' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border border-zinc-700/50 rounded p-3 bg-zinc-800/30">
                      <div className="text-xs font-medium text-zinc-200 mb-1">Pueblo HJ482 — 32-Input Summing</div>
                      <div className="text-[10px] text-zinc-400 space-y-1">
                        <div>4 banks of 8 inputs (32 total)</div>
                        <div>Banks sum toward Bank D stereo output</div>
                        <div>Bank D has optional internal transformer</div>
                        <div className="text-amber-300">Bank D stereo out → Dangerous AD+ input #2 (mixing)</div>
                        <div className="text-zinc-500">No insert points — pure passive summing</div>
                      </div>
                      <div className="grid grid-cols-4 gap-1 mt-2">
                        {['Bank A (8)', 'Bank B (8)', 'Bank C (8)', 'Bank D (8)'].map(b => (
                          <div key={b} className="text-center text-[9px] px-1 py-1 rounded border border-zinc-700/50 bg-zinc-800/50 text-zinc-500">{b}</div>
                        ))}
                      </div>
                    </div>
                    <div className="border border-zinc-700/50 rounded p-3 bg-zinc-800/30">
                      <div className="text-xs font-medium text-zinc-200 mb-1">Tonelux OTB 16xh — FX/Overflow Summing</div>
                      <div className="text-[10px] text-zinc-400 space-y-1">
                        <div>16 inputs for FX returns and overflow</div>
                        <div>FX unit outputs normal here</div>
                        <div>Summed output → API Mix B insert return</div>
                        <div className="text-violet-300">Provides additional summing beyond Pueblo's 16</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── AD+ / DAW ── */}
                {row.id === 'row-ad-daw' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="border border-red-800/30 rounded p-3 bg-red-950/20">
                        <div className="text-xs font-medium text-red-300 mb-1">AD+ Input #1 — Tracking</div>
                        <div className="text-[10px] text-zinc-400 space-y-1">
                          <div>Source: API Mix A stereo output</div>
                          <div className="text-red-400">⚠ Digital threshold — noise becomes permanent</div>
                        </div>
                      </div>
                      <div className="border border-red-800/30 rounded p-3 bg-red-950/20">
                        <div className="text-xs font-medium text-red-300 mb-1">AD+ Input #2 — Mixing</div>
                        <div className="text-[10px] text-zinc-400 space-y-1">
                          <div>Source: Pueblo Bank D stereo output</div>
                          <div className="text-red-400">⚠ Digital threshold — noise becomes permanent</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 rounded px-2 py-1.5">
                      AD+ → Aurora(n) (wordclock chain, inches apart) → DAW via Thunderbolt 3
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Normalling indicator between rows */}
            {hasNormal && (
              <div className="flex items-center justify-center py-0.5">
                <div className="w-px h-3 bg-zinc-600" />
                <span className="text-[9px] text-zinc-600 mx-1">{isHalfNormal ? 'half-normal ↓' : 'normalled ↓'}</span>
                <div className="w-px h-3 bg-zinc-600" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
