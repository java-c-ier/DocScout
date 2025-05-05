import React from "react";

const SearchSuggestions = ({ filteredDistricts, onSelectDistrict }) => {
  return (
    filteredDistricts.length > 0 && (
      <ul className="bg-white w-full border border-gray-300 max-h-60 overflow-y-auto z-20 mt-1 rounded-md shadow-lg">
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
