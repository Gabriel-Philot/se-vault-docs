import { useState } from 'react';
import { useRaceSSE } from './hooks/useRaceSSE';
import { useDatasetGen } from './hooks/useDatasetGen';
import RaceTrack from './components/RaceTrack';
import StartButton from './components/StartButton';
import DatasetPanel from './components/DatasetPanel';
import MemoryBars from './components/MemoryBars';
import StageIndicator from './components/StageIndicator';
import Leaderboard from './components/Leaderboard';
import ResultsModal from './components/ResultsModal';

export default function App() {
  const { runners, isRacing, isFinished, startRace, finishOrder } = useRaceSSE();
  const dataset = useDatasetGen();
  const [showResults, setShowResults] = useState(false);

  const datasetReady = dataset.status === 'ready';

  const handleStart = () => {
    setShowResults(false);
    startRace();
  };

  const allFinished = finishOrder.length >= 4;

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Python Data Race</h1>
        <p className="subtitle">Who processes 1M rows fastest?</p>
      </header>

      <DatasetPanel
        status={dataset.status}
        progress={dataset.progress}
        rowsGenerated={dataset.rowsGenerated}
        datasetInfo={dataset.datasetInfo}
        error={dataset.error}
        isRacing={isRacing}
        onGenerate={dataset.generate}
        onCheck={dataset.checkDataset}
      />

      <StartButton isRacing={isRacing} isFinished={isFinished} onStart={handleStart} disabled={!datasetReady} />

      <RaceTrack runners={runners} isRacing={isRacing} />

      <div className="panels-row">
        <MemoryBars runners={runners} />
        <StageIndicator runners={runners} />
      </div>

      <Leaderboard runners={runners} finishOrder={finishOrder} />

      {allFinished && !showResults && (
        <div className="results-prompt">
          <button className="results-btn" data-testid="view-results-btn" onClick={() => setShowResults(true)}>
            View Detailed Results
          </button>
        </div>
      )}

      <ResultsModal
        runners={runners}
        finishOrder={finishOrder}
        show={showResults}
        onClose={() => setShowResults(false)}
      />
    </div>
  );
}
