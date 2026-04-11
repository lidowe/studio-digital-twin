import type { Perspective } from '../types/studio';

interface Props {
  perspective: Perspective;
  onPerspective: (p: Perspective) => void;
}

const perspectives: { key: Perspective; label: string }[] = [
  { key: 'engineer', label: 'Engineer' },
  { key: 'musician', label: 'Musician' },
  { key: 'technical', label: 'Technical' },
];

export default function Header({ perspective, onPerspective }: Props) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 px-4 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">Signal Flow Reference</div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Signal Atlas</h1>
          <p className="max-w-2xl text-xs leading-relaxed text-zinc-500">
            Learn how a studio path behaves, why a circuit choice changes the result, and what each routing decision commits to the sound before it reaches the recorder.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-2 py-1">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Perspective</span>
            {perspectives.map(p => (
              <button
                key={p.key}
                onClick={() => onPerspective(p.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  perspective === p.key
                    ? 'border border-amber-500/30 bg-amber-500/12 text-amber-200'
                    : 'border border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
