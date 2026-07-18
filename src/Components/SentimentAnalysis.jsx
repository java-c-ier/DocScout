import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../Firebase";
import { Star, StarHalf, StarOff } from "lucide-react";

const ASPECTS = [
  "Cleanliness_and_Hygiene",
  "Doctor_and_Staff_Behaviour",
  "Quality_of_Care",
  "Wait_Times_and_Efficiency",
];

const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

const renderStars = (rating) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center space-x-1">
      {[...Array(full)].map((_, i) => <Star key={`f${i}`} className="text-yellow-500 fill-yellow-500 w-5 h-5" />)}
      {half && <StarHalf className="text-yellow-500 fill-yellow-500 w-5 h-5" />}
      {[...Array(empty)].map((_, i) => <StarOff key={`e${i}`} className="text-gray-300 w-5 h-5" />)}
      <span className="ml-2 text-sm text-gray-700">({rating.toFixed(1)})</span>
    </div>
  );
};

function PieChart({ distribution }) {
  const total = [1, 2, 3, 4, 5].reduce((s, r) => s + (distribution[r] || 0), 0);
  if (total === 0) return <div className="text-gray-400 text-sm text-center py-4">No data</div>;

  const CX = 80, CY = 80, R = 68;
  let startAngle = -Math.PI / 2;
  const slices = [1, 2, 3, 4, 5]
    .map((r, i) => {
      const count = distribution[r] || 0;
      const angle = (count / total) * 2 * Math.PI;
      const s = { r, count, angle, start: startAngle, color: COLORS[i] };
      startAngle += angle;
      return s;
    })
    .filter((s) => s.count > 0);

  const arc = (start, end) => {
    if (end - start >= 2 * Math.PI - 0.001) {
      return `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.01} ${CY - R} Z`;
    }
    const x1 = CX + R * Math.cos(start);
    const y1 = CY + R * Math.sin(start);
    const x2 = CX + R * Math.cos(end);
    const y2 = CY + R * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 160 160" className="w-40 h-40">
        {slices.map((s) => (
          <path key={s.r} d={arc(s.start, s.start + s.angle)} fill={s.color} stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {[1, 2, 3, 4, 5].map((r, i) => (
          <span key={r} className="flex items-center gap-1 text-xs text-gray-600">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i] }} />
            {r}★ ({distribution[r] || 0})
          </span>
        ))}
      </div>
    </div>
  );
}

function BarChart({ distribution }) {
  const counts = [1, 2, 3, 4, 5].map((r) => distribution[r] || 0);
  const max = Math.max(...counts, 1);
  const W = 260, H = 160, PL = 28, PB = 28, PT = 16, PR = 8;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const barW = Math.floor(chartW / 5) - 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[260px]">
      {/* y-axis */}
      <line x1={PL} y1={PT} x2={PL} y2={PT + chartH} stroke="#e5e7eb" strokeWidth="1" />
      {/* x-axis */}
      <line x1={PL} y1={PT + chartH} x2={PL + chartW} y2={PT + chartH} stroke="#e5e7eb" strokeWidth="1" />

      {counts.map((c, i) => {
        const barH = (c / max) * chartH;
        const x = PL + i * (chartW / 5) + (chartW / 5 - barW) / 2;
        const y = PT + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={COLORS[i]} rx="3" />
            {c > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="#374151">{c}</text>
            )}
            <text x={x + barW / 2} y={PT + chartH + 14} textAnchor="middle" fontSize="10" fill="#6b7280">{i + 1}★</text>
          </g>
        );
      })}
    </svg>
  );
}

const SentimentAnalysis = ({ hospital, searchedDistrict }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const retrieveReviews = async () => {
    if (!db) return {};
    const hospId = hospital.Name ? hospital.Name.trim().replace(/\s+/g, "_") : "Unknown_Hospital";
    const district = searchedDistrict || "Unknown_District";
    const result = {};
    await Promise.all(
      ASPECTS.map(async (aspect) => {
        const ref = doc(db, "Odisha", district, "Hospitals", hospId, "Reviews", "reviews", "aspects_reviews", aspect);
        const snap = await getDoc(ref);
        result[aspect] = snap.exists() && Array.isArray(snap.data().review) ? snap.data().review : [];
      })
    );
    return result;
  };

  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      setLoading(true);
      setError(null);
      setAnalysisData(null);
      try {
        const reviewsMap = await retrieveReviews();
        const res = await fetch("/.netlify/functions/sentiment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviews: reviewsMap }),
        });
        if (!res.ok) throw new Error("Sentiment API error");
        const json = await res.json();
        if (!cancelled) setAnalysisData(json);
      } catch (e) {
        if (!cancelled) setError("Failed to load analysis. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [hospital, searchedDistrict]);

  if (loading) return (
    <div className="flex items-center gap-3 py-8 text-gray-500 text-sm">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-400 rounded-full animate-spin" />
      Analysing reviews…
    </div>
  );

  if (error) return <p className="text-red-500 text-sm py-4">{error}</p>;
  if (!analysisData) return <p className="text-gray-400 text-sm py-4">No analysis available.</p>;

  return (
    <div className="space-y-8 max-w-screen-xl mx-auto px-4">
      {ASPECTS.map((aspect) => {
        const result = analysisData[aspect];
        if (!result) return null;
        return (
          <section key={aspect} className="border rounded-lg p-6">
            {result.average_rating !== undefined && (
              <div className="mb-5">
                <div className="flex items-center flex-wrap gap-2">
                  <h4 className="text-xl font-semibold">{aspect.replace(/_/g, " ")}</h4>
                  <span className="text-gray-400">—</span>
                  {renderStars(result.average_rating)}
                </div>
              </div>
            )}
            <div className="flex flex-wrap md:flex-nowrap gap-8 items-center justify-center">
              <PieChart distribution={result.distribution} />
              <BarChart distribution={result.distribution} />
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default SentimentAnalysis;
