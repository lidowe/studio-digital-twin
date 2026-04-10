import type { Perspective } from '../types/studio';
import { roomZones } from '../data/studio';

interface Props {
  perspective: Perspective;
  inspectedId: string | null;
  onInspect: (id: string | null) => void;
}

/* A-frame attic room: ~14' × 14'4", peaked ceiling at ~10' ridge, knee walls ~4'.
   SVG viewport 600×600 maps proportionally. Zones are overlaid as colored regions. */

const ROOM_W = 600;
const ROOM_H = 600;
const PAD = 40;

interface ZoneRect { x: number; y: number; w: number; h: number; }

const zoneLayout: Record<string, ZoneRect> = {
  ears:         { x: 230, y: 200, w: 140, h: 120 },
  'mix-bus':    { x: 130, y: 200, w: 100, h: 120 },
  prep:         { x: 130, y: 340, w: 200, h: 100 },
  digital:      { x: 370, y: 200, w: 110, h: 120 },
  'machine-room': { x: 180, y: 460, w: 240, h: 80 },
  'outer-ring': { x: 80, y: 100, w: 440, h: 80 },
};

const monitorPositions = [
  { id: 'hedd-type20', x: 200, y: 180, label: 'HEDD 20' },
  { id: 'hedd-type20-r', x: 360, y: 180, label: 'HEDD 20' },
  { id: 'ns10', x: 220, y: 160, label: 'NS-10' },
  { id: 'ns10-r', x: 340, y: 160, label: 'NS-10' },
  { id: 'auratone', x: 280, y: 150, label: 'Aura' },
  { id: 'sub', x: 280, y: 300, label: 'Sub 8' },
];

const rackPos = [
  { id: 'rack-ears', x: 260, y: 230, label: 'Ears Rack' },
  { id: 'rack-mixbus', x: 150, y: 260, label: 'Mix Bus' },
  { id: 'rack-tower', x: 400, y: 280, label: 'Tower' },
  { id: 'rack-bay', x: 200, y: 380, label: 'Bay / Patch' },
  { id: 'rack-channel', x: 300, y: 380, label: 'Channel Strip' },
];

export default function RoomView({ perspective, inspectedId, onInspect }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="text-xs text-zinc-500 mb-3">
        Interactive room layout. Zones are color-coded by cognitive proximity. Click elements to inspect.
      </p>

      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${ROOM_W} ${ROOM_H}`}
          className="w-full max-w-2xl"
          style={{ aspectRatio: '1/1' }}
        >
          {/* Room outline — A-frame shape */}
          <polygon
            points={`${PAD},${ROOM_H - PAD} ${PAD},${PAD + 80} ${ROOM_W / 2},${PAD} ${ROOM_W - PAD},${PAD + 80} ${ROOM_W - PAD},${ROOM_H - PAD}`}
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="2"
          />

          {/* Ridge line */}
          <line
            x1={ROOM_W / 2} y1={PAD} x2={ROOM_W / 2} y2={PAD + 20}
            stroke="#52525b" strokeWidth="1.5" strokeDasharray="4 2"
          />
          <text x={ROOM_W / 2} y={PAD + 32} textAnchor="middle" className="fill-zinc-600 text-[9px]">ridge ▲</text>

          {/* Zones */}
          {roomZones.map(zone => {
            const zoneKey = zone.id === 1 ? 'ears' : zone.id === 2 ? 'mix-bus' : zone.id === 3 ? 'prep' : zone.id === 4 ? 'digital' : zone.id === 5 ? 'machine-room' : 'outer-ring';
            const rect = zoneLayout[zoneKey];
            if (!rect) return null;
            const isActive = inspectedId === String(zone.id);
            return (
              <g key={zone.id} onClick={() => onInspect(String(zone.id))} className="cursor-pointer">
                <rect
                  x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                  rx={6}
                  fill={zone.color + (isActive ? '30' : '15')}
                  stroke={zone.color + (isActive ? 'aa' : '44')}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 16}
                  textAnchor="middle"
                  className="text-[10px] font-medium"
                  fill={zone.color + 'cc'}
                >
                  {zone.name}
                </text>
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 28}
                  textAnchor="middle"
                  className="text-[8px]"
                  fill="#71717a"
                >
                  {zone.description.slice(0, 30)}
                </text>

                {/* Perspective-specific label */}
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + rect.h - 8}
                  textAnchor="middle"
                  className="text-[8px]"
                  fill="#a1a1aa"
                >
                  {perspective === 'musician'
                    ? zone.name === 'Ears' ? 'where your mix lives'
                      : zone.name === 'Prep' ? 'tone-shaping gear'
                      : zone.name === 'Mix Bus' ? 'glue & width'
                      : ''
                    : perspective === 'technical'
                    ? zone.name === 'Ears' ? 'D/A → Mon → SPL'
                      : zone.name === 'Machine Room' ? 'PSU · Amp · AC'
                      : zone.name === 'Digital' ? 'TB3 · CPU'
                      : ''
                    : zone.description?.slice(0, 30) || ''}
                </text>
              </g>
            );
          })}

          {/* Monitors */}
          {monitorPositions.map(m => (
            <g key={m.id} className="cursor-pointer">
              <circle cx={m.x} cy={m.y} r={8} fill="#1e1e2e" stroke="#6366f1" strokeWidth={1.5} />
              <text x={m.x} y={m.y + 3} textAnchor="middle" className="text-[7px] fill-indigo-300">◉</text>
              <text x={m.x} y={m.y - 12} textAnchor="middle" className="text-[7px] fill-zinc-500">{m.label}</text>
            </g>
          ))}

          {/* Listening position (sweet spot) */}
          <circle cx={280} cy={250} r={5} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="3 2" />
          <text x={280} y={265} textAnchor="middle" className="text-[7px] fill-yellow-500">sweet spot</text>

          {/* Rack positions */}
          {rackPos.map(r => (
            <g key={r.id} className="cursor-pointer">
              <rect x={r.x - 20} y={r.y - 6} width={40} height={12} rx={2} fill="#27272a" stroke="#52525b" strokeWidth={1} />
              <text x={r.x} y={r.y + 3} textAnchor="middle" className="text-[7px] fill-zinc-400">{r.label}</text>
            </g>
          ))}

          {/* Compass */}
          <text x={ROOM_W - PAD - 20} y={PAD + 20} className="text-[9px] fill-zinc-600">N ↑</text>

          {/* Dimensions */}
          <text x={ROOM_W / 2} y={ROOM_H - PAD + 16} textAnchor="middle" className="text-[9px] fill-zinc-600">14' 0"</text>
          <text x={PAD - 16} y={ROOM_H / 2} textAnchor="middle" className="text-[9px] fill-zinc-600" transform={`rotate(-90, ${PAD - 16}, ${ROOM_H / 2})`}>14' 4"</text>
        </svg>
      </div>

      {/* Zone legend */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
        {roomZones.map(zone => (
          <button
            key={zone.id}
            onClick={() => onInspect(String(zone.id))}
            className={`text-left px-3 py-2 rounded border text-xs transition ${
              inspectedId === String(zone.id)
                ? 'border-zinc-500 bg-zinc-800'
                : 'border-zinc-700/50 hover:border-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: zone.color + '88' }} />
              <span className="font-medium text-zinc-200">{zone.name}</span>
            </div>
            <div className="text-zinc-500 mt-0.5">{zone.description.slice(0, 50)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
