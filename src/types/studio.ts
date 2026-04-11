// ── Core type system for Signal Atlas ──

export type Perspective = 'engineer' | 'musician' | 'technical';

export type MicType = 'Tube LDC' | 'FET LDC' | 'FET MDC' | 'FET SDC' | 'Ribbon' | 'Dynamic' | 'Boundary' | 'Measurement' | 'Subkick' | 'Field Recorder';
export type PolarPattern = 'omni' | 'cardioid' | 'hypercardioid' | 'supercardioid' | 'figure-8' | 'multi' | 'half-cardioid' | 'xy-stereo';
export type PreampTopology = 'all-valve' | 'hybrid-tube' | 'discrete-ss' | 'dc-coupled';
export type CompressorTopology =
  | 'variable-mu' | 'fet-tube' | 'fet-1176' | 'optical'
  | 'vca-channel' | 'vca-bus' | 'diode-bridge' | 'zener'
  | 'discrete-transistor' | 'de-esser' | 'spectral' | 'gate'
  | 'ss-limiter' | 'multiband';
export type EQTopology = 'passive-inductor' | 'active-inductor' | 'parametric' | 'tilt' | 'tube-reactive';
export type OutboardType = 'reverb' | 'delay' | 'multi-fx' | 'spatial' | 'harmonic' | 'utility';
export type OutboardRoutingMode = 'parallel-send-return' | 'inline-optional';
export type ConverterType = 'ADC' | 'DAC' | 'ADDA';
export type EMZone = 'A' | 'B' | 'C';
export type SignalDomain = 'mic' | 'line' | 'instrument' | 'speaker' | 'digital-audio' | 'digital-clock' | 'control';
export type RouteStatus = 'incomplete' | 'default' | 'custom' | 'experimental' | 'warning';

export interface FreqPoint { hz: number; mag_db: number; phase_deg?: number; }

export interface DescriptiveMetadata {
  context_tags?: string[];
  tendencies?: string[];
  tradeoffs?: string[];
  workflow_implications?: string[];
}

export interface Microphone extends DescriptiveMetadata {
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
  best_for: string[];      // legacy context tags; descriptive, not prescriptive
}

export interface Preamp extends DescriptiveMetadata {
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
  best_for: string[];      // legacy context tags; descriptive, not prescriptive
}

export interface Compressor extends DescriptiveMetadata {
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
  best_for: string[];      // legacy context tags; descriptive, not prescriptive
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

export interface Equalizer extends DescriptiveMetadata {
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
  best_for: string[];      // legacy context tags; descriptive, not prescriptive
}

export interface OutboardProcessor extends DescriptiveMetadata {
  id: string;
  name: string;
  vendor: string;
  channels: number;
  type: OutboardType;
  routing_mode: OutboardRoutingMode;
  format: 'analog' | 'digital' | 'hybrid';
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
  best_for: string[];      // legacy context tags; descriptive, not prescriptive
}

export type InsertProcessor =
  | { type: 'compressor'; item: Compressor }
  | { type: 'equalizer'; item: Equalizer }
  | { type: 'preamp-eq'; item: Preamp }
  | { type: 'outboard'; item: OutboardProcessor };

export type ParallelSendSourceId = 'api-insert-send-1' | 'api-mix-a-insert-send' | 'api-mix-b-insert-send';
export type ParallelReturnDestinationId = 'tonelux-otb-input' | 'api-mix-b-return' | 'api-insert-return-1';

export interface ParallelSendSourceOption {
  id: ParallelSendSourceId;
  label: string;
  description: string;
}

export interface ParallelReturnDestinationOption {
  id: ParallelReturnDestinationId;
  label: string;
  description: string;
  blend_stage: 'tonelux-otb' | 'direct-return';
  exclusive: boolean;
}

export interface ParallelRouting {
  send_source_id: ParallelSendSourceId;
  send_source_label: string;
  return_destination_id: ParallelReturnDestinationId;
  return_destination_label: string;
  blend_stage: 'tonelux-otb' | 'direct-return';
}

export type ParallelProcessorDraft =
  | { type: 'compressor'; item: Compressor }
  | { type: 'outboard'; item: OutboardProcessor };

export type ParallelProcessor = ParallelProcessorDraft & {
  routing: ParallelRouting;
};

export type ParallelProcessorInput = ParallelProcessorDraft | ParallelProcessor;

export type StudioComponent = Microphone | Preamp | Compressor | Equalizer | OutboardProcessor | Converter | SummingUnit | Monitor;

export interface PatchRow {
  id: string;
  label: string;
  order: number;
  normalled_to?: string;
  half_normal?: boolean;
  category: 'signal-path' | 'outboard-pool' | 'summing' | 'digital';
  description: string;
}

export interface PatchEndpoint {
  id: string;
  label: string;
  row_id?: string;
  component_id?: string;
  channel?: number;
  kind: 'source' | 'destination' | 'insert-send' | 'insert-return' | 'bus' | 'tie-line' | 'converter';
  domain: SignalDomain;
  normalled_to?: string;
  half_normal?: boolean;
}

export interface PatchConnection {
  id: string;
  from_endpoint_id: string;
  to_endpoint_id: string;
  mode: 'normalled' | 'patched' | 'derived';
  active: boolean;
}

export interface PatchGraphModel {
  endpoints: PatchEndpoint[];
  connections: PatchConnection[];
}

export interface RouteValidationIssue {
  code:
    | 'missing-source'
    | 'missing-preamp'
    | 'broken-route'
    | 'routing-loop'
    | 'insert-chain-depth'
    | 'parallel-source-missing'
    | 'parallel-destination-missing'
    | 'parallel-return-conflict'
    | 'parallel-path-unreachable';
  severity: 'info' | 'warning' | 'blocked';
  message: string;
  suggested_action?: string;
}

export interface RouteStageSummary {
  id: string;
  label: string;
  type: ChainNode['component_type'] | 'insert-chain';
  detail?: string;
}

export interface ViabilityFlag {
  level: 'ok' | 'caution' | 'blocked';
  reason: string;
}

export interface RouteSummaryModel {
  status: RouteStatus;
  headline: string;
  viability_flag: ViabilityFlag;
  gain_margin_summary?: string;
  validation_issues: RouteValidationIssue[];
  active_path: RouteStageSummary[];
  parallel_paths: RouteStageSummary[][];
  deviations: string[];
  available_next_actions: string[];
}

export interface PerspectiveInsightModel {
  perspective: Perspective;
  summary: string;
  warnings: string[];
  notes: string[];
}

export interface PlacementRiskModel {
  component_id: string;
  zone?: number;
  status: 'stable' | 'watch' | 'risky';
  summary: string;
  warnings: string[];
  workflow_notes: string[];
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
