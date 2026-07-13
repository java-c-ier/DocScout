import React from "react";

const SearchSuggestions = ({ filteredDistricts, onSelectDistrict }) => {
  const open = filteredDistricts.length > 0;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.2s ease",
      }}
    >
      <div style={{ overflow: "hidden" }}>
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
      </div>
    </div>
  );
};

export default SearchSuggestions;
