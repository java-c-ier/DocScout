import React, { useState, useEffect } from "react";
import { Button, IconButton } from "@material-tailwind/react";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

const Hospitals = ({ hospitals, hasSearched }) => {
  const [activePage, setActivePage] = useState(1);
  const [showNoHospitalsMessage, setShowNoHospitalsMessage] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      if (hasSearched) {
        setIsDataFetched(false);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate fetch delay
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
    style: activePage === index ? { backgroundColor: "#2294f2", color: "white" } : {},
  });

  if (!hasSearched || !isDataFetched) {
    return null;
  }

  if (showNoHospitalsMessage) {
    return <p className="text-center text-gray-500">No hospitals available.</p>;
  }

  return (
    <div className={`overflow-x-auto w-full ${hospitals.length > 0 ? '' : ''}`}>
      <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th className="px-4 py-4 text-left">Name</th>
            <th className="px-4 py-2 text-center">Contact</th>
            <th className="px-4 py-2 text-center">Type</th>
            <th className="px-4 py-2 text-center">Rating</th>
            <th className="px-4 py-2 text-center">Website</th>
            <th className="px-4 py-2 text-center">Google Map Link</th>
          </tr>
        </thead>
        <tbody>
          {currentHospitals.map((hospital) => (
            <tr key={hospital.id} className="border-t border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-3">{hospital.Name || 'N/A'}</td>
              <td className="px-4 py-3 text-center">{hospital.Contact || 'N/A'}</td>
              <td className="px-4 py-3 text-center">{hospital.Type || 'N/A'}</td>
              <td className="px-4 py-3 text-center">{hospital.Rating || 0}</td>
              <td className="px-4 py-3 text-center">
                {hospital.Website ? (
                  <a href={hospital.Website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Visit
                  </a>
                ) : (
                  'N/A'
                )}
              </td>
              <td className="px-4 py-2 text-center">
                {hospital['Google Map Link'] ? (
                  <a href={hospital['Google Map Link']} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    View Map
                  </a>
                ) : (
                  'N/A'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-4">
          <Button variant="text" className="flex items-center gap-2 rounded-full" onClick={prev} disabled={activePage === 1}>
            <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" /> Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <IconButton key={index + 1} {...getItemProps(index + 1)}>{index + 1}</IconButton>
            ))}
          </div>
          <Button variant="text" className="flex items-center gap-2 rounded-full" onClick={next} disabled={activePage === totalPages}>
            Next <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Hospitals;
