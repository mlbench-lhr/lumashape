import React from "react";

const TrendingTab = () => {
    return (
        <div>
            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative w-full max-w-md">
                    <img
                        src="images/icons/explore/search_icon.svg"
                        alt="search"
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                    />
                    <input
                        type="text"
                        placeholder="Search Keyword"
                        className="w-full pl-10 pr-4 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
            </div>
            <p className="text-gray-700 text-base leading-relaxed">
                {"Check out what's popular right now based on upvotes and downloads.These layouts and tools are trusted and used by the community."}
            </p>
        </div>
    );
};

export default TrendingTab;
