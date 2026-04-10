import type { ChainAnalysis, Microphone, Preamp, InsertProcessor, Perspective } from '../types/studio';

interface Props {
  perspective: Perspective;
  analysis: ChainAnalysis | null;
  selectedMic: Microphone | null;
  selectedPreamp: Preamp | null;
  insertChain: InsertProcessor[];
  onClearChain: () => void;
}

// ── Narrative generators ──
// These mine the actual equipment data to build perspective-specific insight.

function musicianNarrative(mic: Microphone, pre: Preamp, inserts: InsertProcessor[]): string[] {
  const lines: string[] = [];

  // Mic → preamp sonic character fusion
  lines.push(`Starting with the ${mic.name} — ${mic.character.split('.')[0].toLowerCase().trim()}. Into the ${pre.name}, which ${pre.character.split('.')[0].toLowerCase().trim()}.`);

  // What the combination creates
  const micIsWarm = /warm|thick|rich|weight|tube|vintage|mojo/i.test(mic.character);
  const preIsWarm = /warm|thick|rich|weight|tube|vintage|mojo/i.test(pre.character);
  const micIsClear = /clear|transparent|neutral|detailed|pristine|clean|accurate/i.test(mic.character);
  const preIsClear = /clear|transparent|neutral|detailed|pristine|clean|accurate/i.test(pre.character);
  const micIsColorful = /color|punch|aggressive|grit|character|bite|forward/i.test(mic.character);
  const preIsColorful = /color|punch|aggressive|grit|character|bite|forward/i.test(pre.character);

  if (micIsWarm && preIsWarm) {
    lines.push('This combination stacks warmth on warmth — expect a lush, harmonically rich signal with dimensional depth. Great when you want the recording to sound like a record from the first stage.');
  } else if (micIsClear && preIsClear) {
    lines.push('Both stages are transparent — the source will come through honest and uncolored. This chain lets the performance speak without editorial from the gear.');
  } else if (micIsWarm && preIsClear) {
    lines.push('The mic brings character and body while the preamp stays out of the way — the warmth is captured cleanly. You get the vintage texture without it becoming muddy or over-saturated.');
  } else if (micIsClear && preIsWarm) {
    lines.push('The mic captures detail faithfully, then the preamp wraps it in warmth — like shooting in high-res then applying a beautiful film stock. Definition with soul.');
  } else if (micIsColorful || preIsColorful) {
    lines.push('There\'s real personality in this chain — it\'s going to impart a sound of its own. Lean into it. This is gear that wants to be heard, not hidden.');
  } else {
    lines.push('A balanced pairing — neither stage dominates the other. The result should be musical and controlled with good tonal integrity.');
  }

  // Insert chain sonic story
  if (inserts.length > 0) {
    const insertNames = inserts.map(p => p.item.name);
    const insertCharacters = inserts.map(p => p.item.character.split('.')[0].toLowerCase().trim());

    if (inserts.length === 1) {
      lines.push(`Through the ${insertNames[0]} — ${insertCharacters[0]}. ${inserts[0].type === 'compressor' ? 'The dynamics processing will shape how the performance breathes and moves.' : inserts[0].type === 'equalizer' ? 'The EQ gives you tonal control before the signal hits the converter.' : 'The outboard processing adds a dimension that plugins can\'t quite replicate.'}`);
    } else {
      lines.push(`The insert chain runs through ${insertNames.join(' → ')}. Each stage adds its voice — ${insertCharacters.slice(0, 2).join(', then ')}. ${inserts.length >= 3 ? 'That\'s a lot of analog stages coloring the signal — this is going to have a very distinct, produced sound before it ever reaches the DAW.' : 'Two stages of analog processing gives you options without over-cooking.'}`);
    }
  }

  // Best-for synthesis
  const allBestFor = [mic.best_for, pre.best_for, ...inserts.map(p => p.item.best_for)];
  const freq = new Map<string, number>();
  allBestFor.flat().forEach(b => freq.set(b, (freq.get(b) || 0) + 1));
  const shared = [...freq.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  if (shared.length > 0) {
    lines.push(`Every piece here agrees on: ${shared.slice(0, 4).join(', ')}. That\'s where this chain will really shine.`);
  }

  return lines;
}

function engineerNarrative(mic: Microphone, pre: Preamp, inserts: InsertProcessor[], analysis: ChainAnalysis): string[] {
  const lines: string[] = [];

  // Impedance bridging practical note
  if (analysis.bridging_assessment === 'transparent') {
    lines.push(`Clean impedance match — ${mic.name} into ${pre.name} at ${analysis.bridging_ratio.toFixed(1)}:1. No coloration from the electrical interface.`);
  } else if (analysis.bridging_assessment === 'minimal') {
    lines.push(`Good impedance bridging at ${analysis.bridging_ratio.toFixed(1)}:1. Slight bass proximity interaction possible with ${mic.type === 'Ribbon' ? 'the ribbon\'s resonant impedance' : 'this mic'}, but well within professional norms.`);
  } else if (analysis.bridging_assessment === 'audible') {
    lines.push(`⚠ Impedance bridging at ${analysis.bridging_ratio.toFixed(1)}:1 is audibly coloring the signal. The ${mic.name} wants a higher-impedance input — you'll hear rolled-off highs and accentuated proximity effect. ${pre.input_z_ohm < 2000 ? 'If the preamp has a Hi-Z switch, try it.' : 'Consider this an intentional tonal choice if you like the color.'}`);
  } else {
    lines.push(`⚠ Significant impedance mismatch at ${analysis.bridging_ratio.toFixed(1)}:1. The ${mic.name} is being loaded heavily — expect substantial tonal alteration and possible transient smearing. This is a creative choice, not a transparent one.`);
  }

  // Gain staging
  const gainNeeded = mic.gain_demand_db;
  const gainAvail = pre.gain_range_db;
  if (gainNeeded > gainAvail[1] - 10) {
    lines.push(`⚠ Tight gain margin — the ${mic.name} demands ~${gainNeeded}dB and the ${pre.name} tops at ${gainAvail[1]}dB. On quiet sources, you may run out of clean gain. Consider padding or a quieter mic alternative.`);
  } else if (gainNeeded < gainAvail[0] + 5) {
    lines.push(`Gain-wise, the ${mic.name} is hot enough that you'll barely need the ${pre.name}'s gain — great for preserving headroom. Watch output levels on loud sources.`);
  } else {
    lines.push(`Clean gain range — ${mic.name} needs ~${gainNeeded}dB, the ${pre.name} delivers ${gainAvail[0]}–${gainAvail[1]}dB with room to spare.`);
  }

  // Transformer cascade awareness
  const xfmrCount = (pre.has_transformer ? 1 : 0) + inserts.filter(p => {
    if (p.type === 'equalizer') return p.item.has_transformer;
    if (p.type === 'outboard') return p.item.has_transformer;
    return false; // compressors — assume transformer for now
  }).length;

  if (xfmrCount >= 3) {
    lines.push(`${xfmrCount} transformer stages in this chain — that's a lot of iron. Expect cumulative saturation, bandwidth narrowing, and phase accumulation at HF. This is the "big analog" sound, but make sure it's intentional.`);
  } else if (xfmrCount === 2) {
    lines.push(`Two transformer stages — enough iron to add harmonic texture without excessive phase shift. A good balance of color and fidelity.`);
  }

  // Insert order wisdom
  if (inserts.length >= 2) {
    const hasComp = inserts.some(p => p.type === 'compressor');
    const hasEQ = inserts.some(p => p.type === 'equalizer');
    const compFirst = inserts.findIndex(p => p.type === 'compressor') < inserts.findIndex(p => p.type === 'equalizer');

    if (hasComp && hasEQ) {
      if (compFirst) {
        lines.push('Compressor before EQ — the dynamics are reacting to the raw signal. EQ changes won\'t affect compression behavior. Classic "fix it after you control it" approach.');
      } else {
        lines.push('EQ before compressor — the compressor reacts to your tonal shaping. Boosting frequencies will cause more compression in those bands. Use this intentionally for de-essing, presence control, or tonal compression.');
      }
    }
  }

  // Practical application
  const allBestFor = [mic.best_for, pre.best_for, ...inserts.map(p => p.item.best_for)];
  const freq = new Map<string, number>();
  allBestFor.flat().forEach(b => freq.set(b, (freq.get(b) || 0) + 1));
  const shared = [...freq.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  if (shared.length > 0) {
    lines.push(`Strengths overlap on: ${shared.slice(0, 5).join(', ')}. Build your session around those sources and this chain will deliver.`);
  }

  // EM zone awareness
  const zones = [pre.em_zone, ...inserts.map(p => {
    if (p.type === 'equalizer' || p.type === 'outboard') return p.item.em_zone;
    return p.item.em_zone;
  })];
  const zoneACount = zones.filter(z => z === 'A').length;
  if (zoneACount >= 2) {
    lines.push(`${zoneACount} pieces in EM Zone A — significant magnetic fields. Watch for hum pickup if these are racked close together. Consider physical separation or cable routing to minimize interference.`);
  }

  return lines;
}

function technicalNarrative(mic: Microphone, pre: Preamp, inserts: InsertProcessor[], analysis: ChainAnalysis): string[] {
  const lines: string[] = [];

  // Impedance analysis
  lines.push(`Impedance: Z_source=${mic.output_z_ohm}Ω → Z_load=${pre.input_z_ohm}Ω. Bridging ratio ${analysis.bridging_ratio.toFixed(2)}:1. Voltage transfer ${analysis.voltage_transfer_pct.toFixed(2)}% (${analysis.loss_db.toFixed(3)}dB loss).`);

  if (mic.resonant_z_ohm) {
    const resonantRatio = pre.input_z_ohm / mic.resonant_z_ohm;
    lines.push(`Resonant impedance: ${mic.resonant_z_ohm}Ω at ${mic.resonant_freq_hz}Hz. Effective bridging drops to ${resonantRatio.toFixed(1)}:1 at resonance — ${resonantRatio < 5 ? 'expect notable bass coloration from impedance loading' : 'within acceptable range'}.`);
  }

  // Cascaded noise analysis
  const stageCount = 1 + inserts.length; // preamp + inserts
  lines.push(`Signal path: ${stageCount} active stage${stageCount > 1 ? 's' : ''}. Cascaded noise floor: ${analysis.cumulative_noise_db.toFixed(1)}dBu. ${analysis.cumulative_noise_db < -120 ? 'Noise contribution negligible relative to mic self-noise.' : analysis.cumulative_noise_db < -110 ? 'Noise floor is professional-grade but approaching audibility on very quiet sources.' : 'Elevated noise floor — may be audible on quiet passages with high-gain settings.'}`);

  // Bandwidth and phase
  lines.push(`Effective bandwidth: ${analysis.effective_bw_khz.toFixed(1)}kHz (-3dB). Bandwidth shrinkage factor: ${analysis.bandwidth_shrinkage.toFixed(3)}×. Cumulative THD estimate: ${analysis.thd_estimate_pct.toFixed(4)}%.`);

  const xfmrCount = (pre.has_transformer ? 1 : 0) + inserts.filter(p => {
    if (p.type === 'equalizer') return p.item.has_transformer;
    if (p.type === 'outboard') return p.item.has_transformer;
    return false;
  }).length;

  lines.push(`Transformer count: ${xfmrCount}. Phase accumulation at 20kHz: ~${analysis.phase_shift_deg_20khz.toFixed(1)}°. ${xfmrCount >= 3 ? 'Multiple transformer stages will produce measurable group delay and HF rolloff — characteristic of heavily ironed analog chains.' : xfmrCount >= 1 ? 'Transformer coloration present but within single-stage norms.' : 'No transformer coloration — phase response remains linear.'}`);

  // Insert impedance chain
  if (inserts.length > 0) {
    const izNotes = inserts.map(p => {
      if (p.type === 'equalizer') return `${p.item.name}: Z_in=${p.item.input_z_ohm}Ω, Z_out=${p.item.output_z_ohm}Ω, noise=${p.item.noise_floor_db}dBu`;
      if (p.type === 'outboard') return `${p.item.name}: Z_in=${p.item.input_z_ohm}Ω, Z_out=${p.item.output_z_ohm}Ω, noise=${p.item.noise_floor_db}dBu`;
      return `${p.item.name}: (compressor — impedance specs not yet characterized)`;
    });
    lines.push(`Insert stages: ${izNotes.join(' → ')}.`);
  }

  // Analysis engine warnings/notes
  analysis.warnings.forEach(w => lines.push(`⚠️ ${w}`));
  analysis.notes.forEach(n => lines.push(n));

  return lines;
}

// ── Chain summary line ──
function chainSummary(mic: Microphone, pre: Preamp, inserts: InsertProcessor[]): string {
  const parts = [mic.name, pre.name, ...inserts.map(p => p.item.name)];
  return parts.join(' → ');
}

export default function AnalysisPanel({
  perspective, analysis, selectedMic, selectedPreamp, insertChain, onClearChain,
}: Props) {
  if (!analysis || !selectedMic || !selectedPreamp) {
    return (
      <div className="border-t border-zinc-800 bg-zinc-900/70 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {selectedMic ? `${selectedMic.name} selected — pick a preamp to analyze` : 'Select mic + preamp to see chain analysis'}
          </span>
          {(selectedMic || selectedPreamp || insertChain.length > 0) && (
            <button onClick={onClearChain} className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded px-2 py-0.5">
              Clear chain
            </button>
          )}
        </div>
      </div>
    );
  }

  const narrativeLines = perspective === 'musician'
    ? musicianNarrative(selectedMic, selectedPreamp, insertChain)
    : perspective === 'engineer'
    ? engineerNarrative(selectedMic, selectedPreamp, insertChain, analysis)
    : technicalNarrative(selectedMic, selectedPreamp, insertChain, analysis);

  const perspectiveLabels: Record<Perspective, string> = {
    musician: '🎵 What This Chain Sounds Like',
    engineer: '🎛️ Signal Chain Assessment',
    technical: '⚡ Electrical Analysis',
  };

  const perspectiveAccents: Record<Perspective, string> = {
    musician: 'border-amber-700/30 bg-amber-950/20',
    engineer: 'border-blue-700/30 bg-blue-950/20',
    technical: 'border-emerald-700/30 bg-emerald-950/20',
  };

  const textAccents: Record<Perspective, string> = {
    musician: 'text-amber-300',
    engineer: 'text-blue-300',
    technical: 'text-emerald-300',
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-900/70 px-4 py-3 space-y-3 max-h-64 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${textAccents[perspective]}`}>
            {perspectiveLabels[perspective]}
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">
            {chainSummary(selectedMic, selectedPreamp, insertChain)}
          </span>
        </div>
        <button onClick={onClearChain} className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded px-2 py-0.5">
          Clear chain
        </button>
      </div>

      {/* Warnings (always visible) */}
      {analysis.warnings.length > 0 && perspective !== 'technical' && (
        <div className="space-y-1">
          {analysis.warnings.map((w, i) => (
            <div key={i} className="text-[11px] text-yellow-300 bg-yellow-900/15 border border-yellow-700/25 rounded px-2 py-1">
              ⚠ {w}
            </div>
          ))}
        </div>
      )}

      {/* Narrative body */}
      <div className={`border rounded-lg p-3 space-y-2 ${perspectiveAccents[perspective]}`}>
        {narrativeLines.map((line, i) => (
          <p key={i} className={`text-sm leading-relaxed ${i === 0 ? textAccents[perspective] : 'text-zinc-300'}`}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
