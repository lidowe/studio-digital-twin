import type {
  InsertProcessor,
  Microphone,
  ParallelProcessor,
  PatchConnection,
  PatchGraphModel,
  Preamp,
  RouteValidationIssue,
} from '../types/studio';
import { getAvailableParallelReturnDestinations, getAvailableParallelSendSources, parallelReturnDestinationOptions } from './routingTopology';

function buildAdjacency(connections: PatchConnection[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  connections
    .filter((connection) => connection.active)
    .forEach((connection) => {
      const existing = adjacency.get(connection.from_endpoint_id) ?? [];
      existing.push(connection.to_endpoint_id);
      adjacency.set(connection.from_endpoint_id, existing);
    });

  return adjacency;
}

function hasPath(graph: PatchGraphModel, startId: string, targetId: string): boolean {
  const adjacency = buildAdjacency(graph.connections);
  const queue = [startId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    if (current === targetId) return true;

    visited.add(current);
    const neighbors = adjacency.get(current) ?? [];
    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor)) queue.push(neighbor);
    });
  }

  return false;
}

function findCycle(graph: PatchGraphModel): boolean {
  const adjacency = buildAdjacency(graph.connections);
  const visited = new Set<string>();
  const activeStack = new Set<string>();

  const visit = (node: string): boolean => {
    if (activeStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    activeStack.add(node);

    const neighbors = adjacency.get(node) ?? [];
    for (const neighbor of neighbors) {
      if (visit(neighbor)) return true;
    }

    activeStack.delete(node);
    return false;
  };

  for (const endpoint of graph.endpoints) {
    if (visit(endpoint.id)) return true;
  }

  return false;
}

export function validatePatchGraph(
  graph: PatchGraphModel,
  mic: Microphone | null,
  preamp: Preamp | null,
  inserts: InsertProcessor[],
  parallelProcessors: ParallelProcessor[]
): RouteValidationIssue[] {
  const issues: RouteValidationIssue[] = [];
  const endpointIds = new Set(graph.endpoints.map((endpoint) => endpoint.id));

  if (!mic) {
    issues.push({
      code: 'missing-source',
      severity: 'blocked',
      message: 'No source is selected, so there is nothing feeding the patch path.',
      suggested_action: 'Choose a microphone or another source before evaluating the route.',
    });
    return issues;
  }

  if (!preamp) {
    issues.push({
      code: 'missing-preamp',
      severity: 'blocked',
      message: 'The microphone has no active gain stage, so the route cannot reach the working line-level path.',
      suggested_action: 'Choose a preamp to complete the primary tracking path.',
    });
    return issues;
  }

  if (findCycle(graph)) {
    issues.push({
      code: 'routing-loop',
      severity: 'blocked',
      message: 'The active routing graph contains a loop, which would create an invalid or unstable path.',
      suggested_action: 'Remove the connection that feeds an earlier stage back into itself.',
    });
  }

  if (!hasPath(graph, 'tie-line-source', 'daw-destination')) {
    issues.push({
      code: 'broken-route',
      severity: 'blocked',
      message: 'The active direct path does not currently reach the DAW destination.',
      suggested_action: 'Check the insert return, mix bus, and converter stages to restore the primary route.',
    });
  }

  if (inserts.length >= 4) {
    issues.push({
      code: 'insert-chain-depth',
      severity: 'warning',
      message: `The route contains ${inserts.length} serial insert stages, which increases complexity and makes troubleshooting less obvious.`,
      suggested_action: 'Confirm that every stage is earning its place in the chain.',
    });
  }

  const returnCounts = new Map<string, number>();

  parallelProcessors.forEach((processor) => {
    const allowedSendSources = getAvailableParallelSendSources(processor);
    const allowedReturnDestinations = getAvailableParallelReturnDestinations(processor);

    returnCounts.set(
      processor.routing.return_destination_id,
      (returnCounts.get(processor.routing.return_destination_id) ?? 0) + 1
    );

    if (!allowedSendSources.some((option) => option.id === processor.routing.send_source_id)) {
      issues.push({
        code: 'parallel-source-missing',
        severity: 'blocked',
        message: `${processor.item.name} is using a send source that is not valid for this branch type.`,
        suggested_action: 'Choose a send tap that fits the current processor and branch role.',
      });
    }

    if (!allowedReturnDestinations.some((option) => option.id === processor.routing.return_destination_id)) {
      issues.push({
        code: 'parallel-destination-missing',
        severity: 'blocked',
        message: `${processor.item.name} is using a return destination that is not valid for this branch type.`,
        suggested_action: 'Choose a return point that matches the branch and processor role.',
      });
    }

    if (!endpointIds.has(processor.routing.send_source_id)) {
      issues.push({
        code: 'parallel-source-missing',
        severity: 'blocked',
        message: `${processor.item.name} is pointing at a send source that does not exist in the active graph.`,
        suggested_action: 'Choose a valid send tap before creating the parallel path.',
      });
    }

    if (!endpointIds.has(processor.routing.return_destination_id)) {
      issues.push({
        code: 'parallel-destination-missing',
        severity: 'blocked',
        message: `${processor.item.name} is pointing at a return destination that does not exist in the active graph.`,
        suggested_action: 'Choose a valid return point before blending the parallel path.',
      });
    }

    const expectedTarget = processor.routing.blend_stage === 'tonelux-otb'
      ? 'parallel-blend-output'
      : processor.routing.return_destination_id;

    if (endpointIds.has(processor.routing.send_source_id) && !hasPath(graph, processor.routing.send_source_id, expectedTarget)) {
      issues.push({
        code: 'parallel-path-unreachable',
        severity: 'warning',
        message: `${processor.item.name} is tapped in parallel, but that branch does not currently resolve to a usable blend stage.`,
        suggested_action: 'Check the return destination or aggregate return path.',
      });
    }

    if (processor.routing.return_destination_id === 'api-insert-return-1') {
      issues.push({
        code: 'parallel-return-conflict',
        severity: 'blocked',
        message: `${processor.item.name} is returning to the main insert return, which replaces the direct path instead of blending alongside it.`,
        suggested_action: 'Return the branch through Tonelux OTB or another true blend destination.',
      });
    }
  });

  returnCounts.forEach((count, destinationId) => {
    const destination = parallelReturnDestinationOptions.find((option) => option.id === destinationId);
    if (count > 1 && destination?.exclusive) {
      issues.push({
        code: 'parallel-return-conflict',
        severity: 'blocked',
        message: 'Multiple parallel processors are claiming the same exclusive return point.',
        suggested_action: 'Aggregate them through Tonelux OTB or distribute them to separate return destinations.',
      });
    }
  });

  return issues;
}