import React, { useState, useEffect } from "react";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { db } from "../Firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { addAspectReview } from "../Firebase";
import SentimentAnalysis from "./SentimentAnalysis";

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
        className={`relative bg-white rounded-lg shadow-xl p-5 z-10 w-full mx-4 transition-all duration-200 ${wide ? "max-w-4xl" : "max-w-lg"}`}
        style={{ transform: visible ? "scale(1)" : "scale(0.95)" }}
      >
        {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
        <div className="max-h-[60vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 mt-4">{footer}</div>}
      </div>
    </div>
  );
}

const Hospitals = ({ hospitals, hasSearched, searchedDistrict, userCoords, sortingByDistance }) => {
  const [activePage, setActivePage] = useState(1);
  const [showNoHospitalsMessage, setShowNoHospitalsMessage] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);

  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [reviewInputs, setReviewInputs] = useState({ cleanliness: "", behaviour: "", care: "", efficiency: "" });
  const [selectedHospital, setSelectedHospital] = useState(null);

  const [openSentimentDialog, setOpenSentimentDialog] = useState(false);

  const [openDeptDialog, setOpenDeptDialog] = useState(false);
  const [deptDialogHospital, setDeptDialogHospital] = useState(null);
  const [deptExpanded, setDeptExpanded] = useState({});
  const [deptNames, setDeptNames] = useState([]);
  const [deptDoctors, setDeptDoctors] = useState({});

  useEffect(() => {
    const fetchHospitals = async () => {
      if (hasSearched) {
        setIsDataFetched(false);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsDataFetched(true);
      } else {
        setIsDataFetched(false);
      }
    };
    fetchHospitals();
  }, [hasSearched]);

  useEffect(() => {
    if (isDataFetched && hospitals.length === 0) {
      setShowNoHospitalsMessage(true);
    } else {
      setShowNoHospitalsMessage(false);
    }
  }, [isDataFetched, hospitals]);

  const hospitalsPerPage = 10;
  const totalPages = Math.ceil(hospitals.length / hospitalsPerPage);
  const indexOfLastHospital = activePage * hospitalsPerPage;
  const indexOfFirstHospital = indexOfLastHospital - hospitalsPerPage;
  const currentHospitals = hospitals.slice(indexOfFirstHospital, indexOfLastHospital);

  const next = () => { if (activePage < totalPages) setActivePage(activePage + 1); };
  const prev = () => { if (activePage > 1) setActivePage(activePage - 1); };

  if (!hasSearched || !isDataFetched) return null;
  if (showNoHospitalsMessage) return <p className="text-center text-gray-500">No hospitals available.</p>;

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

  const handleOpenDeptDialog = async (hospital) => {
    setDeptDialogHospital(hospital);
    setDeptExpanded({});
    setDeptNames([]);
    setDeptDoctors({});
    setOpenDeptDialog(true);
    if (!db) return;

    const district = searchedDistrict || "Unknown District";
    const hospId = hospital.Name.replace(/\s+/g, "_");
    const hospDocRef = doc(db, "Odisha", district, "Hospitals", hospId);

    const hospSnap = await getDoc(hospDocRef);
    const names = hospSnap.exists() ? hospSnap.data().departments || [] : [];
    setDeptNames(names);

    const fetched = {};
    await Promise.all(
      names.map(async (dept) => {
        const snap = await getDocs(collection(hospDocRef, dept));
        fetched[dept] = snap.docs.map((d) => d.data());
      })
    );
    setDeptDoctors(fetched);
  };
  const handleCloseDeptDialog = () => {
    setOpenDeptDialog(false);
    setDeptDialogHospital(null);
    setDeptNames([]);
    setDeptDoctors({});
  };
  const toggleDeptAccordion = (deptName) =>
    setDeptExpanded((prev) => ({ ...prev, [deptName]: !prev[deptName] }));

  const showDistance = !!userCoords;

  const formatDistance = (d) => {
    if (d === undefined || d === null) return "—";
    if (d === Infinity) return "—";
    if (d < 1) return "< 1 km";
    return `${d.toFixed(1)} km`;
  };

  return (
    <div className="overflow-x-auto w-full">
      {sortingByDistance && (
        <div className="flex items-center gap-2 mb-3 text-sm text-blue-600 font-medium">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Sorting by distance from your location...
        </div>
      )}
      <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th className="px-4 py-4 text-left">Name</th>
            <th className="px-4 py-2 text-center">Contact</th>
            <th className="px-4 py-2 text-center">Type</th>
            <th className="px-4 py-2 text-center">Rating</th>
            {showDistance && <th className="px-4 py-2 text-center">Distance</th>}
            <th className="px-4 py-2 text-center">Website</th>
            <th className="px-4 py-2 text-center">Google Map Link</th>
            <th className="text-center px-4 py-2">Review</th>
          </tr>
        </thead>
        <tbody>
          {currentHospitals.map((hospital) => (
            <tr key={hospital.id} className="border-t border-gray-300 hover:bg-gray-100">
              <td className="px-4 py-3 flex items-center gap-2">
                {hospital.Name || "N/A"}
                <button
                  onClick={() => handleOpenDeptDialog(hospital)}
                  className="transform transition-transform duration-200 hover:rotate-45 text-blue-500"
                  title="View Departments"
                >
                  ↗
                </button>
              </td>
              <td className="px-4 py-3 text-center">{hospital.Contact || "N/A"}</td>
              <td className="px-4 py-3 text-center">{hospital.Type || "N/A"}</td>
              <td className="px-4 py-3 text-center">{hospital.Rating || 0}</td>
              {showDistance && (
                <td className="px-4 py-3 text-center text-sm font-medium text-blue-600">
                  {sortingByDistance ? "..." : formatDistance(hospital.distance)}
                </td>
              )}
              <td className="px-4 py-3 text-center">
                {hospital.Website ? (
                  <a href={hospital.Website} target="_blank" rel="noopener noreferrer" className="text-blue-500">Visit</a>
                ) : "N/A"}
              </td>
              <td className="px-4 py-2 text-center">
                {hospital["Google Map Link"] ? (
                  <a href={hospital["Google Map Link"]} target="_blank" rel="noopener noreferrer" className="text-blue-500">View Map</a>
                ) : "N/A"}
              </td>
              <td className="text-center flex flex-col sm:flex-row justify-center items-center gap-2 py-2">
                <button
                  className="bg-blue-500 text-white px-3.5 py-1 w-fit rounded-full hover:scale-110 transition-all text-sm"
                  onClick={() => handleOpenReviewDialog(hospital)}
                >
                  Give Review
                </button>
                <button
                  className="bg-green-500 text-white px-3.5 py-1 w-fit rounded-full hover:scale-110 transition-all text-sm"
                  onClick={() => handleOpenSentimentDialog(hospital)}
                >
                  See Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-4 items-center">
          <button
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-100 transition"
            onClick={prev}
            disabled={activePage === 1}
          >
            <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" /> Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setActivePage(i + 1)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition ${
                  activePage === i + 1
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-100 transition"
            onClick={next}
            disabled={activePage === totalPages}
          >
            Next <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Departments Modal */}
      <Modal
        open={openDeptDialog}
        onClose={handleCloseDeptDialog}
        title={`Departments – ${deptDialogHospital?.Name || ""}`}
        footer={
          <button onClick={handleCloseDeptDialog} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
            Close
          </button>
        }
      >
        <div className="space-y-3">
          {deptNames.length > 0 ? (
            deptNames.map((deptName) => (
              <div key={deptName} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleDeptAccordion(deptName)}
                  className="w-full px-4 py-2 text-left bg-blue-100 font-semibold hover:bg-blue-200 transition"
                >
                  {deptName}
                </button>
                <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${deptExpanded[deptName] ? "max-h-96" : "max-h-0"}`}>
                  <div className="p-4 bg-white text-sm text-gray-700 max-h-[300px] overflow-y-auto">
                    {(deptDoctors[deptName] || []).length > 0 ? (
                      deptDoctors[deptName].map((doc, idx) => (
                        <div key={idx} className="pb-5 pl-2">
                          <strong className="font-semibold text-base text-gray-900">{doc.Name}</strong> – {doc.Qualification}<br />
                          Specialization - {doc.Specialization}<br />
                          Experience - {doc.Experience}<br />
                          Timing - {doc.Timing}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500">No doctors in this department.</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No department data available.</p>
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
            <button onClick={handleCloseReviewDialog} className="px-4 py-2 rounded text-red-500 hover:bg-red-50 transition mr-2">Cancel</button>
            <button onClick={handleSubmitReview} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">Submit</button>
          </>
        }
      >
        <div className="space-y-4">
          {[
            { key: "cleanliness", label: "Cleanliness and Hygiene" },
            { key: "behaviour", label: "Doctor and Staff Behaviour" },
            { key: "care", label: "Quality of Care" },
            { key: "efficiency", label: "Wait Times and Efficiency" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={reviewInputs[key]}
                onChange={(e) => setReviewInputs({ ...reviewInputs, [key]: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
          <button onClick={() => setOpenSentimentDialog(false)} className="px-4 py-2 rounded text-red-500 hover:bg-red-50 transition">Close</button>
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
