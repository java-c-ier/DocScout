import React, { useState, useRef, useEffect } from "react";
import Doctor from "../assets/Doctor.png";
import "../Styles/Hero.css";
import { TbSearch } from "react-icons/tb";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchSuggestions from "./SearchSuggestions";
import Hospitals from "./Hospitals";

function Hero() {
  const districts = [
    "Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack",
    "Deogarh","Dhenkanal","Gajapati","Ganjam","Jagatsinghpur","Jajpur",
    "Jharsuguda","Kalahandi","Kandhamal","Kendrapada","Keonjhar","Khordha",
    "Koraput","Malkangiri","Mayurbhanj","Nabarangpur","Nayagarh","Nuapada",
    "Puri","Rayagada","Sambalpur","Subarnapur","Sundargarh",
  ];

  const diseases = [
    "Diabetes","Hypertension","Asthma","Tuberculosis","Dengue","Malaria",
    "Typhoid","Cancer","Heart Disease","Stroke","Arthritis","Alzheimer's",
    "Parkinson's","HIV/AIDS","Hepatitis","Pneumonia","Influenza","Migraine",
    "Epilepsy","Obesity",
  ];

  const [searchInput, setSearchInput] = useState("");
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [diseaseInput, setDiseaseInput] = useState("");
  const [filteredDiseases, setFilteredDiseases] = useState([]);
  const [hospitalList, setHospitalList] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const searchBoxRef = useRef(null);
  const hospitalListRef = useRef(null);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchInput(query);
    setFilteredDistricts(
      query === "" ? districts : districts.filter((d) => d.toLowerCase().startsWith(query.toLowerCase()))
    );
  };

  const handleDiseaseSearch = (e) => {
    const query = e.target.value;
    setDiseaseInput(query);
    setFilteredDiseases(
      query === "" ? diseases : diseases.filter((d) => d.toLowerCase().startsWith(query.toLowerCase()))
    );
  };

  const handleSelectDistrict = (district) => {
    setSearchInput(district);
    setFilteredDistricts([]);
  };

  const handleSelectDisease = (disease) => {
    setDiseaseInput(disease);
    setFilteredDiseases([]);
  };

  const fetchHospitals = async () => {
    if (!db) { toast.error("Firebase not configured."); return; }
    try {
      const hospitalsCollection = collection(db, "Odisha", searchInput, "Hospitals");
      const snapshot = await getDocs(hospitalsCollection);
      const hospitalsData = snapshot.empty ? [] : snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHospitalList(hospitalsData);
      setHasSearched(true);
      scrollToHospitals();
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  };

  const scrollToHospitals = () => {
    if (hospitalListRef.current) {
      const yPos = hospitalListRef.current.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: yPos, behavior: "smooth" });
    }
  };

  const handleNearbyHospitals = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingNearby(true);

    const showResult = (type, message, autoClose = 5000) => {
      toast.dismiss();
      setTimeout(() => toast[type](message, { autoClose, toastId: "nearby-result" }), 100);
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en-US,en" } }
          );
          const data = await res.json();
          const addr = data.address || {};

          const detectedDistrict = districts.find((d) => {
            const dl = d.toLowerCase();
            return (
              addr.state_district?.toLowerCase().includes(dl) ||
              addr.county?.toLowerCase().includes(dl) ||
              addr.district?.toLowerCase().includes(dl) ||
              addr.city?.toLowerCase().includes(dl) ||
              addr.town?.toLowerCase().includes(dl) ||
              addr.village?.toLowerCase().includes(dl)
            );
          });

          if (!detectedDistrict) {
            showResult("warn", "You are currently outside Odisha. To view list of hospitals, please search manually.", 6000);
            setLoadingNearby(false);
            return;
          }

          setSearchInput(detectedDistrict);

          if (!db) { showResult("error", "Firebase not configured."); setLoadingNearby(false); return; }
          const snapshot = await getDocs(collection(db, "Odisha", detectedDistrict, "Hospitals"));
          const hospitalsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setHospitalList(hospitalsData);
          setHasSearched(true);
          setLoadingNearby(false);

          if (hospitalsData.length === 0) {
            showResult("info", `No hospitals found for ${detectedDistrict} in database.`);
          } else {
            showResult("success", `Found ${hospitalsData.length} hospitals in ${detectedDistrict}!`);
          }
          scrollToHospitals();
        } catch {
          showResult("error", "Location detection failed. Try searching manually.");
          setLoadingNearby(false);
        }
      },
      (err) => {
        showResult(
          "error",
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Please allow location in browser settings."
            : "Failed to get location. Try searching manually."
        );
        setLoadingNearby(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSearchButtonClick = () => {
    if (districts.includes(searchInput)) {
      fetchHospitals();
    } else {
      toast.error("Please enter a valid district!");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setFilteredDistricts([]);
        setFilteredDiseases([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="section-container pt-[60px]" id="home">
      <div className="hero-section">
        <div className="text-section">
          <p className="text-headline">❤️ Health comes first</p>
          <h2 className="text-title">Find hospitals from your phone.</h2>
          <p className="text-description">
            Access accurate, up-to-date healthcare information tailored to your needs.
            Search providers by location, specialty, and ratings for enhanced healthcare
            decision making and accessibility.
          </p>

          <div className="search-area w-full flex flex-col sm:flex-row sm:items-stretch gap-5" ref={searchBoxRef}>
            {/* District Search */}
            <div className="search-box w-full sm:w-[30%] relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Location"
                  className="w-full border-2 border-blue-400 rounded-lg px-4 py-3 pr-10 text-[17px] bg-white focus:outline-none focus:border-blue-600"
                  value={searchInput}
                  onChange={handleSearch}
                  onFocus={() => { setFilteredDistricts(districts); setFilteredDiseases([]); }}
                />
                <button
                  onClick={handleSearchButtonClick}
                  aria-label="Search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 cursor-pointer"
                >
                  <TbSearch className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute top-full left-0 w-full z-20">
                <SearchSuggestions filteredDistricts={filteredDistricts} onSelectDistrict={handleSelectDistrict} />
              </div>
            </div>

            {/* Disease Search */}
            <div className="search-box w-full sm:w-[30%] relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Disease"
                  className="w-full border-2 border-blue-400 rounded-lg px-4 py-3 pr-10 text-[17px] bg-white focus:outline-none focus:border-blue-600"
                  value={diseaseInput}
                  onChange={handleDiseaseSearch}
                  onFocus={() => { setFilteredDiseases(diseases); setFilteredDistricts([]); }}
                />
                <button
                  onClick={handleSearchButtonClick}
                  aria-label="Search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 cursor-pointer"
                >
                  <TbSearch className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute top-full left-0 w-full z-20">
                <SearchSuggestions filteredDistricts={filteredDiseases} onSelectDistrict={handleSelectDisease} />
              </div>
            </div>

            {/* Nearby hospitals button */}
            <button
              onClick={handleNearbyHospitals}
              disabled={loadingNearby}
              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white px-4 py-3 sm:py-0 rounded-lg font-medium transition whitespace-nowrap"
            >
              {loadingNearby ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" clipRule="evenodd" />
                </svg>
              )}
              {loadingNearby ? "Detecting..." : "Show Nearby Hospitals"}
            </button>
          </div>
        </div>

        <div className="hero-image-section">
          <img className="hero-image1" src={Doctor} alt="Doctor" />
        </div>
      </div>

      <div ref={hospitalListRef} className={`${hospitalList.length > 0 ? "px-4 py-6" : ""}`}>
        <Hospitals hospitals={hospitalList} hasSearched={hasSearched} searchedDistrict={searchInput} />
      </div>

      <ToastContainer
        toastClassName="toast-container"
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
        style={{ width: "420px", maxWidth: "calc(100vw - 32px)" }}
      />
    </div>
  );
}

export default Hero;
