import { useStudio } from './hooks/useStudio';
import Header from './components/Header';
import PatchbayView from './components/PatchbayView';
import RoomView from './components/RoomView';
import ChainBuilder from './components/ChainBuilder';
import ComponentInspector from './components/ComponentInspector';
import AnalysisPanel from './components/AnalysisPanel';

function App() {
  const {
    state,
    setPerspective,
    setView,
    selectMic,
    selectPreamp,
    addInsert,
    removeInsert,
    reorderInserts,
    inspect,
    clearChain,
    equalizers,
    outboardProcessors,
  } = useStudio();

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden">
      <Header
        perspective={state.perspective}
        view={state.view}
        onPerspective={setPerspective}
        onView={setView}
        onClearChain={clearChain}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {state.view === 'patchbay' && (
            <PatchbayView
              perspective={state.perspective}
              selectedMic={state.selectedMic}
              selectedPreamp={state.selectedPreamp}
              insertChain={state.insertChain}
              onSelectMic={selectMic}
              onSelectPreamp={selectPreamp}
              onAddInsert={addInsert}
              onRemoveInsert={removeInsert}
              equalizers={equalizers}
              outboardProcessors={outboardProcessors}
            />
          )}

          {state.view === 'room' && (
            <RoomView
              perspective={state.perspective}
              inspectedId={state.inspectedId}
              onInspect={inspect}
            />
          )}

          {state.view === 'chain' && (
            <ChainBuilder
              perspective={state.perspective}
              selectedMic={state.selectedMic}
              selectedPreamp={state.selectedPreamp}
              insertChain={state.insertChain}
              analysis={state.analysis}
              onSelectMic={selectMic}
              onSelectPreamp={selectPreamp}
              onAddInsert={addInsert}
              onRemoveInsert={removeInsert}
              onReorderInserts={reorderInserts}
              onInspect={inspect}
            />
          )}

          {/* Bottom analysis strip */}
          <AnalysisPanel
            perspective={state.perspective}
            analysis={state.analysis}
            selectedMic={state.selectedMic}
            selectedPreamp={state.selectedPreamp}
            insertChain={state.insertChain}
            onClearChain={clearChain}
          />
        </div>

        {/* Right sidebar: Component Inspector */}
        {state.inspectedId && (
          <aside className="w-80 border-l border-zinc-800 bg-zinc-900/50 overflow-y-auto shrink-0">
            <ComponentInspector
              perspective={state.perspective}
              inspectedId={state.inspectedId}
              onClose={() => inspect(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;
