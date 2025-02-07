import React, { useState, useRef, useEffect } from "react";
import Doctor from "../assets/Doctor.png";
import "../Styles/Hero.css";
import { Input } from "@material-tailwind/react";
import { TbSearch } from "react-icons/tb";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchSuggestions from "./SearchSuggestions";
import Hospitals from "./Hospitals"; // Import the Hospitals component

function Hero() {
  const districts = [
    "Angul",
    "Balangir",
    "Balasore",
    "Bargarh",
    "Bhadrak",
    "Boudh",
    "Cuttack",
    "Deogarh",
    "Dhenkanal",
    "Gajapati",
    "Ganjam",
    "Jagatsinghpur",
    "Jajpur",
    "Jharsuguda",
    "Kalahandi",
    "Kandhamal",
    "Kendrapada",
    "Keonjhar",
    "Khordha",
    "Koraput",
    "Malkangiri",
    "Mayurbhanj",
    "Nabarangpur",
    "Nayagarh",
    "Nuapada",
    "Puri",
    "Rayagada",
    "Sambalpur",
    "Subarnapur",
    "Sundargarh",
  ];

  const [searchInput, setSearchInput] = useState("");
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [hospitalList, setHospitalList] = useState([]);
  const searchBoxRef = useRef(null);
  const hospitalListRef = useRef(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchInput(query);

    if (query === "") {
      setFilteredDistricts([]);
    } else {
      const filtered = districts.filter((district) =>
        district.toLowerCase().startsWith(query.toLowerCase())
      );
      setFilteredDistricts(filtered);
    }
  };

  const handleSelectDistrict = (district) => {
    setSearchInput(district);
    setFilteredDistricts([]);
  };

  const fetchHospitals = async () => {
    try {
      const hospitalsCollection = collection(
        db,
        "Odisha",
        searchInput,
        "Hospitals"
      );
      const snapshot = await getDocs(hospitalsCollection);

      const hospitalsData = snapshot.empty
        ? []
        : snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHospitalList(hospitalsData);

      if (hospitalListRef.current) {
        const yOffset = -70;
        const yPosition =
          hospitalListRef.current.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;

        window.scrollTo({ top: yPosition, behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  };

  const handleSearchButtonClick = () => {
    if (districts.includes(searchInput)) {
      setHasSearched(true); // Indicate that a search has been made
      fetchHospitals();
    } else {
      toast.error("Please enter a valid district!");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target)
      ) {
        setFilteredDistricts([]);
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
            Access accurate, up-to-date healthcare information tailored to your
            needs. Search providers by location, specialty, and ratings for 
            enhanced healthcare decision making and accessibility.
          </p>

          <div className="search-area w-full flex relative" ref={searchBoxRef}>
            <div className="search-box w-[60%]">
              <Input
                icon={
                  <button onClick={handleSearchButtonClick} aria-label="Search">
                    <TbSearch className="text-blue-600" />
                  </button>
                }
                label="Enter Location"
                className="bg-white text-[17px]"
                size="lg"
                color="blue"
                value={searchInput} 
                onChange={handleSearch}
              />
              <SearchSuggestions
                filteredDistricts={filteredDistricts}
                onSelectDistrict={handleSelectDistrict}
              />
            </div>
          </div>
        </div>

        <div className="hero-image-section">
          <img className="hero-image1" src={Doctor} alt="Doctor" />
        </div>
      </div>

      {/* Hospital List Display using Hospitals Component */}
      <div ref={hospitalListRef} className={`${hospitalList.length > 0 ? "px-4 py-6" : ""}`}>
        <Hospitals hospitals={hospitalList} hasSearched={hasSearched} />
      </div>

      <ToastContainer
        toastClassName="toast-container"
        position="top-center"
        autoClose={4000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default Hero;
