import { useEffect } from 'react';
import type { DatasetStatus } from '../hooks/useDatasetGen';
import type { DatasetInfo } from '../hooks/useDatasetGen';

interface Props {
  status: DatasetStatus;
  progress: number;
  rowsGenerated: number;
  datasetInfo: DatasetInfo | null;
  error: string | null;
  isRacing: boolean;
  onGenerate: () => void;
  onCheck: () => void;
}

export default function DatasetPanel({
  status,
  progress,
  rowsGenerated,
  datasetInfo,
  error,
  isRacing,
  onGenerate,
  onCheck,
}: Props) {
  useEffect(() => {
    onCheck();
  }, [onCheck]);

  const isGenerating = status === 'generating';
  const isReady = status === 'ready';

  const statusColor = isReady ? '#4ade80' : isGenerating ? '#FFC107' : '#ef4444';
  const statusText = isReady
    ? 'Ready'
    : isGenerating
      ? `Generating... ${progress}%`
      : status === 'checking'
        ? 'Checking...'
        : status === 'error'
          ? 'Error'
          : 'Not generated';

  const buttonLabel = isReady ? 'Regenerate Dataset' : 'Generate Dataset';
  const buttonDisabled = isGenerating || isRacing || status === 'checking';

  return (
    <div className="dataset-panel panel" data-testid="dataset-panel">
      <div className="dataset-header">
        <div className="dataset-status">
          <span className="dataset-dot" style={{ backgroundColor: statusColor }} />
          <span className="dataset-status-text" style={{ color: statusColor }}>
            {statusText}
          </span>
        </div>
        <button
          className="dataset-btn"
          data-testid="generate-dataset-btn"
          onClick={onGenerate}
          disabled={buttonDisabled}
          style={{
            borderColor: statusColor,
            color: buttonDisabled ? '#555' : statusColor,
          }}
        >
          {buttonLabel}
        </button>
      </div>

      {isGenerating && (
        <div className="dataset-progress">
          <div className="dataset-progress-track">
            <div
              className="dataset-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="dataset-progress-info">
            {(rowsGenerated / 1000).toFixed(0)}k / 1,000k rows
          </span>
        </div>
      )}

      {isReady && datasetInfo && datasetInfo.size_mb > 0 && (
        <div className="dataset-info-row">
          <span>{(datasetInfo.rows / 1_000_000).toFixed(1)}M rows</span>
          <span>{datasetInfo.size_mb.toFixed(1)} MB</span>
        </div>
      )}

      {error && <div className="dataset-error">{error}</div>}
    </div>
  );
}
