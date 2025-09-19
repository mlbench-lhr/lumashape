"use client";
import { textarea } from "framer-motion/client";
import React, { useState } from "react";

const Explore = () => {
  const [activeTab, setActiveTab] = useState("trending");

  return (
    <div className="min-h-screen w-full py-8 bg-gray">
      {/* Tabs */}
      <div className="flex space-x-8">
        {["Trending", "Published Tools", "Published Layouts"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase().replace(" ", ""))}
            className={`pb-1 text-lg font-medium transition-colors ${activeTab === tab.toLowerCase().replace(" ", "")
              ? "text-blue-600 border-b-2 border-blue-500"
              : "text-gray-600 hover:text-gray-800"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === "trending" && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative w-full max-w-md">
                {/* Search Icon */}
                <img
                  src="images/icons/explore/search_icon.svg"
                  alt="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Search Keyword"
                  className="w-full pl-10 pr-4 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            {/* Text Line */}
            <p className="text-gray-700 text-base leading-relaxed">
              Check out what’s popular right now based on upvotes and downloads.
              These layouts and tools are trusted and used by the community.
            </p>
          </div>
        )}

        {activeTab === "publishedtools" && (
          <div>
            {/* Top Row: Search + Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              {/* Search Bar */}
              <div className="relative w-full max-w-md">
                <img
                  src="images/icons/explore/search_icon.svg"
                  alt="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Search Keyword"
                  className="w-full pl-10 pr-4 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              {/* Dropdown Filters */}
              <div className="flex gap-3">
                <div className="relative">
                  <select
                    className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none"
                  >
                    <option>Tool Type</option>
                    <option>Type 1</option>
                    <option>Type 2</option>
                  </select>
                  {/* Custom Arrow */}
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <svg
                      className="w-4 h-4 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <select
                    className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none"
                  >
                    <option>Tool Brand</option>
                    <option>Brand A</option>
                    <option>Brand B</option>
                  </select>
                  {/* Custom Arrow */}
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>

            {/* Description */}
            <p className="text-gray-700 text-base leading-relaxed">
              View individual tools shared by creators. Import contours into your tool inventory and reuse them in your own layouts.
            </p>
          </div>
        )}

        {activeTab === "publishedlayouts" && (
          <div>
            {/* Top Row: Search + Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              {/* Search Bar */}
              <div className="relative w-full max-w-md">
                <img
                  src="images/icons/explore/search_icon.svg"
                  alt="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Search Keyword"
                  className="w-full pl-10 pr-4 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Dropdown Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <select className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none">
                    <option>Container Brand</option>
                    <option>Brand A</option>
                    <option>Brand B</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <select className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none">
                    <option>Container Type</option>
                    <option>Type 1</option>
                    <option>Type 2</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <select className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none">
                    <option>wrench</option>
                    <option>hammer</option>
                    <option>drill</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                <div className="relative">
                  <select className="appearance-none py-2 pl-3 pr-8 border rounded-md text-gray-700 focus:outline-none">
                    <option>milwaakeuu</option>
                    <option>dewalt</option>
                    <option>makita</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 text-base leading-relaxed">
              Browse community-made layouts with ready-to-cut designs. Save them to your
              workspace and customize as needed.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Explore;
