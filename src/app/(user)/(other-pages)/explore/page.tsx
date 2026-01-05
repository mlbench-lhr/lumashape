"use client";
import React, { useState } from "react";
import TrendingTab from "./TrendingTab";
import PublishedToolsTab from "./PublishedToolsTab";
import PublishedLayoutsTab from "./PublishedLayoutsTab";

type RelatedToolFilter = {
  toolId: string;
  toolBrand: string;
  toolType: string;
  SKUorPartNumber: string;
};

const Explore = () => {
  const [activeTab, setActiveTab] = useState("trending");
  const [relatedTool, setRelatedTool] = useState<RelatedToolFilter | undefined>(undefined);

  const renderTabContent = () => {
    switch (activeTab) {
      case "trending":
        return (
          <TrendingTab
            onExploreRelatedLayouts={(tool) => {
              setRelatedTool(tool);
              setActiveTab("publishedlayouts");
            }}
          />
        );
      case "publishedtools":
        return (
          <PublishedToolsTab
            onExploreRelatedLayouts={(tool) => {
              setRelatedTool(tool);
              setActiveTab("publishedlayouts");
            }}
          />
        );
      case "publishedlayouts":
        return (
          <PublishedLayoutsTab
            relatedTool={relatedTool}
            onClearRelatedTool={() => setRelatedTool(undefined)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full py-6 bg-gray-50">
      {/* Tabs */}
      <div className="flex justify-between sm:justify-start sm:space-x-6 overflow-x-auto no-scrollbar">
        {["Trending", "Published Tools", "Published Layouts"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setRelatedTool(undefined);
              setActiveTab(tab.toLowerCase().replace(/\s/g, ""));
            }}
            className={`flex-shrink-0 px-2 sm:px-3 pb-1 
              font-medium transition-colors 
              text-sm sm:text-base md:text-lg lg:text-xl 
              ${
                activeTab === tab.toLowerCase().replace(/\s/g, "")
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 hover:text-gray-800"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6 sm:mt-8">{renderTabContent()}</div>
    </div>
  );
};

export default Explore;
