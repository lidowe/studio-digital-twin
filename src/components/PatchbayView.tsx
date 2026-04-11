import { useEffect, useState } from 'react';
import type { Microphone, Preamp, Compressor, Equalizer, OutboardProcessor, InsertProcessor, ParallelProcessor, ParallelProcessorDraft, ParallelProcessorInput, ParallelReturnDestinationOption, ParallelSendSourceOption, Perspective } from '../types/studio';
import { patchRows } from '../data/studio';
import { microphones } from '../data/microphones';
import { preamps } from '../data/preamps';
import { compressors } from '../data/compressors';
import { buildDefaultParallelRouting, getAvailableParallelReturnDestinations, getAvailableParallelSendSources, normalizeParallelRouting, parallelReturnDestinationOptions, parallelSendSourceOptions } from '../engine/routingTopology';
import RouteReadout from './RouteReadout';

function hasStandaloneEqSection(preamp: Preamp): boolean {
  return preamp.eq_features != null;
}

interface Props {
  perspective: Perspective;
  selectedMic: Microphone | null;
  selectedPreamp: Preamp | null;
  insertChain: InsertProcessor[];
  parallelChain: ParallelProcessor[];
  analysis: import('../types/studio').ChainAnalysis | null;
  onSelectMic: (m: Microphone | null) => void;
  onSelectPreamp: (p: Preamp | null) => void;
  onAddInsert: (proc: InsertProcessor) => void;
  onAddParallel: (proc: ParallelProcessorInput) => void;
  onRemoveInsert: (index: number) => void;
  onRemoveParallel: (index: number) => void;
  onReorderInserts: (from: number, to: number) => void;
  onInspect: (id: string | null) => void;
  equalizers: Equalizer[];
  outboardProcessors: OutboardProcessor[];
}

type PendingParallelRouting = {
  send_source_id: ParallelSendSourceOption['id'];
  return_destination_id: ParallelReturnDestinationOption['id'];
};

function buildParallelConflictMessage(
  returnDestinationId: PendingParallelRouting['return_destination_id'],
  procName: string,
  parallelChain: ParallelProcessor[],
  currentProcId: string
): string | null {
  if (returnDestinationId === 'api-insert-return-1') {
    return `${procName} would take over the main insert return, so it would stop being a blended branch.`;
  }

  const occupied = parallelChain.find((existing) => (
    existing.item.id !== currentProcId &&
    existing.routing.return_destination_id === returnDestinationId &&
    returnDestinationId === 'api-mix-b-return'
  ));

  if (occupied) {
    return `${occupied.item.name} is already using that exclusive return point.`;
  }

  return null;
}

function ParallelChooser({
  proc,
  parallelChain,
  onAdd,
}: {
  proc: ParallelProcessorDraft;
  parallelChain: ParallelProcessor[];
  onAdd: (proc: ParallelProcessorInput) => void;
}) {
  const defaultRouting = buildDefaultParallelRouting(proc);
  const [routing, setRouting] = useState<PendingParallelRouting>({
    send_source_id: defaultRouting.send_source_id,
    return_destination_id: defaultRouting.return_destination_id,
  });

  const sendOptions = getAvailableParallelSendSources(proc)
    .map((option) => parallelSendSourceOptions.find((candidate) => candidate.id === option.id) ?? option);
  const returnOptions = getAvailableParallelReturnDestinations(proc)
    .map((option) => parallelReturnDestinationOptions.find((candidate) => candidate.id === option.id) ?? option);

  const normalizedRouting = normalizeParallelRouting(proc, routing);
  const sendOption = sendOptions.find((option) => option.id === normalizedRouting.send_source_id);
  const conflictMessage = buildParallelConflictMessage(normalizedRouting.return_destination_id, proc.item.name, parallelChain, proc.item.id);
  const returnOption = returnOptions.find((option) => option.id === normalizedRouting.return_destination_id);

  return (
    <div className="mt-2 rounded-lg border border-cyan-800/30 bg-cyan-950/10 p-2 space-y-2">
      <div className="grid gap-2 md:grid-cols-2">
        <label className="space-y-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Take signal from</div>
          <select
            value={routing.send_source_id}
            onChange={(event) => setRouting((current) => ({ ...current, send_source_id: event.target.value as PendingParallelRouting['send_source_id'] }))}
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-[11px] text-zinc-200"
          >
            {sendOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          {sendOption && <div className="text-[10px] leading-relaxed text-zinc-500">{sendOption.description}</div>}
        </label>

        <label className="space-y-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Blend back into</div>
          <select
            value={routing.return_destination_id}
            onChange={(event) => setRouting((current) => ({ ...current, return_destination_id: event.target.value as PendingParallelRouting['return_destination_id'] }))}
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-[11px] text-zinc-200"
          >
            {returnOptions.map((option) => {
              const occupied = option.exclusive && parallelChain.some((existing) => existing.routing.return_destination_id === option.id);
              return (
                <option key={option.id} value={option.id} disabled={occupied && option.id !== routing.return_destination_id}>
                  {option.label} · {option.exclusive ? 'exclusive' : 'shared'}{occupied && option.id !== routing.return_destination_id ? ' (in use)' : ''}
                </option>
              );
            })}
          </select>
          {returnOption && <div className="text-[10px] leading-relaxed text-zinc-500">{returnOption.description}</div>}
        </label>
      </div>

      <div className="text-[10px] leading-relaxed text-zinc-500">
        Shared returns can host multiple blended paths. Exclusive returns belong to one processor at a time and must be freed before reassignment.
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className={`text-[10px] leading-relaxed ${conflictMessage ? 'text-yellow-300' : 'text-cyan-200/80'}`}>
          {conflictMessage ?? `${normalizedRouting.send_source_label} -> ${normalizedRouting.return_destination_label}${returnOption?.exclusive ? ' · exclusive return slot' : ' · shared blend lane'}`}
        </div>
        <button
          onClick={() => onAdd({ ...proc, routing: normalizedRouting })}
          disabled={conflictMessage != null}
          className="text-[10px] px-2 py-1 rounded border border-cyan-700/40 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-950/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add Branch
        </button>
      </div>
    </div>
  );
}

function MicCard({ mic, selected, onSelect, perspective }: {
  mic: Microphone; selected: boolean; onSelect: (m: Microphone) => void; perspective: Perspective;
}) {
  return (
    <button
      onClick={() => onSelect(mic)}
      className={`text-left w-full px-3 py-2 rounded border transition text-sm ${
        selected
          ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
          : 'border-zinc-700/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{mic.name}</span>
        <span className="text-[10px] text-zinc-500">{mic.type} · {mic.qty}×</span>
      </div>
      <div className="text-xs text-zinc-400 mt-0.5">
        {perspective === 'musician' ? mic.character.slice(0, 56) + '…' :
         perspective === 'technical' ? `Z: ${mic.output_z_ohm}Ω · ${mic.sensitivity_dbv}dBV · ${mic.patterns.join('/')}` :
         `${mic.patterns.join('/')} · ~${mic.gain_demand_db}dB gain · ${mic.phantom ? '48V' : 'passive'}`}
      </div>
    </button>
  );
}

function CompCard({ comp, inChain, inParallel, onAdd, onAddParallel, perspective, parallelChain }: {
  comp: Compressor; inChain: boolean; inParallel: boolean; onAdd?: (c: Compressor) => void; onAddParallel?: (c: ParallelProcessorInput) => void; perspective: Perspective; parallelChain: ParallelProcessor[];
}) {
  const canAdd = onAdd != null;
  const canAddParallel = onAddParallel != null;
  return (
    <div className={`text-left w-full px-3 py-2 rounded border transition text-sm ${
      inChain || inParallel
        ? 'bg-purple-500/10 border-purple-500/50 text-purple-200'
        : 'border-zinc-700/50 text-zinc-300 bg-zinc-950/20'
    }`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{comp.name}</span>
        <div className="flex items-center gap-1">
          {inChain && <span className="text-[9px] text-purple-400">IN CHAIN</span>}
          {inParallel && <span className="text-[9px] text-cyan-400">PARALLEL</span>}
          <span className="text-[10px] text-zinc-500">{comp.topology}</span>
        </div>
      </div>
      <div className="text-xs text-zinc-400 mt-0.5">
        {perspective === 'musician' ? comp.character.slice(0, 56) + '…' :
         perspective === 'technical' ? `${comp.detection} · ${comp.ratios} · ${comp.attack_range}` :
         `${comp.ratios} · ${comp.detection} · ${comp.attack_range}`}
      </div>
      {(canAdd || canAddParallel) && (
        <div className="mt-2 flex gap-2">
          {canAdd && (
            <button
              onClick={() => onAdd?.(comp)}
              className="text-[10px] px-2 py-1 rounded border border-purple-700/40 bg-purple-950/30 text-purple-200 hover:bg-purple-950/50"
            >
              Inline
            </button>
          )}
          {canAddParallel && !canAdd && <div className="text-[10px] px-2 py-1 text-cyan-200/80">Build as a blended branch</div>}
        </div>
      )}
      {canAddParallel && !inParallel && (
        <ParallelChooser proc={{ type: 'compressor', item: comp }} parallelChain={parallelChain} onAdd={(proc) => onAddParallel?.(proc)} />
      )}
    </div>
  );
}

function EQCard({ eq, inChain, onAdd, perspective }: {
  eq: Equalizer; inChain: boolean; onAdd: (e: Equalizer) => void; perspective: Perspective;
}) {
  return (
    <button
      onClick={() => onAdd(eq)}
      className={`text-left w-full px-3 py-2 rounded border transition text-sm ${
        inChain
          ? 'bg-teal-500/10 border-teal-500/50 text-teal-200'
          : 'border-zinc-700/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{eq.name}</span>
        <div className="flex items-center gap-1">
          {inChain && <span className="text-[9px] text-teal-400">IN CHAIN</span>}
          <span className="text-[10px] text-zinc-500">{eq.topology} · {eq.channels}ch</span>
        </div>
      </div>
      <div className="text-xs text-zinc-400 mt-0.5">
        {perspective === 'musician' ? eq.character.slice(0, 56) + '…' :
         perspective === 'technical' ? `Z_in: ${eq.input_z_ohm}Ω · Z_out: ${eq.output_z_ohm}Ω · ${eq.has_transformer ? 'XFMR' : 'Xfmrless'} · ${eq.bands}` :
         `${eq.bands.slice(0, 60)} · ${eq.has_transformer ? 'transformer color' : 'cleaner transfer'}`}
      </div>
    </button>
  );
}

function OutboardCard({ proc, inChain, inParallel, onAdd, onAddParallel, perspective, parallelChain }: {
  proc: OutboardProcessor; inChain: boolean; inParallel: boolean; onAdd?: (p: OutboardProcessor) => void; onAddParallel?: (p: ParallelProcessorInput) => void; perspective: Perspective; parallelChain: ParallelProcessor[];
}) {
  const canAdd = onAdd != null;
  const canAddParallel = onAddParallel != null;
  return (
    <div className={`text-left w-full px-3 py-2 rounded border transition text-sm ${
      inChain || inParallel
        ? 'bg-rose-500/10 border-rose-500/50 text-rose-200'
        : 'border-zinc-700/50 text-zinc-300 bg-zinc-950/20'
    }`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{proc.name}</span>
        <div className="flex items-center gap-1">
          {inChain && <span className="text-[9px] text-rose-400">IN CHAIN</span>}
          {inParallel && <span className="text-[9px] text-cyan-400">PARALLEL</span>}
          {!inParallel && !canAdd && <span className="text-[9px] text-cyan-400">RETURN</span>}
          <span className="text-[10px] text-zinc-500">{proc.type} · {proc.format}</span>
        </div>
      </div>
      <div className="text-xs text-zinc-400 mt-0.5">
        {perspective === 'musician' ? proc.character.slice(0, 56) + '…' :
         perspective === 'technical' ? `${proc.routing_mode === 'parallel-send-return' ? 'parallel wet processor' : `Z_in: ${proc.input_z_ohm}Ω · Z_out: ${proc.output_z_ohm}Ω`} · ${proc.format}` :
         `${proc.routing_mode === 'parallel-send-return' ? 'parallel FX return role' : 'optional inline processor'} · ${proc.format}`}
      </div>
      {!canAdd && (
        <div className="text-[10px] text-cyan-300 mt-1">Parallel feeds are broader than FX, but these units are typically send-fed and blended back as wet returns rather than inserted into the direct chain.</div>
      )}
      {(canAdd || canAddParallel) && (
        <div className="mt-2 flex gap-2">
          {canAdd && (
            <button
              onClick={() => onAdd?.(proc)}
              className="text-[10px] px-2 py-1 rounded border border-rose-700/40 bg-rose-950/30 text-rose-200 hover:bg-rose-950/50"
            >
              Inline
            </button>
          )}
          {canAddParallel && !canAdd && <div className="text-[10px] px-2 py-1 text-cyan-200/80">Blend this unit back as wet return</div>}
        </div>
      )}
      {canAddParallel && !inParallel && (
        <ParallelChooser proc={{ type: 'outboard', item: proc }} parallelChain={parallelChain} onAdd={(nextProc) => onAddParallel?.(nextProc)} />
      )}
    </div>
  );
}

function InsertChainStrip({ insertChain, onRemove }: { insertChain: InsertProcessor[]; onRemove: (i: number) => void }) {
  if (insertChain.length === 0) return null;
  const typeColors = { compressor: 'bg-purple-500/20 border-purple-500/40 text-purple-200', equalizer: 'bg-teal-500/20 border-teal-500/40 text-teal-200', 'preamp-eq': 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200', outboard: 'bg-rose-500/20 border-rose-500/40 text-rose-200' };
  return (
    <div className="flex items-center gap-1 flex-wrap py-1">
      <span className="text-[10px] text-zinc-500 mr-1">Insert Chain:</span>
      {insertChain.map((proc, i) => (
        <span key={`${proc.item.id}-${i}`} className="flex items-center gap-1">
          {i > 0 && <span className="text-zinc-600 text-xs">→</span>}
          <button
            onClick={() => onRemove(i)}
            className={`text-[10px] px-1.5 py-0.5 rounded border ${typeColors[proc.type]} hover:opacity-70 transition`}
            title="Click to remove from chain"
          >
            {proc.item.name} ✕
          </button>
        </span>
      ))}
    </div>
  );
}

function GroupAccordion({
  title,
  count,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded border border-zinc-800 bg-zinc-950/40 overflow-hidden">
      <button
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
          <span className="text-[10px] tracking-wide text-zinc-400 uppercase">{title}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800/70 text-zinc-400">{count}</span>
        </div>
        {summary && <span className="text-[10px] text-zinc-500 truncate max-w-xs">{summary}</span>}
      </button>
      {open && <div className="p-2 border-t border-zinc-800">{children}</div>}
    </div>
  );
}

const BAY_ROW_LENGTH = 48;

type BayTone = 'rose' | 'red' | 'orange' | 'lime' | 'violet' | 'fuchsia' | 'purple' | 'teal' | 'cyan' | 'sky' | 'amber' | 'yellow' | 'blue' | 'slate';

interface BaySegment {
  label: string;
  count: number;
  tone: BayTone;
}

const bayToneClasses: Record<BayTone, { strip: string; socket: string; selected: string }> = {
  rose: { strip: 'bg-rose-300/20 text-rose-100', socket: 'border-rose-400/40 text-rose-200', selected: 'border-rose-300 bg-rose-300 text-zinc-950' },
  red: { strip: 'bg-red-300/20 text-red-100', socket: 'border-red-400/40 text-red-200', selected: 'border-red-300 bg-red-300 text-zinc-950' },
  orange: { strip: 'bg-orange-300/20 text-orange-100', socket: 'border-orange-400/40 text-orange-200', selected: 'border-orange-300 bg-orange-300 text-zinc-950' },
  lime: { strip: 'bg-lime-300/20 text-lime-100', socket: 'border-lime-400/40 text-lime-200', selected: 'border-lime-300 bg-lime-300 text-zinc-950' },
  violet: { strip: 'bg-violet-300/20 text-violet-100', socket: 'border-violet-400/40 text-violet-200', selected: 'border-violet-300 bg-violet-300 text-zinc-950' },
  fuchsia: { strip: 'bg-fuchsia-300/20 text-fuchsia-100', socket: 'border-fuchsia-400/40 text-fuchsia-200', selected: 'border-fuchsia-300 bg-fuchsia-300 text-zinc-950' },
  purple: { strip: 'bg-purple-300/20 text-purple-100', socket: 'border-purple-400/40 text-purple-200', selected: 'border-purple-300 bg-purple-300 text-zinc-950' },
  teal: { strip: 'bg-teal-300/20 text-teal-100', socket: 'border-teal-400/40 text-teal-200', selected: 'border-teal-300 bg-teal-300 text-zinc-950' },
  cyan: { strip: 'bg-cyan-300/20 text-cyan-100', socket: 'border-cyan-400/40 text-cyan-200', selected: 'border-cyan-300 bg-cyan-300 text-zinc-950' },
  sky: { strip: 'bg-sky-300/20 text-sky-100', socket: 'border-sky-400/40 text-sky-200', selected: 'border-sky-300 bg-sky-300 text-zinc-950' },
  amber: { strip: 'bg-amber-300/20 text-amber-100', socket: 'border-amber-400/40 text-amber-200', selected: 'border-amber-300 bg-amber-300 text-zinc-950' },
  yellow: { strip: 'bg-yellow-300/20 text-yellow-100', socket: 'border-yellow-400/40 text-yellow-200', selected: 'border-yellow-300 bg-yellow-300 text-zinc-950' },
  blue: { strip: 'bg-blue-300/20 text-blue-100', socket: 'border-blue-400/40 text-blue-200', selected: 'border-blue-300 bg-blue-300 text-zinc-950' },
  slate: { strip: 'bg-zinc-700/40 text-zinc-300', socket: 'border-zinc-600 text-zinc-500', selected: 'border-zinc-400 bg-zinc-400 text-zinc-950' },
};

function PatchbayFace({
  segments,
  selectedPoints = [],
  active = false,
  onPointClick,
  onSegmentClick,
  activeSegmentLabel,
}: {
  segments: BaySegment[];
  selectedPoints?: number[];
  active?: boolean;
  onPointClick?: (pointNumber: number) => void;
  onSegmentClick?: (label: string) => void;
  activeSegmentLabel?: string | null;
}) {
  const normalizedSegments = segments.filter((segment) => segment.count > 0);
  const pointTones: BayTone[] = [];

  normalizedSegments.forEach((segment) => {
    for (let index = 0; index < segment.count && pointTones.length < BAY_ROW_LENGTH; index += 1) {
      pointTones.push(segment.tone);
    }
  });

  const usedCount = pointTones.length;
  const unusedStart = usedCount + 1;
  const selectedPointSet = new Set(selectedPoints.filter((point) => point >= 1 && point <= usedCount));

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#101113] px-2.5 py-2">
      <div className="overflow-x-auto pb-1">
        <div className="min-w-max space-y-2">
          <div className="flex items-center gap-1">
            {normalizedSegments.map((segment) => {
              const segmentContent = (
                <span
                  className={`block rounded-full px-2 py-1 text-center text-[9px] uppercase tracking-[0.18em] ${bayToneClasses[segment.tone].strip} ${activeSegmentLabel === segment.label ? 'ring-1 ring-inset ring-zinc-200/30' : ''}`}
                >
                  {segment.label}
                </span>
              );

              return onSegmentClick ? (
                <button
                  key={`${segment.label}-${segment.count}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSegmentClick(segment.label);
                  }}
                  style={{ flexGrow: segment.count, flexBasis: 0 }}
                  {...(segmentButtonProps || {})}
                >
                  {segmentContent}
                </button>
              ) : (
                <div
                  key={`${segment.label}-${segment.count}`}
                  style={{ flexGrow: segment.count, flexBasis: 0 }}
                >
                  {segmentContent}
                </div>
              );
            })}
            {usedCount < BAY_ROW_LENGTH && (
              <div
                className="rounded-full border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-center text-[9px] uppercase tracking-[0.18em] text-zinc-500"
                style={{ flexGrow: BAY_ROW_LENGTH - usedCount, flexBasis: 0 }}
              >
                {unusedStart}-{BAY_ROW_LENGTH}
              </div>
            )}
          </div>

          <div className="relative">
            <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t ${active ? 'border-zinc-400/70' : 'border-zinc-700/80 border-dashed'}`} />
            <div className="relative flex items-center gap-1">
              {pointTones.map((tone, index) => {
                const pointNumber = index + 1;
                const selected = selectedPointSet.has(pointNumber);
                const socketClasses = selected
                  ? bayToneClasses[tone].selected
                  : `bg-zinc-950/95 ${bayToneClasses[tone].socket}`;

                const content = (
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium transition md:h-7 md:w-7 ${socketClasses}`}
                  >
                    {pointNumber}
                  </span>
                );

                return onPointClick ? (
                  <button key={pointNumber} type="button" onClick={() => onPointClick(pointNumber)} className="shrink-0">
                    {content}
                  </button>
                ) : (
                  <div key={pointNumber} className="shrink-0">{content}</div>
                );
              })}

              {usedCount < BAY_ROW_LENGTH && (
                <div
                  className="flex h-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/85 px-3 text-[9px] uppercase tracking-[0.18em] text-zinc-500 md:h-7"
                  style={{ flexGrow: BAY_ROW_LENGTH - usedCount, flexBasis: 0 }}
                >
                  {unusedStart}-{BAY_ROW_LENGTH} open
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberedDirectoryItem({
  pointNumber,
  label,
  meta,
  selected,
  tone,
  onSelect,
  onInspect,
}: {
  pointNumber: number;
  label: string;
  meta: string;
  selected: boolean;
  tone: BayTone;
  onSelect: () => void;
  onInspect: () => void;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${selected ? 'border-zinc-500 bg-zinc-800/70' : 'border-zinc-800 bg-zinc-950/55'}`}>
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium ${selected ? bayToneClasses[tone].selected : `bg-zinc-950/95 ${bayToneClasses[tone].socket}`}`}>
          {pointNumber}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-zinc-200">{label}</span>
          <span className="block truncate text-[10px] uppercase tracking-[0.14em] text-zinc-500">{meta}</span>
        </span>
      </button>
      <button type="button" onClick={onInspect} className="shrink-0 rounded-full border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-400 hover:text-zinc-200">
        Inspect
      </button>
    </div>
  );
}

function PatchMap({
  title,
  topLabel,
  bottomLabel,
  points,
  accent = 'zinc',
}: {
  title: string;
  topLabel: string;
  bottomLabel: string;
  points: string[];
  accent?: 'zinc' | 'violet' | 'amber' | 'cyan' | 'blue';
}) {
  const tones = {
    zinc: 'border-zinc-700/60 bg-zinc-900/50 text-zinc-300',
    violet: 'border-violet-700/40 bg-violet-950/20 text-violet-200',
    amber: 'border-amber-700/40 bg-amber-950/20 text-amber-200',
    cyan: 'border-cyan-700/40 bg-cyan-950/20 text-cyan-200',
    blue: 'border-blue-700/40 bg-blue-950/20 text-blue-200',
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/45 p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{title}</span>
        <span className="text-[10px] text-zinc-600">Left to right</span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[42rem] space-y-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.16em] text-zinc-500">
              <span>Top Row</span>
              <span>{topLabel}</span>
            </div>
            <div className="flex gap-1">
              {points.map((point) => (
                <div key={`top-${title}-${point}`} className={`flex h-6 min-w-8 items-center justify-center rounded border px-1 text-[10px] font-mono ${tones[accent]}`}>
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.16em] text-zinc-500">
              <span>Bottom Row</span>
              <span>{bottomLabel}</span>
            </div>
            <div className="flex gap-1">
              {points.map((point) => (
                <div key={`bottom-${title}-${point}`} className="flex h-6 min-w-8 items-center justify-center rounded border border-zinc-700/60 bg-zinc-900/40 px-1 text-[10px] font-mono text-zinc-400">
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatchbayView({
  perspective, selectedMic, selectedPreamp, insertChain, parallelChain, analysis,
  onSelectMic, onSelectPreamp, onAddInsert, onAddParallel, onRemoveInsert, onRemoveParallel, onReorderInserts, onInspect,
  equalizers, outboardProcessors,
}: Props) {
  const rows = patchRows;
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showRouteReadout, setShowRouteReadout] = useState(true);
  const [openMicGroup, setOpenMicGroup] = useState<string | null>(selectedMic?.type ?? null);
  const [pendingMicId, setPendingMicId] = useState<string | null>(selectedMic?.id ?? null);
  const [processingMode, setProcessingMode] = useState<Record<string, 'inline' | 'parallel'>>({
    'row-dynamics': 'inline',
    'row-spatial': 'inline',
    'row-fx': 'parallel',
  });

  useEffect(() => {
    setPendingMicId(selectedMic?.id ?? null);
    if (selectedMic?.type) {
      setOpenMicGroup(selectedMic.type);
    }
  }, [selectedMic]);

  const toggle = (id: string) => {
    setExpandedRow((current) => (current === id ? null : id));
  };

  const setRowMode = (rowId: string, mode: 'inline' | 'parallel') => {
    setProcessingMode((current) => ({ ...current, [rowId]: mode }));
  };

  // IDs currently in the insert chain (for highlighting)
  const chainIds = new Set(insertChain.map(p => p.item.id));
  const parallelIds = new Set(parallelChain.map(p => p.item.id));

  // Group mics by type
  const micGroups = new Map<string, Microphone[]>();
  microphones.forEach(m => {
    const existing = micGroups.get(m.type) || [];
    existing.push(m);
    micGroups.set(m.type, existing);
  });
  const orderedMicTypes: Microphone['type'][] = ['Tube LDC', 'FET LDC', 'FET MDC', 'FET SDC', 'Ribbon', 'Dynamic', 'Boundary', 'Measurement', 'Subkick', 'Field Recorder'];
  const orderedMicGroups = orderedMicTypes
    .map((type) => ({ type, mics: micGroups.get(type) ?? [] }))
    .filter((entry) => entry.mics.length > 0);

  // Group preamps by topology
  const preampGroups = new Map<string, Preamp[]>();
  preamps.forEach(p => {
    const label = { 'all-valve': 'All-Valve', 'hybrid-tube': 'Hybrid Tube', 'discrete-ss': 'Discrete Solid-State', 'dc-coupled': 'DC-Coupled' }[p.topology] || p.topology;
    const existing = preampGroups.get(label) || [];
    existing.push(p);
    preampGroups.set(label, existing);
  });
  const standalonePreampEqs = preamps.filter(hasStandaloneEqSection);
  const standardPreamps = preamps.filter((preamp) => !hasStandaloneEqSection(preamp));
  const orderedPreamps = [...standardPreamps, ...standalonePreampEqs];
  const selectedPreampPoint = selectedPreamp ? orderedPreamps.findIndex((preamp) => preamp.id === selectedPreamp.id) + 1 : 0;
  const insertPreampEqIds = new Set(insertChain.filter((proc) => proc.type === 'preamp-eq').map((proc) => proc.item.id));

  // Group compressors by topology
  const compGroups = new Map<string, Compressor[]>();
  compressors.forEach(c => {
    const existing = compGroups.get(c.topology) || [];
    existing.push(c);
    compGroups.set(c.topology, existing);
  });

  // Group equalizers by topology
  const eqGroups = new Map<string, Equalizer[]>();
  equalizers.forEach(eq => {
    const label = { 'passive-inductor': 'Passive Inductor', 'active-inductor': 'Active Inductor', 'parametric': 'Parametric', 'tilt': 'Tilt', 'tube-reactive': 'Tube-Reactive' }[eq.topology] || eq.topology;
    const existing = eqGroups.get(label) || [];
    existing.push(eq);
    eqGroups.set(label, existing);
  });

  const inlineOutboardGroups = new Map<string, OutboardProcessor[]>();
  const parallelFxGroups = new Map<string, OutboardProcessor[]>();
  outboardProcessors.forEach((p) => {
    const label = { 'reverb': 'Reverb', 'delay': 'Delay', 'multi-fx': 'Multi-FX', 'spatial': 'Spatial / Width', 'harmonic': 'Punch / Harmonic', 'utility': 'Utility' }[p.type] || p.type;
    const target = p.routing_mode === 'parallel-send-return' ? parallelFxGroups : inlineOutboardGroups;
    const existing = target.get(label) || [];
    existing.push(p);
    target.set(label, existing);
  });
  const inlineOutboard = Array.from(inlineOutboardGroups.values()).flat();
  const parallelFx = Array.from(parallelFxGroups.values()).flat();

  // API insert point labels
  const apiInsertPoints = [
    ...Array.from({ length: 16 }, (_, i) => `Ch ${i + 1}`),
    'Mix A Bus', 'Mix B Bus',
  ];
  const channelPointNumbers = Array.from({ length: 16 }, (_, i) => `${i + 1}`);
  const insertPointNumbers = [...channelPointNumbers, 'A', 'B'];
  const puebloBankNumbers = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'];

  const currentRoute = [
    selectedMic?.name ?? 'No mic selected',
    selectedPreamp?.name ?? 'No preamp selected',
    insertChain.length > 0 ? `${insertChain.length} insert${insertChain.length === 1 ? '' : 's'}` : 'No inserts',
    parallelChain.length > 0 ? `${parallelChain.length} parallel path${parallelChain.length === 1 ? '' : 's'}` : 'No parallel paths',
  ];

  const patchbayRowLabels: Record<string, string> = {
    'row-mic-ties': 'MIC TIE LINES',
    'row-preamp-in': 'PREAMP INPUTS',
    'row-preamp-out': 'PREAMP LINE OUTPUTS',
    'row-api-line-in': 'LINE INPUTS',
    'row-insert-send': 'INSERT SENDS',
    'row-insert-return': 'INSERT RETURNS',
    'row-dynamics': 'DYNAMICS',
    'row-eq': 'EQUALIZERS',
    'row-spatial': 'INLINE COLOR / WIDTH',
    'row-fx': 'FX SEND / RETURN',
    'row-api-mix': 'MIX BUSES',
    'row-pueblo': 'SUMMING CASCADE',
    'row-ad-daw': 'A/D -> DAW',
  };

  const patchbayRowLabel = (rowId: string) => patchbayRowLabels[rowId] ?? rowId.toUpperCase();

  const micTypeTone: Partial<Record<Microphone['type'], BayTone>> = {
    'Tube LDC': 'rose',
    'FET LDC': 'red',
    'FET MDC': 'orange',
    'FET SDC': 'amber',
    'Ribbon': 'yellow',
    'Dynamic': 'lime',
    'Boundary': 'teal',
    'Measurement': 'cyan',
    'Subkick': 'blue',
    'Field Recorder': 'violet',
  };

  const micGroupStartPoint = (type: Microphone['type']) => {
    let cursor = 1;

    for (const entry of orderedMicGroups) {
      if (entry.type === type) return cursor;
      cursor += entry.mics.length;
    }

    return 1;
  };

  const pendingMic = pendingMicId ? microphones.find((mic) => mic.id === pendingMicId) ?? null : null;

  const rowSegments = (rowId: string): BaySegment[] => {
    switch (rowId) {
      case 'row-mic-ties':
        return orderedMicGroups.map((entry) => ({
          label: entry.type,
          count: entry.mics.length,
          tone: micTypeTone[entry.type] ?? 'rose',
        }));
      case 'row-preamp-in':
      case 'row-preamp-out':
        return [
          { label: `${standardPreamps.length} Preamps`, count: standardPreamps.length, tone: 'blue' },
          { label: `${standalonePreampEqs.length} Preamp / EQ`, count: standalonePreampEqs.length, tone: 'cyan' },
        ];
      case 'row-api-line-in':
        return [{ label: 'API Inputs 1-16', count: 16, tone: 'lime' }];
      case 'row-insert-send':
        return [{ label: 'Insert Sends 1-16 + A/B', count: 18, tone: 'violet' }];
      case 'row-insert-return':
        return [{ label: 'Insert Returns 1-16 + A/B', count: 18, tone: 'fuchsia' }];
      case 'row-dynamics':
        return [{ label: `${compressors.length} Dynamics`, count: compressors.length, tone: 'purple' }];
      case 'row-eq':
        return [{ label: `${equalizers.length} Equalizers`, count: equalizers.length, tone: 'teal' }];
      case 'row-spatial':
        return [{ label: `${inlineOutboard.length} Inline Processors`, count: inlineOutboard.length, tone: 'cyan' }];
      case 'row-fx':
        return [{ label: `${parallelFx.length} FX Returns`, count: parallelFx.length, tone: 'sky' }];
      case 'row-api-mix':
        return [{ label: 'Mix A / Mix B', count: 2, tone: 'amber' }];
      case 'row-pueblo':
        return [
          { label: 'Pueblo 1-32', count: 32, tone: 'yellow' },
          { label: 'Tonelux Return', count: 1, tone: 'amber' },
        ];
      case 'row-ad-daw':
        return [{ label: 'AD+ 1 / 2', count: 2, tone: 'blue' }];
      default:
        return [{ label: 'Patch Row', count: 0, tone: 'slate' }];
    }
  };

  const rowSelectedPoints = (rowId: string): number[] => {
    const committedMicPoint = selectedMic ? micGroupStartPoint(selectedMic.type) : 0;

    switch (rowId) {
      case 'row-mic-ties':
        return committedMicPoint > 0 ? [committedMicPoint] : [];
      case 'row-preamp-in':
      case 'row-preamp-out':
        return selectedPreampPoint > 0 ? [selectedPreampPoint] : [];
      case 'row-dynamics':
        return compressors
          .map((compressor, index) => (chainIds.has(compressor.id) || parallelIds.has(compressor.id) ? index + 1 : null))
          .filter((value): value is number => value != null);
      case 'row-eq':
        return equalizers
          .map((equalizer, index) => (chainIds.has(equalizer.id) ? index + 1 : null))
          .filter((value): value is number => value != null);
      case 'row-spatial':
        return inlineOutboard
          .map((processor, index) => (chainIds.has(processor.id) ? index + 1 : null))
          .filter((value): value is number => value != null);
      case 'row-fx':
        return parallelFx
          .map((processor, index) => (parallelIds.has(processor.id) ? index + 1 : null))
          .filter((value): value is number => value != null);
      default:
        return [];
    }
  };

  const rowOccupancySummary = (rowId: string) => {
    const occupied = rowSegments(rowId).reduce((sum, segment) => sum + segment.count, 0);
    return occupied >= BAY_ROW_LENGTH ? 'full 48-point field' : `${occupied} occupied · ${BAY_ROW_LENGTH - occupied} open`;
  };

  const normallingLabel = (row: typeof rows[number]) => {
    if (row.category === 'outboard-pool') return 'PATCH SOURCE';
    if (row.category === 'summing') return 'BUS / SUM';
    if (row.category === 'digital') return 'CONVERSION';
    if (row.half_normal) return 'HALF-NORMAL';
    if (row.normalled_to) return 'FULL-NORMAL';
    return 'OPEN';
  };

  const normallingTargetLabel = (row: typeof rows[number]) => {
    if (!row.normalled_to) return null;
    const target = rows.find((candidate) => candidate.id === row.normalled_to);
    return target ? patchbayRowLabel(target.id) : null;
  };

  const rowSignalColors: Record<string, { color: string; chip: string; glow: string }> = {
    'row-mic-ties': { color: '#fb7185', chip: 'bg-rose-400/15 text-rose-200 border-rose-400/30', glow: 'shadow-[0_0_0_1px_rgba(251,113,133,0.18)]' },
    'row-preamp-in': { color: '#f87171', chip: 'bg-red-400/15 text-red-200 border-red-400/30', glow: 'shadow-[0_0_0_1px_rgba(248,113,113,0.18)]' },
    'row-preamp-out': { color: '#fb923c', chip: 'bg-orange-400/15 text-orange-200 border-orange-400/30', glow: 'shadow-[0_0_0_1px_rgba(251,146,60,0.18)]' },
    'row-api-line-in': { color: '#a3e635', chip: 'bg-lime-400/15 text-lime-200 border-lime-400/30', glow: 'shadow-[0_0_0_1px_rgba(163,230,53,0.18)]' },
    'row-insert-send': { color: '#c4b5fd', chip: 'bg-violet-400/15 text-violet-200 border-violet-400/30', glow: 'shadow-[0_0_0_1px_rgba(196,181,253,0.18)]' },
    'row-insert-return': { color: '#f472b6', chip: 'bg-fuchsia-400/15 text-fuchsia-200 border-fuchsia-400/30', glow: 'shadow-[0_0_0_1px_rgba(244,114,182,0.18)]' },
    'row-dynamics': { color: '#c084fc', chip: 'bg-purple-400/15 text-purple-200 border-purple-400/30', glow: 'shadow-[0_0_0_1px_rgba(192,132,252,0.18)]' },
    'row-eq': { color: '#2dd4bf', chip: 'bg-teal-400/15 text-teal-200 border-teal-400/30', glow: 'shadow-[0_0_0_1px_rgba(45,212,191,0.18)]' },
    'row-spatial': { color: '#22d3ee', chip: 'bg-cyan-400/15 text-cyan-200 border-cyan-400/30', glow: 'shadow-[0_0_0_1px_rgba(34,211,238,0.18)]' },
    'row-fx': { color: '#38bdf8', chip: 'bg-sky-400/15 text-sky-200 border-sky-400/30', glow: 'shadow-[0_0_0_1px_rgba(56,189,248,0.18)]' },
    'row-api-mix': { color: '#fbbf24', chip: 'bg-amber-400/15 text-amber-200 border-amber-400/30', glow: 'shadow-[0_0_0_1px_rgba(251,191,36,0.18)]' },
    'row-pueblo': { color: '#fde047', chip: 'bg-yellow-300/15 text-yellow-100 border-yellow-300/30', glow: 'shadow-[0_0_0_1px_rgba(253,224,71,0.16)]' },
    'row-ad-daw': { color: '#60a5fa', chip: 'bg-blue-400/15 text-blue-200 border-blue-400/30', glow: 'shadow-[0_0_0_1px_rgba(96,165,250,0.18)]' },
  };

  const rowSignalStyle = (rowId: string) => rowSignalColors[rowId] ?? { color: '#a1a1aa', chip: 'bg-zinc-800 text-zinc-300 border-zinc-700', glow: '' };

  const perspectiveTone: Record<Perspective, { badge: string; panel: string; label: string }> = {
    musician: {
      badge: 'border-amber-700/40 bg-amber-950/35 text-amber-200',
      panel: 'border-amber-800/30 bg-amber-950/12',
      label: 'Musician Lens',
    },
    engineer: {
      badge: 'border-cyan-700/40 bg-cyan-950/35 text-cyan-200',
      panel: 'border-cyan-800/30 bg-cyan-950/12',
      label: 'Engineer Lens',
    },
    technical: {
      badge: 'border-violet-700/40 bg-violet-950/35 text-violet-200',
      panel: 'border-violet-800/30 bg-violet-950/12',
      label: 'Technical Lens',
    },
  };

  const defaultPathSummary = selectedMic && selectedPreamp
    ? `${selectedMic.name} -> ${selectedPreamp.name} -> API line input -> Mix A -> Dangerous AD+ -> DAW`
    : null;

  const signalLineStyle = (color: string, active: boolean, direction: 'horizontal' | 'vertical') => {
    if (active) {
      return {
        backgroundColor: color,
        opacity: 0.95,
        ...(direction === 'horizontal' ? { height: '3px' } : { width: '2px' }),
      };
    }

    return {
      backgroundImage: direction === 'horizontal'
        ? `repeating-linear-gradient(to right, ${color}88 0 10px, transparent 10px 16px)`
        : `repeating-linear-gradient(to bottom, ${color}88 0 8px, transparent 8px 14px)`,
      opacity: 0.55,
      ...(direction === 'horizontal' ? { height: '2px' } : { width: '2px' }),
    };
  };

  const passiveRouteHints: Record<string, string[]> = {
    'row-preamp-in': ['normalled continuation -> PREAMP LINE OUTPUTS', 'optional continuation -> PREAMP / EQ -> PREAMP LINE OUTPUTS'],
    'row-insert-send': ['possible feed -> INSERT RETURNS', 'possible branch -> FX SEND / RETURN'],
    'row-dynamics': ['typically patched between INSERT SENDS and INSERT RETURNS', 'can also feed a parallel return path'],
    'row-eq': ['typically patched between INSERT SENDS and INSERT RETURNS'],
    'row-spatial': ['possible inline return -> INSERT RETURNS', 'possible stereo continuation -> MIX BUSES'],
    'row-fx': ['possible wet return -> MIX BUSES', 'possible alternate return -> INSERT RETURNS'],
    'row-api-mix': ['possible continuation -> SUMMING CASCADE', 'possible return point for parallel material'],
  };

  const rowRouteHints = (rowId: string) => passiveRouteHints[rowId] ?? [];

  const rowIsActive = (rowId: string) => {
    switch (rowId) {
      case 'row-mic-ties':
        return selectedMic != null;
      case 'row-preamp-in':
      case 'row-preamp-out':
        return selectedMic != null || selectedPreamp != null;
      case 'row-api-line-in':
        return selectedPreamp != null;
      case 'row-insert-send':
      case 'row-insert-return':
        return selectedPreamp != null || insertChain.length > 0 || parallelChain.length > 0;
      case 'row-dynamics':
        return insertChain.some((proc) => proc.type === 'compressor') || parallelChain.some((proc) => proc.type === 'compressor');
      case 'row-eq':
        return insertChain.some((proc) => proc.type === 'equalizer' || proc.type === 'preamp-eq');
      case 'row-spatial':
        return insertChain.some((proc) => proc.type === 'outboard');
      case 'row-fx':
        return parallelChain.some((proc) => proc.type === 'outboard');
      case 'row-api-mix':
      case 'row-pueblo':
      case 'row-ad-daw':
        return selectedPreamp != null;
      default:
        return false;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <p className="mb-3 max-w-2xl text-xs leading-relaxed text-zinc-500">
        The patchbay reveals a route that is already latent in the studio. Start with a microphone, a preamp, a processor, or simple curiosity; each choice exposes the normalled path, its departures, and the sonic consequences that follow.
      </p>

      <div className="sticky top-0 z-10 mb-3 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/96 px-3 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
              <span>Current route</span>
              <span className="text-zinc-700">•</span>
              <span>{expandedRow ? patchbayRowLabel(expandedRow) : 'No row open'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-300">
              {currentRoute.map((part) => (
                <span key={part} className="px-2 py-1 rounded border border-zinc-800 bg-zinc-900/70">{part}</span>
              ))}
            </div>
          </div>
          <div className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${perspectiveTone[perspective].badge}`}>
            {perspectiveTone[perspective].label}
          </div>
        </div>

        {selectedMic && selectedPreamp && (
          <div className={`rounded-2xl border px-3 py-3 ${perspectiveTone[perspective].panel}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Default path is already complete</div>
                <div className="text-sm text-zinc-200">You do not need to patch anything else to reach the recorder. The normalled route is already running to the end destination.</div>
                <div className="text-[11px] leading-relaxed text-zinc-400">{defaultPathSummary}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedRow('row-insert-send')}
                  className="rounded-full border border-violet-700/40 bg-violet-950/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-violet-200 hover:bg-violet-950/50"
                >
                  Add Processing
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedRow('row-api-mix')}
                  className="rounded-full border border-amber-700/40 bg-amber-950/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-amber-200 hover:bg-amber-950/50"
                >
                  Follow To Mix
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insert chain strip (persistent) */}
      <InsertChainStrip insertChain={insertChain} onRemove={onRemoveInsert} />

      {rows.map((row) => {
        const isOpen = expandedRow === row.id;
        const hasNormal = row.normalled_to != null;
        const isHalfNormal = row.half_normal === true;
        const isActive = rowIsActive(row.id);
        const signalStyle = rowSignalStyle(row.id);

        return (
          <div key={row.id}>
            {/* Row header (entire area clickable to expand/collapse) */}
            <div
              className={`w-full px-3 py-3 border border-zinc-700 ${signalStyle.glow} ${isOpen ? 'rounded-t' : 'rounded'} bg-zinc-950/92 cursor-pointer transition-colors hover:bg-zinc-700/20`}
              onClick={(e) => {
                // Prevent expansion if clicking on a mic family segment (which has its own logic)
                if (row.id === 'row-mic-ties' && (e.target as HTMLElement).closest('button[data-mic-segment]')) return;
                toggle(row.id);
              }}
              tabIndex={0}
              role="button"
              aria-expanded={isOpen}
            >
              <div className="space-y-3">
                <div className="flex w-full items-start justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                      <span className="text-[10px] font-mono text-zinc-500 w-5 text-right">{row.order}</span>
                      <span className="text-[11px] font-semibold tracking-[0.18em] text-zinc-200 truncate">{patchbayRowLabel(row.id)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-7 text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                      <span className={`rounded border px-1.5 py-0.5 ${signalStyle.chip}`}>{normallingLabel(row)}</span>
                      {normallingTargetLabel(row) && (
                        <span className="rounded border border-zinc-800 bg-zinc-900/70 px-1.5 py-0.5 text-zinc-400">{normallingTargetLabel(row)}</span>
                      )}
                      <span className="text-zinc-600">{rowOccupancySummary(row.id)}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-zinc-600">{isOpen ? 'Open' : 'Closed'}</span>
                </div>

                <PatchbayFace
                  segments={rowSegments(row.id)}
                  selectedPoints={rowSelectedPoints(row.id)}
                  active={isActive}
                  onSegmentClick={row.id === 'row-mic-ties'
                    ? (label) => {
                        setExpandedRow('row-mic-ties');
                        setOpenMicGroup((current) => current === label ? null : label);
                      }
                    : undefined}
                  activeSegmentLabel={row.id === 'row-mic-ties' ? openMicGroup : null}
                  segmentButtonProps={row.id === 'row-mic-ties' ? { 'data-mic-segment': true } : undefined}
                />
              </div>
            </div>

            {/* Expanded content */}
            {isOpen && (
              <div className="relative border-x border-b border-zinc-700 rounded-b-2xl bg-zinc-800/35 p-4 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className={`absolute inset-x-0 top-0 h-1 rounded-t-none ${signalStyle.chip}`} />
                <div className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-3">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Patch detail layer</div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{row.description}</p>
                  </div>
                  <button
                    onClick={() => setExpandedRow(null)}
                    className="shrink-0 text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-full px-2.5 py-1"
                  >
                    Close
                  </button>
                </div>

                {rowRouteHints(row.id).length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/55 px-2.5 py-2 text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                    {rowRouteHints(row.id).map((hint) => (
                      <span key={hint} className="inline-flex items-center gap-1 rounded border border-zinc-800/80 bg-zinc-950/50 px-1.5 py-1">
                        <span className="inline-block h-px w-3 border-t border-dashed border-zinc-600" />
                        <span>{hint}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* ── Mic Tie Lines ── */}
                {row.id === 'row-mic-ties' && (
                  <>
                    {openMicGroup && (() => {
                      const group = orderedMicGroups.find((entry) => entry.type === openMicGroup);
                      if (!group) return null;

                      return (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{group.type}</div>
                              <div className="text-sm font-medium text-zinc-200">Points {micGroupStartPoint(group.type)}-{micGroupStartPoint(group.type) + group.mics.length - 1}</div>
                            </div>
                            <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{group.mics.reduce((sum, mic) => sum + mic.qty, 0)} units represented</div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                            {group.mics.map((mic) => (
                              <MicCard
                                key={mic.id}
                                mic={mic}
                                selected={pendingMicId === mic.id}
                                onSelect={(nextMic) => setPendingMicId(nextMic.id)}
                                perspective={perspective}
                              />
                            ))}
                          </div>

                          {pendingMic && pendingMic.type === group.type && (
                            <div className="rounded-xl border border-zinc-800 bg-zinc-950/65 p-3 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Pending Selection</div>
                                  <div className="text-sm font-medium text-zinc-200">{pendingMic.name}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onInspect(pendingMic.id)}
                                  className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-400 hover:text-zinc-200"
                                >
                                  Inspect
                                </button>
                              </div>

                              <p className="text-xs leading-relaxed text-zinc-400">
                                {perspective === 'musician'
                                  ? pendingMic.character
                                  : perspective === 'technical'
                                  ? pendingMic.engineering
                                  : `${pendingMic.patterns.join('/')} · ${pendingMic.output_z_ohm} ohm output · about ${pendingMic.gain_demand_db} dB of gain demand`}
                              </p>

                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Choosing commits point {micGroupStartPoint(group.type)} and lets the normalled path continue downward</div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectMic(pendingMic);
                                    setOpenMicGroup(null);
                                  }}
                                  className="rounded-full border border-amber-700/40 bg-amber-950/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-amber-200 hover:bg-amber-950/50"
                                >
                                  Choose This Mic
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}

                {/* ── Preamp Inputs ── */}
                {row.id === 'row-preamp-in' && (
                  <>
                    {selectedMic && (
                      <div className="text-xs text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded px-2 py-1">
                        Normalled source: <strong>{selectedMic.name}</strong> {'->'} choose the first gain stage below.
                      </div>
                    )}
                    <PatchbayFace
                      segments={rowSegments(row.id)}
                      selectedPoints={rowSelectedPoints(row.id)}
                      active={selectedMic != null || selectedPreamp != null}
                      onPointClick={(pointNumber) => {
                        const preamp = orderedPreamps[pointNumber - 1];
                        if (preamp) onSelectPreamp(preamp);
                      }}
                    />
                    <div className="grid gap-3 xl:grid-cols-2">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">1-{standardPreamps.length}</div>
                            <div className="text-sm font-medium text-zinc-200">Preamp Inputs</div>
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Direct gain stages</div>
                        </div>
                        <div className="space-y-2">
                          {standardPreamps.map((preamp, index) => (
                            <NumberedDirectoryItem
                              key={preamp.id}
                              pointNumber={index + 1}
                              label={preamp.name}
                              meta={`${preamp.topology} · ${preamp.channels}ch`}
                              selected={selectedPreamp?.id === preamp.id}
                              tone="blue"
                              onSelect={() => onSelectPreamp(preamp)}
                              onInspect={() => onInspect(preamp.id)}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{standardPreamps.length + 1}-{orderedPreamps.length}</div>
                            <div className="text-sm font-medium text-zinc-200">Preamp / EQ Inputs</div>
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Integrated EQ stages</div>
                        </div>
                        <div className="space-y-2">
                          {standalonePreampEqs.map((preamp, index) => (
                            <div key={preamp.id} className="space-y-2">
                              <NumberedDirectoryItem
                                pointNumber={standardPreamps.length + index + 1}
                                label={preamp.name}
                                meta={`${preamp.eq_features ?? 'Integrated EQ'} · ${preamp.channels}ch`}
                                selected={selectedPreamp?.id === preamp.id}
                                tone="cyan"
                                onSelect={() => onSelectPreamp(preamp)}
                                onInspect={() => onInspect(preamp.id)}
                              />
                              <div className="pl-10 pr-2 flex items-center justify-between gap-2 text-[10px] text-zinc-500">
                                <span>{insertPreampEqIds.has(preamp.id) ? 'EQ stage already inserted in route' : 'Can also be added later as a line-level preamp / EQ stage'}</span>
                                <button
                                  type="button"
                                  onClick={() => onAddInsert({ type: 'preamp-eq', item: preamp })}
                                  className="rounded-full border border-cyan-700/40 bg-cyan-950/30 px-2 py-1 uppercase tracking-[0.12em] text-cyan-200 hover:bg-cyan-950/50"
                                >
                                  {insertPreampEqIds.has(preamp.id) ? 'In Route' : 'Add EQ Stage'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Preamp Outputs ── */}
                {row.id === 'row-preamp-out' && (
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400">
                      {selectedPreamp
                        ? <span>Signal: <strong className="text-blue-300">{selectedPreamp.name}</strong> can leave as a direct preamp line output, or continue through its EQ path when that unit exposes one.</span>
                        : <span className="text-zinc-500 italic">Preamp line outputs continue toward API line inputs by default. EQ-capable units can also leave from the preamp / EQ side of the field.</span>
                      }
                    </div>
                    <PatchbayFace
                      segments={rowSegments(row.id)}
                      selectedPoints={rowSelectedPoints(row.id)}
                      active={selectedPreamp != null}
                    />
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Direct Outputs</div>
                        <div className="mt-1 text-sm font-medium text-zinc-200">Points 1-{standardPreamps.length}</div>
                        <p className="mt-2 text-xs leading-relaxed text-zinc-400">These points leave the preamp stage and continue toward the API line inputs along the default path.</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">EQ Outputs</div>
                        <div className="mt-1 text-sm font-medium text-zinc-200">Points {standardPreamps.length + 1}-{orderedPreamps.length}</div>
                        <p className="mt-2 text-xs leading-relaxed text-zinc-400">These points leave the integrated EQ section on the units that have one, then continue back into the same downstream line path.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── API Line Inputs ── */}
                {row.id === 'row-api-line-in' && (
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400">
                      16 line-level inputs on the API ASM164. Each channel has its own insert send/return point and routes to Mix A or Mix B.
                    </div>
                    <PatchMap
                      title="Line Input Map"
                      topLabel="Source Position"
                      bottomLabel="ASM164 Line Inputs"
                      points={channelPointNumbers}
                      accent="amber"
                    />
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
                      {Array.from({ length: 16 }, (_, i) => (
                        <div key={i} className="text-center text-[10px] px-1.5 py-1 rounded border border-zinc-700/50 bg-zinc-800/50 text-zinc-400">
                          Ch {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── API Insert Sends ── */}
                {row.id === 'row-insert-send' && (
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400">
                      Half-normalled tap points — signal passes through to the API channel unless a patch cable is inserted. Tap here for inline patching, parallel time-based FX sends, or secondary subgroup/parallel-feed experiments without breaking continuity.
                    </div>
                    <PatchMap
                      title="Send Field"
                      topLabel="ASM164 Insert Send"
                      bottomLabel="Patch Destination"
                      points={insertPointNumbers}
                      accent="violet"
                    />
                    <GroupAccordion title="Channel Inserts" count={16} summary="API channels 1-16" defaultOpen>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
                        {apiInsertPoints.slice(0, 16).map((label, i) => (
                          <div key={i} className="text-center text-[10px] px-1.5 py-1.5 rounded border border-zinc-700/50 bg-zinc-800/50 text-zinc-400">
                            {label}
                            <div className="text-[8px] text-zinc-600 mt-0.5">send</div>
                          </div>
                        ))}
                      </div>
                    </GroupAccordion>
                    <GroupAccordion title="Mix Bus Inserts" count={2} summary="Mix A and Mix B stereo buses">
                      <div className="grid grid-cols-2 gap-2">
                        {apiInsertPoints.slice(16).map((label, i) => (
                          <div key={i} className="text-center text-[10px] px-1.5 py-2 rounded border border-violet-600/40 bg-violet-950/30 text-violet-300">
                            {label}
                            <div className="text-[8px] text-violet-200/60 mt-0.5">send</div>
                          </div>
                        ))}
                      </div>
                    </GroupAccordion>
                    {insertChain.length > 0 && (
                      <div className="mt-2">
                        <InsertChainStrip insertChain={insertChain} onRemove={onRemoveInsert} />
                      </div>
                    )}
                  </div>
                )}

                {/* ── API Insert Returns ── */}
                {row.id === 'row-insert-return' && (
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400">
                      Return points from outboard processing. When patched, the processed signal replaces the direct signal at the API channel.
                    </div>
                    <PatchMap
                      title="Return Field"
                      topLabel="Patched Return Source"
                      bottomLabel="ASM164 Insert Return"
                      points={insertPointNumbers}
                      accent="violet"
                    />
                    <GroupAccordion title="Channel Returns" count={16} summary="API channels 1-16" defaultOpen>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
                        {apiInsertPoints.slice(0, 16).map((label, i) => (
                          <div key={i} className="text-center text-[10px] px-1.5 py-1.5 rounded border border-zinc-700/50 bg-zinc-800/50 text-zinc-400">
                            {label}
                            <div className="text-[8px] text-zinc-600 mt-0.5">return</div>
                          </div>
                        ))}
                      </div>
                    </GroupAccordion>
                    <GroupAccordion title="Mix Bus Returns" count={2} summary="Mix A and Mix B stereo buses">
                      <div className="grid grid-cols-2 gap-2">
                        {apiInsertPoints.slice(16).map((label, i) => (
                          <div key={i} className="text-center text-[10px] px-1.5 py-2 rounded border border-violet-600/40 bg-violet-950/30 text-violet-300">
                            {label}
                            <div className="text-[8px] text-violet-200/60 mt-0.5">return</div>
                          </div>
                        ))}
                      </div>
                    </GroupAccordion>
                    {insertChain.length > 0 && (
                      <div className="mt-2">
                        <InsertChainStrip insertChain={insertChain} onRemove={onRemoveInsert} />
                      </div>
                    )}
                  </div>
                )}

                {/* ── Dynamics Rack ── */}
                {row.id === 'row-dynamics' && (
                  <>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 space-y-3 mb-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Routing intent</div>
                          <div className="mt-1 text-sm font-medium text-zinc-200">Choose how this row should behave before choosing a compressor.</div>
                        </div>
                        <div className="inline-flex rounded-full border border-zinc-700/70 bg-zinc-900/70 p-1">
                          <button
                            type="button"
                            onClick={() => setRowMode(row.id, 'inline')}
                            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em] transition ${processingMode[row.id] === 'inline' ? 'bg-purple-300 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
                          >
                            Inline insert
                          </button>
                          <button
                            type="button"
                            onClick={() => setRowMode(row.id, 'parallel')}
                            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em] transition ${processingMode[row.id] === 'parallel' ? 'bg-cyan-300 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
                          >
                            Blended branch
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {processingMode[row.id] === 'inline'
                          ? 'Inline mode replaces the direct path at the insert return, so the compressor becomes part of the main chain.'
                          : 'Blended branch mode taps signal without breaking the dry route, then brings compressed signal back on a separate return path.'}
                      </div>
                    </div>
                    {Array.from(compGroups.entries()).map(([topo, comps]) => (
                      <GroupAccordion
                        key={topo}
                        title={topo}
                        count={comps.length}
                        summary={comps.some((comp) => chainIds.has(comp.id) || parallelIds.has(comp.id)) ? 'Contains selected path' : undefined}
                        defaultOpen={comps.some((comp) => chainIds.has(comp.id) || parallelIds.has(comp.id))}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                          {comps.map(comp => (
                            <CompCard
                              key={comp.id}
                              comp={comp}
                              inChain={chainIds.has(comp.id)}
                              inParallel={parallelIds.has(comp.id)}
                              onAdd={processingMode[row.id] === 'inline' ? (c) => onAddInsert({ type: 'compressor', item: c }) : undefined}
                              onAddParallel={processingMode[row.id] === 'parallel' ? onAddParallel : undefined}
                              perspective={perspective}
                              parallelChain={parallelChain}
                            />
                          ))}
                        </div>
                      </GroupAccordion>
                    ))}
                  </>
                )}

                {/* ── EQ Rack ── */}
                {row.id === 'row-eq' && (
                  <>
                    {Array.from(eqGroups.entries()).map(([label, eqs]) => (
                      <GroupAccordion
                        key={label}
                        title={label}
                        count={eqs.length}
                        summary={eqs.some((eq) => chainIds.has(eq.id)) ? 'Contains selected insert' : undefined}
                        defaultOpen={eqs.some((eq) => chainIds.has(eq.id))}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                          {eqs.map(eq => (
                            <EQCard key={eq.id} eq={eq} inChain={chainIds.has(eq.id)} onAdd={(e) => onAddInsert({ type: 'equalizer', item: e })} perspective={perspective} />
                          ))}
                        </div>
                      </GroupAccordion>
                    ))}
                  </>
                )}

                {/* ── Spatial / Harmonic Outboard ── */}
                {row.id === 'row-spatial' && (
                  <>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 space-y-2 mb-2">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Inline patch lane</div>
                      <div className="text-sm font-medium text-zinc-200">This row is for deliberate tone-shaping inserts, not default path building.</div>
                      <div className="text-xs text-zinc-400">Patch one of these units only when a subgroup, stereo track, or mix specifically needs width, harmonic push, or enhancement.</div>
                    </div>
                    {Array.from(inlineOutboardGroups.entries()).map(([label, procs]) => (
                      <GroupAccordion
                        key={label}
                        title={label}
                        count={procs.length}
                        summary={procs.some((proc) => chainIds.has(proc.id)) ? 'Contains selected insert' : 'Patch in only when needed'}
                        defaultOpen={procs.some((proc) => chainIds.has(proc.id))}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                          {procs.map((proc) => (
                            <OutboardCard key={proc.id} proc={proc} inChain={chainIds.has(proc.id)} inParallel={parallelIds.has(proc.id)} onAdd={(p) => onAddInsert({ type: 'outboard', item: p })} perspective={perspective} parallelChain={parallelChain} />
                          ))}
                        </div>
                      </GroupAccordion>
                    ))}
                  </>
                )}

                {/* ── FX / Outboard ── */}
                {row.id === 'row-fx' && (
                  <>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 space-y-2 mb-2">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Parallel return lane</div>
                      <div className="text-sm font-medium text-zinc-200">These units stay off the dry path and come back as wet ambience or effect returns.</div>
                      <div className="text-xs text-zinc-400">Use this row when you want to tap signal, process it separately, and blend the result back through the Tonelux/API return side rather than replacing the source path.</div>
                    </div>
                    {Array.from(parallelFxGroups.entries()).map(([label, procs]) => (
                      <GroupAccordion
                        key={label}
                        title={label}
                        count={procs.length}
                        summary="Typical send-fed return processors"
                        defaultOpen={false}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                          {procs.map(proc => (
                            <OutboardCard key={proc.id} proc={proc} inChain={false} inParallel={parallelIds.has(proc.id)} onAddParallel={onAddParallel} perspective={perspective} parallelChain={parallelChain} />
                          ))}
                        </div>
                      </GroupAccordion>
                    ))}
                  </>
                )}

                {/* ── API Mix Buses ── */}
                {row.id === 'row-api-mix' && (
                  <div className="space-y-3">
                    <PatchMap
                      title="Stereo Bus Map"
                      topLabel="Bus Position"
                      bottomLabel="Return / Output"
                      points={['A', 'B']}
                      accent="amber"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="border border-zinc-700/50 rounded p-3 bg-zinc-800/30">
                      <div className="text-xs font-medium text-zinc-200 mb-1">Mix A — Tracking</div>
                      <div className="text-[10px] text-zinc-400 space-y-1">
                        <div>Ch 1–16 sum to Mix A bus</div>
                        <div>Mix A has stereo bus insert (send/return on patchbay)</div>
                        <div className="text-amber-300">Mix A output → Dangerous AD+ input #1</div>
                      </div>
                    </div>
                      <div className="border border-zinc-700/50 rounded p-3 bg-zinc-800/30">
                        <div className="text-xs font-medium text-zinc-200 mb-1">Mix B — FX / Overflow</div>
                        <div className="text-[10px] text-zinc-400 space-y-1">
                          <div>Mix B has stereo bus insert (send/return on patchbay)</div>
                          <div>Tonelux OTB 16xh wet-return sum → Mix B insert return</div>
                          <div className="text-violet-300">FX returns, overflow, and other returned parallel feeds can enter here</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Pueblo / Tonelux ── */}
                {row.id === 'row-pueblo' && (
                  <div className="space-y-3">
                    <PatchMap
                      title="Summing Input Field"
                      topLabel="HJ482 Inputs 1-32"
                      bottomLabel="Bank / Position"
                      points={puebloBankNumbers}
                      accent="cyan"
                    />
                    <div className="rounded border border-zinc-800 bg-zinc-950/40 p-2.5">
                      <div className="flex flex-wrap gap-1.5 text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                        <span className="rounded border border-zinc-700/70 bg-zinc-900/60 px-1.5 py-0.5">Bank A = 1-8</span>
                        <span className="rounded border border-zinc-700/70 bg-zinc-900/60 px-1.5 py-0.5">Bank B = 9-16</span>
                        <span className="rounded border border-zinc-700/70 bg-zinc-900/60 px-1.5 py-0.5">Bank C = 17-24</span>
                        <span className="rounded border border-zinc-700/70 bg-zinc-900/60 px-1.5 py-0.5">Bank D = 25-32</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="border border-zinc-700/50 rounded p-3 bg-zinc-800/30">
                      <div className="text-xs font-medium text-zinc-200 mb-1">Pueblo HJ482 — 32-Input Summing</div>
                      <div className="text-[10px] text-zinc-400 space-y-1">
                        <div>4 banks of 8 inputs (32 total)</div>
                        <div>Banks sum toward Bank D stereo output</div>
                        <div>Bank D has optional internal transformer</div>
                        <div className="text-amber-300">Bank D stereo out → Dangerous AD+ input #2 (mixing)</div>
                        <div className="text-zinc-500">No insert points — pure passive summing</div>
                      </div>
                      <div className="grid grid-cols-4 gap-1 mt-2">
                        {['Bank A (8)', 'Bank B (8)', 'Bank C (8)', 'Bank D (8)'].map(b => (
                          <div key={b} className="text-center text-[9px] px-1 py-1 rounded border border-zinc-700/50 bg-zinc-800/50 text-zinc-500">{b}</div>
                        ))}
                      </div>
                    </div>
                      <div className="border border-zinc-700/50 rounded p-3 bg-zinc-800/30">
                        <div className="text-xs font-medium text-zinc-200 mb-1">Tonelux OTB 16xh — FX/Overflow Summing</div>
                        <div className="text-[10px] text-zinc-400 space-y-1">
                          <div>16 inputs for wet FX returns, overflow, and other parallel-fed returns</div>
                          <div>Time-based FX outputs commonly aggregate here</div>
                          <div>Summed output → API Mix B insert return</div>
                          <div className="text-violet-300">Acts like an aggregate return/summing stage, most often for FX but not limited to them</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── AD+ / DAW ── */}
                {row.id === 'row-ad-daw' && (
                  <div className="space-y-3">
                    <PatchMap
                      title="Commit Points"
                      topLabel="A/D Destination"
                      bottomLabel="Recorded Path"
                      points={['1', '2']}
                      accent="blue"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="border border-red-800/30 rounded p-3 bg-red-950/20">
                        <div className="text-xs font-medium text-red-300 mb-1">AD+ Input #1 — Tracking</div>
                        <div className="text-[10px] text-zinc-400 space-y-1">
                          <div>Source: API Mix A stereo output</div>
                          <div className="text-red-400">⚠ Digital threshold — noise becomes permanent</div>
                        </div>
                      </div>
                      <div className="border border-red-800/30 rounded p-3 bg-red-950/20">
                        <div className="text-xs font-medium text-red-300 mb-1">AD+ Input #2 — Mixing</div>
                        <div className="text-[10px] text-zinc-400 space-y-1">
                          <div>Source: Pueblo Bank D stereo output</div>
                          <div className="text-red-400">⚠ Digital threshold — noise becomes permanent</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 rounded px-2 py-1.5">
                      AD+ → Aurora(n) (wordclock chain, inches apart) → DAW via Thunderbolt 3
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Normalling indicator between rows */}
            {hasNormal && (
              <div className="flex items-center justify-center py-0.5">
                <div className="h-3" style={signalLineStyle(signalStyle.color, isActive, 'vertical')} />
                <span className={`text-[9px] mx-1 ${isActive ? 'text-zinc-400' : 'text-zinc-600'}`}>{isHalfNormal ? 'HALF-NORMAL ↓' : 'FULL-NORMAL ↓'}</span>
                <div className="h-3" style={signalLineStyle(signalStyle.color, isActive, 'vertical')} />
              </div>
            )}
          </div>
        );
      })}

      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setShowRouteReadout((current) => !current)}
          className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-zinc-900/50"
        >
          <div className="min-w-0 space-y-1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Built Route</div>
            <div className="text-sm text-zinc-200">This is the route as the present selections have declared it: one continuous path with its branches, returns, and final commit point intact.</div>
            <div className="text-[11px] leading-relaxed text-zinc-500">It remains part of the same patching surface, so the route can be read as consequence rather than managed as a second mode.</div>
          </div>
          <span className="shrink-0 rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-[10px] text-zinc-400">
            {showRouteReadout ? 'Hide' : 'Show'}
          </span>
        </button>

        {showRouteReadout && (
          <div className="border-t border-zinc-800 p-3 sm:p-4">
            <RouteReadout
              perspective={perspective}
              selectedMic={selectedMic}
              selectedPreamp={selectedPreamp}
              insertChain={insertChain}
              parallelChain={parallelChain}
              analysis={analysis}
              onSelectMic={onSelectMic}
              onSelectPreamp={onSelectPreamp}
              onRemoveInsert={onRemoveInsert}
              onRemoveParallel={onRemoveParallel}
              onReorderInserts={onReorderInserts}
              onInspect={onInspect}
            />
          </div>
        )}
      </section>
    </div>
  );
}
