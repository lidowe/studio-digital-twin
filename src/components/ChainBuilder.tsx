import type { Microphone, Preamp, Perspective, ChainAnalysis, InsertProcessor } from '../types/studio';
import { converters } from '../data/studio';

interface Props {
  perspective: Perspective;
  selectedMic: Microphone | null;
  selectedPreamp: Preamp | null;
  insertChain: InsertProcessor[];
  analysis: ChainAnalysis | null;
  onSelectMic: (m: Microphone | null) => void;
  onSelectPreamp: (p: Preamp | null) => void;
  onAddInsert: (proc: InsertProcessor) => void;
  onRemoveInsert: (index: number) => void;
  onReorderInserts: (from: number, to: number) => void;
  onInspect: (id: string | null) => void;
}

function ChainSlot({
  label,
  item,
  accent,
  onClear,
  onInspect,
  perspective,
}: {
  label: string;
  item: { id: string; name: string; character: string } | null;
  accent: string;
  onClear: () => void;
  onInspect: (id: string) => void;
  perspective: Perspective;
}) {
  if (!item) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center`}>
          <span className="text-zinc-600 text-lg">+</span>
        </div>
        <div>
          <div className="text-xs text-zinc-500">{label}</div>
          <div className="text-sm text-zinc-600 italic">Select from Patchbay</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onInspect(item.id)}
        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition hover:scale-105`}
        style={{ borderColor: accent, color: accent, backgroundColor: accent + '15' }}
      >
        {item.name.charAt(0)}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="text-sm text-zinc-200 font-medium truncate">{item.name}</div>
        {perspective === 'musician' && (
          <div className="text-[10px] text-zinc-500 truncate">{item.character.slice(0, 60)}</div>
        )}
      </div>
      <button
        onClick={onClear}
        className="text-zinc-600 hover:text-zinc-400 text-xs px-1"
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

function WarningBadge({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-1.5 text-xs text-yellow-300 bg-yellow-900/20 border border-yellow-700/30 rounded px-2 py-1">
      <span className="mt-0.5">⚠</span>
      <span>{text}</span>
    </div>
  );
}

const insertAccents: Record<InsertProcessor['type'], string> = {
  compressor: '#a855f7',
  equalizer: '#14b8a6',
  outboard: '#f43f5e',
};

const insertLabels: Record<InsertProcessor['type'], string> = {
  compressor: 'Dynamics',
  equalizer: 'EQ',
  outboard: 'Outboard FX',
};

export default function ChainBuilder({
  perspective, selectedMic, selectedPreamp, insertChain, analysis,
  onSelectMic, onSelectPreamp, onRemoveInsert, onReorderInserts, onInspect,
}: Props) {
  const converter = converters[0]; // Dangerous D-Box+ as default

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="text-xs text-zinc-500 mb-4">
        Build your signal chain stage by stage. Select components from the Patchbay view, then return here to see the chain analysis.
      </p>

      {/* Chain visualization */}
      <div className="space-y-1">
        {/* Microphone */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
          <ChainSlot
            label="Microphone"
            item={selectedMic}
            accent="#f59e0b"
            onClear={() => onSelectMic(null)}
            onInspect={onInspect}
            perspective={perspective}
          />
        </div>

        {/* Connection line + bridging info */}
        <div className="flex items-center justify-center py-1">
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-zinc-600" />
            {analysis && (
              <span className={`text-[10px] px-2 py-0.5 rounded ${
                analysis.bridging_assessment === 'transparent' ? 'text-emerald-400' :
                analysis.bridging_assessment === 'minimal' ? 'text-sky-400' :
                analysis.bridging_assessment === 'audible' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {analysis.bridging_ratio.toFixed(1)}:1 bridging · {analysis.loss_db.toFixed(2)}dB loss
              </span>
            )}
            <div className="w-px h-4 bg-zinc-600" />
          </div>
        </div>

        {/* Preamp */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
          <ChainSlot
            label="Preamp"
            item={selectedPreamp}
            accent="#3b82f6"
            onClear={() => onSelectPreamp(null)}
            onInspect={onInspect}
            perspective={perspective}
          />
        </div>

        {/* Insert chain processors */}
        {insertChain.length > 0 ? (
          insertChain.map((proc, i) => (
            <div key={`${proc.item.id}-${i}`}>
              {/* Connection */}
              <div className="flex items-center justify-center py-1">
                <div className="flex flex-col items-center">
                  <div className="w-px h-4 bg-zinc-600" />
                  <span className="text-[9px] text-zinc-600">insert {i + 1}</span>
                  <div className="w-px h-4 bg-zinc-600" />
                </div>
              </div>

              {/* Processor slot */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onInspect(proc.item.id)}
                    className="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition hover:scale-105"
                    style={{ borderColor: insertAccents[proc.type], color: insertAccents[proc.type], backgroundColor: insertAccents[proc.type] + '15' }}
                  >
                    {proc.item.name.charAt(0)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-500">{insertLabels[proc.type]}</div>
                    <div className="text-sm text-zinc-200 font-medium truncate">{proc.item.name}</div>
                    {perspective === 'musician' && (
                      <div className="text-[10px] text-zinc-500 truncate">{proc.item.character.slice(0, 60)}</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {i > 0 && (
                      <button
                        onClick={() => onReorderInserts(i, i - 1)}
                        className="text-zinc-600 hover:text-zinc-400 text-xs px-1"
                        title="Move up"
                      >↑</button>
                    )}
                    {i < insertChain.length - 1 && (
                      <button
                        onClick={() => onReorderInserts(i, i + 1)}
                        className="text-zinc-600 hover:text-zinc-400 text-xs px-1"
                        title="Move down"
                      >↓</button>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveInsert(i)}
                    className="text-zinc-600 hover:text-zinc-400 text-xs px-1"
                    title="Remove from chain"
                  >✕</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            {/* Empty insert chain prompt */}
            <div className="flex justify-center py-1">
              <div className="w-px h-8 bg-zinc-600" />
            </div>
            <div className="bg-zinc-800/30 border border-dashed border-zinc-700 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center">
                  <span className="text-zinc-600 text-lg">+</span>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Insert Chain</div>
                  <div className="text-sm text-zinc-600 italic">Add dynamics, EQ, or outboard from Patchbay</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Connection to converter */}
        <div className="flex justify-center py-1">
          <div className="w-px h-8 bg-zinc-600" />
        </div>

        {/* Converter (fixed) */}
        <div className="bg-zinc-800/50 border border-red-800/40 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border-2 border-red-600 flex items-center justify-center bg-red-950/30">
              <span className="text-red-400 text-sm font-bold">D</span>
            </div>
            <div>
              <div className="text-xs text-red-400">Digital Threshold</div>
              <div className="text-sm text-zinc-200 font-medium">{converter.name}</div>
              <div className="text-[10px] text-zinc-500">
                {converter.sample_rates.map(r => r/1000).join('/')}kHz · {converter.bit_depths.join('/')}-bit · {converter.channels}ch
              </div>
            </div>
          </div>
        </div>

        {/* Connection */}
        <div className="flex justify-center py-1">
          <div className="w-px h-4 bg-zinc-600" />
          <span className="text-[10px] text-red-400/60 mx-2">▼ digital domain ▼</span>
          <div className="w-px h-4 bg-zinc-600" />
        </div>

        {/* DAW */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-zinc-600 flex items-center justify-center bg-zinc-900">
              <span className="text-zinc-500 text-sm">DAW</span>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Digital Audio Workstation</div>
              <div className="text-sm text-zinc-400">Lynx Aurora(n) via Thunderbolt 3</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis results inline */}
      {analysis && (
        <div className="mt-6 space-y-2">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Chain Analysis</h3>

          {/* Warnings first */}
          {analysis.warnings.map((w, i) => (
            <WarningBadge key={i} text={w} />
          ))}

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Bridging Ratio" value={`${analysis.bridging_ratio.toFixed(1)}:1`}
              quality={analysis.bridging_assessment} />
            <Metric label="Voltage Loss" value={`${analysis.loss_db.toFixed(2)} dB`}
              quality={analysis.loss_db < 0.5 ? 'transparent' : analysis.loss_db < 1 ? 'minimal' : 'audible'} />
            <Metric label="Eff. Bandwidth" value={`${analysis.effective_bw_khz.toFixed(1)} kHz`}
              quality={analysis.effective_bw_khz > 20 ? 'transparent' : analysis.effective_bw_khz > 18 ? 'minimal' : 'audible'} />
            <Metric label="Cumulative THD" value={`${analysis.thd_estimate_pct.toFixed(4)}%`}
              quality={analysis.thd_estimate_pct < 0.5 ? 'transparent' : analysis.thd_estimate_pct < 1 ? 'minimal' : 'audible'} />
            <Metric label="Phase @ 20kHz" value={`${analysis.phase_shift_deg_20khz.toFixed(1)}°`}
              quality={analysis.phase_shift_deg_20khz < 10 ? 'transparent' : analysis.phase_shift_deg_20khz < 20 ? 'minimal' : 'audible'} />
            <Metric label="Noise Floor" value={`${analysis.cumulative_noise_db.toFixed(1)} dBu`}
              quality={analysis.cumulative_noise_db < -120 ? 'transparent' : analysis.cumulative_noise_db < -110 ? 'minimal' : 'audible'} />
          </div>

          {/* Perspective notes */}
          {analysis.notes.length > 0 && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded p-3 space-y-1">
              <div className="text-xs text-zinc-400 font-medium">
                {perspective === 'musician' ? '🎵 What This Means' : perspective === 'technical' ? '⚡ Technical Notes' : '🎛️ Engineering Notes'}
              </div>
              {analysis.notes.map((n, i) => (
                <div key={i} className="text-xs text-zinc-300">• {n}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {!analysis && selectedMic && !selectedPreamp && (
        <div className="mt-6 text-sm text-zinc-500 bg-zinc-800/30 border border-zinc-700/50 rounded p-3">
          Select a preamp to see chain analysis with impedance bridging, voltage transfer, and bandwidth calculations.
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, quality }: {
  label: string;
  value: string;
  quality: 'transparent' | 'minimal' | 'audible' | 'significant' | string;
}) {
  const colors = {
    transparent: 'text-emerald-400 border-emerald-500/30',
    minimal: 'text-sky-400 border-sky-500/30',
    audible: 'text-yellow-400 border-yellow-500/30',
    significant: 'text-red-400 border-red-500/30',
  };
  const c = colors[quality as keyof typeof colors] || 'text-zinc-400 border-zinc-600';

  return (
    <div className={`border rounded px-2.5 py-2 ${c}`}>
      <div className="text-[10px] text-zinc-500">{label}</div>
      <div className="text-sm font-mono font-medium">{value}</div>
    </div>
  );
}
