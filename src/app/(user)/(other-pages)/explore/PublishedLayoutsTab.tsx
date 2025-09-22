import React from "react";

const PublishedLayoutsTab = () => {
    return (
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
    );
};

export default PublishedLayoutsTab;
