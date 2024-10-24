import React, { useState, useRef, useEffect } from "react";
import Doctor from "../assets/Doctor.png";
import "../Styles/Hero.css";
import { Input } from "@material-tailwind/react";
import { TbSearch } from "react-icons/tb";

function Hero() {
  // List of districts in Odisha
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

  // Reference for the search box
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

  // Close dropdown when clicking outside of the search box
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target)
      ) {
        setFilteredDistricts([]); // Close dropdown
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
                  <button>
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

              {/* Suggestions Dropdown */}
              {filteredDistricts.length > 0 && (
                <ul className="absolute bg-white w-[60%] border border-gray-300 max-h-60 overflow-y-auto z-10 mt-1 rounded-md">
                  {filteredDistricts.map((district, index) => (
                    <li
                      key={index}
                      className="p-2 hover:bg-blue-100 cursor-pointer"
                      onClick={() => handleSelectDistrict(district)}
                    >
                      {district}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="text-stats">
            <div className="text-stats-container">
              <p>145k+</p>
              <p>Receive Patients</p>
            </div>

            <div className="text-stats-container">
              <p>50+</p>
              <p>Expert Doctors</p>
            </div>

            <div className="text-stats-container">
              <p>10+</p>
              <p>Years of Experience</p>
            </div>
          </div>
        </div>

        <div className="hero-image-section">
          <img className="hero-image1" src={Doctor} alt="Doctor" />
        </div>
      </div>
    </div>
  );
}

export default Hero;
