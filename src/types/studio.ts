// ── Core type system for Studio Digital Twin ──

export type Perspective = 'engineer' | 'musician' | 'technical';
export type ViewMode = 'patchbay' | 'room' | 'chain';

export type MicType = 'Tube LDC' | 'FET LDC' | 'FET MDC' | 'FET SDC' | 'Ribbon' | 'Dynamic' | 'Boundary' | 'Measurement' | 'Subkick' | 'Field Recorder';
export type PolarPattern = 'omni' | 'cardioid' | 'hypercardioid' | 'supercardioid' | 'figure-8' | 'multi' | 'half-cardioid' | 'xy-stereo';
export type PreampTopology = 'all-valve' | 'hybrid-tube' | 'discrete-ss' | 'dc-coupled';
export type CompressorTopology =
  | 'variable-mu' | 'fet-tube' | 'fet-1176' | 'optical'
  | 'vca-channel' | 'vca-bus' | 'diode-bridge' | 'zener'
  | 'discrete-transistor' | 'de-esser' | 'spectral' | 'gate'
  | 'ss-limiter' | 'multiband';
export type EQTopology = 'passive-inductor' | 'active-inductor' | 'parametric' | 'tilt' | 'tube-reactive';
export type OutboardType = 'reverb' | 'delay' | 'multi-fx' | 'enhancement' | 'width' | 'utility';
export type ConverterType = 'ADC' | 'DAC' | 'ADDA';
export type EMZone = 'A' | 'B' | 'C';

export interface FreqPoint { hz: number; mag_db: number; phase_deg?: number; }

export interface Microphone {
  id: string;
  name: string;
  vendor: string;
  qty: number;
  type: MicType;
  patterns: PolarPattern[];
  sensitivity_dbv: number;
  output_z_ohm: number;
  resonant_z_ohm?: number;
  resonant_freq_hz?: number;
  gain_demand_db: number;
  phantom: boolean;
  fr_curve?: FreqPoint[];
  heritage: string;
  character: string;       // musician-facing
  engineering: string;     // technical-facing
  best_for: string[];      // engineer-facing
}

export interface Preamp {
  id: string;
  name: string;
  vendor: string;
  channels: number;
  topology: PreampTopology;
  input_z_ohm: number;
  input_z_hi?: number;     // switchable high-Z mode
  output_z_ohm: number;
  gain_range_db: [number, number];
  max_output_dbu: number;
  noise_floor_db: number;
  has_transformer: boolean;
  transformer_model?: string;
  eq_features?: string;
  rack_units: number;
  em_zone: EMZone;
  heritage?: string;
  character: string;
  engineering: string;
  best_for: string[];
}

export interface Compressor {
  id: string;
  name: string;
  vendor: string;
  channels: number;
  topology: CompressorTopology;
  detection: string;
  attack_range: string;
  release_range: string;
  ratios: string;
  threshold: string;
  sidechain: boolean;
  link: boolean;
  rack_units: number;
  em_zone: EMZone;
  character: string;
  engineering: string;
  best_for: string[];
}

export interface Converter {
  id: string;
  name: string;
  vendor: string;
  type: ConverterType;
  channels: number;
  dynamic_range_db: number;
  sample_rates: number[];
  bit_depths: number[];
  clocking: string;
  rack_units: number;
  em_zone: EMZone;
  character: string;
  engineering: string;
}

export interface SummingUnit {
  id: string;
  name: string;
  vendor: string;
  inputs: number;
  outputs: number;
  rack_units: number;
  character: string;
  engineering: string;
}

export interface Monitor {
  id: string;
  name: string;
  vendor: string;
  type: 'main' | 'mid' | 'near' | 'sub' | 'mono';
  powered: boolean;
  character: string;
}

export interface Equalizer {
  id: string;
  name: string;
  vendor: string;
  channels: number;
  topology: EQTopology;
  bands: string;
  has_transformer: boolean;
  transformer_model?: string;
  input_z_ohm: number;
  output_z_ohm: number;
  noise_floor_db: number;
  rack_units: number;
  em_zone: EMZone;
  heritage?: string;
  character: string;
  engineering: string;
  best_for: string[];
}

export interface OutboardProcessor {
  id: string;
  name: string;
  vendor: string;
  channels: number;
  type: OutboardType;
  format: 'analog' | 'digital' | 'hybrid';
  has_transformer: boolean;
  input_z_ohm: number;
  output_z_ohm: number;
  noise_floor_db: number;
  rack_units: number;
  em_zone: EMZone;
  heritage?: string;
  character: string;
  engineering: string;
  best_for: string[];
}

export type InsertProcessor =
  | { type: 'compressor'; item: Compressor }
  | { type: 'equalizer'; item: Equalizer }
  | { type: 'outboard'; item: OutboardProcessor };

export type StudioComponent = Microphone | Preamp | Compressor | Equalizer | OutboardProcessor | Converter | SummingUnit | Monitor;

export interface RoomZone {
  id: number;
  name: string;
  description: string;
  color: string;
  items: string[];
}

export interface RackPosition {
  id: string;
  zone: number;
  name: string;
  subtitle: string;
  format: string;
  items: string[];
  note: string;
}

export interface PatchRow {
  id: string;
  label: string;
  order: number;
  normalled_to?: string;
  half_normal?: boolean;
  category: 'signal-path' | 'outboard-pool' | 'summing' | 'digital';
  description: string;
}

export interface ChainNode {
  component_id: string;
  component_type: 'microphone' | 'preamp' | 'compressor' | 'equalizer' | 'outboard' | 'converter' | 'summing';
  gain_db?: number;
}

export interface ChainAnalysis {
  bridging_ratio: number;
  bridging_assessment: 'transparent' | 'minimal' | 'audible' | 'significant';
  voltage_transfer_pct: number;
  loss_db: number;
  cumulative_noise_db: number;
  bandwidth_shrinkage: number;
  effective_bw_khz: number;
  thd_estimate_pct: number;
  phase_shift_deg_20khz: number;
  warnings: string[];
  notes: string[];
}

export interface Session {
  id: string;
  title: string;
  date: string;
  chain: ChainNode[];
  analysis: ChainAnalysis | null;
  notes: string;
}
