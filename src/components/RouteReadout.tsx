import type { Microphone, Preamp, Perspective, ChainAnalysis, InsertProcessor, ParallelProcessor } from '../types/studio';
import { converters } from '../data/studio';

interface Props {
  perspective: Perspective;
  selectedMic: Microphone | null;
  selectedPreamp: Preamp | null;
  insertChain: InsertProcessor[];
  parallelChain: ParallelProcessor[];
  analysis: ChainAnalysis | null;
  onSelectMic: (m: Microphone | null) => void;
  onSelectPreamp: (p: Preamp | null) => void;
  onRemoveInsert: (index: number) => void;
  onRemoveParallel: (index: number) => void;
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
        <div className="w-10 h-10 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center">
          <span className="text-zinc-600 text-lg">+</span>
        </div>
        <div>
          <div className="text-xs text-zinc-500">{label}</div>
          <div className="text-sm text-zinc-600 italic">Choose from the patchbay to reveal this stage.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onInspect(item.id)}
        className="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition hover:scale-105"
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

const insertAccents: Record<InsertProcessor['type'], string> = {
  compressor: '#a855f7',
  equalizer: '#14b8a6',
  'preamp-eq': '#0ea5a4',
  outboard: '#f43f5e',
};

const insertLabels: Record<InsertProcessor['type'], string> = {
  compressor: 'Dynamics',
  equalizer: 'EQ',
  'preamp-eq': 'Preamp / EQ',
  outboard: 'Inline Outboard',
};

export default function RouteReadout({
  perspective,
  selectedMic,
  selectedPreamp,
  insertChain,
  parallelChain,
  analysis,
  onSelectMic,
  onSelectPreamp,
  onRemoveInsert,
  onRemoveParallel,
  onReorderInserts,
  onInspect,
}: Props) {
  const converter = converters[0];

  return (
    <div className="space-y-1">
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
        <ChainSlot
          label="Microphone"
          item={selectedMic}
          accent="#f59e0b"
          onClear={() => onSelectMic(null)}
          onInspect={(id) => onInspect(id)}
          perspective={perspective}
        />
      </div>

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

      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
        <ChainSlot
          label="Preamp"
          item={selectedPreamp}
          accent="#3b82f6"
          onClear={() => onSelectPreamp(null)}
          onInspect={(id) => onInspect(id)}
          perspective={perspective}
        />
      </div>

      {insertChain.length > 0 ? (
        insertChain.map((proc, index) => (
          <div key={`${proc.item.id}-${index}`}>
            <div className="flex items-center justify-center py-1">
              <div className="flex flex-col items-center">
                <div className="w-px h-4 bg-zinc-600" />
                <span className="text-[9px] text-zinc-600">insert {index + 1}</span>
                <div className="w-px h-4 bg-zinc-600" />
              </div>
            </div>

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
                  {index > 0 && (
                    <button
                      onClick={() => onReorderInserts(index, index - 1)}
                      className="text-zinc-600 hover:text-zinc-400 text-xs px-1"
                      title="Move up"
                    >↑</button>
                  )}
                  {index < insertChain.length - 1 && (
                    <button
                      onClick={() => onReorderInserts(index, index + 1)}
                      className="text-zinc-600 hover:text-zinc-400 text-xs px-1"
                      title="Move down"
                    >↓</button>
                  )}
                </div>
                <button
                  onClick={() => onRemoveInsert(index)}
                  className="text-zinc-600 hover:text-zinc-400 text-xs px-1"
                  title="Remove from chain"
                >✕</button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <>
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
                <div className="text-sm text-zinc-600 italic">Add dynamics, EQ, or inline outboard when the route calls for another stage.</div>
              </div>
            </div>
          </div>
        </>
      )}

      {parallelChain.length > 0 && (
        <>
          <div className="flex justify-center py-1">
            <div className="w-px h-6 bg-cyan-700/60" />
          </div>
          <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-lg p-3 space-y-2">
            <div className="text-xs font-medium text-cyan-300">Parallel Paths</div>
            <div className="text-[11px] text-cyan-200/80">These branches supplement the direct path and return at the point you have assigned to them.</div>
            {parallelChain.map((proc, index) => (
              <div key={`${proc.type}-${proc.item.id}-${index}`} className="rounded border border-cyan-800/30 bg-zinc-900/50 p-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onInspect(proc.item.id)}
                    className="w-10 h-10 rounded-lg border-2 border-cyan-700 text-cyan-300 bg-cyan-950/30 flex items-center justify-center text-sm font-bold transition hover:scale-105"
                  >
                    {proc.item.name.charAt(0)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-cyan-400">Parallel branch</div>
                    <div className="text-sm text-zinc-200 font-medium truncate">{proc.item.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{proc.routing.send_source_label} → {proc.routing.return_destination_label}</div>
                  </div>
                  <button
                    onClick={() => onRemoveParallel(index)}
                    className="text-zinc-600 hover:text-zinc-400 text-xs px-1"
                    title="Remove parallel path"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-center py-1">
        <div className="w-px h-8 bg-zinc-600" />
      </div>

      <div className="bg-zinc-800/50 border border-red-800/40 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border-2 border-red-600 flex items-center justify-center bg-red-950/30">
            <span className="text-red-400 text-sm font-bold">D</span>
          </div>
          <div>
            <div className="text-xs text-red-400">Digital Threshold</div>
            <div className="text-sm text-zinc-200 font-medium">{converter.name}</div>
            <div className="text-[10px] text-zinc-500">
              {converter.sample_rates.map((rate) => rate / 1000).join('/')}kHz · {converter.bit_depths.join('/')}bit · {converter.channels}ch
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-1">
        <div className="w-px h-4 bg-zinc-600" />
        <span className="text-[10px] text-red-400/60 mx-2">▼ digital domain ▼</span>
        <div className="w-px h-4 bg-zinc-600" />
      </div>

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
  );
}