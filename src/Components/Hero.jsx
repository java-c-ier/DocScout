import React, { useState, useRef, useEffect } from "react";
import Doctor from "../assets/Doctor.png";
import "../Styles/Hero.css";
import { Input } from "@material-tailwind/react";
import { TbSearch } from "react-icons/tb";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase";
import SearchSuggestions from "./SearchSuggestions"; // Import the new component

function Hero() {
  const districts = [
    "Angul",
    "Boudh",
    "Cuttack",
    "Dhenkanal",
    "Jagatsinghpur",
    "Jajpur",
    "Kendrapada",
    "Khordha",
    "Nayagarh",
    "Puri",
    "Balasore",
    "Bhadrak",
    "Deogarh",
    "Jharsuguda",
    "Keonjhar",
    "Mayurbhanj",
    "Sambalpur",
    "Sundargarh",
    "Bargarh",
    "Balangir",
    "Gajapati",
    "Ganjam",
    "Kalahandi",
    "Kandhamal",
    "Koraput",
    "Malkangiri",
    "Nabarangpur",
    "Nuapada",
    "Rayagada",
    "Sonepur",
  ];
  const [searchInput, setSearchInput] = useState("");
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [hospitalList, setHospitalList] = useState([]);
  const searchBoxRef = useRef(null);

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
      if (!snapshot.empty) {
        const hospitalsData = snapshot.docs.map((doc) => doc.data());
        setHospitalList(hospitalsData);
      } else {
        console.log(`No hospitals found for ${searchInput}`);
        setHospitalList([]);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  };

  const handleSearchButtonClick = () => {
    if (districts.includes(searchInput)) {
      fetchHospitals();
    } else {
      alert("Please enter a valid district");
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
          <h2 className="text-title">Find your Doctor from your phone.</h2>
          <p className="text-descritpion">
            Talk to online doctors and get medical advice, online prescriptions,
            refills and medical notes within minutes. On-demand healthcare
            services at your fingertips.
          </p>

          <div className="search-area w-full flex relative" ref={searchBoxRef}>
            <div className="search-box w-[60%]">
              <Input
                icon={
                  <button onClick={handleSearchButtonClick}>
                    <TbSearch />
                  </button>
                }
                label="Enter Location"
                className="bg-white text-[17px]"
                size="lg"
                color="blue"
                value={searchInput}
                onChange={handleSearch}
              />

              {/* Use SearchSuggestions component here */}
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
      {/* Hospital List */}
      {hospitalList.length > 0 && (
        <div className="bg-blue-50 hospital-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6 px-4">
          {hospitalList.map((hospital, index) => (
            <div key={index} className="bg-white p-4 mb-4 border rounded-lg shadow">
              <h3 className="text-lg font-bold">{hospital.Name}</h3>
              <p className="overflow-hidden">
                Website:{" "}
                <a
                  href={hospital.Website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {hospital.Website}
                </a>
              </p>
              <p>Rating: {hospital.Rating}</p>
              <p>Type: {hospital.Type}</p>
              <p>Contact: {hospital.Contact}</p>
              <p>
                Google Map:{" "}
                <a
                  href={hospital["Google Map Link"]}
                  target="_blank"
                  // rel="noopener noreferrer"
                >
                  View Location
                </a>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Hero;
