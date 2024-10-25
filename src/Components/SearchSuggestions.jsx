import React from "react";

const SearchSuggestions = ({ filteredDistricts, onSelectDistrict }) => {
  return (
    filteredDistricts.length > 0 && (
      <ul className="absolute bg-white w-[60%] border border-gray-300 max-h-60 overflow-y-auto z-10 mt-1 rounded-md">
        {filteredDistricts.map((district, index) => (
          <li
            key={index}
            className="p-2 hover:bg-blue-100 cursor-pointer"
            onClick={() => onSelectDistrict(district)}
          >
            {district}
          </li>
        ))}
      </ul>
    )
  );
};

export default SearchSuggestions;
