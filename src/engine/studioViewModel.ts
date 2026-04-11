import type {
  ChainAnalysis,
  Compressor,
  Equalizer,
  InsertProcessor,
  Microphone,
  OutboardProcessor,
  ParallelProcessor,
  Perspective,
  PerspectiveInsightModel,
  Preamp,
  RouteStageSummary,
  RouteSummaryModel,
  RouteValidationIssue,
} from '../types/studio';

type DescribedComponent = Microphone | Preamp | Compressor | Equalizer | OutboardProcessor;

export function getContextTags(component: DescribedComponent): string[] {
  if (component.context_tags && component.context_tags.length > 0) {
    return component.context_tags;
  }

  return component.best_for;
}

function buildActivePath(
  mic: Microphone | null,
  preamp: Preamp | null,
  inserts: InsertProcessor[]
): RouteStageSummary[] {
  const path: RouteStageSummary[] = [];

  if (mic) {
    path.push({
      id: mic.id,
      label: mic.name,
      type: 'microphone',
      detail: `${mic.type} source`,
    });
  }

  if (preamp) {
    path.push({
      id: preamp.id,
      label: preamp.name,
      type: 'preamp',
      detail: `${preamp.topology} preamp`,
    });
  }

  if (inserts.length > 0) {
    path.push({
      id: 'insert-chain',
      label: inserts.map((insert) => insert.item.name).join(' -> '),
      type: 'insert-chain',
      detail: `${inserts.length} analog stage${inserts.length === 1 ? '' : 's'}`,
    });
  }

  return path;
}

function buildParallelPaths(parallelProcessors: ParallelProcessor[]): RouteStageSummary[][] {
  return parallelProcessors.map((processor, index) => ([
    {
      id: `parallel-send-${index}`,
      label: processor.routing.send_source_label,
      type: 'insert-chain',
      detail: index === 0 ? 'Parallel tap from the direct path' : `Parallel tap ${index + 1}`,
    },
    {
      id: processor.item.id,
      label: processor.item.name,
      type: processor.type === 'compressor' ? 'compressor' : 'outboard',
      detail: processor.type === 'compressor' ? 'Parallel dynamics branch' : 'Parallel effects or color branch',
    },
    {
      id: `parallel-return-${index}`,
      label: processor.routing.return_destination_label,
      type: 'insert-chain',
      detail: processor.routing.blend_stage === 'tonelux-otb'
        ? 'Aggregated and blended back through Tonelux OTB → Mix B'
        : 'Returned directly to a blend destination',
    },
  ]));
}

function buildGainMarginSummary(mic: Microphone | null, preamp: Preamp | null): string | undefined {
  if (!mic || !preamp) return undefined;

  const margin = preamp.gain_range_db[1] - mic.gain_demand_db;
  if (margin < 0) return `${Math.abs(margin).toFixed(0)}dB short of clean gain at maximum setting`;
  if (margin <= 5) return `${margin.toFixed(0)}dB headroom remaining — tight margin on quiet sources`;
  if (margin <= 15) return `${margin.toFixed(0)}dB headroom remaining — workable with moderate care`;
  return `${margin.toFixed(0)}dB headroom remaining — comfortable gain range`;
}

export function buildRouteSummary(
  mic: Microphone | null,
  preamp: Preamp | null,
  inserts: InsertProcessor[],
  parallelProcessors: ParallelProcessor[],
  analysis: ChainAnalysis | null,
  validationIssues: RouteValidationIssue[] = []
): RouteSummaryModel {
  const active_path = buildActivePath(mic, preamp, inserts);
  const parallel_paths = buildParallelPaths(parallelProcessors);
  const primaryValidationIssue = validationIssues.find((issue) => issue.severity === 'blocked')
    ?? validationIssues.find((issue) => issue.severity === 'warning');

  if (!mic && !preamp) {
    return {
      status: 'incomplete',
      headline: 'No route selected yet',
      viability_flag: {
        level: 'blocked',
        reason: 'A source and destination need to be chosen before the route can be evaluated.',
      },
      validation_issues: validationIssues,
      active_path,
      parallel_paths,
      deviations: [],
      available_next_actions: ['Choose a microphone', 'Open the default studio flow'],
    };
  }

  if (mic && !preamp) {
    return {
      status: 'incomplete',
      headline: `${mic.name} selected — route is waiting for a preamp`,
      viability_flag: {
        level: 'blocked',
        reason: 'The microphone is chosen, but there is no gain stage to bring it into the working line-level path.',
      },
      gain_margin_summary: undefined,
      validation_issues: validationIssues,
      active_path,
      parallel_paths,
      deviations: [],
      available_next_actions: ['Choose a preamp', 'Inspect impedance and gain demand'],
    };
  }

  const deviations: string[] = [];
  const gain_margin_summary = buildGainMarginSummary(mic, preamp);
  if (inserts.length > 0) {
    deviations.push(`Default path is extended by ${inserts.length} insert stage${inserts.length === 1 ? '' : 's'}`);
  }
  if (parallelProcessors.length > 0) {
    deviations.push(`${parallelProcessors.length} parallel path${parallelProcessors.length === 1 ? '' : 's'} supplement the direct chain without replacing it`);
    parallelProcessors.forEach((processor) => {
      deviations.push(`${processor.item.name} taps from ${processor.routing.send_source_label} and returns via ${processor.routing.return_destination_label}`);
    });
  }

  if (primaryValidationIssue?.severity === 'blocked') {
    return {
      status: 'warning',
      headline: 'Route is blocked until the routing issue is resolved',
      viability_flag: {
        level: 'blocked',
        reason: primaryValidationIssue.message,
      },
      gain_margin_summary,
      validation_issues: validationIssues,
      active_path,
      parallel_paths,
      deviations,
      available_next_actions: [primaryValidationIssue.suggested_action ?? 'Review the patch path', 'Return to the default route'],
    };
  }

  if (primaryValidationIssue?.severity === 'warning' || analysis?.warnings.length) {
    return {
      status: 'warning',
      headline: 'Route is active with cautions worth reviewing',
      viability_flag: {
        level: 'caution',
        reason: primaryValidationIssue?.message ?? analysis?.warnings[0] ?? 'Review the active route for avoidable tradeoffs.',
      },
      gain_margin_summary,
      validation_issues: validationIssues,
      active_path,
      parallel_paths,
      deviations,
      available_next_actions: [
        primaryValidationIssue?.suggested_action ?? 'Review warnings',
        'Try alternate preamp loading',
        'Reduce insert complexity',
      ],
    };
  }

  return {
    status: inserts.length > 0 ? 'custom' : 'default',
    headline: inserts.length > 0 ? 'Custom analog route is active' : 'Default tracking route is active',
    viability_flag: {
      level: 'ok',
      reason: inserts.length > 0
        ? 'The route is complete and operating within expected constraints.'
        : 'The default tracking path is complete and electrically straightforward.',
    },
    gain_margin_summary,
    validation_issues: validationIssues,
    active_path,
    parallel_paths,
    deviations,
    available_next_actions: ['Compare another preamp', 'Add or reorder inserts', 'Inspect the room path'],
  };
}

export function buildPerspectiveInsights(
  perspective: Perspective,
  analysis: ChainAnalysis | null
): PerspectiveInsightModel {
  if (!analysis) {
    return {
      perspective,
      summary: 'No active route yet.',
      warnings: [],
      notes: [],
    };
  }

  if (perspective === 'musician') {
    return {
      perspective,
      summary: analysis.warnings.length > 0
        ? 'This route has a noticeable personality shift or constraint that may become part of the sound.'
        : 'This route is electrically straightforward, so most of the audible character comes from the chosen gear itself.',
      warnings: analysis.warnings,
      notes: analysis.notes,
    };
  }

  if (perspective === 'engineer') {
    return {
      perspective,
      summary: analysis.warnings.length > 0
        ? 'The route works, but there are practical engineering constraints to manage.'
        : 'The route is practical and within normal professional operating expectations.',
      warnings: analysis.warnings,
      notes: analysis.notes,
    };
  }

  return {
    perspective,
    summary: analysis.warnings.length > 0
      ? `Primary concern: ${analysis.warnings[0]}`
      : `Primary concern: bridging ${analysis.bridging_ratio.toFixed(2)}:1 with ${analysis.effective_bw_khz.toFixed(1)}kHz effective bandwidth.`,
    warnings: analysis.warnings,
    notes: analysis.notes,
  };
}