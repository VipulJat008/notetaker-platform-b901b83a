import { useState, useRef, useCallback } from 'react';
import { CloudUpload, FileText, X, CheckCircle, XCircle, AlertCircle, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';

interface ValidationError { row: number; message: string; }
type IngestionState = 'idle' | 'selected' | 'parsing' | 'complete-valid' | 'complete-errors';

/* ─── Presentational ───────────────────────────────────── */
interface CSVIngestionViewProps {
  state: IngestionState;
  fileName: string;
  fileSize: string;
  progress: number;
  parsedRows: number;
  totalRows: number;
  validCount: number;
  errors: ValidationError[];
  isDragOver: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onZoneClick: () => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onStartIngestion: () => void;
  onProceed: () => void;
  onDownloadErrors: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function CSVIngestionView({
  state, fileName, fileSize, progress, parsedRows, totalRows,
  validCount, errors, isDragOver,
  onDrop, onDragOver, onDragLeave, onZoneClick, onFileInput,
  onRemoveFile, onStartIngestion, onProceed, onDownloadErrors, fileInputRef,
}: CSVIngestionViewProps) {
  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.07)]">
        <div>
          <h1 className="font-code text-[28px] font-bold text-[#F8FAFC]">CSV Ingestion</h1>
          <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)] mt-1">Upload and parse call note files (schema: timestamp, call_notes, order_ids)</p>
        </div>
        <button
          onClick={onZoneClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer transition-all duration-[200ms] hover:opacity-90 hover:-translate-y-px focus-visible:outline-[#22C55E] focus-visible:outline-offset-2"
        >
          <Upload size={16} aria-hidden="true" />
          Upload New CSV File
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={onFileInput}
        className="sr-only"
        aria-label="Select CSV file"
        tabIndex={-1}
      />

      {/* Upload Drop Zone / File Selected */}
      {(state === 'idle' || state === 'selected') && (
        <div
          className="rounded-[12px] border-2 border-dashed p-12 mb-6 flex flex-col items-center text-center transition-all duration-[200ms]"
          style={{
            background: isDragOver ? 'rgba(34,197,94,0.04)' : 'var(--color-secondary)',
            borderColor: isDragOver ? '#22C55E' : 'rgba(255,255,255,0.15)',
            boxShadow: 'var(--shadow-md)',
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          {state === 'idle' ? (
            <>
              <CloudUpload
                size={48}
                className="mb-4 transition-colors duration-[200ms]"
                style={{ color: isDragOver ? '#22C55E' : 'rgba(248,250,252,0.3)' }}
                aria-hidden="true"
              />
              <p className="font-code text-[18px] font-semibold text-[#F8FAFC] mb-2">Drag &amp; drop CSV file here</p>
              <button
                onClick={onZoneClick}
                role="button"
                aria-label="Upload CSV file — click or drag and drop"
                tabIndex={0}
                className="font-sans text-[14px] text-[rgba(248,250,252,0.5)] hover:text-[#22C55E] hover:underline cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E] rounded mb-4"
              >
                or click to browse
              </button>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[rgba(34,197,94,0.15)] font-sans text-[12px] font-medium text-[#22C55E] mb-3">
                Schema: timestamp · call_notes · order_ids
              </span>
              <p className="font-sans text-[12px] text-[rgba(248,250,252,0.35)]">Max file size: 5 MB · Supported: .csv</p>
            </>
          ) : (
            /* File selected */
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
              <FileText size={32} className="text-[#22C55E]" aria-hidden="true" />
              <p className="font-code text-[15px] font-medium text-[#F8FAFC]">{fileName}</p>
              <p className="font-sans text-[13px] text-[rgba(248,250,252,0.5)]">{fileSize}</p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={onRemoveFile}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] font-sans text-[13px] text-[rgba(248,250,252,0.5)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)] hover:text-[#F8FAFC] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E]"
                >
                  <X size={14} aria-hidden="true" /> Remove
                </button>
                <button
                  onClick={onStartIngestion}
                  className="flex items-center gap-2 px-5 py-2 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] focus-visible:outline-[#22C55E]"
                >
                  <Upload size={15} aria-hidden="true" /> Start Ingestion
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parsing Progress */}
      {state === 'parsing' && (
        <div
          className="rounded-[12px] p-6 mb-6 border border-[rgba(255,255,255,0.06)]"
          style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-sans text-[14px] text-[rgba(248,250,252,0.7)]">Parsing rows…</p>
            <span className="font-code text-[15px] font-semibold text-[#22C55E]">{progress}%</span>
          </div>
          <div className="progress-bar w-full mb-2">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p
            className="font-sans text-[13px] text-[rgba(248,250,252,0.5)]"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="CSV parsing progress"
          >
            Rows parsed: {parsedRows.toLocaleString()} / {totalRows.toLocaleString()}
          </p>
        </div>
      )}

      {/* Validation Results */}
      {(state === 'complete-valid' || state === 'complete-errors') && (
        <div
          role="region"
          aria-label="Validation results"
          aria-live="polite"
          className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)]"
          style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
        >
          {/* Summary row */}
          <div className="flex items-center gap-6 mb-4">
            <span className="flex items-center gap-2 font-sans text-[14px] font-medium text-[#22C55E]">
              <CheckCircle size={18} className="text-[#22C55E]" aria-hidden="true" />
              {validCount.toLocaleString()} rows valid
            </span>
            {errors.length > 0 && (
              <span className="flex items-center gap-2 font-sans text-[14px] font-medium text-[#EF4444]">
                <XCircle size={18} className="text-[#EF4444]" aria-hidden="true" />
                {errors.length} rows with errors
              </span>
            )}
          </div>

          {state === 'complete-valid' && (
            <>
              <div className="p-4 rounded-[8px] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] mb-4">
                <p className="font-sans text-[14px] font-medium text-[#22C55E]">All {totalRows.toLocaleString()} rows parsed and validated successfully. Ready to ingest.</p>
              </div>
              <button
                onClick={onProceed}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] focus-visible:outline-[#22C55E]"
              >
                Proceed to Ingest
              </button>
            </>
          )}

          {errors.length > 0 && (
            <>
              <ul role="list" className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertCircle size={14} className="text-[#EF4444] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      <span className="font-code font-semibold text-[#22C55E] text-[13px]">Row {err.row}</span>
                      <span className="font-sans text-[13px] text-[rgba(248,250,252,0.75)] ml-2">{err.message}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onDownloadErrors}
                aria-label="Download CSV validation error report"
                className="flex items-center gap-2 px-4 py-2 rounded-[8px] font-sans text-[14px] font-medium text-[rgba(248,250,252,0.8)] border border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E]"
              >
                Download Error Report
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Container ────────────────────────────────────────── */
export default function CSVIngestion() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<IngestionState>('idle');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [parsedRows, setParsedRows] = useState(0);
  const [totalRows] = useState(2000);
  const [validCount, setValidCount] = useState(0);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Invalid file type. Please upload a .csv file.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File exceeds 5 MB limit.', 'error');
      return;
    }
    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    setSelectedFile(file);
    setState('selected');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };

  const handleStartIngestion = async () => {
    if (!selectedFile) return;
    setState('parsing');
    /* Simulate parsing progress */
    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 15) + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setParsedRows(2000);
        setProgress(100);
        const mockErrors: ValidationError[] = [
          { row: 42, message: 'Missing required field: order_ids' },
          { row: 118, message: 'Invalid timestamp format' },
        ];
        setErrors(mockErrors);
        setValidCount(1987);
        setState(mockErrors.length > 0 ? 'complete-errors' : 'complete-valid');
        if (mockErrors.length > 0) {
          showToast(`Parsing complete. 1,987 valid, ${mockErrors.length} errors.`, 'warning');
        }
      } else {
        setParsedRows(Math.floor((p / 100) * 2000));
        setProgress(p);
      }
    }, 200);
  };

  const handleProceed = () => {
    showToast('Ingestion job queued.', 'success');
    navigate('/monitoring/ingestion');
  };

  return (
    <CSVIngestionView
      state={state}
      fileName={fileName}
      fileSize={fileSize}
      progress={progress}
      parsedRows={parsedRows}
      totalRows={totalRows}
      validCount={validCount}
      errors={errors}
      isDragOver={isDragOver}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onZoneClick={() => fileInputRef.current?.click()}
      onFileInput={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      onRemoveFile={() => { setState('idle'); setSelectedFile(null); setFileName(''); setFileSize(''); }}
      onStartIngestion={handleStartIngestion}
      onProceed={handleProceed}
      onDownloadErrors={() => showToast('Error report downloaded.', 'info')}
      fileInputRef={fileInputRef}
    />
  );
}
