import React, { useState, useEffect } from "react";
import {
  Button,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Textarea,
} from "@material-tailwind/react";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { db, addReview } from "../Firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const Hospitals = ({ hospitals, hasSearched }) => {
  const [activePage, setActivePage] = useState(1);
  const [showNoHospitalsMessage, setShowNoHospitalsMessage] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");

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

  if (!hasSearched || !isDataFetched) {
    return null;
  }

  if (showNoHospitalsMessage) {
    return <p className="text-center text-gray-500">No hospitals available.</p>;
  }

  const handleOpenReviewDialog = async (hospital) => {
    try {
      const formattedHospitalName = hospital.Name.replace(/\s+/g, "_");
      const stateRef = collection(db, "Odisha");
      const districtsSnapshot = await getDocs(stateRef);

      let foundDistrict = null;

      for (const districtDoc of districtsSnapshot.docs) {
        const district = districtDoc.id;
        const hospitalRef = doc(db, `Odisha/${district}/Hospitals/${formattedHospitalName}`);
        const hospitalDoc = await getDoc(hospitalRef);

        if (hospitalDoc.exists()) {
          foundDistrict = district;
          break;
        }
      }

      setSelectedHospital({ ...hospital, district: foundDistrict || "Unknown District" });
    } catch (error) {
      console.error("Error fetching hospital data:", error);
      setSelectedHospital({ ...hospital, district: "Unknown District" });
    }

    setOpenReviewDialog(true);
  };

  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
    setReviewText("");
    setReviewerName("");
  };

  const handleSubmitReview = async () => {
    if (!reviewerName.trim() || !reviewText.trim()) {
      alert("Both name and review are required.");
      return;
    }

    if (selectedHospital) {
      try {
        await addReview(
          selectedHospital.district,
          selectedHospital.Name.replace(/\s+/g, '_'),
          reviewText,
          reviewerName
        );

        alert("Review added successfully!");
        handleCloseReviewDialog();
      } catch (error) {
        console.error("Error adding review:", error);
        alert("Error adding review");
      }
    }
  };

  return (
    <div className={`overflow-x-auto w-full ${hospitals.length > 0 ? "" : ""}`}>
      <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th className="px-4 py-4 text-left">Name</th>
            <th className="px-4 py-2 text-center">Contact</th>
            <th className="px-4 py-2 text-center">Type</th>
            <th className="px-4 py-2 text-center">Rating</th>
            <th className="px-4 py-2 text-center">Website</th>
            <th className="px-4 py-2 text-center">Google Map Link</th>
            <th className="px-4 py-2 text-center">Review</th>
          </tr>
        </thead>
        <tbody>
          {currentHospitals.map((hospital) => (
            <tr
              key={hospital.id}
              className="border-t border-gray-300 hover:bg-gray-100">
              <td className="px-4 py-3">{hospital.Name || "N/A"}</td>
              <td className="px-4 py-3 text-center">{hospital.Contact || "N/A"}</td>
              <td className="px-4 py-3 text-center">{hospital.Type || "N/A"}</td>
              <td className="px-4 py-3 text-center">{hospital.Rating || 0}</td>
              <td className="px-4 py-3 text-center">
                {hospital.Website ? (
                  <a
                    href={hospital.Website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline">
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
                    className="text-blue-500 hover:underline">
                    View Map
                  </a>
                ) : (
                  "N/A"
                )}
              </td>
              <td className="text-center">
                <Button
                  className="bg-blue-500 text-white px-3.5 py-1 w-fit mx-auto rounded-full hover:scale-110 transition-all text-sm"
                  onClick={() => handleOpenReviewDialog(hospital)}>
                  Review
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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

      <Dialog
        open={openReviewDialog}
        handler={handleCloseReviewDialog}
        className="p-5">
        <DialogHeader className="m-3 md:m-0 sm:p-2">
          Submit Your Review
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <Input
            label="Your Name"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
          />
          <Textarea
            label="Your Review"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
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
    </div>
  );
};

export default Hospitals;
