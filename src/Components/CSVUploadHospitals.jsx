import { useState, useEffect } from "react";
import Papa from "papaparse";
import { toast } from "react-toastify";
import { addHospital } from '../supabase';

const PREVIEW_ROWS = 8;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve({ data: results.data, fields: results.meta.fields || [] }),
      error: reject,
    });
  });
}

const EXPECTED_COLUMNS = ["Name", "Website", "Rating", "Type", "Contact", "GoogleMapLink"];

function validateColumns(fields) {
  return EXPECTED_COLUMNS.filter((c) => !fields.includes(c));
}

function Tooltip({ label, children }) {
  return (
    <div className="relative group/tooltip flex-1 min-w-0">
      {children}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap rounded-md bg-gray-900 text-white text-xs px-2.5 py-1.5 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 z-30">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

function CsvPreviewModal({ entry, onClose }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [renderedEntry, setRenderedEntry] = useState(entry);

  useEffect(() => {
    if (entry) {
      setRenderedEntry(entry);
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [entry]);

  useEffect(() => {
    if (!mounted) return;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.documentElement.style.overscrollBehaviorX;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehaviorX = "none";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overscrollBehaviorX = originalOverscroll;
    };
  }, [mounted]);

  if (!mounted) return null;
  const e = renderedEntry;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.95)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800 truncate">{e.file.name}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition shrink-0"
            aria-label="Close preview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {e.parsing ? (
          <div className="p-6 text-sm text-gray-500">Parsing preview...</div>
        ) : e.parseError ? (
          <div className="p-6 text-sm text-red-500">Couldn't preview this file.</div>
        ) : (
          <>
            <div className="overflow-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <table className="min-w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    {e.fields.map((f) => (
                      <th key={f} className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap border-b border-gray-200">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {e.data.slice(0, PREVIEW_ROWS).map((row, i) => (
                    <tr key={i} className="odd:bg-white even:bg-gray-50">
                      {e.fields.map((f) => (
                        <td key={f} className="px-3 py-1.5 text-gray-600 whitespace-nowrap border-b border-gray-100">
                          {row[f] || <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-1.5 text-[11px] text-gray-400 border-t border-gray-100">
              Showing {Math.min(PREVIEW_ROWS, e.data.length)} of {e.data.length} row(s)
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CSVUploadHospitals() {
  const [entries, setEntries] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);

  const acceptFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    const valid = incoming.filter((f) => f.type === "text/csv" || f.name.endsWith(".csv"));
    if (valid.length !== incoming.length) {
      toast.error("Only CSV files are allowed — some files were skipped.");
    }
    if (!valid.length) return;

    const newEntries = valid.map((file) => ({ file, parsing: true, parseError: false, data: [], fields: [] }));
    setEntries((prev) => [...prev, ...newEntries]);

    newEntries.forEach((entry) => {
      parseCsv(entry.file)
        .then(({ data, fields }) => {
          setEntries((prev) => prev.map((e) => (e === entry ? { ...e, parsing: false, data, fields } : e)));
        })
        .catch(() => {
          setEntries((prev) => prev.map((e) => (e === entry ? { ...e, parsing: false, parseError: true } : e)));
        });
    });
  };

  const handleFileChange = (e) => {
    acceptFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    acceptFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setPreviewIndex((prev) => (prev === index ? null : prev));
  };

  const handleFileUpload = async () => {
    if (!entries.length) {
      toast.error("Please select at least one file first!");
      return;
    }
    if (entries.some((e) => e.parsing)) {
      toast.error("Please wait for files to finish parsing.");
      return;
    }

    setUploading(true);
    try {
      const errors = [];
      entries.forEach((entry) => {
        const missing = validateColumns(entry.fields);
        if (missing.length) {
          errors.push({ fileName: entry.file.name, missing });
        }
      });
      if (errors.length) {
        errors.forEach(({ fileName, missing }) =>
          toast.error(
            <span>
              {fileName} - Missing Column(s): <span className="font-semibold text-white">{missing.join(", ")}</span>
            </span>,
            { autoClose: 8000 }
          )
        );
        return;
      }

      let total = 0;
      for (const entry of entries) {
        for (const hospital of entry.data) {
          await addHospital(hospital, entry.file.name);
        }
        total += entry.data.length;
      }
      toast.success(`${total} hospital(s) added successfully!`);
      setEntries([]);
    } catch (err) {
      console.error("Error uploading hospitals:", err);
      toast.error("Error uploading hospitals — see console.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-[72px] pb-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#1a8efd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0-13.5v6m0 0h3m-3 0H9" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Hospitals</h1>
          <p className="text-gray-500 text-sm text-center">Bulk-add hospital records from one or more CSV files.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <label
            htmlFor="csvFile"
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition ${
              dragActive ? "border-[#1a8efd] bg-blue-50" : "border-gray-300 hover:border-[#1a8efd] hover:bg-blue-50/40"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-gray-700">Click to choose or drag CSV files here</p>
            <p className="text-xs text-gray-400">.csv files only · multiple allowed</p>
            <input id="csvFile" type="file" accept=".csv" multiple onChange={handleFileChange} className="hidden" />
          </label>

          {entries.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {entries.map((entry, i) => (
                <li key={`${entry.file.name}-${i}`} className="flex items-center gap-2">
                  <Tooltip label="Click to preview file content">
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(i)}
                      className="w-full flex items-center gap-2.5 min-w-0 text-left cursor-pointer bg-gray-50 border border-gray-200 hover:border-[#1a8efd] rounded-lg px-4 py-2.5 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#1a8efd] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{entry.file.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(entry.file.size)}</p>
                      </div>
                    </button>
                  </Tooltip>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition shrink-0 cursor-pointer"
                    aria-label={`Remove ${entry.file.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={handleFileUpload}
            disabled={!entries.length || uploading}
            className="w-full mt-6 bg-[#1a8efd] hover:bg-[#0077e6] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg text-base font-semibold transition"
          >
            {uploading ? "Uploading..." : `Upload ${entries.length > 1 ? `${entries.length} CSVs` : "CSV"}`}
          </button>
        </div>
      </div>

      <CsvPreviewModal
        entry={previewIndex !== null ? entries[previewIndex] ?? null : null}
        onClose={() => setPreviewIndex(null)}
      />
    </section>
  );
}

export default CSVUploadHospitals;
