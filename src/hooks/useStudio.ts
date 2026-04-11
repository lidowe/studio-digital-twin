import { useState, useCallback } from 'react';
import type { Perspective, Microphone, Preamp, ChainNode, ChainAnalysis, InsertProcessor, ParallelProcessor, ParallelProcessorInput, PatchGraphModel, RouteValidationIssue } from '../types/studio';
import { microphones } from '../data/microphones';
import { preamps } from '../data/preamps';
import { compressors } from '../data/compressors';
import { equalizers } from '../data/equalizers';
import { outboardProcessors } from '../data/outboard';
import { analyzeMicPreamp, analyzeFullChain } from '../engine/signalChain';
import { buildPatchGraph } from '../engine/patchRouting';
import { validatePatchGraph } from '../engine/routeValidation';
import { buildDefaultParallelRouting, normalizeParallelRouting, parallelReturnDestinationOptions, parallelSendSourceOptions } from '../engine/routingTopology';
import { buildPerspectiveInsights, buildRouteSummary } from '../engine/studioViewModel';
import type { PerspectiveInsightModel, RouteSummaryModel } from '../types/studio';

/** Extract { has_transformer, noise_floor_db } from any insert processor for signal chain analysis */
function insertToStage(proc: InsertProcessor): { has_transformer: boolean; noise_floor_db: number } {
  switch (proc.type) {
    case 'equalizer':
      return { has_transformer: proc.item.has_transformer, noise_floor_db: proc.item.noise_floor_db };
    case 'preamp-eq':
      return { has_transformer: proc.item.has_transformer, noise_floor_db: proc.item.noise_floor_db };
    case 'outboard':
      return { has_transformer: proc.item.has_transformer, noise_floor_db: proc.item.noise_floor_db };
    case 'compressor':
      // Compressor type doesn't carry these fields yet — use conservative defaults
      return { has_transformer: true, noise_floor_db: -85 };
  }
}

function runAnalysis(mic: Microphone | null, preamp: Preamp | null, inserts: InsertProcessor[]): ChainAnalysis | null {
  if (!mic || !preamp) return null;
  if (inserts.length === 0) return analyzeMicPreamp(mic, preamp);
  return analyzeFullChain(mic, preamp, inserts.map(insertToStage));
}

function buildDefaultParallelProcessor(proc: ParallelProcessorInput): ParallelProcessor {
  if ('routing' in proc) {
    return {
      ...proc,
      routing: normalizeParallelRouting(proc, proc.routing),
    };
  }

  return {
    ...proc,
    routing: buildDefaultParallelRouting(proc),
  };
}

export interface StudioState {
  perspective: Perspective;
  selectedMic: Microphone | null;
  selectedPreamp: Preamp | null;
  insertChain: InsertProcessor[];
  parallelChain: ParallelProcessor[];
  chain: ChainNode[];
  analysis: ChainAnalysis | null;
  patchGraph: PatchGraphModel;
  routeValidation: RouteValidationIssue[];
  routeSummary: RouteSummaryModel;
  perspectiveInsights: Record<Perspective, PerspectiveInsightModel>;
  inspectedId: string | null;
  searchQuery: string;
}

function buildInsights(analysis: ChainAnalysis | null): Record<Perspective, PerspectiveInsightModel> {
  return {
    musician: buildPerspectiveInsights('musician', analysis),
    engineer: buildPerspectiveInsights('engineer', analysis),
    technical: buildPerspectiveInsights('technical', analysis),
  };
}

export function useStudio() {
  const initialPatchGraph = buildPatchGraph(null, null, [], []);
  const initialRouteValidation = validatePatchGraph(initialPatchGraph, null, null, [], []);

  const [state, setState] = useState<StudioState>({
    perspective: 'engineer',
    selectedMic: null,
    selectedPreamp: null,
    insertChain: [],
    parallelChain: [],
    chain: [],
    analysis: null,
    patchGraph: initialPatchGraph,
    routeValidation: initialRouteValidation,
    routeSummary: buildRouteSummary(null, null, [], [], null, initialRouteValidation),
    perspectiveInsights: buildInsights(null),
    inspectedId: null,
    searchQuery: '',
  });

  const setPerspective = useCallback((p: Perspective) => setState(s => ({ ...s, perspective: p })), []);
  const setSearch = useCallback((q: string) => setState(s => ({ ...s, searchQuery: q })), []);

  const selectMic = useCallback((mic: Microphone | null) => {
    setState(s => {
      const analysis = runAnalysis(mic, s.selectedPreamp, s.insertChain);
      const patchGraph = buildPatchGraph(mic, s.selectedPreamp, s.insertChain, s.parallelChain);
      const routeValidation = validatePatchGraph(patchGraph, mic, s.selectedPreamp, s.insertChain, s.parallelChain);
      return {
        ...s,
        selectedMic: mic,
        analysis,
        patchGraph,
        routeValidation,
        routeSummary: buildRouteSummary(mic, s.selectedPreamp, s.insertChain, s.parallelChain, analysis, routeValidation),
        perspectiveInsights: buildInsights(analysis),
        inspectedId: mic?.id ?? null,
      };
    });
  }, []);

  const selectPreamp = useCallback((pre: Preamp | null) => {
    setState(s => {
      const analysis = runAnalysis(s.selectedMic, pre, s.insertChain);
      const patchGraph = buildPatchGraph(s.selectedMic, pre, s.insertChain, s.parallelChain);
      const routeValidation = validatePatchGraph(patchGraph, s.selectedMic, pre, s.insertChain, s.parallelChain);
      return {
        ...s,
        selectedPreamp: pre,
        analysis,
        patchGraph,
        routeValidation,
        routeSummary: buildRouteSummary(s.selectedMic, pre, s.insertChain, s.parallelChain, analysis, routeValidation),
        perspectiveInsights: buildInsights(analysis),
        inspectedId: pre?.id ?? null,
      };
    });
  }, []);

  const addInsert = useCallback((proc: InsertProcessor) => {
    setState(s => {
      const insertChain = [...s.insertChain, proc];
      const analysis = runAnalysis(s.selectedMic, s.selectedPreamp, insertChain);
      const patchGraph = buildPatchGraph(s.selectedMic, s.selectedPreamp, insertChain, s.parallelChain);
      const routeValidation = validatePatchGraph(patchGraph, s.selectedMic, s.selectedPreamp, insertChain, s.parallelChain);
      return {
        ...s,
        insertChain,
        analysis,
        patchGraph,
        routeValidation,
        routeSummary: buildRouteSummary(s.selectedMic, s.selectedPreamp, insertChain, s.parallelChain, analysis, routeValidation),
        perspectiveInsights: buildInsights(analysis),
        inspectedId: proc.item.id,
      };
    });
  }, []);

  const addParallel = useCallback((proc: ParallelProcessorInput) => {
    setState(s => {
      const parallelProc = buildDefaultParallelProcessor(proc);
      if (s.parallelChain.some((existing) => existing.item.id === parallelProc.item.id && existing.type === parallelProc.type)) {
        return { ...s, inspectedId: parallelProc.item.id };
      }

      const parallelChain = [...s.parallelChain, parallelProc];
      const analysis = runAnalysis(s.selectedMic, s.selectedPreamp, s.insertChain);
      const patchGraph = buildPatchGraph(s.selectedMic, s.selectedPreamp, s.insertChain, parallelChain);
      const routeValidation = validatePatchGraph(patchGraph, s.selectedMic, s.selectedPreamp, s.insertChain, parallelChain);
      return {
        ...s,
        parallelChain,
        analysis,
        patchGraph,
        routeValidation,
        routeSummary: buildRouteSummary(s.selectedMic, s.selectedPreamp, s.insertChain, parallelChain, analysis, routeValidation),
        perspectiveInsights: buildInsights(analysis),
        inspectedId: parallelProc.item.id,
      };
    });
  }, []);

  const removeParallel = useCallback((index: number) => {
    setState(s => {
      const parallelChain = s.parallelChain.filter((_, i) => i !== index);
      const analysis = runAnalysis(s.selectedMic, s.selectedPreamp, s.insertChain);
      const patchGraph = buildPatchGraph(s.selectedMic, s.selectedPreamp, s.insertChain, parallelChain);
      const routeValidation = validatePatchGraph(patchGraph, s.selectedMic, s.selectedPreamp, s.insertChain, parallelChain);
      return {
        ...s,
        parallelChain,
        analysis,
        patchGraph,
        routeValidation,
        routeSummary: buildRouteSummary(s.selectedMic, s.selectedPreamp, s.insertChain, parallelChain, analysis, routeValidation),
        perspectiveInsights: buildInsights(analysis),
      };
    });
  }, []);

  const updateParallelRouting = useCallback((index: number, routingPatch: Partial<ParallelProcessor['routing']>) => {
    setState(s => {
      const target = s.parallelChain[index];
      if (!target) return s;

      const parallelChain = s.parallelChain.map((processor, processorIndex) => {
        if (processorIndex !== index) return processor;

        return {
          ...processor,
          routing: normalizeParallelRouting(processor, {
            ...processor.routing,
            ...routingPatch,
          }),
        };
      });

      const analysis = runAnalysis(s.selectedMic, s.selectedPreamp, s.insertChain);
      const patchGraph = buildPatchGraph(s.selectedMic, s.selectedPreamp, s.insertChain, parallelChain);
      const routeValidation = validatePatchGraph(patchGraph, s.selectedMic, s.selectedPreamp, s.insertChain, parallelChain);

      return {
        ...s,
        parallelChain,
        analysis,
        patchGraph,
        routeValidation,
        routeSummary: buildRouteSummary(s.selectedMic, s.selectedPreamp, s.insertChain, parallelChain, analysis, routeValidation),
        perspectiveInsights: buildInsights(analysis),
      };
    });
  }, []);

  const removeInsert = useCallback((index: number) => {
    setState(s => {
      const insertChain = s.insertChain.filter((_, i) => i !== index);
      const analysis = runAnalysis(s.selectedMic, s.selectedPreamp, insertChain);
      const patchGraph = buildPatchGraph(s.selectedMic, s.selectedPreamp, insertChain, s.parallelChain);
      const routeValidation = validatePatchGraph(patchGraph, s.selectedMic, s.selectedPreamp, insertChain, s.parallelChain);
      return {
        ...s,
        insertChain,
        analysis,
        patchGraph,
        routeValidation,
        routeSummary: buildRouteSummary(s.selectedMic, s.selectedPreamp, insertChain, s.parallelChain, analysis, routeValidation),
        perspectiveInsights: buildInsights(analysis),
      };
    });
  }, []);

  const reorderInserts = useCallback((fromIndex: number, toIndex: number) => {
    setState(s => {
      const insertChain = [...s.insertChain];
      const [moved] = insertChain.splice(fromIndex, 1);
      insertChain.splice(toIndex, 0, moved);
      const analysis = runAnalysis(s.selectedMic, s.selectedPreamp, insertChain);
      const patchGraph = buildPatchGraph(s.selectedMic, s.selectedPreamp, insertChain, s.parallelChain);
      const routeValidation = validatePatchGraph(patchGraph, s.selectedMic, s.selectedPreamp, insertChain, s.parallelChain);
      return {
        ...s,
        insertChain,
        analysis,
        patchGraph,
        routeValidation,
        routeSummary: buildRouteSummary(s.selectedMic, s.selectedPreamp, insertChain, s.parallelChain, analysis, routeValidation),
        perspectiveInsights: buildInsights(analysis),
      };
    });
  }, []);

  const inspect = useCallback((id: string | null) => {
    setState(s => ({ ...s, inspectedId: id }));
  }, []);

  const clearChain = useCallback(() => {
    setState(s => ({
      ...s,
      selectedMic: null,
      selectedPreamp: null,
      insertChain: [],
      analysis: null,
      patchGraph: initialPatchGraph,
      routeValidation: initialRouteValidation,
      routeSummary: buildRouteSummary(null, null, [], [], null, initialRouteValidation),
      perspectiveInsights: buildInsights(null),
      chain: [],
      parallelChain: [],
    }));
  }, [initialPatchGraph, initialRouteValidation]);

  return {
    state,
    setPerspective,
    setSearch,
    selectMic,
    selectPreamp,
    addInsert,
    addParallel,
    removeInsert,
    removeParallel,
    updateParallelRouting,
    reorderInserts,
    inspect,
    clearChain,
    microphones,
    preamps,
    compressors,
    equalizers,
    outboardProcessors,
    routeValidation: state.routeValidation,
    parallelSendSourceOptions,
    parallelReturnDestinationOptions,
  };
}
