import type { Perspective, Microphone, Preamp, Compressor, Equalizer, OutboardProcessor } from '../types/studio';
import { microphones } from '../data/microphones';
import { preamps } from '../data/preamps';
import { compressors } from '../data/compressors';
import { equalizers } from '../data/equalizers';
import { outboardProcessors } from '../data/outboard';
import { roomZones, rackPositions } from '../data/studio';

interface Props {
  perspective: Perspective;
  inspectedId: string | null;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{title}</h4>
      {children}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300 font-mono">{value}</span>
    </div>
  );
}

function MicInspector({ mic, perspective }: { mic: Microphone; perspective: Perspective }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-amber-300">{mic.name}</h3>
        <div className="text-xs text-zinc-500">{mic.vendor} · {mic.type} · {mic.qty}× available</div>
      </div>

      {perspective === 'musician' && (
        <Section title="Character">
          <p className="text-sm text-zinc-300 leading-relaxed">{mic.character}</p>
          <div className="mt-2 space-y-0.5">
            <div className="text-xs text-zinc-500">Best for:</div>
            <div className="flex flex-wrap gap-1">
              {mic.best_for.map(b => (
                <span key={b} className="text-[10px] bg-amber-900/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-700/30">{b}</span>
              ))}
            </div>
          </div>
        </Section>
      )}

      {perspective === 'engineer' && (
        <>
          <Section title="Signal Chain Info">
            <Spec label="Output Z" value={`${mic.output_z_ohm} Ω`} />
            <Spec label="Sensitivity" value={`${mic.sensitivity_dbv} dBV`} />
            <Spec label="Gain Demand" value={`~${mic.gain_demand_db} dB`} />
            <Spec label="Patterns" value={mic.patterns.join(', ')} />
            <Spec label="Phantom" value={mic.phantom ? '48V required' : 'Not needed'} />
          </Section>
          <Section title="Best Applications">
            <div className="flex flex-wrap gap-1">
              {mic.best_for.map(b => (
                <span key={b} className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">{b}</span>
              ))}
            </div>
          </Section>
        </>
      )}

      {perspective === 'technical' && (
        <>
          <Section title="Electrical Specifications">
            <Spec label="Output Impedance" value={`${mic.output_z_ohm} Ω`} />
            {mic.resonant_z_ohm && <Spec label="Resonant Z" value={`${mic.resonant_z_ohm} Ω`} />}
            {mic.resonant_freq_hz && <Spec label="Resonant Freq" value={`${mic.resonant_freq_hz} Hz`} />}
            <Spec label="Sensitivity" value={`${mic.sensitivity_dbv} dBV/Pa`} />
            <Spec label="Patterns" value={mic.patterns.join(', ')} />
            <Spec label="Phantom Power" value={mic.phantom ? '48V DC' : 'None'} />
          </Section>
          <Section title="Engineering Notes">
            <p className="text-xs text-zinc-400 leading-relaxed">{mic.engineering}</p>
          </Section>
        </>
      )}

      {mic.heritage && (
        <Section title="Heritage">
          <p className="text-xs text-zinc-400 italic">{mic.heritage}</p>
        </Section>
      )}
    </div>
  );
}

function PreampInspector({ pre, perspective }: { pre: Preamp; perspective: Perspective }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-blue-300">{pre.name}</h3>
        <div className="text-xs text-zinc-500">{pre.vendor} · {pre.topology} · {pre.channels}ch</div>
      </div>

      {perspective === 'musician' && (
        <Section title="Character">
          <p className="text-sm text-zinc-300 leading-relaxed">{pre.character}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {pre.best_for.map(b => (
              <span key={b} className="text-[10px] bg-blue-900/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-700/30">{b}</span>
            ))}
          </div>
        </Section>
      )}

      {perspective === 'engineer' && (
        <>
          <Section title="Signal Chain">
            <Spec label="Input Z" value={`${pre.input_z_ohm} Ω`} />
            <Spec label="Output Z" value={`${pre.output_z_ohm} Ω`} />
            <Spec label="Gain Range" value={`${pre.gain_range_db[0]}–${pre.gain_range_db[1]} dB`} />
            <Spec label="Noise Floor" value={`${pre.noise_floor_db} dBu`} />
            <Spec label="Transformer" value={pre.has_transformer ? pre.transformer_model || 'Yes' : 'None'} />
          </Section>
          <Section title="Best Applications">
            <div className="flex flex-wrap gap-1">
              {pre.best_for.map(b => (
                <span key={b} className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">{b}</span>
              ))}
            </div>
          </Section>
        </>
      )}

      {perspective === 'technical' && (
        <>
          <Section title="Electrical Specifications">
            <Spec label="Input Impedance" value={`${pre.input_z_ohm} Ω`} />
            <Spec label="Output Impedance" value={`${pre.output_z_ohm} Ω`} />
            <Spec label="Gain Range" value={`${pre.gain_range_db[0]}–${pre.gain_range_db[1]} dB`} />
            <Spec label="EIN / Noise Floor" value={`${pre.noise_floor_db} dBu`} />
            <Spec label="Transformer" value={pre.has_transformer ? (pre.transformer_model || 'Yes') : 'Transformerless'} />
            <Spec label="EM Zone" value={pre.em_zone} />
          </Section>
          <Section title="Engineering Notes">
            <p className="text-xs text-zinc-400 leading-relaxed">{pre.engineering}</p>
          </Section>
        </>
      )}
    </div>
  );
}

function CompInspector({ comp, perspective }: { comp: Compressor; perspective: Perspective }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-purple-300">{comp.name}</h3>
        <div className="text-xs text-zinc-500">{comp.vendor} · {comp.topology} · {comp.channels}ch</div>
      </div>

      {perspective === 'musician' && (
        <Section title="Character">
          <p className="text-sm text-zinc-300 leading-relaxed">{comp.character}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {comp.best_for.map(b => (
              <span key={b} className="text-[10px] bg-purple-900/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/30">{b}</span>
            ))}
          </div>
        </Section>
      )}

      {perspective === 'engineer' && (
        <>
          <Section title="Compression Controls">
            <Spec label="Detection" value={comp.detection} />
            <Spec label="Ratios" value={comp.ratios} />
            <Spec label="Attack" value={comp.attack_range} />
            <Spec label="Release" value={comp.release_range} />
            <Spec label="EM Zone" value={comp.em_zone} />
          </Section>
          <Section title="Best Applications">
            <div className="flex flex-wrap gap-1">
              {comp.best_for.map(b => (
                <span key={b} className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">{b}</span>
              ))}
            </div>
          </Section>
        </>
      )}

      {perspective === 'technical' && (
        <>
          <Section title="Specifications">
            <Spec label="Detection" value={comp.detection} />
            <Spec label="Ratios" value={comp.ratios} />
            <Spec label="Sidechain" value={comp.sidechain ? 'Yes' : 'No'} />
            <Spec label="Link" value={comp.link ? 'Yes' : 'No'} />
            <Spec label="EM Zone" value={comp.em_zone} />
          </Section>
          <Section title="Engineering Notes">
            <p className="text-xs text-zinc-400 leading-relaxed">{comp.engineering}</p>
          </Section>
        </>
      )}
    </div>
  );
}

function EQInspector({ eq, perspective }: { eq: Equalizer; perspective: Perspective }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-teal-300">{eq.name}</h3>
        <div className="text-xs text-zinc-500">{eq.vendor} · {eq.topology} · {eq.channels}ch</div>
      </div>

      {perspective === 'musician' && (
        <Section title="Character">
          <p className="text-sm text-zinc-300 leading-relaxed">{eq.character}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {eq.best_for.map(b => (
              <span key={b} className="text-[10px] bg-teal-900/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-700/30">{b}</span>
            ))}
          </div>
        </Section>
      )}

      {perspective === 'engineer' && (
        <>
          <Section title="EQ Details">
            <Spec label="Bands" value={eq.bands} />
            <Spec label="Input Z" value={`${eq.input_z_ohm} Ω`} />
            <Spec label="Output Z" value={`${eq.output_z_ohm} Ω`} />
            <Spec label="Transformer" value={eq.has_transformer ? eq.transformer_model || 'Yes' : 'None'} />
            <Spec label="EM Zone" value={eq.em_zone} />
          </Section>
          <Section title="Best Applications">
            <div className="flex flex-wrap gap-1">
              {eq.best_for.map(b => (
                <span key={b} className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">{b}</span>
              ))}
            </div>
          </Section>
        </>
      )}

      {perspective === 'technical' && (
        <>
          <Section title="Electrical Specifications">
            <Spec label="Input Impedance" value={`${eq.input_z_ohm} Ω`} />
            <Spec label="Output Impedance" value={`${eq.output_z_ohm} Ω`} />
            <Spec label="Noise Floor" value={`${eq.noise_floor_db} dBu`} />
            <Spec label="Transformer" value={eq.has_transformer ? (eq.transformer_model || 'Yes') : 'Transformerless'} />
            <Spec label="EM Zone" value={eq.em_zone} />
          </Section>
          <Section title="Engineering Notes">
            <p className="text-xs text-zinc-400 leading-relaxed">{eq.engineering}</p>
          </Section>
        </>
      )}

      {eq.heritage && (
        <Section title="Heritage">
          <p className="text-xs text-zinc-400 italic">{eq.heritage}</p>
        </Section>
      )}
    </div>
  );
}

function OutboardInspector({ proc, perspective }: { proc: OutboardProcessor; perspective: Perspective }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-rose-300">{proc.name}</h3>
        <div className="text-xs text-zinc-500">{proc.vendor} · {proc.type} · {proc.format} · {proc.channels}ch</div>
      </div>

      {perspective === 'musician' && (
        <Section title="Character">
          <p className="text-sm text-zinc-300 leading-relaxed">{proc.character}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {proc.best_for.map(b => (
              <span key={b} className="text-[10px] bg-rose-900/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-700/30">{b}</span>
            ))}
          </div>
        </Section>
      )}

      {perspective === 'engineer' && (
        <>
          <Section title="Processor Details">
            <Spec label="Type" value={proc.type} />
            <Spec label="Format" value={proc.format} />
            <Spec label="Input Z" value={`${proc.input_z_ohm} Ω`} />
            <Spec label="Output Z" value={`${proc.output_z_ohm} Ω`} />
            <Spec label="Transformer" value={proc.has_transformer ? 'Yes' : 'None'} />
            <Spec label="EM Zone" value={proc.em_zone} />
          </Section>
          <Section title="Best Applications">
            <div className="flex flex-wrap gap-1">
              {proc.best_for.map(b => (
                <span key={b} className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">{b}</span>
              ))}
            </div>
          </Section>
        </>
      )}

      {perspective === 'technical' && (
        <>
          <Section title="Electrical Specifications">
            <Spec label="Input Impedance" value={`${proc.input_z_ohm} Ω`} />
            <Spec label="Output Impedance" value={`${proc.output_z_ohm} Ω`} />
            <Spec label="Noise Floor" value={`${proc.noise_floor_db} dBu`} />
            <Spec label="EM Zone" value={proc.em_zone} />
          </Section>
          <Section title="Engineering Notes">
            <p className="text-xs text-zinc-400 leading-relaxed">{proc.engineering}</p>
          </Section>
        </>
      )}

      {proc.heritage && (
        <Section title="Heritage">
          <p className="text-xs text-zinc-400 italic">{proc.heritage}</p>
        </Section>
      )}
    </div>
  );
}

function ZoneInspector({ zoneId }: { zoneId: string }) {
  const zone = roomZones.find(z => String(z.id) === zoneId);
  if (!zone) return null;
  const racks = rackPositions.filter(r => r.zone === zone.id);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: zone.color }} />
          <h3 className="text-lg font-bold text-zinc-200">{zone.name}</h3>
        </div>
        <div className="text-xs text-zinc-500">{zone.description}</div>
      </div>
      {zone.items.length > 0 && (
        <Section title="Equipment">
          {zone.items.map(item => (
            <div key={item} className="text-xs text-zinc-400">{item}</div>
          ))}
        </Section>
      )}
      {racks.length > 0 && (
        <Section title="Equipment Racks">
          {racks.map(r => (
            <div key={r.id} className="text-xs text-zinc-400">
              <span className="text-zinc-300 font-medium">{r.name}</span> — {r.subtitle}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

export default function ComponentInspector({ perspective, inspectedId, onClose }: Props) {
  if (!inspectedId) {
    return (
      <div className="p-4 text-sm text-zinc-500">
        Select a component or zone to inspect. Information adapts to your current perspective.
      </div>
    );
  }

  // Try to find the item across all registries
  const mic = microphones.find(m => m.id === inspectedId);
  const pre = preamps.find(p => p.id === inspectedId);
  const comp = compressors.find(c => c.id === inspectedId);
  const eq = equalizers.find(e => e.id === inspectedId);
  const outboard = outboardProcessors.find(o => o.id === inspectedId);
  const zone = roomZones.find(z => String(z.id) === inspectedId);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          {mic ? 'Microphone' : pre ? 'Preamp' : comp ? 'Compressor' : eq ? 'Equalizer' : outboard ? 'Outboard' : zone ? 'Room Zone' : 'Component'}
        </span>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-xs"
        >
          ✕ Close
        </button>
      </div>

      {mic && <MicInspector mic={mic} perspective={perspective} />}
      {pre && <PreampInspector pre={pre} perspective={perspective} />}
      {comp && <CompInspector comp={comp} perspective={perspective} />}
      {eq && <EQInspector eq={eq} perspective={perspective} />}
      {outboard && <OutboardInspector proc={outboard} perspective={perspective} />}
      {zone && <ZoneInspector zoneId={String(zone.id)} />}

      {!mic && !pre && !comp && !eq && !outboard && !zone && (
        <div className="text-sm text-zinc-500">Component not found: {inspectedId}</div>
      )}
    </div>
  );
}
