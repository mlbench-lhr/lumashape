"use client";
import React, { useState } from "react";
import TrendingTab from "./TrendingTab";
import PublishedToolsTab from "./PublishedToolsTab";
import PublishedLayoutsTab from "./PublishedLayoutsTab";

const Explore = () => {
  const [activeTab, setActiveTab] = useState("trending");

  const renderTabContent = () => {
    switch (activeTab) {
      case "trending":
        return <TrendingTab />;
      case "publishedtools":
        return <PublishedToolsTab />;
      case "publishedlayouts":
        return <PublishedLayoutsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full py-8 bg-gray">
      {/* Tabs */}
      <div className="flex space-x-8">
        {["Trending", "Published Tools", "Published Layouts"].map((tab) => (
          <button
            key={tab}
            onClick={() =>
              setActiveTab(tab.toLowerCase().replace(/\s/g, ""))
            }
            className={`pb-1 text-lg font-medium transition-colors ${
              activeTab === tab.toLowerCase().replace(/\s/g, "")
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-8">{renderTabContent()}</div>
    </div>
  );
};

export default Explore;
