"use client";

import React, { useEffect, useState } from "react";
import { Search, Plus, MoreVertical } from "lucide-react";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Text from "@/components/ui/Text";
import { Listbox } from "@headlessui/react";
import InputField from "@/components/ui/InputField";

type Brand = {
  id: number;
  brand_logo: string;
};

type Tool = {
  _id: string;
  userEmail: string;
  paperType: string;
  brand: string;
  toolType: string;
  description?: string;
  purchaseLink?: string;
  backgroundImg?: string;
  outlinesImg?: string;
  annotatedImg?: string;
  maskImg?: string;
  processingData?: string;
  published?: boolean; // Add published field
};

const BRANDS_DESKTOP: Brand[] = [
  { id: 0, brand_logo: "Custom" },
  { id: 1, brand_logo: "/images/icons/milwaukee.svg" },
  { id: 2, brand_logo: "/images/icons/bosch.svg" },
  { id: 3, brand_logo: "/images/icons/makita.svg" },
];

const BRANDS_MOBILE: Brand[] = [
  { id: 0, brand_logo: "Custom" },
  { id: 1, brand_logo: "/images/icons/milwaukee_mobile.svg" },
  { id: 2, brand_logo: "/images/icons/bosch_mobile.svg" },
  { id: 3, brand_logo: "/images/icons/makita_mobile.svg" },
];

const MobileToolsInventory = () => {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Function to check if the device is mobile or desktop
  const checkDeviceType = () => {
    const width = window.innerWidth;
    setIsMobile(width <= 768);
  };

  useEffect(() => {
    const handleResize = () => {
      checkDeviceType();
    };

    checkDeviceType();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchTools = async () => {
      const token = localStorage.getItem("auth-token");
      if (!token) return;

      const res = await fetch("/api/user/tool/getAllTools", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch tools");

      const data = await res.json();
      return data.tools;
    };

    const initialize = async () => {
      try {
        const tools = await fetchTools();
        setTools(tools);
      } catch (error) {
        console.error("Error fetching tools:", error);
      }
    };

    initialize();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown]')) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle dropdown
  const toggleDropdown = (toolId: string) => {
    setOpenDropdown(prev => prev === toolId ? null : toolId);
  };

  // Publish tool API
  const publishTool = async (toolId: string) => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        console.error("No auth token found");
        return;
      }

      const res = await fetch("/api/user/tool/publishTool", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toolId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to publish tool");
      }

      const data = await res.json();
      
      // Update the tool in local state
      setTools(prev => prev.map(tool => 
        tool._id === toolId 
          ? { ...tool, published: true }
          : tool
      ));

      console.log("Tool published successfully:", data);
      
      // Optionally show a success message to the user
      // You could add a toast notification here
      
    } catch (error) {
      console.error("Error publishing tool:", error);
      // Optionally show an error message to the user
    }
  };

  // Delete tool API
  const deleteTool = async (toolId: string) => {
    try {
      // Close dropdown immediately
      setOpenDropdown(null);

      const token = localStorage.getItem("auth-token");
      if (!token) return;

      const res = await fetch(`/api/user/tool/deleteTools?toolId=${toolId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete tool");

      // Update tools state
      setTools(prev => prev.filter(tool => tool._id !== toolId));

    } catch (error) {
      console.error("Error deleting tool:", error);
    }
  };

  const handleMenuClick = async (action: string, tool: Tool) => {
    // Always close dropdown first
    setOpenDropdown(null);

    if (action === "Edit") {
      router.push(`/tools-inventory/edit/${tool._id}`);
    } else if (action === "Publish to profile") {
      await publishTool(tool._id);
    } else if (action === "Delete") {
      if (window.confirm("Are you sure you want to delete this tool?")) {
        deleteTool(tool._id);
      }
    }
  };

  // Filtered Tools
  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.toolType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.paperType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBrand =
      !selectedBrand ||
      selectedBrand.brand_logo === "Custom" ||
      tool.brand
        .toLowerCase()
        .includes(
          selectedBrand.brand_logo
            .replace("_mobile", "")
            .split("/")
            .pop()
            ?.split(".")[0]
            ?.toLowerCase() || ""
        );

    return matchesSearch && matchesBrand;
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <div className="px-0 md:px-4 py-6 flex-1">
        <div className="mx-auto w-full max-w-[343px] sm:max-w-[1250px]">
          {/* Header */}
          <div className="flex items-center justify-between w-full h-full sm:h-[64px]">
            <h1 className="text-2xl font-bold text-gray-900">Tool Inventory</h1>
            <div className="flex sm:flex hidden">
              <Button
                onClick={() => router.push("/tools-inventory/upload-new-tool/upload-new-tool-page1")}
                variant="primary"
                size="lg"
              >
                <Image
                  src="/images/icons/mdi_add.svg"
                  width={24}
                  height={24}
                  alt="add"
                />
                Upload New Tool
              </Button>
              <div className="flex text-[#bababa] rounded-[14px] border justify-center px-2 mx-2">
                <Image
                  src="/images/icons/bell.svg"
                  width={36}
                  height={36}
                  alt="notifications"
                />
              </div>
            </div>
            <div className="relative w-[30px] h-[30px] rounded-[10px] border-[#c7c7c7] border flex items-center justify-center sm:hidden">
              <Image src="/images/icons/bell.svg" fill alt="notifications" />
            </div>
          </div>

          {/* Search & Sort */}
          <div className="flex flex-row sm:items-center sm:justify-between w-full gap-3 sm:gap-6 mt-4">
            {/* Search Box */}
            <div className="relative w-full w-[193px] sm:w-[382px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <InputField
                label=""
                name="Search Files"
                placeholder="Search Files"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="w-full h-[35px] sm:h-[50px] pl-10 rounded-[10px] text-[12px] sm:text-[18px] font-medium"
              />
            </div>

            {/* Sort By (Brand Filter) */}
            <div className="flex items-center gap-[6px] sm:gap-[18px] w-full sm:w-[288px] sm:h-[50px]">
              <Text
                as="p1"
                className="font-medium text-[12px] sm:text-[22px] w-[78px] h-[26px] whitespace-nowrap"
              >
                Sort by:
              </Text>
              <Listbox value={selectedBrand} onChange={setSelectedBrand}>
                <div className="relative w-full">
                  {/* Selected Option (Button) */}
                  <Listbox.Button className="relative w-full h-[45px] px-3 border rounded-lg border-[#e6e6e6] text-left focus:outline-none">
                    <span className="flex items-center gap-2">
                      {selectedBrand ? (
                        selectedBrand.brand_logo.endsWith(".svg") ? (
                          <Image
                            src={selectedBrand.brand_logo}
                            width={32}
                            height={32}
                            alt="Selected brand"
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-[14px] sm:text-[16px] font-medium">
                            {selectedBrand.brand_logo}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 text-[12px] sm:text-[16px]">
                          All Brands
                        </span>
                      )}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                      <Image
                        src="/images/icons/arrow_down.svg"
                        width={20}
                        height={20}
                        alt="chevron down"
                      />
                    </span>
                  </Listbox.Button>

                  {/* Dropdown Options */}
                  <Listbox.Options className="absolute left-[-50px] mt-4 max-h-60 sm:w-[245px] z-10 overflow-auto rounded-[10px] bg-white p-2 text-base shadow-lg focus:outline-none sm:text-sm">
                    {(!isMobile ? BRANDS_DESKTOP : BRANDS_MOBILE).map((brand: Brand) => (
                      <Listbox.Option
                        key={brand.id}
                        value={brand}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-3 pr-9 ${active ? "text-blue-900" : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <div className="flex items-center gap-3">
                            {/* Custom Radio Button */}
                            <div className="relative">
                              <div
                                className={`
                      w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] 
                      rounded-full border-2 transition-colors duration-200
                      ${selected
                                    ? "border-blue-600 bg-white"
                                    : "border-blue-400 bg-white hover:border-blue-500"
                                  }
                    `}
                              >
                                {selected && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] rounded-full bg-blue-500"></div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Brand Logo or Text */}
                            {brand.brand_logo.endsWith(".svg") ? (
                              <div className="relative w-[70px] h-[32px] flex items-center justify-start">
                                <Image
                                  src={brand.brand_logo}
                                  fill
                                  style={{ objectFit: "contain", objectPosition: "left" }}
                                  alt="Brand logo"
                                />
                              </div>
                            ) : (
                              <span className="text-[14px] sm:text-[16px] font-medium">
                                {brand.brand_logo}
                              </span>
                            )}
                          </div>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>

          </div>
        </div>

        {/* Tools Display */}
        <div className={`flex items-center ${filteredTools.length === 0 ? 'justify-center min-h-[500px]' : 'justify-center sm:justify-start'}`}>
          <div className="flex flex-col items-center justify-center py-12">
            {filteredTools.length === 0 && (
              <>
                <div className="flex flex-col justify-center items-center w-[204px] h-[204px] sm:w-[261px] sm:h-[261px] bg-[#e8e8e8] rounded-[150px] border-[#e8e8e8]">
                  <div className="relative w-[90px] h-[90px] sm:w-[140px] sm:h-[140px]">
                    <Image src="/images/icons/wrench.svg" fill style={{ objectFit: "contain" }} alt="wrench" />
                  </div>
                </div>
                <p className="text-gray-500 font-medium text-center mt-[19px]">
                  Tool Inventory is empty
                </p>
              </>
            )}

            {filteredTools.length > 0 && (
              <div className="w-full max-w-[343px] sm:max-w-[1200px] mx-auto px-4 sm:px-0">
                <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  {filteredTools.map((tool) => (
                    <div
                      key={tool._id}
                      className="flex flex-col justify-center items-center bg-white border border-[#E6E6E6] overflow-hidden w-[300px] h-[248px] sm:w-[266px] sm:h-[248px] relative"
                    >
                      {/* Published Badge */}
                      {tool.published && (
                        <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs font-medium z-10">
                          Published
                        </div>
                      )}
          
                      <div className="relative inline-block" data-dropdown>
                        <div className="w-[258px] sm:w-[242px]">
                          <div className="relative w-full h-[150px]">
                            {tool.annotatedImg ? (
                              <Image
                                src={tool.annotatedImg}
                                alt={`${tool.toolType} outlines`}
                                fill
                                style={{ objectFit: "contain", backgroundColor: "#f9f9f9" }}
                              />
                            ) : tool.backgroundImg ? (
                              <Image
                                src={tool.backgroundImg}
                                alt={tool.toolType}
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div className="relative w-[80px] h-[80px]">
                                <Image
                                  src="/images/icons/wrench.svg"
                                  fill
                                  style={{ objectFit: "contain" }}
                                  alt="tool"
                                />
                              </div>
                            )}

                            {/* Three dots button */}
                            <button
                              className="absolute top-0 right-0 w-6 h-6 bg-white border border-[#E6E6E6] flex items-center justify-center hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(tool._id);
                              }}
                            >
                              <MoreVertical className="w-4 h-4 text-[#266ca8] cursor-pointer" />
                            </button>

                            {/* Dropdown menu */}
                            {openDropdown === tool._id && (
                              <div className="absolute top-6 sm:top-5 right-0 sm:right-2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[118px] h-[76px] sm:min-w-[171px] sm:h-[111px] overflow-hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuClick("Edit", tool);
                                  }}
                                  className="w-full px-1 py-1 sm:px-3 sm:py-2 text-left flex items-center gap-[5px] hover:bg-gray-50"
                                >
                                  <Image src="/images/icons/edit.svg" width={16} height={16} alt="edit" />
                                  <span className="text-[#266ca8] text-[10px] sm:text-[14px] font-medium">Edit</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuClick("Publish to profile", tool);
                                  }}
                                  disabled={tool.published}
                                  className={`w-full px-1 py-1 sm:px-3 sm:py-2 text-left flex items-center gap-[5px] hover:bg-gray-50 ${
                                    tool.published ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <Image src="/images/icons/share.svg" width={16} height={16} alt="share" />
                                  <span className={`text-[10px] sm:text-[14px] font-medium ${
                                    tool.published ? 'text-gray-400' : 'text-[#808080]'
                                  }`}>
                                    {tool.published ? 'Already Published' : 'Publish to profile'}
                                  </span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuClick("Delete", tool);
                                  }}
                                  className="w-full px-1 py-1 sm:px-3 text-left flex items-center gap-[5px] hover:bg-gray-50"
                                >
                                  <Image src="/images/icons/delete.svg" width={16} height={16} alt="delete" />
                                  <span className="text-[#ed2929] text-[10px] sm:text-[14px] font-medium">Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tool details */}
                        <div className="w-full h-[70px] flex flex-col justify-center">
                          <div className="flex items-baseline gap-[3px]">
                            <h3 className="font-bold text-[16px]">{tool.toolType}</h3>
                            <span className="text-[14px] font-medium">({tool.brand})</span>
                          </div>
                          <p className="text-[12px] text-[#b3b3b3] font-medium">{tool.paperType}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <button
          className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg transition-colors"
          onClick={() => router.push("/tools-inventory/upload-new-tool/upload-new-tool-page1")}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default MobileToolsInventory;