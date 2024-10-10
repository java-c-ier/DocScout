import React, { useState } from "react";
import Papa from "papaparse";
import { addHospital } from './../Firebase';

function CSVUpload() {
  const [file, setFile] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== "text/csv") {
      alert("Please upload a valid CSV file.");
      return;
    }
    console.log("Selected file:", selectedFile);
    setFile(selectedFile);
  };

  // Handle file upload and CSV processing
  const handleFileUpload = () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    // Reset file input
    const input = document.getElementById("csvFile");
    input.value = "";  // Clear the input

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        const hospitals = results.data;
        console.log("Parsed hospitals data:", hospitals);
        for (const hospital of hospitals) {
          console.log("Adding hospital:", hospital);
          await addHospital(hospital);
        }
        alert("Hospitals added successfully!");
      },
      error: function (error) {
        console.error("Error parsing CSV:", error);
      },
    });
  };

  return (
    <div>
      <h1>Upload Hospitals CSV</h1>
      <input type="file" id="csvFile" onChange={handleFileChange} accept=".csv" />
      <button onClick={handleFileUpload}>Upload CSV</button>
    </div>
  );
}

export default CSVUpload;
