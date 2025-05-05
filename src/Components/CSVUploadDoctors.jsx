import React, { useState } from "react";
import Papa from "papaparse";
import { addDoctor } from "../Firebase";

function CSVUploadDoctors() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.type !== "text/csv") {
      alert("Please upload a valid CSV file.");
      return;
    }
    setFile(f);
  };

  const handleFileUpload = () => {
    if (!file) {
      alert("Please select a CSV file first!");
      return;
    }

    // clear the input (optional)
    document.getElementById("doctorsCsv").value = "";

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data: doctors }) => {
        try {
          for (const row of doctors) {
            // must include: id, hospital, district, plus any doc fields
            await addDoctor(row, file.name);
          }
          alert("Doctors added successfully!");
          setFile(null);
        } catch (err) {
          console.error("Error uploading doctors:", err);
          alert("Error uploading doctors—see console.");
        }
      },
      error: (err) => {
        console.error("Error parsing CSV:", err);
        alert("Error parsing CSV—see console.");
      },
    });
  };

  return (
    <div className="pt-[80px]">
      <h1>Upload Doctors CSV</h1>
      <input
        id="doctorsCsv"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />
      <button onClick={handleFileUpload}>Upload CSV</button>
    </div>
  );
}
export default CSVUploadDoctors;