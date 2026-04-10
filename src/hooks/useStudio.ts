import { useState, useCallback } from 'react';
import type { Perspective, ViewMode, Microphone, Preamp, ChainNode, ChainAnalysis, InsertProcessor } from '../types/studio';
import { microphones } from '../data/microphones';
import { preamps } from '../data/preamps';
import { compressors } from '../data/compressors';
import { equalizers } from '../data/equalizers';
import { outboardProcessors } from '../data/outboard';
import { analyzeMicPreamp, analyzeFullChain } from '../engine/signalChain';

/** Extract { has_transformer, noise_floor_db } from any insert processor for signal chain analysis */
function insertToStage(proc: InsertProcessor): { has_transformer: boolean; noise_floor_db: number } {
  switch (proc.type) {
    case 'equalizer':
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

export interface StudioState {
  perspective: Perspective;
  view: ViewMode;
  selectedMic: Microphone | null;
  selectedPreamp: Preamp | null;
  insertChain: InsertProcessor[];
  chain: ChainNode[];
  analysis: ChainAnalysis | null;
  inspectedId: string | null;
  searchQuery: string;
}

export function useStudio() {
  const [state, setState] = useState<StudioState>({
    perspective: 'engineer',
    view: 'patchbay',
    selectedMic: null,
    selectedPreamp: null,
    insertChain: [],
    chain: [],
    analysis: null,
    inspectedId: null,
    searchQuery: '',
  });

  const setPerspective = useCallback((p: Perspective) => setState(s => ({ ...s, perspective: p })), []);
  const setView = useCallback((v: ViewMode) => setState(s => ({ ...s, view: v })), []);
  const setSearch = useCallback((q: string) => setState(s => ({ ...s, searchQuery: q })), []);

  const selectMic = useCallback((mic: Microphone | null) => {
    setState(s => {
      const analysis = runAnalysis(mic, s.selectedPreamp, s.insertChain);
      return { ...s, selectedMic: mic, analysis, inspectedId: mic?.id ?? null };
    });
  }, []);

  const selectPreamp = useCallback((pre: Preamp | null) => {
    setState(s => {
      const analysis = runAnalysis(s.selectedMic, pre, s.insertChain);
      return { ...s, selectedPreamp: pre, analysis, inspectedId: pre?.id ?? null };
    });
  }, []);

  const addInsert = useCallback((proc: InsertProcessor) => {
    setState(s => {
      const insertChain = [...s.insertChain, proc];
      const analysis = runAnalysis(s.selectedMic, s.selectedPreamp, insertChain);
      return { ...s, insertChain, analysis, inspectedId: proc.item.id };
    });
  }, []);

  const removeInsert = useCallback((index: number) => {
    setState(s => {
      const insertChain = s.insertChain.filter((_, i) => i !== index);
      const analysis = runAnalysis(s.selectedMic, s.selectedPreamp, insertChain);
      return { ...s, insertChain, analysis };
    });
  }, []);

  const reorderInserts = useCallback((fromIndex: number, toIndex: number) => {
    setState(s => {
      const insertChain = [...s.insertChain];
      const [moved] = insertChain.splice(fromIndex, 1);
      insertChain.splice(toIndex, 0, moved);
      const analysis = runAnalysis(s.selectedMic, s.selectedPreamp, insertChain);
      return { ...s, insertChain, analysis };
    });
  }, []);

  const inspect = useCallback((id: string | null) => {
    setState(s => ({ ...s, inspectedId: id }));
  }, []);

  const clearChain = useCallback(() => {
    setState(s => ({ ...s, selectedMic: null, selectedPreamp: null, insertChain: [], analysis: null, chain: [] }));
  }, []);

  return {
    state,
    setPerspective,
    setView,
    setSearch,
    selectMic,
    selectPreamp,
    addInsert,
    removeInsert,
    reorderInserts,
    inspect,
    clearChain,
    microphones,
    preamps,
    compressors,
    equalizers,
    outboardProcessors,
  };
}
