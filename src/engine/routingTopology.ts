import type {
  ParallelProcessor,
  ParallelProcessorDraft,
  ParallelReturnDestinationId,
  ParallelReturnDestinationOption,
  ParallelRouting,
  ParallelSendSourceId,
  ParallelSendSourceOption,
} from '../types/studio';

export const parallelSendSourceOptions: ParallelSendSourceOption[] = [
  {
    id: 'api-insert-send-1',
    label: 'Channel path after preamp',
    description: 'Takes signal after the selected preamp, before the main insert chain continues back into the channel.',
  },
  {
    id: 'api-mix-a-insert-send',
    label: 'Main mix before A/D',
    description: 'Takes signal from the main Mix A path after channel processing but before the tracking converter.',
  },
  {
    id: 'api-mix-b-insert-send',
    label: 'Secondary mix return bus',
    description: 'Takes signal from the secondary Mix B side, typically for overflow or already-blended return structures.',
  },
];

export const parallelReturnDestinationOptions: ParallelReturnDestinationOption[] = [
  {
    id: 'tonelux-otb-input',
    label: 'Tonelux shared wet return',
    description: 'Feeds the Tonelux summing return so multiple wet branches can be combined before they re-enter Mix B.',
    blend_stage: 'tonelux-otb',
    exclusive: false,
  },
  {
    id: 'api-mix-b-return',
    label: 'Direct Mix B return',
    description: 'Returns straight to Mix B without Tonelux summing. Only one processor can occupy this return point at a time.',
    blend_stage: 'direct-return',
    exclusive: true,
  },
  {
    id: 'api-insert-return-1',
    label: 'Main insert return takeover',
    description: 'Comes back in series at the main insert return. This replaces the direct path instead of blending beside it.',
    blend_stage: 'direct-return',
    exclusive: true,
  },
];

function lookupSendSource(id: ParallelSendSourceId): ParallelSendSourceOption {
  return parallelSendSourceOptions.find((option) => option.id === id) ?? parallelSendSourceOptions[0];
}

function lookupReturnDestination(id: ParallelReturnDestinationId): ParallelReturnDestinationOption {
  return parallelReturnDestinationOptions.find((option) => option.id === id) ?? parallelReturnDestinationOptions[0];
}

export function getAvailableParallelSendSources(proc: ParallelProcessorDraft | ParallelProcessor): ParallelSendSourceOption[] {
  if (proc.type === 'compressor') {
    return parallelSendSourceOptions.filter((option) => option.id !== 'api-mix-b-insert-send');
  }

  return parallelSendSourceOptions;
}

export function getAvailableParallelReturnDestinations(proc: ParallelProcessorDraft | ParallelProcessor): ParallelReturnDestinationOption[] {
  if (proc.type === 'outboard') {
    return parallelReturnDestinationOptions.filter((option) => option.id !== 'api-insert-return-1');
  }

  return parallelReturnDestinationOptions;
}

export function buildDefaultParallelRouting(proc: ParallelProcessorDraft): ParallelRouting {
  const sendSourceId: ParallelSendSourceId = proc.type === 'compressor' ? 'api-insert-send-1' : 'api-mix-a-insert-send';
  const returnDestinationId: ParallelReturnDestinationId = 'tonelux-otb-input';
  const sendSource = lookupSendSource(sendSourceId);
  const returnDestination = lookupReturnDestination(returnDestinationId);

  return {
    send_source_id: sendSource.id,
    send_source_label: sendSource.label,
    return_destination_id: returnDestination.id,
    return_destination_label: returnDestination.label,
    blend_stage: returnDestination.blend_stage,
  };
}

export function normalizeParallelRouting(
  proc: ParallelProcessorDraft | ParallelProcessor,
  routing: Partial<ParallelRouting> | undefined
): ParallelRouting {
  const fallback = buildDefaultParallelRouting(proc);
  const allowedSendSources = getAvailableParallelSendSources(proc);
  const allowedReturnDestinations = getAvailableParallelReturnDestinations(proc);

  const sendSource = allowedSendSources.find((option) => option.id === routing?.send_source_id)
    ?? allowedSendSources.find((option) => option.id === fallback.send_source_id)
    ?? allowedSendSources[0];
  const returnDestination = allowedReturnDestinations.find((option) => option.id === routing?.return_destination_id)
    ?? allowedReturnDestinations.find((option) => option.id === fallback.return_destination_id)
    ?? allowedReturnDestinations[0];

  return {
    send_source_id: sendSource.id,
    send_source_label: sendSource.label,
    return_destination_id: returnDestination.id,
    return_destination_label: returnDestination.label,
    blend_stage: returnDestination.blend_stage,
  };
}