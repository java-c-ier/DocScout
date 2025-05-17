import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../Firebase";
import { Star, StarHalf, Star as StarEmpty } from "lucide-react";

const ASPECTS = [
  "Cleanliness_and_Hygiene",
  "Doctor_and_Staff_Behaviour",
  "Quality_of_Care",
  "Wait_Times_and_Efficiency",
];

// Helper to render stars
const renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center space-x-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="text-yellow-500 fill-yellow-500 w-5 h-5" />
      ))}
      {halfStar && (
        <StarHalf className="text-yellow-500 fill-yellow-500 w-5 h-5" />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <StarEmpty key={`empty-${i}`} className="text-gray-300 w-5 h-5" />
      ))}
      <span className="ml-2 text-sm text-gray-700">({rating.toFixed(1)})</span>
    </div>
  );
};

const SentimentAnalysis = ({ hospital, searchedDistrict }) => {
  const [reviewsByAspect, setReviewsByAspect] = useState({});
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);

  const retrieveReviews = async () => {
    const hospId = hospital.Name
      ? hospital.Name.trim().replace(/\s+/g, "_")
      : "Unknown_Hospital";
    const district = searchedDistrict || "Unknown_District";

    const result = {};
    await Promise.all(
      ASPECTS.map(async (aspect) => {
        const ref = doc(
          db,
          "Odisha",
          district,
          "Hospitals",
          hospId,
          "Reviews",
          "reviews",
          "aspects_reviews",
          aspect
        );
        const snap = await getDoc(ref);
        result[aspect] =
          snap.exists() && Array.isArray(snap.data().review)
            ? snap.data().review
            : [];
      })
    );
    setReviewsByAspect(result);
    return result;
  };

  const sendForAnalysis = async (reviewsMap) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: reviewsMap }),
      });
      if (!res.ok) throw new Error("Flask API error");
      const json = await res.json();
      setAnalysisData(json);
    } catch (e) {
      console.error("Error fetching analysis:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const doFetch = async () => {
      setLoading(true);
      const revMap = await retrieveReviews();
      await sendForAnalysis(revMap);
    };
    doFetch();
  }, [hospital, searchedDistrict]);

  if (loading) return <p>Loading charts…</p>;
  if (!analysisData) return <p>No analysis available.</p>;

  return (
    <div className="space-y-8 max-w-screen-xl mx-auto px-4"> {/* Double-width container */}
      {ASPECTS.map((aspect) => {
        const result = analysisData[aspect];
        if (!result) return null;

        return (
          <section key={aspect} className="border rounded-lg p-6">
            {/* <h3 className="text-xl font-semibold mb-4">
              {aspect.replace(/_/g, " ")}
            </h3> */}

            {/* Category Name and Average Rating */}
            {result.average_rating !== undefined && (
              <div className="mb-4">
                <div className="flex items-center">
                  <h4 className="text-xl font-semibold">{aspect.replace(/_/g, " ")}</h4>
                  <span className="mx-2">-</span>
                  {renderStars(result.average_rating)}
                </div>
              </div>
            )}

            {/* Side-by-side Charts */}
            <div className="flex flex-wrap md:flex-nowrap gap-6 items-center justify-center">
              {result.pie_chart_base64 && (
                <img
                  src={`data:image/png;base64,${result.pie_chart_base64}`}
                  alt={`${aspect} pie chart`}
                  className="w-full md:w-1/2 h-auto"
                />
              )}
              {result.bar_chart_base64 && (
                <img
                  src={`data:image/png;base64,${result.bar_chart_base64}`}
                  alt={`${aspect} bar chart`}
                  className="w-full md:w-1/2 h-auto"
                />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default SentimentAnalysis;
