import type { Converter, SummingUnit, Monitor, PatchRow } from '../types/studio';

export const converters: Converter[] = [
  {
    id: 'conv-dangerous-dbox',
    name: 'Dangerous D-Box+',
    vendor: 'Dangerous Music',
    type: 'DAC',
    channels: 8,
    dynamic_range_db: 118,
    sample_rates: [44100, 48000, 88200, 96000, 176400, 192000],
    bit_depths: [16, 24],
    clocking: 'Wordclock slave (from Aurora). Monitor controller + summing.',
    rack_units: 1,
    em_zone: 'B',
    character: 'System gatekeeper. Everything you hear passes through this. Monitor controller + D/A + analog summing in one.',
    engineering: 'DA output stage drives the monitor path. Any interference here contaminates every listening decision. Wordclock chain: Aurora → AD+ → D-Box+ (inches of cable).',
  },
  {
    id: 'conv-dangerous-adplus',
    name: 'Dangerous AD+',
    vendor: 'Dangerous Music',
    type: 'ADC',
    channels: 2,
    dynamic_range_db: 121,
    sample_rates: [44100, 48000, 88200, 96000, 176400, 192000],
    bit_depths: [16, 24],
    clocking: 'Wordclock slave (from Aurora). Final A/D stage.',
    rack_units: 1,
    em_zone: 'B',
    character: 'The point of no return. Mastering-grade A/D conversion. Resolves signals below −1µV.',
    engineering: 'Analog input stage resolves below −1µV. 121+ dB dynamic range. Any interference is permanently digitized. The most critical analog engineering point in the studio.',
  },
  {
    id: 'conv-lynx-aurora',
    name: 'Lynx Aurora(n)',
    vendor: 'Lynx Studio Technology',
    type: 'ADDA',
    channels: 16,
    dynamic_range_db: 120,
    sample_rates: [44100, 48000, 88200, 96000, 176400, 192000],
    bit_depths: [16, 24, 32],
    clocking: 'Wordclock master. TB3 optical to computer.',
    rack_units: 1,
    em_zone: 'B',
    character: 'Primary multi-channel converter. Wordclock master for the entire studio.',
    engineering: 'TB3 controller at 40Gbps creates RF. SMPS cycling at 50–500kHz. Wordclock master — clock jitter performance is critical. TB3 optical crosses room to computer (immune to EM).',
  },
  {
    id: 'conv-tascam-studio-bridge',
    name: 'Tascam Studio Bridge',
    vendor: 'Tascam',
    type: 'ADDA',
    channels: 8,
    dynamic_range_db: 110,
    sample_rates: [44100, 48000, 88200, 96000],
    bit_depths: [16, 24],
    clocking: 'Wordclock slave.',
    rack_units: 1,
    em_zone: 'B',
    character: 'Secondary/utility converter. Additional I/O for overflow or independent monitoring paths.',
    engineering: 'ADDA converter providing supplementary channels beyond the Aurora(n). Wordclock slave in the studio clock chain.',
  },
];

export const summingUnits: SummingUnit[] = [
  {
    id: 'sum-pueblo-hj482',
    name: 'Pueblo HJ482',
    vendor: 'Pueblo Audio',
    inputs: 32,
    outputs: 2,
    rack_units: 2,
    character: '32-input passive summing. Top of the summing cascade. Clean and wide.',
    engineering: 'Passive summing network — no active electronics in signal path. Feeds Tonelux OTB.',
  },
  {
    id: 'sum-tonelux-otb',
    name: 'Tonelux OTB',
    vendor: 'Tonelux',
    inputs: 16,
    outputs: 2,
    rack_units: 2,
    character: 'Summing with tone. Adds analog character to the summed signal.',
    engineering: 'Active summing with tonal controls. Receives from HJ482, feeds API ASM164.',
  },
  {
    id: 'sum-api-asm164',
    name: 'API ASM164',
    vendor: 'API',
    inputs: 16,
    outputs: 2,
    rack_units: 4,
    character: 'Master summing with inserts. The final analog stage before stereo processing. API iron.',
    engineering: 'Active summing amplifier with insert points for stereo bus processing. API 2520 op-amps. Transformer-coupled output.',
  },
];

export const monitors: Monitor[] = [
  { id: 'mon-hedd-type20', name: 'HEDD Type 20 MKII', vendor: 'HEDD', type: 'main', powered: true, character: 'Main monitors flanking window. AMT (Air Motion Transformer) tweeter gives extended, detailed highs. Internal ICEpower Class D amps.' },
  { id: 'mon-hedd-sub8', name: 'HEDD Sub 8', vendor: 'HEDD', type: 'sub', powered: true, character: 'Centered below/between HEDDs. Extends low-frequency monitoring.' },
  { id: 'mon-ns10', name: 'Yamaha NS-10', vendor: 'Yamaha', type: 'near', powered: false, character: 'The near-field reference. If it sounds good on NS-10s, it sounds good everywhere. Positioned inside the HEDDs.' },
  { id: 'mon-auratone', name: 'Auratone 5C', vendor: 'Auratone', type: 'mono', powered: false, character: 'Single mono reference. "The Horror Box." If the vocal cuts through this, it cuts through anything.' },
];

export const patchRows: PatchRow[] = [
  // ── TRACKING CHAIN (top → bottom, normalled) ──
  { id: 'row-mic-ties', label: 'Mic Tie Lines', order: 1, normalled_to: 'row-preamp-in', category: 'signal-path', description: 'Mamba tie lines from tracking room/studio floor. Each point corresponds to a mic position.' },
  { id: 'row-preamp-in', label: 'Preamp Inputs', order: 2, category: 'signal-path', description: 'Input to the Tower. Normalled from mic ties. Break normal to route from other sources.' },
  { id: 'row-preamp-out', label: 'Preamp Outputs', order: 3, normalled_to: 'row-api-line-in', category: 'signal-path', description: 'Output of each preamp channel. Normalled to API ASM164 line inputs.' },
  { id: 'row-api-line-in', label: 'API ASM164 Line Inputs', order: 4, category: 'signal-path', description: 'Ch 1–16 line inputs on the API ASM164. Receives preamp outputs via normalling.' },
  { id: 'row-insert-send', label: 'API Insert Sends', order: 5, half_normal: true, category: 'signal-path', description: 'Half-normalled tap points on API ch 1–16 plus Mix A and Mix B bus inserts. Signal passes through unless a patch is made.' },
  { id: 'row-insert-return', label: 'API Insert Returns', order: 6, category: 'signal-path', description: 'Returns from outboard processing to API ch 1–16 plus Mix A and Mix B buses. Replaces the direct signal when patched.' },

  // ── OUTBOARD POOL (not signal path — available gear for insert patching) ──
  { id: 'row-dynamics', label: 'Dynamics Rack', order: 7, category: 'outboard-pool', description: 'The Channel rack — all compressors, limiters, gates. Patch between insert sends and returns.' },
  { id: 'row-eq', label: 'EQ Rack', order: 8, category: 'outboard-pool', description: 'All equalizers. Patch between insert sends and returns. Langevin MMP, Retro 2A3, Iron Age V2, Chandler Tone Control ×2, Tonelux Equalux, Tilt EQ ×2.' },
  { id: 'row-spatial', label: 'Spatial / Harmonic Outboard', order: 9, category: 'outboard-pool', description: 'Patch-in inline processors such as stereo wideners and low-end harmonic enhancers. No static normal destination; use only where needed on stereo tracks, groups, or full mixes.' },
  { id: 'row-fx', label: 'Time-Based FX Returns', order: 10, category: 'outboard-pool', description: 'Reverbs and multi-FX generally run as parallel wet processors. Parallel feeds are broader than FX, but this row focuses on send-fed ambience returns through Tonelux OTB → API Mix B return.' },

  // ── SUMMING & MONITORING ──
  { id: 'row-api-mix', label: 'API Mix Buses', order: 11, category: 'summing', description: 'Mix A: tracking sum → AD+ input #1. Mix B: stereo bus and return point for wet FX, overflow, or other parallel-fed material returned from the Tonelux OTB.' },
  { id: 'row-pueblo', label: 'Pueblo HJ482 / Tonelux OTB', order: 12, category: 'summing', description: 'Pueblo: 32 inputs, 4 banks of 8 → sum to Bank D stereo out (optional transformer) → AD+ input #2. Tonelux: aggregate wet FX returns and overflow summing → API Mix B return.' },
  { id: 'row-ad-daw', label: 'Dangerous AD+ → DAW', order: 13, category: 'digital', description: 'AD+ input #1: API Mix A (tracking). AD+ input #2: Pueblo Bank D (mixing). Digital output → Aurora(n) → DAW via TB3.' },
];
