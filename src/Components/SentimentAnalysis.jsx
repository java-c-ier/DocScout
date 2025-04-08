import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../Firebase"; // Adjust this import path as needed

const SentimentAnalysis = ({ hospital, searchedDistrict }) => {
  const [reviewsArray, setReviewsArray] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Retrieve reviews from Firestore using the specified path:
  // /Odisha/{district}/Hospitals/{formattedHospitalName}/Reviews/reviews
  const retrieveReviews = async () => {
    try {
      // Normalize hospital name: e.g., "Arete Care Hospital" becomes "Arete_Care_Hospital"
      const formattedHospitalName = hospital.Name
        ? hospital.Name.trim().replace(/\s+/g, "_")
        : "Unknown_Hospital";
      
      // Use the district value from the searchedDistrict prop.
      const district = searchedDistrict || "Unknown_District";
      
      // Construct the Firestore document reference.
      const reviewDocRef = doc(
        db,
        "Odisha",
        district,
        "Hospitals",
        formattedHospitalName,
        "Reviews",
        "reviews"
      );
      
      // Fetch the document snapshot.
      const reviewDocSnap = await getDoc(reviewDocRef);
      if (reviewDocSnap.exists()) {
        const data = reviewDocSnap.data();
        // If reviews are stored as separate fields (r1, r2, etc), extract review texts:
        const reviews = Object.values(data).map((item) => item.text);
        setReviewsArray(reviews);
        return reviews;
      } else {
        console.log("No reviews found in Firestore at the path");
        return [];
      }
    } catch (error) {
      console.error("Error retrieving reviews from Firestore:", error);
      return [];
    }
  };

  // Send reviews to the Flask sentiment analysis endpoint.
  const sendReviewsForAnalysis = async (reviews) => {
    try {
      const response = await fetch("https://flask-backend-c1ss.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews }),
      });
      if (!response.ok) {
        throw new Error("Flask API responded with an error");
      }
      const result = await response.json();
      setAnalysisData(result);
    } catch (error) {
      console.error("Error sending reviews for analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect hook to retrieve and analyze reviews when hospital or searchedDistrict changes.
  useEffect(() => {
    const fetchAndAnalyzeReviews = async () => {
      setLoading(true);
      const reviews = await retrieveReviews();
      if (reviews.length > 0) {
        await sendReviewsForAnalysis(reviews);
      } else {
        setLoading(false);
      }
    };

    fetchAndAnalyzeReviews();
  }, [hospital, searchedDistrict]);

  return (
    <div>
      {loading ? (
        <p>Loading reviews...</p>
      ) : analysisData && analysisData.reviews ? (
        <div>
          {/* Render the pie chart image */}
          {analysisData.pie_chart_base64 && (
            <div>
              {/* <h3>Ratings Distribution Pie Chart</h3> */}
              <img
                src={`data:image/png;base64,${analysisData.pie_chart_base64}`}
                alt="Ratings Distribution Pie Chart"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </div>
          )}
          <ul>
            {analysisData.reviews.map((item, index) => (
              <li key={index}>
                <p>
                  <strong>Review:</strong> {item.review}
                </p>
                <p>
                  <strong>Rating:</strong> {item.analysis.label}
                </p>
                <br />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No analysis data available.</p>
      )}
    </div>
  );
};

export default SentimentAnalysis;
