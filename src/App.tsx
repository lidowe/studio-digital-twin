import { useStudio } from './hooks/useStudio';
import Header from './components/Header';
import PatchbayView from './components/PatchbayView';
import ComponentInspector from './components/ComponentInspector';
import AnalysisPanel from './components/AnalysisPanel';

function App() {
  const {
    state,
    setPerspective,
    selectMic,
    selectPreamp,
    addInsert,
    addParallel,
    removeInsert,
    removeParallel,
    reorderInserts,
    inspect,
    clearChain,
    equalizers,
    outboardProcessors,
  } = useStudio();

  return (
    <div className="h-screen h-[100svh] flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden">
      <Header
        perspective={state.perspective}
        onPerspective={setPerspective}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-amber-500/8 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/8 blur-3xl" />
        </div>
        {/* Main content area */}
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          <PatchbayView
            perspective={state.perspective}
            selectedMic={state.selectedMic}
            selectedPreamp={state.selectedPreamp}
            insertChain={state.insertChain}
            parallelChain={state.parallelChain}
            analysis={state.analysis}
            onSelectMic={selectMic}
            onSelectPreamp={selectPreamp}
            onAddInsert={addInsert}
            onAddParallel={addParallel}
            onRemoveInsert={removeInsert}
            onRemoveParallel={removeParallel}
            onReorderInserts={reorderInserts}
            onInspect={inspect}
            equalizers={equalizers}
            outboardProcessors={outboardProcessors}
          />

          {/* Bottom analysis strip */}
          <AnalysisPanel
            perspective={state.perspective}
            analysis={state.analysis}
            routeSummary={state.routeSummary}
            perspectiveInsight={state.perspectiveInsights[state.perspective]}
            selectedMic={state.selectedMic}
            selectedPreamp={state.selectedPreamp}
            insertChain={state.insertChain}
            parallelChain={state.parallelChain}
            onClearChain={clearChain}
          />
        </div>

        {/* Component Inspector */}
        {state.inspectedId && (
          <>
            <button
              type="button"
              aria-label="Close inspector"
              onClick={() => inspect(null)}
              className="fixed inset-0 z-20 bg-zinc-950/70 backdrop-blur-sm lg:hidden"
            />

            <aside className="fixed inset-x-0 bottom-0 top-20 z-30 overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-950/96 shadow-2xl lg:relative lg:top-auto lg:bottom-auto lg:left-auto lg:right-auto lg:z-10 lg:w-[22rem] lg:rounded-none lg:border-l lg:border-t-0 lg:border-r-0 lg:border-b-0 lg:bg-zinc-950/72 lg:shadow-none lg:backdrop-blur shrink-0">
              <ComponentInspector
                perspective={state.perspective}
                inspectedId={state.inspectedId}
                onInspect={inspect}
                onClose={() => inspect(null)}
              />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
