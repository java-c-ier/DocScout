import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "../Firebase";
import { doc, collection, getDocs } from "firebase/firestore";
import { addAspectReview } from "../Firebase";
import SentimentAnalysis from "./SentimentAnalysis";

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, footer, wide }) {
  const [visible, setVisible] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative bg-white rounded-xl shadow-xl p-5 z-10 w-full mx-4 transition-all duration-200 ${wide ? "max-w-4xl" : "max-w-lg"}`}
        style={{ transform: visible ? "scale(1)" : "scale(0.95)" }}
      >
        {title && <h2 className="text-lg font-semibold mb-4 text-gray-900">{title}</h2>}
        <div className="max-h-[60vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 mt-4">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Mini primitives ──────────────────────────────────────────────────────────
const TYPE_COLORS = {
  government: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  private:    { dot: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
  trust:      { dot: "bg-purple-500",  bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200"  },
  default:    { dot: "bg-gray-400",    bg: "bg-gray-50",    text: "text-gray-600",    border: "border-gray-200"    },
};

function TypeBadge({ type }) {
  const key = (type || "").toLowerCase();
  const c = TYPE_COLORS[key] || TYPE_COLORS.default;
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      <span className="truncate">{type || "N/A"}</span>
    </span>
  );
}

function HospitalAvatar({ name }) {
  const letter = (name || "?")[0].toUpperCase();
  const colors = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700"];
  const color = colors[letter.charCodeAt(0) % colors.length];
  return (
    <span className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold ${color}`}>
      {letter}
    </span>
  );
}

function StarRating({ value }) {
  const num = parseFloat(value) || 0;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-amber-400"><path d="M8 1l1.85 3.75L14 5.5l-3 2.92.7 4.1L8 10.4l-3.7 2.12.7-4.1-3-2.92 4.15-.75z"/></svg>
      {num > 0 ? num.toFixed(1) : "—"}
    </span>
  );
}

function SortIcon({ dir }) {
  if (!dir) return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-gray-300 fill-current"><path d="M5 6l3-3 3 3H5zm6 4l-3 3-3-3h6z"/></svg>
  );
  return dir === "asc"
    ? <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-blue-500 fill-current"><path d="M5 10l3-6 3 6H5z"/></svg>
    : <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-blue-500 fill-current"><path d="M11 6l-3 6-3-6h6z"/></svg>;
}

function IconBtn({ onClick, title, children, tooltipAlign = "center" }) {
  const tooltipPosClass =
    tooltipAlign === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
  return (
    <div className="relative inline-flex group">
      <button
        onClick={onClick}
        aria-label={title}
        className="w-7 h-7 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
      >
        {children}
      </button>
      {title && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute bottom-full ${tooltipPosClass} mb-1.5 whitespace-nowrap rounded-md bg-gray-600 px-2 py-1 text-xs font-medium text-white opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 z-30`}
        >
          {title}
        </span>
      )}
    </div>
  );
}

function RowsPerPageDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        {value} per page
        <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} fill="currentColor">
          <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {mounted && (
        <div
          className="absolute bottom-full mb-1.5 left-0 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 origin-bottom-left transition-all duration-150 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(4px)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              {opt}
              {value === opt && (
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-blue-600" fill="currentColor">
                  <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-6.5 6.5a.75.75 0 01-1.06 0l-3-3a.75.75 0 111.06-1.06l2.47 2.47 5.97-5.97a.75.75 0 011.06 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const VISIBLE_ROWS = 10; // table body never grows past this many rows' worth of height

const Hospitals = ({ hospitals, hasSearched, searchedDistrict, userCoords, sortingByDistance }) => {
  const [activePage, setActivePage] = useState(1);
  const [showNoHospitalsMessage, setShowNoHospitalsMessage] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const tableWrapperRef = useRef(null);
  const [scrollMaxHeight, setScrollMaxHeight] = useState(null);

  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [reviewInputs, setReviewInputs] = useState({ cleanliness: "", behaviour: "", care: "", efficiency: "" });
  const [selectedHospital, setSelectedHospital] = useState(null);

  const [openSentimentDialog, setOpenSentimentDialog] = useState(false);

  const [openDeptDialog, setOpenDeptDialog] = useState(false);
  const [deptDialogHospital, setDeptDialogHospital] = useState(null);
  const [deptExpanded, setDeptExpanded] = useState({});
  const [deptNames, setDeptNames] = useState([]);
  const [deptDoctors, setDeptDoctors] = useState({});
  const [deptDoctorsReady, setDeptDoctorsReady] = useState(false);
  const deptDoctorsCacheRef = useRef({});

  useEffect(() => {
    if (hasSearched && hospitals.length === 0) {
      setShowNoHospitalsMessage(true);
    } else {
      setShowNoHospitalsMessage(false);
    }
  }, [hasSearched, hospitals]);

  // reset page on sort or page-size change
  useEffect(() => { setActivePage(1); }, [sortCol, sortDir, rowsPerPage]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const sortedHospitals = useMemo(() => {
    if (!sortCol) return hospitals;
    return [...hospitals].sort((a, b) => {
      const av = a[sortCol] ?? "";
      const bv = b[sortCol] ?? "";
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [hospitals, sortCol, sortDir]);

  const hospitalsPerPage = rowsPerPage;
  const totalPages = Math.max(1, Math.ceil(sortedHospitals.length / hospitalsPerPage));
  const currentHospitals = sortedHospitals.slice((activePage - 1) * hospitalsPerPage, (activePage - 1) * hospitalsPerPage + hospitalsPerPage);
  const needsScroll = currentHospitals.length > VISIBLE_ROWS;

  useEffect(() => {
    if (!needsScroll || !tableWrapperRef.current) return;
    const wrapper = tableWrapperRef.current;
    const thead = wrapper.querySelector("thead");
    const firstRow = wrapper.querySelector("tbody tr");
    if (thead && firstRow) {
      const headHeight = thead.getBoundingClientRect().height;
      const rowHeight = firstRow.getBoundingClientRect().height;
      setScrollMaxHeight(headHeight + rowHeight * VISIBLE_ROWS);
    }
  }, [needsScroll, currentHospitals]);

  if (!hasSearched) return null;
  if (showNoHospitalsMessage) return (
    <p className="text-center text-gray-500 py-8">No hospitals found in {searchedDistrict}.</p>
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleOpenReviewDialog = (hospital) => {
    setSelectedHospital({ ...hospital, district: searchedDistrict || "Unknown District" });
    setReviewInputs({ cleanliness: "", behaviour: "", care: "", efficiency: "" });
    setOpenReviewDialog(true);
  };
  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
    setReviewInputs({ cleanliness: "", behaviour: "", care: "", efficiency: "" });
  };
  const handleSubmitReview = async () => {
    const { cleanliness, behaviour, care, efficiency } = reviewInputs;
    if (!cleanliness.trim() || !behaviour.trim() || !care.trim() || !efficiency.trim()) {
      alert("All four review fields are required.");
      return;
    }
    try {
      const district = selectedHospital.district;
      const name = selectedHospital.Name;
      await Promise.all([
        addAspectReview(district, name, "Cleanliness_and_Hygiene", cleanliness),
        addAspectReview(district, name, "Doctor_and_Staff_Behaviour", behaviour),
        addAspectReview(district, name, "Quality_of_Care", care),
        addAspectReview(district, name, "Wait_Times_and_Efficiency", efficiency),
      ]);
      alert("Review added successfully!");
      handleCloseReviewDialog();
    } catch (error) {
      console.error("Error adding aspect reviews:", error);
      alert("Error adding review");
    }
  };

  const handleOpenSentimentDialog = (hospital) => {
    setSelectedHospital({ ...hospital, district: searchedDistrict || "Unknown District" });
    setOpenSentimentDialog(true);
  };

  const handleOpenDeptDialog = (hospital) => {
    const names = hospital.departments || [];
    const hospId = hospital.Name.replace(/\s+/g, "_");
    const cached = deptDoctorsCacheRef.current[hospId];

    setDeptDialogHospital(hospital);
    setDeptExpanded({});
    setDeptNames(names);
    setDeptDoctors(cached || {});
    setDeptDoctorsReady(!!cached);
    setOpenDeptDialog(true);

    if (cached || !db || names.length === 0) return;

    const district = searchedDistrict || "Unknown District";
    const hospDocRef = doc(db, "Odisha", district, "Hospitals", hospId);
    (async () => {
      const fetched = {};
      await Promise.all(
        names.map(async (dept) => {
          const snap = await getDocs(collection(hospDocRef, dept));
          fetched[dept] = snap.docs.map((d) => d.data());
        })
      );
      deptDoctorsCacheRef.current[hospId] = fetched;
      setDeptDoctors(fetched);
      setDeptDoctorsReady(true);
    })();
  };
  const handleCloseDeptDialog = () => {
    setOpenDeptDialog(false);
  };
  const toggleDeptAccordion = (deptName) =>
    setDeptExpanded((prev) => ({ ...prev, [deptName]: !prev[deptName] }));
  const formatDeptName = (name) => name.split("_").filter(Boolean).join(" ");

  const showDistance = !!userCoords;
  const formatDistance = (d) => {
    if (d === undefined || d === null || d === Infinity) return "—";
    if (d < 1) return "< 1 km";
    return `${d.toFixed(1)} km`;
  };

  const ALIGN_TEXT = { left: "text-left", center: "text-center", right: "text-right" };
  const ALIGN_JUSTIFY = { left: "", center: "justify-center", right: "justify-end" };
  const HeadCell = ({ id, label, sortable, align = "left", className }) => (
    <th
      className={`px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap select-none ${ALIGN_TEXT[align]} ${sortable ? "cursor-pointer hover:text-gray-700" : ""} ${className || ""}`}
      onClick={sortable ? () => handleSort(id) : undefined}
    >
      <span className={`inline-flex items-center gap-1 ${ALIGN_JUSTIFY[align]}`}>
        {label}
        {sortable && <SortIcon dir={sortCol === id ? sortDir : null} />}
      </span>
    </th>
  );

  return (
    <div className="mt-2 mb-8">
      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-semibold text-gray-900">
              Hospitals in {searchedDistrict}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
              {hospitals.length} {hospitals.length === 1 ? "hospital" : "hospitals"}
            </span>
          </div>
          {sortingByDistance && (
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Sorting by distance…
            </span>
          )}
        </div>

        {/* Table */}
        <div
          ref={tableWrapperRef}
          className="overflow-x-auto"
          style={needsScroll ? { maxHeight: scrollMaxHeight ? `${scrollMaxHeight}px` : undefined, overflowY: "auto" } : undefined}
        >
          <table className="min-w-full table-fixed divide-y divide-gray-100">
            <thead className={`bg-gray-50 ${needsScroll ? "sticky top-0 z-10" : ""}`}>
              <tr>
                <HeadCell id="Name"    label="Name"     sortable className="w-80 pl-5" />
                <HeadCell id="Type"    label="Type"     sortable className="w-44" />
                <HeadCell id="Contact" label="Contact"  className="w-28" />
                <HeadCell id="Rating"  label="Rating"   sortable className="w-20" />
                {showDistance && <HeadCell id="distance" label="Distance" sortable className="w-24" />}
                <HeadCell id="website" label="Website"  align="center" className="w-24" />
                <HeadCell id="map"     label="Google Map Link" align="center" className="w-32" />
                <HeadCell id="review" label="Review" align="right" className="w-28 pr-5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {currentHospitals.map((hospital) => (
                <tr key={hospital.id} className="hover:bg-gray-50 transition-colors">
                  {/* Name + avatar */}
                  <td className="px-3 py-3 pl-5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HospitalAvatar name={hospital.Name} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{hospital.Name || "N/A"}</p>
                      </div>
                      <IconBtn onClick={() => handleOpenDeptDialog(hospital)} title="See Hospital Details">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                          <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.147.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </IconBtn>
                    </div>
                  </td>

                  {/* Type badge */}
                  <td className="px-3 py-3 overflow-hidden">
                    <TypeBadge type={hospital.Type} />
                  </td>

                  {/* Contact */}
                  <td className="px-3 py-3 text-sm text-gray-600 truncate">
                    {hospital.Contact || "—"}
                  </td>

                  {/* Rating */}
                  <td className="px-3 py-3 whitespace-nowrap overflow-hidden">
                    <StarRating value={hospital.Rating} />
                  </td>

                  {/* Distance */}
                  {showDistance && (
                    <td className="px-3 py-3 whitespace-nowrap overflow-hidden text-xs font-medium text-blue-600">
                      {sortingByDistance ? (
                        <span className="text-gray-400">…</span>
                      ) : formatDistance(hospital.distance)}
                    </td>
                  )}

                  {/* Website */}
                  <td className="px-3 py-3 whitespace-nowrap overflow-hidden text-center">
                    {hospital.Website ? (
                      <a href={hospital.Website} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        Visit
                      </a>
                    ) : <span className="text-xs text-gray-400">N/A</span>}
                  </td>

                  {/* Google Map Link */}
                  <td className="px-3 py-3 whitespace-nowrap overflow-hidden text-center">
                    {hospital["Google Map Link"] ? (
                      <a href={hospital["Google Map Link"]} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        View Map
                      </a>
                    ) : <span className="text-xs text-gray-400">N/A</span>}
                  </td>

                  {/* Actions */}
                  <td className="px-3 pr-5 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-0.5">
                      {/* Give Review */}
                      <IconBtn onClick={() => handleOpenReviewDialog(hospital)} title="Give Review" tooltipAlign="right">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                        </svg>
                      </IconBtn>

                      {/* See Review */}
                      <IconBtn onClick={() => handleOpenSentimentDialog(hospital)} title="See Reviews" tooltipAlign="right">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM6 9a1 1 0 11-2 0 1 1 0 012 0zm5 1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer: rows-per-page + pagination */}
        {sortedHospitals.length > 10 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-gray-700">
                Page {activePage} of {totalPages}
              </p>
              <RowsPerPageDropdown
                value={rowsPerPage}
                options={ROWS_PER_PAGE_OPTIONS}
                onChange={setRowsPerPage}
              />
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  disabled={activePage === 1}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - activePage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-xs">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setActivePage(p)}
                        className={`w-7 h-7 rounded-md text-xs font-medium transition ${
                          activePage === p
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                  disabled={activePage === totalPages}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Departments Modal */}
      <Modal
        open={openDeptDialog}
        onClose={handleCloseDeptDialog}
        title={`Departments — ${deptDialogHospital?.Name || ""}`}
        footer={
          <button onClick={handleCloseDeptDialog} className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
            Close
          </button>
        }
      >
        <div className="space-y-3">
          {deptNames.length > 0 ? (
            deptNames.map((deptName) => (
              <div key={deptName} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleDeptAccordion(deptName)}
                  className="w-full px-4 py-2.5 text-left bg-blue-50 text-sm font-semibold text-blue-800 hover:bg-blue-100 transition flex items-center justify-between"
                >
                  {formatDeptName(deptName)}
                  <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${deptExpanded[deptName] ? "rotate-180" : ""}`}>
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${deptExpanded[deptName] ? "max-h-96" : "max-h-0"}`}>
                  <div className="p-4 bg-white text-sm text-gray-700 max-h-[300px] overflow-y-auto space-y-4">
                    {(deptDoctors[deptName] || []).length > 0 ? (
                      deptDoctors[deptName].map((doc, idx) => (
                        <div key={idx} className="pl-2 border-l-2 border-blue-200">
                          <p className="font-semibold text-gray-900">{doc.Name}</p>
                          <p className="text-gray-500">{doc.Qualification} · {doc.Specialization}</p>
                          <p className="text-gray-500">Exp: {doc.Experience} · {doc.Timing}</p>
                        </div>
                      ))
                    ) : deptDoctorsReady ? (
                      <p className="text-center text-gray-400">No doctors in this department.</p>
                    ) : (
                      <p className="text-center text-gray-400">Loading doctors…</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-4">No department data available.</p>
          )}
        </div>
      </Modal>

      {/* Review Submission Modal */}
      <Modal
        open={openReviewDialog}
        onClose={handleCloseReviewDialog}
        title="Submit Your Review"
        footer={
          <>
            <button onClick={handleCloseReviewDialog} className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition">Cancel</button>
            <button onClick={handleSubmitReview} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">Submit</button>
          </>
        }
      >
        <div className="space-y-4">
          {[
            { key: "cleanliness", label: "Cleanliness and Hygiene" },
            { key: "behaviour",   label: "Doctor and Staff Behaviour" },
            { key: "care",        label: "Quality of Care" },
            { key: "efficiency",  label: "Wait Times and Efficiency" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={reviewInputs[key]}
                onChange={(e) => setReviewInputs({ ...reviewInputs, [key]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={label}
              />
            </div>
          ))}
        </div>
      </Modal>

      {/* Sentiment Analysis Modal */}
      <Modal
        open={openSentimentDialog}
        onClose={() => setOpenSentimentDialog(false)}
        title={`Reviews — ${selectedHospital?.Name || ""}`}
        wide
        footer={
          <button onClick={() => setOpenSentimentDialog(false)} className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition">Close</button>
        }
      >
        {selectedHospital && (
          <SentimentAnalysis hospital={selectedHospital} searchedDistrict={searchedDistrict} />
        )}
      </Modal>
    </div>
  );
};

export default Hospitals;
