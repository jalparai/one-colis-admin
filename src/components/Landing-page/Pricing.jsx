"use client";

import { useState, useMemo } from "react";

const cityData = [
  { city: "El Helhal", book: "30.00 Dh", back: "0.00 Dh" },
  { city: "ERRAHMA CITY", book: "30.00 Dh", back: "0.00 Dh" },
  { city: "Ain Harrouda", book: "30.00 Dh", back: "0.00 Dh" },
  { city: "Tit mellil", book: "30.00 Dh", back: "0.00 Dh" },
  { city: "Ait Melloul", book: "35.00 Dh", back: "0.00 Dh" },
  { city: "Agadir", book: "35.00 Dh", back: "0.00 Dh" },
  { city: "Deroua Oulad Ziane", book: "35.00 Dh", back: "0.00 Dh" },
  { city: "DAR BOUAZZA", book: "35.00 Dh", back: "0.00 Dh" },
  { city: "Tetouan", book: "35.00 Dh", back: "0.00 Dh" },
  { city: "El Jadida", book: "35.00 Dh", back: "0.00 Dh" },
];

export default function CityTable() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredCities = useMemo(
    () =>
      cityData.filter(({ city }) =>
        city.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const totalPages = Math.ceil(filteredCities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCities = filteredCities.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="lg:w-[70%] mt-10 p-6 bg-white rounded-sm shadow-md">
      <input
        type="text"
        placeholder="Search for a city"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Search for a city"
      />

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b text-gray-800 font-semibold">
            <th scope="col" className="py-2">City</th>
            <th scope="col" className="py-2">Book</th>
            <th scope="col" className="py-2">Back</th>
          </tr>
        </thead>
        <tbody>
          {currentCities.length > 0 ? (
            currentCities.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50 border-b">
                <td className="py-2">{row.city}</td>
                <td className="py-2">{row.book}</td>
                <td className="py-2">{row.back}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center py-4 text-gray-500">
                No cities found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 border rounded-md ${
            currentPage === 1 ? "text-gray-400 border-gray-300" : "text-gray-800 border-blue-400 hover:bg-blue-100"
          }`}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => goToPage(num)}
            className={`px-3 py-1 rounded-md border ${
              currentPage === num
                ? "bg-[#2BC3F1] text-white border-[#2BC3F1]"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 border rounded-md ${
            currentPage === totalPages ? "text-gray-400 border-gray-300" : "text-[#2BC3F1] border-blue-400 hover:bg-blue-100"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
