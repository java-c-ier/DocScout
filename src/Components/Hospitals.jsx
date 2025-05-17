import React, { useState, useEffect } from "react";
import {
  Button,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
} from "@material-tailwind/react";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { db } from "../Firebase"; // still used for departments
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { addAspectReview } from "../Firebase"; // our new helper
import SentimentAnalysis from "./SentimentAnalysis";

const Hospitals = ({ hospitals, hasSearched, searchedDistrict }) => {
  // ─ pagination & data fetch ─
  const [activePage, setActivePage] = useState(1);
  const [showNoHospitalsMessage, setShowNoHospitalsMessage] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);

  // ─ review dialog ─
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [reviewInputs, setReviewInputs] = useState({
    cleanliness: "",
    behaviour: "",
    care: "",
    efficiency: "",
  });
  const [selectedHospital, setSelectedHospital] = useState(null);

  // ─ sentiment dialog ─
  const [openSentimentDialog, setOpenSentimentDialog] = useState(false);

  // ─ departments dialog ─
  const [openDeptDialog, setOpenDeptDialog] = useState(false);
  const [deptDialogHospital, setDeptDialogHospital] = useState(null);
  const [deptExpanded, setDeptExpanded] = useState({});
  const [deptNames, setDeptNames] = useState([]);
  const [deptDoctors, setDeptDoctors] = useState({});

  // simulate fetch delay
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

  // pagination logic
  const hospitalsPerPage = 10;
  const totalPages = Math.ceil(hospitals.length / hospitalsPerPage);
  const indexOfLastHospital = activePage * hospitalsPerPage;
  const indexOfFirstHospital = indexOfLastHospital - hospitalsPerPage;
  const currentHospitals = hospitals.slice(
    indexOfFirstHospital,
    indexOfLastHospital
  );

  const next = () => {
    if (activePage < totalPages) setActivePage(activePage + 1);
  };
  const prev = () => {
    if (activePage > 1) setActivePage(activePage - 1);
  };
  const getItemProps = (index) => ({
    variant: activePage === index ? "filled" : "text",
    color: "gray",
    onClick: () => setActivePage(index),
    className: "rounded-full",
    style:
      activePage === index
        ? { backgroundColor: "#2294f2", color: "white" }
        : {},
  });

  if (!hasSearched || !isDataFetched) return null;
  if (showNoHospitalsMessage)
    return <p className="text-center text-gray-500">No hospitals available.</p>;

  // ─── REVIEW handlers ───
  const handleOpenReviewDialog = (hospital) => {
    setSelectedHospital({
      ...hospital,
      district: searchedDistrict || "Unknown District",
    });
    setReviewInputs({
      cleanliness: "",
      behaviour: "",
      care: "",
      efficiency: "",
    });
    setOpenReviewDialog(true);
  };
  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
    setReviewInputs({
      cleanliness: "",
      behaviour: "",
      care: "",
      efficiency: "",
    });
  };
  const handleSubmitReview = async () => {
    const { cleanliness, behaviour, care, efficiency } = reviewInputs;
    if (
      !cleanliness.trim() ||
      !behaviour.trim() ||
      !care.trim() ||
      !efficiency.trim()
    ) {
      alert("All four review fields are required.");
      return;
    }

    try {
      const district = selectedHospital.district;
      const name = selectedHospital.Name;

      await Promise.all([
        addAspectReview(district, name, "Cleanliness_and_Hygiene", cleanliness),
        addAspectReview(
          district,
          name,
          "Doctor_and_Staff_Behaviour",
          behaviour
        ),
        addAspectReview(district, name, "Quality_of_Care", care),
        addAspectReview(
          district,
          name,
          "Wait_Times_and_Efficiency",
          efficiency
        ),
      ]);

      alert("Review added successfully!");
      handleCloseReviewDialog();
    } catch (error) {
      console.error("Error adding aspect reviews:", error);
      alert("Error adding review");
    }
  };

  // ─── SENTIMENT handlers ───
  const handleOpenSentimentDialog = (hospital) => {
    setSelectedHospital({
      ...hospital,
      district: searchedDistrict || "Unknown District",
    });
    setOpenSentimentDialog(true);
  };
  const handleCloseSentimentDialog = () => {
    setOpenSentimentDialog(false);
  };

  // ─── DEPARTMENT handlers & dynamic fetch ───
  const handleOpenDeptDialog = async (hospital) => {
    setDeptDialogHospital(hospital);
    setDeptExpanded({});
    setDeptNames([]);
    setDeptDoctors({});
    setOpenDeptDialog(true);

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

  return (
    <div className="overflow-x-auto w-full">
      {/* ─── HOSPITALS TABLE ─── */}
      <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th className="px-4 py-4 text-left">Name</th>
            <th className="px-4 py-2 text-center">Contact</th>
            <th className="px-4 py-2 text-center">Type</th>
            <th className="px-4 py-2 text-center">Rating</th>
            <th className="px-4 py-2 text-center">Website</th>
            <th className="px-4 py-2 text-center">Google Map Link</th>
            <th className="text-center px-4 py-2">Review</th>
          </tr>
        </thead>
        <tbody>
          {currentHospitals.map((hospital) => (
            <tr
              key={hospital.id}
              className="border-t border-gray-300 hover:bg-gray-100">
              <td className="px-4 py-3 flex items-center gap-2">
                {hospital.Name || "N/A"}
                <button
                  onClick={() => handleOpenDeptDialog(hospital)}
                  className="transform transition-transform duration-200 hover:rotate-45 text-blue-500"
                  title="View Departments">
                  ↗
                </button>
              </td>
              <td className="px-4 py-3 text-center">
                {hospital.Contact || "N/A"}
              </td>
              <td className="px-4 py-3 text-center">
                {hospital.Type || "N/A"}
              </td>
              <td className="px-4 py-3 text-center">{hospital.Rating || 0}</td>
              <td className="px-4 py-3 text-center">
                {hospital.Website ? (
                  <a
                    href={hospital.Website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500">
                    Visit
                  </a>
                ) : (
                  "N/A"
                )}
              </td>
              <td className="px-4 py-2 text-center">
                {hospital["Google Map Link"] ? (
                  <a
                    href={hospital["Google Map Link"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500">
                    View Map
                  </a>
                ) : (
                  "N/A"
                )}
              </td>
              <td className="text-center flex flex-col sm:flex-row justify-center items-center gap-2 py-2">
                <Button
                  className="bg-blue-500 text-white px-3.5 py-1 w-fit rounded-full hover:scale-110 transition-all text-sm"
                  onClick={() => handleOpenReviewDialog(hospital)}>
                  Give Review
                </Button>
                <Button
                  className="bg-green-500 text-white px-3.5 py-1 w-fit rounded-full hover:scale-110 transition-all text-sm"
                  onClick={() => handleOpenSentimentDialog(hospital)}>
                  See Review
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── PAGINATION ─── */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-4">
          <Button
            variant="text"
            className="flex items-center gap-2 rounded-full"
            onClick={prev}
            disabled={activePage === 1}>
            <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" /> Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <IconButton key={index + 1} {...getItemProps(index + 1)}>
                {index + 1}
              </IconButton>
            ))}
          </div>
          <Button
            variant="text"
            className="flex items-center gap-2 rounded-full"
            onClick={next}
            disabled={activePage === totalPages}>
            Next <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ─── DEPARTMENTS DIALOG ─── */}
      <Dialog
        open={openDeptDialog}
        handler={handleCloseDeptDialog}
        className="p-5">
        <DialogHeader className="m-3 md:m-0 sm:p-2">
          Departments – {deptDialogHospital?.Name || ""}
        </DialogHeader>
        <DialogBody className="space-y-3 max-h-[50vh] overflow-y-scroll">
          {deptNames.length > 0 ? (
            deptNames.map((deptName) => (
              <div key={deptName} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleDeptAccordion(deptName)}
                  className="w-full px-4 py-2 text-left bg-blue-100 font-semibold hover:bg-blue-200 transition">
                  {deptName}
                </button>
                <div
                  className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${
                    deptExpanded[deptName] ? "max-h-96" : "max-h-0"
                  }`}>
                  <div className="p-4 bg-white text-sm text-gray-700 max-h-[300px] overflow-y-auto">
                    {(deptDoctors[deptName] || []).length > 0 ? (
                      deptDoctors[deptName].map((doc, idx) => (
                        <div key={idx} className="pb-5 pl-2">
                          <strong className="font-semibold text-base text-gray-900">
                            {doc.Name}
                          </strong>{" "}
                          – {doc.Qualification} <br />
                          Specialization - {doc.Specialization} <br />
                          Experience - {doc.Experience} <br />
                          Timing - {doc.Timing}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500">
                        No doctors in this department.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No department data available.
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            onClick={handleCloseDeptDialog}
            className="bg-red-500 text-white">
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ─── REVIEW SUBMISSION DIALOG ─── */}
      <Dialog
        open={openReviewDialog}
        handler={handleCloseReviewDialog}
        className="p-5">
        <DialogHeader>Submit Your Review</DialogHeader>
        <DialogBody className="space-y-4">
          <Input
            label="Cleanliness and Hygiene"
            value={reviewInputs.cleanliness}
            onChange={(e) =>
              setReviewInputs({ ...reviewInputs, cleanliness: e.target.value })
            }
          />
          <Input
            label="Doctor and Staff Behaviour"
            value={reviewInputs.behaviour}
            onChange={(e) =>
              setReviewInputs({ ...reviewInputs, behaviour: e.target.value })
            }
          />
          <Input
            label="Quality of Care"
            value={reviewInputs.care}
            onChange={(e) =>
              setReviewInputs({ ...reviewInputs, care: e.target.value })
            }
          />
          <Input
            label="Wait Times and Efficiency"
            value={reviewInputs.efficiency}
            onChange={(e) =>
              setReviewInputs({ ...reviewInputs, efficiency: e.target.value })
            }
          />
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={handleCloseReviewDialog}
            className="mr-2">
            Cancel
          </Button>
          <Button
            className="bg-blue-500 text-white"
            onClick={handleSubmitReview}>
            Submit
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ─── SENTIMENT ANALYSIS DIALOG ─── */}
      <Dialog
        open={openSentimentDialog}
        handler={handleCloseSentimentDialog}
        className="p-5 w-full max-w-4xl mx-auto" // Ensuring max width is applied
        style={{ width: "70%", maxWidth: "80%" }}>
        <DialogHeader>Reviews — {selectedHospital?.Name || ""}</DialogHeader>
        <DialogBody className="max-h-[500px] overflow-y-auto">
          {selectedHospital && (
            <SentimentAnalysis
              hospital={selectedHospital}
              searchedDistrict={searchedDistrict}
            />
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={handleCloseSentimentDialog}
            className="mr-2">
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default Hospitals;
