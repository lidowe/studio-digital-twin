import type { Converter, SummingUnit, Monitor, RoomZone, RackPosition, PatchRow } from '../types/studio';

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

export const roomZones: RoomZone[] = [
  { id: 1, name: 'Zone 1 — Ears', description: 'Conversion & monitoring. Arm\'s reach from listening position.', color: '#61afef', items: ['Dangerous D-Box+', 'Dangerous AD+', 'Lynx Aurora(n)', 'Tascam Studio Bridge', 'Wordclock chain', 'Talkback/meters'] },
  { id: 2, name: 'Zone 2 — Mix Bus', description: 'Summing & stereo processing. Chair-roll distance.', color: '#e5c07b', items: ['Pueblo HJ482', 'Tonelux OTB', 'API ASM164', 'Drawmer 1973', 'Pendulum PL-2', 'Drawmer 1968 MKII'] },
  { id: 3, name: 'Zone 3 — Prep', description: 'Preamps, patchbay, dynamics, key EQ. 90° turn from listening.', color: '#98c379', items: ['The Tower (19 preamp units)', 'The Bay (patchbay hub)', 'The Channel (dynamics + EQ)'] },
  { id: 4, name: 'Zone 4 — Digital', description: 'Computer, screen, TB3. Off-axis left.', color: '#c678dd', items: ['Computer', 'Display (off-axis)', 'ISO1000', 'Second breaker'] },
  { id: 5, name: 'Zone 5 — Machine Room', description: 'PSUs, amplifiers, power conditioning. Floor & crawl space.', color: '#d19a66', items: ['Bryston 3B-ST', 'Altec 9444A', 'Bryston Power Pad 60', 'Tube mic PSUs', 'External preamp PSUs', 'Balanced power transformer'] },
  { id: 6, name: 'Zone 6 — Outer Ring', description: 'Digital FX, specialty gear, EQ, width/stereo, set-and-forget.', color: '#56b6c2', items: ['TC M300', 'TC M3000', 'Kurzweil Eclipse', 'Roland SRV-3030', 'Roland SRV-330', 'Peavey Kosmos Pro', 'Behringer V-Verb Pro', 'Furman Punch 10', 'Dolby 740 ×2', 'Langevin MMP', 'Retro 2A3', 'Iron Age V2', 'Chandler Tone Control ×2', 'Tonelux Equalux', 'Tonelux Tilt EQ ×2', 'Drawmer 1976', 'Bedini BASE', 'Behringer Edison'] },
];

export const rackPositions: RackPosition[] = [
  { id: 'ears', zone: 1, name: 'Ears Shelf', subtitle: 'Left trap/table — arm\'s reach', format: 'Desktop shelf', items: ['Dangerous D-Box+ (1U) — system gatekeeper', 'Dangerous AD+ (1U) — final A/D stage', 'Lynx Aurora(n) (1U) — primary converter', 'Tascam Studio Bridge (1U) — secondary converter', 'Wordclock: Aurora → AD+ → D-Box+ (inches)', 'DB25: Aurora ↔ Bay (same wall, short run)', 'TB3 optical → crosses to computer (right side)', 'Talkback / meters'], note: 'All four converters together. Wordclock chain is inches. DB25 runs straight down the wall to the Bay. Only TB3 optical crosses the room — immune to interference.' },
  { id: 'mixbus', zone: 2, name: 'Mix Bus', subtitle: 'Position 0 — top of prep aisle', format: '16 RU casters', items: ['— SUMMING CASCADE —', 'Pueblo HJ482 (2U) — 32-input summing', '↓', 'Tonelux OTB (2U) — summing + tone', '↓', 'API ASM164 (4U) — master summing w/ inserts', '— STEREO BUS —', 'Drawmer 1973 (2U) — multiband compressor', 'Pendulum PL-2 (2U) — brickwall limiter (pre-A/D)', 'Drawmer 1968 MKII (2U) — tube comp'], note: 'Top of aisle, output goes inches up to D-Box+ on shelf. Inputs from Bay via cables behind rack line.' },
  { id: 'tower', zone: 3, name: 'The Tower', subtitle: 'Position 1 — all preamps', format: '20-24 RU casters', items: ['— ALL-VALVE (top) —', 'Manley Dual Mono (2U)', 'Thermionic Rooster 2 (2U)', 'A-Designs MP-2A (2U)', '— HYBRID TUBE —', 'Pendulum Quartet II (2U) — split-access', 'Sonic Farm Creamer+ (1U)', 'Evil Twin #1 Jensen (desktop)', 'Evil Twin #2 Jensen (desktop)', '— DISCRETE SS —', 'Stam SA-69 / Helios Type 69 (2U)', 'API 3122V (1U)', 'Chandler Germanium Pre #1 (2U)', 'Chandler Germanium Pre #2 (2U)', 'A-Designs Ventura SE (2U) — 3-in/3-out', 'Wunder PEQ2R (2U) — inductor EQ', 'Wunder PEQ2/4R (2U) — 4-band inductor EQ', 'NPNG DMP-2NW (1U)', 'Tonelux MP5A in 503HR (1U)', '— DC-COUPLED —', 'Pueblo JR2/2 (2U)', 'Undertone MPEQ-1 #1 (2U) — SEP mode', 'Undertone MPEQ-1 #2 (2U) — SEP mode'], note: 'All 19 preamp units, 26 channels. Tube at top. External PSUs in crawl space — DC through knee wall.' },
  { id: 'bay', zone: 3, name: 'The Bay', subtitle: 'Position 2 — patchbay hub', format: '12-16 RU casters', items: ['Redco R196-D25PG ×4 (8U + 4U spacing)', '2/3 RU spacing for hand + DSub access', 'Mamba tie line termination panel', 'DB25 up to Aurora(n) on shelf (same wall)', 'DB25 up to Tower (Pos 1)'], note: 'Central hub. Every cable originates or terminates here.' },
  { id: 'channel', zone: 3, name: 'The Channel', subtitle: 'Position 3 — dynamics + key EQ', format: '16-20 RU casters', items: ['— VARIABLE-MU —', 'Retro 176 (3U) ⚠ Zone A', 'Retro STA-Level Gold (2U) ⚠ Zone A', 'Retro Revolver (2U) ⚠ Zone A', '— FET 1176 —', 'Mohog MoFET 76 (2U)', 'Wes Audio Beta76 #1 (2U)', 'Wes Audio Beta76 #2 (2U)', '— OPTICAL —', 'ADL-1000 (2U)', 'Audioscape DA-3A (2U)', '— VCA CHANNEL —', 'dbx 160XT #1 xfmr mod (1U)', 'dbx 160XT #2 xfmr mod (1U)', 'dbx 160VU (2U)', '— VCA BUS —', 'Audioscape 4000E (2U) — SSL 4000E', 'Audioscape G-Comp (2U) — SSL G-series', '— DIODE BRIDGE —', 'Audioscape MK-609 (2U) — Neve 33609', '— ZENER/OTHER —', 'Audioscape D-Comp (1U) — EMI TG12413', 'Tonelux Dynalux (2U) — discrete blendable', 'Drawmer 1968 MKII (2U) — hybrid FET-tube', '— UTILITY —', 'dbx 902 ×2 in 900 rack — de-esser', 'Drawmer DS201 (1U) — gate'], note: 'All dynamics processing. Zone A units (Retro) at bottom of rack, furthest from sensitive gear.' },
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
  { id: 'row-fx', label: 'FX / Outboard', order: 9, category: 'outboard-pool', description: 'Reverbs, multi-FX, enhancement. FX outputs normal to Tonelux OTB → API Mix B return.' },

  // ── SUMMING & MONITORING ──
  { id: 'row-api-mix', label: 'API Mix Buses', order: 10, category: 'summing', description: 'Mix A: tracking sum → AD+ input #1. Mix B: FX/overflow return via Tonelux OTB → Mix B insert return.' },
  { id: 'row-pueblo', label: 'Pueblo HJ482 / Tonelux OTB', order: 11, category: 'summing', description: 'Pueblo: 32 inputs, 4 banks of 8 → sum to Bank D stereo out (optional transformer) → AD+ input #2. Tonelux: FX/overflow summing → API Mix B return.' },
  { id: 'row-ad-daw', label: 'Dangerous AD+ → DAW', order: 12, category: 'digital', description: 'AD+ input #1: API Mix A (tracking). AD+ input #2: Pueblo Bank D (mixing). Digital output → Aurora(n) → DAW via TB3.' },
];
