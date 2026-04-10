import type { Perspective, ViewMode } from '../types/studio';

interface Props {
  perspective: Perspective;
  view: ViewMode;
  onPerspective: (p: Perspective) => void;
  onView: (v: ViewMode) => void;
  onClearChain: () => void;
}

const perspectives: { key: Perspective; label: string; icon: string; desc: string }[] = [
  { key: 'engineer', label: 'Audio Engineer', icon: '🎛️', desc: 'Signal flow, chain building, analysis' },
  { key: 'musician', label: 'Musician', icon: '🎵', desc: 'Sound character, what it does' },
  { key: 'technical', label: 'Technical', icon: '⚡', desc: 'Impedance, EM zones, wiring' },
];

const views: { key: ViewMode; label: string; icon: string }[] = [
  { key: 'patchbay', label: 'Patchbay', icon: '▥' },
  { key: 'room', label: 'Room', icon: '⬡' },
  { key: 'chain', label: 'Chain Builder', icon: '⛓' },
];

export default function Header({ perspective, view, onPerspective, onView, onClearChain }: Props) {
  return (
    <header className="bg-zinc-900 border-b border-zinc-700 px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-amber-400 tracking-tight">Studio Digital Twin</h1>
          <span className="text-xs text-zinc-500 hidden sm:inline">Professional Analog Recording Studio</span>
        </div>
        <button onClick={onClearChain} className="text-xs text-zinc-400 hover:text-red-400 border border-zinc-700 rounded px-2 py-1 transition">
          Clear Chain
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {/* Perspective selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500 mr-1">Perspective:</span>
          {perspectives.map(p => (
            <button
              key={p.key}
              onClick={() => onPerspective(p.key)}
              title={p.desc}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                perspective === p.key
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        {/* View selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500 mr-1">View:</span>
          {views.map(v => (
            <button
              key={v.key}
              onClick={() => onView(v.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                view === v.key
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
